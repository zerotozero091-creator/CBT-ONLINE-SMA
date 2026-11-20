/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import {
  Settings,
  Layers,
  Calendar,
  BookOpen,
  Users,
  Shield,
  FileSpreadsheet,
  Database,
  Wifi,
  WifiOff,
  LogOut,
  GraduationCap,
  UserCheck,
  KeyRound,
  School,
  Sparkles,
} from 'lucide-react';
import { AuthUser, AppBrandingSettings } from '../types/cbt';
import { CBTStorageService, DEFAULT_SCHOOL_LOGO_URL } from '../services/cbt-storage';
import { ActiveView } from './Navbar';

interface SidebarProps {
  activeView: ActiveView;
  setActiveView: (view: ActiveView) => void;
  currentUser: AuthUser | null;
  onLogout: () => void;
  branding: AppBrandingSettings;
  isSimulatedOffline: boolean;
  onToggleSimulatedOffline: () => void;
  activeToken: string;
  adminSubTab?: string;
  setAdminSubTab?: (tab: 'branding' | 'classes' | 'activities' | 'subjects' | 'teachers' | 'students' | 'supabase') => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeView,
  setActiveView,
  currentUser,
  onLogout,
  branding,
  isSimulatedOffline,
  onToggleSimulatedOffline,
  activeToken,
  adminSubTab = 'branding',
  setAdminSubTab,
}) => {
  const role = currentUser?.role || 'siswa';

  return (
    <aside className="w-64 sm:w-72 bg-slate-900 border-r border-slate-800 text-slate-300 flex flex-col justify-between shrink-0 h-screen sticky top-0 transition-colors select-none z-30 shadow-xl">
      {/* 1. Header with dynamic School Logo & Titles */}
      <div className="p-5 border-b border-slate-800 bg-slate-950/40">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-white p-1 border border-slate-700 shadow-sm flex items-center justify-center shrink-0 overflow-hidden">
            <img
              src={CBTStorageService.resolveLogoUrl(branding.logoUrl)}
              alt="Logo Sekolah"
              className="w-full h-full object-contain"
              onError={(e) => {
                e.currentTarget.onerror = null;
                e.currentTarget.src = DEFAULT_SCHOOL_LOGO_URL;
              }}
              referrerPolicy="no-referrer"
            />
          </div>
          <div className="min-w-0 flex-1">
            <h1 className="text-xs font-bold text-white truncate leading-tight">
              {branding.title2 || 'MAN 1 INSAN CENDEKIA'}
            </h1>
            <p className="text-[11px] text-teal-400 font-medium truncate mt-0.5">
              {branding.title3 || 'CBT Online Mandiri'}
            </p>
          </div>
        </div>

        {/* Active Exam Token Pill */}
        <div className="mt-3.5 p-2 bg-slate-800/80 rounded-xl border border-slate-700/80 flex items-center justify-between text-xs">
          <span className="text-slate-400 text-[11px] flex items-center gap-1.5">
            <KeyRound className="w-3.5 h-3.5 text-amber-400" />
            Token Ujian:
          </span>
          <span className="font-mono font-bold text-amber-400 tracking-wider">
            {activeToken}
          </span>
        </div>
      </div>

      {/* 2. Left Menu Items (Tailored per Role) */}
      <div className="flex-1 px-3 py-4 space-y-6 overflow-y-auto">
        {/* ADMIN MENU */}
        {role === 'admin' && (
          <div className="space-y-1">
            <div className="px-3 pb-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Menu Administrator
            </div>

            <button
              onClick={() => {
                setActiveView('admin');
                setAdminSubTab?.('branding');
              }}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-all ${
                activeView === 'admin' && adminSubTab === 'branding'
                  ? 'bg-teal-500/20 text-teal-300 border border-teal-500/40 font-semibold shadow-xs'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/70'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Settings className="w-4 h-4 text-amber-400" />
                <span>Setting & Logo Sekolah</span>
              </div>
              {activeView === 'admin' && adminSubTab === 'branding' && (
                <div className="w-1.5 h-1.5 rounded-full bg-teal-400" />
              )}
            </button>

            <button
              onClick={() => {
                setActiveView('admin');
                setAdminSubTab?.('classes');
              }}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-all ${
                activeView === 'admin' && adminSubTab === 'classes'
                  ? 'bg-teal-500/20 text-teal-300 border border-teal-500/40 font-semibold shadow-xs'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/70'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Layers className="w-4 h-4 text-emerald-400" />
                <span>Kelola Kelas Siswa</span>
              </div>
              {activeView === 'admin' && adminSubTab === 'classes' && (
                <div className="w-1.5 h-1.5 rounded-full bg-teal-400" />
              )}
            </button>

            <button
              onClick={() => {
                setActiveView('admin');
                setAdminSubTab?.('activities');
              }}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-all ${
                activeView === 'admin' && adminSubTab === 'activities'
                  ? 'bg-teal-500/20 text-teal-300 border border-teal-500/40 font-semibold shadow-xs'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/70'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Calendar className="w-4 h-4 text-sky-400" />
                <span>Nama Aktivitas Ujian</span>
              </div>
              {activeView === 'admin' && adminSubTab === 'activities' && (
                <div className="w-1.5 h-1.5 rounded-full bg-teal-400" />
              )}
            </button>

            <button
              onClick={() => {
                setActiveView('admin');
                setAdminSubTab?.('subjects');
              }}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-all ${
                activeView === 'admin' && adminSubTab === 'subjects'
                  ? 'bg-teal-500/20 text-teal-300 border border-teal-500/40 font-semibold shadow-xs'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/70'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <BookOpen className="w-4 h-4 text-blue-400" />
                <span>Nama Mata Pelajaran</span>
              </div>
              {activeView === 'admin' && adminSubTab === 'subjects' && (
                <div className="w-1.5 h-1.5 rounded-full bg-teal-400" />
              )}
            </button>

            {/* MASTER GURU */}
            <button
              onClick={() => {
                setActiveView('admin');
                setAdminSubTab?.('teachers');
              }}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-all ${
                activeView === 'admin' && adminSubTab === 'teachers'
                  ? 'bg-teal-500/20 text-teal-300 border border-teal-500/40 font-semibold shadow-xs'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/70'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <UserCheck className="w-4 h-4 text-teal-400" />
                <span>Master Guru</span>
              </div>
              {activeView === 'admin' && adminSubTab === 'teachers' && (
                <div className="w-1.5 h-1.5 rounded-full bg-teal-400" />
              )}
            </button>

            <button
              onClick={() => {
                setActiveView('admin');
                setAdminSubTab?.('students');
              }}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-all ${
                activeView === 'admin' && adminSubTab === 'students'
                  ? 'bg-teal-500/20 text-teal-300 border border-teal-500/40 font-semibold shadow-xs'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/70'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Users className="w-4 h-4 text-purple-400" />
                <span>Master Siswa & NIS</span>
              </div>
              {activeView === 'admin' && adminSubTab === 'students' && (
                <div className="w-1.5 h-1.5 rounded-full bg-teal-400" />
              )}
            </button>

            <div className="pt-2">
              <div className="px-3 pb-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Ujian & Asesmen
              </div>

              <button
                onClick={() => setActiveView('questions')}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-all ${
                  activeView === 'questions'
                    ? 'bg-teal-500/20 text-teal-300 border border-teal-500/40 font-semibold shadow-xs'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800/70'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <BookOpen className="w-4 h-4 text-indigo-400" />
                  <span>Bank Soal</span>
                </div>
              </button>

              <button
                onClick={() => setActiveView('proctor')}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-all ${
                  activeView === 'proctor'
                    ? 'bg-teal-500/20 text-teal-300 border border-teal-500/40 font-semibold shadow-xs'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800/70'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Shield className="w-4 h-4 text-rose-400" />
                  <span>Ruang Pengawas Live</span>
                </div>
              </button>

              <button
                onClick={() => setActiveView('analytics')}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-all ${
                  activeView === 'analytics'
                    ? 'bg-teal-500/20 text-teal-300 border border-teal-500/40 font-semibold shadow-xs'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800/70'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
                  <span>Rekap Nilai & Ekspor</span>
                </div>
              </button>

              <button
                onClick={() => {
                  setActiveView('admin');
                  setAdminSubTab?.('supabase');
                }}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-all ${
                  activeView === 'admin' && adminSubTab === 'supabase'
                    ? 'bg-teal-500/20 text-teal-300 border border-teal-500/40 font-semibold shadow-xs'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800/70'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Database className="w-4 h-4 text-cyan-400" />
                  <span>Supabase PostgreSQL</span>
                </div>
              </button>
            </div>
          </div>
        )}

        {/* GURU MENU */}
        {role === 'guru' && (
          <div className="space-y-1">
            <div className="px-3 pb-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Menu Pengampu Guru
            </div>

            <button
              onClick={() => setActiveView('guru')}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-all ${
                activeView === 'guru'
                  ? 'bg-teal-500/20 text-teal-300 border border-teal-500/40 font-semibold shadow-xs'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/70'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Calendar className="w-4 h-4 text-indigo-400" />
                <span>Pengelolaan Jadwal Ujian</span>
              </div>
            </button>

            <button
              onClick={() => setActiveView('questions')}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-all ${
                activeView === 'questions'
                  ? 'bg-teal-500/20 text-teal-300 border border-teal-500/40 font-semibold shadow-xs'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/70'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <BookOpen className="w-4 h-4 text-blue-400" />
                <span>Unggah &amp; Bank Soal</span>
              </div>
            </button>

            <button
              onClick={() => setActiveView('proctor')}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-all ${
                activeView === 'proctor'
                  ? 'bg-teal-500/20 text-teal-300 border border-teal-500/40 font-semibold shadow-xs'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/70'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Shield className="w-4 h-4 text-rose-400" />
                <span>Ruang Pengawas Live</span>
              </div>
            </button>

            <button
              onClick={() => setActiveView('analytics')}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-all ${
                activeView === 'analytics'
                  ? 'bg-teal-500/20 text-teal-300 border border-teal-500/40 font-semibold shadow-xs'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/70'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
                <span>Rekapitulasi Nilai Siswa</span>
              </div>
            </button>
          </div>
        )}

        {/* SISWA MENU */}
        {role === 'siswa' && (
          <div className="space-y-1">
            <div className="px-3 pb-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Menu Peserta Siswa
            </div>

            <button
              onClick={() => setActiveView('siswa')}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-all ${
                activeView === 'siswa'
                  ? 'bg-teal-500/20 text-teal-300 border border-teal-500/40 font-semibold shadow-xs'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/70'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Calendar className="w-4 h-4 text-teal-400" />
                <span>Jadwal Ujian Aktif</span>
              </div>
            </button>
          </div>
        )}
      </div>

      {/* 3. Bottom Section: Offline Switcher, User Card & Logout */}
      <div className="p-4 border-t border-slate-800 bg-slate-950/40 space-y-3">
        {/* Offline Simulator Switch */}
        <button
          onClick={onToggleSimulatedOffline}
          className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium border transition-all ${
            isSimulatedOffline
              ? 'bg-amber-950/70 border-amber-800 text-amber-300'
              : 'bg-slate-800/80 border-slate-700 text-emerald-400'
          }`}
          title="Klik untuk simulasi putus koneksi jaringan"
        >
          <div className="flex items-center gap-2">
            {isSimulatedOffline ? (
              <WifiOff className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            ) : (
              <Wifi className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            )}
            <span>{isSimulatedOffline ? 'Simulasi Offline' : 'Koneksi Online'}</span>
          </div>
          <span className="text-[10px] font-mono font-semibold">
            {isSimulatedOffline ? 'Local-DB' : 'Auto-Sync'}
          </span>
        </button>

        {/* User Profile Capsule */}
        <div className="p-2.5 bg-slate-800/90 rounded-xl border border-slate-700/80 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-teal-600 text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-xs">
              {currentUser?.name ? currentUser.name.charAt(0) : 'U'}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.2 rounded bg-teal-950 text-teal-300 border border-teal-800">
                  {role}
                </span>
                {currentUser?.nis && (
                  <span className="text-[10px] font-mono text-slate-400">
                    {currentUser.nis}
                  </span>
                )}
              </div>
              <p className="text-xs font-bold text-white truncate mt-0.5">
                {currentUser?.name || 'Pengguna'}
              </p>
            </div>
          </div>

          <button
            onClick={onLogout}
            className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-slate-700/60 rounded-lg transition-colors shrink-0"
            title="Ganti Peran / Keluar"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
};
