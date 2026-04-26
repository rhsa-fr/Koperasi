# ============================================================================
# FILE: app/api/v1/endpoints/auth.py
# ============================================================================

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.user import User
from app.schemas.user import UserLogin
from app.schemas.token import LoginResponse
from app.core.security import verify_password, create_token_response
from app.core.permissions import get_current_user
from app.core.exceptions import UnauthorizedException

router = APIRouter()


@router.post("/login", response_model=LoginResponse)
def login(
    credentials: UserLogin,
    db: Session = Depends(get_db)
):
    """Login user dan generate JWT token"""
    # Cari user berdasarkan username
    user = db.query(User).filter(User.username == credentials.username).first()
    
    if not user:
        raise UnauthorizedException("Username atau password salah")
    
    # Verify password
    if not verify_password(credentials.password, user.password):
        raise UnauthorizedException("Username atau password salah")
    
    # Check apakah user aktif
    if not user.is_active:
        raise UnauthorizedException("User tidak aktif")
    
    # Generate token response
    # Fetch permissions for the role from DB
    from app.core.permissions import get_user_permissions_from_db
    user_permissions = get_user_permissions_from_db(db, user.role)
    
    return create_token_response(
        user_id=user.id_user,
        username=user.username,
        role=user.role,
        permissions=user_permissions
    )


@router.get("/me")
def get_current_user_info(
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get informasi user yang sedang login"""
    user = db.query(User).filter(User.id_user == current_user["id"]).first()
    
    if not user:
        raise UnauthorizedException("User tidak ditemukan")
    
    anggota_data = None
    if user.role == "anggota":
        from app.models.anggota import Anggota
        from sqlalchemy import or_
        anggota = db.query(Anggota).filter(
            or_(
                Anggota.email == user.username,
                Anggota.no_anggota == user.username,
                Anggota.nama_lengkap == user.username
            )
        ).first()
        
        if anggota:
            from app.models.profil_anggota import ProfilAnggota
            profil = db.query(ProfilAnggota).filter(ProfilAnggota.id_anggota == anggota.id_anggota).first()
            
            anggota_data = {
                "id_anggota": anggota.id_anggota,
                "no_anggota": anggota.no_anggota,
                "status": anggota.status,
                "nama_lengkap": anggota.nama_lengkap,
                "email": anggota.email,
                "no_telepon": anggota.no_telepon,
                "foto_profil": profil.foto_profil if profil else None
            }

    return {
        "id_user": user.id_user,
        "username": user.username,
        "role": user.role,
        "permissions": current_user.get("permissions", {}),
        "is_active": user.is_active,
        "created_at": user.created_at,
        "anggota": anggota_data
    }


@router.post("/logout")
def logout(current_user: dict = Depends(get_current_user)):
    """Logout user (client-side harus hapus token)"""
    return {
        "message": "Logout berhasil. Silakan hapus token dari client."
    }
