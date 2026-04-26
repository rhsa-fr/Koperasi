from sqlalchemy import Column, Integer, String, Text, Boolean, DateTime, ForeignKey, Enum
from sqlalchemy.orm import relationship
from datetime import datetime
from app.database import Base

class Notifikasi(Base):
    __tablename__ = "notifikasi"

    id_notifikasi = Column(Integer, primary_key=True, index=True)
    id_user = Column(Integer, ForeignKey("user.id_user", ondelete="CASCADE"), nullable=False)
    tipe = Column(Enum('success', 'warning', 'info', 'system', name='tipe_notif'), nullable=False, default='info')
    judul = Column(String(100), nullable=False)
    pesan = Column(Text, nullable=False)
    is_read = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationship to user
    user = relationship("User")
