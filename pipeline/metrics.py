# -*- coding: utf-8 -*-
"""
metrics.py — canonical 语料 → dashboard/data/*.json
====================================================
全部确定性，基于简体 `text`。有序时期为 X 轴。
--scope full|representative|anthology（默认 representative）。

输出（严格 JSON，allow_nan=False，externality 私=0 用 null）：
  meta.json / sentiment_by_period.json / imagery_flow.json /
  genre_by_period.json / word_freq_comparison.json / place_geo.json /
  stars.json / rupture_755.json / rupture_1127.json

"流" = 按时期聚合（仅 datable）；"繁星" = 选集名篇逐首。
"""

import argparse
import json
import sys
from collections import Counter, defaultdict
from datetime import datetime

sys.path.insert(0, str(__import__("pathlib").Path(__file__).resolve().parents[1]))
from pipeline import config as C
from pipeline import normalize as N

IMAGERY_ALL = sorted(C.MACRO_IMAGERY | C.PRIVATE_IMAGERY, key=len, reverse=True)

# LLM 极性 → 数值（与 enrich_llm.py 保持一致）
POLARITY_SCORE = {"积极": 1.0, "中性": 0.0, "消极": -1.0}


def load_enriched():
    """读取 LLM 富化结果；文件不存在时返回空 dict，不报错。"""
    if not C.ENRICH_OUTPUT.exists():
        return {}
    result = {}
    for line in open(C.ENRICH_OUTPUT, encoding="utf-8"):
        d = json.loads(line)
        if d.get("id"):
            result[d["id"]] = d
    print(f"  [enrich] 加载 LLM 富化 {len(result)} 条")
    return result


def load_corpus():
    rows = []
    with open(C.CORPUS, encoding="utf-8") as f:
        for line in f:
            line = line.strip()
            if line:
                rows.append(json.loads(line))
    return rows


def in_scope(p, scope):
    if scope == "full":
        return True
    if scope == "representative":
        return p["is_representative"]
    if scope == "anthology":
        return p["in_anthology"]
    return True


def write(path, data):
    path.parent.mkdir(parents=True, exist_ok=True)
    with open(path, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2, allow_nan=False)
    print(f"  OK {path.name}")


# ── 指标基元 ─────────────────────────────────────────
def sentiment(text):
    pos = sum(1 for w in C.POSITIVE_WORDS if w in text)
    neg = sum(1 for w in C.NEGATIVE_WORDS if w in text)
    if pos + neg == 0:
        return 0.0
    return (pos - neg) / (pos + neg)


def count_set(text, vocab):
    return sum(text.count(w) for w in vocab)


def top_imagery_in(text, k=5):
    found = [(w, text.count(w)) for w in IMAGERY_ALL if w in text]
    found.sort(key=lambda x: (-x[1], -len(x[0])))
    return [w for w, _ in found[:k]]


def period_order(rows):
    present = {p["period"] for p in rows if p["datable"]}
    return [p for p in C.PERIODS if p in present]


# ── 流：按时期聚合 ───────────────────────────────────
def sentiment_by_period(rows, enriched):
    agg = defaultdict(lambda: {
        "scores": [], "tang": [], "song": [],
        "llm": [], "llm_count": 0,
    })
    for p in rows:
        if not p["datable"]:
            continue
        s = sentiment(p["text"])
        key = p["period"]
        agg[key]["scores"].append(s)
        agg[key]["tang" if p["dynasty"] == "唐" else "song"].append(s)
        # LLM 轨道
        e = enriched.get(p["id"])
        if e and e.get("极性") in POLARITY_SCORE:
            agg[key]["llm"].append(POLARITY_SCORE[e["极性"]])
            agg[key]["llm_count"] += 1

    def mean(xs):
        return round(sum(xs) / len(xs), 4) if xs else None

    series = []
    for per in C.PERIODS:
        if per not in agg:
            continue
        e = agg[per]
        row = {
            "period":          per,
            "sentiment_score": mean(e["scores"]),
            "poem_count":      len(e["scores"]),
            "tang_score":      mean(e["tang"]),
            "song_score":      mean(e["song"]),
            # LLM 轨道（覆盖不足 3 首则为 null）
            "llm_sentiment_score": mean(e["llm"]) if e["llm_count"] >= 3 else None,
            "llm_coverage":    e["llm_count"],
        }
        series.append(row)
    has_llm = any(r["llm_sentiment_score"] is not None for r in series)
    return {
        "by_period":   series,
        "method":      "lexicon-based + llm（双轨）" if has_llm else "lexicon-based",
        "description": "sentiment_score=词典法全量；llm_sentiment_score=LLM精标（1积极/0中性/-1消极）均值，仅覆盖名篇",
    }


