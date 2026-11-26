import os
from pathlib import Path
from fastapi import APIRouter, UploadFile, File, Query, HTTPException, BackgroundTasks
from fastapi.responses import JSONResponse, FileResponse, Response
from datetime import datetime, timezone

from database import insert_prediction, get_all_predictions, get_prediction_by_id, delete_prediction, get_analytics
from model_service import predict_image, get_model_status
from services.pdf_report import generate_prediction_pdf

router = APIRouter()

UPLOAD_DIR = Path("uploads")
UPLOAD_DIR.mkdir(exist_ok=True)
PLOTS_DIR = Path("model/plots")

ALLOWED_TYPES = {"image/jpeg", "image/png", "image/webp", "image/bmp", "image/tiff"}
MAX_SIZE_BYTES = 10 * 1024 * 1024  # 10 MB


@router.get("/health")
async def health():
    status = get_model_status()
    return {
        "status": "ok",
        "model_loaded": status["loaded"],
        "available_models": status.get("available_models", []),
        "primary_model": status.get("primary_model", "none"),
        "architecture": status["architecture"],
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }


@router.post("/predict")
async def predict(
    file: UploadFile = File(...),
    model: str = Query("yolo11", description="Model architecture: yolo11, resnet50, vgg16, custom_cnn, or compare")
):
    if file.content_type not in ALLOWED_TYPES:
        raise HTTPException(
            status_code=422,
            detail=f"Unsupported file type: {file.content_type}. Allowed: JPEG, PNG, WebP, BMP, TIFF."
        )

    contents = await file.read()
    if len(contents) > MAX_SIZE_BYTES:
        raise HTTPException(status_code=413, detail="File too large. Max 10 MB.")

    # Save uploaded image
    timestamp_str = datetime.now(timezone.utc).strftime("%Y%m%d_%H%M%S_%f")
    safe_name = f"{timestamp_str}_{file.filename}"
    save_path = UPLOAD_DIR / safe_name
    with open(save_path, "wb") as f:
        f.write(contents)

    try:
        prediction = predict_image(contents, file.filename, model_name=model)
    except RuntimeError as e:
        raise HTTPException(status_code=503, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Inference error: {str(e)}")

    ts = datetime.now(timezone.utc).isoformat()
    record = {
        "filename": file.filename,
        "predicted_class": prediction["predicted_class"],
        "confidence": prediction["confidence"],
        "healthy_prob": prediction["healthy_prob"],
        "parkinson_prob": prediction["parkinson_prob"],
        "model_used": prediction["model_used"],
        "inference_time_ms": prediction["inference_time_ms"],
        "image_path": str(save_path),
        "timestamp": ts,
        "metadata": prediction.get("image_meta", {}),
    }
    pred_id = insert_prediction(record)

    return {
        "id": pred_id,
        **prediction,
        "filename": file.filename,
        "timestamp": ts,
        "image_url": f"/api/image/{safe_name}",
    }


@router.get("/plots/{plot_name}")
async def get_plot(plot_name: str):
    # Sanitize plot name
    allowed_plots = {
        "model_metrics_comparison.png",
        "roc_curves_comparison.png",
        "confusion_matrices_all.png",
        "training_curves_comparison.png"
    }
    if plot_name not in allowed_plots:
        raise HTTPException(status_code=404, detail="Plot not found")
    
    plot_file = PLOTS_DIR / plot_name
    if not plot_file.exists():
        raise HTTPException(status_code=404, detail="Plot image does not exist yet. Please wait for model training to complete.")
    
    return FileResponse(str(plot_file), media_type="image/png")


@router.get("/models")
async def list_models():
    return get_model_status()


@router.get("/history")
async def history(limit: int = 50, offset: int = 0):
    rows = get_all_predictions(limit=limit, offset=offset)
    return {"items": rows, "count": len(rows)}


@router.get("/history/{pred_id}")
async def history_item(pred_id: int):
    row = get_prediction_by_id(pred_id)
    if not row:
        raise HTTPException(status_code=404, detail="Prediction not found.")
    return row


@router.get("/report/{pred_id}")
async def download_report(pred_id: int):
    row = get_prediction_by_id(pred_id)
    if not row:
        raise HTTPException(status_code=404, detail="Prediction not found.")
    try:
        pdf_bytes = generate_prediction_pdf(row)
        filename = f"Traceform_Research_Report_{pred_id}_{row.get('predicted_class', 'unknown')}.pdf"
        return Response(
            content=pdf_bytes,
            media_type="application/pdf",
            headers={"Content-Disposition": f'attachment; filename="{filename}"'}
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to generate report: {str(e)}")


@router.delete("/history/{pred_id}")
async def delete_item(pred_id: int):
    success = delete_prediction(pred_id)
    if not success:
        raise HTTPException(status_code=404, detail="Prediction not found.")
    return {"deleted": True, "id": pred_id}


@router.get("/analytics")
async def analytics():
    return get_analytics()


@router.get("/model")
async def model_info():
    return get_model_status()


@router.get("/dataset")
async def dataset_info():
    dataset_base = Path("../dataset")
    splits = ["train", "test", "valid"]
    classes = ["healthy", "parkinson"]
    result = {}
    total = 0
    for split in splits:
        result[split] = {}
        for cls in classes:
            p = dataset_base / split / cls
            if p.exists():
                files = list(p.glob("*.jpg")) + list(p.glob("*.png")) + list(p.glob("*.jpeg"))
                result[split][cls] = len(files)
                total += len(files)
            else:
                result[split][cls] = 0
    return {
        "splits": result,
        "total_images": total,
        "classes": classes,
        "format": "JPEG / PNG",
        "image_size": "224x224 (PyTorch) / 640x640 (YOLO11)",
        "source": "Roboflow — Parkinson Disease Detection v1 (folder format)",
    }
