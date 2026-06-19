# -*- coding: utf-8 -*-
"""
ingest.py — dataset → canonical 语料 (pipeline/output/corpus/poems.jsonl)
=========================================================================
职责（全部确定性）：
  1. 源固定 + 防呆断言（唐繁/宋简，防数据集变动）
  2. 繁→简归一（作者名 + 正文）；保留原文供展示
  3. 体裁分类
  4. 定年阶梯（唐：诗人表→bio年号→未定年；宋词：词人表→bio生年→未定年）
  5. 稳定 id + 去重 + 空正文过滤
  6. 名气标记（三百首名篇、名家、两大断裂策展名篇）
  7. 统计打印

仅依赖标准库 + config + normalize。
"""

import glob
import hashlib
import json
import re
import sys
from collections import Counter, defaultdict

sys.path.insert(0, str(__import__("pathlib").Path(__file__).resolve().parents[1]))
from pipeline import config as C
from pipeline import normalize as N


# ── 作者元数据 ───────────────────────────────────────
def load_author_bios():
    tang = {}
    for a in json.load(open(C.TANG_AUTHORS, encoding="utf-8")):
        tang[a.get("name", "")] = a.get("desc", "") or ""
    song = {}
    for a in json.load(open(C.SONG_AUTHORS, encoding="utf-8")):
        song[a.get("name", "")] = a.get("description", "") or ""
    return tang, song


# ── 定年 ─────────────────────────────────────────────
def infer_tang_period(author_simp, bio_simp):
    """唐：诗人表(high) → bio年号/世代词(medium) → 未定年(low)。"""
    if author_simp in C.POET_PERIOD:
        return C.POET_PERIOD[author_simp], "诗人表", "high"
    if bio_simp:
        hits = Counter()
        for reign, period in C.REIGN_PERIOD.items():
            if reign in bio_simp:
                hits[period] += bio_simp.count(reign)
        for word, period in C.GEN_WORDS.items():
            if word in bio_simp:
                hits[period] += bio_simp.count(word)
        if hits:
            return hits.most_common(1)[0][0], "bio年号", "medium"
    return C.UNKNOWN_PERIOD, "未知", "low"


_BIRTH_RE = re.compile(r'[\(（]\s*约?\s*(\d{3,4})\s*[-—~―至]')
_BIRTH_RE2 = re.compile(r'[\(（]\s*约?\s*(\d{3,4})')


def _parse_birth(bio):
    for rgx in (_BIRTH_RE, _BIRTH_RE2):
        m = rgx.search(bio or "")
        if m:
            y = int(m.group(1))
            if 800 < y < 1300:
                return y
    return None


def infer_song_period(author_simp, bio_simp):
    """宋词：词人表(high) → bio生年阈值(medium) → 未定年(low)。"""
    if author_simp in C.SONG_POET_PERIOD:
        return C.SONG_POET_PERIOD[author_simp], "宋词人表", "high"
    birth = _parse_birth(bio_simp)
    if birth is not None:
        period = "北宋" if birth < C.SONG_BIRTH_THRESHOLD else "南宋"
        return period, "bio生年", "medium"
    return C.UNKNOWN_PERIOD, "未知", "low"


# ── 名气：三百首选集 + 策展名篇 ──────────────────────
def load_anthology_keys():
    """返回 (tang_ids:set, song_keys:set[(author,词牌,text)])。"""
    tang_ids, song_keys = set(), set()
    t3 = json.load(open(C.ANTHOLOGY_FILES["唐诗三百首"], encoding="utf-8"))
    for x in t3:
        if isinstance(x, dict) and x.get("id"):
            tang_ids.add(x["id"])
    s3 = json.load(open(C.ANTHOLOGY_FILES["宋词三百首"], encoding="utf-8"))
    for x in s3:
        if isinstance(x, dict):
            author = N.to_simplified(x.get("author", ""))
            pai = N.to_simplified(x.get("rhythmic", ""))
            text = N.to_simplified(N.join_paragraphs(x.get("paragraphs", [])))
            song_keys.add((author, pai, text))
    return tang_ids, song_keys


def curated_tags_for(author_simp, haystack):
    """haystack = 题目+词牌+正文（简体）。返回命中的断裂标签列表。"""
    tags = []
    for tag, by_author in C.RUPTURE_CURATED.items():
        kws = by_author.get(author_simp)
        if kws and any(kw in haystack for kw in kws):
            tags.append(tag)
    return tags


