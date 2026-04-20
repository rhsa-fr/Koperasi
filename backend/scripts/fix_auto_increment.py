from app.database import engine
from sqlalchemy import text

TABLES_TO_FIX = [
    ("master_menu", "id_permission"),
    ("master_role_menu", "id_role_permission"),
    ("master_role", "id_role"),
    ("user", "id_user"),
    ("master_sidebar", "id_sidebar"),
    ("master_role_sidebar", "id_role_sidebar"),
    ("audit_log", "id_audit")
]

def fix_db():
    with engine.connect() as conn:
        print("Starting DB fix for AUTO_INCREMENT...")
        for table, pk in TABLES_TO_FIX:
            try:
                # 1. Get current max ID
                max_id = conn.execute(text(f"SELECT MAX({pk}) FROM {table}")).scalar() or 0
                next_id = max_id + 1
                
                print(f"Fixing table {table} ({pk}), next ID: {next_id}")
                
                # 2. Alter column to include AUTO_INCREMENT
                # Note: We need to know the exact type. They are all Integers.
                sql = f"ALTER TABLE {table} MODIFY COLUMN {pk} INT AUTO_INCREMENT"
                conn.execute(text(sql))
                
                # 3. Set AUTO_INCREMENT start value
                sql_start = f"ALTER TABLE {table} AUTO_INCREMENT = {next_id}"
                conn.execute(text(sql_start))
                
                # 4. Commit (MySQL doesn't need commit for DDL but SQLAlchemy session might)
                conn.execute(text("COMMIT"))
                print(f"Table {table} fixed.")
            except Exception as e:
                print(f"Error fixing table {table}: {e}")
                conn.execute(text("ROLLBACK"))

if __name__ == "__main__":
    fix_db()
