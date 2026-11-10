"""FastAPI Main Application for Fund Compass."""

import logging
import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from src.api.routes import router
from src.config import CORS_ORIGINS, DISCLAIMER_TEXT, HOST, PORT

logger = logging.getLogger(__name__)

app = FastAPI(
    title="Fund Compass API",
    description=(
        "Facts-only mutual fund FAQ assistant powered by Groww reference data "
        "and verified AMC factsheets. Strictly compliant with SEBI non-advisory standards."
    ),
    version="2.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url="/openapi.json",
)

# Configure CORS Middleware allowing Vercel, localhost, and configured frontend domains
origins = CORS_ORIGINS if CORS_ORIGINS != ["*"] else ["*"]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "OPTIONS", "HEAD"],
    allow_headers=["*"],
    expose_headers=["*"],
)

# Mount core API router
app.include_router(router)


@app.get("/", summary="Root Welcome & Service Information")
def root():
    """Welcome endpoint pointing developers to OpenAPI documentation and supported catalog."""
    return {
        "message": "Welcome to Fund Compass API. Visit /docs for OpenAPI interactive documentation.",
        "app": "Fund Compass",
        "version": "2.0.0",
        "disclaimer": DISCLAIMER_TEXT,
        "supported_schemes_count": 5,
        "endpoints": {
            "health": "/api/health",
            "schemes": "/api/schemes",
            "chat": "/api/chat",
            "docs": "/docs",
        },
    }


if __name__ == "__main__":
    uvicorn.run("src.api.main:app", host=HOST, port=PORT, reload=True)
