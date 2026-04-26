# ============================================================================
# FILE: app/api/v1/endpoints/pinjaman.py
# ============================================================================

from fastapi import APIRouter, Depends, status, File, UploadFile, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import date
from app.database import get_db
from app.schemas.pinjaman import (
    PinjamanCreate, PinjamanUpdate, PinjamanResponse, PinjamanDetailResponse,
    PinjamanApprove, PinjamanReject, PinjamanCalculation
)
from app.schemas.common import PaginatedResponse, PaginationMeta
from app.core.permissions import get_current_user, require_permission
from app.services import pinjaman_service, syarat_peminjaman_service
from app.core.upload import save_uploaded_file
from app.schemas.syarat_peminjaman import PinjamanSyaratResponse, PinjamanSyaratUpdate

router = APIRouter()


@router.get("", response_model=PaginatedResponse[PinjamanResponse])
def get_pinjaman_list(
    skip: int = 0,
    limit: int = 10,
    id_anggota: Optional[int] = None,
    status: Optional[str] = None,
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    search: Optional[str] = None, # Add this
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get list pinjaman"""
    pinjaman_list, total = pinjaman_service.get_pinjaman_list(
        db=db,
        skip=skip,
        limit=limit,
        id_anggota=id_anggota,
        status=status,
        start_date=start_date,
        end_date=end_date,
        search=search # Add this
    )
    
    page = (skip // limit) + 1 if limit > 0 else 1
    total_pages = (total + limit - 1) // limit if limit > 0 else 1
    
    data = [PinjamanResponse.model_validate(p) for p in pinjaman_list]
    
    return PaginatedResponse(
        data=data,
        meta=PaginationMeta(
            total=total,
            skip=skip,
            limit=limit,
            page=page,
            total_pages=total_pages
        )
    )


@router.post("", response_model=PinjamanResponse, status_code=status.HTTP_201_CREATED)
def create_pinjaman(
    data: PinjamanCreate,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create pengajuan pinjaman"""
    try:
        pinjaman = pinjaman_service.create_pinjaman(
            db=db,
            data=data,
            id_user=current_user["id"]
        )
        
        # Use model_validate for cleaner and safer response
        # It will automatically handle Decimal to float conversion
        return PinjamanResponse.model_validate(pinjaman)
        
    except Exception as e:
        import traceback
        print("\n" + "!"*60)
        print("❌ CRITICAL ERROR IN CREATE_PINJAMAN")
        traceback.print_exc()
        print("!"*60 + "\n")
        
        if hasattr(e, 'status_code'):
            raise e
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )


# ─── Static routes MUST be before /{id_pinjaman} ──────────────────────────────
@router.get("/pending", response_model=List[PinjamanResponse])
def get_pinjaman_pending(
    current_user: dict = Depends(require_permission("pinjaman", "read")),
    db: Session = Depends(get_db)
):
    """Get semua pinjaman pending approval (ketua only)"""
    pinjaman_list = pinjaman_service.get_pinjaman_pending(db)
    
    data = []
    for pinjaman in pinjaman_list:
        response_data = {
            "id_pinjaman": pinjaman.id_pinjaman,
            "id_anggota": pinjaman.id_anggota,
            "nama_anggota": pinjaman.anggota.nama_lengkap if pinjaman.anggota else None,
            "no_pinjaman": pinjaman.no_pinjaman,
            "tanggal_pengajuan": pinjaman.tanggal_pengajuan,
            "nominal_pinjaman": float(pinjaman.nominal_pinjaman),
            "bunga_persen": float(pinjaman.bunga_persen),
            "total_bunga": float(pinjaman.total_bunga),
            "total_pinjaman": float(pinjaman.total_pinjaman),
            "lama_angsuran": pinjaman.lama_angsuran,
            "nominal_angsuran": float(pinjaman.nominal_angsuran),
            "keperluan": pinjaman.keperluan,
            "status": pinjaman.status,
            "tanggal_persetujuan": pinjaman.tanggal_persetujuan,
            "tanggal_pencairan": pinjaman.tanggal_pencairan,
            "tanggal_lunas": pinjaman.tanggal_lunas,
            "catatan_persetujuan": pinjaman.catatan_persetujuan,
            "sisa_pinjaman": float(pinjaman.sisa_pinjaman),
            "created_at": pinjaman.created_at
        }
        data.append(PinjamanResponse(**response_data))
    
    return data


