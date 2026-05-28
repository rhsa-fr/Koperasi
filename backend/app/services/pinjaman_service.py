# ============================================================================
# FILE: app/services/pinjaman_service.py
# ============================================================================

from sqlalchemy.orm import Session, joinedload
from sqlalchemy import and_
from typing import List, Optional
from datetime import date, datetime, timedelta
from app.models.pinjaman import Pinjaman, StatusPinjaman
from app.models.pinjaman_history import PinjamanHistory

from app.models.anggota import Anggota
from app.models.angsuran import Angsuran, StatusAngsuran
from app.schemas.pinjaman import (
    PinjamanCreate, PinjamanApprove, PinjamanReject, PinjamanReturn,
    PinjamanCalculation, PinjamanUpdate
)
from app.services import syarat_peminjaman_service
from app.core.exceptions import NotFoundException, BadRequestException, BusinessLogicException
from app.config import settings
from app.models.setting import KoperasiSetting


def generate_no_pinjaman() -> str:
    """Generate nomor pinjaman unik (PJM-YYYYMMDD-HHMMSS-ms)"""
    now = datetime.now()
    return f"PJM-{now.strftime('%Y%m%d')}-{now.strftime('%H%M%S')}-{now.microsecond // 1000:03d}"


def _log_history(
    db: Session,
    pinjaman: Pinjaman,
    status: StatusPinjaman,
    id_user: Optional[int] = None,
    catatan: Optional[str] = None
):
    """Log history perubahan status pinjaman."""
    entry = PinjamanHistory(
        id_pinjaman=pinjaman.id_pinjaman,
        id_user=id_user,
        status=status.value if hasattr(status, 'value') else status,
        catatan=catatan,
    )
    db.add(entry)
    db.flush()


def calculate_pinjaman(
    nominal_pinjaman: float,
    bunga_persen: float,
    lama_angsuran: int
) -> PinjamanCalculation:
    """Kalkulasi pinjaman"""
    total_bunga = nominal_pinjaman * (bunga_persen / 100) * lama_angsuran
    total_pinjaman = nominal_pinjaman + total_bunga
    nominal_angsuran = total_pinjaman / lama_angsuran

    return PinjamanCalculation(
        nominal_pinjaman=nominal_pinjaman,
        bunga_persen=bunga_persen,
        lama_angsuran=lama_angsuran,
        total_bunga=total_bunga,
        total_pinjaman=total_pinjaman,
        nominal_angsuran=nominal_angsuran
    )


def create_pinjaman(
    db: Session,
    data: PinjamanCreate,
    id_user: int
) -> Pinjaman:
    """Create pengajuan pinjaman"""
    # Validasi anggota
    anggota = db.query(Anggota).filter(Anggota.id_anggota == data.id_anggota).first()
    if not anggota:
        raise NotFoundException("Anggota tidak ditemukan")
    
    if anggota.status != "aktif":
        raise BusinessLogicException("Anggota tidak aktif")
    
    # Validasi pinjaman aktif
    pinjaman_aktif = db.query(Pinjaman).filter(
        and_(
            Pinjaman.id_anggota == data.id_anggota,
            Pinjaman.status.in_([StatusPinjaman.PENDING, StatusPinjaman.DISETUJUI])
        )
    ).first()
    
    if pinjaman_aktif:
        raise BusinessLogicException(
            "Anggota masih memiliki pinjaman aktif atau pending"
        )
    
    # Validasi terhadap Setting Koperasi
    koperasi_setting = db.query(KoperasiSetting).first()
    if koperasi_setting:
        if koperasi_setting.max_nominal_pinjaman and float(data.nominal_pinjaman) > float(koperasi_setting.max_nominal_pinjaman):
            raise BusinessLogicException(
                f"Nominal pinjaman melebihi batas maksimal yang diizinkan (Rp {float(koperasi_setting.max_nominal_pinjaman):,.0f})"
            )
        if float(data.nominal_pinjaman) < float(koperasi_setting.min_nominal_pinjaman):
            raise BusinessLogicException(
                f"Nominal pinjaman kurang dari batas minimal yang diizinkan (Rp {float(koperasi_setting.min_nominal_pinjaman):,.0f})"
            )
    
    # Kalkulasi
    calc = calculate_pinjaman(
        float(data.nominal_pinjaman),
        float(data.bunga_persen),
        data.lama_angsuran
    )
    
    # Create pinjaman
    pinjaman = Pinjaman(
        id_anggota=data.id_anggota,
        no_pinjaman=generate_no_pinjaman(),
        tanggal_pengajuan=data.tanggal_pengajuan,
        nominal_pinjaman=data.nominal_pinjaman,
        bunga_persen=data.bunga_persen,
        total_bunga=calc.total_bunga,
        total_pinjaman=calc.total_pinjaman,
        lama_angsuran=data.lama_angsuran,
        nominal_angsuran=calc.nominal_angsuran,
        keperluan=data.keperluan,
        status=StatusPinjaman.PENDING,
        sisa_pinjaman=calc.total_pinjaman,
        id_user_pengaju=id_user
    )

    db.add(pinjaman)
    db.flush()

    # Log initial pending status
    _log_history(db, pinjaman, StatusPinjaman.PENDING, id_user=id_user)

    try:
        syarat_peminjaman_service.attach_syarat_to_pinjaman(
            db=db,
            id_pinjaman=pinjaman.id_pinjaman,
            nominal_pinjaman=float(data.nominal_pinjaman)
        )
    except Exception:
        pass

    db.commit()
    db.refresh(pinjaman)
    
    # Generate Notifikasi untuk Approver
    try:
        from app.models.notifikasi import Notifikasi
        from app.models.user import User
        from app.core.permissions import get_user_effective_permissions
        
        # Get all users EXCEPT super_admin
        potential_approvers = db.query(User).filter(User.role != 'super_admin').all()
        
        formatted_nominal = f"{float(pinjaman.nominal_pinjaman):,.0f}".replace(",", ".")
        nama_peminjam = anggota.nama_lengkap or anggota.email or str(anggota.id_anggota)
        
        for user in potential_approvers:
            perms = get_user_effective_permissions(db, user.id_user, user.role)
            pinjaman_actions = perms.get("pinjaman", [])
            
            if "verify" in pinjaman_actions or "approve" in pinjaman_actions:
                notif = Notifikasi(
                    id_user=user.id_user,
                    tipe='info',
                    judul='Pengajuan Pinjaman Baru 📄',
                    pesan=f"Anggota {nama_peminjam} mengajukan pinjaman senilai Rp {formatted_nominal} ({pinjaman.no_pinjaman}). Perlu verifikasi.",
                    is_read=False
                )
                db.add(notif)
        db.commit()
    except Exception as e:
        print("Gagal mengirim notif pengajuan:", e)
    
    return pinjaman


