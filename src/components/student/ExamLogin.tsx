/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Download, ShieldCheck, Clock, BookOpen, User, CheckCircle2, AlertCircle } from 'lucide-react';
import { Exam, Student } from '../../types/cbt';
import { CBTStorageService, DEFAULT_SCHOOL_LOGO_URL } from '../../services/cbt-storage';
import examIllustrationUrl from '../../assets/images/cbt_exam_illustration_1794586936665.jpg';

interface ExamLoginProps {
  exams: Exam[];
  onStartExam: (exam: Exam, student: Student) => void;
  activeToken: string;
}

export const ExamLogin: React.FC<ExamLoginProps> = ({ exams, onStartExam, activeToken }) => {
  const students = CBTStorageService.getStudents();

  const [selectedExamId, setSelectedExamId] = useState<string>(exams[0]?.id || '');
  const [nisn, setNisn] = useState<string>(students[0]?.nisn || '0067829101');
  const [studentName, setStudentName] = useState<string>(students[0]?.name || 'Ahmad Faiz Al-Faruqi');
  const [enteredToken, setEnteredToken] = useState<string>(activeToken);
  const [isDownloading, setIsDownloading] = useState<boolean>(false);
  const [downloadProgress, setDownloadProgress] = useState<number>(0);
  const [errorMessage, setErrorMessage] = useState<string>('');

  const selectedExam = exams.find(e => e.id === selectedExamId) || exams[0];

  const handleSelectQuickStudent = (std: Student) => {
    setNisn(std.nisn);
    setStudentName(std.name);
    setErrorMessage('');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!selectedExam) {
      setErrorMessage('Pilih paket ujian terlebih dahulu.');
      return;
    }

    if (!nisn.trim()) {
      setErrorMessage('NISN atau Nomor Peserta wajib diisi.');
      return;
    }

    if (!studentName.trim()) {
      setErrorMessage('Nama peserta wajib diisi.');
      return;
    }

    if (enteredToken.trim().toUpperCase() !== selectedExam.token.trim().toUpperCase()) {
      setErrorMessage(`Token ujian tidak valid. Pastikan meminta token aktif kepada pengawas ruang (Token saat ini: ${selectedExam.token}).`);
      return;
    }

    // Begin Local-First Download Step (Bundled single download at start)
    setIsDownloading(true);
    setDownloadProgress(20);

    const timer1 = setTimeout(() => {
      setDownloadProgress(65);
    }, 350);

    const timer2 = setTimeout(() => {
      setDownloadProgress(100);
      const student: Student = {
        id: `std-${nisn}`,
        nis: nisn.trim().slice(-8) || '20241001',
        nisn: nisn.trim(),
        name: studentName.trim(),
        className: 'XII MIPA 1',
        room: 'Lab Komputer 1',
        gender: 'Laki-laki',
      };

      CBTStorageService.setCurrentStudent(student);
      CBTStorageService.cacheRemoteStudent(student);
      onStartExam(selectedExam, student);
      setIsDownloading(false);
    }, 750);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
    };
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex flex-col justify-center py-10 px-4 sm:px-6 lg:px-8 bg-slate-50 dark:bg-slate-950">
      <div className="max-w-4xl mx-auto w-full grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
        {/* Left Column: Visual & School Identity */}
        <div className="lg:col-span-5 flex flex-col justify-between p-6 sm:p-8 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xs">
          <div>
            <div className="flex items-center gap-3 mb-6">
              <img
                src={DEFAULT_SCHOOL_LOGO_URL}
                alt="Lambang Lembaga Pendidikan"
                className="w-14 h-14 object-contain rounded-full shadow-xs"
                referrerPolicy="no-referrer"
              />
              <div>
                <h2 className="text-sm font-bold text-slate-900 dark:text-white leading-tight">
                  MADRASAH & SEKOLAH INDONESIA
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Sistem Asesmen Berbasis Komputer
                </p>
              </div>
            </div>

            <div className="relative mb-6 rounded-lg overflow-hidden border border-slate-200 dark:border-slate-800">
              <img
                src={examIllustrationUrl}
                alt="Suasana Ruang Ujian Komputer"
                className="w-full h-44 object-cover"
                referrerPolicy="no-referrer"
              />
            </div>

            <div className="space-y-3">
              <div className="flex items-start gap-2.5 text-xs text-slate-600 dark:text-slate-300">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                <span>
                  <strong>Arsitektur Local-First:</strong> Soal diunduh sekali di awal. Jawaban tersimpan di memori perangkat sehingga tetap aman meski koneksi internet terputus.
                </span>
              </div>
              <div className="flex items-start gap-2.5 text-xs text-slate-600 dark:text-slate-300">
                <ShieldCheck className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0 mt-0.5" />
                <span>
                  <strong>Proteksi Anti-Kecurangan:</strong> Deteksi perpindahan tab, mode layar penuh (fullscreen), dan pencegahan copy-paste otomatis.
                </span>
              </div>
              <div className="flex items-start gap-2.5 text-xs text-slate-600 dark:text-slate-300">
                <BookOpen className="w-4 h-4 text-sky-600 dark:text-sky-400 shrink-0 mt-0.5" />
                <span>
                  <strong>Formula Matematika &amp; Sains:</strong> Mendukung formula matematika, fisika, matriks, dan persamaan reaksi kimia.
                </span>
              </div>
            </div>
          </div>

          <div className="mt-8 pt-4 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-500 dark:text-slate-400 flex items-center justify-between">
            <span>Standar ANBK / UM 2026</span>
            <span className="font-mono">Versi 2.4-LocalFirst</span>
          </div>
        </div>

        {/* Right Column: Student Login Form */}
        <div className="lg:col-span-7 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 sm:p-8 shadow-xs flex flex-col justify-between">
          <div>
            <div className="mb-6">
              <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100">
                Masuk Ruang Ujian CBT
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Silakan masukkan NISN/Nomor Ujian dan Token yang telah dibagikan oleh pengawas ruang.
              </p>
            </div>

            {errorMessage && (
              <div className="mb-4 p-3 bg-red-50 dark:bg-red-950/60 border border-red-200 dark:border-red-800 rounded-lg text-xs text-red-700 dark:text-red-300 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-red-600 dark:text-red-400 shrink-0 mt-0.5" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Quick student selection for demo / tester convenience */}
            <div className="mb-5 p-3 bg-slate-50 dark:bg-slate-800/60 rounded-lg border border-slate-200 dark:border-slate-700">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Pilih Cepat Siswa Demo (Pengujian):
                </span>
                <span className="text-[11px] text-slate-500">Klik untuk auto-fill</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {students.slice(0, 4).map(std => (
                  <button
                    key={std.id}
                    type="button"
                    onClick={() => handleSelectQuickStudent(std)}
                    className={`text-xs px-2.5 py-1 rounded border transition-colors ${
                      nisn === std.nisn
                        ? 'bg-indigo-600 border-indigo-600 text-white font-medium'
                        : 'bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-indigo-400'
                    }`}
                  >
                    {std.name.split(' ')[0]} ({std.className})
                  </button>
                ))}
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Mata Pelajaran & Paket Ujian
                </label>
                <select
                  value={selectedExamId}
                  onChange={(e) => {
                    setSelectedExamId(e.target.value);
                    const ex = exams.find(x => x.id === e.target.value);
                    if (ex) setEnteredToken(ex.token);
                  }}
                  className="w-full text-xs sm:text-sm px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                >
                  {exams.map(ex => (
                    <option key={ex.id} value={ex.id}>
                      {ex.title} ({ex.gradeLevel}) - {ex.durationMinutes} Menit
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    NISN / Nomor Ujian
                  </label>
                  <input
                    type="text"
                    value={nisn}
                    onChange={(e) => setNisn(e.target.value)}
                    placeholder="Contoh: 0067829101"
                    className="w-full text-xs sm:text-sm px-3 py-2 font-mono bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Nama Lengkap Siswa
                  </label>
                  <input
                    type="text"
                    value={studentName}
                    onChange={(e) => setStudentName(e.target.value)}
                    placeholder="Nama sesuai kartu peserta"
                    className="w-full text-xs sm:text-sm px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                    required
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Token Ujian (6 Karakter)
                  </label>
                  <span className="text-[11px] text-indigo-600 dark:text-indigo-400">
                    Token aktif ruang: <strong className="font-mono">{selectedExam?.token || activeToken}</strong>
                  </span>
                </div>
                <input
                  type="text"
                  value={enteredToken}
                  onChange={(e) => setEnteredToken(e.target.value.toUpperCase())}
                  placeholder="Ketik token pengawas"
                  maxLength={10}
                  className="w-full text-sm px-3 py-2.5 font-mono tracking-widest uppercase bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 font-bold focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                  required
                />
              </div>

              {/* Download progress visual */}
              {isDownloading && (
                <div className="p-3 bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 rounded-lg">
                  <div className="flex items-center justify-between text-xs text-indigo-900 dark:text-indigo-200 mb-1.5">
                    <span className="flex items-center gap-1.5">
                      <Download className="w-3.5 h-3.5 animate-bounce" />
                      Mengunduh paket soal ke cache perangkat (Local-First)...
                    </span>
                    <span className="font-mono font-bold">{downloadProgress}%</span>
                  </div>
                  <div className="w-full bg-indigo-200 dark:bg-indigo-900 h-2 rounded-full overflow-hidden">
                    <div
                      className="bg-indigo-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${downloadProgress}%` }}
                    />
                  </div>
                  <p className="text-[11px] text-indigo-700 dark:text-indigo-300 mt-1">
                    Hanya diunduh sekali. Setelah ini ujian dapat berlanjut tanpa bergantung pada koneksi internet.
                  </p>
                </div>
              )}

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isDownloading}
                  className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white text-xs sm:text-sm font-semibold rounded-lg shadow-xs transition-colors flex items-center justify-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  <span>{isDownloading ? 'Menyiapkan Lembar Ujian...' : 'Unduh Soal & Masuk Ruang Ujian'}</span>
                </button>
              </div>
            </form>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" />
              Durasi: {selectedExam?.durationMinutes} Menit
            </span>
            <span>KKM Kelulusan: {selectedExam?.kkm}</span>
            <span>Total: {selectedExam?.totalQuestions} Soal</span>
          </div>
        </div>
      </div>
    </div>
  );
};
