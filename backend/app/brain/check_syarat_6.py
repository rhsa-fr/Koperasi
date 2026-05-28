from app.database import SessionLocal
from app.models.pinjaman import Pinjaman
from app.models.pinjaman_syarat import PinjamanSyarat
from app.models.syarat_peminjaman import SyaratPeminjaman
from app.models.anggota import Anggota
from app.models.user import User
from app.models.angsuran import Angsuran
from app.models.profil_anggota import ProfilAnggota
from app.models.simpanan import Simpanan
from app.models.jenis_simpanan import JenisSimpanan
from app.models.notifikasi import Notifikasi
from app.models.sidebar import MasterSidebar, MasterRoleSidebar
from app.models.role import MasterRole, MasterMenu, MasterRoleMenu

def check_syarat_id_6():
    db = SessionLocal()
    try:
        p = db.query(Pinjaman).filter(Pinjaman.id_pinjaman == 6).first()
        if not p:
            print("Pinjaman 6 not found")
            return
        
        print(f"Pinjaman 6 status: {p.status}")
        
        syarat_links = db.query(PinjamanSyarat).filter(PinjamanSyarat.id_pinjaman == 6).all()
        print(f"Total syarat linked: {len(syarat_links)}")
        
        for sl in syarat_links:
            s = db.query(SyaratPeminjaman).filter(SyaratPeminjaman.id_syarat == sl.id_syarat).first()
            print(f"Syarat: {s.nama_syarat if s else 'Unknown'} | Terpenuhi: {sl.is_terpenuhi} | Path: {sl.dokumen_path[:50] if sl.dokumen_path else 'None'}")
            
    except Exception as e:
        print(f"Error: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    check_syarat_id_6()
