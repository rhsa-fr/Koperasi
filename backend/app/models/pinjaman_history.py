from sqlalchemy import Column, Integer, String, Text, ForeignKey, TIMESTAMP
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.database import Base

class PinjamanHistory(Base):
    __tablename__ = "pinjaman_history"

    id_history = Column(Integer, primary_key=True, index=True, autoincrement=True)
    id_pinjaman = Column(Integer, ForeignKey("pinjaman.id_pinjaman", ondelete="CASCADE"), nullable=False, index=True)
    id_user = Column(Integer, ForeignKey("user.id_user", ondelete="SET NULL"), nullable=True, index=True)
    status = Column(String(20), nullable=False, index=True)
    catatan = Column(Text)
    created_at = Column(TIMESTAMP, server_default=func.current_timestamp())

    # Relationships
    pinjaman = relationship("Pinjaman", back_populates="history")
    user = relationship("User")
