"""Analysis endpoints — correlation, regression, clustering"""
from fastapi import APIRouter, Query
import pandas as pd
import numpy as np
from scipy import stats
from pathlib import Path

router = APIRouter()
DATA_DIR = Path(__file__).parent.parent / "data"


@router.get("/correlation")
def correlation_matrix(
    fields: str = Query("weight,calIn,calOut,calDiff,carbs,protein,fat,sleepHours,sleepQuality")
):
    """Compute Pearson correlation matrix for given fields"""
    df = _load_data()
    if df.empty:
        return {"error": "No data"}

    field_list = fields.split(",")
    n = len(field_list)
    matrix = []
    labels = []

    for f1 in field_list:
        row = []
        for f2 in field_list:
            if f1 in df.columns and f2 in df.columns:
                r = df[f1].corr(df[f2])
            else:
                r = 0
            row.append(round(float(r), 3))
        matrix.append(row)

    # Chinese labels
    label_map = {
        "weight": "体重", "calIn": "摄入热量", "calOut": "消耗热量",
        "calDiff": "热量差", "carbs": "碳水", "protein": "蛋白质",
        "fat": "脂肪", "sleepHours": "睡眠时长", "sleepQuality": "睡眠质量",
    }
    labels = [label_map.get(f, f) for f in field_list]

    return {"matrix": matrix, "labels": labels}


@router.get("/regression")
def linear_regression(
    x_field: str = Query("calDiff"),
    y_field: str = Query("weight"),
):
    """Simple linear regression between two fields"""
    df = _load_data()
    if df.empty:
        return {"error": "No data"}

    x = df[x_field].values
    y = df[y_field].values
    slope, intercept, r_value, p_value, std_err = stats.linregress(x, y)

    return {
        "slope": round(float(slope), 6),
        "intercept": round(float(intercept), 4),
        "r_squared": round(float(r_value ** 2), 4),
        "p_value": round(float(p_value), 6),
        "x_field": x_field,
        "y_field": y_field,
    }


def _load_data():
    csv_path = DATA_DIR / "sample.csv"
    if not csv_path.exists():
        return pd.DataFrame()
    return pd.read_csv(csv_path)
