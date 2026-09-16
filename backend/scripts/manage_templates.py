"""One-time provisioning: create the three WhatsApp templates this backend
sends (OTP, booking confirmed, booking cancelled) via the BSP's Create
Template API, and check their approval status.

Uses:
    POST   {base}/{version}/{wabaId}/message_templates   (create)
    GET    {base}/{version}/{wabaId}/message_templates   (list / check status)

Templates must be approved by WhatsApp before send_message will accept
them — run `list` again after a few minutes to see the status flip from
PENDING to APPROVED.

Usage (run from backend/, with .env filled in):
    .venv/bin/python -m scripts.manage_templates create
    .venv/bin/python -m scripts.manage_templates list
"""

import sys

import httpx

from app.config import get_settings

TEMPLATES = [
    {
        "name": None,  # filled from settings.wa_template_otp
        "category": "UTILITY",
        "body": "Your Kissan Setu OTP is {{1}}. It is valid for {{2}} minutes. Do not share this code with anyone.",
        "example": ["1234", "5"],
    },
    {
        "name": None,  # settings.wa_template_booking_confirmed
        "category": "UTILITY",
        "body": "Your slot is booked! Token {{1}} at {{2}} on {{3}}, {{4}}. Crop: {{5}}. Show this token at the gate.",
        "example": ["A-042", "Karnal Mandi, Gate 2", "Tue 25 Aug", "11:00 - 11:45", "Wheat, 42 quintal"],
    },
    {
        "name": None,  # settings.wa_template_booking_cancelled
        "category": "UTILITY",
        "body": "Your booking {{1}} has been cancelled. The slot has been offered to {{2}} on the waitlist.",
        "example": ["A-042", "Kamla Yadav"],
    },
]


def _resolve_names(settings) -> None:
    TEMPLATES[0]["name"] = settings.wa_template_otp
    TEMPLATES[1]["name"] = settings.wa_template_booking_confirmed
    TEMPLATES[2]["name"] = settings.wa_template_booking_cancelled


def create_templates() -> None:
    settings = get_settings()
    if not settings.wa_api_base_url or not settings.wa_waba_id or not settings.wa_api_key:
        print("Set WA_API_BASE_URL, WA_WABA_ID and WA_API_KEY in .env first.")
        sys.exit(1)

    _resolve_names(settings)
    url = f"{settings.wa_api_base_url}/{settings.wa_version}/{settings.wa_waba_id}/message_templates"
    headers = {
        "Authorization": f"Bearer {settings.wa_api_key}",
        "X-API-KEY": settings.wa_api_key,
        "Content-Type": "application/json",
    }

    with httpx.Client(timeout=15) as client:
        for tpl in TEMPLATES:
            payload = {
                "name": tpl["name"],
                "language": settings.wa_template_lang,
                "category": tpl["category"],
                "components": [
                    {
                        "type": "BODY",
                        "text": tpl["body"],
                        "example": {"body_text": [tpl["example"]]},
                    }
                ],
            }
            res = client.post(url, json=payload, headers=headers)
            print(f"-- {tpl['name']} --")
            print(res.status_code, res.text)


def list_templates() -> None:
    settings = get_settings()
    if not settings.wa_api_base_url or not settings.wa_waba_id or not settings.wa_api_key:
        print("Set WA_API_BASE_URL, WA_WABA_ID and WA_API_KEY in .env first.")
        sys.exit(1)

    url = f"{settings.wa_api_base_url}/{settings.wa_version}/{settings.wa_waba_id}/message_templates"
    headers = {
        "Authorization": f"Bearer {settings.wa_api_key}",
        "X-API-KEY": settings.wa_api_key,
    }
    with httpx.Client(timeout=15) as client:
        res = client.get(url, headers=headers)
    print(res.status_code, res.text)


if __name__ == "__main__":
    action = sys.argv[1] if len(sys.argv) > 1 else "list"
    if action == "create":
        create_templates()
    elif action == "list":
        list_templates()
    else:
        print("Usage: python -m scripts.manage_templates [create|list]")
        sys.exit(1)
