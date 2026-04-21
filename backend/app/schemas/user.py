# ============================================================================
# FILE: app/schemas/user.py
# ============================================================================

from pydantic import BaseModel, Field, ConfigDict
from typing import Optional
from datetime import datetime
from enum import Enum


class UserBase(BaseModel):
    username: str = Field(..., min_length=3, max_length=50, description="Username untuk login")
    role: str = Field(..., description="Role user")


class UserCreate(UserBase):
    password: str = Field(..., min_length=6, max_length=100, description="Password minimal 6 karakter")


class UserUpdate(BaseModel):
    username: Optional[str] = Field(None, min_length=3, max_length=50)
    password: Optional[str] = Field(None, min_length=6, max_length=100)
    role: Optional[str] = None
    is_active: Optional[bool] = None


class UserChangePassword(BaseModel):
    old_password: str = Field(..., description="Password lama")
    new_password: str = Field(..., min_length=6, max_length=100, description="Password baru minimal 6 karakter")


class UserInDB(UserBase):
    id_user: int
    is_active: bool
    created_at: datetime
    updated_at: datetime
    
    model_config = ConfigDict(from_attributes=True)


class UserResponse(BaseModel):
    id_user: int
    username: str
    role: str
    is_active: bool
    created_at: datetime
    
    model_config = ConfigDict(from_attributes=True)


class UserLogin(BaseModel):
    username: str = Field(..., description="Username")
    password: str = Field(..., description="Password")