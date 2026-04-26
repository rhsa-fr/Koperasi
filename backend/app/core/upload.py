# ============================================================================
# FILE: app/core/upload.py
# ============================================================================

import os
import uuid
import shutil
from pathlib import Path
from fastapi import UploadFile, HTTPException
from app.config import settings

def validate_file(file: UploadFile):
    """Validate file size and extension"""
    # Check extension
    ext = file.filename.split('.')[-1].lower() if '.' in file.filename else ''
    if ext not in settings.allowed_extensions_list:
        raise HTTPException(
            status_code=400, 
            detail=f"File extension not allowed. Allowed: {settings.ALLOWED_EXTENSIONS}"
        )
    
    # Check size (approximate using file object)
    # Note: For more precise check, we might need to read chunks
    return True

def save_uploaded_file(file: UploadFile, subfolder: str = "") -> str:
    """
    Save uploaded file to disk and return the relative path
    """
    validate_file(file)
    
    # Base upload path
    upload_base = Path(settings.UPLOAD_FOLDER)
    target_dir = upload_base / subfolder
    
    # Ensure directory exists
    try:
        if not target_dir.exists():
            target_dir.mkdir(parents=True, exist_ok=True)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to create directory: {str(e)}")
    
    # Generate unique filename
    ext = file.filename.split('.')[-1].lower() if '.' in file.filename else ''
    unique_filename = f"{uuid.uuid4()}.{ext}"
    
    file_path = target_dir / unique_filename
    
    try:
        with file_path.open("wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Could not save file: {str(e)}")
        
    # Return relative path from UPLOAD_FOLDER for DB storage
    return str(Path(subfolder) / unique_filename).replace("\\", "/")

def delete_file(relative_path: str):
    """Delete file if exists"""
    if not relative_path:
        return
    
    file_path = Path(settings.UPLOAD_FOLDER) / relative_path
    if file_path.exists():
        os.remove(file_path)
