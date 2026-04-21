import os
import sys

# Add parent directory to path so we can import from app
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy import text
from app.database import engine

def alter_role_column():
    print("Mengeksekusi ALTER TABLE pada tabel 'user'...")
    try:
        with engine.begin() as conn:
            # Mengubah dari ENUM menjadi VARCHAR
            conn.execute(text("ALTER TABLE user MODIFY role VARCHAR(50) NOT NULL;"))
            print("Berhasil! Kolom 'role' pada tabel 'user' sekarang sudah menjadi VARCHAR(50).")
    except Exception as e:
        print(f"Gagal mengeksekusi ALTER TABLE: {e}")

if __name__ == "__main__":
    alter_role_column()
