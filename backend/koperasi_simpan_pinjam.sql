-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Waktu pembuatan: 17 Mar 2026 pada 13.35
-- Versi server: 10.4.32-MariaDB
-- Versi PHP: 8.0.30

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `koperasi_sp`
--

-- --------------------------------------------------------

--
-- Struktur dari tabel `anggota`
--

CREATE TABLE `anggota` (
  `id_anggota` int(11) NOT NULL,
  `no_anggota` varchar(20) NOT NULL,
  `nama_lengkap` varchar(100) NOT NULL,
  `email` varchar(100) DEFAULT NULL,
  `no_telepon` varchar(15) DEFAULT NULL,
  `tanggal_bergabung` date NOT NULL,
  `status` enum('aktif','non-aktif','keluar') DEFAULT 'aktif',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data untuk tabel `anggota`
--

INSERT INTO `anggota` (`id_anggota`, `no_anggota`, `nama_lengkap`, `email`, `no_telepon`, `tanggal_bergabung`, `status`, `created_at`, `updated_at`) VALUES
(1, 'A-20260313-001', 'Susanto Jaidi', 'susanto@gmail.com', '081736183', '2026-03-13', 'aktif', '2026-03-13 08:38:19', '2026-03-13 08:38:19'),
(2, 'A-20260313-002', 'Bambang Yuda', 'yuda@gmail.com', '087318318', '2026-03-13', 'aktif', '2026-03-13 13:13:29', '2026-03-16 23:28:03'),
(3, 'A-20260313-003', 'Budi Sulaiman', 'sulaiman@gmail.com', '083184880', '2026-03-01', 'aktif', '2026-03-13 13:14:29', '2026-03-16 23:46:49'),
(4, 'A-20260313-004', 'Pipit Muenah', 'pipit@gmail.com', '089712871', '2026-03-11', 'aktif', '2026-03-13 13:15:46', '2026-03-13 13:15:46'),
(5, 'A-20260315-001', 'Doni Salman', 'salman@gmail.com', '0892747247', '2026-03-15', 'aktif', '2026-03-15 06:25:38', '2026-03-15 06:25:38'),
(6, 'A-20260315-002', 'Warso', 'warsogaming@gmail.com', '08941824184', '2026-03-15', 'aktif', '2026-03-15 07:02:57', '2026-03-15 07:02:57'),
(7, 'A-20260317-001', 'Mubin', 'mubin@gmail.com', '0898418941', '2026-03-17', 'aktif', '2026-03-17 08:02:32', '2026-03-17 08:02:32'),
(8, 'A-20260317-002', 'Jono Hermawan', 'hermawan@gmail.com', '089284824', '2026-03-17', 'aktif', '2026-03-17 12:02:31', '2026-03-17 12:02:31');

-- --------------------------------------------------------

--
-- Struktur dari tabel `angsuran`
--

CREATE TABLE `angsuran` (
  `id_angsuran` int(11) NOT NULL,
  `id_pinjaman` int(11) NOT NULL,
  `no_angsuran` varchar(30) NOT NULL,
  `angsuran_ke` int(11) NOT NULL,
  `tanggal_jatuh_tempo` date NOT NULL,
  `nominal_angsuran` decimal(15,2) NOT NULL,
  `pokok` decimal(15,2) NOT NULL,
  `bunga` decimal(15,2) NOT NULL,
  `denda` decimal(15,2) DEFAULT 0.00,
  `total_bayar` decimal(15,2) DEFAULT 0.00,
  `tanggal_bayar` date DEFAULT NULL,
  `status` enum('belum_bayar','lunas','terlambat') DEFAULT 'belum_bayar',
  `keterangan` text DEFAULT NULL,
  `id_user` int(11) DEFAULT NULL COMMENT 'User yang mencatat pembayaran',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data untuk tabel `angsuran`
--

INSERT INTO `angsuran` (`id_angsuran`, `id_pinjaman`, `no_angsuran`, `angsuran_ke`, `tanggal_jatuh_tempo`, `nominal_angsuran`, `pokok`, `bunga`, `denda`, `total_bayar`, `tanggal_bayar`, `status`, `keterangan`, `id_user`, `created_at`, `updated_at`) VALUES
(1, 1, 'ANG-20260314-1-1', 1, '2026-04-13', 425000.00, 416666.67, 8333.33, 0.00, 425000.00, '2026-03-13', 'lunas', NULL, 3, '2026-03-13 18:08:44', '2026-03-13 20:19:46'),
(2, 1, 'ANG-20260314-1-2', 2, '2026-05-13', 425000.00, 416666.67, 8333.33, 0.00, 0.00, NULL, 'belum_bayar', NULL, NULL, '2026-03-13 18:08:44', '2026-03-13 18:08:44'),
(3, 1, 'ANG-20260314-1-3', 3, '2026-06-13', 425000.00, 416666.67, 8333.33, 0.00, 0.00, NULL, 'belum_bayar', NULL, NULL, '2026-03-13 18:08:44', '2026-03-13 18:08:44'),
(4, 1, 'ANG-20260314-1-4', 4, '2026-07-13', 425000.00, 416666.67, 8333.33, 0.00, 0.00, NULL, 'belum_bayar', NULL, NULL, '2026-03-13 18:08:44', '2026-03-13 18:08:44'),
(5, 1, 'ANG-20260314-1-5', 5, '2026-08-13', 425000.00, 416666.67, 8333.33, 0.00, 0.00, NULL, 'belum_bayar', NULL, NULL, '2026-03-13 18:08:44', '2026-03-13 18:08:44'),
(6, 1, 'ANG-20260314-1-6', 6, '2026-09-13', 425000.00, 416666.67, 8333.33, 0.00, 0.00, NULL, 'belum_bayar', NULL, NULL, '2026-03-13 18:08:44', '2026-03-13 18:08:44'),
(7, 1, 'ANG-20260314-1-7', 7, '2026-10-13', 425000.00, 416666.67, 8333.33, 0.00, 0.00, NULL, 'belum_bayar', NULL, NULL, '2026-03-13 18:08:44', '2026-03-13 18:08:44'),
(8, 1, 'ANG-20260314-1-8', 8, '2026-11-13', 425000.00, 416666.67, 8333.33, 0.00, 0.00, NULL, 'belum_bayar', NULL, NULL, '2026-03-13 18:08:44', '2026-03-13 18:08:44'),
(9, 1, 'ANG-20260314-1-9', 9, '2026-12-13', 425000.00, 416666.67, 8333.33, 0.00, 0.00, NULL, 'belum_bayar', NULL, NULL, '2026-03-13 18:08:44', '2026-03-13 18:08:44'),
(10, 1, 'ANG-20260314-1-10', 10, '2027-01-13', 425000.00, 416666.67, 8333.33, 0.00, 0.00, NULL, 'belum_bayar', NULL, NULL, '2026-03-13 18:08:44', '2026-03-13 18:08:44'),
(11, 1, 'ANG-20260314-1-11', 11, '2027-02-13', 425000.00, 416666.67, 8333.33, 0.00, 0.00, NULL, 'belum_bayar', NULL, NULL, '2026-03-13 18:08:44', '2026-03-13 18:08:44'),
(12, 1, 'ANG-20260314-1-12', 12, '2027-03-13', 516666.67, 508333.33, 8333.33, 0.00, 0.00, NULL, 'belum_bayar', NULL, NULL, '2026-03-13 18:08:44', '2026-03-13 18:08:44'),
(13, 2, 'ANG-20260315-2-1', 1, '2026-04-15', 637500.00, 625000.00, 12500.00, 0.00, 637500.00, '2026-03-17', 'lunas', 'BCA', 3, '2026-03-15 06:20:57', '2026-03-17 00:07:03'),
(14, 2, 'ANG-20260315-2-2', 2, '2026-05-15', 637500.00, 625000.00, 12500.00, 0.00, 0.00, NULL, 'belum_bayar', NULL, NULL, '2026-03-15 06:20:57', '2026-03-15 06:20:57'),
(15, 2, 'ANG-20260315-2-3', 3, '2026-06-15', 637500.00, 625000.00, 12500.00, 0.00, 0.00, NULL, 'belum_bayar', NULL, NULL, '2026-03-15 06:20:57', '2026-03-15 06:20:57'),
(16, 2, 'ANG-20260315-2-4', 4, '2026-07-15', 637500.00, 625000.00, 12500.00, 0.00, 0.00, NULL, 'belum_bayar', NULL, NULL, '2026-03-15 06:20:57', '2026-03-15 06:20:57'),
(17, 2, 'ANG-20260315-2-5', 5, '2026-08-15', 637500.00, 625000.00, 12500.00, 0.00, 0.00, NULL, 'belum_bayar', NULL, NULL, '2026-03-15 06:20:57', '2026-03-15 06:20:57'),
(18, 2, 'ANG-20260315-2-6', 6, '2026-09-15', 637500.00, 625000.00, 12500.00, 0.00, 0.00, NULL, 'belum_bayar', NULL, NULL, '2026-03-15 06:20:57', '2026-03-15 06:20:57'),
(19, 2, 'ANG-20260315-2-7', 7, '2026-10-15', 637500.00, 625000.00, 12500.00, 0.00, 0.00, NULL, 'belum_bayar', NULL, NULL, '2026-03-15 06:20:57', '2026-03-15 06:20:57'),
(20, 2, 'ANG-20260315-2-8', 8, '2026-11-15', 637500.00, 625000.00, 12500.00, 0.00, 0.00, NULL, 'belum_bayar', NULL, NULL, '2026-03-15 06:20:57', '2026-03-15 06:20:57'),
(21, 2, 'ANG-20260315-2-9', 9, '2026-12-15', 637500.00, 625000.00, 12500.00, 0.00, 0.00, NULL, 'belum_bayar', NULL, NULL, '2026-03-15 06:20:57', '2026-03-15 06:20:57'),
(22, 2, 'ANG-20260315-2-10', 10, '2027-01-15', 637500.00, 625000.00, 12500.00, 0.00, 0.00, NULL, 'belum_bayar', NULL, NULL, '2026-03-15 06:20:57', '2026-03-15 06:20:57'),
(23, 2, 'ANG-20260315-2-11', 11, '2027-02-15', 637500.00, 625000.00, 12500.00, 0.00, 0.00, NULL, 'belum_bayar', NULL, NULL, '2026-03-15 06:20:57', '2026-03-15 06:20:57'),
(24, 2, 'ANG-20260315-2-12', 12, '2027-03-15', 637500.00, 625000.00, 12500.00, 0.00, 0.00, NULL, 'belum_bayar', NULL, NULL, '2026-03-15 06:20:57', '2026-03-15 06:20:57'),
(25, 2, 'ANG-20260315-2-13', 13, '2027-04-15', 637500.00, 625000.00, 12500.00, 0.00, 0.00, NULL, 'belum_bayar', NULL, NULL, '2026-03-15 06:20:57', '2026-03-15 06:20:57'),
(26, 2, 'ANG-20260315-2-14', 14, '2027-05-15', 637500.00, 625000.00, 12500.00, 0.00, 0.00, NULL, 'belum_bayar', NULL, NULL, '2026-03-15 06:20:57', '2026-03-15 06:20:57'),
(27, 2, 'ANG-20260315-2-15', 15, '2027-06-15', 637500.00, 625000.00, 12500.00, 0.00, 0.00, NULL, 'belum_bayar', NULL, NULL, '2026-03-15 06:20:57', '2026-03-15 06:20:57'),
(28, 2, 'ANG-20260315-2-16', 16, '2027-07-15', 637500.00, 625000.00, 12500.00, 0.00, 0.00, NULL, 'belum_bayar', NULL, NULL, '2026-03-15 06:20:57', '2026-03-15 06:20:57'),
(29, 2, 'ANG-20260315-2-17', 17, '2027-08-15', 637500.00, 625000.00, 12500.00, 0.00, 0.00, NULL, 'belum_bayar', NULL, NULL, '2026-03-15 06:20:57', '2026-03-15 06:20:57'),
(30, 2, 'ANG-20260315-2-18', 18, '2027-09-15', 637500.00, 625000.00, 12500.00, 0.00, 0.00, NULL, 'belum_bayar', NULL, NULL, '2026-03-15 06:20:57', '2026-03-15 06:20:57'),
(31, 2, 'ANG-20260315-2-19', 19, '2027-10-15', 637500.00, 625000.00, 12500.00, 0.00, 0.00, NULL, 'belum_bayar', NULL, NULL, '2026-03-15 06:20:57', '2026-03-15 06:20:57'),
(32, 2, 'ANG-20260315-2-20', 20, '2027-11-15', 637500.00, 625000.00, 12500.00, 0.00, 0.00, NULL, 'belum_bayar', NULL, NULL, '2026-03-15 06:20:57', '2026-03-15 06:20:57'),
(33, 2, 'ANG-20260315-2-21', 21, '2027-12-15', 637500.00, 625000.00, 12500.00, 0.00, 0.00, NULL, 'belum_bayar', NULL, NULL, '2026-03-15 06:20:57', '2026-03-15 06:20:57'),
(34, 2, 'ANG-20260315-2-22', 22, '2028-01-15', 637500.00, 625000.00, 12500.00, 0.00, 0.00, NULL, 'belum_bayar', NULL, NULL, '2026-03-15 06:20:57', '2026-03-15 06:20:57'),
(35, 2, 'ANG-20260315-2-23', 23, '2028-02-15', 637500.00, 625000.00, 12500.00, 0.00, 0.00, NULL, 'belum_bayar', NULL, NULL, '2026-03-15 06:20:57', '2026-03-15 06:20:57'),
(36, 2, 'ANG-20260315-2-24', 24, '2028-03-15', 925000.00, 912500.00, 12500.00, 0.00, 0.00, NULL, 'belum_bayar', NULL, NULL, '2026-03-15 06:20:57', '2026-03-15 06:20:57'),
(37, 4, 'ANG-20260317-4-1', 1, '2026-04-16', 170000.00, 166666.67, 3333.33, 0.00, 170000.00, '2026-03-17', 'lunas', 'BRI', 3, '2026-03-16 22:32:48', '2026-03-17 00:07:17'),
(38, 4, 'ANG-20260317-4-2', 2, '2026-05-16', 170000.00, 166666.67, 3333.33, 0.00, 0.00, NULL, 'belum_bayar', NULL, NULL, '2026-03-16 22:32:48', '2026-03-16 22:32:48'),
(39, 4, 'ANG-20260317-4-3', 3, '2026-06-16', 170000.00, 166666.67, 3333.33, 0.00, 0.00, NULL, 'belum_bayar', NULL, NULL, '2026-03-16 22:32:48', '2026-03-16 22:32:48'),
(40, 4, 'ANG-20260317-4-4', 4, '2026-07-16', 170000.00, 166666.67, 3333.33, 0.00, 0.00, NULL, 'belum_bayar', NULL, NULL, '2026-03-16 22:32:48', '2026-03-16 22:32:48'),
(41, 4, 'ANG-20260317-4-5', 5, '2026-08-16', 170000.00, 166666.67, 3333.33, 0.00, 0.00, NULL, 'belum_bayar', NULL, NULL, '2026-03-16 22:32:48', '2026-03-16 22:32:48'),
(42, 4, 'ANG-20260317-4-6', 6, '2026-09-16', 170000.00, 166666.67, 3333.33, 0.00, 0.00, NULL, 'belum_bayar', NULL, NULL, '2026-03-16 22:32:48', '2026-03-16 22:32:48'),
(43, 4, 'ANG-20260317-4-7', 7, '2026-10-16', 170000.00, 166666.67, 3333.33, 0.00, 0.00, NULL, 'belum_bayar', NULL, NULL, '2026-03-16 22:32:48', '2026-03-16 22:32:48'),
(44, 4, 'ANG-20260317-4-8', 8, '2026-11-16', 170000.00, 166666.67, 3333.33, 0.00, 0.00, NULL, 'belum_bayar', NULL, NULL, '2026-03-16 22:32:48', '2026-03-16 22:32:48'),
(45, 4, 'ANG-20260317-4-9', 9, '2026-12-16', 170000.00, 166666.67, 3333.33, 0.00, 0.00, NULL, 'belum_bayar', NULL, NULL, '2026-03-16 22:32:48', '2026-03-16 22:32:48'),
(46, 4, 'ANG-20260317-4-10', 10, '2027-01-16', 170000.00, 166666.67, 3333.33, 0.00, 0.00, NULL, 'belum_bayar', NULL, NULL, '2026-03-16 22:32:48', '2026-03-16 22:32:48'),
(47, 4, 'ANG-20260317-4-11', 11, '2027-02-16', 170000.00, 166666.67, 3333.33, 0.00, 0.00, NULL, 'belum_bayar', NULL, NULL, '2026-03-16 22:32:48', '2026-03-16 22:32:48'),
(48, 4, 'ANG-20260317-4-12', 12, '2027-03-16', 206666.67, 203333.33, 3333.33, 0.00, 0.00, NULL, 'belum_bayar', NULL, NULL, '2026-03-16 22:32:48', '2026-03-16 22:32:48'),
(49, 7, 'ANG-20260317-7-1', 1, '2026-04-16', 170000.00, 166666.67, 3333.33, 0.00, 0.00, NULL, 'belum_bayar', NULL, NULL, '2026-03-16 23:47:57', '2026-03-16 23:47:57'),
(50, 7, 'ANG-20260317-7-2', 2, '2026-05-16', 170000.00, 166666.67, 3333.33, 0.00, 0.00, NULL, 'belum_bayar', NULL, NULL, '2026-03-16 23:47:57', '2026-03-16 23:47:57'),
(51, 7, 'ANG-20260317-7-3', 3, '2026-06-16', 170000.00, 166666.67, 3333.33, 0.00, 0.00, NULL, 'belum_bayar', NULL, NULL, '2026-03-16 23:47:57', '2026-03-16 23:47:57'),
(52, 7, 'ANG-20260317-7-4', 4, '2026-07-16', 170000.00, 166666.67, 3333.33, 0.00, 0.00, NULL, 'belum_bayar', NULL, NULL, '2026-03-16 23:47:57', '2026-03-16 23:47:57'),
(53, 7, 'ANG-20260317-7-5', 5, '2026-08-16', 170000.00, 166666.67, 3333.33, 0.00, 0.00, NULL, 'belum_bayar', NULL, NULL, '2026-03-16 23:47:57', '2026-03-16 23:47:57'),
(54, 7, 'ANG-20260317-7-6', 6, '2026-09-16', 170000.00, 166666.67, 3333.33, 0.00, 0.00, NULL, 'belum_bayar', NULL, NULL, '2026-03-16 23:47:57', '2026-03-16 23:47:57'),
(55, 7, 'ANG-20260317-7-7', 7, '2026-10-16', 170000.00, 166666.67, 3333.33, 0.00, 0.00, NULL, 'belum_bayar', NULL, NULL, '2026-03-16 23:47:57', '2026-03-16 23:47:57'),
(56, 7, 'ANG-20260317-7-8', 8, '2026-11-16', 170000.00, 166666.67, 3333.33, 0.00, 0.00, NULL, 'belum_bayar', NULL, NULL, '2026-03-16 23:47:57', '2026-03-16 23:47:57'),
(57, 7, 'ANG-20260317-7-9', 9, '2026-12-16', 170000.00, 166666.67, 3333.33, 0.00, 0.00, NULL, 'belum_bayar', NULL, NULL, '2026-03-16 23:47:57', '2026-03-16 23:47:57'),
(58, 7, 'ANG-20260317-7-10', 10, '2027-01-16', 170000.00, 166666.67, 3333.33, 0.00, 0.00, NULL, 'belum_bayar', NULL, NULL, '2026-03-16 23:47:57', '2026-03-16 23:47:57'),
(59, 7, 'ANG-20260317-7-11', 11, '2027-02-16', 170000.00, 166666.67, 3333.33, 0.00, 0.00, NULL, 'belum_bayar', NULL, NULL, '2026-03-16 23:47:57', '2026-03-16 23:47:57'),
(60, 7, 'ANG-20260317-7-12', 12, '2027-03-16', 206666.67, 203333.33, 3333.33, 0.00, 0.00, NULL, 'belum_bayar', NULL, NULL, '2026-03-16 23:47:57', '2026-03-16 23:47:57');

-- --------------------------------------------------------

--
-- Struktur dari tabel `jenis_simpanan`
--

CREATE TABLE `jenis_simpanan` (
  `id_jenis_simpanan` int(11) NOT NULL,
  `kode_jenis` varchar(10) NOT NULL,
  `nama_jenis` varchar(50) NOT NULL,
  `deskripsi` text DEFAULT NULL,
  `is_wajib` tinyint(1) DEFAULT 0,
  `nominal_tetap` decimal(15,2) DEFAULT 0.00,
  `is_active` tinyint(1) DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data untuk tabel `jenis_simpanan`
--

INSERT INTO `jenis_simpanan` (`id_jenis_simpanan`, `kode_jenis`, `nama_jenis`, `deskripsi`, `is_wajib`, `nominal_tetap`, `is_active`, `created_at`, `updated_at`) VALUES
(1, 'SP', 'Simpanan Pokok', 'Simpanan yang dibayarkan saat pertama kali menjadi anggota', 1, 100000.00, 1, '2026-02-02 10:00:30', '2026-02-02 10:00:30'),
(2, 'SW', 'Simpanan Wajib', 'Simpanan yang wajib dibayar setiap bulan', 1, 50000.00, 1, '2026-02-02 10:00:30', '2026-02-02 10:00:30'),
(3, 'SS', 'Simpanan Sukarela', 'Simpanan yang bersifat sukarela dan dapat diambil sewaktu-waktu', 0, 0.00, 1, '2026-02-02 10:00:30', '2026-02-02 10:00:30'),
(4, 'SH', 'Simpanan Haji', 'Tabungan Haji', 0, 1000000.00, 1, '2026-03-15 05:08:40', '2026-03-15 05:08:40');

-- --------------------------------------------------------

--
-- Struktur dari tabel `koperasi_setting`
--

CREATE TABLE `koperasi_setting` (
  `id_setting` int(11) NOT NULL,
  `nama_koperasi` varchar(200) NOT NULL,
  `deskripsi` text DEFAULT NULL,
  `alamat` text DEFAULT NULL,
  `no_telepon` varchar(20) DEFAULT NULL,
  `email` varchar(100) DEFAULT NULL,
  `bunga_default` decimal(5,2) NOT NULL COMMENT 'Bunga pinjaman default (%)',
  `denda_keterlambatan` decimal(5,2) NOT NULL COMMENT 'Denda keterlambatan angsuran (%)',
  `min_nominal_pinjaman` decimal(15,2) NOT NULL COMMENT 'Minimal nominal pinjaman (Rp)',
  `max_nominal_pinjaman` decimal(15,2) DEFAULT NULL COMMENT 'Maksimal nominal pinjaman (Rp)',
  `max_lama_angsuran` int(11) NOT NULL COMMENT 'Maksimal lama angsuran (bulan)',
  `saldo_minimal_simpanan` decimal(15,2) NOT NULL COMMENT 'Saldo minimal simpanan (Rp)',
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data untuk tabel `koperasi_setting`
--

INSERT INTO `koperasi_setting` (`id_setting`, `nama_koperasi`, `deskripsi`, `alamat`, `no_telepon`, `email`, `bunga_default`, `denda_keterlambatan`, `min_nominal_pinjaman`, `max_nominal_pinjaman`, `max_lama_angsuran`, `saldo_minimal_simpanan`, `created_at`, `updated_at`) VALUES
(1, 'Kopdar', NULL, NULL, NULL, NULL, 5.00, 1.01, 100000.00, NULL, 60, 50000.00, '2026-03-17 08:30:43', '2026-03-17 08:58:37');

-- --------------------------------------------------------

--
-- Struktur dari tabel `pinjaman`
--

CREATE TABLE `pinjaman` (
  `id_pinjaman` int(11) NOT NULL,
  `id_anggota` int(11) NOT NULL,
  `no_pinjaman` varchar(30) NOT NULL,
  `tanggal_pengajuan` date NOT NULL,
  `nominal_pinjaman` decimal(15,2) NOT NULL,
  `bunga_persen` decimal(5,2) NOT NULL DEFAULT 0.00,
  `total_bunga` decimal(15,2) NOT NULL DEFAULT 0.00,
  `total_pinjaman` decimal(15,2) NOT NULL,
  `lama_angsuran` int(11) NOT NULL COMMENT 'dalam bulan',
  `nominal_angsuran` decimal(15,2) NOT NULL,
  `keperluan` text DEFAULT NULL,
  `status` enum('pending','disetujui','ditolak','lunas') DEFAULT 'pending',
  `tanggal_persetujuan` date DEFAULT NULL,
  `tanggal_pencairan` date DEFAULT NULL,
  `tanggal_lunas` date DEFAULT NULL,
  `id_user_pengaju` int(11) DEFAULT NULL COMMENT 'User yang input pengajuan',
  `id_user_persetujuan` int(11) DEFAULT NULL COMMENT 'Ketua yang menyetujui',
  `catatan_persetujuan` text DEFAULT NULL,
  `sisa_pinjaman` decimal(15,2) DEFAULT 0.00,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data untuk tabel `pinjaman`
--

INSERT INTO `pinjaman` (`id_pinjaman`, `id_anggota`, `no_pinjaman`, `tanggal_pengajuan`, `nominal_pinjaman`, `bunga_persen`, `total_bunga`, `total_pinjaman`, `lama_angsuran`, `nominal_angsuran`, `keperluan`, `status`, `tanggal_persetujuan`, `tanggal_pencairan`, `tanggal_lunas`, `id_user_pengaju`, `id_user_persetujuan`, `catatan_persetujuan`, `sisa_pinjaman`, `created_at`, `updated_at`) VALUES
(1, 4, 'PJM-20260313-201734', '2026-03-13', 5000000.00, 2.00, 100000.00, 5100000.00, 12, 425000.00, 'Modal Usaha', 'disetujui', '2026-03-13', '2026-03-13', NULL, 1, 2, '', 4583333.33, '2026-03-13 13:17:34', '2026-03-13 20:19:46'),
(2, 1, 'PJM-20260314-200026', '2026-01-09', 15000000.00, 2.00, 300000.00, 15300000.00, 24, 637500.00, 'Beli Motor', 'disetujui', '2026-03-15', '2026-03-15', NULL, 1, 2, '', 14375000.00, '2026-03-14 13:00:26', '2026-03-17 00:07:03'),
(3, 5, 'PJM-20260315-132631', '2026-03-15', 1000000.00, 2.00, 20000.00, 1020000.00, 12, 85000.00, 'Usaha', 'pending', NULL, NULL, NULL, 1, NULL, NULL, 1020000.00, '2026-03-15 06:26:31', '2026-03-15 06:26:31'),
(4, 6, 'PJM-20260315-140342', '2026-03-15', 2000000.00, 2.00, 40000.00, 2040000.00, 12, 170000.00, 'Modal', 'disetujui', '2026-03-16', '2026-03-16', NULL, 1, 2, '', 1833333.33, '2026-03-15 07:03:42', '2026-03-17 00:07:17'),
(5, 2, 'PJM-20260317-062834', '2026-03-16', 5000000.00, 2.00, 100000.00, 5100000.00, 12, 425000.00, 'Lebauran', 'ditolak', NULL, NULL, NULL, 3, 2, 'Ga Urus', 5100000.00, '2026-03-16 23:28:34', '2026-03-16 23:36:10'),
(6, 2, 'PJM-20260317-063707', '2026-03-17', 1000000.00, 2.00, 20000.00, 1020000.00, 12, 85000.00, 'BU', 'pending', NULL, NULL, NULL, 3, NULL, NULL, 1020000.00, '2026-03-16 23:37:07', '2026-03-16 23:37:07'),
(7, 3, 'PJM-20260317-064716', '2026-03-16', 2000000.00, 2.00, 40000.00, 2040000.00, 12, 170000.00, 'Bu', 'disetujui', '2026-03-16', '2026-03-16', NULL, 1, 2, '', 2040000.00, '2026-03-16 23:47:16', '2026-03-16 23:47:57'),
(8, 7, 'PJM-20260317-150259', '2026-03-17', 1000000.00, 2.00, 20000.00, 1020000.00, 3, 340000.00, 'bu', 'pending', NULL, NULL, NULL, 1, NULL, NULL, 1020000.00, '2026-03-17 08:02:59', '2026-03-17 08:02:59'),
(9, 8, 'PJM-20260317-190625', '2026-03-17', 1000000.00, 2.00, 20000.00, 1020000.00, 3, 340000.00, 'BU', 'pending', NULL, NULL, NULL, 1, NULL, NULL, 1020000.00, '2026-03-17 12:06:25', '2026-03-17 12:06:25');

-- --------------------------------------------------------

--
-- Struktur dari tabel `pinjaman_syarat`
--

CREATE TABLE `pinjaman_syarat` (
  `id_pinjaman_syarat` int(11) NOT NULL,
  `id_pinjaman` int(11) NOT NULL,
  `id_syarat` int(11) NOT NULL,
  `is_terpenuhi` tinyint(1) DEFAULT 0 COMMENT 'Apakah syarat sudah terpenuhi',
  `dokumen_path` varchar(255) DEFAULT NULL COMMENT 'Path file dokumen jika ada',
  `catatan` text DEFAULT NULL COMMENT 'Catatan terkait pemenuhan syarat',
  `tanggal_verifikasi` timestamp NULL DEFAULT NULL COMMENT 'Tanggal verifikasi syarat',
  `id_user_verifikasi` int(11) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data untuk tabel `pinjaman_syarat`
--

INSERT INTO `pinjaman_syarat` (`id_pinjaman_syarat`, `id_pinjaman`, `id_syarat`, `is_terpenuhi`, `dokumen_path`, `catatan`, `tanggal_verifikasi`, `id_user_verifikasi`, `created_at`, `updated_at`) VALUES
(1, 4, 1, 0, NULL, NULL, NULL, NULL, '2026-03-15 07:03:42', '2026-03-15 07:03:42'),
(2, 4, 2, 0, NULL, NULL, NULL, NULL, '2026-03-15 07:03:42', '2026-03-15 07:03:42'),
(3, 4, 5, 0, NULL, NULL, NULL, NULL, '2026-03-15 07:03:42', '2026-03-15 07:03:42'),
(4, 4, 6, 0, NULL, NULL, NULL, NULL, '2026-03-15 07:03:42', '2026-03-15 07:03:42'),
(5, 7, 1, 1, NULL, NULL, '2026-03-16 23:47:37', 2, '2026-03-16 23:47:17', '2026-03-16 23:47:37'),
(6, 7, 2, 1, NULL, NULL, '2026-03-16 23:47:39', 2, '2026-03-16 23:47:17', '2026-03-16 23:47:39'),
(7, 7, 5, 1, NULL, NULL, '2026-03-16 23:47:40', 2, '2026-03-16 23:47:17', '2026-03-16 23:47:40'),
(8, 7, 6, 0, NULL, NULL, NULL, NULL, '2026-03-16 23:47:17', '2026-03-16 23:47:17'),
(9, 8, 1, 0, NULL, NULL, NULL, NULL, '2026-03-17 08:02:59', '2026-03-17 08:02:59'),
(10, 8, 2, 0, NULL, NULL, NULL, NULL, '2026-03-17 08:02:59', '2026-03-17 08:02:59'),
(11, 8, 5, 0, NULL, NULL, NULL, NULL, '2026-03-17 08:02:59', '2026-03-17 08:02:59'),
(12, 8, 6, 0, NULL, NULL, NULL, NULL, '2026-03-17 08:02:59', '2026-03-17 08:02:59'),
(13, 9, 1, 0, NULL, NULL, NULL, NULL, '2026-03-17 12:06:25', '2026-03-17 12:06:25'),
(14, 9, 2, 0, NULL, NULL, NULL, NULL, '2026-03-17 12:06:25', '2026-03-17 12:06:25'),
(15, 9, 5, 0, NULL, NULL, NULL, NULL, '2026-03-17 12:06:25', '2026-03-17 12:06:25'),
(16, 9, 6, 0, NULL, NULL, NULL, NULL, '2026-03-17 12:06:25', '2026-03-17 12:06:25');

-- --------------------------------------------------------

--
-- Struktur dari tabel `profil_anggota`
--

CREATE TABLE `profil_anggota` (
  `id_profil` int(11) NOT NULL,
  `id_anggota` int(11) NOT NULL,
  `nik` varchar(16) DEFAULT NULL,
  `tempat_lahir` varchar(50) DEFAULT NULL,
  `tanggal_lahir` date DEFAULT NULL,
  `jenis_kelamin` enum('L','P') DEFAULT NULL,
  `alamat` text DEFAULT NULL,
  `kota` varchar(50) DEFAULT NULL,
  `provinsi` varchar(50) DEFAULT NULL,
  `kode_pos` varchar(10) DEFAULT NULL,
  `pekerjaan` varchar(50) DEFAULT NULL,
  `foto_profil` varchar(255) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data untuk tabel `profil_anggota`
--

INSERT INTO `profil_anggota` (`id_profil`, `id_anggota`, `nik`, `tempat_lahir`, `tanggal_lahir`, `jenis_kelamin`, `alamat`, `kota`, `provinsi`, `kode_pos`, `pekerjaan`, `foto_profil`, `created_at`, `updated_at`) VALUES
(1, 4, '3214218941981', 'Cirebon', '1999-05-12', 'P', 'Jatibarang', 'Kab. Sumedang', 'Jawa Barat', '45311', 'Petani', NULL, '2026-03-13 17:45:44', '2026-03-14 04:36:26'),
(2, 1, '321387163418746', 'Jakarta', '1989-09-12', 'L', 'Jl.Jalan', 'Jakarta Barat', 'DKI Jakarta', '11110', 'Pegawai BUMN', NULL, '2026-03-14 20:42:59', '2026-03-14 20:42:59'),
(3, 8, NULL, 'Indramayu', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2026-03-17 12:03:03', '2026-03-17 12:03:03'),
(4, 7, NULL, NULL, '1999-12-11', NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2026-03-17 12:19:09', '2026-03-17 12:19:09');

-- --------------------------------------------------------

--
-- Struktur dari tabel `simpanan`
--

CREATE TABLE `simpanan` (
  `id_simpanan` int(11) NOT NULL,
  `id_anggota` int(11) NOT NULL,
  `id_jenis_simpanan` int(11) NOT NULL,
  `no_transaksi` varchar(30) NOT NULL,
  `tanggal_transaksi` date NOT NULL,
  `tipe_transaksi` enum('setor','tarik') NOT NULL,
  `nominal` decimal(15,2) NOT NULL,
  `saldo_akhir` decimal(15,2) NOT NULL DEFAULT 0.00,
  `keterangan` text DEFAULT NULL,
  `id_user` int(11) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data untuk tabel `simpanan`
--

INSERT INTO `simpanan` (`id_simpanan`, `id_anggota`, `id_jenis_simpanan`, `no_transaksi`, `tanggal_transaksi`, `tipe_transaksi`, `nominal`, `saldo_akhir`, `keterangan`, `id_user`, `created_at`, `updated_at`) VALUES
(1, 4, 2, 'TRX-20260314-005650', '2026-03-13', 'setor', 200000.00, 200000.00, NULL, 1, '2026-03-13 17:56:50', '2026-03-13 17:56:50'),
(2, 4, 1, 'TRX-20260314-200701', '2026-03-14', 'setor', 100000.00, 100000.00, NULL, 1, '2026-03-14 13:07:01', '2026-03-14 13:07:01'),
(3, 4, 3, 'TRX-20260315-123405', '2026-03-15', 'setor', 1000000.00, 1000000.00, 'Nabung', 1, '2026-03-15 05:34:05', '2026-03-15 05:34:05'),
(4, 4, 3, 'TRX-20260315-124810', '2026-03-15', 'tarik', 200000.00, 800000.00, 'Makan', 1, '2026-03-15 05:48:10', '2026-03-15 05:48:10'),
(5, 1, 4, 'TRX-20260315-124855', '2026-03-15', 'setor', 1000000.00, 1000000.00, NULL, 1, '2026-03-15 05:48:55', '2026-03-15 05:48:55'),
(6, 1, 4, 'TRX-20260315-124909', '2026-03-15', 'tarik', 500000.00, 500000.00, NULL, 1, '2026-03-15 05:49:09', '2026-03-15 05:49:09'),
(7, 6, 3, 'TRX-20260317-053114', '2026-03-16', 'setor', 1000000.00, 1000000.00, NULL, 3, '2026-03-16 22:31:14', '2026-03-16 22:31:14'),
(8, 6, 3, 'TRX-20260317-055500', '2026-03-16', 'tarik', 100000.00, 900000.00, NULL, 3, '2026-03-16 22:55:00', '2026-03-16 22:55:00'),
(9, 6, 3, 'TRX-20260317-080241', '2026-03-17', 'tarik', 20000.00, 880000.00, NULL, 3, '2026-03-17 01:02:41', '2026-03-17 01:02:41'),
(10, 6, 3, 'TRX-20260317-080913', '2026-03-17', 'tarik', 80000.00, 800000.00, NULL, 3, '2026-03-17 01:09:13', '2026-03-17 01:09:13'),
(11, 6, 3, 'TRX-20260317-150015', '2026-03-17', 'tarik', 10000.00, 790000.00, NULL, 3, '2026-03-17 08:00:15', '2026-03-17 08:00:15'),
(12, 8, 2, 'TRX-20260317-190547', '2026-03-17', 'setor', 50000.00, 50000.00, NULL, 1, '2026-03-17 12:05:47', '2026-03-17 12:05:47');

-- --------------------------------------------------------

--
-- Struktur dari tabel `syarat_peminjaman`
--

CREATE TABLE `syarat_peminjaman` (
  `id_syarat` int(11) NOT NULL,
  `kode_syarat` varchar(20) NOT NULL,
  `nama_syarat` varchar(100) NOT NULL,
  `deskripsi` text DEFAULT NULL,
  `is_wajib` tinyint(1) DEFAULT 1 COMMENT 'Apakah syarat ini wajib dipenuhi',
  `min_nominal_pinjaman` decimal(15,2) DEFAULT NULL COMMENT 'Minimal nominal untuk syarat ini berlaku',
  `max_nominal_pinjaman` decimal(15,2) DEFAULT NULL COMMENT 'Maksimal nominal untuk syarat ini berlaku',
  `dokumen_diperlukan` varchar(255) DEFAULT NULL COMMENT 'Jenis dokumen yang diperlukan',
  `is_active` tinyint(1) DEFAULT 1,
  `urutan` int(11) DEFAULT 0 COMMENT 'Urutan tampilan',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data untuk tabel `syarat_peminjaman`
--

INSERT INTO `syarat_peminjaman` (`id_syarat`, `kode_syarat`, `nama_syarat`, `deskripsi`, `is_wajib`, `min_nominal_pinjaman`, `max_nominal_pinjaman`, `dokumen_diperlukan`, `is_active`, `urutan`, `created_at`, `updated_at`) VALUES
(1, 'SYR001', 'Fotocopy KTP', 'Fotocopy KTP anggota yang masih berlaku', 1, NULL, NULL, 'KTP', 1, 1, '2026-03-11 16:21:00', '2026-03-11 16:21:00'),
(2, 'SYR002', 'Fotocopy KK', 'Fotocopy Kartu Keluarga', 1, NULL, NULL, 'KK', 1, 2, '2026-03-11 16:21:00', '2026-03-11 16:21:00'),
(3, 'SYR003', 'Slip Gaji', 'Slip gaji 3 bulan terakhir', 1, 5000000.00, NULL, 'Slip Gaji', 1, 3, '2026-03-11 16:21:00', '2026-03-11 16:21:00'),
(4, 'SYR004', 'Jaminan BPKB', 'BPKB kendaraan sebagai jaminan', 1, 10000000.00, NULL, 'BPKB', 1, 4, '2026-03-11 16:21:00', '2026-03-11 16:21:00'),
(5, 'SYR005', 'Surat Pernyataan', 'Surat pernyataan sanggup membayar angsuran', 1, NULL, NULL, 'Surat Pernyataan', 1, 5, '2026-03-11 16:21:00', '2026-03-11 16:21:00'),
(6, 'SYR006', 'Pas Foto 4x6', 'Pas foto terbaru ukuran 4x6', 0, NULL, NULL, 'Pas Foto', 1, 6, '2026-03-11 16:21:00', '2026-03-11 16:21:00'),
(7, 'SYR007', 'NPWP', 'Nomor Pokok Wajib Pajak', 0, 20000000.00, NULL, 'NPWP', 1, 7, '2026-03-11 16:21:00', '2026-03-11 16:21:00'),
(8, 'SYR008', 'Sertifikat Rumah', 'Sertifikat rumah sebagai jaminan tambahan', 0, 50000000.00, NULL, 'Sertifikat', 1, 8, '2026-03-11 16:21:00', '2026-03-11 16:21:00');

-- --------------------------------------------------------

--
-- Struktur dari tabel `user`
--

CREATE TABLE `user` (
  `id_user` int(11) NOT NULL,
  `username` varchar(100) NOT NULL,
  `password` varchar(255) NOT NULL,
  `role` enum('admin','ketua','bendahara') NOT NULL,
  `is_active` tinyint(1) DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data untuk tabel `user`
--

INSERT INTO `user` (`id_user`, `username`, `password`, `role`, `is_active`, `created_at`, `updated_at`) VALUES
(1, 'admin@koprasi.com', '$2b$12$WJKehEM1KG06rMPAC8y5HOTWGtzpySN/Mhs9Wg7riNoRN8T.Ny8qC', 'admin', 1, '2026-03-11 16:51:30', '2026-03-11 16:51:30'),
(2, 'ketua@koprasi.com', '$2b$12$rX.c9mDRSsxKMStOCSCi4e8DWT42QH7VUDluKpZ6u3wKHH6UmEYdm', 'ketua', 1, '2026-03-11 16:51:30', '2026-03-11 16:51:30'),
(3, 'bendahara@koprasi.com', '$2b$12$v.4FHAceNxz8IxUCL8mRueiDfdELSq6w2ICCQ636AlTmmEziPvsYa', 'bendahara', 1, '2026-03-11 16:51:30', '2026-03-17 07:52:36');

--
-- Indexes for dumped tables
--

--
-- Indeks untuk tabel `anggota`
--
ALTER TABLE `anggota`
  ADD PRIMARY KEY (`id_anggota`),
  ADD UNIQUE KEY `no_anggota` (`no_anggota`),
  ADD UNIQUE KEY `email` (`email`),
  ADD KEY `idx_no_anggota` (`no_anggota`),
  ADD KEY `idx_status` (`status`),
  ADD KEY `idx_nama` (`nama_lengkap`);

--
-- Indeks untuk tabel `angsuran`
--
ALTER TABLE `angsuran`
  ADD PRIMARY KEY (`id_angsuran`),
  ADD UNIQUE KEY `no_angsuran` (`no_angsuran`),
  ADD UNIQUE KEY `unique_pinjaman_angsuran` (`id_pinjaman`,`angsuran_ke`),
  ADD KEY `id_user` (`id_user`),
  ADD KEY `idx_no_angsuran` (`no_angsuran`),
  ADD KEY `idx_pinjaman` (`id_pinjaman`),
  ADD KEY `idx_status` (`status`),
  ADD KEY `idx_jatuh_tempo` (`tanggal_jatuh_tempo`),
  ADD KEY `idx_tanggal_bayar` (`tanggal_bayar`);

--
-- Indeks untuk tabel `jenis_simpanan`
--
ALTER TABLE `jenis_simpanan`
  ADD PRIMARY KEY (`id_jenis_simpanan`),
  ADD UNIQUE KEY `kode_jenis` (`kode_jenis`),
  ADD KEY `idx_kode` (`kode_jenis`),
  ADD KEY `idx_active` (`is_active`);

--
-- Indeks untuk tabel `koperasi_setting`
--
ALTER TABLE `koperasi_setting`
  ADD PRIMARY KEY (`id_setting`),
  ADD KEY `ix_koperasi_setting_id_setting` (`id_setting`);

--
-- Indeks untuk tabel `pinjaman`
--
ALTER TABLE `pinjaman`
  ADD PRIMARY KEY (`id_pinjaman`),
  ADD UNIQUE KEY `no_pinjaman` (`no_pinjaman`),
  ADD KEY `id_user_pengaju` (`id_user_pengaju`),
  ADD KEY `id_user_persetujuan` (`id_user_persetujuan`),
  ADD KEY `idx_no_pinjaman` (`no_pinjaman`),
  ADD KEY `idx_anggota` (`id_anggota`),
  ADD KEY `idx_status` (`status`),
  ADD KEY `idx_tanggal_pengajuan` (`tanggal_pengajuan`),
  ADD KEY `idx_tanggal_persetujuan` (`tanggal_persetujuan`);

--
-- Indeks untuk tabel `pinjaman_syarat`
--
ALTER TABLE `pinjaman_syarat`
  ADD PRIMARY KEY (`id_pinjaman_syarat`),
  ADD KEY `id_pinjaman` (`id_pinjaman`),
  ADD KEY `id_syarat` (`id_syarat`),
  ADD KEY `id_user_verifikasi` (`id_user_verifikasi`),
  ADD KEY `idx_pinjaman` (`id_pinjaman`),
  ADD KEY `idx_syarat` (`id_syarat`);

--
-- Indeks untuk tabel `profil_anggota`
--
ALTER TABLE `profil_anggota`
  ADD PRIMARY KEY (`id_profil`),
  ADD UNIQUE KEY `id_anggota` (`id_anggota`),
  ADD UNIQUE KEY `nik` (`nik`),
  ADD KEY `idx_nik` (`nik`),
  ADD KEY `idx_anggota` (`id_anggota`);

--
-- Indeks untuk tabel `simpanan`
--
ALTER TABLE `simpanan`
  ADD PRIMARY KEY (`id_simpanan`),
  ADD UNIQUE KEY `no_transaksi` (`no_transaksi`),
  ADD KEY `id_user` (`id_user`),
  ADD KEY `idx_no_transaksi` (`no_transaksi`),
  ADD KEY `idx_anggota` (`id_anggota`),
  ADD KEY `idx_jenis` (`id_jenis_simpanan`),
  ADD KEY `idx_tanggal` (`tanggal_transaksi`),
  ADD KEY `idx_tipe` (`tipe_transaksi`);

--
-- Indeks untuk tabel `syarat_peminjaman`
--
ALTER TABLE `syarat_peminjaman`
  ADD PRIMARY KEY (`id_syarat`),
  ADD UNIQUE KEY `kode_syarat` (`kode_syarat`),
  ADD KEY `idx_kode_syarat` (`kode_syarat`),
  ADD KEY `idx_active` (`is_active`);

--
-- Indeks untuk tabel `user`
--
ALTER TABLE `user`
  ADD PRIMARY KEY (`id_user`),
  ADD UNIQUE KEY `username` (`username`),
  ADD KEY `idx_username` (`username`),
  ADD KEY `idx_role` (`role`);

--
-- AUTO_INCREMENT untuk tabel yang dibuang
--

--
-- AUTO_INCREMENT untuk tabel `anggota`
--
ALTER TABLE `anggota`
  MODIFY `id_anggota` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=9;

--
-- AUTO_INCREMENT untuk tabel `angsuran`
--
ALTER TABLE `angsuran`
  MODIFY `id_angsuran` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=61;

--
-- AUTO_INCREMENT untuk tabel `jenis_simpanan`
--
ALTER TABLE `jenis_simpanan`
  MODIFY `id_jenis_simpanan` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT untuk tabel `koperasi_setting`
--
ALTER TABLE `koperasi_setting`
  MODIFY `id_setting` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT untuk tabel `pinjaman`
--
ALTER TABLE `pinjaman`
  MODIFY `id_pinjaman` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=10;

--
-- AUTO_INCREMENT untuk tabel `pinjaman_syarat`
--
ALTER TABLE `pinjaman_syarat`
  MODIFY `id_pinjaman_syarat` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=17;

--
-- AUTO_INCREMENT untuk tabel `profil_anggota`
--
ALTER TABLE `profil_anggota`
  MODIFY `id_profil` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT untuk tabel `simpanan`
--
ALTER TABLE `simpanan`
  MODIFY `id_simpanan` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=13;

--
-- AUTO_INCREMENT untuk tabel `syarat_peminjaman`
--
ALTER TABLE `syarat_peminjaman`
  MODIFY `id_syarat` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=9;

--
-- AUTO_INCREMENT untuk tabel `user`
--
ALTER TABLE `user`
  MODIFY `id_user` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- Ketidakleluasaan untuk tabel pelimpahan (Dumped Tables)
--

--
-- Ketidakleluasaan untuk tabel `angsuran`
--
ALTER TABLE `angsuran`
  ADD CONSTRAINT `angsuran_ibfk_1` FOREIGN KEY (`id_pinjaman`) REFERENCES `pinjaman` (`id_pinjaman`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `angsuran_ibfk_2` FOREIGN KEY (`id_user`) REFERENCES `user` (`id_user`) ON DELETE SET NULL ON UPDATE CASCADE;

--
-- Ketidakleluasaan untuk tabel `pinjaman`
--
ALTER TABLE `pinjaman`
  ADD CONSTRAINT `pinjaman_ibfk_1` FOREIGN KEY (`id_anggota`) REFERENCES `anggota` (`id_anggota`) ON UPDATE CASCADE,
  ADD CONSTRAINT `pinjaman_ibfk_2` FOREIGN KEY (`id_user_pengaju`) REFERENCES `user` (`id_user`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `pinjaman_ibfk_3` FOREIGN KEY (`id_user_persetujuan`) REFERENCES `user` (`id_user`) ON DELETE SET NULL ON UPDATE CASCADE;

--
-- Ketidakleluasaan untuk tabel `pinjaman_syarat`
--
ALTER TABLE `pinjaman_syarat`
  ADD CONSTRAINT `pinjaman_syarat_ibfk_1` FOREIGN KEY (`id_pinjaman`) REFERENCES `pinjaman` (`id_pinjaman`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `pinjaman_syarat_ibfk_2` FOREIGN KEY (`id_syarat`) REFERENCES `syarat_peminjaman` (`id_syarat`) ON UPDATE CASCADE,
  ADD CONSTRAINT `pinjaman_syarat_ibfk_3` FOREIGN KEY (`id_user_verifikasi`) REFERENCES `user` (`id_user`) ON DELETE SET NULL ON UPDATE CASCADE;

--
-- Ketidakleluasaan untuk tabel `profil_anggota`
--
ALTER TABLE `profil_anggota`
  ADD CONSTRAINT `profil_anggota_ibfk_1` FOREIGN KEY (`id_anggota`) REFERENCES `anggota` (`id_anggota`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Ketidakleluasaan untuk tabel `simpanan`
--
ALTER TABLE `simpanan`
  ADD CONSTRAINT `simpanan_ibfk_1` FOREIGN KEY (`id_anggota`) REFERENCES `anggota` (`id_anggota`) ON UPDATE CASCADE,
  ADD CONSTRAINT `simpanan_ibfk_2` FOREIGN KEY (`id_jenis_simpanan`) REFERENCES `jenis_simpanan` (`id_jenis_simpanan`) ON UPDATE CASCADE,
  ADD CONSTRAINT `simpanan_ibfk_3` FOREIGN KEY (`id_user`) REFERENCES `user` (`id_user`) ON DELETE SET NULL ON UPDATE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
