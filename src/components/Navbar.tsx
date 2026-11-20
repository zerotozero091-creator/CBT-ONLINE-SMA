/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import {
  Wifi,
  WifiOff,
  KeyRound,
  LogOut,
  Shield,
  UserCheck,
  GraduationCap
} from 'lucide-react';
import { AuthUser, AppBrandingSettings } from '../types/cbt';

export type ActiveView = 'auth' | 'admin' | 'guru' | 'siswa' | 'proctor' | 'questions' | 'analytics' | 'supabase';

interface NavbarProps {
  activeView: ActiveView;
  setActiveView: (view: ActiveView) => void;
  currentUser: AuthUser | null;
  onLogout: () => void;
  branding: AppBrandingSettings;
  isSimulatedOffline: boolean;
  onToggleSimulatedOffline: () => void;
  activeToken: string;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeView,
  setActiveView,
  currentUser,
  onLogout,
  branding,
  isSimulatedOffline,
  onToggleSimulatedOffline,
  activeToken,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between gap-4 h-16">
          {/* Zone 1: Single text wordmark brand */}
          <div className="flex items-center gap-3 shrink-0">
            <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold text-lg shadow-xs">
              C
            </div>
            <div>
              <span className="text-base font-bold tracking-tight text-slate-900 dark:text-slate-100 whitespace-nowrap">
                {branding.title2 || 'CBT Mandiri Online'}
              </span>
              <span className="hidden sm:inline-block ml-2 text-xs text-slate-500 dark:text-slate-400">
                · {branding.title3 || 'Asesmen Sekolah & Madrasah'}
              </span>
            </div>
          </div>

          {/* Zone 2: Navigation based on role */}
          <nav className="hidden md:flex items-center gap-1 sm:gap-2">
            {!currentUser ? (
              <button
                onClick={() => setActiveView('auth')}
                className="px-3 py-1.5 text-xs font-semibold rounded-md bg-indigo-50 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300"
              >
                Form Login Peran
              </button>
            ) : (
              <>
                {currentUser.role === 'admin' && (
                  <>
                    <button
                      onClick={() => setActiveView('admin')}
                      className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors whitespace-nowrap shrink-0 ${
                        activeView === 'admin'
                          ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300'
                          : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                      }`}
                    >
                      Dashboard Admin
                    </button>
                    <button
                      onClick={() => setActiveView('questions')}
                      className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors whitespace-nowrap shrink-0 ${
                        activeView === 'questions'
                          ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300'
                          : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                      }`}
                    >
                      Bank Soal
                    </button>
                    <button
                      onClick={() => setActiveView('proctor')}
                      className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors whitespace-nowrap shrink-0 ${
                        activeView === 'proctor'
                          ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300'
                          : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                      }`}
                    >
                      Ruang Pengawas
                    </button>
                    <button
                      onClick={() => setActiveView('analytics')}
                      className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors whitespace-nowrap shrink-0 ${
                        activeView === 'analytics'
                          ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300'
                          : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                      }`}
                    >
                      Rekap & Ekspor
                    </button>
                  </>
                )}

                {currentUser.role === 'guru' && (
                  <>
                    <button
                      onClick={() => setActiveView('guru')}
                      className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors whitespace-nowrap shrink-0 ${
                        activeView === 'guru'
                          ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300'
                          : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                      }`}
                    >
                      Jadwal & Soal Guru
                    </button>
                    <button
                      onClick={() => setActiveView('proctor')}
                      className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors whitespace-nowrap shrink-0 ${
                        activeView === 'proctor'
                          ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300'
                          : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                      }`}
                    >
                      Ruang Pengawas
                    </button>
                    <button
                      onClick={() => setActiveView('analytics')}
                      className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors whitespace-nowrap shrink-0 ${
                        activeView === 'analytics'
                          ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300'
                          : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                      }`}
                    >
                      Rekap Nilai
                    </button>
                  </>
                )}

                {currentUser.role === 'siswa' && (
                  <button
                    onClick={() => setActiveView('siswa')}
                    className="px-3 py-1.5 text-xs font-semibold rounded-md bg-indigo-50 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300"
                  >
                    Ruang Ujian Siswa
                  </button>
                )}
              </>
            )}
          </nav>

          {/* Zone 3: Connection, Token, User & Logout */}
          <div className="flex items-center gap-3 shrink-0">
            {/* Active Token quick indicator */}
            <div className="hidden lg:flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-md">
              <KeyRound className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
              <span>Token:</span>
              <span className="font-mono font-bold text-slate-900 dark:text-white tracking-wider">
                {activeToken}
              </span>
            </div>

            {/* Offline Simulator Switch */}
            <button
              onClick={onToggleSimulatedOffline}
              title={
                isSimulatedOffline
                  ? 'Klik untuk menyambungkan kembali (Simulasi Online)'
                  : 'Klik untuk menguji ketahanan Local-First saat jaringan putus'
              }
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md border transition-all ${
                isSimulatedOffline
                  ? 'bg-amber-50 border-amber-300 text-amber-800 dark:bg-amber-950/60 dark:border-amber-700 dark:text-amber-200'
                  : 'bg-emerald-50 border-emerald-300 text-emerald-800 dark:bg-emerald-950/60 dark:border-emerald-700 dark:text-emerald-200'
              }`}
            >
              {isSimulatedOffline ? (
                <>
                  <WifiOff className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                  <span className="font-semibold">Simulasi Offline</span>
                </>
              ) : (
                <>
                  <Wifi className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                  <span>Online</span>
                </>
              )}
            </button>

            {/* User Role Badge & Logout button */}
            {currentUser && (
              <div className="flex items-center gap-2 pl-2 border-l border-slate-200 dark:border-slate-800">
                <div className="hidden sm:flex items-center gap-1.5 text-xs text-slate-700 dark:text-slate-300">
                  {currentUser.role === 'admin' && (
                    <span className="px-2 py-0.5 rounded bg-slate-900 text-white font-semibold text-[11px] flex items-center gap-1">
                      <Shield className="w-3 h-3" />
                      Admin
                    </span>
                  )}
                  {currentUser.role === 'guru' && (
                    <span className="px-2 py-0.5 rounded bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 font-semibold text-[11px] flex items-center gap-1">
                      <UserCheck className="w-3 h-3" />
                      Guru
                    </span>
                  )}
                  {currentUser.role === 'siswa' && (
                    <span className="px-2 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 font-semibold text-[11px] flex items-center gap-1">
                      <GraduationCap className="w-3 h-3" />
                      NIS: {currentUser.nis}
                    </span>
                  )}
                  <span className="font-medium max-w-[120px] truncate">{currentUser.name}</span>
                </div>

                <button
                  onClick={onLogout}
                  className="p-1.5 text-slate-500 hover:text-red-600 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                  title="Ganti Peran / Keluar"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
