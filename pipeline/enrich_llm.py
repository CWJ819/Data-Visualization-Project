# -*- coding: utf-8 -*-
"""
enrich_llm.py — LLM 情感富化（已纳入主流程）
=====================================================
对选集名篇 / 断裂策展名篇 做 DeepSeek 二维情感富化，
输出 output/enrich/enriched.jsonl（metrics.py 自动读取）。

pipeline 调用顺序：
  ingest.py → enrich_llm.py → metrics.py → qa.py

若未设置 DEEPSEEK_API_KEY，打印警告后以退出码 0 跳过（不阻断管道）。

用法：
  # 默认：只富化 stars（选集名篇 + 断裂策展，~600首，约 40 次 API 调用）
  python pipeline/enrich_llm.py --resume

  # 扩大到 representative 抽样（sample-size 控制上限）
  python pipeline/enrich_llm.py --scope representative --sample-size 2000 --resume

  # 全量处理 datable representative（不做每作者抽样 cap）
  python pipeline/enrich_llm.py --scope representative --all-representative --resume
"""

import argparse
import json
import os
import random
import re
import sys
import time
from collections import Counter, defaultdict
from concurrent.futures import ThreadPoolExecutor, as_completed

sys.path.insert(0, str(__import__("pathlib").Path(__file__).resolve().parents[1]))
from pipeline import config as C

API_URL = "https://api.deepseek.com/v1/chat/completions"
MODEL   = os.environ.get("DEEPSEEK_MODEL", "deepseek-v4-flash")
BATCH       = int(os.environ.get("DEEPSEEK_BATCH", "20"))
MAX_WORKERS = int(os.environ.get("DEEPSEEK_WORKERS", "10"))
MAX_TOKENS  = int(os.environ.get("DEEPSEEK_MAX_TOKENS", "8192"))
MAX_RETRIES = 3
API_TIMEOUT = int(os.environ.get("DEEPSEEK_TIMEOUT", "60"))
PROGRESS_EVERY = max(1, int(os.environ.get("DEEPSEEK_PROGRESS_EVERY", "5")))

# 极性 → 数值映射（供 metrics.py 共用）
POLARITY_SCORE = {"积极": 1.0, "中性": 0.0, "消极": -1.0}

EMOTION_TYPES = ["豪迈", "离愁", "思乡", "闲适", "家国", "爱情", "哲思", "孤独"]

PLACE_TYPES = ["城市", "州郡", "关塞", "山川", "区域", "古国", "宫苑", "其他"]

TOPIC_TYPES = [
    "山水田园", "边塞战争", "羁旅行役", "送别酬赠", "咏史怀古", "咏物",
    "闺情爱情", "家国兴亡", "悼亡伤逝", "宴饮闲适", "人生哲理", "其他",
]

STAGE_BINS = C.TIME_STAGE_BINS
STAGE_ORDER = C.PERIOD_ORDER
UNKNOWN_STAGE = C.UNKNOWN_PERIOD

