# -*- coding: utf-8 -*-
"""
qa.py — 校验 corpus 与 dashboard 输出
=====================================
检查项：
  - dashboard/*.json 严格可解析 + 无 nonfinite
  - 时期序列按 PERIODS 单调、跨文件时期集合一致
  - 简体 text 繁体残留 = 0（抽样）
  - 语料无重复 key、datable/未定年对账
  - 地名坐标范围合理

退出码非 0 表示有 FAIL。
"""

import json
import math
import sys
from collections import Counter

sys.path.insert(0, str(__import__("pathlib").Path(__file__).resolve().parents[1]))
from pipeline import config as C
from pipeline import normalize as N

FAILS = []
WARN = []


def fail(msg):
    FAILS.append(msg)
    print("  FAIL:", msg)


def warn(msg):
    WARN.append(msg)
    print("  WARN:", msg)


def find_nonfinite(v, path="$", out=None):
    if out is None:
        out = []
    if isinstance(v, float) and not math.isfinite(v):
        out.append(path)
    elif isinstance(v, dict):
        for k, c in v.items():
            find_nonfinite(c, f"{path}.{k}", out)
    elif isinstance(v, list):
        for i, c in enumerate(v):
            find_nonfinite(c, f"{path}[{i}]", out)
    return out


def check_dashboard():
    print("\n[1] dashboard JSON 严格性")
    loaded = {}
    for p in sorted(C.DASHBOARD_DATA.glob("*.json")):
        txt = p.read_text(encoding="utf-8")
        try:
            obj = json.loads(txt, parse_constant=lambda c: (_ for _ in ()).throw(ValueError(c)))
        except Exception as e:
            fail(f"{p.name}: 非严格JSON ({e})")
            continue
        nf = find_nonfinite(obj)
        if nf:
            fail(f"{p.name}: nonfinite at {nf[:3]}")
        loaded[p.name] = obj
        print(f"  OK {p.name}")
    return loaded


def check_period_order(loaded):
    print("\n[2] 时期序列单调 + 一致")
    order = {p: i for i, p in enumerate(C.PERIODS)}
    series_periods = {}
    for fname, key in [("sentiment_by_period.json", "by_period"),
                       ("imagery_flow.json", "timeline")]:
        rows = loaded.get(fname, {}).get(key, [])
        pers = [r["period"] for r in rows]
        idx = [order[p] for p in pers if p in order]
        if idx != sorted(idx):
            fail(f"{fname}: 时期非单调 {pers}")
        else:
            print(f"  OK {fname}: {pers}")
        series_periods[fname] = set(pers)
    genre = loaded.get("genre_by_period.json", {}).get("by_period", {})
    series_periods["genre_by_period.json"] = set(genre.keys())
    if len(set(map(frozenset, series_periods.values()))) > 1:
        warn(f"跨文件时期集合不一致: {series_periods}")
    else:
        print("  OK 跨文件时期集合一致")


def check_corpus():
    print("\n[3] 语料校验")
    rows = [json.loads(l) for l in open(C.CORPUS, encoding="utf-8") if l.strip()]
    print(f"  语料 {len(rows)} 条")
    # 繁体残留（抽样前 8000）
    resid = sum(N.count_traditional(p["text"]) for p in rows[:8000])
    (print(f"  OK 繁体残留(抽样)=0") if resid == 0 else fail(f"简体text仍有繁体特征字 {resid}"))
    # 重复 key
    keys = Counter((p["dynasty"], p["title"], p["author"], p["text"]) for p in rows)
    dups = sum(c - 1 for c in keys.values() if c > 1)
    (print("  OK 无重复记录") if dups == 0 else fail(f"重复记录 {dups}"))
    # id 唯一
    ids = Counter(p["id"] for p in rows)
    iddup = sum(c - 1 for c in ids.values() if c > 1)
    (print("  OK id 唯一") if iddup == 0 else warn(f"id 重复 {iddup}"))
    # datable 对账
    datable = sum(p["datable"] for p in rows)
    undated = sum(1 for p in rows if p["period"] == C.UNKNOWN_PERIOD)
    if datable + undated != len(rows):
        fail(f"datable({datable}) + 未定年({undated}) != 总数({len(rows)})")
    else:
        print(f"  OK datable对账: {datable} + 未定年 {undated} = {len(rows)}")
    # 未定年不应出现在时间轴时期
    bad = [p["id"] for p in rows if (not p["datable"]) and p["period"] in C.PERIODS]
    (print("  OK 未定年未混入时期轴") if not bad else fail(f"未定年混入时期 {bad[:3]}"))


def check_places(loaded):
    print("\n[4] 地名坐标范围")
    coords = loaded.get("place_geo.json", {}).get("place_coords", {})
    bad = [n for n, (lng, lat) in coords.items()
           if not (70 <= lng <= 135 and 15 <= lat <= 55)]
    (print(f"  OK {len(coords)} 个坐标均在合理范围") if not bad else fail(f"坐标越界 {bad}"))


def main():
    print("=" * 60)
    print("QA 校验")
    print("=" * 60)
    loaded = check_dashboard()
    check_period_order(loaded)
    check_corpus()
    check_places(loaded)
    print("\n" + "=" * 60)
    print(f"结果: {'全部通过' if not FAILS else str(len(FAILS))+' 项 FAIL'}"
          f" | {len(WARN)} 项 WARN")
    print("=" * 60)
    sys.exit(1 if FAILS else 0)


if __name__ == "__main__":
    main()
