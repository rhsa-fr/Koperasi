
## Setup & Instalasi

### 1. Install Dependencies

```bash
npm install
```

### 2. Setup Environment Variables

```bash
cp .env.example .env.local
```

Edit `.env.local`:

```env
NEXT_PUBLIC_API_URL=http://localhost:8000
```

### 3. Jalankan Development Server

```bash
npm run dev
```

Buka [http://localhost:3000](http://localhost:3000)

---

## Koneksi ke Backend FastAPI

Axios instance dikonfigurasi di `src/lib/axios.ts`:

- **Base URL**: `NEXT_PUBLIC_API_URL/api/v1`
- **Auth**: JWT Bearer token dari `localStorage`
- **Interceptors**:
  - Request → otomatis attach `Authorization: Bearer <token>`
  - Response → handle error 401/403/404/422/500 secara global

Sistem yang Anda buat memiliki relasi database yang sangat rapi untuk memisahkan antara Tampilan (Menu) dan Keamanan (Izin Akses). Berikut adalah penjelasan relasi antar tabelnya:

1. Struktur Tabel Utama
master_sidebar: Menyimpan daftar "Pintu" atau menu yang ada di sidebar (seperti Dashboard, Anggota, Simpanan).
Kolom penting: resource (Contoh: anggota, simpanan).
master_menu: Menyimpan daftar "Kunci" atau aksi apa saja yang bisa dilakukan (Contoh: read, create, delete).
Kolom penting: menu (ini harus sama dengan resource di sidebar agar terhubung).
master_role: Menyimpan daftar Jabatan/Role (Contoh: admin, ketua, bendahara).
2. Hubungan Relasi (Mapping)
Sistem ini menggunakan Many-to-Many Relationship melalui tabel penghubung:

A. Relasi Visibilitas (Muncul/Tidak di Sidebar)
master_role <───> master_role_sidebar <───> master_sidebar

Relasi ini mengatur: "Role Admin boleh melihat menu Anggota di sidebarnya."
Ini yang Anda atur di tab "Visibilitas Role".
B. Relasi Izin Fungsional (Boleh/Tidak Melakukan Sesuatu)
master_role <───> master_role_menu <───> master_menu

Relasi ini mengatur: "Role Admin boleh Menghapus (delete) data Anggota."
Ini yang Anda atur di halaman "Manajemen Role".
Diagram Relasi (Visualisasi)
mermaid
erDiagram
    master_role ||--o{ master_role_sidebar : "memiliki akses menu"
    master_sidebar ||--o{ master_role_sidebar : "ditampilkan untuk role"
    
    master_role ||--o{ master_role_menu : "memiliki izin aksi"
    master_menu ||--o{ master_role_menu : "diizinkan untuk role"
    
    master_sidebar }|..|{ master_menu : "dihubungkan oleh kode RESOURCE"
    master_sidebar {
        int id_sidebar
        string label
        string resource
        string href
    }
    master_menu {
        int id_permission
        string menu
        string action
    }
    master_role {
        int id_role
        string name
    }
Kesimpulan Alur Kerja:
Saat Anda membuat Menu Baru di "Akses Menu", Anda membuat data di master_sidebar sekaligus mendefinisikan daftar aksi di master_menu (karena kode resource-nya sama).
Saat Anda Menceklis di "Visibilitas Role", Anda mengisi tabel master_role_sidebar.
Saat Anda Menceklis di "Manajemen Role", Anda mengisi tabel master_role_menu.
Sidebar hanya akan menampilkan menu jika datanya ada di KEDUA tabel penghubung tersebut (User punya hak melihat pintu, dan punya minimal izin read untuk masuk ke ruangan tersebut).