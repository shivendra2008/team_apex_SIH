"""In-memory data store — mirrors frontend/mock.js so the two stay easy to
compare. Fine for a prototype/demo; swap for a real database when this
grows past the OTP + booking-confirmation slice."""

import random
import re
import time
from dataclasses import dataclass, field

from app.config import get_settings

MOBILE_RE = re.compile(r"^[6-9]\d{9}$")
AADHAAR_RE = re.compile(r"^\d{12}$")

CROPS = [
    {"id": "wheat", "name": "Wheat", "nameHi": "गेहूं", "namePa": "ਕਣਕ", "msp": 2521},
    {"id": "paddy", "name": "Paddy", "nameHi": "धान", "namePa": "ਝੋਨਾ", "msp": 2450},
    {"id": "mustard", "name": "Mustard", "nameHi": "सरसों", "namePa": "ਸਰ੍ਹੋਂ", "msp": 6200},
    {"id": "gram", "name": "Gram", "nameHi": "चना", "namePa": "ਛੋਲੇ", "msp": 5900},
    {"id": "bajra", "name": "Bajra", "nameHi": "बाजरा", "namePa": "ਬਾਜਰਾ", "msp": 2890},
    {"id": "maize", "name": "Maize", "nameHi": "मक्का", "namePa": "ਮੱਕੀ", "msp": 2325},
]

CENTRES = [
    {"id": 1, "name": "Karnal Grain Mandi", "crops": "Wheat, Paddy", "km": 4.2, "waitMinutes": 35,
     "load": 0.62, "gate": "Gate 2", "lat": 29.6857, "lng": 76.9905, "mapLeft": "47%", "mapTop": "44%"},
    {"id": 2, "name": "Taraori Procurement Centre", "crops": "Wheat, Mustard", "km": 9.1, "waitMinutes": 15,
     "load": 0.34, "gate": "Gate 1", "lat": 29.8000, "lng": 76.9300, "mapLeft": "76%", "mapTop": "28%"},
    {"id": 3, "name": "Nilokheri Centre", "crops": "Paddy, Wheat", "km": 12.6, "waitMinutes": 125,
     "load": 0.96, "gate": "Main", "lat": 29.8300, "lng": 76.9300, "mapLeft": "20%", "mapTop": "76%"},
    {"id": 4, "name": "Assandh Sub-Yard", "crops": "Wheat, Bajra", "km": 18.3, "waitMinutes": 10,
     "load": 0.21, "gate": "Yard", "lat": 29.5210, "lng": 76.6060, "mapLeft": "80%", "mapTop": "88%"},
]

SLOT_TIMES = [
    {"id": "s1", "start": "09:00", "end": "09:45", "total": 12, "left": 0},
    {"id": "s2", "start": "10:00", "end": "10:45", "total": 12, "left": 0},
    {"id": "s3", "start": "11:00", "end": "11:45", "total": 12, "left": 2},
    {"id": "s4", "start": "12:00", "end": "12:45", "total": 12, "left": 5},
    {"id": "s5", "start": "14:00", "end": "14:45", "total": 12, "left": 9},
    {"id": "s6", "start": "15:00", "end": "15:45", "total": 12, "left": 12},
]

WAITLIST = [
    {"name": "Kamla Yadav", "village": "Indri", "want": "11:00 AM", "since": "since 8:40 AM"},
    {"name": "Devender Rana", "village": "Ballah", "want": "11:00 AM", "since": "since 9:05 AM"},
]


def crop_by_id(crop_id: str) -> dict | None:
    return next((c for c in CROPS if c["id"] == crop_id), None)


def centre_by_id(centre_id: int) -> dict | None:
    return next((c for c in CENTRES if c["id"] == int(centre_id)), None)


def slot_by_id(slot_id: str) -> dict | None:
    return next((s for s in SLOT_TIMES if s["id"] == slot_id), None)


@dataclass
class Farmer:
    id: str
    name: str
    initials: str
    village: str
    district: str
    mobile: str
    language: str = "en"
    bank: dict = field(default_factory=lambda: {"name": "PNB", "last4": "4471"})

    def to_dict(self) -> dict:
        return {
            "id": self.id, "name": self.name, "initials": self.initials,
            "village": self.village, "district": self.district, "mobile": self.mobile,
            "language": self.language, "bank": self.bank,
        }


@dataclass
class OtpEntry:
    otp: str
    aadhaar_last4: str
    created_at: float
    sent_count: int = 1


class Store:
    """Process-local state. Restarting the server clears everything —
    acceptable for a hackathon demo, not for production."""

    def __init__(self) -> None:
        self.settings = get_settings()
        self.farmers_by_mobile: dict[str, Farmer] = {}
        self.otps: dict[str, OtpEntry] = {}
        self.tokens: dict[str, str] = {}  # bearer token -> mobile
        self.bookings_by_mobile: dict[str, dict] = {}
        self._token_seq = 41  # next booking is A-042, matching the mock

    # ---------- OTP ----------
    def validate_send_otp(self, mobile: str, aadhaar: str) -> str | None:
        if not MOBILE_RE.match(mobile):
            return "Invalid mobile number."
        if not AADHAAR_RE.match(aadhaar):
            return "Invalid Aadhaar number."
        return None

    def issue_otp(self, mobile: str, aadhaar: str) -> str:
        otp = "".join(random.choices("0123456789", k=self.settings.otp_length))
        self.otps[mobile] = OtpEntry(otp=otp, aadhaar_last4=aadhaar[-4:], created_at=time.time())
        return otp

    def verify_otp(self, mobile: str, otp: str) -> str | None:
        entry = self.otps.get(mobile)
        if not entry:
            return "Request a new code first."
        if time.time() - entry.created_at > self.settings.otp_ttl_sec:
            return "This code has expired. Request a new one."
        if entry.otp != otp:
            return "Incorrect code."
        return None

    # ---------- farmers / tokens ----------
    def get_or_create_farmer(self, mobile: str) -> Farmer:
        farmer = self.farmers_by_mobile.get(mobile)
        if farmer:
            return farmer
        farmer = Farmer(
            id=f"farmer-{mobile[-4:]}",
            name="Ramesh Singh",
            initials="RS",
            village="Kheri Village",
            district="Karnal",
            mobile=mobile,
        )
        self.farmers_by_mobile[mobile] = farmer
        return farmer

    def issue_token(self, mobile: str) -> str:
        token = f"ks-{mobile}-{int(time.time() * 1000)}"
        self.tokens[token] = mobile
        return token

    def mobile_for_token(self, token: str) -> str | None:
        return self.tokens.get(token)

    # ---------- bookings ----------
    def next_booking_token(self) -> str:
        self._token_seq += 1
        return f"A-{self._token_seq:03d}"

    def set_booking(self, mobile: str, booking: dict) -> None:
        self.bookings_by_mobile[mobile] = booking

    def get_booking(self, mobile: str) -> dict | None:
        return self.bookings_by_mobile.get(mobile)


_store: Store | None = None


def get_store() -> Store:
    global _store
    if _store is None:
        _store = Store()
    return _store
