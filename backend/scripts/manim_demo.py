"""Manim demo animation for presentation — 答辩演示动画示例"""
# Usage: manim -pql scripts/manim_demo.py WeightTrendAnimation

from manim import *


class WeightTrendAnimation(Scene):
    """Animate weight change over time with calorie overlay"""

    def construct(self):
        # Title
        title = Text("体重变化与热量差的关系", font="sans-serif", color=GREEN).scale(0.8)
        title.to_edge(UP)
        self.play(Write(title))

        # Axes
        axes = Axes(
            x_range=[0, 14, 2],
            y_range=[75, 82, 1],
            axis_config={"color": WHITE},
            x_length=8,
            y_length=4,
        )
        axes_labels = axes.get_axis_labels("天数", "体重 (kg)")
        self.play(Create(axes), Write(axes_labels))

        # Animated weight line
        weight_curve = axes.plot_line_graph(
            x_values=list(range(15)),
            y_values=[80, 79.8, 79.6, 79.5, 79.3, 79.2, 79.1,
                      78.9, 78.8, 78.7, 78.5, 78.4, 78.3, 78.2, 78.1],
            line_color=GREEN,
            add_vertex_dots=False,
        )
        self.play(Create(weight_curve), run_time=3)

        # Highlight calorie deficit
        deficit_label = Text("热量缺口 ≈ 300 kcal/天", color=YELLOW).scale(0.6)
        deficit_label.next_to(title, DOWN)
        self.play(FadeIn(deficit_label))

        self.wait(2)


class SleepImpactAnimation(Scene):
    """Show how sleep quality correlates with weight"""

    def construct(self):
        title = Text("睡眠质量对体重变化的影响", color=BLUE).scale(0.8)
        title.to_edge(UP)
        self.play(Write(title))

        # Scatter plot
        axes = Axes(
            x_range=[3, 10, 1],
            y_range=[-0.5, 0.5, 0.1],
            x_length=8,
            y_length=5,
        )
        labels = axes.get_axis_labels("睡眠质量 (1-10)", "体重变化 (kg)")

        self.play(Create(axes), Write(labels))

        # Scatter points with animation
        import random
        random.seed(42)
        dots = VGroup()
        for _ in range(30):
            x = random.uniform(4, 9)
            y = (x - 6.5) * 0.08 + random.uniform(-0.15, 0.15)
            dot = Dot(point=axes.c2p(x, y), color=BLUE, radius=0.06)
            dots.add(dot)

        self.play(Create(dots), run_time=2)

        # Trend line
        line = axes.plot(lambda x: (x - 6.5) * 0.08, x_range=[4, 9], color=PURPLE)
        self.play(Create(line))

        insight = Text("睡眠质量越高，体重下降趋势越明显", color=BLUE).scale(0.5)
        insight.next_to(title, DOWN)
        self.play(Write(insight))

        self.wait(2)
