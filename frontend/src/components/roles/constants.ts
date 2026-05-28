export const MODULES = [
  'dashboard',
  'anggota',
  'profil_anggota',
  'jenis_simpanan',
  'simpanan',
  'pinjaman',
  'angsuran',
  'laporan',
  'rbac',
  'users',
  'roles',
  'menus',
  'audit',
  'settings'
]

export const ADMIN_ONLY_RESOURCES = ['users', 'rbac', 'sidebar', 'menus', 'audit', 'settings', 'roles']

export const ACTION_LABELS: Record<string, string> = {
  read: 'Lihat',
  create: 'Tambah',
  update: 'Ubah',
  delete: 'Hapus',
  activate: 'Aktifkan',
  deactivate: 'Nonaktifkan',
  export: 'Ekspor',
  setor: 'Setor',
  tarik: 'Tarik',
  bayar: 'Bayar',
  verify: 'Verifikasi',
  approve: 'Setujui',
  reject: 'Tolak',
  return: 'Kembalikan',
  detail: 'Detail',
  manage: 'Kelola'
}

export const MODULE_LABELS: Record<string, string> = {
  dashboard: 'Dashboard',
  anggota: 'Data Anggota',
  profil_anggota: 'Profil Anggota',
  jenis_simpanan: 'Jenis Simpanan',
  simpanan: 'Transaksi Simpanan',
  pinjaman: 'Transaksi Pinjaman',
  angsuran: 'Transaksi Angsuran',
  laporan: 'Laporan',
  rbac: 'Pengaturan Sistem',
  users: 'Manajemen User',
  roles: 'Manajemen Role',
  menus: 'Manajemen Menu',
  audit: 'Audit Log',
  settings: 'Pengaturan Koperasi'
}
