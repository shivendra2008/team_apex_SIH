from fastapi import Header, HTTPException

from app.store import Farmer, get_store


def require_farmer(authorization: str | None = Header(default=None)) -> Farmer:
    if not authorization or not authorization.lower().startswith("bearer "):
        raise HTTPException(status_code=401, detail="Missing bearer token.")
    token = authorization.split(" ", 1)[1].strip()
    store = get_store()
    mobile = store.mobile_for_token(token)
    if not mobile:
        raise HTTPException(status_code=401, detail="Invalid or expired token.")
    return store.get_or_create_farmer(mobile)
