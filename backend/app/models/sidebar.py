from sqlalchemy import Column, Integer, String, Boolean, TIMESTAMP, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base
from app.models.role import MasterRole

class MasterSidebar(Base):
    __tablename__ = "master_sidebar"

    id_sidebar = Column(Integer, primary_key=True, index=True, autoincrement=True)
    label = Column(String(50), nullable=False)
    href = Column(String(100), nullable=False)
    icon = Column(String(50), nullable=False)  # Luicide icon name
    section = Column(String(50), nullable=False) # main, data, keuangan, report, admin
    resource = Column(String(50), nullable=False) # RBAC resource name
    order_weight = Column(Integer, default=0)
    is_active = Column(Boolean, default=True)
    created_at = Column(TIMESTAMP, server_default=func.current_timestamp())
    updated_at = Column(TIMESTAMP, server_default=func.current_timestamp(),
                        onupdate=func.current_timestamp())

    def __repr__(self):
        return f"<MasterSidebar(id={self.id_sidebar}, label={self.label}, href={self.href})>"

class MasterRoleSidebar(Base):
    __tablename__ = "master_role_sidebar"

    id_role_sidebar = Column(Integer, primary_key=True, index=True, autoincrement=True)
    role_id = Column(Integer, ForeignKey("master_role.id_role", ondelete="CASCADE"), nullable=False, index=True)
    sidebar_id = Column(Integer, ForeignKey("master_sidebar.id_sidebar", ondelete="CASCADE"), nullable=False, index=True)
    created_at = Column(TIMESTAMP, server_default=func.current_timestamp())

    # Relationships
    role = relationship("MasterRole")
    sidebar = relationship("MasterSidebar")
