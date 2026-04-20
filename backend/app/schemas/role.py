from pydantic import BaseModel, Field
from typing import Optional, Dict, Any, List
from datetime import datetime


class RoleBase(BaseModel):
    name: str = Field(..., min_length=2, max_length=50, description="Nama role")
    description: Optional[str] = Field(None, max_length=255, description="Deskripsi role")
    is_active: bool = Field(default=True, description="Status keaktifan role")


class RoleCreate(RoleBase):
    pass


class RoleUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=2, max_length=50)
    description: Optional[str] = None
    is_active: Optional[bool] = None


class RoleResponse(RoleBase):
    id_role: int
    created_at: datetime
    updated_at: datetime


class MenuBase(BaseModel):
    menu: str
    action: str
    description: Optional[str] = None


class MenuResponse(MenuBase):
    id_permission: int


class RoleMenuBase(BaseModel):
    role_id: int
    permission_id: int


class RoleMenuResponse(RoleMenuBase):
    id_role_permission: int


class AuditLogBase(BaseModel):
    user_id: int
    username: str
    role: str
    action: str = Field(..., description="Aksi yang dilakukan")
    resource: str = Field(..., description="Resource yang diakses")
    target_id: Optional[int] = None
    details: Optional[Dict[str, Any]] = None


class AuditLogResponse(AuditLogBase):
    id_audit: int
    timestamp: datetime