def approve_pinjaman(
    db: Session,
    id_pinjaman: int,
    data: PinjamanApprove,
    id_user: int
) -> Pinjaman:
    """Approve pinjaman by ketua"""
    pinjaman = db.query(Pinjaman).filter(Pinjaman.id_pinjaman == id_pinjaman).first()
    if not pinjaman:
        raise NotFoundException("Pinjaman tidak ditemukan")
    
    if pinjaman.status != StatusPinjaman.PENDING:
        raise BusinessLogicException("Pinjaman sudah diproses sebelumnya")
    
    # Validasi kelengkapan syarat
    if not syarat_peminjaman_service.check_syarat_before_approve(db, id_pinjaman):
        raise BusinessLogicException("Syarat wajib belum terpenuhi")
    
    # Update pinjaman
    pinjaman.status = StatusPinjaman.DISETUJUI
    pinjaman.tanggal_persetujuan = data.tanggal_persetujuan or date.today()
    pinjaman.tanggal_pencairan = data.tanggal_pencairan
    pinjaman.catatan_persetujuan = data.catatan_persetujuan
    pinjaman.id_user_persetujuan = id_user

    _log_history(db, pinjaman, StatusPinjaman.DISETUJUI, id_user=id_user, catatan=data.catatan_persetujuan)
    db.commit()
    db.refresh(pinjaman)

    # Generate angsuran schedule
    from app.services.angsuran_service import generate_angsuran_schedule
    generate_angsuran_schedule(db, pinjaman)
    
    # Generate Notifikasi untuk Peminjam
    try:
        from app.models.notifikasi import Notifikasi
        from app.models.user import User
        from sqlalchemy import or_
        anggota = pinjaman.anggota
        user_anggota = db.query(User).filter(
            or_(
                User.username == anggota.no_anggota,
                User.username == anggota.email
            )
        ).first()
        
        if user_anggota:
            formatted_nominal = f"{float(pinjaman.nominal_pinjaman):,.0f}".replace(",", ".")
            notif = Notifikasi(
                id_user=user_anggota.id_user,
                tipe='success',
                judul='Pinjaman Disetujui! 🎉',
                pesan=f"Pengajuan pinjaman Anda ({pinjaman.no_pinjaman}) senilai Rp {formatted_nominal} telah disetujui. Silakan cek detail pencairan.",
                is_read=False
            )
            db.add(notif)
            db.commit()
    except Exception as e:
        print("Gagal mengirim notif approval:", e)
    
    return pinjaman


