# ============================================================================
# FILE: app/core/permissions.py (IMPROVED VERSION)
# ============================================================================

from typing import List, Optional, Callable
from functools import wraps
from fastapi import HTTPException, status, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from app.database import get_db
from app.core.security import decode_access_token
from app.models.role import MasterRole, MasterMenu, MasterRoleMenu, UserPermission


security = HTTPBearer()


# ============================================================================
# PERMISSION MATRIX — used as 'source of truth' for database seeding.
# Individual permissions are checked at runtime via get_user_effective_permissions()
# ============================================================================
PERMISSIONS = {
    "super_admin": {
        "dashboard": ["read"],
        "anggota": ["create", "read", "update", "delete", "export"],
        "profil_anggota": ["read", "update"],
        "jenis_simpanan": ["create", "read", "update", "delete"],
        "simpanan": ["create", "read", "update", "delete", "setor", "tarik", "export"],
        "pinjaman": ["create", "read", "update", "delete", "verify", "approve", "reject", "export"],
        "angsuran": ["create", "read", "update", "delete", "bayar", "export"],
        "laporan": ["read", "export"],
        "settings": ["read", "update"],
        "rbac": ["read", "update", "manage"],
        "users": ["create", "read", "update", "delete"],
        "roles": ["create", "read", "update", "delete"],
        "menus": ["create", "read", "update", "delete"],
        "audit": ["read", "export"]
    },
    "admin": {
        "dashboard": ["read"],
        "anggota": ["create", "read", "update", "export"],
        "profil_anggota": ["read", "update"],
        "jenis_simpanan": ["read"],
        "simpanan": ["read", "setor", "tarik", "export"],
        "pinjaman": ["create", "read", "update", "export"],
        "angsuran": ["read", "bayar", "export"],
        "laporan": ["read", "export"],
        "settings": ["read", "update"]
    },
    "ketua": {
        "dashboard": ["read"],
        "anggota": ["read", "export"],
        "profil_anggota": ["read"],
        "simpanan": ["read", "export"],
        "pinjaman": ["read", "verify", "approve", "reject", "export"],
        "angsuran": ["read", "export"],
        "laporan": ["read", "export"],
        "settings": ["read", "update"]
    },
    "bendahara": {
        "dashboard": ["read"],
        "anggota": ["read"],
        "simpanan": ["read", "setor", "tarik", "export"],
        "pinjaman": ["read", "export"],
        "angsuran": ["read", "bayar", "export"],
        "laporan": ["read", "export"]
    },
    "anggota": {
        "dashboard": ["read"],
        "profil_anggota": ["read", "update"],
        "simpanan": ["read"],
        "pinjaman": ["create", "read"],
        "angsuran": ["read"]
    }
}


# ============================================================================
# HELPER FUNCTIONS
# ============================================================================

def has_permission(current_user: dict, resource: str, action: str) -> bool:
    """
    Check if current user has permission for specific action on a resource.
    
    Args:
        current_user: User dictionary from get_current_user
        resource: Resource name (users, anggota, simpanan, etc.)
        action: Action to perform (create, read, update, delete, etc.)
        
    Returns:
        True if user has permission, False otherwise
    """
    # Super Admin has all permissions
    if current_user.get("role") == "super_admin":
        return True
        
    permissions = current_user.get("permissions", {})
    if resource not in permissions:
        return False
    
    return action in permissions[resource]


def get_user_permissions_from_db(db: Session, role_name: str) -> dict:
    """Fetch permissions for a role from master_role_menu table."""
    results = db.query(MasterMenu.menu, MasterMenu.action).join(
        MasterRoleMenu, MasterMenu.id_permission == MasterRoleMenu.permission_id
    ).join(
        MasterRole, MasterRoleMenu.role_id == MasterRole.id_role
    ).filter(
        MasterRole.name == role_name
    ).all()
    
    permissions = {}
    for menu, action in results:
        if menu not in permissions:
            permissions[menu] = []
        permissions[menu].append(action)
        
    return permissions


def get_user_effective_permissions(db: Session, user_id: int, role_name: str) -> dict:
    """
    Fetch and merge permissions from both Role and User-specific overrides.
    User overrides take precedence (Enable or Revoke).
    """
    # 1. Get role permissions
    role_results = db.query(MasterMenu.menu, MasterMenu.action).join(
        MasterRoleMenu, MasterMenu.id_permission == MasterRoleMenu.permission_id
    ).join(
        MasterRole, MasterRoleMenu.role_id == MasterRole.id_role
    ).filter(
        MasterRole.name == role_name
    ).all()
    
    # 2. Get user overrides
    user_overrides = db.query(MasterMenu.menu, MasterMenu.action, UserPermission.is_granted).join(
        UserPermission, MasterMenu.id_permission == UserPermission.permission_id
    ).filter(
        UserPermission.user_id == user_id
    ).all()
    
    permissions_map = {}
    
    # Apply Role Permissions
    for menu, action in role_results:
        if menu not in permissions_map:
            permissions_map[menu] = set()
        permissions_map[menu].add(action)
    
    # Apply User Overrides (Merging / Removing)
    for menu, action, is_granted in user_overrides:
        if is_granted:
            if menu not in permissions_map:
                permissions_map[menu] = set()
            permissions_map[menu].add(action)
        else:
            if menu in permissions_map and action in permissions_map[menu]:
                permissions_map[menu].remove(action)
    
    # Convert sets back to lists for JSON response
    return {k: list(v) for k, v in permissions_map.items()}


