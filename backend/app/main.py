import logging

from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.config import get_settings
from app.routers import auth, bookings, farmer

logging.basicConfig(level=logging.INFO)

settings = get_settings()

app = FastAPI(title="Kissan Setu API", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.exception_handler(HTTPException)
async def http_exception_handler(request: Request, exc: HTTPException):
    # README/API.md contract: every error body is { "message": "..." }.
    return JSONResponse(status_code=exc.status_code, content={"message": exc.detail})


app.include_router(auth.router, prefix="/api/v1")
app.include_router(farmer.router, prefix="/api/v1")
app.include_router(bookings.router, prefix="/api/v1")


@app.get("/api/v1/health")
def health():
    return {"ok": True, "whatsapp": "dry-run" if settings.wa_dry_run else "live"}
