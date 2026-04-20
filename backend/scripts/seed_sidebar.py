from sqlalchemy import create_engine, text
from app.config import settings

engine = create_engine(settings.DATABASE_URL)

SIDEBAR_MENUS = [
    # Label, href, icon, section, resource, order
    ('Dashboard',      '/dashboard',                'LayoutDashboard', 'main',     'dashboard', 10),
    ('Anggota',        '/dashboard/anggota',        'Users',           'data',     'anggota',   20),
    ('Profil Anggota', '/dashboard/profil-anggota', 'UserCircle',      'data',     'profil_anggota', 30),
    ('Jenis Simpanan', '/dashboard/jenis-simpanan', 'Wallet',          'keuangan', 'jenis_simpanan', 40),
    ('Simpanan',       '/dashboard/simpanan',       'PiggyBank',       'keuangan', 'simpanan',   50),
    ('Pinjaman',       '/dashboard/pinjaman',       'CreditCard',      'keuangan', 'pinjaman',   60),
    ('Angsuran',       '/dashboard/angsuran',       'Receipt',         'keuangan', 'angsuran',   70),
    ('Laporan',        '/dashboard/laporan',        'FileBarChart2',   'report',   'laporan',    80),
    ('Pengaturan',     '/dashboard/settings',       'Settings',        'report',   'rbac',       90),
    # ── Administrator Section ──
    ('Manajemen User', '/dashboard/users',          'UserCog',         'admin',    'users',     100),
    ('Manajemen Role', '/dashboard/roles',          'Key',             'admin',    'roles',     110),
    ('Manajemen Menu', '/dashboard/menus',          'Layout',          'admin',    'menus',     115),
    ('Audit Log RBAC', '/dashboard/audit',          'History',         'admin',    'audit',     120),
]

def seed_sidebar():
    with engine.begin() as conn:
        print("Seeding sidebar menus...")
        
        # Clear existing
        conn.execute(text("DELETE FROM master_sidebar"))
        
        # Insert new
        for label, href, icon, section, resource, order in SIDEBAR_MENUS:
            conn.execute(text("""
                INSERT INTO master_sidebar (label, href, icon, section, resource, order_weight, is_active)
                VALUES (:label, :href, :icon, :section, :resource, :order, 1)
            """), {"label": label, "href": href, "icon": icon, "section": section, "resource": resource, "order": order})
            
        print(f"Successfully seeded {len(SIDEBAR_MENUS)} sidebar menus.")

        # Default Mappings for Roles
        # ID Roles: 1: super_admin (bypassed), 2: admin, 3: ketua, 4: bendahara
        
        # Get Sidebar IDs
        # 1. Get Super Admin role ID by name
        sa_id = conn.execute(text("SELECT id_role FROM master_role WHERE name = 'super_admin'")).scalar()
        
        # 2. Get all sidebar IDs
        all_sids = conn.execute(text("SELECT id_sidebar FROM master_sidebar")).fetchall()
        
        if sa_id:
            # Super Admin (ALL menus)
            for (sid,) in all_sids:
                # Use INSERT IGNORE or check existence to avoid duplicates if re-run
                conn.execute(text("""
                    INSERT INTO master_role_sidebar (role_id, sidebar_id) 
                    VALUES (:rid, :sid) 
                    ON DUPLICATE KEY UPDATE role_id=role_id
                """), {"rid": sa_id, "sid": sid})

        # Admin (ID 2): All except audit
        admin_resources = ['dashboard', 'anggota', 'profil_anggota', 'jenis_simpanan', 'simpanan', 'pinjaman', 'angsuran', 'laporan', 'rbac', 'users', 'roles', 'menus']
        for res in admin_resources:
            if res in s_map:
                conn.execute(text("INSERT INTO master_role_sidebar (role_id, sidebar_id) VALUES (2, :sid)"), {"sid": s_map[res]})
        
        # Ketua (ID 3): Main + Data + Keuangan (read-only functional) + Laporan
        ketua_resources = ['dashboard', 'anggota', 'profil_anggota', 'jenis_simpanan', 'simpanan', 'pinjaman', 'angsuran', 'laporan']
        for res in ketua_resources:
            if res in s_map:
                conn.execute(text("INSERT INTO master_role_sidebar (role_id, sidebar_id) VALUES (3, :sid)"), {"sid": s_map[res]})

        # Bendahara (ID 4): Main + Keuangan + Laporan
        bendahara_resources = ['dashboard', 'jenis_simpanan', 'simpanan', 'pinjaman', 'angsuran', 'laporan']
        for res in bendahara_resources:
            if res in s_map:
                conn.execute(text("INSERT INTO master_role_sidebar (role_id, sidebar_id) VALUES (4, :sid)"), {"sid": s_map[res]})

        print("Successfully seeded default role-sidebar mappings.")

if __name__ == "__main__":
    seed_sidebar()
