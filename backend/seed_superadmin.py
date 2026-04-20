#!/usr/bin/env python
# ============================================================================
# FILE: seed_superadmin.py
# Seed script to create superadmin role and user
# Usage: python seed_superadmin.py
# ============================================================================

from app.database import SessionLocal
from app.models.role import Role
from app.models.user import User
from app.core.security import hash_password
import json

# Import all models to resolve relationships
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

def seed_superadmin():
    """Create superadmin role and user"""
    db = SessionLocal()

    try:
        # Check if superadmin role exists
        superadmin_role = db.query(Role).filter(Role.name == "superadmin").first()
        if not superadmin_role:
            # Create superadmin role
            permissions = {
                "users": ["create", "read", "update", "delete", "activate", "deactivate"],
                "anggota": ["create", "read", "update", "delete", "export"],
                "profil_anggota": ["create", "read", "update", "delete"],
                "jenis_simpanan": ["create", "read", "update", "delete"],
                "simpanan": ["create", "read", "update", "delete", "setor", "tarik", "export"],
                "pinjaman": ["create", "read", "update", "delete", "approve", "reject", "export"],
                "angsuran": ["create", "read", "update", "delete", "bayar", "export"],
                "laporan": ["create", "read", "update", "delete", "export"],
                "dashboard": ["read"],
                "roles": ["create", "read", "update", "delete", "assign", "revoke"],
                "rbac": ["create", "read", "update", "delete"],
                "audit": ["read", "write"],
            }

            rbac_admin = {
                "manage_roles": True,
                "assign_roles": True,
                "revoke_roles": True,
                "manage_policies": True,
                "manage_scopes": True,
                "manage_hierarchy": True,
                "enforce_protection": True
            }

            superadmin_role = Role(
                name="superadmin",
                description="Role dengan akses penuh ke seluruh sistem dan hak administratif tanpa batas.",
                protected=True,
                immutable=True,
                scope="global",
                hierarchy="top",
                permissions=permissions,
                rbac_admin=rbac_admin,
                audit_required=True
            )
            db.add(superadmin_role)
            db.commit()
            db.refresh(superadmin_role)
            print("✅ Superadmin role created")

        # Check if superadmin user exists
        superadmin_user = db.query(User).filter(User.username == "superadmin").first()
        if not superadmin_user:
            # Create superadmin user
            hashed_password = hash_password("superadmin123")  # Default password
            superadmin_user = User(
                username="superadmin",
                password=hashed_password,
                role="superadmin",
                is_active=True
            )
            db.add(superadmin_user)
            db.commit()
            print("✅ Superadmin user created (username: superadmin, password: superadmin123)")
            print("⚠️  Please change the default password after first login!")
        else:
            print("ℹ️  Superadmin user already exists")

    except Exception as e:
        print(f"❌ Seeding failed: {e}")
        db.rollback()
        raise
    finally:
        db.close()

if __name__ == "__main__":
    seed_superadmin()