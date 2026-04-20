# ============================================================================
# FILE: app/api/v1/router.py
# ============================================================================

from fastapi import APIRouter

# ── Import semua models agar SQLAlchemy bisa resolve relationships ──
import app.models.user
import app.models.anggota
import app.models.profil_anggota
import app.models.jenis_simpanan
import app.models.simpanan
import app.models.pinjaman
import app.models.angsuran
import app.models.syarat_peminjaman
import app.models.pinjaman_syarat
import app.models.setting

from app.api.v1.endpoints import (
    auth,
    users,
    anggota,
    simpanan,
    pinjaman,
    angsuran,
    syarat_peminjaman,
    setting,
    roles,
    sidebar,
)

router = APIRouter()

router.include_router(auth.router,              prefix="/auth",              tags=["Authentication"])
router.include_router(users.router,             prefix="/users",             tags=["Users"])
router.include_router(anggota.router,           prefix="/anggota",           tags=["Anggota"])
router.include_router(simpanan.router,          prefix="/simpanan",          tags=["Simpanan"])
router.include_router(pinjaman.router,          prefix="/pinjaman",          tags=["Pinjaman"])
router.include_router(angsuran.router,          prefix="/angsuran",          tags=["Angsuran"])
router.include_router(syarat_peminjaman.router, prefix="/syarat-peminjaman", tags=["Syarat Peminjaman"])
router.include_router(setting.router,           prefix="/setting",           tags=["Setting"])
router.include_router(roles.router,             prefix="/roles",             tags=["Roles & RBAC"])
router.include_router(sidebar.router,           prefix="/sidebar",           tags=["Sidebar Management"])