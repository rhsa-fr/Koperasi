export interface PinjamanHistory {
  id_history: number;
  id_pinjaman: number;
  id_user?: number;
  username?: string;
  role?: string;
  status: string;
  catatan?: string;
  created_at: string; // ISO date string
}

export interface Pinjaman {
  id_pinjaman: number;
  id_anggota: number;
  nama_anggota?: string;
  no_pinjaman: string;
  tanggal_pengajuan: string;
  nominal_pinjaman: number;
  bunga_persen: number;
  total_bunga: number;
  total_pinjaman: number;
  lama_angsuran: number;
  nominal_angsuran: number;
  keperluan?: string;
  status: string;
  tanggal_persetujuan?: string;
  tanggal_pencairan?: string;
  tanggal_lunas?: string;
  catatan_persetujuan?: string;
  sisa_pinjaman: number;
  created_at: string;
  history?: PinjamanHistory[];
}
