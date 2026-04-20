#!/usr/bin/env python
# ============================================================================
# FILE: scripts/seed_rbac.py
# ============================================================================
import sys
import os

# Menambahkan parent directory ke PYTHONPATH agar bisa me-resolve 'app' module
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.database import SessionLocal
from app.models.role import MasterRole, MasterMenu, MasterRoleMenu
from app.core.permissions import PERMISSIONS
from sqlalchemy import text, func

# Import model-model lain untuk resolve internal relasi
import app.models.user
import app.models.anggota
import app.models.profil_anggota
import app.models.jenis_simpanan
import app.models.simpanan
import app.models.pinjaman
import app.models.angsuran
import app.models.syarat_peminjaman
import app.models.pinjaman_syarat
import app.models.setting
import app.models.role
def seed_rbac():
    db = SessionLocal()
    try:
        print("[INIT] Memulai sinkronisasi RBAC dari app/core/permissions.py ke Database...")
        
        # Determine starting IDs by checking current max
        max_menu = db.query(func.max(MasterMenu.id_permission)).scalar() or 0
        max_role_menu = db.query(func.max(MasterRoleMenu.id_role_permission)).scalar() or 0
        
        next_menu_id = max_menu + 1
        next_role_menu_id = max_role_menu + 1

        # Iterasi setiap Role di dalam PERMISSIONS auth 
        for role_name, resources in PERMISSIONS.items():
            
            # 1. Pastikan Role sudah terdaftar
            role_obj = db.query(MasterRole).filter(MasterRole.name == role_name).first()
            if not role_obj:
                max_role = db.query(func.max(MasterRole.id_role)).scalar() or 0
                role_obj = MasterRole(
                    id_role=max_role + 1,
                    name=role_name,
                    description=f"Generated via seeder for '{role_name}'",
                    is_active=True
                )
                db.add(role_obj)
                db.commit()
                db.refresh(role_obj)
                print(f"[OK] MasterRole '{role_name}' berhasil ditambahkan.")

            # 2. Extract resource & action
            for menu_name, actions in resources.items():
                for action_name in actions:
                    
                    # 3. Pastikan resource-action terdaftar di master_menu
                    menu_obj = db.query(MasterMenu).filter(
                        MasterMenu.menu == menu_name,
                        MasterMenu.action == action_name
                    ).first()
                    
                    if not menu_obj:
                        menu_obj = MasterMenu(
                            id_permission=next_menu_id,
                            menu=menu_name,
                            action=action_name,
                            description=f"Can {action_name} on {menu_name}"
                        )
                        db.add(menu_obj)
                        db.commit()
                        db.refresh(menu_obj)
                        next_menu_id += 1
                        
                    # 4. Buat mapping ke master_role_menu
                    role_menu_exist = db.query(MasterRoleMenu).filter(
                        MasterRoleMenu.role_id == role_obj.id_role,
                        MasterRoleMenu.permission_id == menu_obj.id_permission
                    ).first()
                    
                    if not role_menu_exist:
                        new_mapping = MasterRoleMenu(
                            id_role_permission=next_role_menu_id,
                            role_id=role_obj.id_role,
                            permission_id=menu_obj.id_permission
                        )
                        db.add(new_mapping)
                        next_role_menu_id += 1
        
        # Commit seluruh perubahan mapping
        db.commit()
        print("[SUCCESS] Semua struktur RBAC berhasil disinkronkan ke Database!")

    except Exception as e:
        print(f"[FAILED] Seeding RBAC gagal: {e}")
        db.rollback()
        raise
    finally:
        db.close()

if __name__ == "__main__":
    seed_rbac()