def reject_pinjaman(
    db: Session,
    id_pinjaman: int,
    data: PinjamanReject,
    id_user: int
) -> Pinjaman:
    """Reject pinjaman by ketua"""
    pinjaman = db.query(Pinjaman).filter(Pinjaman.id_pinjaman == id_pinjaman).first()
    if not pinjaman:
        raise NotFoundException("Pinjaman tidak ditemukan")
    
    if pinjaman.status != StatusPinjaman.PENDING:
        raise BusinessLogicException("Pinjaman sudah diproses sebelumnya")
    
    # Update pinjaman
    pinjaman.status = StatusPinjaman.DITOLAK
    pinjaman.tanggal_persetujuan = data.tanggal_persetujuan or date.today()
    pinjaman.catatan_persetujuan = data.catatan_persetujuan
    pinjaman.id_user_persetujuan = id_user

    _log_history(db, pinjaman, StatusPinjaman.DITOLAK, id_user=id_user, catatan=data.catatan_persetujuan)
    db.commit()
    db.refresh(pinjaman)

    # Generate Notifikasi untuk Peminjam
    try:
        from app.models.notifikasi import Notifikasi
        from app.models.user import User
        anggota = pinjaman.anggota
        user_anggota = db.query(User).filter(User.username == anggota.no_anggota).first()
        
        if user_anggota:
            formatted_nominal = f"{float(pinjaman.nominal_pinjaman):,.0f}".replace(",", ".")
            notif = Notifikasi(
                id_user=user_anggota.id_user,
                tipe='warning',
                judul='Pinjaman Ditolak ❌',
                pesan=f"Mohon maaf, pengajuan pinjaman Anda ({pinjaman.no_pinjaman}) senilai Rp {formatted_nominal} tidak dapat disetujui. Catatan: {data.catatan_persetujuan or '-'}",
                is_read=False
            )
            db.add(notif)
            db.commit()
    except Exception as e:
        print("Gagal mengirim notif penolakan:", e)
    
    return pinjaman


def return_pinjaman(
    db: Session,
    id_pinjaman: int,
    data: PinjamanReturn,
    id_user: int
) -> Pinjaman:
    """Return pinjaman for revision"""
    pinjaman = db.query(Pinjaman).filter(Pinjaman.id_pinjaman == id_pinjaman).first()
    if not pinjaman:
        raise NotFoundException("Pinjaman tidak ditemukan")
    
    if pinjaman.status != StatusPinjaman.PENDING:
        raise BusinessLogicException("Pinjaman sudah diproses sebelumnya")
    
    # Update pinjaman
    pinjaman.status = StatusPinjaman.DIKEMBALIKAN
    pinjaman.tanggal_persetujuan = data.tanggal_persetujuan or date.today()
    pinjaman.catatan_persetujuan = data.catatan_persetujuan
    pinjaman.id_user_persetujuan = id_user

    _log_history(db, pinjaman, StatusPinjaman.DIKEMBALIKAN, id_user=id_user, catatan=data.catatan_persetujuan)
    db.commit()
    db.refresh(pinjaman)

    # Generate Notifikasi untuk Peminjam
    try:
        from app.models.notifikasi import Notifikasi
        from app.models.user import User
        anggota = pinjaman.anggota
        user_anggota = db.query(User).filter(User.username == anggota.no_anggota).first()
        
        if user_anggota:
            formatted_nominal = f"{float(pinjaman.nominal_pinjaman):,.0f}".replace(",", ".")
            notif = Notifikasi(
                id_user=user_anggota.id_user,
                tipe='info',
                judul='Pinjaman Dikembalikan 🔄',
                pesan=f"Pengajuan pinjaman Anda ({pinjaman.no_pinjaman}) senilai Rp {formatted_nominal} dikembalikan untuk direvisi. Catatan: {data.catatan_persetujuan or '-'}",
                is_read=False
            )
            db.add(notif)
            db.commit()
    except Exception as e:
        print("Gagal mengirim notif pengembalian:", e)
    
    return pinjaman


