/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  User,
  GraduationCap,
  Clock,
  BookOpen,
  Calendar,
  KeyRound,
  Download,
  CheckCircle2,
  AlertCircle,
  ShieldCheck
} from 'lucide-react';
import { Student, Exam, ExamSchedule, Question } from '../../types/cbt';
import { CBTStorageService } from '../../services/cbt-storage';

interface SiswaDashboardProps {
  student: Student;
  exams: Exam[];
  onStartExam: (exam: Exam, student: Student, remainingSeconds?: number) => void;
  onLogout?: () => void;
  activeToken: string;
}

export const SiswaDashboard: React.FC<SiswaDashboardProps> = ({
  student,
  exams: _exams,
  onStartExam,
  onLogout: _onLogout,
  activeToken,
}) => {
  const [nowMs, setNowMs] = useState<number>(() => Date.now());
  const [schedulesVersion, setSchedulesVersion] = useState<number>(0);
  const [liveStudent, setLiveStudent] = useState<Student>(() => {
    return CBTStorageService.findStudentByNis(student.nis) || student;
  });

  useEffect(() => {
    setLiveStudent(CBTStorageService.findStudentByNis(student.nis) || student);
  }, [student]);

  useEffect(() => {
    const interval = setInterval(() => setNowMs(Date.now()), 1000);
    const refreshData = () => {
      setLiveStudent(CBTStorageService.findStudentByNis(student.nis) || student);
      setSchedulesVersion(v => v + 1);
    };
    window.addEventListener('cbt-schedules-change', refreshData);
    window.addEventListener('cbt-students-change', refreshData);
    window.addEventListener('cbt-classes-change', refreshData);
    window.addEventListener('storage', refreshData);
    return () => {
      clearInterval(interval);
      window.removeEventListener('cbt-schedules-change', refreshData);
      window.removeEventListener('cbt-students-change', refreshData);
      window.removeEventListener('cbt-classes-change', refreshData);
      window.removeEventListener('storage', refreshData);
    };
  }, [student]);

  const classSchedules = useMemo(() => {
    const targetNorm = CBTStorageService.normalizeClassName(liveStudent.className);
    if (!targetNorm) return [];
    return CBTStorageService.getSchedules().filter((sch) => {
      if (!sch.targetClasses || sch.targetClasses.length === 0) return false;
      return sch.targetClasses.some(
        (cls) => CBTStorageService.normalizeClassName(cls) === targetNorm
      );
    });
  }, [liveStudent.className, schedulesVersion]);

  const scheduleExamMap = useMemo(() => {
    const map: Record<string, { exam?: Exam; questions: Question[] }> = {};
    classSchedules.forEach(sch => {
      const exam = CBTStorageService.resolveExamForSchedule(sch);
      const questions = exam ? CBTStorageService.getQuestions(exam.id) : [];
      map[sch.id] = { exam, questions };
    });
    return map;
  }, [classSchedules]);

  // Sort strictly by live timing status: active -> upcoming -> ended, then exact class match first
  const studentSchedules = useMemo(() => {
    const targetNorm = CBTStorageService.normalizeClassName(liveStudent.className);
    const isExactClass = (sch: ExamSchedule) =>
      sch.targetClasses.some(
        (cls) => CBTStorageService.normalizeClassName(cls) === targetNorm
      );

    return [...classSchedules].sort((a, b) => {
      const ta = CBTStorageService.getScheduleTimingStatus(a, nowMs);
      const tb = CBTStorageService.getScheduleTimingStatus(b, nowMs);
      const rank = { active: 0, upcoming: 1, ended: 2 };
      if (rank[ta.status] !== rank[tb.status]) {
        return rank[ta.status] - rank[tb.status];
      }
      const aExact = isExactClass(a) ? 0 : 1;
      const bExact = isExactClass(b) ? 0 : 1;
      if (aExact !== bExact) {
        return aExact - bExact;
      }
      return ta.startMs - tb.startMs;
    });
  }, [classSchedules, liveStudent.className, nowMs]);

  const [selectedScheduleId, setSelectedScheduleId] = useState<string>(
    () => studentSchedules[0]?.id || ''
  );
  const [enteredToken, setEnteredToken] = useState<string>(
    () => studentSchedules[0]?.token || ''
  );
  const [isDownloading, setIsDownloading] = useState<boolean>(false);
  const [downloadProgress, setDownloadProgress] = useState<number>(0);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const downloadTimersRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  useEffect(() => {
    return () => {
      downloadTimersRef.current.forEach(clearTimeout);
      downloadTimersRef.current = [];
    };
  }, []);

  const activeSchedule =
    studentSchedules.find(s => s.id === selectedScheduleId) || studentSchedules[0];
  const activeTiming = activeSchedule
    ? CBTStorageService.getScheduleTimingStatus(activeSchedule, nowMs)
    : null;
  const matchedExam = activeSchedule ? scheduleExamMap[activeSchedule.id]?.exam : undefined;
  const matchedQuestions = activeSchedule
    ? scheduleExamMap[activeSchedule.id]?.questions || []
    : [];

  useEffect(() => {
    setSelectedScheduleId(studentSchedules[0]?.id || '');
    setEnteredToken(studentSchedules[0]?.token || '');
    setErrorMessage('');
  }, [liveStudent.id, liveStudent.className]);

  useEffect(() => {
    if (studentSchedules.length === 0) {
      setSelectedScheduleId('');
      setEnteredToken('');
      return;
    }
    const stillExists = studentSchedules.some(s => s.id === selectedScheduleId);
    if (!stillExists) {
      setSelectedScheduleId(studentSchedules[0].id);
      setEnteredToken(studentSchedules[0].token || activeToken);
    }
  }, [studentSchedules, selectedScheduleId, activeToken]);

  const handleStartExamSession = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!activeSchedule || !activeTiming) {
      setErrorMessage(`Belum ada jadwal ujian yang tersedia untuk kelas ${liveStudent.className}.`);
      return;
    }

    if (activeTiming.status === 'upcoming') {
      setErrorMessage(
        `Jadwal ujian belum dimulai. "${activeSchedule.subjectName}" dijadwalkan pada ${activeSchedule.dayName}, ${activeSchedule.examDate} pukul ${activeSchedule.startTime} - ${activeSchedule.endTime} WIB.`
      );
      return;
    }

    if (activeTiming.status === 'ended') {
      setErrorMessage(
        `Waktu pengerjaan ujian "${activeSchedule.subjectName}" telah berakhir pada ${activeSchedule.examDate} pukul ${activeSchedule.endTime} WIB.`
      );
      return;
    }

    if (!matchedExam || matchedQuestions.length === 0) {
      setErrorMessage(
        `Bank soal untuk "${activeSchedule.subjectName} (${activeSchedule.activityName})" belum tersedia. Hubungi guru pengampu.`
      );
      return;
    }

    const expectedToken = (activeSchedule.token || matchedExam.token || activeToken)
      .trim()
      .toUpperCase();
    if (enteredToken.trim().toUpperCase() !== expectedToken) {
      setErrorMessage(
        `Token ujian tidak valid. Pastikan meminta token pengawas (Token aktif: ${expectedToken}).`
      );
      return;
    }

    const effectiveSeconds = Math.min(
      Math.max(1, Number(activeSchedule.durationMinutes) || matchedExam.durationMinutes) * 60,
      activeTiming.remainingSeconds
    );

    // Clear any stale draft answers/infractions so reloaded question packets always start clean
    CBTStorageService.clearStudentExamDraft(matchedExam.id, liveStudent.id);

    // Single-packet local bundle download
    downloadTimersRef.current.forEach(clearTimeout);
    setIsDownloading(true);
    setDownloadProgress(25);

    const t1 = setTimeout(() => setDownloadProgress(70), 250);
    const t2 = setTimeout(() => {
      setDownloadProgress(100);

      // Automatically enter fullscreen right after question bank download completes
      const docEl = document.documentElement as HTMLElement & {
        webkitRequestFullscreen?: () => Promise<void> | void;
        msRequestFullscreen?: () => Promise<void> | void;
      };
      if (!document.fullscreenElement) {
        if (docEl.requestFullscreen) {
          docEl.requestFullscreen().catch(() => {
            // Fallback handled gracefully inside ExamTestingRoom
          });
        } else if (docEl.webkitRequestFullscreen) {
          try {
            docEl.webkitRequestFullscreen();
          } catch {
            // Ignore vendor fullscreen error
          }
        } else if (docEl.msRequestFullscreen) {
          try {
            docEl.msRequestFullscreen();
          } catch {
            // Ignore vendor fullscreen error
          }
        }
      }

      onStartExam(matchedExam, liveStudent, effectiveSeconds);
      setIsDownloading(false);
    }, 550);

    downloadTimersRef.current = [t1, t2];
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Student Biodata Verification Card */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs">
        <div className="flex flex-wrap items-center justify-between gap-4 pb-4 mb-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold text-lg shadow-xs">
              <GraduationCap className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                  {student.name}
                </h1>
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300">
                  Data Terverifikasi
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Biodata siswa otomatis dimuat berdasarkan NIS Anda.
              </p>
            </div>
          </div>
        </div>

        {/* Biodata Grid: NIS, Gender, Kelas, Ruang */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700 text-xs">
          <div>
            <span className="text-slate-500 block mb-0.5">Nomor Induk Siswa (NIS):</span>
            <strong className="font-mono text-indigo-600 dark:text-indigo-400 text-sm">
              {liveStudent.nis}
            </strong>
          </div>

          <div>
            <span className="text-slate-500 block mb-0.5">Jenis Kelamin:</span>
            <strong className="text-slate-900 dark:text-white text-sm">
              {liveStudent.gender}
            </strong>
          </div>

          <div>
            <span className="text-slate-500 block mb-0.5">Kelas:</span>
            <strong className="text-slate-900 dark:text-white text-sm">
              {liveStudent.className}
            </strong>
          </div>

          <div>
            <span className="text-slate-500 block mb-0.5">Ruang Asesmen:</span>
            <strong className="text-slate-900 dark:text-white text-sm">
              {liveStudent.room}
            </strong>
          </div>
        </div>
      </div>

      {/* Exam Schedule & Entry Section */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 sm:p-8 shadow-xs">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
          <div>
            <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
              Jadwal Ujian Kelas {liveStudent.className}
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Pilih mata pelajaran sesuai jadwal berlangsung, lalu konfirmasi token dari pengawas ruang.
            </p>
          </div>
          <div className="text-xs font-mono bg-slate-100 dark:bg-slate-800 px-3 py-1.5 rounded-lg text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
            <span>
              {new Date(nowMs).toLocaleDateString('id-ID', {
                weekday: 'long',
                day: '2-digit',
                month: 'short',
                year: 'numeric',
              })}{' '}
              ·{' '}
              {new Date(nowMs).toLocaleTimeString('id-ID', {
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
              })}
            </span>
          </div>
        </div>

        {errorMessage && (
          <div className="mb-4 p-3 bg-red-50 dark:bg-red-950/60 border border-red-200 dark:border-red-800 rounded-xl text-xs text-red-700 dark:text-red-300 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Schedule Cards (Filtered for Student's Class) */}
        {studentSchedules.length === 0 ? (
          <div className="mb-6 p-8 text-center bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl">
            <Calendar className="w-10 h-10 text-slate-400 mx-auto mb-2" />
            <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">
              Belum ada jadwal ujian untuk kelas {liveStudent.className}
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Silakan hubungi guru pengampu atau pengawas ruang untuk memeriksa jadwal ujian Anda.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            {studentSchedules.map((sch) => {
              const isSelected = sch.id === activeSchedule?.id;
              const timing = CBTStorageService.getScheduleTimingStatus(sch, nowMs);
              const resolvedExam = scheduleExamMap[sch.id]?.exam;
              const qCount = scheduleExamMap[sch.id]?.questions.length ?? 0;
              const existingSub = resolvedExam
                ? CBTStorageService.getSubmissionByStudent(resolvedExam.id, liveStudent.id)
                : undefined;

              return (
                <div
                  key={sch.id}
                  onClick={() => {
                    setSelectedScheduleId(sch.id);
                    setEnteredToken(sch.token);
                    setErrorMessage('');
                  }}
                  className={`p-4 rounded-xl border cursor-pointer transition-all ${
                    isSelected
                      ? 'border-indigo-600 bg-indigo-50/50 dark:bg-indigo-950/40 shadow-xs'
                      : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 truncate">
                      {sch.activityName}
                    </span>
                    <div className="flex items-center gap-1.5 shrink-0">
                      {existingSub && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-teal-100 text-teal-800 dark:bg-teal-950/80 dark:text-teal-300">
                          Selesai · Nilai {existingSub.percentage}
                        </span>
                      )}
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 ${
                          timing.status === 'active'
                            ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/80 dark:text-emerald-300'
                            : timing.status === 'upcoming'
                            ? 'bg-sky-100 text-sky-700 dark:bg-sky-950/80 dark:text-sky-300'
                            : 'bg-slate-200 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                        }`}
                      >
                        {timing.status === 'active' && (
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        )}
                        {timing.status === 'active'
                          ? 'Sedang Berlangsung'
                          : timing.status === 'upcoming'
                          ? 'Belum Dimulai'
                          : 'Waktu Berakhir'}
                      </span>
                    </div>
                  </div>

                  <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-1">
                    {sch.subjectName}
                  </h3>
                  {sch.materialTheme && (
                    <p className="text-xs text-slate-500 dark:text-slate-400 italic mb-2">
                      Tema: {sch.materialTheme}
                    </p>
                  )}

                  <div className="space-y-1 text-xs text-slate-600 dark:text-slate-300">
                    <div className="flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      <span>{sch.dayName}, {sch.examDate}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      <span>{sch.startTime} - {sch.endTime} WIB ({sch.durationMinutes} Menit)</span>
                    </div>
                    <div className="flex items-center justify-between pt-1 text-[11px] text-slate-500">
                      <span className="flex items-center gap-1">
                        <BookOpen className="w-3.5 h-3.5 text-slate-400" />
                        <span>{qCount} Butir Soal</span>
                      </span>
                      <span className="font-mono">
                        Token: <strong className="font-bold text-slate-900 dark:text-white">{sch.token}</strong>
                      </span>
                    </div>
                    <div className="pt-1 text-[10px] text-slate-400 truncate">
                      Kelas Sasaran: <strong className="text-slate-600 dark:text-slate-300">{sch.targetClasses.join(', ')}</strong>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Form Token Input & Start (only when schedule exists for student's class) */}
        {studentSchedules.length > 0 && (
          <form onSubmit={handleStartExamSession} className="space-y-4 max-w-md">
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Konfirmasi Token Ujian (6 Karakter):
                </label>
                <span className="text-[11px] text-indigo-600 dark:text-indigo-400">
                  Token aktif: <strong className="font-mono">{activeSchedule?.token || activeToken}</strong>
                </span>
              </div>
              <div className="relative">
                <input
                  type="text"
                  value={enteredToken}
                  onChange={(e) => setEnteredToken(e.target.value.toUpperCase())}
                  placeholder="Masukkan Token dari Pengawas"
                  maxLength={8}
                  className="w-full text-sm font-mono tracking-widest uppercase font-bold px-3 py-2.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                  required
                />
                <KeyRound className="w-4 h-4 text-slate-400 absolute right-3 top-3 pointer-events-none" />
              </div>
            </div>

            {/* Download Progress Bar */}
            {isDownloading && (
              <div className="p-3.5 bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 rounded-xl">
                <div className="flex items-center justify-between text-xs text-indigo-900 dark:text-indigo-200 mb-1.5">
                  <span className="flex items-center gap-1.5">
                    <Download className="w-3.5 h-3.5 animate-bounce" />
                    Mengunduh Bank Soal ke Memori Lokal (IndexedDB)...
                  </span>
                  <span className="font-mono font-bold">{downloadProgress}%</span>
                </div>
                <div className="w-full bg-indigo-200 dark:bg-indigo-900 h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-indigo-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${downloadProgress}%` }}
                  />
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={isDownloading}
              className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white text-xs sm:text-sm font-semibold rounded-xl shadow-xs transition-colors flex items-center justify-center gap-2"
            >
              <Download className="w-4 h-4" />
              <span>{isDownloading ? 'Memuat Lembar Ujian...' : 'Unduh Bank Soal & Mulai Ujian'}</span>
            </button>
          </form>
        )}

        <div className="mt-8 pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center gap-2 text-xs text-slate-500">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          <span>
            Sistem terlindungi dengan mode layar penuh, deteksi pergantian tab, formula matematika &amp; sains, dan arsitektur Local-First.
          </span>
        </div>
      </div>
    </div>
  );
};
