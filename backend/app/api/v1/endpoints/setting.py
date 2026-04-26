# ============================================================================
# FILE: app/api/v1/endpoints/setting.py
# ============================================================================

from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.setting import KoperasiSetting
from app.schemas.setting import SettingUpdate, SettingResponse
from app.core.permissions import get_current_user, require_permission
from fastapi import HTTPException

router = APIRouter()


@router.get("", response_model=SettingResponse)
def get_setting(
    db: Session = Depends(get_db)
):
    """Get koperasi setting"""
    setting = db.query(KoperasiSetting).first()
    
    if not setting:
        # Create default setting jika belum ada
        setting = KoperasiSetting()
        db.add(setting)
        db.commit()
        db.refresh(setting)
    
    return setting


@router.put("", response_model=SettingResponse)
def update_setting(
    data: SettingUpdate,
    current_user: dict = Depends(require_permission("settings", "update")),
    db: Session = Depends(get_db)
):
    """Update koperasi setting (admin only)"""
    
    setting = db.query(KoperasiSetting).first()
    
    if not setting:
        # Create if not exists
        setting = KoperasiSetting()
        db.add(setting)
    
    # Update fields with explicit mapping
    setting.nama_koperasi = data.nama_koperasi if data.nama_koperasi is not None else setting.nama_koperasi
    setting.deskripsi = data.deskripsi if data.deskripsi is not None else setting.deskripsi
    setting.alamat = data.alamat if data.alamat is not None else setting.alamat
    setting.no_telepon = data.no_telepon if data.no_telepon is not None else setting.no_telepon
    setting.email = data.email if data.email is not None else setting.email
    
    # Financial fields
    if data.bunga_default is not None: setting.bunga_default = data.bunga_default
    if data.denda_keterlambatan is not None: setting.denda_keterlambatan = data.denda_keterlambatan
    if data.min_nominal_pinjaman is not None: setting.min_nominal_pinjaman = data.min_nominal_pinjaman
    if data.max_nominal_pinjaman is not None: setting.max_nominal_pinjaman = data.max_nominal_pinjaman
    if data.max_lama_angsuran is not None: setting.max_lama_angsuran = data.max_lama_angsuran
    if data.saldo_minimal_simpanan is not None: setting.saldo_minimal_simpanan = data.saldo_minimal_simpanan
    
    print(f"DEBUG: Updating setting ID {setting.id_setting} with name: {setting.nama_koperasi}")
    
    db.add(setting)
    db.commit()
    db.refresh(setting)
    return setting
