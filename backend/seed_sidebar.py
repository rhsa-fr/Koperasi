import os
from app.database import SessionLocal
from app.models.sidebar import MasterSidebar, MasterRoleSidebar
from app.models.role import MasterRole

SIDEBAR_ITEMS = [
    {"label": "Dashboard", "href": "/dashboard", "icon": "LayoutDashboard", "section": "main", "resource": "dashboard", "order_weight": 10},
    {"label": "Manajemen User", "href": "/dashboard/users", "icon": "Users", "section": "admin", "resource": "users", "order_weight": 20},
    {"label": "Anggota", "href": "/dashboard/anggota", "icon": "Users", "section": "data", "resource": "anggota", "order_weight": 30},
    {"label": "Profil Anggota", "href": "/dashboard/profil-anggota", "icon": "UserSquare2", "section": "data", "resource": "profil_anggota", "order_weight": 35},
    {"label": "Jenis Simpanan", "href": "/dashboard/jenis-simpanan", "icon": "Library", "section": "keuangan", "resource": "jenis_simpanan", "order_weight": 38},
    {"label": "Simpanan", "href": "/dashboard/simpanan", "icon": "Wallet", "section": "keuangan", "resource": "simpanan", "order_weight": 40},
    {"label": "Pinjaman", "href": "/dashboard/pinjaman", "icon": "CreditCard", "section": "keuangan", "resource": "pinjaman", "order_weight": 50},
    {"label": "Angsuran", "href": "/dashboard/angsuran", "icon": "ArrowRightLeft", "section": "keuangan", "resource": "angsuran", "order_weight": 60},
    {"label": "Laporan", "href": "/dashboard/laporan", "icon": "FileText", "section": "report", "resource": "laporan", "order_weight": 70},
    {"label": "Manajemen Role", "href": "/dashboard/roles", "icon": "ShieldAlert", "section": "admin", "resource": "roles", "order_weight": 80},
    {"label": "Akses Menu", "href": "/dashboard/menus", "icon": "MenuSquare", "section": "admin", "resource": "menus", "order_weight": 90},
    {"label": "Pengaturan", "href": "/dashboard/settings", "icon": "Settings", "section": "admin", "resource": "settings", "order_weight": 100},
    {"label": "Audit Logs", "href": "/dashboard/audit", "icon": "Activity", "section": "admin", "resource": "audit", "order_weight": 110},
]

def seed_sidebar():
    print("Starting Sidebar Seeding...")
    db = SessionLocal()
    
    try:
        # Clear existing sidebars
        db.query(MasterRoleSidebar).delete()
        db.query(MasterSidebar).delete()
        
        # Add sidebars
        created_sidebars = []
        for item in SIDEBAR_ITEMS:
            sidebar = MasterSidebar(**item)
            db.add(sidebar)
            created_sidebars.append(sidebar)
            
        db.commit()
        print(f"Created {len(created_sidebars)} sidebar menus.")
        
        # Assign ALL sidebars to super_admin
        # Assign Dashboard to all other roles
        roles = db.query(MasterRole).all()
        
        for role in roles:
            for sb in created_sidebars:
                if role.name == "super_admin":
                    # Super admin hanya dapat section 'main' dan 'admin' dan BUKAN pengaturan
                    if sb.section in ["main", "admin"] and sb.resource != "settings":
                        db.add(MasterRoleSidebar(role_id=role.id_role, sidebar_id=sb.id_sidebar))
                else:
                    # Others get mapped based on their permissions (we'll just give Dashboard as default, they can edit later using superadmin dashboard/menus sync)
                    if sb.resource == "dashboard":
                        db.add(MasterRoleSidebar(role_id=role.id_role, sidebar_id=sb.id_sidebar))

        db.commit()
        print("Sidebar mapped to roles successfully!")
        
    except Exception as e:
        print(f"FAILED TO SEED SIDEBAR: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    seed_sidebar()
