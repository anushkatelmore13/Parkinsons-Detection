# TRACEFORM — Visual Intelligence Lab

> **Parkinson's spiral drawing classification** using Ultralytics YOLO11n-cls, ResNet50, VGG16 & Custom 4-Block CNN · FastAPI backend · React + Vite frontend

---

## Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, Vite, Tailwind CSS, Framer Motion, Recharts |
| Backend | FastAPI, Uvicorn, Python 3.10+ |
| ML | Ultralytics YOLO11n-cls, PyTorch, torchvision, scikit-learn, Pillow |
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

Trained model weights are stored in `backend/model/`:

```
backend/model/
├── yolo11n-cls.pt     # Champion model (Ultralytics YOLO11n-cls)
├── best.pt            # Alias to champion weights
├── resnet50.pt        # ResNet50 transfer learning weights
├── vgg16.pt           # VGG16 transfer learning weights
├── custom_cnn.pt      # Custom 4-Block CNN weights
├── metrics.json       # Held-out test set evaluation metrics
├── model_config.json  # Multi-model registry & config
└── plots/             # Comparison bar chart, ROC curves, confusion matrices, loss curves
```

To retrain and re-evaluate all 4 architectures:

```bash
cd backend
python3 ml/train_eval.py
```

---

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/health` | Model status and system health |
| `POST` | `/api/predict?model=...` | Upload image, run inference (`yolo11`, `resnet50`, `vgg16`, `custom_cnn`, `compare`) |
| `GET` | `/api/models` | Multi-model status & comparison metrics |
| `GET` | `/api/plots/{plot_name}` | Serve generated evaluation plots |
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

## Model Performance (Held-out Test Set, n=40)

| Model | Accuracy | Precision | Recall | Specificity | F1 Score | ROC-AUC | Latency |
|-------|----------|-----------|--------|-------------|----------|---------|---------|
| **YOLO11n-cls (Best)** | **85.0%** | **82.35%** | **82.35%** | **86.96%** | **82.35%** | **0.8951** | **7.6 ms** |
| VGG16 (Transfer) | 82.5% | 81.25% | 76.47% | 86.96% | 78.79% | 0.8491 | 24.77 ms |
| ResNet50 (Transfer) | 80.0% | 73.68% | 82.35% | 78.26% | 77.78% | 0.8824 | 19.14 ms |
| Custom 4-Block CNN | 57.5% | 50.00% | 52.94% | 60.87% | 51.43% | 0.6138 | 5.75 ms |

---

## Project Structure

```
traceform/
├── backend/
│   ├── main.py              # FastAPI app entrypoint
│   ├── database.py          # SQLite helpers
│   ├── model_service.py     # Multi-model load & inference (YOLO11/ResNet50/VGG16/CNN)
│   ├── ml/                  # Training & evaluation pipeline (dataset, models, train_eval.py)
│   ├── routes/api.py        # All API routes
│   ├── model/               # Trained weights, metrics.json & plots/
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
