/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useMemo, useState } from 'react';
import {
  Calendar,
  Clock,
  BookOpen,
  Plus,
  Trash2,
  Edit3,
  CheckCircle2,
  Save,
  KeyRound,
  Users,
  Eye,
  FileCheck2,
  Sparkles,
  RefreshCw,
  AlertTriangle,
  Search
} from 'lucide-react';
import {
  ExamSchedule,
  Subject,
  ExamActivity,
  StudentClass,
  Student,
  Exam,
} from '../../types/cbt';
import { CBTStorageService } from '../../services/cbt-storage';
import { QuestionBankManager } from '../admin/QuestionBankManager';
import { ProctorMonitor } from '../proctor/ProctorMonitor';
import {
  SortableTh,
  SortState,
  createInitialSortState,
  toggleSortState,
  sortRows,
} from '../common/SortableTableHeader';

interface GuruDashboardProps {
  exams: Exam[];
  onRefreshExams: () => void;
  activeToken: string;
  onRefreshToken: () => void;
  teacherName?: string;
}

export const GuruDashboard: React.FC<GuruDashboardProps> = ({
  exams,
  onRefreshExams,
  activeToken,
  onRefreshToken,
  teacherName = 'Dra. Hj. Siti Rahmawati, M.Pd.',
}) => {
  const [activeTab, setActiveTab] = useState<'schedules' | 'questions' | 'proctor'>('schedules');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Loaded master data (kept reactive to latest activity, subject, student & class updates)
  const [subjects, setSubjects] = useState<Subject[]>(() => CBTStorageService.getSubjects());
  const [activities, setActivities] = useState<ExamActivity[]>(() => CBTStorageService.getActivities());
  const [masterClasses, setMasterClasses] = useState<StudentClass[]>(() => CBTStorageService.getClasses());
  const [students, setStudents] = useState<Student[]>(() => CBTStorageService.getStudents());
  const [participantSearch, setParticipantSearch] = useState<string>('');
  const [participantClassFilter, setParticipantClassFilter] = useState<string>('target');
  const [participantRoomFilter, setParticipantRoomFilter] = useState<string>('all');

  const refreshMasterStudentsAndClasses = () => {
    setMasterClasses(CBTStorageService.getClasses());
    setStudents(CBTStorageService.getStudents());
  };

  const refreshMasterActivitiesAndSubjects = () => {
    const nextActivities = CBTStorageService.getActivities();
    const nextSubjects = CBTStorageService.getSubjects();
    setActivities(nextActivities);
    setSubjects(nextSubjects);
    setSelectedActivityId(prev =>
      nextActivities.some(a => a.id === prev) ? prev : (nextActivities[0]?.id || '')
    );
    setSelectedSubjectId(prev =>
      nextSubjects.some(s => s.id === prev) ? prev : (nextSubjects[0]?.id || '')
    );
  };

  useEffect(() => {
    refreshMasterStudentsAndClasses();
    refreshMasterActivitiesAndSubjects();
    const refreshSchedules = () => setSchedules(CBTStorageService.getSchedules());
    window.addEventListener('cbt-students-change', refreshMasterStudentsAndClasses);
    window.addEventListener('cbt-classes-change', refreshMasterStudentsAndClasses);
    window.addEventListener('cbt-activities-change', refreshMasterActivitiesAndSubjects);
    window.addEventListener('cbt-subjects-change', refreshMasterActivitiesAndSubjects);
    window.addEventListener('cbt-schedules-change', refreshSchedules);
    window.addEventListener('storage', refreshMasterStudentsAndClasses);
    window.addEventListener('storage', refreshMasterActivitiesAndSubjects);
    window.addEventListener('storage', refreshSchedules);
    return () => {
      window.removeEventListener('cbt-students-change', refreshMasterStudentsAndClasses);
      window.removeEventListener('cbt-classes-change', refreshMasterStudentsAndClasses);
      window.removeEventListener('cbt-activities-change', refreshMasterActivitiesAndSubjects);
      window.removeEventListener('cbt-subjects-change', refreshMasterActivitiesAndSubjects);
      window.removeEventListener('cbt-schedules-change', refreshSchedules);
      window.removeEventListener('storage', refreshMasterStudentsAndClasses);
      window.removeEventListener('storage', refreshMasterActivitiesAndSubjects);
      window.removeEventListener('storage', refreshSchedules);
    };
  }, [activeTab]);

  // Combine Master Classes with any unique className present in latest Students list
  const classes = useMemo(() => {
    const existingNames = new Set(masterClasses.map(c => CBTStorageService.normalizeClassName(c.name)));
    const merged: StudentClass[] = [...masterClasses];
    students.forEach((s, idx) => {
      const clsName = (s.className || '').trim();
      const clsNorm = CBTStorageService.normalizeClassName(clsName);
      if (clsName && clsNorm && !existingNames.has(clsNorm)) {
        existingNames.add(clsNorm);
        merged.push({
          id: `cls-std-${idx}-${clsName}`,
          name: clsName,
          gradeLevel: clsName.split(' ')[0] || 'Umum',
          academicYear: '2025/2026',
        });
      }
    });
    return merged;
  }, [masterClasses, students]);

  // Schedule states
  const [schedules, setSchedules] = useState<ExamSchedule[]>(() => CBTStorageService.getSchedules());
  const [scheduleSort, setScheduleSort] = useState<SortState>(() => createInitialSortState());
  const [participantSort, setParticipantSort] = useState<SortState>(() => createInitialSortState());
  const [editingSchedule, setEditingSchedule] = useState<ExamSchedule | null>(null);
  const [deleteScheduleTarget, setDeleteScheduleTarget] = useState<{
    id: string;
    subjectName: string;
    activityName: string;
  } | null>(null);

  const getTodayDateStr = () => {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    const d = String(now.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  };

  const getIndonesianDayName = (dateStr: string) => {
    const [y, m, d] = dateStr.split('-').map(Number);
    if (!y || !m || !d) return 'Senin';
    const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
    return days[new Date(y, m - 1, d).getDay()] || 'Senin';
  };

  const getCurrentTimeStr = () => {
    const now = new Date();
    return `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
  };

  // Form inputs for Schedule
  const initialDate = getTodayDateStr();
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>(subjects[0]?.id || '');
  const [selectedActivityId, setSelectedActivityId] = useState<string>(activities[0]?.id || '');
  const [dayName, setDayName] = useState<string>(getIndonesianDayName(initialDate));
  const [examDate, setExamDate] = useState<string>(initialDate);
  const [startTime, setStartTime] = useState<string>(getCurrentTimeStr());
  const [durationMinutes, setDurationMinutes] = useState<number>(90);
  const [selectedClasses, setSelectedClasses] = useState<string[]>([]);
  const [classSelectionError, setClassSelectionError] = useState<string | null>(null);
  const [scheduleToken, setScheduleToken] = useState<string>(activeToken);
  const [materialTheme, setMaterialTheme] = useState<string>('');

  useEffect(() => {
    if (!editingSchedule && activeToken) {
      setScheduleToken(activeToken);
    }
  }, [activeToken, editingSchedule]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleToggleClass = (clsName: string) => {
    setClassSelectionError(null);
    const norm = CBTStorageService.normalizeClassName;
    if (clsName === '__ALL__') {
      const allNames = classes.map(c => c.name);
      const isAllSelected =
        allNames.length > 0 &&
        allNames.every(name => selectedClasses.some(sc => norm(sc) === norm(name)));
      setSelectedClasses(isAllSelected ? [] : allNames);
      return;
    }
    setSelectedClasses(prev => {
      const withoutWildcard = prev.filter(c => c.trim().toLowerCase() !== 'semua kelas');
      const targetKey = norm(clsName);
      const alreadyExists = withoutWildcard.some(c => norm(c) === targetKey);
      return alreadyExists
        ? withoutWildcard.filter(c => norm(c) !== targetKey)
        : [...withoutWildcard, clsName];
    });
  };

  const handleSetCurrentTime = () => {
    const today = getTodayDateStr();
    setExamDate(today);
    setDayName(getIndonesianDayName(today));
    setStartTime(getCurrentTimeStr());
  };

  const handleSaveSchedule = (e: React.FormEvent) => {
    e.preventDefault();
    const subj = subjects.find(s => s.id === selectedSubjectId) || subjects[0];
    const act = activities.find(a => a.id === selectedActivityId) || activities[0];

    // Compute end time safely (handling 00:xx midnight hours)
    const [rawH, rawM] = startTime.split(':').map(Number);
    const h = Number.isNaN(rawH) ? 7 : rawH;
    const m = Number.isNaN(rawM) ? 0 : rawM;
    const totalMinutes = h * 60 + m + Number(durationMinutes);
    const endH = Math.floor(totalMinutes / 60) % 24;
    const endM = totalMinutes % 60;
    const computedEndTime = `${String(endH).padStart(2, '0')}:${String(endM).padStart(2, '0')}`;

    if (!subj || !act) return;

    if (selectedClasses.length === 0) {
      const msg = 'Pilih minimal satu kelas sasaran ujian terlebih dahulu.';
      setClassSelectionError(msg);
      showToast(msg);
      return;
    }
    setClassSelectionError(null);

    const normalizedToken = (scheduleToken || activeToken).toUpperCase();
    const linkedExam = CBTStorageService.ensureExamForActivitySubject(
      act,
      subj,
      normalizedToken
    );

    CBTStorageService.saveExam({
      ...linkedExam,
      durationMinutes: Number(durationMinutes),
      token: normalizedToken,
    });

    const newSchedule: ExamSchedule = {
      id: editingSchedule ? editingSchedule.id : `sch-${Date.now()}`,
      examId: linkedExam.id,
      activityId: act.id,
      activityName: act.name,
      subjectId: subj.id,
      subjectName: subj.name,
      materialTheme: materialTheme.trim(),
      dayName,
      examDate,
      startTime,
      endTime: computedEndTime,
      durationMinutes: Number(durationMinutes),
      targetClasses: selectedClasses,
      token: normalizedToken,
      teacherName,
      status: 'scheduled',
    };

    const savedClassesLabel = selectedClasses.join(', ');
    CBTStorageService.saveSchedule(newSchedule);
    setSchedules(CBTStorageService.getSchedules());
    onRefreshExams();
    setEditingSchedule(null);
    setSelectedClasses([]);
    setMaterialTheme('');
    setClassSelectionError(null);
    showToast(`Jadwal ujian ${subj.name} (${act.code}) berhasil disimpan untuk ${savedClassesLabel}!`);
  };

  const handleEditSchedule = (sch: ExamSchedule) => {
    setEditingSchedule(sch);
    setSelectedSubjectId(sch.subjectId);
    setSelectedActivityId(sch.activityId);
    setMaterialTheme(sch.materialTheme || '');
    setDayName(sch.dayName);
    setExamDate(sch.examDate);
    setStartTime(sch.startTime);
    setDurationMinutes(sch.durationMinutes);
    const cleanedClasses = (sch.targetClasses || []).filter(c => c !== 'Semua Kelas');
    setSelectedClasses(cleanedClasses.length > 0 ? cleanedClasses : []);
    setClassSelectionError(
      cleanedClasses.length === 0
        ? 'Jadwal ini belum memiliki kelas spesifik. Silakan pilih kelas sasaran lalu perbarui.'
        : null
    );
    setScheduleToken(sch.token);
  };

  const handleDeleteSchedule = (sch: ExamSchedule) => {
    setDeleteScheduleTarget({
      id: sch.id,
      subjectName: sch.subjectName,
      activityName: sch.activityName,
    });
  };

  const handleConfirmDeleteSchedule = () => {
    if (!deleteScheduleTarget) return;
    CBTStorageService.deleteSchedule(deleteScheduleTarget.id);
    setSchedules(CBTStorageService.getSchedules());
    if (editingSchedule?.id === deleteScheduleTarget.id) {
      setEditingSchedule(null);
      setSelectedClasses([]);
      setClassSelectionError(null);
    }
    showToast(`Jadwal ujian ${deleteScheduleTarget.subjectName} telah dihapus.`);
    setDeleteScheduleTarget(null);
  };

  // Live preview of form timing & resolved question bank count
  const formPreview = (() => {
    const subj = subjects.find(s => s.id === selectedSubjectId) || subjects[0];
    const act = activities.find(a => a.id === selectedActivityId) || activities[0];
    const [rawH, rawM] = startTime.split(':').map(Number);
    const h = Number.isNaN(rawH) ? 7 : rawH;
    const m = Number.isNaN(rawM) ? 0 : rawM;
    const totalMinutes = h * 60 + m + Number(durationMinutes);
    const endH = Math.floor(totalMinutes / 60) % 24;
    const endM = totalMinutes % 60;
    const computedEndTime = `${String(endH).padStart(2, '0')}:${String(endM).padStart(2, '0')}`;

    const draftSchedule: ExamSchedule = {
      id: editingSchedule?.id || 'draft-preview',
      examId: editingSchedule?.examId || '',
      activityId: act?.id || '',
      activityName: act?.name || '',
      subjectId: subj?.id || '',
      subjectName: subj?.name || '',
      dayName,
      examDate,
      startTime,
      endTime: computedEndTime,
      durationMinutes: Number(durationMinutes),
      targetClasses: selectedClasses,
      token: (scheduleToken || activeToken).toUpperCase(),
      teacherName,
      status: 'scheduled',
    };

    const timing = CBTStorageService.getScheduleTimingStatus(draftSchedule);
    const resolvedExam = CBTStorageService.resolveExamForSchedule(draftSchedule);
    const qCount = resolvedExam ? CBTStorageService.getQuestions(resolvedExam.id).length : 0;
    return { timing, qCount, computedEndTime };
  })();

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Top Header */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <span className="px-2 py-0.5 bg-indigo-600 text-white rounded text-[11px] font-bold uppercase tracking-wider">
            Role: Guru Pengampu
          </span>
          <span className="text-xs text-slate-500">· {teacherName}</span>
        </div>
        <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
          Panel Guru: Pengelolaan Jadwal Ujian & Unggah Soal
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
          Kelola jadwal ujian (hari, tanggal, waktu mulai, durasi, nama mapel) dan unggah/buat naskah soal beserta formula matematika & sains.
        </p>
      </div>

      {toastMessage && (
        <div className="p-3 bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-300 dark:border-emerald-800 rounded-xl text-xs font-medium text-emerald-800 dark:text-emerald-200 flex items-center gap-2 animate-fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Navigation Sub-Tabs */}
      <div className="flex flex-wrap items-center gap-1.5 border-b border-slate-200 dark:border-slate-800 pb-2">
        <button
          onClick={() => setActiveTab('schedules')}
          className={`px-3.5 py-2 text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5 ${
            activeTab === 'schedules'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Calendar className="w-3.5 h-3.5" />
          <span>Pengelolaan Jadwal Ujian ({schedules.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('questions')}
          className={`px-3.5 py-2 text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5 ${
            activeTab === 'questions'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <BookOpen className="w-3.5 h-3.5" />
          <span>Unggah & Kelola Bank Soal</span>
        </button>

        <button
          onClick={() => setActiveTab('proctor')}
          className={`px-3.5 py-2 text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5 ${
            activeTab === 'proctor'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Users className="w-3.5 h-3.5" />
          <span>Ruang Pengawas & Pantau Siswa</span>
        </button>
      </div>

      {/* TAB 1: PENGELOLAAN JADWAL UJIAN */}
      {activeTab === 'schedules' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Form Create/Edit Schedule */}
          <form onSubmit={handleSaveSchedule} className="lg:col-span-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs space-y-4">
            <div className="border-b border-slate-100 dark:border-slate-800 pb-3 flex items-center justify-between">
              <div>
                <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                  {editingSchedule ? 'Edit Jadwal Ujian' : 'Buat Jadwal Ujian Baru'}
                </h2>
                <p className="text-[11px] text-slate-500">
                  Tentukan hari, tanggal, waktu mulai, durasi, dan mapel
                </p>
              </div>
              {editingSchedule && (
                <button
                  type="button"
                  onClick={() => {
                    setEditingSchedule(null);
                    setSelectedClasses([]);
                    setMaterialTheme('');
                    setClassSelectionError(null);
                  }}
                  className="text-xs text-slate-500 hover:text-slate-900"
                >
                  Batal
                </button>
              )}
            </div>

            {/* Mata Pelajaran */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Nama Mata Pelajaran:
              </label>
              <select
                value={selectedSubjectId}
                onChange={(e) => setSelectedSubjectId(e.target.value)}
                className="w-full text-xs sm:text-sm px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
              >
                {subjects.map(s => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({s.code} - {s.category})
                  </option>
                ))}
              </select>
            </div>

            {/* Aktivitas Ujian */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Aktivitas Ujian:
              </label>
              <select
                value={selectedActivityId}
                onChange={(e) => setSelectedActivityId(e.target.value)}
                className="w-full text-xs sm:text-sm px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
              >
                {activities.map(a => (
                  <option key={a.id} value={a.id}>
                    {a.name} ({a.code})
                  </option>
                ))}
              </select>
            </div>

            {/* Tema / Materi yang Diujikan */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Tema / Materi yang Diujikan (Opsional):
              </label>
              <input
                type="text"
                value={materialTheme}
                onChange={(e) => setMaterialTheme(e.target.value)}
                placeholder="Contoh: Bab 1 - Limit Fungsi & Turunan Aljabar"
                className="w-full text-xs sm:text-sm px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
              />
            </div>

            {/* Hari & Tanggal */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Hari Pelaksanaan:
                </label>
                <select
                  value={dayName}
                  onChange={(e) => setDayName(e.target.value)}
                  className="w-full text-xs px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
                >
                  <option value="Senin">Senin</option>
                  <option value="Selasa">Selasa</option>
                  <option value="Rabu">Rabu</option>
                  <option value="Kamis">Kamis</option>
                  <option value="Jumat">Jumat</option>
                  <option value="Sabtu">Sabtu</option>
                  <option value="Minggu">Minggu</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Tanggal Ujian:
                </label>
                <input
                  type="date"
                  value={examDate}
                  onChange={(e) => {
                    setExamDate(e.target.value);
                    if (e.target.value) {
                      setDayName(getIndonesianDayName(e.target.value));
                    }
                  }}
                  className="w-full text-xs px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
                  required
                />
              </div>
            </div>

            {/* Waktu Mulai & Durasi */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Jam Mulai (WIB):
                  </label>
                  <button
                    type="button"
                    onClick={handleSetCurrentTime}
                    className="text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 hover:underline"
                  >
                    Waktu Sekarang
                  </button>
                </div>
                <input
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className="w-full text-xs px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Durasi Pengerjaan:
                </label>
                <select
                  value={durationMinutes}
                  onChange={(e) => setDurationMinutes(Number(e.target.value))}
                  className="w-full text-xs px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
                >
                  <option value={30}>30 Menit</option>
                  <option value={45}>45 Menit</option>
                  <option value={60}>60 Menit (1 Jam)</option>
                  <option value={90}>90 Menit (1.5 Jam)</option>
                  <option value={120}>120 Menit (2 Jam)</option>
                </select>
              </div>
            </div>

            {/* Kelas Sasaran Checkbox */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Pilih Kelas Sasaran Ujian:
                </label>
                <span className="text-[11px] text-slate-500">
                  {selectedClasses.length === 0
                    ? 'Belum dipilih'
                    : `${selectedClasses.length} Kelas dipilih`}
                </span>
              </div>
              <div className="flex flex-wrap gap-1.5 p-2.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700">
                <button
                  type="button"
                  onClick={() => handleToggleClass('__ALL__')}
                  className={`text-xs px-2.5 py-1 rounded-lg border transition-all ${
                    classes.length > 0 &&
                    classes.every(c =>
                      selectedClasses.some(
                        sc => CBTStorageService.normalizeClassName(sc) === CBTStorageService.normalizeClassName(c.name)
                      )
                    )
                      ? 'bg-emerald-600 text-white border-emerald-600 font-semibold'
                      : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-700'
                  }`}
                >
                  Pilih Semua Kelas
                </button>
                {classes.map(c => {
                  const isChecked = selectedClasses.some(
                    sc => CBTStorageService.normalizeClassName(sc) === CBTStorageService.normalizeClassName(c.name)
                  );
                  return (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => handleToggleClass(c.name)}
                      className={`text-xs px-2.5 py-1 rounded-lg border transition-all ${
                        isChecked
                          ? 'bg-indigo-600 text-white border-indigo-600 font-medium'
                          : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-700'
                      }`}
                    >
                      {c.name}
                    </button>
                  );
                })}
              </div>
              {classSelectionError && (
                <div className="mt-2 p-2.5 rounded-xl bg-red-50 dark:bg-red-950/60 border border-red-200 dark:border-red-800 text-[11px] text-red-700 dark:text-red-300 font-semibold flex items-center gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                  <span>{classSelectionError}</span>
                </div>
              )}
            </div>

            {/* Token Ujian */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Token Ujian:
                </label>
                <button
                  type="button"
                  onClick={() => setScheduleToken(CBTStorageService.generateNewToken())}
                  className="text-[11px] text-indigo-600 dark:text-indigo-400 flex items-center gap-1 hover:underline"
                >
                  <RefreshCw className="w-3 h-3" />
                  <span>Generate Acak</span>
                </button>
              </div>
              <input
                type="text"
                value={scheduleToken}
                onChange={(e) => setScheduleToken(e.target.value.toUpperCase())}
                placeholder="6 Karakter Token (e.g. MADR26)"
                maxLength={8}
                className="w-full text-xs sm:text-sm font-mono tracking-widest uppercase font-bold px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
                required
              />
            </div>

            {/* Live Preview Status Jadwal & Soal */}
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-1.5 text-[11px]">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-1.5">
                  <span className="text-slate-500">Status saat ini:</span>
                  <span
                    className={`font-bold px-2 py-0.5 rounded ${
                      formPreview.timing.status === 'active'
                        ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300'
                        : formPreview.timing.status === 'upcoming'
                        ? 'bg-sky-100 text-sky-700 dark:bg-sky-950/60 dark:text-sky-300'
                        : 'bg-slate-200 text-slate-600 dark:bg-slate-700 dark:text-slate-300'
                    }`}
                  >
                    {formPreview.timing.status === 'active'
                      ? 'Sedang Berlangsung'
                      : formPreview.timing.status === 'upcoming'
                      ? 'Belum Dimulai'
                      : 'Sudah Berakhir'}
                  </span>
                </div>
                <span className="font-mono text-slate-600 dark:text-slate-300">
                  {startTime}–{formPreview.computedEndTime} ·{' '}
                  <strong className={formPreview.qCount > 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'}>
                    {formPreview.qCount} Soal Tersedia
                  </strong>
                </span>
              </div>
              <div className="flex items-center justify-between text-[11px] pt-1 border-t border-slate-200/70 dark:border-slate-700/70">
                <span className="text-slate-500">Kelas Sasaran:</span>
                <strong className={selectedClasses.length > 0 ? 'text-indigo-600 dark:text-indigo-400' : 'text-amber-600 dark:text-amber-400'}>
                  {selectedClasses.length > 0 ? selectedClasses.join(', ') : 'Belum dipilih'}
                </strong>
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs sm:text-sm font-semibold transition-colors flex items-center justify-center gap-2 shadow-xs"
            >
              <Save className="w-4 h-4" />
              <span>{editingSchedule ? 'Perbarui Jadwal Ujian' : 'Simpan Jadwal Ujian'}</span>
            </button>
          </form>

          {/* Right Column: Schedules Table + Live Participant Room List */}
          <div className="lg:col-span-7 space-y-6">
            {/* Table of Schedules */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-xs">
              <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
                <div>
                  <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                    Daftar Jadwal Ujian Aktif
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Jadwal yang dapat diakses oleh siswa sesuai kelasnya
                  </p>
                </div>
                <span className="text-xs font-mono text-slate-500">
                  Total: {schedules.length} Jadwal
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-semibold border-b border-slate-200 dark:border-slate-800">
                    <tr>
                      <SortableTh
                        label="Mata Pelajaran & Aktivitas"
                        sortKey="subject"
                        sortState={scheduleSort}
                        onSort={(key) => setScheduleSort(prev => toggleSortState(prev, key))}
                        className="py-2.5 px-3"
                      />
                      <SortableTh
                        label="Waktu & Tanggal"
                        sortKey="datetime"
                        sortState={scheduleSort}
                        onSort={(key) => setScheduleSort(prev => toggleSortState(prev, key))}
                        className="py-2.5 px-3"
                      />
                      <SortableTh
                        label="Kelas Sasaran"
                        sortKey="classes"
                        sortState={scheduleSort}
                        onSort={(key) => setScheduleSort(prev => toggleSortState(prev, key))}
                        className="py-2.5 px-3"
                      />
                      <SortableTh
                        label="Token"
                        sortKey="token"
                        sortState={scheduleSort}
                        onSort={(key) => setScheduleSort(prev => toggleSortState(prev, key))}
                        align="center"
                        className="py-2.5 px-3"
                      />
                      <th className="py-2.5 px-3 text-right">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {sortRows(schedules, scheduleSort, {
                      subject: (sch) => `${sch.subjectName} ${sch.activityName}`,
                      datetime: (sch) => `${sch.examDate} ${sch.startTime}`,
                      classes: (sch) => (sch.targetClasses || []).join(', '),
                      token: (sch) => sch.token,
                    }).map((sch) => {
                      const timing = CBTStorageService.getScheduleTimingStatus(sch);
                      const resolvedExam = CBTStorageService.resolveExamForSchedule(sch);
                      const qCount = resolvedExam ? CBTStorageService.getQuestions(resolvedExam.id).length : 0;
                      return (
                      <tr key={sch.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                        <td className="py-2.5 px-3">
                          <div className="font-bold text-slate-900 dark:text-white">
                            {sch.subjectName}
                          </div>
                          <div className="text-[11px] text-indigo-600 dark:text-indigo-400">
                            {sch.activityName}
                          </div>
                          {sch.materialTheme && (
                            <div className="text-[11px] text-slate-600 dark:text-slate-300 italic mt-0.5">
                              Tema: {sch.materialTheme}
                            </div>
                          )}
                          <div className="mt-1 flex items-center gap-1.5">
                            <span
                              className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${
                                timing.status === 'active'
                                  ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300'
                                  : timing.status === 'upcoming'
                                  ? 'bg-sky-100 text-sky-700 dark:bg-sky-950/60 dark:text-sky-300'
                                  : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400'
                              }`}
                            >
                              {timing.status === 'active'
                                ? 'Sedang Berlangsung'
                                : timing.status === 'upcoming'
                                ? 'Belum Dimulai'
                                : 'Selesai'}
                            </span>
                            <span className="text-[10px] text-slate-500 font-mono">
                              {qCount} Soal
                            </span>
                          </div>
                        </td>
                        <td className="py-2.5 px-3 text-slate-600 dark:text-slate-300">
                          <div className="font-medium">
                            {sch.dayName}, {sch.examDate}
                          </div>
                          <div className="text-[11px] text-slate-400 font-mono">
                            {sch.startTime} - {sch.endTime} ({sch.durationMinutes} m)
                          </div>
                        </td>
                        <td className="py-2.5 px-3">
                          <div className="flex flex-wrap gap-1 max-w-[170px]">
                            {sch.targetClasses.map(c =>
                              c === 'Semua Kelas' ? (
                                <span
                                  key={c}
                                  className="text-[10px] px-1.5 py-0.5 rounded bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 font-semibold"
                                  title="Klik Edit untuk menetapkan kelas spesifik"
                                >
                                  Belum Spesifik (Edit)
                                </span>
                              ) : (
                                <span
                                  key={c}
                                  className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300"
                                >
                                  {c}
                                </span>
                              )
                            )}
                          </div>
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          <span className="font-mono font-bold text-xs bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-300 dark:border-amber-800 px-2 py-0.5 rounded">
                            {sch.token}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              type="button"
                              onClick={() => handleEditSchedule(sch)}
                              className="p-1 text-slate-500 hover:text-indigo-600 rounded"
                              title="Edit Jadwal"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteSchedule(sch)}
                              className="p-1 text-slate-400 hover:text-red-600 rounded"
                              title="Hapus Jadwal"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Live Student & Room Participant Roster synced with Master Siswa */}
            {(() => {
              const norm = (v: string) => CBTStorageService.normalizeClassName(v);
              const allRooms = Array.from(new Set(students.map(s => s.room).filter(Boolean)));
              const filteredParticipants = students.filter(s => {
                const matchesSearch =
                  !participantSearch.trim() ||
                  s.name.toLowerCase().includes(participantSearch.toLowerCase()) ||
                  s.nis.toLowerCase().includes(participantSearch.toLowerCase()) ||
                  s.nisn.toLowerCase().includes(participantSearch.toLowerCase()) ||
                  s.room.toLowerCase().includes(participantSearch.toLowerCase());
                const matchesClass =
                  participantClassFilter === 'all'
                    ? true
                    : participantClassFilter === 'target'
                    ? (selectedClasses.length === 0 || selectedClasses.some(tc => norm(tc) === norm(s.className)))
                    : norm(s.className) === norm(participantClassFilter);
                const matchesRoom =
                  participantRoomFilter === 'all' || (s.room || '').trim().toLowerCase() === (participantRoomFilter || '').trim().toLowerCase();
                return matchesSearch && matchesClass && matchesRoom;
              });

              const roomCounts = filteredParticipants.reduce<Record<string, number>>((acc, s) => {
                const r = s.room || 'Belum Diatur';
                acc[r] = (acc[r] || 0) + 1;
                return acc;
              }, {});

              return (
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-xs">
                  <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
                        <Users className="w-3.5 h-3.5 text-indigo-600" />
                        <span>Daftar Nama Peserta &amp; Ruang Kelas Terbaru</span>
                      </h3>
                      <p className="text-[11px] text-slate-500">
                        Tersinkron otomatis dengan data Master Siswa &amp; NIS terbaru ({students.length} total siswa terdaftar)
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        refreshMasterStudentsAndClasses();
                        showToast('Daftar peserta dan ruang kelas berhasil disegarkan dari data siswa terbaru.');
                      }}
                      className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-lg text-[11px] font-semibold flex items-center gap-1.5 transition-colors"
                    >
                      <RefreshCw className="w-3 h-3" />
                      <span>Segarkan Data</span>
                    </button>
                  </div>

                  {/* Filters & Room Summary */}
                  <div className="p-3.5 bg-slate-50/70 dark:bg-slate-800/40 border-b border-slate-200 dark:border-slate-800 space-y-2.5">
                    <div className="flex flex-wrap items-center gap-2">
                      <div className="relative flex-1 min-w-[170px]">
                        <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                        <input
                          type="text"
                          value={participantSearch}
                          onChange={(e) => setParticipantSearch(e.target.value)}
                          placeholder="Cari nama, NIS, atau ruang..."
                          className="w-full pl-8 pr-3 py-1.5 text-xs bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
                        />
                      </div>
                      <select
                        value={participantClassFilter}
                        onChange={(e) => setParticipantClassFilter(e.target.value)}
                        className="text-xs px-2.5 py-1.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-700 dark:text-slate-200"
                      >
                        <option value="target">Sesuai Kelas Sasaran Form</option>
                        <option value="all">Semua Kelas ({students.length})</option>
                        {classes.map(c => (
                          <option key={c.id} value={c.name}>{c.name}</option>
                        ))}
                      </select>
                      <select
                        value={participantRoomFilter}
                        onChange={(e) => setParticipantRoomFilter(e.target.value)}
                        className="text-xs px-2.5 py-1.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-700 dark:text-slate-200"
                      >
                        <option value="all">Semua Ruang</option>
                        {allRooms.map(room => (
                          <option key={room} value={room}>{room}</option>
                        ))}
                      </select>
                    </div>

                    {Object.keys(roomCounts).length > 0 && (
                      <div className="flex flex-wrap items-center gap-1.5 text-[11px]">
                        <span className="text-slate-500">Sebaran Ruang:</span>
                        {Object.entries(roomCounts).map(([roomName, cnt]) => (
                          <span
                            key={roomName}
                            className="px-2 py-0.5 rounded bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-medium"
                          >
                            {roomName}: <strong className="font-mono text-indigo-600 dark:text-indigo-400">{cnt}</strong>
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="overflow-x-auto max-h-72 overflow-y-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-semibold sticky top-0 border-b border-slate-200 dark:border-slate-800">
                        <tr>
                          <th className="py-2 px-3 text-center w-10">No</th>
                          <SortableTh
                            label="NIS / NISN"
                            sortKey="nis"
                            sortState={participantSort}
                            onSort={(key) => setParticipantSort(prev => toggleSortState(prev, key))}
                            className="py-2 px-3"
                          />
                          <SortableTh
                            label="Nama Peserta"
                            sortKey="name"
                            sortState={participantSort}
                            onSort={(key) => setParticipantSort(prev => toggleSortState(prev, key))}
                            className="py-2 px-3"
                          />
                          <SortableTh
                            label="Kelas"
                            sortKey="className"
                            sortState={participantSort}
                            onSort={(key) => setParticipantSort(prev => toggleSortState(prev, key))}
                            className="py-2 px-3"
                          />
                          <SortableTh
                            label="Ruang Kelas / Ujian"
                            sortKey="room"
                            sortState={participantSort}
                            onSort={(key) => setParticipantSort(prev => toggleSortState(prev, key))}
                            className="py-2 px-3"
                          />
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                        {filteredParticipants.length === 0 ? (
                          <tr>
                            <td colSpan={5} className="py-6 text-center text-slate-400">
                              Tidak ada peserta yang sesuai dengan filter kelas/ruang.
                            </td>
                          </tr>
                        ) : (
                          sortRows(filteredParticipants, participantSort, {
                            nis: (std) => std.nis || std.nisn,
                            name: (std) => std.name,
                            className: (std) => std.className,
                            room: (std) => std.room,
                          }).map((std, i) => (
                            <tr key={std.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                              <td className="py-2 px-3 text-center font-mono text-slate-400">{i + 1}</td>
                              <td className="py-2 px-3 font-mono">
                                <div className="font-semibold text-indigo-600 dark:text-indigo-400">{std.nis}</div>
                                <div className="text-[10px] text-slate-400">{std.nisn}</div>
                              </td>
                              <td className="py-2 px-3 font-semibold text-slate-900 dark:text-white">
                                {std.name}
                              </td>
                              <td className="py-2 px-3 text-slate-700 dark:text-slate-300">{std.className}</td>
                              <td className="py-2 px-3">
                                <span className="text-[11px] px-2 py-0.5 rounded bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 font-medium">
                                  {std.room}
                                </span>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      )}

      {/* TAB 2: UNGGAH & KELOLA BANK SOAL */}
      {activeTab === 'questions' && (
        <QuestionBankManager
          exams={exams}
          onRefreshExams={onRefreshExams}
        />
      )}

      {/* TAB 3: RUANG PENGAWAS & MONITOR SISWA */}
      {activeTab === 'proctor' && (
        <ProctorMonitor
          exams={exams}
          activeToken={activeToken}
          onRefreshToken={onRefreshToken}
        />
      )}

      {/* IN-APP CONFIRMATION DELETE MODAL FOR SCHEDULE */}
      {deleteScheduleTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl max-w-md w-full p-6 text-center space-y-4">
            <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-950 text-red-600 dark:text-red-400 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Konfirmasi Hapus Jadwal Ujian
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 leading-relaxed">
                Apakah Anda yakin ingin menghapus jadwal ujian{' '}
                <strong>"{deleteScheduleTarget.subjectName}"</strong> ({deleteScheduleTarget.activityName})? Data yang dihapus tidak dapat dipulihkan.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                type="button"
                onClick={() => setDeleteScheduleTarget(null)}
                className="py-2.5 px-4 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-semibold transition-colors"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleConfirmDeleteSchedule}
                className="py-2.5 px-4 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-semibold transition-colors shadow-2xs"
              >
                Ya, Hapus Jadwal
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
