#!/usr/bin/env python
import sys
import os

# Add parent directory to PYTHONPATH
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.database import SessionLocal, engine
from app.models.role import MasterRole, MasterMenu, MasterRoleMenu
from app.models.sidebar import MasterSidebar, MasterRoleSidebar
from app.core.permissions import PERMISSIONS
from sqlalchemy import text, func

def seed_all():
    db = SessionLocal()
    try:
        print("--- Step 1: Syncing Roles and Permissions ---")
        for role_name, resources in PERMISSIONS.items():
            role = db.query(MasterRole).filter(MasterRole.name == role_name).first()
            if not role:
                role = MasterRole(name=role_name, description=f"Default {role_name} role")
                db.add(role)
                db.commit()
                db.refresh(role)
            
            for resource, actions in resources.items():
                for action in actions:
                    menu = db.query(MasterMenu).filter(MasterMenu.menu == resource, MasterMenu.action == action).first()
                    if not menu:
                        menu = MasterMenu(menu=resource, action=action, description=f"Can {action} on {resource}")
                        db.add(menu)
                        db.commit()
                        db.refresh(menu)
                    
                    mapping = db.query(MasterRoleMenu).filter(MasterRoleMenu.role_id == role.id_role, MasterRoleMenu.permission_id == menu.id_permission).first()
                    if not mapping:
                        mapping = MasterRoleMenu(role_id=role.id_role, permission_id=menu.id_permission)
                        db.add(mapping)
        db.commit()
        print("[OK] Roles and Permissions synced.")

        print("--- Step 2: Seeding Sidebar Menus ---")
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
            ('Manajemen User', '/dashboard/users',          'Users',           'admin',    'users',     100),
            ('Manajemen Role', '/dashboard/roles',          'Key',             'admin',    'roles',     110),
            ('Manajemen Menu', '/dashboard/menus',          'Layout',          'admin',    'menus',     115),
            ('Audit Log',      '/dashboard/audit',          'History',         'admin',    'audit',     120),
        ]

        # Use raw SQL to clear to avoid session issues with cascade or similar
        db.execute(text("DELETE FROM master_role_sidebar"))
        db.execute(text("DELETE FROM master_sidebar"))
        db.commit()

        sidebar_map = {}
        for label, href, icon, section, resource, order in SIDEBAR_MENUS:
            sb = MasterSidebar(label=label, href=href, icon=icon, section=section, resource=resource, order_weight=order)
            db.add(sb)
            db.commit()
            db.refresh(sb)
            sidebar_map[resource] = sb.id_sidebar
        print(f"[OK] {len(SIDEBAR_MENUS)} sidebar items created.")

        print("--- Step 3: Mapping Sidebar to Roles ---")
        role_sidebar_mappings = {
            "super_admin": ["dashboard", "users", "roles", "menus", "audit"],
            "admin": ["dashboard", "anggota", "profil_anggota", "jenis_simpanan", "simpanan", "pinjaman", "angsuran", "laporan", "rbac", "users", "roles"],
            "ketua": ["dashboard", "anggota", "profil_anggota", "jenis_simpanan", "simpanan", "pinjaman", "angsuran", "laporan"],
            "bendahara": ["dashboard", "jenis_simpanan", "simpanan", "pinjaman", "angsuran", "laporan"],
        }

        for role_name, resources in role_sidebar_mappings.items():
            role = db.query(MasterRole).filter(MasterRole.name == role_name).first()
            if role:
                for res in resources:
                    if res in sidebar_map:
                        mapping = MasterRoleSidebar(role_id=role.id_role, sidebar_id=sidebar_map[res])
                        db.add(mapping)
        db.commit()
        print("Sidebar mappings created.")

    except Exception as e:
        print(f"Error during seeding: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    seed_all()
