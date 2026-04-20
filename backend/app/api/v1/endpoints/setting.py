# ============================================================================
# FILE: app/api/v1/endpoints/setting.py
# ============================================================================

from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.setting import KoperasiSetting
from app.schemas.setting import SettingUpdate, SettingResponse
from app.core.permissions import get_current_user, is_admin

router = APIRouter()


@router.get("", response_model=SettingResponse)
def get_setting(
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get koperasi setting"""
    setting = db.query(KoperasiSetting).first()
    
    if not setting:
        # Create default setting jika belum ada
        setting = KoperasiSetting(
            nama_koperasi="Koperasi Sijam",
            bunga_default=2.0,
            denda_keterlambatan=1.0,
        )
        db.add(setting)
        db.commit()
        db.refresh(setting)
    
    return setting


@router.put("", response_model=SettingResponse)
def update_setting(
    data: SettingUpdate,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update koperasi setting (admin only)"""
    # Check admin permission
    if not is_admin(current_user):
        from fastapi import HTTPException
        raise HTTPException(status_code=403, detail="Hanya admin yang dapat mengubah setting")
    
    setting = db.query(KoperasiSetting).first()
    
    if not setting:
        # Create if not exists
        setting = KoperasiSetting()
        db.add(setting)
    
    # Update fields
    update_data = data.dict(exclude_unset=True)
    for key, value in update_data.items():
        if value is not None:
            setattr(setting, key, value)
    
    db.commit()
    db.refresh(setting)
    
    return setting
