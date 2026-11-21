import sqlite3
import json
from datetime import datetime
from pathlib import Path

DB_PATH = Path("traceform.db")


def get_connection():
    conn = sqlite3.connect(str(DB_PATH))
    conn.row_factory = sqlite3.Row
    return conn


def init_db():
    conn = get_connection()
    cur = conn.cursor()
    cur.execute("""
        CREATE TABLE IF NOT EXISTS predictions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            filename TEXT NOT NULL,
            predicted_class TEXT NOT NULL,
            confidence REAL NOT NULL,
            healthy_prob REAL NOT NULL,
            parkinson_prob REAL NOT NULL,
            model_used TEXT NOT NULL,
            inference_time_ms REAL NOT NULL,
            image_path TEXT,
            timestamp TEXT NOT NULL,
            metadata TEXT
        )
    """)
    conn.commit()
    conn.close()


def insert_prediction(data: dict) -> int:
    conn = get_connection()
    cur = conn.cursor()
    cur.execute("""
        INSERT INTO predictions
            (filename, predicted_class, confidence, healthy_prob, parkinson_prob,
             model_used, inference_time_ms, image_path, timestamp, metadata)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (
        data["filename"],
        data["predicted_class"],
        data["confidence"],
        data["healthy_prob"],
        data["parkinson_prob"],
        data["model_used"],
        data["inference_time_ms"],
        data.get("image_path", ""),
        data.get("timestamp", datetime.utcnow().isoformat()),
        json.dumps(data.get("metadata", {})),
    ))
    conn.commit()
    row_id = cur.lastrowid
    conn.close()
    return row_id


def get_all_predictions(limit: int = 100, offset: int = 0):
    conn = get_connection()
    cur = conn.cursor()
    cur.execute(
        "SELECT * FROM predictions ORDER BY id DESC LIMIT ? OFFSET ?",
        (limit, offset),
    )
    rows = [dict(r) for r in cur.fetchall()]
    conn.close()
    return rows


def get_prediction_by_id(pred_id: int):
    conn = get_connection()
    cur = conn.cursor()
    cur.execute("SELECT * FROM predictions WHERE id = ?", (pred_id,))
    row = cur.fetchone()
    conn.close()
    return dict(row) if row else None


def delete_prediction(pred_id: int) -> bool:
    conn = get_connection()
    cur = conn.cursor()
    cur.execute("DELETE FROM predictions WHERE id = ?", (pred_id,))
    affected = cur.rowcount
    conn.commit()
    conn.close()
    return affected > 0


def get_analytics():
    conn = get_connection()
    cur = conn.cursor()
    cur.execute("SELECT COUNT(*) as total FROM predictions")
    total = cur.fetchone()["total"]
    cur.execute("SELECT COUNT(*) as cnt FROM predictions WHERE predicted_class = 'healthy'")
    healthy_count = cur.fetchone()["cnt"]
    cur.execute("SELECT COUNT(*) as cnt FROM predictions WHERE predicted_class = 'parkinson'")
    parkinson_count = cur.fetchone()["cnt"]
    cur.execute("SELECT AVG(confidence) as avg_conf FROM predictions")
    avg_conf_row = cur.fetchone()
    avg_conf = avg_conf_row["avg_conf"] if avg_conf_row["avg_conf"] else 0
    cur.execute("SELECT AVG(inference_time_ms) as avg_time FROM predictions")
    avg_time_row = cur.fetchone()
    avg_time = avg_time_row["avg_time"] if avg_time_row["avg_time"] else 0
    cur.execute("""
        SELECT date(timestamp) as day, COUNT(*) as cnt
        FROM predictions
        GROUP BY day
        ORDER BY day DESC
        LIMIT 14
    """)
    daily = [dict(r) for r in cur.fetchall()]
    conn.close()
    return {
        "total_predictions": total,
        "healthy_count": healthy_count,
        "parkinson_count": parkinson_count,
        "avg_confidence": round(avg_conf, 4),
        "avg_inference_time_ms": round(avg_time, 2),
        "daily_counts": daily,
    }