@router.post("/calculate", response_model=PinjamanCalculation)
def calculate_pinjaman(
    data: PinjamanCalculation,
    current_user: dict = Depends(get_current_user)
):
    """Kalkulasi pinjaman (simulasi)"""
    return pinjaman_service.calculate_pinjaman(
        nominal_pinjaman=data.nominal_pinjaman,
        bunga_persen=data.bunga_persen,
        lama_angsuran=data.lama_angsuran
    )


# ─── Dynamic routes with path parameter ───────────────────────────────────────
@router.get("/{id_pinjaman}", response_model=PinjamanResponse)
def get_pinjaman(
    id_pinjaman: int,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get pinjaman by ID"""
    pinjaman = pinjaman_service.get_pinjaman_by_id(db, id_pinjaman)
    
    response_data = {
        "id_pinjaman": pinjaman.id_pinjaman,
        "id_anggota": pinjaman.id_anggota,
        "nama_anggota": pinjaman.anggota.nama_lengkap if pinjaman.anggota else None,
        "no_pinjaman": pinjaman.no_pinjaman,
        "tanggal_pengajuan": pinjaman.tanggal_pengajuan,
        "nominal_pinjaman": float(pinjaman.nominal_pinjaman),
        "bunga_persen": float(pinjaman.bunga_persen),
        "total_bunga": float(pinjaman.total_bunga),
        "total_pinjaman": float(pinjaman.total_pinjaman),
        "lama_angsuran": pinjaman.lama_angsuran,
        "nominal_angsuran": float(pinjaman.nominal_angsuran),
        "keperluan": pinjaman.keperluan,
        "status": pinjaman.status,
        "tanggal_persetujuan": pinjaman.tanggal_persetujuan,
        "tanggal_pencairan": pinjaman.tanggal_pencairan,
        "tanggal_lunas": pinjaman.tanggal_lunas,
        "catatan_persetujuan": pinjaman.catatan_persetujuan,
        "sisa_pinjaman": float(pinjaman.sisa_pinjaman),
        "created_at": pinjaman.created_at
    }
    
    return PinjamanResponse(**response_data)


@router.put("/{id_pinjaman}", response_model=PinjamanResponse)
def update_pinjaman(
    id_pinjaman: int,
    data: PinjamanUpdate,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update pinjaman (hanya yang masih pending)"""
    pinjaman = pinjaman_service.update_pinjaman(db, id_pinjaman, data)
    
    response_data = {
        "id_pinjaman": pinjaman.id_pinjaman,
        "id_anggota": pinjaman.id_anggota,
        "nama_anggota": pinjaman.anggota.nama_lengkap if pinjaman.anggota else None,
        "no_pinjaman": pinjaman.no_pinjaman,
        "tanggal_pengajuan": pinjaman.tanggal_pengajuan,
        "nominal_pinjaman": float(pinjaman.nominal_pinjaman),
        "bunga_persen": float(pinjaman.bunga_persen),
        "total_bunga": float(pinjaman.total_bunga),
        "total_pinjaman": float(pinjaman.total_pinjaman),
        "lama_angsuran": pinjaman.lama_angsuran,
        "nominal_angsuran": float(pinjaman.nominal_angsuran),
        "keperluan": pinjaman.keperluan,
        "status": pinjaman.status,
        "tanggal_persetujuan": pinjaman.tanggal_persetujuan,
        "tanggal_pencairan": pinjaman.tanggal_pencairan,
        "tanggal_lunas": pinjaman.tanggal_lunas,
        "catatan_persetujuan": pinjaman.catatan_persetujuan,
        "sisa_pinjaman": float(pinjaman.sisa_pinjaman),
        "created_at": pinjaman.created_at
    }
    
    return PinjamanResponse(**response_data)


@router.put("/{id_pinjaman}/approve", response_model=PinjamanResponse)
def approve_pinjaman(
    id_pinjaman: int,
    data: PinjamanApprove,
    current_user: dict = Depends(require_permission("pinjaman", "approve")),
    db: Session = Depends(get_db)
):
    """Approve pinjaman (ketua only)"""
    pinjaman = pinjaman_service.approve_pinjaman(
        db=db,
        id_pinjaman=id_pinjaman,
        data=data,
        id_user=current_user["id"]
    )
    
    response_data = {
        "id_pinjaman": pinjaman.id_pinjaman,
        "id_anggota": pinjaman.id_anggota,
        "nama_anggota": pinjaman.anggota.nama_lengkap if pinjaman.anggota else None,
        "no_pinjaman": pinjaman.no_pinjaman,
        "tanggal_pengajuan": pinjaman.tanggal_pengajuan,
        "nominal_pinjaman": float(pinjaman.nominal_pinjaman),
        "bunga_persen": float(pinjaman.bunga_persen),
        "total_bunga": float(pinjaman.total_bunga),
        "total_pinjaman": float(pinjaman.total_pinjaman),
        "lama_angsuran": pinjaman.lama_angsuran,
        "nominal_angsuran": float(pinjaman.nominal_angsuran),
        "keperluan": pinjaman.keperluan,
        "status": pinjaman.status,
        "tanggal_persetujuan": pinjaman.tanggal_persetujuan,
        "tanggal_pencairan": pinjaman.tanggal_pencairan,
        "tanggal_lunas": pinjaman.tanggal_lunas,
        "catatan_persetujuan": pinjaman.catatan_persetujuan,
        "sisa_pinjaman": float(pinjaman.sisa_pinjaman),
        "created_at": pinjaman.created_at
    }
    
    return PinjamanResponse(**response_data)


@router.put("/{id_pinjaman}/reject", response_model=PinjamanResponse)
def reject_pinjaman(
    id_pinjaman: int,
    data: PinjamanReject,
    current_user: dict = Depends(require_permission("pinjaman", "reject")),
    db: Session = Depends(get_db)
):
    """Reject pinjaman (ketua only)"""
    pinjaman = pinjaman_service.reject_pinjaman(
        db=db,
        id_pinjaman=id_pinjaman,
        data=data,
        id_user=current_user["id"]
    )
    
    response_data = {
        "id_pinjaman": pinjaman.id_pinjaman,
        "id_anggota": pinjaman.id_anggota,
        "nama_anggota": pinjaman.anggota.nama_lengkap if pinjaman.anggota else None,
        "no_pinjaman": pinjaman.no_pinjaman,
        "tanggal_pengajuan": pinjaman.tanggal_pengajuan,
        "nominal_pinjaman": float(pinjaman.nominal_pinjaman),
        "bunga_persen": float(pinjaman.bunga_persen),
        "total_bunga": float(pinjaman.total_bunga),
        "total_pinjaman": float(pinjaman.total_pinjaman),
        "lama_angsuran": pinjaman.lama_angsuran,
        "nominal_angsuran": float(pinjaman.nominal_angsuran),
        "keperluan": pinjaman.keperluan,
        "status": pinjaman.status,
        "tanggal_persetujuan": pinjaman.tanggal_persetujuan,
        "tanggal_pencairan": pinjaman.tanggal_pencairan,
        "tanggal_lunas": pinjaman.tanggal_lunas,
        "catatan_persetujuan": pinjaman.catatan_persetujuan,
        "sisa_pinjaman": float(pinjaman.sisa_pinjaman),
        "created_at": pinjaman.created_at
    }
    
    return PinjamanResponse(**response_data)
@router.post("/syarat/{id_pinjaman_syarat}/upload", response_model=PinjamanSyaratResponse)
async def upload_pinjaman_syarat(
    id_pinjaman_syarat: int,
    file: UploadFile = File(...),
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Upload dokumen untuk syarat pinjaman (STORED AS BASE64 FOR VERCEL PERSISTENCE)"""
    import base64
    
    # 1. Read file content
    content = await file.read()
    
    # 2. Convert to Base64 Data URL
    encoded = base64.b64encode(content).decode('utf-8')
    data_url = f"data:{file.content_type};base64,{encoded}"

    # 3. Update database directly (no more save_uploaded_file needed)
    update_data = PinjamanSyaratUpdate(
        dokumen_path=data_url,
        is_terpenuhi=True 
    )
    
    return syarat_peminjaman_service.update_pinjaman_syarat(
        db=db,
        id_pinjaman_syarat=id_pinjaman_syarat,
        data=update_data
    )
