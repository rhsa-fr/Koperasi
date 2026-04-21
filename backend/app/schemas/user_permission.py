from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional
from datetime import datetime

class UserPermissionBase(BaseModel):
    permission_id: int
    is_granted: bool = True

class UserPermissionCreate(UserPermissionBase):
    pass

class UserPermissionResponse(UserPermissionBase):
    id_user_permission: int
    user_id: int
    created_at: datetime
    
    # Nested permission info for convenience
    menu: str
    action: str
    
    model_config = ConfigDict(from_attributes=True)

class UserPermissionSync(BaseModel):
    """Schema for syncing multiple permissions at once."""
    permissions: List[UserPermissionBase]