PROMPT = """你是中国古典诗词数字人文项目的文本标注员。请对输入数组中的每首作品独立标注。
只能依据输入中的 id、题目、作者、朝代、时期、体裁、词牌、断裂标签、正文；不要编造正文内容或具体创作年份。

必须只输出严格 JSON 对象，不要 Markdown、代码块、注释或解释：
{"items":[{"id":"...","极性":"积极","类型":["豪迈"],"题材":"边塞战争","意象":["大漠","孤烟"],"地名":[{"原文":"长安","规范名":"长安","类型":"城市"}],"创作阶段":"0743-0754"}]}

全局规则：
1. items 必须覆盖每个输入 id；不得遗漏、重复或改写 id。
2. 每条必须包含 id、极性、类型、题材、意象、地名、创作阶段七个键；不要输出其他键。
3. 所有标签必须来自下方给定列表。
4. 判断整首作品的主导情绪和主题，不要被个别字句带偏。

字段规则：

【极性】只能选一个：
["积极","中性","消极"]
- 积极：昂扬、豪迈、旷达、喜悦、赞美、闲适、希望为主。
- 消极：离愁、思乡、孤独、失意、悼亡、亡国、战乱、衰败、悲愤为主。
- 中性：写景、叙事、咏物为主，或情绪不明显，或正负基本平衡。

【类型】从下列标签中选 1-2 个，优先主导情绪，不要凑满：
["豪迈","离愁","思乡","闲适","家国","爱情","哲思","孤独"]

【题材】只能选 1 个，表示文本主要题材；不确定选"其他"：
["山水田园","边塞战争","羁旅行役","送别酬赠","咏史怀古","咏物","闺情爱情","家国兴亡","悼亡伤逝","宴饮闲适","人生哲理","其他"]
题材裁决：送别/酬赠优先"送别酬赠"；旅途漂泊优先"羁旅行役"；战争边塞优先"边塞战争"；朝代兴亡和国家危机优先"家国兴亡"；古人古事优先"咏史怀古"。

【意象】字段必须存在，可为空数组。
- 必须是正文中的连续子串，统一用简体。
- 若正文中出现实际地名或地理专名，必须全部输出，不得遗漏。
- 地名之外，再优先输出 0-5 个承载情绪、主题或时代特征的名词性意象，如 月、风、雨、花、柳、雁、江、山、关、塞、长安、酒、剑、舟、灯。
- 可保留复合意象，如"大漠"、"孤烟"、"长河"、"故国"。
- 不要输出抽象情绪或主题词，如"思乡"、"离愁"、"忧国"、"孤独"。
- 宁可少选或输出 []，不要编造正文中没有的词。

【地名】输出数组，可为空。用于发现地名候选，不用于直接上地图。
每项必须为对象：{"原文":"正文连续子串","规范名":"常用地名","类型":"..."}。
- "原文"必须直接出现在正文中，不能改写。
- "规范名"用简体；不确定时与"原文"相同。
- "类型"只能选：["城市","州郡","关塞","山川","区域","古国","宫苑","其他"]。
- 只输出真实地理实体或地理区域；不要输出朝代名、人物名、普通方位词或纯意象词。
- 不确定是不是地名时不要输出。

【创作阶段】这是河流图使用的粗略时间桶，不代表作品确切创作年份。必须输出区间字符串或"未定年"，不要输出序号、阶段名称或具体年份；脚本会在后续映射为序号。

时间桶含义：
0713-0742=盛唐前期；0743-0754=盛唐后期；0755-0770=安史转折；0771-0805=中唐前期；0806-0835=中唐后期；0836-0907=晚唐；0908-0960=五代；0960-1042=北宋前期；1043-1093=北宋中期；1094-1126=北宋晚期；1127-1161=靖康南渡；1162-1279=南宋中后期；未定年=依据不足。

时间桶选择规则：
1. 不得选择与输入"时期"明显冲突的时间桶。
2. 若断裂标签含"安史之乱"，优先选"0755-0770"；若含"靖康之变"，优先选"1127-1161"。
3. 可根据作者、题目、正文和时期在同一大时期内做粗略判断，但不得编造具体年份。
4. 若依据不足，输出"未定年"。
"""

def get_key():
    return os.environ.get("DEEPSEEK_API_KEY", "")


def parse_json(text):
    text = text.strip().lstrip("`").strip()
    for pre in ("json\n", "json"):
        if text.startswith(pre):
            text = text[len(pre):]
    text = text.strip().rstrip("`").strip()
    try:
        obj = json.loads(text)
        return obj["items"] if isinstance(obj, dict) and "items" in obj else (obj if isinstance(obj, list) else None)
    except Exception:
        m = re.search(r'\{.*\}', text, re.DOTALL)
        if m:
            try:
                return json.loads(m.group()).get("items")
            except Exception:
                return None
    return None


def extract_place_names(text):
    """按正文出现顺序提取词典内地名。"""
    hits = [(text.find(place), place) for place in C.PLACE_NAMES if place in (text or "")]
    return [place for _, place in sorted(hits)]


