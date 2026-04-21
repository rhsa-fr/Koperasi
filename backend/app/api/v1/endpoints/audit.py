from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from app.database import get_db
from app.models.role import AuditLog
from app.schemas.role import AuditLogResponse
from app.core.permissions import require_permission

router = APIRouter()

@router.get("/latest", response_model=List[AuditLogResponse])
def get_latest_audit_logs(
    limit: int = Query(5, ge=1, le=50),
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_permission("audit", "read"))
):
    """Get latest N audit log entries for dashboard display"""
    logs = db.query(AuditLog).order_by(AuditLog.timestamp.desc()).limit(limit).all()
    return logs

@router.get("", response_model=List[AuditLogResponse])
def get_all_audit_logs(
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_permission("audit", "read"))
):
    """Get all audit logs with pagination"""
    logs = db.query(AuditLog).order_by(AuditLog.timestamp.desc()).offset(skip).limit(limit).all()
    return logs
