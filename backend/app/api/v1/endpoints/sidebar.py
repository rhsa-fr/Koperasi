from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from app.database import get_db
from app.models.sidebar import MasterSidebar
from app.models.role import MasterMenu
from app.schemas.sidebar import SidebarCreate, SidebarUpdate, SidebarResponse
from app.core.permissions import get_current_user, require_permission, log_audit_action

router = APIRouter()

@router.get("", response_model=List[SidebarResponse])
def get_sidebar_menus(
    role_id: int = None,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get active sidebar menus for display, filtered by user's role"""
    query = db.query(MasterSidebar).filter(MasterSidebar.is_active == True)
    
    # Use user's role if not explicitly requested
    actual_role_id = role_id
    from app.models.role import MasterRole
    
    # ── Super Admin Management View Bypass ──
    # Note: We removed the display bypass so super_admin respects database mapping 
    # for the regular sidebar view. The /manage endpoint is used for full admin access.

    print(f"DEBUG: Sidebar request for role_id={role_id}, current_user_role={current_user.get('role') if current_user else 'None'}")
    if actual_role_id is None:
        user_role_obj = db.query(MasterRole).filter(MasterRole.name == current_user["role"]).first()
        if user_role_obj:
            actual_role_id = user_role_obj.id_role
            print(f"DEBUG: Found actual_role_id={actual_role_id} for role '{current_user['role']}'")
    
    if actual_role_id is not None:
        from app.models.sidebar import MasterRoleSidebar
        query = query.join(MasterRoleSidebar).filter(MasterRoleSidebar.role_id == actual_role_id)
            
    results = query.order_by(MasterSidebar.order_weight.asc()).all()
    print(f"DEBUG: Returning {len(results)} sidebar items")
    return results

@router.get("/role/{role_id}", response_model=List[int])
def get_role_sidebar_ids(
    role_id: int,
    current_user: dict = Depends(require_permission("sidebar", "read")),
    db: Session = Depends(get_db)
):
    """Get list of sidebar IDs mapped to a role"""
    from app.models.sidebar import MasterRoleSidebar
    mappings = db.query(MasterRoleSidebar).filter(MasterRoleSidebar.role_id == role_id).all()
    return [m.sidebar_id for m in mappings]

@router.put("/role/{role_id}")
def update_role_sidebar(
    role_id: int,
    sidebar_ids: List[int],
    current_user: dict = Depends(require_permission("sidebar", "update")),
    db: Session = Depends(get_db)
):
    """
    Update sidebar visibility mapping for a role and sync RBAC permissions.
    Now automatically REVOKES 'read' permissions if a menu is hidden.
    """
    from app.models.sidebar import MasterRoleSidebar
    from app.models.role import MasterMenu, MasterRoleMenu

    # 1. Get current mappings to identify removals
    existing_mappings = db.query(MasterRoleSidebar).filter(MasterRoleSidebar.role_id == role_id).all()
    existing_ids = {m.sidebar_id for m in existing_mappings}
    new_ids = set(sidebar_ids)

    to_remove = existing_ids - new_ids
    to_add = new_ids - existing_ids

    # 2. Process Removals (Visibility + RBAC Revocation)
    if to_remove:
        # Delete Visibility
        db.query(MasterRoleSidebar).filter(
            MasterRoleSidebar.role_id == role_id,
            MasterRoleSidebar.sidebar_id.in_(list(to_remove))
        ).delete(synchronize_session=False)

        # Revoke 'read' Permissions
        for sid in to_remove:
            sidebar_item = db.query(MasterSidebar).filter(MasterSidebar.id_sidebar == sid).first()
            if sidebar_item:
                # Find the permission ID for (resource, 'read')
                perm = db.query(MasterMenu).filter(
                    MasterMenu.menu == sidebar_item.resource,
                    MasterMenu.action == 'read'
                ).first()
                
                if perm:
                    # Remove the role-menu mapping
                    db.query(MasterRoleMenu).filter(
                        MasterRoleMenu.role_id == role_id,
                        MasterRoleMenu.permission_id == perm.id_permission
                    ).delete(synchronize_session=False)

    # 3. Process Additions (Visibility + RBAC Granting)
    for sid in to_add:
        # Map visibility
        db.add(MasterRoleSidebar(role_id=role_id, sidebar_id=sid))
        
        # Sync RBAC Permission (Allow 'read' access)
        sidebar_item = db.query(MasterSidebar).filter(MasterSidebar.id_sidebar == sid).first()
        if sidebar_item:
            perm = db.query(MasterMenu).filter(
                MasterMenu.menu == sidebar_item.resource,
                MasterMenu.action == 'read'
            ).first()
            
            if perm:
                existing_role_menu = db.query(MasterRoleMenu).filter(
                    MasterRoleMenu.role_id == role_id,
                    MasterRoleMenu.permission_id == perm.id_permission
                ).first()
                if not existing_role_menu:
                    db.add(MasterRoleMenu(role_id=role_id, permission_id=perm.id_permission))
        
    db.commit()

    # Log audit
    log_audit_action(
        user_id=current_user["id"],
        username=current_user["username"],
        role=current_user["role"],
        action="sync_sidebar_visibility",
        resource="sidebar",
        target_id=role_id,
        details={
            "added": list(to_add),
            "removed": list(to_remove),
            "final_config": sidebar_ids
        }
    )

    return {"message": "Visibilitas menu dan izin akses (RBAC) berhasil disinkronisasi"}

@router.get("/manage", response_model=List[SidebarResponse])
def get_all_menus(
    current_user: dict = Depends(require_permission("sidebar", "read")),
    db: Session = Depends(get_db)
):
    """Get all sidebar menus for management (Superadmin only)"""
    menus = db.query(MasterSidebar).order_by(MasterSidebar.order_weight.asc()).all()
    
    # Fetch actions for each menu
    for menu in menus:
        actions = db.query(MasterMenu.action).filter(MasterMenu.menu == menu.resource).all()
        menu.actions = [a[0] for a in actions]
        
    return menus

@router.post("", response_model=SidebarResponse)
def create_menu(
    data: SidebarCreate,
    current_user: dict = Depends(require_permission("sidebar", "update")),
    db: Session = Depends(get_db)
):
    """Add new menu (Superadmin only)"""
    menu_data = data.dict(exclude={"actions"})
    menu = MasterSidebar(**menu_data)
    db.add(menu)
    
    # Process actions
    if data.actions:
        for action in data.actions:
            db.add(MasterMenu(menu=menu.resource, action=action))
            
    db.commit()
    db.refresh(menu)
    
    menu.actions = data.actions or []

    # Log audit
    log_audit_action(
        user_id=current_user["id"],
        username=current_user["username"],
        role=current_user["role"],
        action="create",
        resource="master_sidebar",
        target_id=menu.id_sidebar,
        details=data.dict()
    )

    return menu

@router.put("/{id_sidebar}", response_model=SidebarResponse)
def update_menu(
    id_sidebar: int,
    data: SidebarUpdate,
    current_user: dict = Depends(require_permission("sidebar", "update")),
    db: Session = Depends(get_db)
):
    """Update menu (Superadmin only)"""
    menu = db.query(MasterSidebar).filter(MasterSidebar.id_sidebar == id_sidebar).first()
    if not menu:
        raise HTTPException(status_code=404, detail="Menu tidak ditemukan")
    
    old_resource = menu.resource
    update_data = data.dict(exclude_unset=True, exclude={"actions"})
    for key, value in update_data.items():
        setattr(menu, key, value)
        
    new_resource = menu.resource
    
    if data.actions is not None:
        # Re-create actions
        db.query(MasterMenu).filter(MasterMenu.menu == old_resource).delete()
        for action in data.actions:
            db.add(MasterMenu(menu=new_resource, action=action))
    elif old_resource != new_resource:
        # Just update resource name
        db.query(MasterMenu).filter(MasterMenu.menu == old_resource).update({"menu": new_resource})
    
    db.commit()
    db.refresh(menu)
    
    actions = db.query(MasterMenu.action).filter(MasterMenu.menu == menu.resource).all()
    menu.actions = [a[0] for a in actions]

    # Log audit
    log_audit_action(
        user_id=current_user["id"],
        username=current_user["username"],
        role=current_user["role"],
        action="update",
        resource="master_sidebar",
        target_id=id_sidebar,
        details=update_data
    )

    return menu

@router.delete("/{id_sidebar}")
def delete_menu(
    id_sidebar: int,
    current_user: dict = Depends(require_permission("sidebar", "update")),
    db: Session = Depends(get_db)
):
    """Delete menu (Superadmin only)"""
    menu = db.query(MasterSidebar).filter(MasterSidebar.id_sidebar == id_sidebar).first()
    if not menu:
        raise HTTPException(status_code=404, detail="Menu tidak ditemukan")
    
    resource = menu.resource
    db.delete(menu)
    db.query(MasterMenu).filter(MasterMenu.menu == resource).delete()
    db.commit()

    # Log audit
    log_audit_action(
        user_id=current_user["id"],
        username=current_user["username"],
        role=current_user["role"],
        action="delete",
        resource="master_sidebar",
        target_id=id_sidebar
    )

    return {"message": "Menu berhasil dihapus"}