def normalize_place_mentions(raw_places, text):
    """校验 LLM 地名候选，并补齐词典内地名。"""
    mentions = []
    seen = set()
    if isinstance(raw_places, list):
        for x in raw_places:
            if not isinstance(x, dict):
                continue
            surface = str(x.get("原文") or "").strip()
            if not surface or surface not in text:
                continue
            name = str(x.get("规范名") or surface).strip() or surface
            place_type = str(x.get("类型") or "其他").strip()
            if place_type not in PLACE_TYPES:
                place_type = "其他"
            key = (surface, name)
            if key in seen:
                continue
            seen.add(key)
            mentions.append({"原文": surface, "规范名": name, "类型": place_type})
    for place in extract_place_names(text):
        key = (place, place)
        if key not in seen:
            seen.add(key)
            mentions.append({"原文": place, "规范名": place, "类型": "其他"})
    return mentions


def normalize_stage_order(value, meta=None):
    """把模型返回的时间桶归一为 1-12 的整数。"""
    if isinstance(value, int) and 1 <= value <= len(STAGE_BINS):
        return value
    if isinstance(value, str):
        s = value.strip()
        if s == UNKNOWN_STAGE:
            return C.stage_order_for_record(
                (meta or {}).get("period"),
                (meta or {}).get("dynasty"),
                (meta or {}).get("genre_type"),
                (meta or {}).get("period_source"),
                (meta or {}).get("curated_tags"),
            )
        if s.isdigit():
            n = int(s)
            return n if 1 <= n <= len(STAGE_BINS) else None
        return STAGE_ORDER.get(s)
    return None


def valid(item, expected_texts=None, expected_meta=None):
    """硬校验：极性/类型/题材/创作阶段必须合法，否则整条重试。
    意象仅做软清洗（非原文子串的项直接过滤），不触发整条重试。"""
    if not isinstance(item, dict) or not item.get("id"):
        return False
    # 极性：硬校验
    if item.get("极性") not in ("积极", "中性", "消极"):
        return False
    # 类型：硬校验（允许模型输出多余标签时截断到前两个再检查）
    types = [t for t in item.get("类型", []) if t in EMOTION_TYPES]
    if not types:
        return False
    item["类型"] = types[:2]
    # 题材：硬校验
    if item.get("题材") not in TOPIC_TYPES:
        return False
    # 地名：软清洗 + 词典补齐
    text = expected_texts.get(item["id"], "") if expected_texts is not None else ""
    item["地名"] = normalize_place_mentions(item.get("地名", []), text)
    # 创作阶段：硬校验（河流图时间桶序号）
    meta = expected_meta.get(item["id"], {}) if expected_meta is not None else None
    stage_order = normalize_stage_order(item.get("创作阶段"), meta)
    if stage_order is None:
        return False
    item["创作阶段"] = stage_order
    # 意象：软清洗（过滤非字符串或非原文子串，允许为空数组）
    raw_imagery = item.get("意象", [])
    if not isinstance(raw_imagery, list):
        item["意象"] = []
        return True
    if expected_texts is not None:
        cleaned = [x for x in raw_imagery
                   if isinstance(x, str) and x.strip() and x.strip() in text]
    else:
        cleaned = [x for x in raw_imagery if isinstance(x, str) and x.strip()]
    places = extract_place_names(text)
    place_set = set(places)
    non_place = [x for x in cleaned if x not in place_set]
    item["意象"] = places + non_place[:5]   # 地名全保留，其余意象限量
    return True


def call_api(user_prompt, expected_ids, expected_texts=None, expected_meta=None, temperature=0.1):
    import requests
    key = get_key()
    headers = {"Authorization": f"Bearer {key}", "Content-Type": "application/json"}
    body = {"model": MODEL, "temperature": temperature, "max_tokens": MAX_TOKENS,
            "response_format": {"type": "json_object"},
            "messages": [{"role": "system", "content": PROMPT},
                         {"role": "user", "content": user_prompt}]}
    for attempt in range(MAX_RETRIES):
        try:
            r = requests.post(API_URL, headers=headers, json=body, timeout=API_TIMEOUT)
            r.raise_for_status()
            items = parse_json(r.json()["choices"][0]["message"]["content"])
            if not items:
                time.sleep(2); continue
            returned = {x.get("id") for x in items if isinstance(x, dict)}
            if expected_ids - returned and attempt < MAX_RETRIES - 1:
                print(f"  [warn] 缺 {len(expected_ids-returned)} 个id, 重试"); time.sleep(2); continue
            # valid() 会原地清洗意象，只有极性/类型/题材/阶段错误才返回 False
            invalid = [x for x in items if not valid(x, expected_texts, expected_meta)]
            if invalid:
                if attempt < MAX_RETRIES - 1:
                    print(f"  [warn] {len(invalid)} 条硬校验失败, 重试"); time.sleep(2); continue
                valid_items = [x for x in items if x not in invalid]
                print(f"  [warn] 最终仍有 {len(invalid)} 条失败，保留 {len(valid_items)} 条")
                return valid_items or None
            return items
        except Exception as e:
            print(f"  [warn] {e} (试{attempt+1})"); time.sleep(5 * (attempt + 1))
    return None


