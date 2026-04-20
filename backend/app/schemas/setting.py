# ============================================================================
# FILE: app/schemas/setting.py
# ============================================================================

from pydantic import BaseModel, Field
from typing import Optional


class SettingUpdate(BaseModel):
    nama_koperasi: Optional[str] = None
    deskripsi: Optional[str] = None
    alamat: Optional[str] = None
    no_telepon: Optional[str] = None
    email: Optional[str] = None
    bunga_default: Optional[float] = Field(None, ge=0, le=100)
    denda_keterlambatan: Optional[float] = Field(None, ge=0, le=100)
    min_nominal_pinjaman: Optional[float] = Field(None, ge=0)
    max_nominal_pinjaman: Optional[float] = Field(None, ge=0)
    max_lama_angsuran: Optional[int] = Field(None, ge=1, le=360)
    saldo_minimal_simpanan: Optional[float] = Field(None, ge=0)


class SettingResponse(BaseModel):
    id_setting: int
    nama_koperasi: str
    deskripsi: Optional[str]
    alamat: Optional[str]
    no_telepon: Optional[str]
    email: Optional[str]
    bunga_default: float
    denda_keterlambatan: float
    min_nominal_pinjaman: float
    max_nominal_pinjaman: Optional[float]
    max_lama_angsuran: int
    saldo_minimal_simpanan: float

    class Config:
        from_attributes = True
