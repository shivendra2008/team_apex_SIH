import logging
from datetime import date as date_cls

from fastapi import APIRouter, Depends, HTTPException

from app.schemas import CancelResponse, CreateBookingRequest, HoldResponse
from app.security import require_farmer
from app.services import whatsapp
from app.store import (
    Farmer as StoreFarmer,
    SLOT_TIMES,
    WAITLIST,
    centre_by_id,
    crop_by_id,
    get_store,
    slot_by_id,
)

router = APIRouter(tags=["bookings"])
logger = logging.getLogger("kissan_setu.bookings")

DAY_NAMES = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
BASE_DATE = date_cls(2026, 8, 25)


def _fmt_qty(quintal: float) -> str:
    return str(int(quintal)) if quintal == int(quintal) else str(quintal)


@router.get("/centres/{centre_id}/slots")
def get_slots(centre_id: int, date: str, farmer: StoreFarmer = Depends(require_farmer)):
    centre = centre_by_id(centre_id)
    if not centre:
        raise HTTPException(status_code=404, detail="Centre not found.")

    try:
        day = date_cls.fromisoformat(date)
    except ValueError as err:
        raise HTTPException(status_code=400, detail="Date must be YYYY-MM-DD.") from err

    day_idx = max(0, (day - BASE_DATE).days)
    slots = [
        {**s, "left": min(s["total"], s["left"] + day_idx * 3)}
        for s in SLOT_TIMES
    ]
    return {"centreId": centre_id, "date": date, "slots": slots}


@router.post("/bookings")
async def create_booking(body: CreateBookingRequest, farmer: StoreFarmer = Depends(require_farmer)):
    store = get_store()
    centre = centre_by_id(body.centreId)
    slot = slot_by_id(body.slotId)
    if not centre or not slot:
        raise HTTPException(status_code=409, detail="Slot is no longer available.")

    lines = []
    for pick in body.crops:
        crop = crop_by_id(pick.cropId)
        lines.append({
            "cropId": pick.cropId,
            "quintal": pick.quintal,
            "name": crop["name"] if crop else pick.cropId,
            "msp": crop["msp"] if crop else 0,
        })

    try:
        day = date_cls.fromisoformat(body.date)
        date_label = f"{DAY_NAMES[day.weekday()]} {day.day} {day.strftime('%b')}"
    except ValueError:
        date_label = body.date

    booking = {
        "id": f"bk-{farmer.id}",
        "token": store.next_booking_token(),
        "centreId": centre["id"],
        "centreName": f"{centre['name']}, {centre['gate']}",
        "gate": centre["gate"],
        "date": body.date,
        "dateLabel": date_label,
        "slotId": slot["id"],
        "slotLabel": f"{slot['start']} – {slot['end']}",
        "crops": lines,
        "cropsLabel": " + ".join(f"{l['name']} · {_fmt_qty(l['quintal'])} quintal" for l in lines),
        "status": "confirmed",
        "waitMinutes": centre["waitMinutes"],
        "aheadCount": 6,
    }
    store.set_booking(farmer.mobile, booking)

    try:
        await whatsapp.send_booking_confirmation(farmer.mobile, farmer.name, booking)
    except whatsapp.WhatsAppError as err:
        # The booking is already confirmed server-side; a WhatsApp outage
        # shouldn't fail the whole request, just get logged for follow-up.
        logger.error("Failed to send booking confirmation via WhatsApp: %s", err.message)

    return booking


@router.get("/bookings/current")
def get_current_booking(farmer: StoreFarmer = Depends(require_farmer)):
    store = get_store()
    return {"booking": store.get_booking(farmer.mobile)}


@router.post("/bookings/{booking_id}/cancel", response_model=CancelResponse)
async def cancel_booking(booking_id: str, farmer: StoreFarmer = Depends(require_farmer)):
    store = get_store()
    booking = store.get_booking(farmer.mobile)
    if not booking or booking["id"] != booking_id:
        raise HTTPException(status_code=404, detail="Booking not found.")

    booking["status"] = "cancelled"
    offered_to = WAITLIST[0] if WAITLIST else None

    try:
        await whatsapp.send_booking_cancelled(
            farmer.mobile,
            farmer.name,
            booking["token"],
            booking.get("dateLabel", booking.get("date", "")),
        )
    except whatsapp.WhatsAppError as err:
        logger.error("Failed to send cancellation via WhatsApp: %s", err.message)

    return CancelResponse(ok=True, offeredTo={"name": offered_to["name"]} if offered_to else None, penalty=False)


@router.post("/bookings/{booking_id}/hold", response_model=HoldResponse)
def hold_booking(booking_id: str, farmer: StoreFarmer = Depends(require_farmer)):
    store = get_store()
    booking = store.get_booking(farmer.mobile)
    if not booking or booking["id"] != booking_id:
        raise HTTPException(status_code=404, detail="Booking not found.")
    booking["status"] = "held"
    return HoldResponse(ok=True, heldMinutes=30)