def _run_batch(batch):
    """处理单批次，返回 {id: record} dict；失败返回空 dict。"""
    inp = [{"id": p["id"], "题目": p["title"], "作者": p["author"],
            "朝代": p["dynasty"], "时期": p["period"], "体裁": p["genre_type"],
            "词牌": p.get("ci_pai"), "断裂标签": p.get("curated_tags", []),
            "正文": p["text"]}           # 完整正文，不截断
           for p in batch]
    expected_ids   = {p["id"] for p in batch}
    expected_texts = {p["id"]: p["text"] for p in batch}
    expected_meta  = {p["id"]: p for p in batch}
    items = call_api(json.dumps(inp, ensure_ascii=False), expected_ids, expected_texts, expected_meta)
    if not items:
        return {}
    return {
        x["id"]: {
            "id":       x["id"],
            "极性":     x.get("极性"),
            "类型":     x.get("类型", []),
            "题材_llm": x.get("题材"),
            "意象_llm": x.get("意象", []),
            "地名_llm": x.get("地名", []),
            "创作阶段": x.get("创作阶段"),
        }
        for x in items if x.get("id")
    }


def write_enriched(done):
    """原子写出当前富化结果。

    enrich_llm 可能跑很久；每次收到新结果后立即调用本函数，保证中断后
    enriched.jsonl 至少保留所有已完成批次，而不是等到脚本最终结束。
    """
    C.ENRICH_OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    tmp_output = C.ENRICH_OUTPUT.with_suffix(".jsonl.tmp")
    with open(tmp_output, "w", encoding="utf-8") as f:
        for d in done.values():
            f.write(json.dumps(d, ensure_ascii=False) + "\n")
    tmp_output.replace(C.ENRICH_OUTPUT)


def select_stars(rows):
    """stars scope：in_anthology 名篇 + 策展断裂名篇，全部收录不抽样。"""
    picked = [p for p in rows if p.get("in_anthology") or p.get("curated_tags")]
    print(f"  stars scope: {len(picked)} 首（选集名篇 + 断裂策展）")
    return picked


def stratified_sample(rows, n):
    """representative scope：按时期/作者分层抽样，上限 n 首。"""
    strata = defaultdict(list)
    for p in rows:
        strata[(p["period"], p["author"])].append(p)
    rng = random.Random(42)
    picked = []
    for ps in strata.values():
        picked.extend(rng.sample(ps, min(50, len(ps))))
    rng.shuffle(picked)
    return picked[:n]


