from sqlalchemy import Column, Integer, String, Boolean, TIMESTAMP, JSON, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base


class MasterRole(Base):
    __tablename__ = "master_role"

    id_role = Column(Integer, primary_key=True, index=True, autoincrement=True)
    name = Column(String(50), unique=True, nullable=False, index=True)
    description = Column(String(255))
    is_active = Column(Boolean, default=True)
    created_at = Column(TIMESTAMP, server_default=func.current_timestamp())
    updated_at = Column(TIMESTAMP, server_default=func.current_timestamp(),
                        onupdate=func.current_timestamp())

    # Relationships
    users = relationship("User", back_populates="role_detail")
    menus = relationship("MasterRoleMenu", back_populates="role", cascade="all, delete-orphan")

    def __repr__(self):
        return f"<MasterRole(id={self.id_role}, name={self.name})>"


class MasterMenu(Base):
    __tablename__ = "master_menu"

    id_permission = Column(Integer, primary_key=True, index=True, autoincrement=True)
    menu = Column(String(50), nullable=False)
    action = Column(String(50), nullable=False)
    description = Column(String(255))
    created_at = Column(TIMESTAMP, server_default=func.current_timestamp())
    updated_at = Column(TIMESTAMP, server_default=func.current_timestamp(),
                        onupdate=func.current_timestamp())

    # Relationships
    roles = relationship("MasterRoleMenu", back_populates="menu", cascade="all, delete-orphan")

    def __repr__(self):
        return f"<MasterMenu(id={self.id_permission}, menu={self.menu}, action={self.action})>"


class MasterRoleMenu(Base):
    __tablename__ = "master_role_menu"

    id_role_permission = Column(Integer, primary_key=True, index=True, autoincrement=True)
    role_id = Column(Integer, ForeignKey("master_role.id_role", ondelete="CASCADE"), nullable=False, index=True)
    permission_id = Column(Integer, ForeignKey("master_menu.id_permission", ondelete="CASCADE"), nullable=False, index=True)
    created_at = Column(TIMESTAMP, server_default=func.current_timestamp())
    updated_at = Column(TIMESTAMP, server_default=func.current_timestamp(),
                        onupdate=func.current_timestamp())

    # Relationships
    role = relationship("MasterRole", back_populates="menus")
    menu = relationship("MasterMenu", back_populates="roles")


class AuditLog(Base):
    __tablename__ = "audit_log"

    id_audit = Column(Integer, primary_key=True, index=True, autoincrement=True)
    user_id = Column(Integer, nullable=False, index=True)
    username = Column(String(50))
    role = Column(String(50))
    action = Column(String(100), nullable=False)  # create, update, delete, etc.
    resource = Column(String(100), nullable=False)  # users, roles, etc.
    target_id = Column(Integer)  # ID of affected record
    details = Column(JSON)  # Additional details
    timestamp = Column(TIMESTAMP, server_default=func.current_timestamp(), index=True)

    def __repr__(self):
        return f"<AuditLog(id={self.id_audit}, user={self.username}, action={self.action}, resource={self.resource})>"