# ── 防呆断言 ─────────────────────────────────────────
def assert_script(files, expect, label, sample_files=2):
    """抽样断言字形：expect='trad'(繁>简) 或 'simp'(简>繁)。"""
    trad = simp = 0
    simp_markers = set("时来见处风云归声远开尽国学书东车马鸟鱼龙凤华万这还")
    for fp in files[:sample_files]:
        for it in json.load(open(fp, encoding="utf-8")):
            body = "".join(it.get("paragraphs", []))
            trad += N.count_traditional(body)
            simp += sum(1 for ch in body if ch in simp_markers)
    ok = (trad > simp) if expect == "trad" else (simp > trad)
    if not ok:
        raise RuntimeError(
            f"[防呆失败] {label} 期望字形 {expect}，实测 繁={trad} 简={simp}。"
            f"数据源可能变动，请检查 {files[:1]}"
        )
    print(f"  [断言OK] {label}: 繁={trad} 简={simp} ({expect})")


# ── 处理 ─────────────────────────────────────────────
def process(files, dynasty, genre_type, is_ci, bios, anthology, curated_dynasty_ok):
    tang_ids, song_keys = anthology
    poems, seen = [], set()
    empty = dup = 0
    counter = 0

    for fp in files:
        fname = fp.replace("\\", "/").split("/")[-1]
        for it in json.load(open(fp, encoding="utf-8")):
            paragraphs = it.get("paragraphs", [])
            text_raw = N.join_paragraphs(paragraphs)
            if not text_raw:
                empty += 1
                continue

            author_raw = it.get("author", "佚名") or "佚名"
            author = N.to_simplified(author_raw)
            rhythmic = N.to_simplified(it.get("rhythmic", "")) if is_ci else ""
            raw_title = N.to_simplified(it.get("title", "")) if it.get("title") else ""
            title = raw_title or (rhythmic if rhythmic else "无题")
            text = N.to_simplified(text_raw)

            key = (dynasty, title, author, text)
            if key in seen:
                dup += 1
                continue
            seen.add(key)

            # 体裁
            form = C.classify_song_form(rhythmic) if is_ci else C.classify_tang_form(title, [N.to_simplified(p) for p in paragraphs])

            # 定年
            bio_raw = bios.get(author_raw, "") or bios.get(author, "")
            if is_ci:
                period, psource, pconf = infer_song_period(author, bio_raw)
                in_anth = (author, rhythmic, text) in song_keys
            else:
                period, psource, pconf = infer_tang_period(author, N.to_simplified(bio_raw))
                in_anth = bool(it.get("id")) and it["id"] in tang_ids
            datable = period != C.UNKNOWN_PERIOD

            # id
            if is_ci or not it.get("id"):
                h = hashlib.sha1(f"{author}|{rhythmic}|{text_raw}".encode("utf-8")).hexdigest()[:12]
                pid = f"ci_{h}" if is_ci else f"tang_{h}"
            else:
                pid = it["id"]

            # 名气 / 策展
            is_rep = in_anth or author in (C.SONG_POET_PERIOD if is_ci else C.POET_PERIOD)
            tags = curated_tags_for(author, f"{title} {rhythmic} {text}")

            rec = {
                "id": pid,
                "dynasty": dynasty,
                "genre_type": genre_type,
                "author": author,
                "title": title,
                "ci_pai": rhythmic or None,
                "period": period,
                "period_source": psource,
                "period_confidence": pconf,
                "datable": datable,
                "text_raw": text_raw,
                "text": text,
                "lines": len(paragraphs),
                "char_count": N.char_count(text),
                "form": form,
                "in_anthology": in_anth,
                "is_representative": is_rep,
                "curated_tags": tags,
                "source_file": fname,
            }
            poems.append(rec)
            counter += 1

    print(f"  {dynasty}{genre_type}: 保留 {counter} (空正文 {empty}, 重复 {dup})")
    return poems


