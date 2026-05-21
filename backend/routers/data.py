"""Data query endpoints"""
from fastapi import APIRouter, Query
import pandas as pd
from pathlib import Path
import json

router = APIRouter()
DATA_DIR = Path(__file__).parent.parent / "data"


@router.get("/timeline")
def get_timeline(start_date: str = Query(None), end_date: str = Query(None)):
    """Return timeline data (weight, calIn, calOut over time)"""
    df = _load_data()
    if start_date and end_date:
        df = df[(df["date"] >= start_date) & (df["date"] <= end_date)]
    return df[["date", "weight", "calIn", "calOut", "calDiff"]].to_dict(orient="records")


@router.get("/nutrition")
def get_nutrition(start_date: str = Query(None), end_date: str = Query(None)):
    df = _load_data()
    if start_date and end_date:
        df = df[(df["date"] >= start_date) & (df["date"] <= end_date)]
    return df[["date", "carbs", "protein", "fat", "calIn"]].to_dict(orient="records")


@router.get("/profile/{date}")
def get_profile(date: str):
    df = _load_data()
    row = df[df["date"] == date]
    if row.empty:
        return {"error": "Date not found"}
    r = row.iloc[0]
    return {
        "date": r["date"], "weight": r["weight"],
        "calIn": r["calIn"], "calOut": r["calOut"],
        "carbs": r["carbs"], "protein": r["protein"], "fat": r["fat"],
        "sleepHours": r["sleepHours"], "sleepQuality": r["sleepQuality"],
    }


def _load_data():
    csv_path = DATA_DIR / "sample.csv"
    if not csv_path.exists():
        return pd.DataFrame()
    return pd.read_csv(csv_path)
