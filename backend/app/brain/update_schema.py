from app.database import engine
from sqlalchemy import text

def update_schema():
    with engine.connect() as conn:
        try:
            print("Updating pinjaman status enum...")
            conn.execute(text("ALTER TABLE pinjaman MODIFY COLUMN status ENUM('pending','disetujui','ditolak','lunas','dikembalikan') DEFAULT 'pending'"))
            conn.commit()
            print("Schema updated successfully.")
        except Exception as e:
            print(f"Error: {e}")
            conn.rollback()

if __name__ == "__main__":
    update_schema()
