#!/usr/bin/env python
from app.database import SessionLocal, engine, Base
from app.models.role import MasterRole, MasterMenu, MasterRoleMenu
from app.models.user import User
from app.models.anggota import Anggota
from app.models.profil_anggota import ProfilAnggota
from app.models.jenis_simpanan import JenisSimpanan
from app.models.simpanan import Simpanan
from app.models.pinjaman import Pinjaman
from app.models.pinjaman_syarat import PinjamanSyarat
from app.models.angsuran import Angsuran
from app.models.syarat_peminjaman import SyaratPeminjaman
from app.models.setting import KoperasiSetting
from app.core.security import hash_password
from app.core.permissions import PERMISSIONS

def seed_database():
    print("Starting Database Seeding (v2 - Fixed Patterns)...")
    db = SessionLocal()
    
    try:
        # 1. Seed MasterMenu
        print("Seeding MasterMenu entries...")
        menu_objs = {}
        for role_name, resource_map in PERMISSIONS.items():
            for menu_name, actions in resource_map.items():
                for action in actions:
                    key = (menu_name, action)
                    if key not in menu_objs:
                        # Check if exists
                        existing = db.query(MasterMenu).filter(
                            MasterMenu.menu == menu_name, 
                            MasterMenu.action == action
                        ).first()
                        if not existing:
                            new_menu = MasterMenu(menu=menu_name, action=action)
                            db.add(new_menu)
                            db.flush()
                            menu_objs[key] = new_menu
                        else:
                            menu_objs[key] = existing

        db.commit()
        print(f"MasterMenu populated ({len(menu_objs)} total entries)")

        # 2. Seed Roles and Link Permissions
        print("Seeding MasterRoles and Linking Permissions...")
        for role_name, resource_map in PERMISSIONS.items():
            # Check if role exists
            role = db.query(MasterRole).filter(MasterRole.name == role_name).first()
            if not role:
                role = MasterRole(
                    name=role_name,
                    description=f"Standard system role for {role_name}",
                    is_active=True
                )
                db.add(role)
                db.flush()
            
            # Sync permissions for this role
            # Clear existing for fresh seed
            db.query(MasterRoleMenu).filter(MasterRoleMenu.role_id == role.id_role).delete()
            
            for menu_name, actions in resource_map.items():
                for action in actions:
                    menu_item = menu_objs.get((menu_name, action))
                    if menu_item:
                        link = MasterRoleMenu(role_id=role.id_role, permission_id=menu_item.id_permission)
                        db.add(link)
            
            print(f"Role '{role_name}' synced.")

        # 3. Create Super Admin User
        print("Creating Super Admin user...")
        superadmin = db.query(User).filter(User.username == "superadmin").first()
        if not superadmin:
            hashed_pw = hash_password("superadmin123")
            superadmin = User(
                username="superadmin",
                password=hashed_pw,
                role="super_admin", # Match the PERMISSIONS key
                is_active=True
            )
            db.add(superadmin)
            print("User 'superadmin' created (password: superadmin123)")
        else:
            # Ensure role name is correct
            superadmin.role = "super_admin"
            print("User 'superadmin' already exists (updated role to super_admin)")

        db.commit()
        print("\nSEEDING COMPLETED SUCCESSFULLY!")

    except Exception as e:
        print(f"\nSEEDING FAILED: {e}")
        db.rollback()
        raise
    finally:
        db.close()

if __name__ == "__main__":
    seed_database()