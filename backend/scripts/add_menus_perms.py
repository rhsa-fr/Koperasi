from app.database import engine
from sqlalchemy import text

def add_menus_and_map():
    with engine.connect() as conn:
        print("Adding 'menus' resource to master_menu...")
        
        # 1. Add to master_menu
        actions = ['read', 'create', 'update', 'delete']
        for action in actions:
            conn.execute(text("""
                INSERT INTO master_menu (menu, action) 
                VALUES ('menus', :action)
                ON DUPLICATE KEY UPDATE menu=menu
            """), {"action": action})
        
        # 2. Get the new permission IDs
        rows = conn.execute(text("SELECT id_permission FROM master_menu WHERE menu = 'menus'")).fetchall()
        p_ids = [r[0] for r in rows]
        
        # 3. Get Super Admin role ID
        sa_id = conn.execute(text("SELECT id_role FROM master_role WHERE name = 'super_admin'")).scalar()
        
        if sa_id and p_ids:
            print(f"Mapping {len(p_ids)} 'menus' permissions to Super Admin (Role ID: {sa_id})...")
            for pid in p_ids:
                conn.execute(text("""
                    INSERT INTO master_role_menu (role_id, permission_id) 
                    VALUES (:rid, :pid)
                    ON DUPLICATE KEY UPDATE role_id=role_id
                """), {"rid": sa_id, "pid": pid})
        
        conn.execute(text("COMMIT"))
        print("Done.")

if __name__ == "__main__":
    add_menus_and_map()
