from pydantic import BaseModel
from typing import List, Optional

class StatItem(BaseModel):
    label: str
    value: float
    sub: Optional[str] = None

class DashboardStats(BaseModel):
    total_anggota: int
    anggota_aktif: int
    anggota_baru: int
    total_simpanan: float
    simpanan_bulan_ini: float
    total_pinjaman: float
    pinjaman_pending: int
    pinjaman_aktif: int
    angsuran_jatuh_tempo: int
    angsuran_terlambat: int

class ChartItem(BaseModel):
    bulan: str
    setor: float
    tarik: float
    angsuran: float

class RecentSimpanan(BaseModel):
    id_simpanan: int
    nama_anggota: str
    tipe_transaksi: str
    nominal: float
    tanggal_transaksi: str
    nama_jenis_simpanan: Optional[str]

class RecentPinjaman(BaseModel):
    id_pinjaman: int
    no_pinjaman: str
    nama_anggota: str
    nominal_pinjaman: float
    sisa_pinjaman: float
    status: str
    tanggal_pengajuan: str

class RecentAngsuran(BaseModel):
    id_angsuran: int
    nama_anggota: str
    no_pinjaman: str
    angsuran_ke: int
    nominal_angsuran: float
    status: str

class DashboardSummaryResponse(BaseModel):
    stats: DashboardStats
    chart_data: List[ChartItem]
    recent_simpanan: List[RecentSimpanan]
    recent_pinjaman: List[RecentPinjaman]
    recent_angsuran: List[RecentAngsuran]
