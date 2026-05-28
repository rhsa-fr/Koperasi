from app.database import SessionLocal
from app.models.user import User
from app.models.role import MasterRole, MasterMenu, MasterRoleMenu
from app.models.sidebar import MasterSidebar, MasterRoleSidebar
from app.models.anggota import Anggota
from app.models.profil_anggota import ProfilAnggota
from app.models.simpanan import Simpanan
from app.models.jenis_simpanan import JenisSimpanan
from app.models.pinjaman import Pinjaman, StatusPinjaman
from app.models.angsuran import Angsuran
from app.models.syarat_peminjaman import SyaratPeminjaman
from app.models.pinjaman_syarat import PinjamanSyarat
from app.models.notifikasi import Notifikasi
from app.models.setting import KoperasiSetting

def fix_corrupted_status():
    db = SessionLocal()
    try:
        all_records = db.query(Pinjaman).all()
        valid_values = [e.value for e in StatusPinjaman]
        
        print(f"Checking {len(all_records)} records...")
        fixed_count = 0
        
        for record in all_records:
            current_status = str(record.status)
            
            # Case 1: Empty string
            if current_status == '':
                print(f"Fixing empty status for ID {record.id_pinjaman}")
                record.status = StatusPinjaman.PENDING
                fixed_count += 1
                continue
                
            # Case 2: String representation like "StatusPinjaman.PENDING"
            if "StatusPinjaman." in current_status:
                member_name = current_status.split('.')[-1]
                try:
                    new_val = StatusPinjaman[member_name].value
                    print(f"Fixing '{current_status}' -> '{new_val}' for ID {record.id_pinjaman}")
                    record.status = new_val
                    fixed_count += 1
                except KeyError:
                    print(f"Error: Unknown enum member '{member_name}' for ID {record.id_pinjaman}")
            
            # Case 3: Just check if valid
            elif record.status not in valid_values:
                print(f"Warning: Invalid status '{record.status}' for ID {record.id_pinjaman}. Setting to pending.")
                record.status = StatusPinjaman.PENDING
                fixed_count += 1
                
        if fixed_count > 0:
            db.commit()
            print(f"Successfully fixed {fixed_count} records.")
        else:
            print("No records needed fixing.")
            
    except Exception as e:
        print(f"Error: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    fix_corrupted_status()
