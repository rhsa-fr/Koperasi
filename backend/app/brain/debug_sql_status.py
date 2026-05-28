from app.database import SessionLocal, engine
from sqlalchemy import text

def debug_pinjaman_data():
    with engine.connect() as conn:
        # Check raw database values
        result = conn.execute(text("SELECT id_pinjaman, no_pinjaman, status FROM pinjaman"))
        print("Checking all records raw values:")
        for row in result:
            print(f"ID: {row[0]} | No: {row[1]} | Raw Status: '{row[2]}'")
            
        # Check specifically for problematic ones
        result = conn.execute(text("SELECT id_pinjaman, no_pinjaman, status FROM pinjaman WHERE status = '' OR status IS NULL"))
        problem_rows = list(result)
        print(f"\nFound {len(problem_rows)} problematic records (empty or null).")
        
        if problem_rows:
            for row in problem_rows:
                print(f"Fixing ID {row[0]}...")
                conn.execute(text("UPDATE pinjaman SET status = 'pending' WHERE id_pinjaman = :id"), {"id": row[0]})
            conn.commit()
            print("Fixed with raw SQL commit.")

if __name__ == "__main__":
    debug_pinjaman_data()
