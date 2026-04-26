from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from app.database import get_db
from app.core.permissions import get_current_user
from app.models.notifikasi import Notifikasi
from app.schemas.notifikasi import NotifikasiResponse

router = APIRouter()

@router.get("", response_model=List[NotifikasiResponse])
def get_user_notifications(
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Mengambil semua notifikasi untuk user (admin/anggota) yang sedang login, diurutkan dari terbaru.
    """
    notifikasis = db.query(Notifikasi)\
        .filter(Notifikasi.id_user == current_user["id"])\
        .order_by(Notifikasi.created_at.desc())\
        .all()
    return notifikasis

@router.put("/{id_notifikasi}/read", response_model=NotifikasiResponse)
def mark_notification_as_read(
    id_notifikasi: int,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Menandai sebuah notifikasi telah dibaca. Hanya pemilik notifikasi yang bisa melakukannya.
    """
    notif = db.query(Notifikasi).filter(Notifikasi.id_notifikasi == id_notifikasi).first()
    
    if not notif:
        raise HTTPException(status_code=404, detail="Notifikasi tidak ditemukan")
        
    if notif.id_user != current_user["id"]:
        raise HTTPException(status_code=403, detail="Anda tidak berhak membaca notifikasi ini")
        
    if not notif.is_read:
        notif.is_read = True
        db.commit()
        db.refresh(notif)
        
    return notif
