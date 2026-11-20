/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  UserCheck,
  GraduationCap,
  Shield,
  Search,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  User,
  Key,
  BookOpen,
  X,
  Loader2,
  Check,
  Eye,
  EyeOff,
  CircleDot,
  ListChecks,
  AlignLeft,
  FileText
} from 'lucide-react';
import { AuthUser, Student, Teacher, UserRole, AppBrandingSettings } from '../../types/cbt';
import { CBTStorageService } from '../../services/cbt-storage';
import { SupabaseService } from '../../services/supabase-service';

interface LoginFormProps {
  onLoginSuccess: (user: AuthUser) => void;
  branding: AppBrandingSettings;
}

export const LoginForm: React.FC<LoginFormProps> = ({ onLoginSuccess, branding }) => {
  const [selectedRole, setSelectedRole] = useState<UserRole>('siswa');

  // Siswa Form States
  const [inputNis, setInputNis] = useState<string>('');
  const [foundStudent, setFoundStudent] = useState<Student | null>(null);
  const [searchFeedback, setSearchFeedback] = useState<string>('');

  // Guru Form States
  const [guruUsername, setGuruUsername] = useState<string>('');
  const [guruPassword, setGuruPassword] = useState<string>('');
  const [matchedTeacher, setMatchedTeacher] = useState<Teacher | null>(null);
  const [showPasswordEditor, setShowPasswordEditor] = useState<boolean>(false);
  const [newPasswordInput, setNewPasswordInput] = useState<string>('');
  const [passwordToast, setPasswordToast] = useState<string | null>(null);

  // Admin Form States
  const [adminUsername, setAdminUsername] = useState<string>('');
  const [adminPassword, setAdminPassword] = useState<string>('');
  const [showAdminPassword, setShowAdminPassword] = useState<boolean>(false);
  const [showGuruPassword, setShowGuruPassword] = useState<boolean>(false);
  const [isVerifyingAdmin, setIsVerifyingAdmin] = useState<boolean>(false);

  const [errorMessage, setErrorMessage] = useState<string>('');
  const [showGuideModal, setShowGuideModal] = useState<boolean>(false);
  const [guideTab, setGuideTab] = useState<'all' | 'siswa' | 'soal' | 'guru' | 'admin'>('all');
  const [isSearchingRemote, setIsSearchingRemote] = useState<boolean>(false);
  const remoteSearchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const latestNisQueryRef = useRef<string>('');

  // Auto re-check typed NIS/username when background Supabase sync completes
  useEffect(() => {
    const handleStudentsSynced = () => {
      const trimmed = latestNisQueryRef.current.trim();
      if (!trimmed) return;
      const syncedStudent = CBTStorageService.findStudentByNis(trimmed);
      if (syncedStudent) {
        setFoundStudent(syncedStudent);
        setIsSearchingRemote(false);
        setSearchFeedback('Data siswa ditemukan! Silakan verifikasi biodata Anda.');
      }
    };

    const handleTeachersSynced = () => {
      if (!guruUsername.trim()) return;
      const syncedTeacher = CBTStorageService.findTeacherByUsername(guruUsername.trim());
      if (syncedTeacher) {
        setMatchedTeacher(syncedTeacher);
      }
    };

    window.addEventListener('cbt-students-change', handleStudentsSynced);
    window.addEventListener('cbt-teachers-change', handleTeachersSynced);
    return () => {
      window.removeEventListener('cbt-students-change', handleStudentsSynced);
      window.removeEventListener('cbt-teachers-change', handleTeachersSynced);
    };
  }, [guruUsername]);

  useEffect(() => {
    return () => {
      if (remoteSearchTimerRef.current) {
        clearTimeout(remoteSearchTimerRef.current);
      }
    };
  }, []);

  // Handle NIS live change (O(1) local Map + debounced indexed Supabase lookup)
  const handleNisChange = (nisVal: string) => {
    setInputNis(nisVal);
    latestNisQueryRef.current = nisVal;
    setErrorMessage('');

    if (remoteSearchTimerRef.current) {
      clearTimeout(remoteSearchTimerRef.current);
    }

    const trimmed = nisVal.trim();
    if (!trimmed) {
      setFoundStudent(null);
      setIsSearchingRemote(false);
      setSearchFeedback('');
      return;
    }

    const student = CBTStorageService.findStudentByNis(trimmed);
    if (student) {
      setFoundStudent(student);
      setIsSearchingRemote(false);
      setSearchFeedback('Data siswa ditemukan! Silakan verifikasi biodata Anda.');
      return;
    }

    setFoundStudent(null);

    const cfg = SupabaseService.getConfig();
    if (cfg.isConnected && cfg.url && cfg.anonKey && trimmed.length >= 3) {
      setIsSearchingRemote(true);
      setSearchFeedback('Mencari NIS di database server...');
      remoteSearchTimerRef.current = setTimeout(async () => {
        const remote = await SupabaseService.findStudentByNisRemote(trimmed);
        if (latestNisQueryRef.current.trim() !== trimmed) return;
        setIsSearchingRemote(false);
        if (remote) {
          CBTStorageService.cacheRemoteStudent(remote);
          setFoundStudent(remote);
          setSearchFeedback('Data siswa ditemukan dari server! Silakan verifikasi biodata Anda.');
        } else {
          setSearchFeedback('NIS belum terdaftar dalam basis data siswa.');
        }
      }, 280);
    } else {
      setIsSearchingRemote(false);
      setSearchFeedback('NIS belum terdaftar dalam basis data siswa.');
    }
  };

  // Handle Guru username live change for master database check & password button toggle
  const handleGuruUsernameChange = (uname: string) => {
    setGuruUsername(uname);
    setErrorMessage('');
    setShowPasswordEditor(false);

    if (!uname.trim()) {
      setMatchedTeacher(null);
      return;
    }

    const teacher = CBTStorageService.findTeacherByUsername(uname.trim());
    if (teacher) {
      setMatchedTeacher(teacher);
    } else {
      setMatchedTeacher(null);
    }
  };

  // Handle password update for matching master guru
  const handleUpdatePassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (!matchedTeacher) return;
    if (!newPasswordInput.trim()) {
      setErrorMessage('Password baru tidak boleh kosong.');
      return;
    }

    const success = CBTStorageService.updateTeacherPassword(matchedTeacher.username || matchedTeacher.nip, newPasswordInput.trim());
    if (success) {
      setGuruPassword(newPasswordInput.trim());
      setShowPasswordEditor(false);
      setNewPasswordInput('');
      setPasswordToast('Password guru berhasil diperbarui dan disimpan!');
      setTimeout(() => setPasswordToast(null), 4000);
    } else {
      setErrorMessage('Gagal memperbarui password pada master guru.');
    }
  };

  // Submit Siswa
  const handleLoginSiswa = async (e: React.FormEvent) => {
    e.preventDefault();
    let targetStudent = foundStudent || CBTStorageService.findStudentByNis(inputNis.trim());

    if (!targetStudent && inputNis.trim()) {
      setIsSearchingRemote(true);
      const remote = await SupabaseService.findStudentByNisRemote(inputNis.trim());
      setIsSearchingRemote(false);
      if (remote) {
        CBTStorageService.cacheRemoteStudent(remote);
        setFoundStudent(remote);
        targetStudent = remote;
      }
    }

    if (!targetStudent) {
      setErrorMessage('NIS tidak valid atau belum terdaftar.');
      return;
    }

    const authUser: AuthUser = {
      role: 'siswa',
      id: targetStudent.id,
      name: targetStudent.name,
      nis: targetStudent.nis,
      student: targetStudent,
    };

    CBTStorageService.setAuthUser(authUser);
    CBTStorageService.setCurrentStudent(targetStudent);
    onLoginSuccess(authUser);
  };

  // Submit Guru with Master Database Validation & Custom Password Access
  const handleLoginGuru = (e: React.FormEvent) => {
    e.preventDefault();
    if (!guruUsername || !guruPassword) {
      setErrorMessage('Username/NIP dan Password guru wajib diisi.');
      return;
    }

    const teacher = CBTStorageService.findTeacherByUsername(guruUsername.trim());
    if (!teacher) {
      setErrorMessage(`Username / NIP "${guruUsername}" tidak ditemukan dalam daftar Master Guru.`);
      return;
    }

    // Check custom password if set in master guru, else fallback to 'guru' or matching password
    const expectedPassword = teacher.password || 'guru';
    if (guruPassword !== expectedPassword && guruPassword !== 'guru') {
      setErrorMessage('Password guru tidak valid. Silakan gunakan tombol "Update Password" jika Anda lupa password.');
      return;
    }

    const authUser: AuthUser = {
      role: 'guru',
      id: teacher.id,
      name: teacher.name,
      username: teacher.username,
      subject: teacher.subject,
    };

    CBTStorageService.setAuthUser(authUser);
    onLoginSuccess(authUser);
  };

  // Submit Admin with real credential verification (local + Supabase branding sync)
  const handleLoginAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    const inputUser = adminUsername.trim();
    const inputPass = adminPassword;

    if (!inputUser || !inputPass) {
      setErrorMessage('Username dan Password administrator wajib diisi.');
      return;
    }

    let creds = CBTStorageService.getAdminCredentials();
    let isMatch =
      inputUser.toLowerCase() === creds.username.toLowerCase() &&
      inputPass === creds.password;

    if (!isMatch && SupabaseService.getConfig().isConnected) {
      setIsVerifyingAdmin(true);
      await SupabaseService.pullBrandingOnly();
      setIsVerifyingAdmin(false);
      creds = CBTStorageService.getAdminCredentials();
      isMatch =
        inputUser.toLowerCase() === creds.username.toLowerCase() &&
        inputPass === creds.password;
    }

    if (!isMatch) {
      setErrorMessage('Username atau Password Administrator tidak valid.');
      return;
    }

    const authUser: AuthUser = {
      role: 'admin',
      id: 'admin-001',
      name: 'Administrator CBT Pusat',
      username: creds.username,
    };

    CBTStorageService.setAuthUser(authUser);
    onLoginSuccess(authUser);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 sm:p-6 bg-gradient-to-br from-sky-100 via-blue-50 to-indigo-100 dark:from-slate-950 dark:via-blue-950/60 dark:to-slate-900 text-slate-800 dark:text-slate-100 relative overflow-hidden">
      {/* Dynamic Ambient Pastel Blue Glows */}
      <div className="absolute w-[600px] h-[600px] rounded-full bg-sky-300/40 dark:bg-sky-900/25 blur-3xl pointer-events-none -top-32 -left-32 animate-pulse" />
      <div className="absolute w-[600px] h-[600px] rounded-full bg-indigo-300/40 dark:bg-indigo-900/25 blur-3xl pointer-events-none -bottom-32 -right-32" />
      <div className="absolute w-[400px] h-[400px] rounded-full bg-cyan-200/35 dark:bg-cyan-950/20 blur-3xl pointer-events-none top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />

      {/* Proportional Login Card */}
      <div className="w-full max-w-md md:max-w-4xl bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border border-blue-200 dark:border-slate-800 rounded-2xl shadow-xl p-5 sm:p-6 md:p-7 text-slate-900 dark:text-slate-100 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-5 md:gap-7 items-center">
          {/* Left Panel inside white card: School Identity & Classroom Illustration */}
          <div className="md:col-span-6 flex flex-col space-y-4">
            <div className="flex items-center justify-between md:justify-center gap-3">
              <div className="flex md:flex-col items-center gap-3 md:gap-2 text-left md:text-center flex-1 min-w-0">
                <div className="w-12 h-12 sm:w-14 sm:h-14 p-1 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm flex items-center justify-center overflow-hidden shrink-0">
                  <img
                    src={branding.logoUrl || '/src/assets/images/cbt_school_seal_1794586949675.jpg'}
                    alt="Logo Sekolah"
                    className="w-full h-full object-contain"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = '/src/assets/images/cbt_school_seal_1794586949675.jpg';
                    }}
                    referrerPolicy="no-referrer"
                  />
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] font-bold text-teal-600 dark:text-teal-400 uppercase tracking-widest truncate">
                    {branding.title1 || 'KEMENTERIAN AGAMA / DINAS PENDIDIKAN'}
                  </p>
                  <h1 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white leading-tight mt-0.5">
                    {branding.title2 || 'MAN 1 INSAN CENDEKIA'}
                  </h1>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    {branding.title3 || 'CBT Online Mandiri & Asesmen Digital'}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowGuideModal(true)}
                className="md:hidden px-2.5 py-1 bg-sky-50 dark:bg-slate-800 hover:bg-sky-100 text-sky-700 dark:text-sky-300 rounded-xl text-xs font-semibold flex items-center gap-1.5 border border-sky-200 dark:border-slate-700 transition-colors shadow-2xs shrink-0"
                title="Panduan Penggunaan Aplikasi CBT"
              >
                <BookOpen className="w-3.5 h-3.5 text-sky-600" />
                <span>Panduan</span>
              </button>
            </div>

            {/* Classroom Illustration inside the white login card */}
            <div className="rounded-xl overflow-hidden border border-blue-100 dark:border-slate-800 shadow-sm bg-slate-50 dark:bg-slate-800/50">
              <img
                src="/assets/aistudio/Gemini_Generated_Image_6owf5n6owf5n6owf_13eb130c.jpg"
                alt="Ilustrasi Ruang Kelas Pembelajaran dan Asesmen Digital CBT"
                className="w-full aspect-video object-cover block"
              />
            </div>
          </div>

          {/* Right Panel inside white card: Role Switcher, Auth Form & Footer */}
          <div className="md:col-span-6 flex flex-col">
            <div className="hidden md:flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-200 tracking-wide uppercase">
                Portal Masuk CBT
              </span>
              <button
                type="button"
                onClick={() => setShowGuideModal(true)}
                className="px-2.5 py-1 bg-sky-50 dark:bg-slate-800 hover:bg-sky-100 text-sky-700 dark:text-sky-300 rounded-xl text-xs font-semibold flex items-center gap-1.5 border border-sky-200 dark:border-slate-700 transition-colors shadow-2xs"
                title="Panduan Penggunaan Aplikasi CBT"
              >
                <BookOpen className="w-3.5 h-3.5 text-sky-600" />
                <span>Panduan Aplikasi</span>
              </button>
            </div>

        {/* Proportional Role Switcher Tabs */}
        <div className="grid grid-cols-3 gap-1.5 p-1 bg-slate-100 dark:bg-slate-800/80 rounded-2xl border border-slate-200/80 dark:border-slate-700 mb-5">
          <button
            type="button"
            onClick={() => {
              setSelectedRole('siswa');
              setErrorMessage('');
            }}
            className={`py-2 px-3 text-xs font-semibold rounded-xl transition-all flex items-center justify-center gap-1.5 ${
              selectedRole === 'siswa'
                ? 'bg-white dark:bg-slate-700 text-teal-700 dark:text-teal-200 shadow-xs border border-teal-200 dark:border-teal-700'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <GraduationCap className="w-4 h-4 text-teal-600 dark:text-teal-400" />
            <span>Siswa</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setSelectedRole('guru');
              setErrorMessage('');
            }}
            className={`py-2 px-3 text-xs font-semibold rounded-xl transition-all flex items-center justify-center gap-1.5 ${
              selectedRole === 'guru'
                ? 'bg-white dark:bg-slate-700 text-indigo-700 dark:text-indigo-200 shadow-xs border border-indigo-200 dark:border-indigo-700'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <UserCheck className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            <span>Guru</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setSelectedRole('admin');
              setErrorMessage('');
            }}
            className={`py-2 px-3 text-xs font-semibold rounded-xl transition-all flex items-center justify-center gap-1.5 ${
              selectedRole === 'admin'
                ? 'bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-200 shadow-xs border border-slate-300 dark:border-slate-600'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Shield className="w-4 h-4 text-slate-600 dark:text-slate-300" />
            <span>Admin</span>
          </button>
        </div>

        {errorMessage && (
          <div className="mb-4 p-3 bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 rounded-xl text-xs text-rose-800 dark:text-rose-200 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <span>{errorMessage}</span>
          </div>
        )}

        {passwordToast && (
          <div className="mb-4 p-3 bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 rounded-xl text-xs text-emerald-800 dark:text-emerald-200 flex items-center gap-2">
            <Check className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{passwordToast}</span>
          </div>
        )}

        {/* 1. SISWA TAB */}
        {selectedRole === 'siswa' && (
          <form onSubmit={handleLoginSiswa} className="space-y-3">
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Nomor Induk Siswa (NIS)
                </label>
                <span className="text-[11px] text-teal-600 dark:text-teal-400 font-medium">
                  Deteksi Otomatis
                </span>
              </div>

              <div className="relative">
                <input
                  type="text"
                  value={inputNis}
                  onChange={(e) => handleNisChange(e.target.value)}
                  placeholder="Ketik NIS Anda (contoh: 20241001)"
                  className="w-full text-xs sm:text-sm px-3.5 py-2.5 font-mono bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-teal-500 shadow-2xs"
                  required
                  autoFocus
                />
                <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-3 pointer-events-none" />
              </div>

              {searchFeedback && (
                <p
                  className={`text-[11px] mt-1.5 flex items-center gap-1 ${
                    foundStudent
                      ? 'text-emerald-700 dark:text-emerald-400 font-medium'
                      : isSearchingRemote
                      ? 'text-sky-600 dark:text-sky-400'
                      : 'text-amber-600 dark:text-amber-400'
                  }`}
                >
                  {foundStudent ? (
                    <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                  ) : isSearchingRemote ? (
                    <Loader2 className="w-3.5 h-3.5 shrink-0 animate-spin" />
                  ) : (
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  )}
                  <span>{searchFeedback}</span>
                </p>
              )}
            </div>



            {foundStudent ? (
              <div className="p-3.5 bg-teal-50/80 dark:bg-teal-950/40 border border-teal-300 dark:border-teal-800 rounded-2xl space-y-2">
                <div className="flex items-center justify-between pb-1.5 border-b border-teal-200/70 dark:border-teal-800/60">
                  <span className="text-[11px] font-bold text-teal-900 dark:text-teal-200 uppercase tracking-wider">
                    Biodata Siswa Terverifikasi:
                  </span>
                  <span className="text-[10px] font-bold text-teal-800 dark:text-teal-300 bg-teal-100 dark:bg-teal-900/70 px-2 py-0.5 rounded-full">
                    Cocok
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-[10px] text-slate-500 block">Nama Lengkap:</span>
                    <strong className="text-slate-900 dark:text-white truncate block">
                      {foundStudent.name}
                    </strong>
                  </div>

                  <div>
                    <span className="text-[10px] text-slate-500 block">Jenis Kelamin:</span>
                    <strong className="text-slate-900 dark:text-white">
                      {foundStudent.gender}
                    </strong>
                  </div>

                  <div>
                    <span className="text-[10px] text-slate-500 block">Kelas:</span>
                    <strong className="text-slate-900 dark:text-white">
                      {foundStudent.className}
                    </strong>
                  </div>

                  <div>
                    <span className="text-[10px] text-slate-500 block">Ruang Ujian:</span>
                    <strong className="text-slate-900 dark:text-white">
                      {foundStudent.room}
                    </strong>
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-3 bg-slate-50 dark:bg-slate-800/40 border border-dashed border-slate-300 dark:border-slate-700 rounded-xl text-center text-xs text-slate-500">
                Ketik NIS Anda di atas untuk menampilkan Nama, Gender, dan Kelas.
              </div>
            )}

            <button
              type="submit"
              disabled={!foundStudent}
              className="w-full py-2.5 px-4 bg-teal-700 hover:bg-teal-800 disabled:bg-slate-300 dark:disabled:bg-slate-800 text-white text-xs sm:text-sm font-semibold rounded-xl shadow-xs transition-colors flex items-center justify-center gap-2"
            >
              <span>Data Benar, Masuk ke Dashboard Siswa</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        )}

        {/* 2. GURU TAB (WITH MASTER GURU VERIFICATION & PASSWORD UPDATE BUTTON) */}
        {selectedRole === 'guru' && (
          <form onSubmit={handleLoginGuru} className="space-y-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Username / NIP Guru
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={guruUsername}
                  onChange={(e) => handleGuruUsernameChange(e.target.value)}
                  placeholder="Username / NIP guru (contoh: guru)"
                  className="w-full text-xs sm:text-sm px-3.5 py-2.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                  required
                />
                <User className="w-4 h-4 text-slate-400 absolute right-3.5 top-3 pointer-events-none" />
              </div>

              {matchedTeacher ? (
                <div className="mt-1.5 p-2 bg-indigo-50 dark:bg-indigo-950/50 border border-indigo-200 dark:border-indigo-800 rounded-xl text-[11px] text-indigo-900 dark:text-indigo-200 flex items-center justify-between">
                  <div>
                    <strong>{matchedTeacher.name}</strong> · <span className="text-indigo-600 dark:text-indigo-400">{matchedTeacher.subject}</span>
                  </div>
                  <span className="px-1.5 py-0.5 bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-300 rounded font-semibold text-[10px]">
                    Terdaftar di Master Guru
                  </span>
                </div>
              ) : (
                <p className="text-[11px] text-amber-600 dark:text-amber-400 mt-1">
                  ⚠️ Username belum terdaftar pada Master Guru. Pastikan username sesuai (coba: "guru" atau cek Master Guru di Admin).
                </p>
              )}
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Password
                </label>
                {matchedTeacher && (
                  <button
                    type="button"
                    onClick={() => setShowPasswordEditor(!showPasswordEditor)}
                    className="text-[11px] font-semibold text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 underline"
                  >
                    {showPasswordEditor ? 'Tutup Atur Password' : (matchedTeacher.password ? 'Update Password' : 'Tambahkan Password')}
                  </button>
                )}
              </div>

              <div className="relative">
                <input
                  type={showGuruPassword ? 'text' : 'password'}
                  value={guruPassword}
                  onChange={(e) => setGuruPassword(e.target.value)}
                  placeholder="Masukkan password guru"
                  className="w-full text-xs sm:text-sm pl-3.5 pr-10 py-2.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowGuruPassword(!showGuruPassword)}
                  className="absolute right-3 top-2.5 p-0.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                  title={showGuruPassword ? 'Sembunyikan password' : 'Tampilkan password'}
                >
                  {showGuruPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Password Editor Drawer (Appears when user clicks Tambahkan/Update Password) */}
            {showPasswordEditor && matchedTeacher && (
              <div className="p-3.5 bg-indigo-50/80 dark:bg-indigo-950/60 border border-indigo-300 dark:border-indigo-700 rounded-2xl space-y-2.5 animate-fade-in">
                <div className="flex items-center gap-1.5 text-xs font-bold text-indigo-900 dark:text-indigo-200">
                  <Key className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Atur Password Baru untuk {matchedTeacher.name}</span>
                </div>
                <input
                  type="text"
                  value={newPasswordInput}
                  onChange={(e) => setNewPasswordInput(e.target.value)}
                  placeholder="Ketik password baru guru..."
                  className="w-full text-xs px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
                />
                <div className="flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={handleUpdatePassword}
                    className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl shadow-xs transition-colors"
                  >
                    Simpan & Terapkan Password
                  </button>
                </div>
              </div>
            )}



            <button
              type="submit"
              disabled={!matchedTeacher}
              className="w-full py-2.5 px-4 bg-indigo-700 hover:bg-indigo-800 disabled:bg-slate-300 dark:disabled:bg-slate-800 text-white text-xs sm:text-sm font-semibold rounded-xl shadow-xs transition-colors flex items-center justify-center gap-2"
            >
              <UserCheck className="w-4 h-4" />
              <span>Masuk sebagai Guru Pengampu</span>
            </button>
          </form>
        )}

        {/* 3. ADMIN TAB */}
        {selectedRole === 'admin' && (
          <form onSubmit={handleLoginAdmin} className="space-y-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Username Administrator
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={adminUsername}
                  onChange={(e) => {
                    setAdminUsername(e.target.value);
                    setErrorMessage('');
                  }}
                  placeholder="Masukkan username administrator"
                  autoComplete="username"
                  className="w-full text-xs sm:text-sm pl-3.5 pr-10 py-2.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:ring-2 focus:ring-slate-500"
                  required
                />
                <Shield className="w-4 h-4 text-slate-400 absolute right-3.5 top-3 pointer-events-none" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Password Administrator
              </label>
              <div className="relative">
                <input
                  type={showAdminPassword ? 'text' : 'password'}
                  value={adminPassword}
                  onChange={(e) => {
                    setAdminPassword(e.target.value);
                    setErrorMessage('');
                  }}
                  placeholder="Masukkan password administrator"
                  autoComplete="current-password"
                  className="w-full text-xs sm:text-sm pl-3.5 pr-10 py-2.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:ring-2 focus:ring-slate-500"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowAdminPassword(!showAdminPassword)}
                  className="absolute right-3 top-2.5 p-0.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                  title={showAdminPassword ? 'Sembunyikan password' : 'Tampilkan password'}
                >
                  {showAdminPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isVerifyingAdmin}
              className="w-full py-2.5 px-4 bg-slate-900 hover:bg-slate-800 disabled:opacity-70 text-white text-xs sm:text-sm font-semibold rounded-xl shadow-xs transition-colors flex items-center justify-center gap-2"
            >
              {isVerifyingAdmin ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Memverifikasi Akun Admin...</span>
                </>
              ) : (
                <>
                  <Shield className="w-4 h-4" />
                  <span>Masuk sebagai Administrator</span>
                </>
              )}
            </button>
          </form>
        )}

            {/* Minimalist Proportional Footer */}
            <div className="mt-6 pt-3 border-t border-slate-200/80 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
              <span>created by Yoga Ruanto, S.Kom</span>
              <span className="font-mono text-teal-600 dark:text-teal-400">Local-First Ready</span>
            </div>
          </div>
        </div>
      </div>

      {/* PANDUAN PENGGUNAAN MODAL */}
      {showGuideModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl max-w-3xl w-full max-h-[90vh] flex flex-col overflow-hidden">
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-sky-50/70 dark:bg-slate-800/60">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-sky-600 text-white rounded-2xl shadow-sm">
                  <BookOpen className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-slate-900 dark:text-white">
                    Panduan Penggunaan Aplikasi CBT Online
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Petunjuk operasional Peserta, urutan membuat soal (PG Biasa, MCMA, Uraian), Guru, dan Admin
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowGuideModal(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-white rounded-xl hover:bg-slate-200/50 dark:hover:bg-slate-700 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Quick Section Filter Tabs */}
            <div className="px-6 py-2.5 border-b border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900/80 flex flex-wrap gap-1.5">
              {[
                { id: 'all', label: 'Semua Panduan' },
                { id: 'soal', label: 'Buat Soal (PG / MCMA / Uraian)' },
                { id: 'siswa', label: 'Peserta (Siswa)' },
                { id: 'guru', label: 'Guru & Pengawas' },
                { id: 'admin', label: 'Administrator' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setGuideTab(tab.id as typeof guideTab)}
                  className={`px-3 py-1 rounded-lg text-[11px] font-semibold transition-colors ${
                    guideTab === tab.id
                      ? 'bg-sky-600 text-white shadow-xs'
                      : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-5 text-xs text-slate-700 dark:text-slate-300">
              {/* Section 1: Siswa */}
              {(guideTab === 'all' || guideTab === 'siswa') && (
                <div className="p-4 bg-teal-50/60 dark:bg-teal-950/40 border border-teal-200 dark:border-teal-800/80 rounded-2xl space-y-2">
                  <h3 className="text-sm font-bold text-teal-900 dark:text-teal-200 flex items-center gap-2">
                    <GraduationCap className="w-4 h-4 text-teal-600" />
                    <span>1. Panduan untuk Peserta Ujian (Siswa)</span>
                  </h3>
                  <ol className="list-decimal pl-4 space-y-1.5 text-slate-600 dark:text-slate-300">
                    <li>Pilih tab <strong>Siswa</strong> pada form login.</li>
                    <li>Masukkan <strong>Nomor Induk Siswa (NIS)</strong> Anda. Sistem akan mendeteksi biodata secara otomatis (Nama, Kelas, Ruang, Jenis Kelamin).</li>
                    <li>Klik tombol <em>Masuk ke Dashboard Siswa</em>.</li>
                    <li>Pilih jadwal ujian aktif sesuai kelas Anda dan masukkan <strong>Token Ujian</strong> yang diberikan oleh pengawas.</li>
                    <li>Kerjakan soal di Ruang Ujian (baik pilihan tunggal, pilihan ganda kompleks centang lebih dari satu, maupun isian uraian), manfaatkan navigasi nomor soal &amp; tombol ragu-ragu, lalu klik <strong>Selesai &amp; Kumpul Ujian</strong> untuk melihat hasil nilai akhir.</li>
                  </ol>
                </div>
              )}

              {/* Section 2: Urutan Langkah Membuat Soal (PG Biasa, MCMA, Uraian) */}
              {(guideTab === 'all' || guideTab === 'soal') && (
                <div className="p-4 bg-amber-50/60 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/80 rounded-2xl space-y-4">
                  <div>
                    <h3 className="text-sm font-bold text-amber-950 dark:text-amber-200 flex items-center gap-2">
                      <FileText className="w-4 h-4 text-amber-600" />
                      <span>2. Urutan Langkah Membuat Soal (PG Biasa, MCMA &amp; Uraian)</span>
                    </h3>
                    <p className="text-[11px] text-amber-900/80 dark:text-amber-300/80 mt-1">
                      Berlaku di menu <strong>Kelola Bank Soal</strong> (Admin) maupun <strong>Unggah &amp; Kelola Bank Soal</strong> (Guru).
                    </p>
                  </div>

                  {/* Persiapan Paket */}
                  <div className="p-3 bg-white/80 dark:bg-slate-900/70 border border-amber-200/80 dark:border-amber-900/60 rounded-xl space-y-1.5">
                    <div className="font-bold text-slate-900 dark:text-white text-xs">
                      Langkah Persiapan Paket Soal:
                    </div>
                    <ol className="list-decimal pl-4 space-y-1 text-slate-600 dark:text-slate-300">
                      <li>Pilih <strong>Nama Aktivitas Ujian</strong> (misal: ASAJ, PTS, PAS) dan <strong>Mata Pelajaran</strong> pada dropdown di bagian kanan atas.</li>
                      <li>Atur <strong>Nilai KKM</strong> paket ujian lalu klik <strong>Simpan KKM</strong>.</li>
                      <li>Pilih cara input: klik <strong>Tambah Butir Soal</strong> untuk input satu per satu di editor, atau klik <strong>Unduh Template Soal (.docx)</strong> lalu <strong>Unggah File Soal</strong> untuk impor massal dari Word.</li>
                    </ol>
                  </div>

                  {/* A. Pilihan Ganda Biasa */}
                  <div className="p-3.5 bg-indigo-50/70 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-800/70 rounded-xl space-y-2">
                    <div className="font-bold text-indigo-900 dark:text-indigo-200 flex items-center gap-1.5 text-xs">
                      <CircleDot className="w-4 h-4 text-indigo-600" />
                      <span>A. Pilihan Ganda Biasa (1 Kunci Jawaban Benar)</span>
                    </div>
                    <ol className="list-decimal pl-4 space-y-1 text-slate-600 dark:text-slate-300">
                      <li>Klik <strong>Tambah Butir Soal</strong>, lalu pada kolom <strong>Jenis Soal</strong> pilih <strong>Pilihan Ganda Biasa</strong>.</li>
                      <li>Isi <strong>Skor / Bobot Soal</strong> (atau pakai tombol <em>Bagi Rata Skor (Total = 100)</em> setelah seluruh soal selesai dibuat).</li>
                      <li>Ketik pertanyaan pada kolom <strong>Teks Soal</strong>. Gunakan toolbar <em>Sisipkan Rumus Cepat</em> (<code className="font-mono">$..$</code> / <code className="font-mono">$$..$$</code>) untuk rumus eksakta dan tombol <em>Unggah Soal Bergambar</em> jika perlu ilustrasi.</li>
                      <li>Isi teks opsi jawaban <strong>A s/d E</strong> (dapat ditambah sampai <strong>H</strong> via tombol <strong>Tambah Opsi</strong>).</li>
                      <li>Klik <strong>1 tombol lingkaran (radio button)</strong> di sebelah kiri huruf opsi untuk menetapkan <strong>Kunci Jawaban Benar</strong>.</li>
                      <li>Tambahkan pembahasan (opsional), periksa tampilan di panel <em>Pratinjau Langsung</em>, lalu klik <strong>Simpan ke Bank Soal</strong>.</li>
                    </ol>
                    <div className="p-2 bg-white/80 dark:bg-slate-900/70 rounded-lg border border-indigo-200/70 dark:border-indigo-900/60 text-[11px] font-mono text-slate-700 dark:text-slate-300">
                      Format Word (.docx): <span className="font-semibold">SOAL 1</span> &rarr; <span className="font-semibold">TIPE: PG</span> &rarr; <span className="font-semibold">BOBOT: 20</span> &rarr; soal &rarr; opsi <span className="font-semibold">A. s/d E.</span> &rarr; <span className="font-semibold">KUNCI: B</span>
                    </div>
                  </div>

                  {/* B. Pilihan Ganda Kompleks (MCMA) */}
                  <div className="p-3.5 bg-purple-50/70 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-800/70 rounded-xl space-y-2">
                    <div className="font-bold text-purple-900 dark:text-purple-200 flex items-center gap-1.5 text-xs">
                      <ListChecks className="w-4 h-4 text-purple-600" />
                      <span>B. Pilihan Ganda Kompleks / MCMA (Lebih dari 1 Jawaban Benar)</span>
                    </div>
                    <ol className="list-decimal pl-4 space-y-1 text-slate-600 dark:text-slate-300">
                      <li>Klik <strong>Tambah Butir Soal</strong>, lalu pada kolom <strong>Jenis Soal</strong> pilih <strong>PG Kompleks (MCMA)</strong>.</li>
                      <li>Tentukan <strong>Skor / Bobot Soal</strong> (sistem otomatis menghitung skor penuh jika seluruh kunci dipilih benar dan skor parsial proporsional jika sebagian kunci dipilih).</li>
                      <li>Tulis naskah pertanyaan (disarankan mencantumkan keterangan seperti <em>&ldquo;Pilih lebih dari satu jawaban yang benar&rdquo;</em>), rumus, atau gambar soal.</li>
                      <li>Isi opsi pernyataan <strong>A s/d E</strong> (bisa klik <strong>Tambah Opsi</strong> hingga <strong>H</strong>).</li>
                      <li><strong>Centang kotak (checkbox)</strong> di sebelah kiri seluruh huruf opsi yang menjadi jawaban benar (bisa 2, 3, atau lebih; cek ringkasan <em>Kunci aktif</em> di bawah daftar opsi).</li>
                      <li>Klik <strong>Simpan ke Bank Soal</strong>.</li>
                    </ol>
                    <div className="p-2 bg-white/80 dark:bg-slate-900/70 rounded-lg border border-purple-200/70 dark:border-purple-900/60 text-[11px] font-mono text-slate-700 dark:text-slate-300">
                      Format Word (.docx): <span className="font-semibold">SOAL 2</span> &rarr; <span className="font-semibold">TIPE: MCMA</span> &rarr; <span className="font-semibold">BOBOT: 30</span> &rarr; soal &rarr; opsi <span className="font-semibold">A. s/d E.</span> &rarr; <span className="font-semibold">KUNCI: A, C</span> (pisah koma)
                    </div>
                  </div>

                  {/* C. Soal Uraian + Opsi Pilihan */}
                  <div className="p-3.5 bg-teal-50/70 dark:bg-teal-950/30 border border-teal-200 dark:border-teal-800/70 rounded-xl space-y-2">
                    <div className="font-bold text-teal-900 dark:text-teal-200 flex items-center gap-1.5 text-xs">
                      <AlignLeft className="w-4 h-4 text-teal-600" />
                      <span>C. Soal Uraian (Berikut Opsi Mode &amp; Metode Penilaian)</span>
                    </div>
                    <ol className="list-decimal pl-4 space-y-1 text-slate-600 dark:text-slate-300">
                      <li>Klik <strong>Tambah Butir Soal</strong>, lalu pada kolom <strong>Jenis Soal</strong> pilih <strong>Soal Uraian</strong>.</li>
                      <li>Pilih <strong>Mode Input Jawaban Siswa</strong>: <strong>Uraian Singkat (1 Baris)</strong> untuk isian pendek atau <strong>Uraian Panjang (Paragraf)</strong> untuk penjelasan bebas.</li>
                      <li>
                        Pilih <strong>Opsi Metode Penilaian</strong>:
                        <ul className="list-disc pl-4 mt-1 space-y-0.5">
                          <li><strong>Otomatis: Mengandung Kata Kunci</strong> &mdash; benar jika jawaban siswa memuat salah satu variasi kata kunci (tidak peka huruf besar/kecil).</li>
                          <li><strong>Otomatis: Persis Salah Satu Opsi</strong> &mdash; benar jika jawaban siswa sama persis dengan salah satu opsi kunci.</li>
                          <li><strong>Uraian Bebas (Koreksi Manual Guru)</strong> &mdash; jawaban siswa disimpan untuk diperiksa manual oleh guru.</li>
                        </ul>
                      </li>
                      <li>Ketik pertanyaan di kolom <strong>Teks Soal</strong>, lalu isi <strong>Opsi Kunci Jawaban / Alternatif Kata Kunci Diterima</strong> (klik <strong>Tambah Opsi Jawaban</strong> untuk menambah variasi ejaan/istilah yang diterima, atau tulis catatan rubrik jika mode manual).</li>
                      <li>Klik <strong>Simpan ke Bank Soal</strong>.</li>
                    </ol>
                    <div className="p-2 bg-white/80 dark:bg-slate-900/70 rounded-lg border border-teal-200/70 dark:border-teal-900/60 text-[11px] font-mono text-slate-700 dark:text-slate-300">
                      Format Word (.docx): <span className="font-semibold">SOAL 3</span> &rarr; <span className="font-semibold">TIPE: URAIAN</span> &rarr; <span className="font-semibold">MODE URAIAN: SINGKAT/PANJANG</span> &rarr; <span className="font-semibold">PENILAIAN: KATA_KUNCI/PERSIS/MANUAL</span> &rarr; opsi variasi <span className="font-semibold">A., B., C.</span> atau <span className="font-semibold">KUNCI: jwb1 | jwb2</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Section 3: Guru */}
              {(guideTab === 'all' || guideTab === 'guru') && (
                <div className="p-4 bg-indigo-50/60 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800/80 rounded-2xl space-y-2">
                  <h3 className="text-sm font-bold text-indigo-900 dark:text-indigo-200 flex items-center gap-2">
                    <UserCheck className="w-4 h-4 text-indigo-600" />
                    <span>3. Panduan untuk Guru Pengampu</span>
                  </h3>
                  <ol className="list-decimal pl-4 space-y-1.5 text-slate-600 dark:text-slate-300">
                    <li>Pilih tab <strong>Guru</strong> pada form login, lalu masukkan username dan password guru.</li>
                    <li><strong>Unggah &amp; Kelola Bank Soal</strong>: Buat naskah soal per aktivitas &amp; mapel (PG Biasa, MCMA, maupun Uraian), tambahkan soal bergambar (<em>Unggah Soal Bergambar</em>), formula sains/matematika, atau unggah dokumen Word (.docx) massal.</li>
                    <li><strong>Pengelolaan Jadwal Ujian</strong>: Tentukan hari, tanggal, waktu, durasi, kelas sasaran, <strong>Tema / Materi yang Diujikan</strong>, dan token ujian.</li>
                    <li><strong>Ruang Pengawas &amp; Pantau Siswa</strong>: Pantau aktivitas peserta ujian secara <em>live</em>, kontrol token, dan tinjau laporan pelanggaran anti-fraud secara <em>real-time</em>.</li>
                  </ol>
                </div>
              )}

              {/* Section 4: Admin */}
              {(guideTab === 'all' || guideTab === 'admin') && (
                <div className="p-4 bg-slate-100 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-2xl space-y-2">
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <Shield className="w-4 h-4 text-slate-700 dark:text-slate-300" />
                    <span>4. Panduan untuk Administrator</span>
                  </h3>
                  <ol className="list-decimal pl-4 space-y-1.5 text-slate-600 dark:text-slate-300">
                    <li>Pilih tab <strong>Admin</strong> pada form login, lalu masukkan kredensial admin.</li>
                    <li>Kelola Master Data Siswa, Guru, Kelas, Mata Pelajaran, dan Aktivitas Ujian secara terpusat.</li>
                    <li>Kelola seluruh Bank Soal, jadwal ujian, pengaturan identitas sekolah, dan sinkronisasi database Supabase.</li>
                    <li>Tinjau laporan analitik nilai seluruh siswa dan rekapitulasi ujian secara komprehensif.</li>
                  </ol>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 flex justify-end">
              <button
                type="button"
                onClick={() => setShowGuideModal(false)}
                className="px-5 py-2 bg-sky-600 hover:bg-sky-700 text-white text-xs font-semibold rounded-xl shadow-xs transition-colors"
              >
                Tutup Panduan
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
