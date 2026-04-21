import sys
import os

# Tambahkan path root ke sys.path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.database import engine, Base
from app.models.user import User
from app.models.role import UserPermission

def create_tables():
    print("[STATUS] Sedang membuat tabel 'user_permission'...")
    try:
        # Hanya membuat tabel yang belum ada
        UserPermission.__table__.create(engine)
        print("[SUCCESS] Tabel 'user_permission' berhasil dibuat!")
    except Exception as e:
        if "already exists" in str(e).lower():
            print("[INFO] Tabel 'user_permission' sudah ada.")
        else:
            print(f"[ERROR] Gagal membuat tabel: {e}")

if __name__ == "__main__":
    create_tables()
