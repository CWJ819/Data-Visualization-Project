# -*- coding: utf-8 -*-
"""
normalize.py — 繁→简归一与文本工具
====================================
唐诗为繁体、宋词为简体；所有统计必须在**统一简体**上进行，
否则繁简差异会被误当成时代差异。

`to_simplified` 优先用 opencc（高质量），import 失败时回退到项目自带的
字级繁→简映射表（pipeline/data/t2s_fallback.json），保证管道不被依赖阻塞。
"""

import json
import re
from pathlib import Path

_PUNCT = r'[，。！？；：、,.!?;:·…—\-－（）()《》「」『』“”‘’\"\'\s]'

# ── 繁→简转换器（懒加载 + 回退）──────────────────────
_converter = None
_fallback_map = None
_mode = None


def _load():
    global _converter, _fallback_map, _mode
    if _mode is not None:
        return
    try:
        import opencc
        _converter = opencc.OpenCC("t2s")
        _mode = "opencc"
        return
    except Exception:
        pass
    # 回退字表
    fb = Path(__file__).resolve().parent / "data" / "t2s_fallback.json"
    if fb.exists():
        _fallback_map = json.loads(fb.read_text(encoding="utf-8"))
        _mode = "fallback"
    else:
        _fallback_map = {}
        _mode = "identity"   # 最坏情况：不转换（qa 会报繁体残留）


def converter_mode():
    _load()
    return _mode


def to_simplified(text):
    if not text:
        return text
    _load()
    if _mode == "opencc":
        return _converter.convert(text)
    if _mode in ("fallback", "identity") and _fallback_map:
        return "".join(_fallback_map.get(ch, ch) for ch in text)
    return text


# ── 文本工具 ─────────────────────────────────────────
def join_paragraphs(paragraphs):
    return "\n".join(p.strip() for p in paragraphs if p and p.strip()).strip()


def strip_punct(text):
    return re.sub(_PUNCT, "", text or "")


def char_count(text):
    """去标点后的汉字数。"""
    return len(strip_punct(text))


def tokens(text, max_len=2):
    """词频切分：连续 1~max_len 个汉字（沿用旧管道口径）。基于简体文本。"""
    return re.findall(r'[一-鿿]{1,%d}' % max_len, text or "")


# ── 繁体残留检测（供 qa）─────────────────────────────
# 一组常见繁体特征字；若简体归一后仍大量出现，说明转换失效。
_TRAD_MARKERS = set("時來見處風雲歸聲遠開盡愛國學書晝樂東車馬鳥魚龍鳳華萬個們這還沒")


def count_traditional(text):
    return sum(1 for ch in (text or "") if ch in _TRAD_MARKERS)
