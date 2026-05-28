from pydantic import BaseModel
from datetime import datetime
from typing import Optional, List

class SidebarBase(BaseModel):
    label: str
    href: str
    icon: str
    section: str
    resource: str
    order_weight: int = 0
    is_active: bool = True
    actions: Optional[List[str]] = []

class SidebarCreate(SidebarBase):
    pass

class SidebarUpdate(BaseModel):
    label: Optional[str] = None
    href: Optional[str] = None
    icon: Optional[str] = None
    section: Optional[str] = None
    resource: Optional[str] = None
    order_weight: Optional[int] = None
    is_active: Optional[bool] = None
    actions: Optional[List[str]] = None

class SidebarResponse(SidebarBase):
    id_sidebar: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
