'use client'

import Image from 'next/image'
import { Eye, EyeOff, LogIn, Loader2, AlertCircle, TrendingUp, Shield, Users } from 'lucide-react'
import { useLogin } from '@/hooks/useLogin'
import { cn } from '@/lib/utils'
import { useState, useEffect } from 'react'
import { api } from '@/lib/axios'

interface KoperasiSetting {
  nama_koperasi: string;
  deskripsi: string;
}


const STATS = [
  { icon: Users, label: 'Anggota Aktif', value: '1.240+' },
  { icon: TrendingUp, label: 'Total Simpanan', value: 'Rp 4,2M' },
  { icon: Shield, label: 'Transaksi Aman', value: '99.9%' },
]

const FEATURES = [
  'Kelola simpanan & pinjaman dengan mudah',
  'Laporan keuangan real-time',
  'Akses multi-role yang aman',
]

export default function LoginForm() {
  const {
    username,
    password,
    showPassword,
    isLoading,
    error,
    setUsername,
    setPassword,
    setShowPassword,
    handleSubmit,
  } = useLogin()

  const [setting, setSetting] = useState<KoperasiSetting | null>(null)

  useEffect(() => {
    api.get<KoperasiSetting>(`/setting?t=${Date.now()}`)
      .then(res => setSetting(res))
      .catch(e => console.error(e))
  }, [])


  return (
    <div className="min-h-screen flex lg:bg-white font-sans selection:bg-blue-500/30 overflow-hidden relative">
      {/* ── Aesthetic Background (Mobile Only) ── */}
      <div className="lg:hidden absolute inset-0 z-0 pointer-events-none">
        {/* Soft Aesthetic Gradient */}
        <div 
          className="absolute inset-0 bg-[#020617]"
          style={{
            background: `
              radial-gradient(circle at 50% -20%, #1e40af 0%, transparent 50%),
              radial-gradient(circle at 0% 100%, #0f172a 0%, transparent 50%),
              radial-gradient(circle at 100% 100%, #1e3a8a 0%, transparent 50%)
            `
          }}
        />
        
        {/* Subtle Floating Orbs */}
        <div className="absolute top-[10%] left-[-10%] w-[70%] h-[70%] bg-blue-600/10 rounded-full blur-[120px] animate-pulse duration-[10000ms]" />
        <div className="absolute bottom-[0%] right-[-10%] w-[50%] h-[50%] bg-indigo-500/10 rounded-full blur-[100px] animate-pulse duration-[15000ms]" />

        {/* Very Soft Noise texture */}
        <div className="absolute inset-0 opacity-[0.02] mix-blend-overlay"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`
          }}
        />
      </div>





      {/* ══════════════════════════════════════
          LEFT PANEL
      ══════════════════════════════════════ */}
      <div
        className="hidden lg:flex lg:w-[52%] xl:w-[55%] flex-col justify-between p-12 relative overflow-hidden"
        style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1a2f4a 50%, #0f2027 100%)' }}
      >
        {/* Blob biru */}
        <div
          className="absolute top-[-120px] right-[-80px] w-[420px] h-[420px] rounded-full opacity-20"
          style={{ background: 'radial-gradient(circle, #2a7fc5 0%, transparent 70%)' }}
        />
        {/* Blob emas */}
        <div
          className="absolute bottom-[-80px] left-[-60px] w-[320px] h-[320px] rounded-full opacity-15"
          style={{ background: 'radial-gradient(circle, #e09b3d 0%, transparent 70%)' }}
        />
        {/* Grid pattern */}
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage: `linear-gradient(rgba(255,255,255,0.8) 1px, transparent 1px),
                              linear-gradient(90deg, rgba(255,255,255,0.8) 1px, transparent 1px)`,
            backgroundSize: '40px 40px',
          }}
        />

        <div className="relative z-10">

          {/* ── Logo ── */}
          <div className="flex items-center gap-4 mb-16">
            <Image
              src="/logo.svg"
              alt={setting?.nama_koperasi || "Logo"}
              width={72}
              height={72}
              className="shrink-0 drop-shadow-lg"
              priority
            />
            <div>
              <p className="text-white font-bold text-2xl tracking-widest">
                {(setting?.nama_koperasi || 'KOPDAR').toUpperCase()}
              </p>
              <p className="text-[11px] font-medium tracking-widest uppercase" style={{ color: '#e09b3d' }}>
                {setting?.deskripsi?.slice(0, 30) || 'Koperasi Simpan Pinjam'}
              </p>
            </div>
          </div>


          {/* ── Headline ── */}
          <div className="mb-12">
            <h1 className="text-4xl xl:text-5xl font-bold text-white leading-tight mb-4">
              Kelola Keuangan<br />
              <span
                style={{
                  background: 'linear-gradient(90deg, #2a7fc5, #e09b3d)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                }}
              >
                Lebih Cerdas
              </span>
            </h1>
            <p className="text-slate-400 text-base leading-relaxed max-w-xs">
              {setting?.deskripsi || 'Platform manajemen koperasi yang terintegrasi untuk pengelolaan simpanan, pinjaman, dan laporan keuangan.'}
            </p>

          </div>

          {/* ── Feature list ── */}
          <div className="space-y-3 mb-12">
            {FEATURES.map((feature, i) => (
              <div key={i} className="flex items-center gap-3">
                <div
                  className="w-5 h-5 rounded-full flex items-center justify-center shrink-0"
                  style={{ background: 'linear-gradient(135deg, #2a7fc5, #e09b3d)' }}
                >
                  <svg width="10" height="10" viewBox="0 0 12 12" fill="none">
                    <path d="M2 6l3 3 5-5" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
                <p className="text-slate-300 text-sm">{feature}</p>
              </div>
            ))}
          </div>
        </div>

        {/* ── Stats ── */}
        <div className="relative z-10 grid grid-cols-3 gap-4">
          {STATS.map(({ icon: Icon, label, value }) => (
            <div
              key={label}
              className="rounded-2xl p-4"
              style={{
                background: 'rgba(255,255,255,0.06)',
                backdropFilter: 'blur(10px)',
                border: '1px solid rgba(255,255,255,0.08)',
              }}
            >
              <Icon className="w-4 h-4 mb-2" style={{ color: '#e09b3d' }} />
              <p className="text-white font-bold text-lg leading-none mb-1">{value}</p>
              <p className="text-slate-500 text-[11px] leading-snug">{label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ══════════════════════════════════════
          RIGHT PANEL (Form)
      ══════════════════════════════════════ */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-12 relative z-10 lg:bg-[#F7F7F5]">
        
        {/* Logo mobile (layar kecil) - Revert to Initial */}
        <div className="lg:hidden flex flex-col items-center gap-2 mb-10">
          <Image
            src="/logo.svg"
            alt="KOPDAR Logo"
            width={80}
            height={80}
            className="object-contain drop-shadow-md"
            priority
          />
          <div className="text-center lg:text-left">
            <p className="text-white lg:text-ink-800 font-bold text-xl tracking-widest uppercase">
              {setting?.nama_koperasi || 'Kopdar'}
            </p>
            <p className="text-blue-200 lg:text-ink-300 text-[10px] tracking-widest uppercase">
              {setting?.deskripsi || 'Koperasi Simpan Pinjam'}
            </p>
          </div>

        </div>

        <div className="w-full max-w-[400px] relative z-10">

          {/* Heading - Responsive alignment & colors */}
          <div className="mb-8 text-center lg:text-left px-4 lg:px-0">
            <h2 className="text-3xl lg:text-2xl font-bold text-white lg:text-ink-800 mb-2 lg:mb-1 tracking-tight">Selamat datang</h2>
            <p className="text-blue-100 lg:text-ink-300 text-sm opacity-80 lg:opacity-100">Masuk untuk mengakses sistem koperasi</p>
          </div>

          {/* Card form - Revert to Initial White Card */}
          <div className="bg-white rounded-[32px] shadow-[0_20px_50px_rgba(0,0,0,0.3)] border border-white/10 p-8">
            <form onSubmit={handleSubmit} noValidate className="space-y-6">






              {/* Error */}
              {error && (
                <div className="flex items-start gap-2.5 px-3.5 py-3 rounded-xl bg-red-50 border border-red-100 animate-fade-in">
                  <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                  <p className="text-xs text-red-600 leading-relaxed">{error}</p>
                </div>
              )}

              {/* Username - Revert to Initial */}
              <div className="space-y-2">
                <label htmlFor="username" className="block text-xs font-semibold text-ink-600 tracking-wide uppercase">
                  Username
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-200">
                    <Users className="w-4 h-4" />
                  </span>
                  <input
                    id="username"
                    type="text"
                    disabled={isLoading}
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Masukkan username"
                    className={cn(
                      'w-full h-11 pl-10 pr-4 rounded-xl border text-sm text-ink-800',
                      'placeholder:text-ink-200 bg-surface-50 outline-none transition-all duration-150',
                      'focus:bg-white focus:ring-2 focus:ring-[#2a7fc5]/20 focus:border-[#2a7fc5]',
                      'disabled:bg-surface-100 disabled:cursor-not-allowed',
                      error ? 'border-red-300' : 'border-surface-300 hover:border-ink-200'
                    )}
                  />
                </div>
              </div>

              {/* Password - Revert to Initial */}
              <div className="space-y-2">
                <label htmlFor="password" className="block text-xs font-semibold text-ink-600 tracking-wide uppercase">
                  Password
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-200">
                    <Shield className="w-4 h-4" />
                  </span>
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    disabled={isLoading}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Masukkan password"
                    className={cn(
                      'w-full h-11 pl-10 pr-11 rounded-xl border text-sm text-ink-800',
                      'placeholder:text-ink-200 bg-surface-50 outline-none transition-all duration-150',
                      'focus:bg-white focus:ring-2 focus:ring-[#2a7fc5]/20 focus:border-[#2a7fc5]',
                      'disabled:bg-surface-100 disabled:cursor-not-allowed',
                      error ? 'border-red-300' : 'border-surface-300 hover:border-ink-200'
                    )}
                  />
                  <button
                    type="button"
                    tabIndex={-1}
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-ink-300 hover:text-ink-500 transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Submit button - Revert to Initial */}
              <button
                type="submit"
                disabled={isLoading}
                className={cn(
                  'w-full h-11 rounded-xl text-sm font-semibold mt-2',
                  'flex items-center justify-center gap-2 text-white shadow-md',
                  'transition-all duration-200',
                  'hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0',
                  'disabled:opacity-60 disabled:cursor-not-allowed disabled:translate-y-0'
                )}
                style={{ background: 'linear-gradient(135deg, #1a2f4a 0%, #2a7fc5 100%)' }}
              >
                {isLoading ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /><span>Memproses...</span></>
                ) : (
                  <><LogIn className="w-4 h-4" /><span>Masuk ke Sistem</span></>
                )}
              </button>




            </form>
          </div>

          {/* Role badges */}
          {/* <div className="mt-6 flex items-center gap-2 justify-center flex-wrap">
            <p className="text-[11px] text-ink-300 mr-1">Akses untuk:</p>
            {['Admin', 'Bendahara', 'Ketua'].map((role) => (
              <span
                key={role}
                className="text-[11px] px-2.5 py-1 rounded-full font-medium bg-white border border-surface-300 text-ink-500 shadow-sm"
              >
                {role}
              </span>
            ))}
          </div> */}

          <p className="text-center lg:text-left text-[11px] text-blue-200 lg:text-ink-200 mt-8">
            © {new Date().getFullYear()} {setting?.nama_koperasi || 'KOPDAR'} — {setting?.deskripsi || 'Koperasi Simpan Pinjam'}. All rights reserved.
          </p>

        </div>
      </div>
    </div>
  )
}