def imagery_flow(rows):
    agg = defaultdict(lambda: {"macro": 0, "private": 0, "chars": 0, "n": 0})
    all_macro, all_private = Counter(), Counter()
    for p in rows:
        t = p["text"]
        for w in C.MACRO_IMAGERY:
            c = t.count(w)
            if c:
                all_macro[w] += c
        for w in C.PRIVATE_IMAGERY:
            c = t.count(w)
            if c:
                all_private[w] += c
        if not p["datable"]:
            continue
        e = agg[p["period"]]
        e["macro"] += count_set(t, C.MACRO_IMAGERY)
        e["private"] += count_set(t, C.PRIVATE_IMAGERY)
        e["chars"] += p["char_count"]
        e["n"] += 1

    timeline = []
    for per in C.PERIODS:
        if per not in agg:
            continue
        e = agg[per]
        chars = e["chars"] or 1
        ext = round(e["macro"] / e["private"], 3) if e["private"] else None
        timeline.append({
            "period": per,
            "macro_per_1k": round(e["macro"] / chars * 1000, 2),
            "private_per_1k": round(e["private"] / chars * 1000, 2),
            "externality_index": ext, "poem_count": e["n"],
        })
    return {"timeline": timeline,
            "top_macro_imagery": dict(all_macro.most_common(30)),
            "top_private_imagery": dict(all_private.most_common(30)),
            "macro_set": sorted(C.MACRO_IMAGERY), "private_set": sorted(C.PRIVATE_IMAGERY),
            "description": "宏大 vs 私人意象；externality=宏/私"}


def genre_by_period(rows):
    agg = defaultdict(Counter)
    for p in rows:
        if not p["datable"]:
            continue
        agg[p["period"]][C.simplify_form(p["form"])] += 1
    out = {}
    for per in C.PERIODS:
        if per not in agg:
            continue
        total = sum(agg[per].values())
        out[per] = {"total": total,
                    "forms": {k: round(v / total * 100, 1) for k, v in agg[per].most_common()}}
    return {"by_period": out, "description": "体裁百分比（仅 datable）"}


def word_freq(rows):
    tang, song = Counter(), Counter()
    tt = st = 0
    for p in rows:
        toks = N.tokens(p["text"])
        if p["dynasty"] == "唐":
            tang.update(toks); tt += len(toks)
        else:
            song.update(toks); st += len(toks)
    tt = tt or 1; st = st or 1
    tfreq = {w: round(c / tt * 1000, 2) for w, c in tang.most_common(500)}
    sfreq = {w: round(c / st * 1000, 2) for w, c in song.most_common(500)}
    t_uniq = {w: tfreq[w] for w in tfreq if tfreq[w] > 3 * sfreq.get(w, 0.01)}
    s_uniq = {w: sfreq[w] for w in sfreq if sfreq[w] > 3 * tfreq.get(w, 0.01)}
    common = {w: [tfreq.get(w, 0), sfreq.get(w, 0)] for w in set(tfreq) & set(sfreq)
              if 0.5 < tfreq.get(w, 0) / max(sfreq.get(w, 0.01), 0.01) < 2}
    return {"tang_top200": dict(tang.most_common(200)), "song_top200": dict(song.most_common(200)),
            "tang_per_1k": dict(list(tfreq.items())[:200]), "song_per_1k": dict(list(sfreq.items())[:200]),
            "tang_unique_high": dict(list(t_uniq.items())[:50]), "song_unique_high": dict(list(s_uniq.items())[:50]),
            "common_words": dict(list(common.items())[:50]),
            "tang_total_words": tt, "song_total_words": st,
            "description": "唐诗 vs 宋词词频（繁简已统一为简体）"}


