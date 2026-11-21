import time
import io
from pathlib import Path
from PIL import Image
import logging

logger = logging.getLogger("traceform.model")

MODEL_PATH = Path(__file__).parent / "model" / "best.pt"
_model = None
_model_loaded = False
_model_error = None


def load_model():
    global _model, _model_loaded, _model_error
    if _model_loaded:
        return
    if not MODEL_PATH.exists():
        _model_error = f"Model weights not found at {MODEL_PATH}. Please place your best.pt file in backend/model/"
        logger.warning(_model_error)
        _model_loaded = True
        return
    try:
        from ultralytics import YOLO
        _model = YOLO(str(MODEL_PATH))
        logger.info(f"YOLOv8 model loaded from {MODEL_PATH}")
    except Exception as e:
        _model_error = str(e)
        logger.error(f"Failed to load model: {e}")
    _model_loaded = True


def get_model_status():
    return {
        "loaded": _model is not None,
        "path": str(MODEL_PATH),
        "exists": MODEL_PATH.exists(),
        "error": _model_error,
        "architecture": "YOLOv8n-cls",
        "framework": "Ultralytics / PyTorch",
        "task": "Image Classification",
        "classes": ["healthy", "parkinson"],
        "input_size": 640,
        "training_epochs": 50,
        "batch_size": 16,
        "metrics": {
            "accuracy": 93.75,
            "precision": 94.12,
            "recall": 94.12,
            "f1_score": 94.12,
            "tp": 16, "fp": 1, "tn": 14, "fn": 1
        }
    }


def predict_image(image_bytes: bytes, filename: str) -> dict:
    if _model is None:
        raise RuntimeError(
            _model_error or "Model not loaded. Place best.pt in backend/model/ and restart the server."
        )

    img = Image.open(io.BytesIO(image_bytes)).convert("RGB")
    width, height = img.size

    start = time.perf_counter()
    results = _model.predict(img, imgsz=640, conf=0.01, verbose=False)
    elapsed_ms = (time.perf_counter() - start) * 1000

    result = results[0]
    probs = result.probs
    names = result.names

    top1_idx = int(probs.top1)
    top1_conf = float(probs.top1conf.item())

    # Build class probability map
    prob_array = probs.data.cpu().numpy().tolist()
    class_probs = {names[i]: round(prob_array[i], 6) for i in range(len(prob_array))}

    predicted_class = names[top1_idx]
    healthy_prob = class_probs.get("healthy", 0.0)
    parkinson_prob = class_probs.get("parkinson", 0.0)

    return {
        "predicted_class": predicted_class,
        "confidence": round(top1_conf, 6),
        "healthy_prob": round(healthy_prob, 6),
        "parkinson_prob": round(parkinson_prob, 6),
        "model_used": "YOLOv8n-cls",
        "inference_time_ms": round(elapsed_ms, 2),
        "image_meta": {
            "filename": filename,
            "width": width,
            "height": height,
            "format": img.format or "JPEG",
        },
        "all_probs": class_probs,
    }
