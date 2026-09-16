import logging

from fastapi import APIRouter, HTTPException

from app.config import get_settings
from app.schemas import (
    SendOtpRequest,
    SendOtpResponse,
    VerifyOtpRequest,
    VerifyOtpResponse,
)
from app.services import whatsapp
from app.store import get_store

router = APIRouter(prefix="/auth", tags=["auth"])
logger = logging.getLogger("kissan_setu.auth")


@router.post("/send-otp", response_model=SendOtpResponse)
async def send_otp(body: SendOtpRequest):
    store = get_store()
    settings = get_settings()

    error = store.validate_send_otp(body.mobile, body.aadhaar)
    if error:
        raise HTTPException(status_code=400, detail=error)

    otp = store.issue_otp(body.mobile, body.aadhaar)

    try:
        await whatsapp.send_otp(body.mobile, otp, settings.otp_ttl_sec)
    except whatsapp.WhatsAppError as err:
        logger.error("Failed to send OTP via WhatsApp: %s", err.message)
        raise HTTPException(status_code=502, detail="Could not send the code on WhatsApp. Please try again.") from err

    return SendOtpResponse(ok=True, expiresInSec=settings.otp_resend_sec)


@router.post("/verify-otp", response_model=VerifyOtpResponse)
async def verify_otp(body: VerifyOtpRequest):
    store = get_store()

    error = store.verify_otp(body.mobile, body.otp)
    if error:
        raise HTTPException(status_code=400, detail=error)

    farmer = store.get_or_create_farmer(body.mobile)
    token = store.issue_token(body.mobile)
    store.otps.pop(body.mobile, None)

    return VerifyOtpResponse(token=token, farmer=farmer.to_dict())