def word_freq_by_period(rows):
    STOPWORDS = {
        # 虚词
        "之", "乎", "者", "也", "而", "以", "于", "则", "乃", "其", "为",
        "不", "无", "有", "是", "此", "与", "及", "若", "如", "所",
        # 数字
        "一", "二", "三", "四", "五", "六", "七", "八", "九", "十",
        "百", "千", "万", "两",
        # 方位/时间/弱语义单字
        "上", "下", "中", "里", "外", "前", "后", "来", "去", "时",
        "年", "日", "人", "今", "何", "已", "更", "亦", "自", "犹",
    }
    agg = defaultdict(lambda: {"words": Counter(), "total": 0, "n": 0})
    for p in rows:
        if not p["datable"]:
            continue
        per = p["period"]
        toks = [t for t in N.tokens(p["text"]) if t not in STOPWORDS]
        agg[per]["words"].update(toks)
        agg[per]["total"] += len(toks)
        agg[per]["n"] += 1

    out = {}
    for per in C.PERIODS:
        if per not in agg:
            continue
        e = agg[per]
        total = e["total"] or 1
        out[per] = {
            "top100": [[w, round(c / total * 1000, 2)]
                       for w, c in e["words"].most_common(100)],
            "total_words": e["total"],
            "poem_count": e["n"],
        }
    return {
        "by_period": out,
        "stopwords": sorted(STOPWORDS),
        "description": "各时期词频（简体 per_1k，已过滤停用词，仅 datable；前端按 selectedPeriod 查表驱动词云）",
    }


def _stage_order_from_enriched(value):
    if isinstance(value, int) and 1 <= value <= len(C.TIME_STAGE_BINS):
        return value
    if isinstance(value, str):
        s = value.strip()
        if s.isdigit():
            n = int(s)
            return n if 1 <= n <= len(C.TIME_STAGE_BINS) else None
        return C.PERIOD_ORDER.get(s)
    return None


def _stage_order_for_place_row(p, enriched):
    e = enriched.get(p["id"]) if enriched else None
    if e:
        stage_order = _stage_order_from_enriched(e.get("创作阶段"))
        if stage_order is not None:
            return stage_order
    return C.stage_order_for_record(
        p.get("period"),
        p.get("dynasty"),
        p.get("genre_type"),
        p.get("period_source"),
        p.get("curated_tags"),
    )


def place_geo(rows, enriched=None):
    by_period = defaultdict(Counter)
    by_period_poems = defaultdict(Counter)
    by_stage_order = defaultdict(Counter)
    by_stage_order_poems = defaultdict(Counter)
    by_dynasty = defaultdict(Counter)
    by_dynasty_poems = defaultdict(Counter)
    for p in rows:
        t = p["text"]
        stage_order = _stage_order_for_place_row(p, enriched or {})
        for place in C.PLACE_NAMES:
            n = t.count(place)
            if n:
                if p["datable"]:
                    by_period[p["period"]][place] += n
                    by_period_poems[p["period"]][place] += 1
                by_stage_order[stage_order][place] += n
                by_stage_order_poems[stage_order][place] += 1
                by_dynasty[p["dynasty"]][place] += n
                by_dynasty_poems[p["dynasty"]][place] += 1

    def to_rows(counter, poem_counter):
        out = []
        for place, cnt in counter.most_common():
            lng, lat = C.PLACE_NAMES[place]
            out.append({
                "name": place,
                "lng": lng,
                "lat": lat,
                "count": cnt,
                "poem_count": poem_counter.get(place, 0),
            })
        return out

    return {"by_period": {per: to_rows(by_period[per], by_period_poems[per]) for per in C.PERIODS if per in by_period},
            "by_stage_order": {
                str(stage["order"]): to_rows(
                    by_stage_order[stage["order"]],
                    by_stage_order_poems[stage["order"]],
                )
                for stage in C.HISTORICAL_STAGES
            },
            "stage_meta": C.HISTORICAL_STAGES,
            "by_dynasty": {d: to_rows(by_dynasty[d], by_dynasty_poems[d]) for d in by_dynasty},
            "place_coords": C.PLACE_NAMES,
            "description": "诗歌地名分布（地图散点/热力）；by_stage_order 按 1-12 历史阶段聚合；count=地名总出现次数，poem_count=涉及作品数；注：宋词中北宋首都多以「东京」「故都」等形式出现，未被本词典识别，汴京/汴梁计数为0属语料用词限制"}


def _place_example(p, surface):
    for line in p["text"].split("\n"):
        if surface in line:
            return {
                "id": p["id"],
                "author": p["author"],
                "title": p["title"],
                "period": p["period"],
                "line": line.strip(),
            }
    return {
        "id": p["id"],
        "author": p["author"],
        "title": p["title"],
        "period": p["period"],
        "line": p["text"].split("\n", 1)[0].strip(),
    }


