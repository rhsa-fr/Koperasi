from app.database import engine
from sqlalchemy import text

def force_fix():
    with engine.connect() as conn:
        print("Starting force fix...")
        conn.execute(text("UPDATE pinjaman SET status = 'pending' WHERE id_pinjaman = 6"))
        conn.commit()
        print("Committed.")
        
        res = conn.execute(text("SELECT status FROM pinjaman WHERE id_pinjaman = 6"))
        status = list(res)[0][0]
        print(f"Verified status in DB: |{status}|")

if __name__ == "__main__":
    force_fix()
