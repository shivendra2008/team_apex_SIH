"""WhatsApp Business API client — matches the BSP's "WhatsApp API Setup
Documentation" (Meta Cloud API v23.0 shape, fronted by the BSP's own
domain and API key) AND the exact components of the three templates as
they were actually registered on the WABA (checked via
`scripts/manage_templates.py list` — do not assume a template's shape,
always verify it there before changing this file).

Send Message
    POST {base_url}/{version}/{phoneNumberId}/messages
    Headers: Authorization: Bearer <key>, X-API-KEY: <key>, Content-Type: application/json
    Success: { "messaging_product": "whatsapp", "contacts": [...], "messages": [{ "id": "wamid...." }] }
    Failure (BSP-specific shape): { "isValid": false, "response": [{ "status", "message", "statusCode" }] }
    Failure (Graph-style, seen on other endpoints): { "success": false, "error": { "message", "code", ... } }

Registered template shapes (as of the last `manage_templates.py list` check —
template names themselves live only in .env, never in source; see that file
for the actual approved names):

    OTP template (WA_TEMPLATE_OTP, category AUTHENTICATION)
        BODY:    "*{{1}}* is your verification code. For your security, do not share this code."
        BUTTONS: [URL button, "Copy code", url has {{1}} baked into a query param]
        -> body param: [otp]; button (sub_type "url", index "0") param: [otp]
        No expiry-minutes param exists in this template — ttl_sec is accepted but unused.

    Booking-confirmed template (WA_TEMPLATE_BOOKING_CONFIRMED)
        HEADER: "Dear {{1}},"                        -> [farmer name]
        BODY:   "...Token ID: {{1}}\nDate: {{2}}\nTime: {{3}}\nCenter: {{4}}\nCrop: {{5}}..."
                                                       -> [token, dateLabel, slotLabel, centreName, cropsLabel]

    Booking-cancelled template (WA_TEMPLATE_BOOKING_CANCELLED)
        HEADER: "Dear {{1}}"                          -> [farmer name]
        BODY:   "Your booking {{1}} for {{2}} has been cancelled."
                                                       -> [token, dateLabel]
        (This template has no field for "offered to the waitlist" — that detail
        is not sent over WhatsApp under this template.)

Until WA_DRY_RUN=false, every call just logs the exact payload it would
have sent instead of calling the provider.
"""

import logging

import httpx

from app.config import get_settings

logger = logging.getLogger("kissan_setu.whatsapp")


class WhatsAppError(Exception):
    def __init__(self, message: str, status: int = 502):
        super().__init__(message)
        self.message = message
        self.status = status


def _digits(mobile: str) -> str:
    return "".join(ch for ch in mobile if ch.isdigit())


def _headers() -> dict:
    settings = get_settings()
    return {
        "Content-Type": "application/json",
        "Authorization": f"Bearer {settings.wa_api_key}",
        "X-API-KEY": settings.wa_api_key,
    }


def _extract_error(status_code: int, body: dict, raw_text: str) -> str:
    # BSP-specific shape: { "isValid": false, "response": [{ "message", "status" }] }
    response = body.get("response")
    if isinstance(response, list) and response:
        first = response[0]
        return first.get("message") or first.get("status") or raw_text[:300]

    # Graph-style shape: { "success": false, "error": { "message": ... } }
    error = body.get("error")
    if isinstance(error, dict) and error.get("message"):
        return error["message"]

    return raw_text[:300] or f"WhatsApp provider returned {status_code}."


async def _send(payload: dict) -> str:
    """POSTs to the Send Message endpoint and returns the provider message id."""
    settings = get_settings()

    if settings.wa_dry_run:
        logger.info("[WA DRY RUN] POST /messages payload=%s", payload)
        return "dry-run"

    if not settings.wa_api_base_url or not settings.wa_phone_number_id:
        raise WhatsAppError("WA_API_BASE_URL / WA_PHONE_NUMBER_ID is not configured.", status=500)

    url = f"{settings.wa_api_base_url}/{settings.wa_version}/{settings.wa_phone_number_id}/messages"

    try:
        async with httpx.AsyncClient(timeout=10) as client:
            res = await client.post(url, json=payload, headers=_headers())
    except httpx.RequestError as err:
        raise WhatsAppError(f"Could not reach the WhatsApp provider: {err}") from err

    try:
        body = res.json()
    except ValueError:
        body = {}

    if res.status_code >= 400 or body.get("isValid") is False or body.get("success") is False:
        raise WhatsAppError(_extract_error(res.status_code, body, res.text), status=502)

    try:
        return body["messages"][0]["id"]
    except (KeyError, IndexError, TypeError):
        return ""


def _text(value: str) -> dict:
    return {"type": "text", "text": value}


def _base_payload(mobile: str, template_name: str, components: list[dict]) -> dict:
    settings = get_settings()
    return {
        "messaging_product": "whatsapp",
        "recipient_type": "individual",
        "to": _digits(mobile),
        "type": "template",
        "template": {
            "name": template_name,
            "language": {"code": settings.wa_template_lang},
            "components": components,
        },
    }


async def send_otp(mobile: str, otp: str, ttl_sec: int) -> None:
    settings = get_settings()
    payload = _base_payload(
        mobile,
        settings.wa_template_otp,
        [
            {"type": "body", "parameters": [_text(otp)]},
            {"type": "button", "sub_type": "url", "index": "0", "parameters": [_text(otp)]},
        ],
    )
    await _send(payload)


async def send_booking_confirmation(mobile: str, farmer_name: str, booking: dict) -> None:
    settings = get_settings()
    payload = _base_payload(
        mobile,
        settings.wa_template_booking_confirmed,
        [
            {"type": "header", "parameters": [_text(farmer_name)]},
            {
                "type": "body",
                "parameters": [
                    _text(booking.get("token", "")),
                    _text(booking.get("dateLabel", booking.get("date", ""))),
                    _text(booking.get("slotLabel", "")),
                    _text(booking.get("centreName", "")),
                    _text(booking.get("cropsLabel", "")),
                ],
            },
        ],
    )
    await _send(payload)


async def send_booking_cancelled(mobile: str, farmer_name: str, token: str, date_label: str) -> None:
    settings = get_settings()
    payload = _base_payload(
        mobile,
        settings.wa_template_booking_cancelled,
        [
            {"type": "header", "parameters": [_text(farmer_name)]},
            {"type": "body", "parameters": [_text(token), _text(date_label)]},
        ],
    )
    await _send(payload)