def llm_place_mentions(rows, enriched):
    row_by_id = {p["id"]: p for p in rows}
    resolved = defaultdict(lambda: {"count": 0, "poem_ids": set(), "types": Counter(), "examples": []})
    unresolved = defaultdict(lambda: {"count": 0, "poem_ids": set(), "types": Counter(), "examples": []})

    for pid, e in enriched.items():
        p = row_by_id.get(pid)
        if not p:
            continue
        for m in e.get("地名_llm", []) or []:
            if not isinstance(m, dict):
                continue
            surface = str(m.get("原文") or "").strip()
            name = str(m.get("规范名") or surface).strip()
            place_type = str(m.get("类型") or "其他").strip()
            if not surface or surface not in p["text"]:
                continue
            coord_name = name if name in C.PLACE_NAMES else (surface if surface in C.PLACE_NAMES else None)
            bucket = resolved if coord_name else unresolved
            key = coord_name or name
            rec = bucket[key]
            rec["count"] += p["text"].count(surface)
            rec["poem_ids"].add(pid)
            rec["types"][place_type] += 1
            if len(rec["examples"]) < 5:
                rec["examples"].append(_place_example(p, surface))

    def rows_from(bucket, with_coords):
        out = []
        for name, rec in bucket.items():
            row = {
                "name": name,
                "count": rec["count"],
                "poem_count": len(rec["poem_ids"]),
                "types": dict(rec["types"]),
                "examples": rec["examples"],
            }
            if with_coords:
                row["lng"], row["lat"] = C.PLACE_NAMES[name]
            out.append(row)
        return sorted(out, key=lambda x: (-x["count"], x["name"]))

    resolved_rows = rows_from(resolved, True)
    unresolved_rows = rows_from(unresolved, False)
    return (
        {
            "places": resolved_rows,
            "count": len(resolved_rows),
            "description": "LLM 地名候选中已能匹配 PLACE_NAMES 坐标的地名，可直接地图展示。",
        },
        {
            "places": unresolved_rows,
            "count": len(unresolved_rows),
            "description": "LLM 发现但 PLACE_NAMES 暂无坐标的地名候选，需要人工确认并补坐标后才能上地图。",
        },
    )


# ── 繁星：选集名篇逐首 ───────────────────────────────
def stars(all_rows, enriched):
    items = []
    for p in all_rows:
        if not p["in_anthology"]:
            continue
        first_line = (p["text_raw"].split("\n", 1)[0]).strip()
        rec = {
            "id": p["id"], "title": p["title"], "author": p["author"],
            "dynasty": p["dynasty"], "period": p["period"],
            "in_anthology": True, "curated_tags": p["curated_tags"],
            "sentiment_score": round(sentiment(p["text"]), 4),
            "top_imagery": top_imagery_in(p["text"]),
            "key_line": first_line, "char_count": p["char_count"],
            # LLM 字段（有则填入，无则 null）
            "polarity_llm":  None,
            "types_llm":     None,
            "theme_llm":     None,
            "stage_llm":     None,
        }
        e = enriched.get(p["id"])
        if e:
            rec["polarity_llm"] = e.get("极性")
            rec["types_llm"]    = e.get("类型") or []
            rec["theme_llm"]    = e.get("题材_llm")
            rec["stage_llm"]    = e.get("创作阶段")
        items.append(rec)
    llm_count = sum(1 for r in items if r["polarity_llm"])
    return {"stars": items, "count": len(items), "llm_enriched": llm_count,
            "description": "最具代表性名篇（唐诗三百首+宋词三百首），按时期落位为可点击的星"}


