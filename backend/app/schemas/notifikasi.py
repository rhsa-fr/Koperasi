from pydantic import BaseModel, Field, ConfigDict
from typing import Optional
from datetime import datetime

class NotifikasiBase(BaseModel):
    tipe: str = Field(..., description="Tipe notifikasi: success, warning, info, system")
    judul: str = Field(..., max_length=100)
    pesan: str = Field(...)

class NotifikasiCreate(NotifikasiBase):
    id_user: int = Field(..., description="ID User penerima notifikasi")

class NotifikasiResponse(NotifikasiBase):
    id_notifikasi: int
    id_user: int
    is_read: bool
    created_at: datetime
    
    model_config = ConfigDict(from_attributes=True)
