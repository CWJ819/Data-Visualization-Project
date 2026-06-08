# -*- coding: utf-8 -*-
"""从 dashboard/data 生成中期报告插图（核心发现）。"""
import json
from pathlib import Path
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
from matplotlib import font_manager

# CJK 字体
for fp in ["C:/Windows/Fonts/simhei.ttf", "C:/Windows/Fonts/msyh.ttc"]:
    try:
        font_manager.fontManager.addfont(fp)
    except Exception:
        pass
plt.rcParams["font.sans-serif"] = ["SimHei", "Microsoft YaHei"]
plt.rcParams["axes.unicode_minus"] = False

ROOT = Path(__file__).resolve().parents[2]
D = ROOT / "dashboard" / "data"
FIG = ROOT / "report" / "mid" / "latex模板" / "figures"
FIG.mkdir(parents=True, exist_ok=True)

img = json.load(open(D / "imagery_flow.json", encoding="utf-8"))["timeline"]
sent = json.load(open(D / "sentiment_by_period.json", encoding="utf-8"))["by_period"]
periods = [r["period"] for r in img]
ext = [r["externality_index"] for r in img]
ssc = {r["period"]: r["sentiment_score"] for r in sent}
sscore = [ssc.get(p) for p in periods]

INK = "#1f2f44"; RIVER = "#3a78a8"; RED = "#c0413a"; GOLD = "#b8964a"

# ── 图1：外内比（核心发现）+ 两道断裂 ─────────────
fig, ax = plt.subplots(figsize=(8.2, 4.2), dpi=200)
x = range(len(periods))
ax.plot(x, ext, "-o", color=RIVER, lw=2.6, ms=9, mfc="white", mec=RIVER, mew=2, zorder=3)
ax.axhline(1.0, color="#999", ls="--", lw=1, zorder=1)
for xi, v in zip(x, ext):
    ax.annotate(f"{v}", (xi, v), textcoords="offset points", xytext=(0, 12),
                ha="center", fontsize=11, color=INK, fontweight="bold")
# 断裂带
def band(i, j, label):
    xb = (i + j) / 2
    ax.axvline(xb, color=RED, ls="-", lw=1.6, alpha=0.7, zorder=2)
    ax.text(xb, ax.get_ylim()[1] if False else max(ext) + 0.18, label, color=RED,
            ha="center", fontsize=10)
ax.set_ylim(0.3, 2.15)
band(0, 1, "安史之乱 755")
band(3, 4, "靖康之变 1127")
ax.set_xticks(list(x)); ax.set_xticklabels(periods, fontsize=12)
ax.set_ylabel("外内比 externality = 宏大意象 / 私人意象", fontsize=11)
ax.set_title("意象外内比的时代变迁：唐由外向内，靖康后南宋回潮", fontsize=13, color=INK, pad=14)
ax.spines[["top", "right"]].set_visible(False)
ax.grid(axis="y", alpha=0.25)
fig.tight_layout()
fig.savefig(FIG / "fig_externality.png", bbox_inches="tight")
print("saved fig_externality.png")

# ── 图2：情感均值 + 外内比 双轴 ───────────────────
fig, ax1 = plt.subplots(figsize=(8.2, 4.0), dpi=200)
ax1.bar(x, sscore, color=GOLD, alpha=0.55, width=0.55, label="情感均值（词典法）")
ax1.set_ylabel("情感均值（正=积极）", color=GOLD, fontsize=11)
ax1.set_xticks(list(x)); ax1.set_xticklabels(periods, fontsize=12)
ax1.set_ylim(0, 0.26)
ax2 = ax1.twinx()
ax2.plot(x, ext, "-o", color=RIVER, lw=2.4, ms=8, mfc="white", mec=RIVER, mew=2, label="外内比")
ax2.set_ylabel("外内比", color=RIVER, fontsize=11)
ax2.set_ylim(0.3, 2.0)
ax1.set_title("情感均值与外内比的时期对照", fontsize=13, color=INK, pad=12)
ax1.spines[["top"]].set_visible(False); ax2.spines[["top"]].set_visible(False)
fig.tight_layout()
fig.savefig(FIG / "fig_sentiment.png", bbox_inches="tight")
print("saved fig_sentiment.png")
