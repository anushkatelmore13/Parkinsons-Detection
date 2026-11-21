import logging
import os
from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse, JSONResponse

from database import init_db
from model_service import load_model
from routes.api import router as api_router

logging.basicConfig(level=logging.INFO, format="%(levelname)s  %(name)s  %(message)s")
logger = logging.getLogger("traceform")

UPLOAD_DIR = Path("uploads")
UPLOAD_DIR.mkdir(exist_ok=True)
MODEL_DIR = Path("model")
MODEL_DIR.mkdir(exist_ok=True)

DATASET_PATH = Path(os.getenv("DATASET_PATH", "../dataset"))


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("TRACEFORM backend starting up...")
    init_db()
    load_model()
    logger.info("Startup complete.")
    yield
    logger.info("TRACEFORM backend shutting down.")


app = FastAPI(
    title="TRACEFORM API",
    description="Visual Intelligence Lab — Parkinson's spiral drawing classification API.",
    version="1.0.0",
    lifespan=lifespan,
)

CORS_ORIGINS = os.getenv(
    "CORS_ORIGINS",
    "http://localhost:5173,http://localhost:3000,http://127.0.0.1:5173",
).split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_router, prefix="/api")

# Serve uploaded images
app.mount("/api/image", StaticFiles(directory="uploads"), name="images")

# Serve dataset images for explorer
@app.get("/api/dataset-image/{split}/{cls}/{filename}")
async def dataset_image(split: str, cls: str, filename: str):
    # Security: only allow alphanumeric, underscores, hyphens, dots
    import re
    if not re.match(r'^[\w\-\.]+$', filename):
        return JSONResponse(status_code=400, content={"error": "Invalid filename"})
    allowed_splits = {"train", "test", "valid"}
    allowed_classes = {"healthy", "parkinson"}
    if split not in allowed_splits or cls not in allowed_classes:
        return JSONResponse(status_code=400, content={"error": "Invalid path"})
    
    img_path = DATASET_PATH / split / cls / filename
    if img_path.exists():
        return FileResponse(str(img_path))
    return JSONResponse(status_code=404, content={"error": "Image not found"})


DIST_DIR = Path("../frontend/dist")
if DIST_DIR.exists():
    if (DIST_DIR / "assets").exists():
        app.mount("/assets", StaticFiles(directory=str(DIST_DIR / "assets")), name="assets")

    @app.get("/{full_path:path}")
    async def serve_spa(full_path: str):
        if full_path.startswith("api"):
            return JSONResponse(status_code=404, content={"detail": "API route not found"})
        target = DIST_DIR / full_path
        if target.is_file():
            return FileResponse(str(target))
        return FileResponse(str(DIST_DIR / "index.html"))
else:
    @app.get("/")
    async def root():
        return {"message": "TRACEFORM API v1.0.0", "docs": "/docs"}
