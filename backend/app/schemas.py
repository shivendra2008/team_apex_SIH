from pydantic import BaseModel, Field


class SendOtpRequest(BaseModel):
    mobile: str
    aadhaar: str


class SendOtpResponse(BaseModel):
    ok: bool
    expiresInSec: int


class VerifyOtpRequest(BaseModel):
    mobile: str
    otp: str


class BankInfo(BaseModel):
    name: str
    last4: str


class Farmer(BaseModel):
    id: str
    name: str
    initials: str
    village: str
    district: str
    mobile: str
    language: str
    bank: BankInfo


class VerifyOtpResponse(BaseModel):
    token: str
    farmer: Farmer


class UpdateMeRequest(BaseModel):
    language: str | None = None


class CropPick(BaseModel):
    cropId: str
    quintal: float


class CreateBookingRequest(BaseModel):
    centreId: int
    date: str
    slotId: str
    crops: list[CropPick] = Field(default_factory=list)


class CancelResponse(BaseModel):
    ok: bool
    offeredTo: dict | None = None
    penalty: bool = False


class HoldResponse(BaseModel):
    ok: bool
    heldMinutes: int
