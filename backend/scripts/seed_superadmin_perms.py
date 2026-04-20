from app.database import engine
from sqlalchemy import text

def seed_superadmin_permissions():
    with engine.connect() as conn:
        print("Starting Super Admin Functional Permissions Seeding...")
        
        # 1. Get Super Admin role ID
        sa_id = conn.execute(text("SELECT id_role FROM master_role WHERE name = 'super_admin'")).scalar()
        
        if not sa_id:
            print("ERROR: super_admin role NOT found in master_role table.")
            return

        # 2. Get all permission IDs from master_menu
        all_perms = conn.execute(text("SELECT id_permission FROM master_menu")).fetchall()
        print(f"Found {len(all_perms)} permissions in master_menu.")

        # 3. Map all to Super Admin
        count = 0
        for (pid,) in all_perms:
            # Use INSERT IGNORE/ON DUPLICATE KEY to prevent crashes on re-run
            conn.execute(text("""
                INSERT INTO master_role_menu (role_id, permission_id) 
                VALUES (:rid, :pid)
                ON DUPLICATE KEY UPDATE role_id=role_id
            """), {"rid": sa_id, "pid": pid})
            count += 1
        
        conn.execute(text("COMMIT"))
        print(f"Successfully mapped {count} permissions to Super Admin (Role ID: {sa_id}).")

if __name__ == "__main__":
    seed_superadmin_permissions()
