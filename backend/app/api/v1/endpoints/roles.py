from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from app.database import get_db
from app.models.role import MasterRole, AuditLog, MasterMenu, MasterRoleMenu
from app.schemas.role import (
    RoleCreate, RoleUpdate, RoleResponse, AuditLogResponse, 
    MenuResponse, RoleMenuResponse
)
from app.core.permissions import (
    get_current_user, require_permission, is_protected_role, can_modify_role, can_delete_role, log_audit_action
)

router = APIRouter()


@router.get("/menus", response_model=List[MenuResponse])
def get_all_menus(
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Get all available menus/actions for permission matrix."""
    return db.query(MasterMenu).all()


@router.get("/{role_id}/permissions")
def get_role_permissions(
    role_id: int,
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_permission("roles", "read"))
):
    """Get permissions assigned to a specific role."""
    permissions = db.query(MasterMenu).join(
        MasterRoleMenu, MasterMenu.id_permission == MasterRoleMenu.permission_id
    ).filter(
        MasterRoleMenu.role_id == role_id
    ).all()
    return permissions


@router.put("/{role_id}/permissions")
def update_role_permissions(
    role_id: int,
    data: dict, # Format: {"permissions": [{"menu": "users", "actions": ["read", "create"]}]}
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_permission("roles", "update"))
):
    """Update permissions for a role (Sync approach)."""
    # 1. Clear existing permissions for this role
    db.query(MasterRoleMenu).filter(MasterRoleMenu.role_id == role_id).delete()
    
    # 2. Add new permissions
    for p in data.get("permissions", []):
        menu_name = p.get("menu")
        for action in p.get("actions", []):
            # Find permission ID
            menu_item = db.query(MasterMenu).filter(
                MasterMenu.menu == menu_name,
                MasterMenu.action == action
            ).first()
            
            if menu_item:
                new_mapping = MasterRoleMenu(
                    role_id=role_id,
                    permission_id=menu_item.id_permission
                )
                db.add(new_mapping)
    
    db.commit()
    
    # Log audit
    log_audit_action(
        user_id=current_user["id"],
        username=current_user["username"],
        role=current_user["role"],
        action="update_permissions",
        resource="rbac",
        target_id=role_id,
        details=data
    )
    
    return {"message": "Permissions updated successfully"}


@router.post("", response_model=RoleResponse)
def create_role(
    role_data: RoleCreate,
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_permission("roles", "create"))
):
    """Create a new role (superadmin only)."""
    # Check if role already exists
    existing_role = db.query(MasterRole).filter(MasterRole.name == role_data.name).first()
    if existing_role:
        raise HTTPException(status_code=400, detail="Role already exists")

    # Create role
    new_role = MasterRole(**role_data.model_dump())
    db.add(new_role)
    db.commit()
    db.refresh(new_role)

    # Log audit
    log_audit_action(
        user_id=current_user["id"],
        username=current_user["username"],
        role=current_user["role"],
        action="create",
        resource="roles",
        target_id=new_role.id_role,
        details={"role_name": new_role.name}
    )

    return new_role


@router.get("", response_model=List[RoleResponse])
def get_roles(
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Get all roles."""
    roles = db.query(MasterRole).all()
    return roles


@router.get("/{role_id}", response_model=RoleResponse)
def get_role(
    role_id: int,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Get a specific role by ID."""
    role = db.query(MasterRole).filter(MasterRole.id_role == role_id).first()
    if not role:
        raise HTTPException(status_code=404, detail="Role not found")
    return role


@router.put("/{role_id}", response_model=RoleResponse)
def update_role(
    role_id: int,
    role_data: RoleUpdate,
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_permission("roles", "update"))
):
    """Update a role."""
    role = db.query(MasterRole).filter(MasterRole.id_role == role_id).first()
    if not role:
        raise HTTPException(status_code=404, detail="Role not found")

    # Check if current user can modify this role
    if not can_modify_role(current_user["role"], role.name):
        raise HTTPException(
            status_code=403,
            detail=f"Cannot modify protected role '{role.name}'"
        )

    # Update role
    for field, value in role_data.model_dump(exclude_unset=True).items():
        setattr(role, field, value)

    db.commit()
    db.refresh(role)

    # Log audit
    log_audit_action(
        user_id=current_user["id"],
        username=current_user["username"],
        role=current_user["role"],
        action="update",
        resource="roles",
        target_id=role.id_role,
        details={"role_name": role.name, "changes": role_data.model_dump(exclude_unset=True)}
    )

    return role


@router.delete("/{role_id}")
def delete_role(
    role_id: int,
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_permission("roles", "delete"))
):
    """Delete a role (superadmin only)."""
    role = db.query(MasterRole).filter(MasterRole.id_role == role_id).first()
    if not role:
        raise HTTPException(status_code=404, detail="Role not found")

    # Check if role can be deleted
    if not can_delete_role(current_user["role"], role.name):
        raise HTTPException(
            status_code=403,
            detail=f"Cannot delete protected role '{role.name}'"
        )

    # Delete role
    db.delete(role)
    db.commit()

    # Log audit
    log_audit_action(
        user_id=current_user["id"],
        username=current_user["username"],
        role=current_user["role"],
        action="delete",
        resource="roles",
        target_id=role_id,
        details={"role_name": role.name}
    )

    return {"message": f"Role '{role.name}' deleted successfully"}


@router.post("/{role_id}/assign/{user_id}")
def assign_role_to_user(
    role_id: int,
    user_id: int,
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_permission("roles", "update"))
):
    """Assign role to user."""
    from app.models.user import User

    role = db.query(MasterRole).filter(MasterRole.id_role == role_id).first()
    user = db.query(User).filter(User.id_user == user_id).first()

    if not role:
        raise HTTPException(status_code=404, detail="Role not found")
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    # Check permission to assign this role
    if not can_modify_role(current_user["role"], role.name):
        raise HTTPException(
            status_code=403,
            detail=f"Cannot assign protected role '{role.name}'"
        )

    # Assign role
    old_role = user.role
    user.role = role.name
    db.commit()

    # Log audit
    log_audit_action(
        user_id=current_user["id"],
        username=current_user["username"],
        role=current_user["role"],
        action="assign",
        resource="user_roles",
        target_id=user_id,
        details={"new_role": role.name, "old_role": old_role}
    )

    return {"message": f"Role '{role.name}' assigned to user '{user.username}'"}


@router.get("/audit/logs", response_model=List[AuditLogResponse])
def get_audit_logs(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_permission("audit", "read"))
):
    """Get audit logs (superadmin only)."""
    logs = db.query(AuditLog).offset(skip).limit(limit).all()
    return logs