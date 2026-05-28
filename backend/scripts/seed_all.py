#!/usr/bin/env python
import sys
import os

# Add parent directory to PYTHONPATH
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.database import SessionLocal, engine
from app.models.role import MasterRole, MasterMenu, MasterRoleMenu
from app.models.sidebar import MasterSidebar, MasterRoleSidebar
from app.models.user import User
# Register all models to prevent Mapper relationship resolution errors
from app.models import (
    anggota,
    profil_anggota,
    jenis_simpanan,
    simpanan,
    pinjaman,
    angsuran,
    syarat_peminjaman,
    pinjaman_syarat,
    pinjaman_history,
    setting,
)
from app.core.security import hash_password
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

        print("--- Step 4: Seeding Superadmin User ---")
        sa_user = db.query(User).filter(User.username == "superadmin").first()
        if not sa_user:
            hashed_pw = hash_password("superadmin123")
            sa_user = User(
                username="superadmin",
                password=hashed_pw,
                role="super_admin",
                is_active=True
            )
            db.add(sa_user)
            db.commit()
            print("[OK] Superadmin user created (username: superadmin, password: superadmin123)")
        else:
            print("[INFO] Superadmin user already exists.")

        print("--- Step 5: Seeding Master Syarat Peminjaman ---")
        from app.models.syarat_peminjaman import SyaratPeminjaman
        
        MASTER_SYARAT = [
            {
                "kode_syarat": "SYR001",
                "nama_syarat": "Fotocopy KTP",
                "deskripsi": "Fotocopy KTP anggota yang masih berlaku",
                "is_wajib": True,
                "min_nominal_pinjaman": None,
                "dokumen_diperlukan": "KTP",
                "urutan": 10
            },
            {
                "kode_syarat": "SYR002",
                "nama_syarat": "Fotocopy KK",
                "deskripsi": "Fotocopy Kartu Keluarga",
                "is_wajib": True,
                "min_nominal_pinjaman": None,
                "dokumen_diperlukan": "KK",
                "urutan": 20
            },
            {
                "kode_syarat": "SYR005",
                "nama_syarat": "Surat Pernyataan",
                "deskripsi": "Surat pernyataan sanggup membayar angsuran",
                "is_wajib": True,
                "min_nominal_pinjaman": None,
                "dokumen_diperlukan": "Surat Pernyataan",
                "urutan": 30
            },
            {
                "kode_syarat": "SYR006",
                "nama_syarat": "Pas Foto 4x6",
                "deskripsi": "Pas foto terbaru ukuran 4x6",
                "is_wajib": False,
                "min_nominal_pinjaman": None,
                "dokumen_diperlukan": "Pas Foto",
                "urutan": 40
            },
            {
                "kode_syarat": "SYR003",
                "nama_syarat": "Slip Gaji",
                "deskripsi": "Slip gaji 3 bulan terakhir",
                "is_wajib": True,
                "min_nominal_pinjaman": 5000000.0,
                "dokumen_diperlukan": "Slip Gaji",
                "urutan": 50
            },
            {
                "kode_syarat": "SYR004",
                "nama_syarat": "Jaminan BPKB",
                "deskripsi": "BPKB kendaraan sebagai jaminan",
                "is_wajib": True,
                "min_nominal_pinjaman": 10000000.0,
                "dokumen_diperlukan": "BPKB",
                "urutan": 60
            },
            {
                "kode_syarat": "SYR007",
                "nama_syarat": "NPWP",
                "deskripsi": "Nomor Pokok Wajib Pajak",
                "is_wajib": False,
                "min_nominal_pinjaman": 20000000.0,
                "dokumen_diperlukan": "NPWP",
                "urutan": 70
            },
            {
                "kode_syarat": "SYR008",
                "nama_syarat": "Sertifikat Rumah",
                "deskripsi": "Sertifikat rumah sebagai jaminan tambahan",
                "is_wajib": False,
                "min_nominal_pinjaman": 50000000.0,
                "dokumen_diperlukan": "Sertifikat",
                "urutan": 80
            }
        ]

        for s_data in MASTER_SYARAT:
            existing_syarat = db.query(SyaratPeminjaman).filter(SyaratPeminjaman.kode_syarat == s_data["kode_syarat"]).first()
            if not existing_syarat:
                new_s = SyaratPeminjaman(
                    kode_syarat=s_data["kode_syarat"],
                    nama_syarat=s_data["nama_syarat"],
                    deskripsi=s_data["deskripsi"],
                    is_wajib=s_data["is_wajib"],
                    min_nominal_pinjaman=s_data["min_nominal_pinjaman"],
                    dokumen_diperlukan=s_data["dokumen_diperlukan"],
                    urutan=s_data["urutan"],
                    is_active=True
                )
                db.add(new_s)
        db.commit()
        print("[OK] Master Syarat Peminjaman seeded.")

    except Exception as e:
        print(f"Error during seeding: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    seed_all()