def update_pinjaman(
    db: Session,
    id_pinjaman: int,
    data: PinjamanUpdate,
    id_user: int
) -> Pinjaman:
    """Update pinjaman (hanya yang masih pending atau dikembalikan)"""
    pinjaman = db.query(Pinjaman).filter(Pinjaman.id_pinjaman == id_pinjaman).first()
    if not pinjaman:
        raise NotFoundException("Pinjaman tidak ditemukan")
    
    if pinjaman.status not in [StatusPinjaman.PENDING, StatusPinjaman.DIKEMBALIKAN]:
        raise BusinessLogicException("Hanya pinjaman pending atau revisi yang bisa diupdate")
    
    # Jika diupdate dari status dikembalikan, kembalikan ke pending agar muncul di antrean verifikasi lagi
    was_revisi = pinjaman.status == StatusPinjaman.DIKEMBALIKAN
    if was_revisi:
        pinjaman.status = StatusPinjaman.PENDING
    
    # Update fields
    if data.keperluan is not None:
        pinjaman.keperluan = data.keperluan
    
    # Update nominal, bunga, lama angsuran dan hitung ulang kalkulasi
    if data.nominal_pinjaman is not None or data.bunga_persen is not None or data.lama_angsuran is not None:
        nominal = float(data.nominal_pinjaman) if data.nominal_pinjaman is not None else float(pinjaman.nominal_pinjaman)
        bunga = float(data.bunga_persen) if data.bunga_persen is not None else float(pinjaman.bunga_persen)
        lama = data.lama_angsuran if data.lama_angsuran is not None else pinjaman.lama_angsuran
        
        calc = calculate_pinjaman(nominal, bunga, lama)
        
        pinjaman.nominal_pinjaman = nominal
        pinjaman.bunga_persen = bunga
        pinjaman.lama_angsuran = lama
        pinjaman.total_bunga = calc.total_bunga
        pinjaman.total_pinjaman = calc.total_pinjaman
        pinjaman.nominal_angsuran = calc.nominal_angsuran
        pinjaman.sisa_pinjaman = calc.total_pinjaman
        
        # Sinkronisasi checklist syarat di database tanpa menghapus dokumen yang masih berlaku!
        syarat_peminjaman_service.sync_syarat_pinjaman(db, pinjaman.id_pinjaman, nominal)
    
    if was_revisi:
        catatan_log = data.catatan_revisi if data.catatan_revisi else "Revisi dikirim ulang"
        _log_history(db, pinjaman, StatusPinjaman.PENDING, id_user=id_user, catatan=catatan_log)

    db.commit()
    db.refresh(pinjaman)
    
    return pinjaman


def get_pinjaman_list(
    db: Session,
    skip: int = 0,
    limit: int = 10,
    id_anggota: Optional[int] = None,
    status: Optional[str] = None,
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    search: Optional[str] = None
) -> tuple[List[Pinjaman], int]:
    """Get list pinjaman dengan filter"""
    query = db.query(Pinjaman).options(joinedload(Pinjaman.history), joinedload(Pinjaman.anggota))
    
    if id_anggota:
        query = query.filter(Pinjaman.id_anggota == id_anggota)
    
    if status:
        query = query.filter(Pinjaman.status == status)
    
    if search:
        from sqlalchemy import or_
        query = query.join(Anggota).filter(
            or_(
                Pinjaman.no_pinjaman.ilike(f"%{search}%"),
                Anggota.nama_lengkap.ilike(f"%{search}%")
            )
        )

    if start_date:
        query = query.filter(Pinjaman.tanggal_pengajuan >= start_date)
    
    if end_date:
        query = query.filter(Pinjaman.tanggal_pengajuan <= end_date)
    
    total = query.count()
    pinjaman_list = query.order_by(Pinjaman.created_at.desc()).offset(skip).limit(limit).all()
    
    return pinjaman_list, total


def get_pinjaman_by_id(db: Session, id_pinjaman: int) -> Pinjaman:
    """Get pinjaman by ID"""
    pinjaman = db.query(Pinjaman).options(joinedload(Pinjaman.history), joinedload(Pinjaman.anggota)).filter(Pinjaman.id_pinjaman == id_pinjaman).first()
    if not pinjaman:
        raise NotFoundException("Pinjaman tidak ditemukan")
    return pinjaman


def get_pinjaman_pending(db: Session) -> List[Pinjaman]:
    """Get semua pinjaman pending approval"""
    return db.query(Pinjaman).filter(
        Pinjaman.status == StatusPinjaman.PENDING
    ).order_by(Pinjaman.tanggal_pengajuan.asc()).all()


def check_pinjaman_lunas(db: Session, id_pinjaman: int):
    """Check dan update status pinjaman jika sudah lunas"""
    pinjaman = get_pinjaman_by_id(db, id_pinjaman)
    
    if pinjaman.status != StatusPinjaman.DISETUJUI:
        return
    
    # Check semua angsuran
    angsuran_belum_lunas = db.query(Angsuran).filter(
    and_(
        Angsuran.id_pinjaman == id_pinjaman,
        Angsuran.status == StatusAngsuran.BELUM_BAYAR 
        )
    ).count()
    
    if angsuran_belum_lunas == 0:
        pinjaman.status = StatusPinjaman.LUNAS
        pinjaman.tanggal_lunas = date.today()
        pinjaman.sisa_pinjaman = 0
        db.commit()