from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from app.database import get_db
from app.models.sidebar import MasterSidebar
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
    """Update sidebar visibility mapping for a role"""
    from app.models.sidebar import MasterRoleSidebar
    
    # Remove existing
    db.query(MasterRoleSidebar).filter(MasterRoleSidebar.role_id == role_id).delete()
    
    # Add new
    for sid in sidebar_ids:
        db.add(MasterRoleSidebar(role_id=role_id, sidebar_id=sid))
        
    db.commit()

    # Log audit
    log_audit_action(
        user_id=current_user["id"],
        username=current_user["username"],
        role=current_user["role"],
        action="update_sidebar_visibility",
        resource="sidebar",
        target_id=role_id,
        details={"mapped_sidebar_ids": sidebar_ids}
    )

    return {"message": "Visibilitas menu role berhasil diperbarui"}

@router.get("/manage", response_model=List[SidebarResponse])
def get_all_menus(
    current_user: dict = Depends(require_permission("sidebar", "read")),
    db: Session = Depends(get_db)
):
    """Get all sidebar menus for management (Superadmin only)"""
    return db.query(MasterSidebar).order_by(MasterSidebar.order_weight.asc()).all()

@router.post("", response_model=SidebarResponse)
def create_menu(
    data: SidebarCreate,
    current_user: dict = Depends(require_permission("sidebar", "update")),
    db: Session = Depends(get_db)
):
    """Add new menu (Superadmin only)"""
    menu = MasterSidebar(**data.dict())
    db.add(menu)
    db.commit()
    db.refresh(menu)

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
    
    update_data = data.dict(exclude_unset=True)
    for key, value in update_data.items():
        setattr(menu, key, value)
    
    db.commit()
    db.refresh(menu)

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
    
    db.delete(menu)
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
