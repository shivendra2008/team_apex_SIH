"""Environment-driven settings. Copy .env.example to .env and fill in the
WhatsApp BSP credentials from the provider's API document."""

import os
from functools import lru_cache

from dotenv import load_dotenv

load_dotenv()


def _bool(name: str, default: str = "false") -> bool:
    return os.getenv(name, default).strip().lower() in ("1", "true", "yes", "on")


class Settings:
    # --- server ---
    cors_origins: list[str] = [o.strip() for o in os.getenv("CORS_ORIGINS", "*").split(",")]

    # --- auth (demo bearer tokens, not JWT — fine for a hackathon prototype) ---
    token_ttl_hours: int = int(os.getenv("TOKEN_TTL_HOURS", "72"))

    # --- OTP ---
    otp_length: int = int(os.getenv("OTP_LENGTH", "4"))
    otp_ttl_sec: int = int(os.getenv("OTP_TTL_SEC", "300"))
    otp_resend_sec: int = int(os.getenv("OTP_RESEND_SEC", "24"))

    # --- WhatsApp Business API (BSP fronting the Meta Cloud API shape) ---
    # WA_DRY_RUN=true logs the exact request that would be sent instead of
    # calling the provider — use this until real credentials/approved
    # templates exist.
    wa_dry_run: bool = _bool("WA_DRY_RUN", "true")

    # Request URL is built as: {base_url}/{version}/{phone_number_id}/messages
    wa_api_base_url: str = os.getenv("WA_API_BASE_URL", "").rstrip("/")
    wa_version: str = os.getenv("WA_VERSION", "v23.0")
    wa_phone_number_id: str = os.getenv("WA_PHONE_NUMBER_ID", "")
    wa_waba_id: str = os.getenv("WA_WABA_ID", "")  # only needed for template management (scripts/manage_templates.py)
    wa_api_key: str = os.getenv("WA_API_KEY", "")  # sent as both Authorization: Bearer and X-API-KEY

    wa_template_lang: str = os.getenv("WA_TEMPLATE_LANG", "en")
    # No real template name defaults here on purpose — these must come from
    # .env (which is git-ignored) so the actual approved template names
    # never end up in source control.
    wa_template_otp: str = os.getenv("WA_TEMPLATE_OTP", "")
    wa_template_booking_confirmed: str = os.getenv("WA_TEMPLATE_BOOKING_CONFIRMED", "")
    wa_template_booking_cancelled: str = os.getenv("WA_TEMPLATE_BOOKING_CANCELLED", "")


@lru_cache
def get_settings() -> Settings:
    return Settings()