def check_permission(user_role: str, resource: str, action: str) -> None:
    """
    Check permission and raise HTTPException if not allowed.
    
    Args:
        user_role: User's role
        resource: Resource name
        action: Action name
        
    Raises:
        HTTPException: If permission denied
    """
    if not has_permission(user_role, resource, action):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"Permission denied. Role '{user_role}' cannot '{action}' on '{resource}'",
        )


# ============================================================================
# AUTHENTICATION & AUTHORIZATION
# ============================================================================

def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db)
) -> dict:
    """
    Get current authenticated user from JWT token.
    
    Returns:
        Dictionary with user info (id, username, role)
        
    Raises:
        HTTPException: If token is invalid or expired
    """
    token = credentials.credentials
    payload = decode_access_token(token)
    
    if not payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    role = payload.get("role")
    user_id = int(payload.get("sub"))
    
    # ── KEY CHANGE: Fetch latest permissions (Role + User Overrides) ──
    permissions = get_user_effective_permissions(db, user_id, role)
    
    return {
        "id": int(payload.get("sub")),
        "username": payload.get("username"),
        "role": role,
        "permissions": permissions
    }


class PermissionChecker:
    """
    Dependency class to check if user has specific permission.
    """
    def __init__(self, resource: str, action: str):
        self.resource = resource
        self.action = action
    
    def __call__(self, current_user: dict = Depends(get_current_user)):
        if not has_permission(current_user, self.resource, self.action):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Izin ditolak. Role '{current_user['role']}' tidak memiliki akses '{self.action}' pada '{self.resource}'",
            )
        return current_user


def require_permission(resource: str, action: str):
    """
    Factory function for PermissionChecker.
    """
    return PermissionChecker(resource, action)


# ============================================================================
# PERMISSION DECORATOR (for service layer)
# ============================================================================

def check_resource_permission(resource: str, action: str):
    """
    Decorator to check permission in service functions.
    
    Usage:
        @check_resource_permission("pinjaman", "approve")
        def approve_pinjaman_service(db, user_role, ...):
            pass
    """
    def decorator(func: Callable):
        @wraps(func)
        def wrapper(*args, **kwargs):
            # Assume user_role is passed as kwarg
            user_role = kwargs.get("user_role")
            if user_role and not has_permission(user_role, resource, action):
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail=f"Permission denied for {action} on {resource}",
                )
            return func(*args, **kwargs)
        return wrapper
    return decorator


# ============================================================================
# PERMISSION HELPERS FOR BUSINESS LOGIC
# ============================================================================

def can_user_approve_pinjaman(user_role: str) -> bool:
    """Check if user can approve pinjaman."""
    return has_permission(user_role, "pinjaman", "approve")


def can_user_bayar_angsuran(user_role: str) -> bool:
    """Check if user can bayar angsuran."""
    return has_permission(user_role, "angsuran", "bayar")


def can_user_manage_simpanan(user_role: str) -> bool:
    """Check if user can setor/tarik simpanan."""
    return (has_permission(user_role, "simpanan", "setor") and 
            has_permission(user_role, "simpanan", "tarik"))


def get_user_permissions(user_role: str, db: Session = None) -> dict:
    """
    Get all permissions for a user role from database.
    Falls back to empty dict if no DB session provided.
    """
    if db:
        return get_user_permissions_from_db(db, user_role)
    return {}


# ============================================================================
# NEW RBAC & AUDIT HELPERS
# ============================================================================

def is_protected_role(role_name: str) -> bool:
    """System roles that cannot be deleted or modified by normal admins."""
    return role_name.lower() == "super_admin"


def can_modify_role(user_role: str, target_role: str) -> bool:
    """Logic to check if user_role can modify target_role."""
    if user_role == "super_admin":
        return True
    if user_role == "admin":
        # Admin can only modify non-protected roles (if any)
        return not is_protected_role(target_role)
    return False


def can_delete_role(user_role: str, target_role: str) -> bool:
    """Logic to check if user_role can delete target_role."""
    if user_role == "super_admin":
        # Even super_admin shouldn't delete the super_admin role itself
        return target_role != "super_admin"
    return False


def log_audit_action(user_id: int, username: str, role: str, action: str, resource: str, target_id: int = None, details: dict = None):
    """Log an action to the audit_log table."""
    from app.database import SessionLocal
    from app.models.role import AuditLog
    
    db = SessionLocal()
    try:
        db_log = AuditLog(
            user_id=user_id,
            username=username,
            role=role,
            action=action,
            resource=resource,
            target_id=target_id,
            details=details
        )
        db.add(db_log)
        db.commit()
    except Exception as e:
        print(f"❌ FAILED TO LOG AUDIT ACTION: {e}")
        db.rollback()
    finally:
        db.close()