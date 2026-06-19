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
BATCH       = int(os.environ.get("DEEPSEEK_BATCH", "32"))
MAX_WORKERS = int(os.environ.get("DEEPSEEK_WORKERS", "16"))
MAX_TOKENS  = int(os.environ.get("DEEPSEEK_MAX_TOKENS", "8192"))
MAX_RETRIES = 3
API_TIMEOUT = int(os.environ.get("DEEPSEEK_TIMEOUT", "120"))
CHECKPOINT_EVERY = int(os.environ.get("DEEPSEEK_CHECKPOINT_EVERY", "20"))
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

PROMPT = """你是中国古典诗词文本标注员。请对输入数组中的每首诗词独立标注，只依据输入中的题目、作者、朝代、时期、体裁、词牌和正文，不要补充正文之外的事实。

标注字段：

1) 极性：只能选 "积极" / "中性" / "消极"。
- 积极：整体以开阔、昂扬、闲适、喜悦、赞美、旷达为主。
- 消极：整体以哀伤、离愁、亡国、思乡、孤独、衰败、战乱、悼亡为主。
- 中性：叙事、写景、咏物、酬赠为主，或正负情绪接近。

2) 类型：从下列标签中选 1-2 个，不能自造标签：
["豪迈","离愁","思乡","闲适","家国","爱情","哲思","孤独"]

3) 题材：从下列标签中选 1 个，不能自造标签：
["山水田园","边塞战争","羁旅行役","送别酬赠","咏史怀古","咏物","闺情爱情","家国兴亡","悼亡伤逝","宴饮闲适","人生哲理","其他"]

4) 意象：输出 2-5 个正文中实际出现的单字或词。
- 必须是正文原文子串，统一用简体。
- 不要输出正文中没有出现的概括词。
- 优先选择承载情绪或主题的意象，如 月、江、山、风、花、酒、梦、故国、长安。

5) 创作阶段：输出粗略阶段，不要编造精确年份。
- 若输入提供时期，优先结合时期输出，如 "晚唐五代时期"、"南宋时期"。
- 若作者和文本有明确文学史阶段，可写简短阶段，如 "杜甫安史乱后漂泊时期"。
- 若无法判断，输出输入时期或 "未定年时期"。

输出要求：
- 只输出严格 JSON，不要 Markdown，不要解释。
- 必须包含输入中的每个 id。
- 繁简视为同一字，统一输出简体。
- JSON 格式：
{"items":[{"id":"...","极性":"积极/中性/消极","类型":["..."],"题材":"...","意象":["..."],"创作阶段":"..."}]}
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


# 预编译地名正则：一次扫描匹配所有词典地名，避免逐地名 O(N) 子串查找
_PLACE_PATTERN = re.compile("|".join(re.escape(p) for p in sorted(C.PLACE_NAMES, key=len, reverse=True)))

def extract_place_names(text):
    """按正文出现顺序提取词典内地名（单次正则扫描）。"""
    if not text:
        return []
    seen = set()
    result = []
    for m in _PLACE_PATTERN.finditer(text):
        place = m.group()
        if place not in seen:
            seen.add(place)
            result.append(place)
    return result


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

    print(f"MODEL={MODEL}  批大小={BATCH}  并发={MAX_WORKERS}  max_tokens={MAX_TOKENS}  checkpoint=每{CHECKPOINT_EVERY}批")

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
            completed += 1
            # checkpoint 写盘（不每批写，减少磁盘I/O）
            if CHECKPOINT_EVERY and completed % CHECKPOINT_EVERY == 0:
                write_enriched(done)
                print(f"  checkpoint: 已写 {len(done)} 条 -> {C.ENRICH_OUTPUT}")
            if completed % PROGRESS_EVERY == 0 or completed == total_batches:
                print(f"  批 {completed}/{total_batches}  累计完成 {len(done)}")

    # ── 逐首补跑：批次中校验失败导致漏掉的 ID（并行小批次）──
    missed = [p for p in sample if p["id"] not in done]
    if missed:
        print(f"\n  [补跑] {len(missed)} 首未入库，按{min(BATCH, 8)}首/批并行重试...")
        # 小批次并行，不做单首串行
        retry_batches = [missed[i:i + min(BATCH, 8)] for i in range(0, len(missed), min(BATCH, 8))]
        with ThreadPoolExecutor(max_workers=min(MAX_WORKERS, len(retry_batches))) as ex:
            retry_futures = {ex.submit(_run_batch, rb): i + 1 for i, rb in enumerate(retry_batches)}
            for future in as_completed(retry_futures):
                result = future.result()
                if result:
                    done.update(result)
                    write_enriched(done)
                    print(f"    saved: 累计 {len(done)} -> {C.ENRICH_OUTPUT}")
        # 第二轮：对仍然漏掉的逐首抢救
        still_missed = [p for p in sample if p["id"] not in done]
        if still_missed:
            print(f"  [最终抢救] {len(still_missed)} 首逐首重试...")
            for p in still_missed:
                result = _run_batch([p])
                if result:
                    done.update(result)
                print(f"    {'✓' if result else '✗'} {p['author']} 《{p['title']}》")

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
