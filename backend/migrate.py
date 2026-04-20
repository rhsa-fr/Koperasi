#!/usr/bin/env python
# ============================================================================
# FILE: migrate.py
# Database migration script to create/update tables
# Usage: python migrate.py
# ============================================================================

from app.database import engine, Base
from app.models import (
    user,
    anggota,
    profil_anggota,
    jenis_simpanan,
    simpanan,
    pinjaman,
    angsuran,
    syarat_peminjaman,
    pinjaman_syarat,
    setting,
)

def run_migrations():
    """Create all tables defined in models"""
    print("Running database migrations...")
    
    try:
        Base.metadata.create_all(bind=engine)
        print("✅ Database migration completed successfully!")
        print("All tables have been created/updated.")
    except Exception as e:
        print(f"❌ Migration failed: {e}")
        raise

if __name__ == "__main__":
    run_migrations()
