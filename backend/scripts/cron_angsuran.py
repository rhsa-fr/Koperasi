import sys
import os
from datetime import date, timedelta
from sqlalchemy import text

# Setup paths so we can import from app
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
BACKEND_DIR = os.path.abspath(os.path.join(SCRIPT_DIR, '..'))
sys.path.append(BACKEND_DIR)

from app.database import SessionLocal
from app.models import anggota, simpanan, pinjaman, user, angsuran, notifikasi, profil_anggota, syarat_peminjaman, pinjaman_syarat, jenis_simpanan, setting

from app.models.angsuran import Angsuran, StatusAngsuran
from app.models.pinjaman import Pinjaman
from app.models.notifikasi import Notifikasi
from app.models.user import User

def run_cron():
    print("--------------------------------------------------")
    print(f"Memulai Pengecekan Angsuran - {date.today().strftime('%d %b %Y')}")
    print("--------------------------------------------------")
    
    db = SessionLocal()
    try:
        # Cari semua angsuran yang BELUM BAYAR
        active_angsurans = db.query(Angsuran).join(Pinjaman).filter(
            Angsuran.status == StatusAngsuran.BELUM_BAYAR
        ).all()
        
        today = date.today()
        sent_count = 0
        
        for ang in active_angsurans:
            diff_days = (ang.tanggal_jatuh_tempo - today).days
            
            # Kita hanya peduli jika sisa 3 hari, 1 hari, atau Pas Jatuh Tempo (0 hari), atau telat (misal -1, -3, dsj).
            if diff_days in [3, 1, 0, -1, -3]:
                # Tentukan subjek dan isi pesan
                if diff_days > 0:
                    judul = "Peringatan Jatuh Tempo! ⚠️"
                    pesan = f"Angsuran ke-{ang.angsuran_ke} sebesar Rp {float(ang.nominal_angsuran):,.0f} (No: {ang.no_angsuran}) jatuh tempo dalam {diff_days} hari lagi. Jangan sampai terlambat ya!"
                    tipe = "warning"
                elif diff_days == 0:
                    judul = "Hari H Jatuh Tempo! 🚨"
                    pesan = f"Angsuran ke-{ang.angsuran_ke} sebesar Rp {float(ang.nominal_angsuran):,.0f} (No: {ang.no_angsuran}) jatuh tempo HARI INI."
                    tipe = "warning"
                else:
                    judul = "Angsuran Menunggak! ❌"
                    pesan = f"Angsuran ke-{ang.angsuran_ke} sebesar Rp {float(ang.nominal_angsuran):,.0f} (No: {ang.no_angsuran}) TELAH JATUH TEMPO sejak {abs(diff_days)} hari yang lalu. Mohon segera diselesaikan."
                    tipe = "warning"

                # Cari User akun dari anggota ini
                anggota = ang.pinjaman.anggota
                user_anggota = db.query(User).filter(User.username == anggota.no_anggota).first()
                
                if user_anggota:
                    # Anti-Spam Check: Jangan kirim notif yang sama pada hari yang sama
                    # Pengecekan bisa secara kasar: apakah ada notif dgn judul yg sama dibuat hari ini untuk user ini.
                    cek_spam = db.query(Notifikasi).filter(
                        Notifikasi.id_user == user_anggota.id_user,
                        Notifikasi.judul == judul,
                        Notifikasi.pesan == pesan
                        # asumsikan created_at berupa Date/Time, the text match is enough usually because message contains specific days
                    ).first()
                    
                    if not cek_spam:
                        # Kirim
                        notif = Notifikasi(
                            id_user=user_anggota.id_user,
                            tipe=tipe,
                            judul=judul,
                            pesan=pesan,
                            is_read=False
                        )
                        db.add(notif)
                        sent_count += 1
                        print(f"[SENT] Notif {diff_days} hari ke User ID {user_anggota.id_user} | Angsuran: {ang.no_angsuran}")
                    else:
                        pass # Sudah pernah dikirim hari ini/sebelumnya untuk pesan identik

        db.commit()
        print(f"Selesai! Berhasil mengirim {sent_count} Notifikasi Pengingat Angsuran.\n")
        
    except Exception as e:
        print(f"[ERROR] Cronin gagal: {str(e)}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    run_cron()
