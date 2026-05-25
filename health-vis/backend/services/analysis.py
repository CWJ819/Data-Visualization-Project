"""Data analysis service"""
import pandas as pd
import numpy as np
from sklearn.cluster import KMeans
from sklearn.preprocessing import StandardScaler
from sklearn.decomposition import PCA


def cluster_profiles(df, n_clusters=3, features=None):
    """KMeans clustering of health profiles"""
    if features is None:
        features = ["weight", "calIn", "calOut", "sleepHours", "sleepQuality"]

    X = df[features].copy()
    X_scaled = StandardScaler().fit_transform(X)

    model = KMeans(n_clusters=n_clusters, random_state=42)
    labels = model.fit_predict(X_scaled)

    # PCA for 2D visualization
    pca = PCA(n_components=2)
    coords = pca.fit_transform(X_scaled)

    result = []
    for i in range(len(df)):
        result.append({
            "date": str(df.iloc[i]["date"]),
            "cluster": int(labels[i]),
            "x": float(coords[i, 0]),
            "y": float(coords[i, 1]),
        })

    return {
        "clusters": [{
            "id": i,
            "center": model.cluster_centers_[i].tolist(),
            "size": int(np.sum(labels == i)),
        } for i in range(n_clusters)],
        "points": result,
        "explained_variance": pca.explained_variance_ratio_.tolist(),
    }


def weight_change_analysis(df):
    """Analyze factors contributing to weight change"""
    # Compute daily weight change
    df = df.copy()
    df["weight_change"] = df["weight"].diff()

    # Correlate with other factors
    factors = ["calDiff", "sleepHours", "sleepQuality", "carbs", "protein", "fat"]
    correlations = {}
    for f in factors:
        valid = df[[f, "weight_change"]].dropna()
        if len(valid) > 2:
            correlations[f] = round(float(valid[f].corr(valid["weight_change"])), 3)

    return {
        "weight_change_correlations": correlations,
        "avg_daily_change": round(float(df["weight_change"].mean()), 3),
        "total_change": round(float(df["weight"].iloc[-1] - df["weight"].iloc[0]), 2),
    }