# ── 断裂断面 ─────────────────────────────────────────
def rupture(rows, spec, enriched):
    before, after, tag = spec["before"], spec["after"], spec["tag"]

    def slice_period(per):
        return [p for p in rows if p["datable"] and p["period"] == per]

    def agg(ps):
        if not ps:
            return None
        chars = sum(p["char_count"] for p in ps) or 1
        macro = sum(count_set(p["text"], C.MACRO_IMAGERY) for p in ps)
        priv = sum(count_set(p["text"], C.PRIVATE_IMAGERY) for p in ps)
        sent = sum(sentiment(p["text"]) for p in ps) / len(ps)
        words = Counter()
        for p in ps:
            words.update(N.tokens(p["text"]))
        total = sum(words.values()) or 1
        return {"n": len(ps), "sentiment": round(sent, 4),
                "macro_per_1k": round(macro / chars * 1000, 2),
                "private_per_1k": round(priv / chars * 1000, 2),
                "externality_index": round(macro / priv, 3) if priv else None,
                "_freq": {w: c / total * 1000 for w, c in words.items()}}

    a, b = agg(slice_period(before)), agg(slice_period(after))

    rising, falling = [], []
    if a and b:
        keys = set(a["_freq"]) | set(b["_freq"])
        deltas = sorted(((w, round(b["_freq"].get(w, 0) - a["_freq"].get(w, 0), 2)) for w in keys),
                        key=lambda x: x[1])
        falling = [{"word": w, "delta": d} for w, d in deltas[:15] if d < 0]
        rising = [{"word": w, "delta": d} for w, d in deltas[-15:][::-1] if d > 0]
        for side in (a, b):
            side.pop("_freq", None)

    star_items = []
    for p in rows:
        if tag not in p["curated_tags"]:
            continue
        rec = {
            "id": p["id"], "title": p["title"], "author": p["author"],
            "period": p["period"], "key_line": p["text_raw"].split("\n", 1)[0].strip(),
            "polarity_llm": None, "types_llm": None,
        }
        e = enriched.get(p["id"])
        if e:
            rec["polarity_llm"] = e.get("极性")
            rec["types_llm"]    = e.get("类型") or []
        star_items.append(rec)

    return {"rupture": spec["name"], "year": spec["year"],
            "before_period": before, "after_period": after,
            "before": a, "after": b,
            "sentiment_delta": round(b["sentiment"] - a["sentiment"], 4) if (a and b) else None,
            "rising_words": rising, "falling_words": falling,
            "curated_stars": star_items,
            "description": f"{spec['name']}（{spec['year']}）断面：{before} vs {after}"}


# ── 主流程 ───────────────────────────────────────────
def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--scope", choices=["full", "representative", "anthology"], default="representative")
    ap.add_argument("--timestamp", default="", help="外部注入的时间戳（保证可复现）")
    args = ap.parse_args()

    all_rows = load_corpus()
    rows = [p for p in all_rows if in_scope(p, args.scope)]
    print(f"语料 {len(all_rows)} | scope={args.scope} → {len(rows)} 条")

    enriched = load_enriched()

    out = C.DASHBOARD_DATA
    scope_counts = {s: sum(in_scope(p, s) for p in all_rows)
                    for s in ("full", "representative", "anthology")}
    period_counts = Counter(p["period"] for p in rows if p["datable"])

    write(out / "meta.json", {
        "corpus_total": len(all_rows), "scope": args.scope, "scope_in_use_count": len(rows),
        "scope_counts": scope_counts,
        "period_order": C.PERIODS,
        "period_counts": {per: period_counts.get(per, 0) for per in C.PERIODS},
        "datable_in_scope": sum(p["datable"] for p in rows),
        "events": C.EVENTS, "ruptures": [r["name"] for r in C.RUPTURES],
        "generated_at": args.timestamp or datetime.now().strftime("%Y-%m-%dT%H:%M:%S"),
        "llm_enriched_count": len(enriched),
        "note": "时间轴=有序时期；流=本scope聚合；繁星=选集名篇(见stars.json)",
    })
    write(out / "sentiment_by_period.json", sentiment_by_period(rows, enriched))
    write(out / "imagery_flow.json", imagery_flow(rows))
    write(out / "genre_by_period.json", genre_by_period(rows))
    write(out / "word_freq_comparison.json", word_freq(rows))
    write(out / "place_geo.json", place_geo(rows, enriched))
    resolved_places, unresolved_places = llm_place_mentions(rows, enriched)
    write(out / "place_mentions_resolved.json", resolved_places)
    write(out / "place_mentions_unresolved.json", unresolved_places)
    write(out / "word_freq_by_period.json", word_freq_by_period(rows))
    write(out / "stars.json", stars(all_rows, enriched))
    for spec in C.RUPTURES:
        write(out / f"rupture_{spec['year']}.json", rupture(rows, spec, enriched))

    print("完成。")


if __name__ == "__main__":
    main()
