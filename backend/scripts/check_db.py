import sys
import os

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
BACKEND_DIR = os.path.abspath(os.path.join(SCRIPT_DIR, '..'))
sys.path.append(BACKEND_DIR)

# Import all models to resolve relationships
from app.models.user import User
from app.models.anggota import Anggota
from app.models.simpanan import Simpanan
from app.models.pinjaman import Pinjaman
from app.models.angsuran import Angsuran
from app.models.notifikasi import Notifikasi
from app.models.profil_anggota import ProfilAnggota

from app.database import SessionLocal

db = SessionLocal()
print("=== Users (Anggota role) ===")
for u in db.query(User).filter(User.role == 'anggota').all():
    print(f"User ID: {u.id_user}, Username: {u.username}")

print("\n=== Anggota ===")
for a in db.query(Anggota).all():
    print(f"Anggota ID: {a.id_anggota}, No: {a.no_anggota}, Email: {a.email}")

print("\n=== Recent Notifications ===")
for n in db.query(Notifikasi).order_by(Notifikasi.created_at.desc()).limit(5).all():
    print(f"Notif ID: {n.id_notifikasi}, User ID: {n.id_user}, Judul: {n.judul}")
