from fastapi import APIRouter, Depends

from app.schemas import Farmer, UpdateMeRequest
from app.security import require_farmer
from app.store import CENTRES, CROPS, Farmer as StoreFarmer

router = APIRouter(tags=["farmer"])


@router.get("/farmer/me", response_model=Farmer)
def get_me(farmer: StoreFarmer = Depends(require_farmer)):
    return farmer.to_dict()


@router.patch("/farmer/me", response_model=Farmer)
def update_me(body: UpdateMeRequest, farmer: StoreFarmer = Depends(require_farmer)):
    if body.language:
        farmer.language = body.language
    return farmer.to_dict()


@router.get("/crops")
def list_crops(farmer: StoreFarmer = Depends(require_farmer)):
    return CROPS


@router.get("/centres")
def list_centres(farmer: StoreFarmer = Depends(require_farmer)):
    return CENTRES