def process_wudai_ci(files, anthology):
    """处理五代词（花间集 + 南唐二主词），强制归入五代。"""
    _, song_keys = anthology
    poems, seen = [], set()
    empty = dup = skipped = 0

    for fp in files:
        fname = fp.replace("\\", "/").split("/")[-1]
        data = json.load(open(fp, encoding="utf-8"))
        if not isinstance(data, list):
            continue
        for it in data:
            paragraphs = it.get("paragraphs", [])
            text_raw = N.join_paragraphs(paragraphs)
            if not text_raw:
                empty += 1
                continue

            author_raw = (it.get("author", "") or "佚名").strip()
            author = C.WUDAI_AUTHOR_NORM.get(author_raw, author_raw)
            if author in C.WUDAI_SKIP_AUTHORS:
                skipped += 1
                continue

            rhythmic = N.to_simplified(it.get("rhythmic", "") or "")
            raw_title = N.to_simplified(it.get("title", "") or "")
            title = raw_title or rhythmic or "无题"
            text = N.to_simplified(text_raw)

            key = ("唐", title, author, text)
            if key in seen:
                dup += 1
                continue
            seen.add(key)

            form = C.classify_song_form(rhythmic)
            h = hashlib.sha1(f"{author}|{rhythmic}|{text_raw}".encode("utf-8")).hexdigest()[:12]
            pid = f"wudai_{h}"
            tags = curated_tags_for(author, f"{title} {rhythmic} {text}")

            haystack = f"{title} {rhythmic} {text}"
            kws = C.WUDAI_ANTHOLOGY_KEYS.get(author, [])
            in_anth = any(kw in haystack for kw in kws)

            poems.append({
                "id": pid,
                "dynasty": "唐",
                "genre_type": "词",
                "author": author,
                "title": title,
                "ci_pai": rhythmic or None,
                "period": "五代",
                "period_source": "五代词集",
                "period_confidence": "high",
                "datable": True,
                "text_raw": text_raw,
                "text": text,
                "lines": len(paragraphs),
                "char_count": N.char_count(text),
                "form": form,
                "in_anthology": in_anth,
                "is_representative": True,   # 花间集/南唐均为精选集
                "curated_tags": tags,
                "source_file": fname,
            })

    print(f"  五代词: 保留 {len(poems)} (空正文 {empty}, 重复 {dup}, 跳过编者 {skipped})")
    return poems


def main():
    print("=" * 60)
    print("ingest: dataset → poems.jsonl")
    print("=" * 60)

    tang_files = sorted(glob.glob(C.TANG_GLOB))
    ci_files = sorted(glob.glob(C.CI_GLOB))
    wudai_files = sorted(glob.glob(C.WUDAI_HUAJIANJI_GLOB)) + [C.WUDAI_NANTANG_FILE]
    print(f"\n[源] 唐诗 {len(tang_files)} 文件 | 宋词 {len(ci_files)} 文件 | 五代词 {len(wudai_files)} 文件 | 归一模式={N.converter_mode()}")
    assert_script(tang_files, "trad", "唐诗 poet.tang")
    assert_script(ci_files, "simp", "宋词 ci.song")

    print("\n[作者元数据]")
    tang_bio, song_bio = load_author_bios()
    print(f"  唐 {len(tang_bio)} 人 | 宋 {len(song_bio)} 人")

    print("\n[选集]")
    anthology = load_anthology_keys()
    print(f"  唐诗三百首 ids={len(anthology[0])} | 宋词三百首 keys={len(anthology[1])}")

    print("\n[处理]")
    tang = process(tang_files, "唐", "诗", False, tang_bio, anthology, True)
    song = process(ci_files, "宋", "词", True, song_bio, anthology, True)
    wudai = process_wudai_ci(wudai_files, anthology)
    allp = tang + song + wudai

    # ── 输出 ──
    C.CORPUS.parent.mkdir(parents=True, exist_ok=True)
    with open(C.CORPUS, "w", encoding="utf-8") as f:
        for rec in allp:
            f.write(json.dumps(rec, ensure_ascii=False) + "\n")

    # ── 统计 ──
    print("\n" + "=" * 60)
    print(f"总计 {len(allp)} (唐诗 {len(tang)} + 宋词 {len(song)} + 五代词 {len(wudai)}) -> {C.CORPUS}")
    period_c = Counter(p["period"] for p in allp)
    print("\n【时期分布】")
    for per in C.PERIODS + [C.UNKNOWN_PERIOD]:
        print(f"  {per}: {period_c.get(per, 0)}")
    datable = sum(p["datable"] for p in allp)
    print(f"\ndatable(可入时间轴): {datable}/{len(allp)} ({datable*100//len(allp)}%)")
    tang_datable = sum(p["datable"] for p in tang)
    print(f"  其中唐诗 datable: {tang_datable}/{len(tang)} ({tang_datable*100//max(len(tang),1)}%)")
    print("\n【定年来源】", dict(Counter(p["period_source"] for p in allp)))
    print("【名气】 in_anthology=%d | representative=%d" % (
        sum(p["in_anthology"] for p in allp), sum(p["is_representative"] for p in allp)))
    print("【策展断裂名篇】", dict(Counter(
        t for p in allp for t in p["curated_tags"])))
    resid = sum(N.count_traditional(p["text"]) for p in allp[:5000])
    print(f"【繁体残留】 前5000条简体text累计繁体特征字 = {resid} (应≈0)")
    print("=" * 60)


if __name__ == "__main__":
    main()
