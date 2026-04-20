# ============================================================================
# FILE: app/models/setting.py
# ============================================================================

from sqlalchemy import Column, Integer, String, DECIMAL, Text, TIMESTAMP
from sqlalchemy.sql import func
from app.database import Base


class KoperasiSetting(Base):
    __tablename__ = "koperasi_setting"

    id_setting = Column(Integer, primary_key=True, index=True, autoincrement=True)
    
    # Informasi Koperasi
    nama_koperasi = Column(String(200), nullable=False, default='Koperasi Sijam')
    deskripsi = Column(Text, nullable=True)
    alamat = Column(Text, nullable=True)
    no_telepon = Column(String(20), nullable=True)
    email = Column(String(100), nullable=True)
    
    # Pengaturan Pinjaman
    bunga_default = Column(DECIMAL(5, 2), nullable=False, default=2.0, comment="Bunga pinjaman default (%)")
    denda_keterlambatan = Column(DECIMAL(5, 2), nullable=False, default=1.0, comment="Denda keterlambatan angsuran (%)")
    min_nominal_pinjaman = Column(DECIMAL(15, 2), nullable=False, default=100000, comment="Minimal nominal pinjaman (Rp)")
    max_nominal_pinjaman = Column(DECIMAL(15, 2), nullable=True, comment="Maksimal nominal pinjaman (Rp)")
    max_lama_angsuran = Column(Integer, nullable=False, default=60, comment="Maksimal lama angsuran (bulan)")
    
    # Pengaturan Simpanan
    saldo_minimal_simpanan = Column(DECIMAL(15, 2), nullable=False, default=50000, comment="Saldo minimal simpanan (Rp)")
    
    # Lainnya
    created_at = Column(TIMESTAMP, server_default=func.now())
    updated_at = Column(TIMESTAMP, server_default=func.now(), onupdate=func.now())
