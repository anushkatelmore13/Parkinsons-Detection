# TRACEFORM — Visual Intelligence Lab

> **Parkinson's spiral drawing classification** using YOLOv8n-cls · FastAPI backend · React + Vite frontend

---

## Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, Vite, Tailwind CSS, Framer Motion, Recharts |
| Backend | FastAPI, Uvicorn, Python 3.10+ |
| ML | Ultralytics YOLOv8n-cls, PyTorch, Pillow |
| Database | SQLite (via Python `sqlite3`) |

---

## Quick Start

### 1. Backend

```bash
cd backend
python3 -m venv venv && source venv/bin/activate
pip install -r requirements.txt

# Place your trained model weights:
mkdir -p model
cp /path/to/best.pt model/best.pt

# Copy dataset (optional — for Dataset Explorer images)
cp -r /path/to/parkinson_dataset ../dataset

uvicorn main:app --reload --port 8000
```

API docs: http://localhost:8000/docs

### 2. Frontend

```bash
cd frontend
npm install
npm run dev
# Open http://localhost:5173
```

---

## Model Setup

The backend expects your trained YOLOv8n-cls weights at:

```
backend/model/best.pt
```

**How to get `best.pt`:**

1. Run the Colab notebook (`Parkinson.ipynb`)
2. After training completes, download: `runs/classify/train/weights/best.pt`
3. Place it in `backend/model/best.pt`
4. Restart the backend

If the weights are missing, the API will return a `503` on `/api/predict` and the dashboard will show a warning banner.

---

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/health` | Model status and system health |
| `POST` | `/api/predict` | Upload image, run YOLOv8 inference |
| `GET` | `/api/history` | List prediction history |
| `GET` | `/api/history/{id}` | Single prediction detail |
| `DELETE` | `/api/history/{id}` | Delete a prediction record |
| `GET` | `/api/analytics` | Aggregated statistics |
| `GET` | `/api/model` | Model architecture info |
| `GET` | `/api/dataset` | Dataset split counts |

---

## Dataset

- **Source:** Roboflow — Parkinson Disease Detection v1 (folder format)
- **Total:** 204 images (102 healthy, 102 parkinson)
- **Splits:** train (133) / valid (31) / test (40)
- **Classes:** `healthy`, `parkinson`

> ⚠ **Data leakage note:** Participant identifiers (V01–V55) appear across splits.
> Subject-level evaluation is recommended before academic reporting.

---

## Model Performance (YOLOv8n-cls, test set n=32)

| Metric | Value |
|--------|-------|
| Accuracy | 93.75% |
| Precision | 94.12% |
| Recall | 94.12% |
| F1 Score | 94.12% |
| TP / TN / FP / FN | 16 / 14 / 1 / 1 |

---

## Project Structure

```
traceform/
├── backend/
│   ├── main.py              # FastAPI app entrypoint
│   ├── database.py          # SQLite helpers
│   ├── model_service.py     # YOLOv8 load & inference
│   ├── routes/api.py        # All API routes
│   ├── model/best.pt        # ← place weights here
│   ├── uploads/             # Uploaded images (auto-created)
│   ├── requirements.txt
│   └── .env.example
├── frontend/
│   ├── src/
│   │   ├── pages/
│   │   │   ├── LandingPage.jsx
│   │   │   ├── WorkspacePage.jsx
│   │   │   └── workspace/
│   │   │       ├── OverviewPage.jsx
│   │   │       ├── ImageStudioPage.jsx
│   │   │       ├── PredictionsPage.jsx
│   │   │       ├── ModelLabPage.jsx
│   │   │       ├── DatasetPage.jsx
│   │   │       ├── NotesPage.jsx
│   │   │       └── SettingsPage.jsx
│   │   ├── components/
│   │   │   ├── Sidebar.jsx
│   │   │   └── SpiralCanvas.jsx
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   └── index.css
│   ├── package.json
│   ├── vite.config.js
│   └── tailwind.config.js
└── README.md
```

---

## Disclaimer

> **TRACEFORM is an experimental research platform for academic demonstration only.**
> It is not a medical device. All predictions are experimental image classifications
> and must not be used for clinical screening, diagnosis, or any medical decision-making.
> Always consult a qualified medical professional for health concerns.