def main():
    ap = argparse.ArgumentParser(description="LLM 情感富化（pipeline 步骤）")
    ap.add_argument("--scope", choices=["stars", "representative"], default="stars",
                    help="stars=选集名篇+断裂策展（默认）；representative=分层抽样或全量")
    ap.add_argument("--sample-size", type=int, default=2000,
                    help="representative scope 最大抽样数（默认 2000）")
    ap.add_argument("--all-representative", action="store_true", default=False,
                    help="处理全部 datable representative，绕过 sample-size 和每作者 50 首抽样 cap")
    ap.add_argument("--resume", action="store_true", default=False,
                    help="跳过已富化 id（推荐在 pipeline 中使用）")
    ap.add_argument("--skip-consistency", action="store_true")
    args = ap.parse_args()
    if args.all_representative and args.scope != "representative":
        ap.error("--all-representative 只能与 --scope representative 一起使用")

    # ── API key 检查：无 key 时优雅跳过，不阻断管道 ──
    if not get_key():
        print("[enrich_llm] DEEPSEEK_API_KEY 未设置，跳过 LLM 富化。")
        print("  如需启用：export DEEPSEEK_API_KEY=<your_key>  然后重新运行此脚本。")
        sys.exit(0)

    from pipeline import metrics as M
    all_rows = M.load_corpus()
    datable  = [p for p in all_rows if p["datable"]]

    if args.scope == "stars":
        sample = select_stars(all_rows)
    else:
        rows = [p for p in datable if p.get("is_representative")]
        if args.all_representative:
            sample = rows
            print(f"  representative scope: 全量 {len(sample)} 首（datable representative）")
        else:
            sample = stratified_sample(rows, args.sample_size)
            print(f"  representative scope: 抽样 {len(sample)} 首")

    print(f"MODEL={MODEL}  批大小={BATCH}  并发={MAX_WORKERS}  max_tokens={MAX_TOKENS}  实时保存=每完成1批")

    # ── resume：加载已有结果 ──
    done = {}
    if args.resume and C.ENRICH_OUTPUT.exists():
        for line in open(C.ENRICH_OUTPUT, encoding="utf-8"):
            d = json.loads(line)
            done[d["id"]] = d
        print(f"  resume: 已有 {len(done)} 条，跳过")
    elif C.ENRICH_OUTPUT.exists():
        print(f"  fresh run: 不加载已有 {C.ENRICH_OUTPUT}，首个成功批次将覆盖旧输出")

    pending = [p for p in sample if p["id"] not in done]
    batches = [pending[i:i + BATCH] for i in range(0, len(pending), BATCH)]
    total_batches = len(batches)
    print(f"  待处理: {len(pending)} 首，共 {total_batches} 批，并发 {MAX_WORKERS} 线程")

    with ThreadPoolExecutor(max_workers=MAX_WORKERS) as executor:
        futures = {executor.submit(_run_batch, b): i + 1 for i, b in enumerate(batches)}
        completed = 0
        for future in as_completed(futures):
            batch_no = futures[future]
            try:
                result = future.result()
            except Exception as e:
                result = {}
                print(f"  [warn] 批 {batch_no} 异常：{e}")
            if result:
                done.update(result)
                write_enriched(done)
                print(f"  saved: 批 {batch_no} 新增 {len(result)} 条，累计 {len(done)} -> {C.ENRICH_OUTPUT}")
            completed += 1
            if completed % PROGRESS_EVERY == 0 or completed == total_batches:
                print(f"  批 {completed}/{total_batches}  累计完成 {len(done)}")

    # ── 逐首补跑：批次中校验失败导致漏掉的 ID ──
    missed = [p for p in sample if p["id"] not in done]
    if missed:
        print(f"\n  [补跑] {len(missed)} 首未入库，逐首重试...")
        for p in missed:
            result = _run_batch([p])
            done.update(result)
            if result:
                write_enriched(done)
                print(f"    saved: 累计 {len(done)} -> {C.ENRICH_OUTPUT}")
            status = "✓" if result else "✗"
            print(f"    {status} {p['author']} 《{p['title']}》")

    # ── 写出 ──
    if not done and C.ENRICH_OUTPUT.exists() and C.ENRICH_OUTPUT.stat().st_size > 0:
        print("  [warn] 本次无可写富化结果，保留既有 enriched.jsonl")
        return
    write_enriched(done)

    polarity_dist = dict(Counter(d.get("极性") for d in done.values()))
    summary = {
        "富化数":    len(done),
        "scope":     args.scope,
        "极性分布":  polarity_dist,
    }
    summary_path = C.OUTPUT / "enrich" / "summary.json"
    json.dump(summary, open(summary_path, "w", encoding="utf-8"), ensure_ascii=False, indent=2)
    print(f"\n完成：{C.ENRICH_OUTPUT}（{len(done)} 条）")
    print(f"极性分布：{polarity_dist}")


if __name__ == "__main__":
    main()
