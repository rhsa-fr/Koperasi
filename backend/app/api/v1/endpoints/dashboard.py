from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func, extract
from datetime import datetime, timedelta
from app.database import get_db
from app.models.anggota import Anggota, StatusAnggota
from app.models.simpanan import Simpanan
from app.models.pinjaman import Pinjaman
from app.models.angsuran import Angsuran
from app.schemas.dashboard import DashboardSummaryResponse, DashboardStats, ChartItem, RecentSimpanan, RecentPinjaman, RecentAngsuran
from app.core.permissions import require_permission

router = APIRouter()

@router.get("/summary", response_model=DashboardSummaryResponse)
def get_dashboard_summary(
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_permission("dashboard", "read"))
):
    now = datetime.now()
    this_month_start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
    
    # 1. Stats Anggota
    total_anggota = db.query(func.count(Anggota.id_anggota)).scalar() or 0
    anggota_aktif = db.query(func.count(Anggota.id_anggota)).filter(Anggota.status == 'aktif').scalar() or 0
    anggota_baru = db.query(func.count(Anggota.id_anggota)).filter(Anggota.created_at >= this_month_start).scalar() or 0
    
    # 2. Stats Simpanan
    # Sum nominal with direction based on tipe_transaksi
    total_simpanan_setor = db.query(func.sum(Simpanan.nominal)).filter(Simpanan.tipe_transaksi == 'setor').scalar() or 0
    total_simpanan_tarik = db.query(func.sum(Simpanan.nominal)).filter(Simpanan.tipe_transaksi == 'tarik').scalar() or 0
    total_simpanan = total_simpanan_setor - total_simpanan_tarik
    
    simpanan_mo_setor = db.query(func.sum(Simpanan.nominal)).filter(Simpanan.tipe_transaksi == 'setor', Simpanan.tanggal_transaksi >= this_month_start).scalar() or 0
    simpanan_mo_tarik = db.query(func.sum(Simpanan.nominal)).filter(Simpanan.tipe_transaksi == 'tarik', Simpanan.tanggal_transaksi >= this_month_start).scalar() or 0
    simpanan_bulan_ini = simpanan_mo_setor - simpanan_mo_tarik
    
    # 3. Stats Pinjaman
    total_pinjaman = db.query(func.sum(Pinjaman.sisa_pinjaman)).filter(Pinjaman.status == 'disetujui').scalar() or 0
    pinjaman_pending = db.query(func.count(Pinjaman.id_pinjaman)).filter(Pinjaman.status == 'menunggu').scalar() or 0
    pinjaman_aktif = db.query(func.count(Pinjaman.id_pinjaman)).filter(Pinjaman.status == 'disetujui').scalar() or 0
    
    # 4. Stats Angsuran
    angsuran_jatuh_tempo = db.query(func.count(Angsuran.id_angsuran)).filter(Angsuran.status == 'belum_bayar').scalar() or 0
    angsuran_terlambat = db.query(func.count(Angsuran.id_angsuran)).filter(Angsuran.status == 'terlambat').scalar() or 0
    
    # 5. Chart Data (Last 6 Months)
    chart_data = []
    for i in range(5, -1, -1):
        # Month calculation
        target_date = now - timedelta(days=i*30) # Rough estimate for month subtraction
        target_month = target_date.month
        target_year = target_date.year
        
        # Correctly get start and end of that month
        start_date = datetime(target_year, target_month, 1)
        if target_month == 12:
            end_date = datetime(target_year + 1, 1, 1)
        else:
            end_date = datetime(target_year, target_month + 1, 1)
            
        setor = db.query(func.sum(Simpanan.nominal)).filter(Simpanan.tipe_transaksi == 'setor', Simpanan.tanggal_transaksi >= start_date, Simpanan.tanggal_transaksi < end_date).scalar() or 0
        tarik = db.query(func.sum(Simpanan.nominal)).filter(Simpanan.tipe_transaksi == 'tarik', Simpanan.tanggal_transaksi >= start_date, Simpanan.tanggal_transaksi < end_date).scalar() or 0
        angsuran_val = db.query(func.sum(Angsuran.nominal_angsuran)).filter(Angsuran.status == 'lunas', Angsuran.tanggal_bayar >= start_date, Angsuran.tanggal_bayar < end_date).scalar() or 0
        
        chart_data.append(ChartItem(
            bulan=start_date.strftime('%Y-%m'),
            setor=float(setor),
            tarik=float(tarik),
            angsuran=float(angsuran_val)
        ))
    
    # 6. Recent Lists
    recent_simpanan = db.query(Simpanan, Anggota.nama_lengkap).join(Anggota).order_by(Simpanan.created_at.desc()).limit(5).all()
    recent_pinjaman = db.query(Pinjaman, Anggota.nama_lengkap).join(Anggota).order_by(Pinjaman.created_at.desc()).limit(5).all()
    recent_angsuran = db.query(Angsuran, Anggota.nama_lengkap, Pinjaman.no_pinjaman).join(Anggota).join(Pinjaman).filter(Angsuran.status == 'belum_bayar').order_by(Angsuran.tanggal_jatuh_tempo.asc()).limit(5).all()
    
    return DashboardSummaryResponse(
        stats=DashboardStats(
            total_anggota=total_anggota,
            anggota_aktif=anggota_aktif,
            anggota_baru=anggota_baru,
            total_simpanan=float(total_simpanan),
            simpanan_bulan_ini=float(simpanan_bulan_ini),
            total_pinjaman=float(total_pinjaman),
            pinjaman_pending=pinjaman_pending,
            pinjaman_aktif=pinjaman_aktif,
            angsuran_jatuh_tempo=angsuran_jatuh_tempo,
            angsuran_terlambat=angsuran_terlambat
        ),
        chart_data=chart_data,
        recent_simpanan=[
            RecentSimpanan(
                id_simpanan=s.Simpanan.id_simpanan,
                nama_anggota=s.nama_lengkap,
                tipe_transaksi=s.Simpanan.tipe_transaksi,
                nominal=float(s.Simpanan.nominal),
                tanggal_transaksi=s.Simpanan.tanggal_transaksi.strftime('%Y-%m-%d %H:%M'),
                nama_jenis_simpanan=getattr(s.Simpanan.jenis_simpanan, 'nama_jenis', None) if hasattr(s.Simpanan, 'jenis_simpanan') else None
            ) for s in recent_simpanan
        ],
        recent_pinjaman=[
            RecentPinjaman(
                id_pinjaman=p.Pinjaman.id_pinjaman,
                no_pinjaman=p.Pinjaman.no_pinjaman,
                nama_anggota=p.nama_lengkap,
                nominal_pinjaman=float(p.Pinjaman.nominal_pinjaman),
                sisa_pinjaman=float(p.Pinjaman.sisa_pinjaman),
                status=p.Pinjaman.status,
                tanggal_pengajuan=p.Pinjaman.tanggal_pengajuan.strftime('%Y-%m-%d')
            ) for p in recent_pinjaman
        ],
        recent_angsuran=[
            RecentAngsuran(
                id_angsuran=a.Angsuran.id_angsuran,
                nama_anggota=a.nama_lengkap,
                no_pinjaman=a.no_pinjaman,
                angsuran_ke=a.Angsuran.angsuran_ke,
                nominal_angsuran=float(a.Angsuran.nominal_angsuran),
                status=a.Angsuran.status
            ) for a in recent_angsuran
        ]
    )
