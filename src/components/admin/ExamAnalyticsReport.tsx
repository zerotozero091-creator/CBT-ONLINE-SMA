/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useMemo, useState } from 'react';
import {
  FileSpreadsheet,
  FileText,
  Search,
  RefreshCw,
  AlertCircle,
  Users
} from 'lucide-react';
import { Exam, ExamSchedule, Student, Submission } from '../../types/cbt';
import { CBTStorageService } from '../../services/cbt-storage';
import { CBTExportService } from '../../services/export-service';
import {
  SortableTh,
  SortState,
  createInitialSortState,
  toggleSortState,
  sortRows,
} from '../common/SortableTableHeader';

interface ExamAnalyticsReportProps {
  exams: Exam[];
}

interface ParticipantRow {
  rowKey: string;
  studentId: string;
  nis: string;
  nisn: string;
  studentName: string;
  className: string;
  room: string;
  examStatus: 'completed' | 'in_progress' | 'not_started';
  submission?: Submission;
}

export const ExamAnalyticsReport: React.FC<ExamAnalyticsReportProps> = ({ exams }) => {
  const [liveExams, setLiveExams] = useState<Exam[]>(() => CBTStorageService.getExams());
  const [liveSchedules, setLiveSchedules] = useState<ExamSchedule[]>(() => CBTStorageService.getSchedules());
  const [liveStudents, setLiveStudents] = useState<Student[]>(() => CBTStorageService.getStudents());
  const [allSubmissions, setAllSubmissions] = useState<Submission[]>(() => CBTStorageService.getSubmissions());

  const [selectedExamId, setSelectedExamId] = useState<string>(() => {
    const subs = CBTStorageService.getSubmissions();
    const realSubs = subs
      .filter(s => !s.id.startsWith('sub-exam-mat-xii-std-') && !s.id.startsWith('sim-sub-'))
      .sort((a, b) => (b.finishedAt || 0) - (a.finishedAt || 0));
    if (realSubs.length > 0) return realSubs[0].examId;

    const schedules = CBTStorageService.getSchedules();
    const allExams = CBTStorageService.getExams();
    const seedIds = new Set(['sch-1', 'sch-2']);
    const customSchedule = schedules.find(s => !seedIds.has(s.id)) || schedules[0];
    if (customSchedule) {
      const resolved = CBTStorageService.resolveExamForSchedule(customSchedule);
      if (resolved) return resolved.id;
    }

    return allExams[0]?.id || exams[0]?.id || '';
  });

  const [searchQuery, setSearchQuery] = useState<string>('');
  const [filterClass, setFilterClass] = useState<string>('all');
  const [filterStudentId, setFilterStudentId] = useState<string>('all');
  const [activeTab, setActiveTab] = useState<'students' | 'analysis'>('students');
  const [studentSort, setStudentSort] = useState<SortState>(() => createInitialSortState());
  const [analysisSort, setAnalysisSort] = useState<SortState>(() => createInitialSortState());
  const [noticeMessage, setNoticeMessage] = useState<string | null>(null);

  const showNotice = (msg: string) => {
    setNoticeMessage(msg);
    setTimeout(() => setNoticeMessage(prev => (prev === msg ? null : prev)), 3500);
  };

  const refreshAllData = () => {
    setLiveExams(CBTStorageService.getExams());
    setLiveSchedules(CBTStorageService.getSchedules());
    setLiveStudents(CBTStorageService.getStudents());
    setAllSubmissions(CBTStorageService.getSubmissions());
  };

  useEffect(() => {
    refreshAllData();
    window.addEventListener('cbt-submissions-change', refreshAllData);
    window.addEventListener('cbt-students-change', refreshAllData);
    window.addEventListener('cbt-classes-change', refreshAllData);
    window.addEventListener('cbt-schedules-change', refreshAllData);
    window.addEventListener('cbt-exams-change', refreshAllData);
    window.addEventListener('storage', refreshAllData);

    return () => {
      window.removeEventListener('cbt-submissions-change', refreshAllData);
      window.removeEventListener('cbt-students-change', refreshAllData);
      window.removeEventListener('cbt-classes-change', refreshAllData);
      window.removeEventListener('cbt-schedules-change', refreshAllData);
      window.removeEventListener('cbt-exams-change', refreshAllData);
      window.removeEventListener('storage', refreshAllData);
    };
  }, [exams]);

  // Map only exams that actually have an active schedule in Jadwal Ujian
  const scheduledExamMeta = useMemo(() => {
    const norm = CBTStorageService.normalizeClassName;
    const map = new Map<
      string,
      { schedules: ExamSchedule[]; targetClasses: string[]; targetClassNorms: Set<string>; titleOverride?: string }
    >();

    liveSchedules.forEach(sch => {
      const resolved = CBTStorageService.resolveExamForSchedule(sch);
      const effectiveId = resolved?.id || sch.examId;
      if (!effectiveId) return;

      const entry = map.get(effectiveId) || {
        schedules: [],
        targetClasses: [],
        targetClassNorms: new Set<string>(),
      };
      entry.schedules.push(sch);
      (sch.targetClasses || []).forEach(cls => {
        if (!cls || cls.trim().toLowerCase() === 'semua kelas') return;
        const key = norm(cls);
        if (!key) return;
        if (!entry.targetClassNorms.has(key)) {
          entry.targetClassNorms.add(key);
          entry.targetClasses.push(cls.trim());
        }
      });
      if (!entry.titleOverride && sch.activityName && sch.subjectName) {
        entry.titleOverride = `${sch.activityName} ${sch.subjectName}`;
      }
      map.set(effectiveId, entry);
    });

    return map;
  }, [liveSchedules]);

  // Only list exams that are scheduled, prioritizing exams with real submissions first
  const orderedExams = useMemo(() => {
    const source = liveExams.length > 0 ? liveExams : exams;
    const scheduledOnly = source.filter(ex => scheduledExamMeta.has(ex.id));

    return [...scheduledOnly].sort((a, b) => {
      const aReal = allSubmissions.some(
        s => s.examId === a.id && !s.id.startsWith('sub-exam-mat-xii-std-') && !s.id.startsWith('sim-sub-')
      )
        ? 0
        : 1;
      const bReal = allSubmissions.some(
        s => s.examId === b.id && !s.id.startsWith('sub-exam-mat-xii-std-') && !s.id.startsWith('sim-sub-')
      )
        ? 0
        : 1;
      if (aReal !== bReal) return aReal - bReal;
      return (b.createdAt || '').localeCompare(a.createdAt || '');
    });
  }, [liveExams, exams, allSubmissions, scheduledExamMeta]);

  const selectedExam =
    orderedExams.find(e => e.id === selectedExamId) || orderedExams[0];

  useEffect(() => {
    const nextId = selectedExam?.id || '';
    if (nextId !== selectedExamId) {
      setSelectedExamId(nextId);
    }
  }, [selectedExam, selectedExamId]);

  // Linked schedules & target classes for selected exam
  const linkedSchedules = useMemo(() => {
    if (!selectedExam) return [];
    return scheduledExamMeta.get(selectedExam.id)?.schedules || [];
  }, [scheduledExamMeta, selectedExam]);

  const examSubmissions = useMemo(() => {
    if (!selectedExam) return [];
    const targetNorms = scheduledExamMeta.get(selectedExam.id)?.targetClassNorms;
    const norm = CBTStorageService.normalizeClassName;
    return allSubmissions.filter(s => {
      if (s.examId !== selectedExam.id) return false;
      if (targetNorms && targetNorms.size > 0) {
        return targetNorms.has(norm(s.className));
      }
      return true;
    });
  }, [allSubmissions, selectedExam, scheduledExamMeta]);

  const itemAnalysis = useMemo(() => {
    return selectedExam?.id ? CBTStorageService.computeItemAnalysis(selectedExam.id) : [];
  }, [selectedExam?.id, examSubmissions]);

  // Build unified participant list from completed submissions + students enrolled in scheduled classes
  const participantRows = useMemo<ParticipantRow[]>(() => {
    if (!selectedExam) return [];
    const norm = CBTStorageService.normalizeClassName;
    const studentById = new Map(liveStudents.map(s => [s.id, s]));
    const studentByNisn = new Map(liveStudents.map(s => [s.nisn, s]));
    const studentByNis = new Map(liveStudents.map(s => [s.nis, s]));

    const rows: ParticipantRow[] = [];
    const seenStudentKeys = new Set<string>();

    // 1. Completed submissions (always synced with latest Master Siswa)
    examSubmissions.forEach(sub => {
      const matchedStd =
        studentById.get(sub.studentId) ||
        studentByNisn.get(sub.nisn) ||
        studentByNis.get(sub.nisn);

      const studentKey = matchedStd?.id || sub.studentId;
      seenStudentKeys.add(studentKey);
      if (matchedStd?.nis) seenStudentKeys.add(`nis:${matchedStd.nis}`);
      if (sub.nisn) seenStudentKeys.add(`nisn:${sub.nisn}`);

      rows.push({
        rowKey: sub.id,
        studentId: studentKey,
        nis: matchedStd?.nis || '-',
        nisn: matchedStd?.nisn || sub.nisn,
        studentName: matchedStd?.name || sub.studentName,
        className: matchedStd?.className || sub.className,
        room: matchedStd?.room || sub.room,
        examStatus: 'completed',
        submission: sub,
      });
    });

    // 2. Enrolled students from scheduled targetClasses who are currently taking or haven't submitted yet
    const targetClassNorms = new Set<string>();
    linkedSchedules.forEach(sch => {
      (sch.targetClasses || []).forEach(cls => {
        const key = norm(cls);
        if (key && key !== 'semua kelas') targetClassNorms.add(key);
      });
    });

    if (targetClassNorms.size > 0) {
      liveStudents.forEach(std => {
        if (!targetClassNorms.has(norm(std.className))) return;
        if (
          seenStudentKeys.has(std.id) ||
          seenStudentKeys.has(`nis:${std.nis}`) ||
          seenStudentKeys.has(`nisn:${std.nisn}`)
        ) {
          return;
        }

        const draftAnswers = CBTStorageService.getStudentAnswers(selectedExam.id, std.id);
        const hasDraft = Object.keys(draftAnswers).length > 0;

        rows.push({
          rowKey: `enrolled-${selectedExam.id}-${std.id}`,
          studentId: std.id,
          nis: std.nis,
          nisn: std.nisn,
          studentName: std.name,
          className: std.className,
          room: std.room,
          examStatus: hasDraft ? 'in_progress' : 'not_started',
        });
      });
    }

    return rows.sort((a, b) => {
      const statusRank = { completed: 0, in_progress: 1, not_started: 2 };
      if (statusRank[a.examStatus] !== statusRank[b.examStatus]) {
        return statusRank[a.examStatus] - statusRank[b.examStatus];
      }
      const clsCmp = (a.className || '').localeCompare(b.className || '', 'id', { numeric: true });
      if (clsCmp !== 0) return clsCmp;
      return (a.studentName || '').localeCompare(b.studentName || '', 'id');
    });
  }, [selectedExam, examSubmissions, liveStudents, linkedSchedules]);

  // Dynamic Class List Box options derived from participating classes & scheduled classes
  const availableClasses = useMemo(() => {
    const norm = CBTStorageService.normalizeClassName;
    const classMap = new Map<string, { label: string; count: number; submittedCount: number }>();

    linkedSchedules.forEach(sch => {
      (sch.targetClasses || []).forEach(cls => {
        const key = norm(cls);
        if (!key || key === 'semua kelas') return;
        if (!classMap.has(key)) {
          classMap.set(key, { label: cls.trim(), count: 0, submittedCount: 0 });
        }
      });
    });

    participantRows.forEach(row => {
      const key = norm(row.className);
      if (!key) return;
      const existing = classMap.get(key);
      if (existing) {
        existing.count += 1;
        if (row.examStatus === 'completed') existing.submittedCount += 1;
      } else {
        classMap.set(key, {
          label: row.className,
          count: 1,
          submittedCount: row.examStatus === 'completed' ? 1 : 0,
        });
      }
    });

    return Array.from(classMap.entries())
      .map(([key, info]) => ({ key, ...info }))
      .sort((a, b) => a.label.localeCompare(b.label, 'id', { numeric: true }));
  }, [linkedSchedules, participantRows]);

  // Reset class filter if selected class doesn't exist in current exam
  useEffect(() => {
    if (filterClass === 'all') return;
    const exists = availableClasses.some(c => c.key === filterClass);
    if (!exists) {
      setFilterClass('all');
    }
  }, [availableClasses, filterClass]);

  // Dynamic Student List Box options scoped by selected class
  const classScopedParticipants = useMemo(() => {
    const norm = CBTStorageService.normalizeClassName;
    return participantRows.filter(
      row => filterClass === 'all' || norm(row.className) === filterClass
    );
  }, [participantRows, filterClass]);

  useEffect(() => {
    if (filterStudentId === 'all') return;
    const exists = classScopedParticipants.some(p => p.studentId === filterStudentId);
    if (!exists) {
      setFilterStudentId('all');
    }
  }, [classScopedParticipants, filterStudentId]);

  // Filtered participant rows & completed submissions
  const filteredRows = useMemo(() => {
    const norm = CBTStorageService.normalizeClassName;
    const q = searchQuery.trim().toLowerCase();
    return participantRows.filter(row => {
      const matchesClass = filterClass === 'all' || norm(row.className) === filterClass;
      const matchesStudent = filterStudentId === 'all' || row.studentId === filterStudentId;
      const matchesSearch =
        !q ||
        row.studentName.toLowerCase().includes(q) ||
        row.nis.toLowerCase().includes(q) ||
        row.nisn.toLowerCase().includes(q) ||
        row.className.toLowerCase().includes(q);
      return matchesClass && matchesStudent && matchesSearch;
    });
  }, [participantRows, filterClass, filterStudentId, searchQuery]);

  const sortedRows = useMemo(() => {
    return sortRows(filteredRows, studentSort, {
      nis: (r) => (r.nis !== '-' ? r.nis : r.nisn),
      studentName: (r) => r.studentName,
      className: (r) => r.className,
      correctCount: (r) => r.submission?.correctCount ?? -1,
      incorrectCount: (r) => r.submission?.incorrectCount ?? -1,
      emptyCount: (r) => r.submission?.emptyCount ?? -1,
      infractionsCount: (r) => r.submission?.infractionsCount ?? -1,
      percentage: (r) => r.submission?.percentage ?? -1,
      status: (r) =>
        r.submission
          ? r.submission.isPassed
            ? 'TUNTAS'
            : 'BELUM TUNTAS'
          : r.examStatus === 'in_progress'
          ? 'MENGERJAKAN'
          : 'BELUM UJIAN',
    });
  }, [filteredRows, studentSort]);

  const sortedItemAnalysis = useMemo(() => {
    return sortRows(itemAnalysis, analysisSort, {
      questionNumber: (ia) => ia.questionNumber,
      difficulty: (ia) => ia.difficulty,
      correctPercentage: (ia) => ia.correctPercentage,
      discriminatingPower: (ia) => ia.discriminatingPower,
      optA: (ia) => ia.optionDistribution['A'] || 0,
      optB: (ia) => ia.optionDistribution['B'] || 0,
      optC: (ia) => ia.optionDistribution['C'] || 0,
      optD: (ia) => ia.optionDistribution['D'] || 0,
      optE: (ia) => ia.optionDistribution['E'] || 0,
    });
  }, [itemAnalysis, analysisSort]);

  const filteredCompletedSubmissions = useMemo(
    () =>
      filteredRows
        .map(r => r.submission)
        .filter((s): s is Submission => Boolean(s)),
    [filteredRows]
  );

  // Statistics computed over filtered completed submissions
  const totalCompleted = filteredCompletedSubmissions.length;
  const passedStudents = filteredCompletedSubmissions.filter(s => s.isPassed).length;
  const failedStudents = totalCompleted - passedStudents;
  const passRate = totalCompleted > 0 ? Math.round((passedStudents / totalCompleted) * 100) : 0;
  const avgScore =
    totalCompleted > 0
      ? (filteredCompletedSubmissions.reduce((acc, s) => acc + s.percentage, 0) / totalCompleted).toFixed(1)
      : '0';

  const maxScore =
    totalCompleted > 0 ? Math.max(...filteredCompletedSubmissions.map(s => s.percentage)) : 0;
  const minScore =
    totalCompleted > 0 ? Math.min(...filteredCompletedSubmissions.map(s => s.percentage)) : 0;

  // Export handlers
  const handleExportExcel = () => {
    if (!selectedExam || filteredCompletedSubmissions.length === 0) {
      showNotice('Belum ada data nilai peserta yang selesai ujian pada filter saat ini untuk diekspor.');
      return;
    }
    CBTExportService.exportToExcel(selectedExam, filteredCompletedSubmissions, itemAnalysis);
  };

  const handleExportPdf = () => {
    if (!selectedExam || filteredCompletedSubmissions.length === 0) {
      showNotice('Belum ada data nilai peserta yang selesai ujian pada filter saat ini untuk diekspor.');
      return;
    }
    CBTExportService.exportToPdf(selectedExam, filteredCompletedSubmissions);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Top Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
            Rekapitulasi Nilai &amp; Laporan Administrasi Sekolah
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Penilaian otomatis, daftar peserta tersinkron otomatis dengan kelas ujian, serta ekspor resmi Excel dan PDF Berita Acara Ujian.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* List Box 1: Pilih Ujian (Hanya Ujian Terjadwal) */}
          <select
            value={selectedExam?.id || ''}
            onChange={(e) => {
              setSelectedExamId(e.target.value);
              setFilterClass('all');
              setFilterStudentId('all');
            }}
            className="text-xs sm:text-sm px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white max-w-xs sm:max-w-sm"
          >
            {orderedExams.length === 0 ? (
              <option value="">Belum ada ujian yang dijadwalkan</option>
            ) : (
              orderedExams.map(ex => {
                const meta = scheduledExamMeta.get(ex.id);
                const norm = CBTStorageService.normalizeClassName;
                const subCount = allSubmissions.filter(s => {
                  if (s.examId !== ex.id) return false;
                  if (meta && meta.targetClassNorms.size > 0) {
                    return meta.targetClassNorms.has(norm(s.className));
                  }
                  return true;
                }).length;
                const displayTitle = meta?.titleOverride || ex.title;
                const classLabel =
                  meta && meta.targetClasses.length > 0
                    ? meta.targetClasses.join(', ')
                    : ex.gradeLevel;
                return (
                  <option key={ex.id} value={ex.id}>
                    {displayTitle} ({classLabel} · {subCount} Selesai)
                  </option>
                );
              })
            )}
          </select>

          <button
            type="button"
            onClick={() => {
              refreshAllData();
              showNotice('Daftar peserta dan rekap nilai berhasil diperbarui otomatis.');
            }}
            className="px-3 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5"
            title="Segarkan data peserta & nilai terbaru"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Segarkan</span>
          </button>

          {/* Export Buttons */}
          <button
            type="button"
            onClick={handleExportExcel}
            className="px-3.5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs sm:text-sm font-semibold transition-colors flex items-center gap-2 shadow-xs"
            title="Download Rekap Nilai ke format Excel (.xlsx)"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>Ekspor Excel (.xlsx)</span>
          </button>

          <button
            type="button"
            onClick={handleExportPdf}
            className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs sm:text-sm font-semibold transition-colors flex items-center gap-2 shadow-xs"
            title="Download Berita Acara Ujian ke PDF Resmi"
          >
            <FileText className="w-4 h-4" />
            <span>Ekspor PDF (Berita Acara)</span>
          </button>
        </div>
      </div>

      {noticeMessage && (
        <div className="mb-5 p-3 rounded-xl bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800 text-xs font-medium text-amber-800 dark:text-amber-200 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
          <span>{noticeMessage}</span>
        </div>
      )}

      {/* KPI Cards Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xs">
          <span className="text-xs text-slate-500 block mb-1">Rata-Rata Nilai</span>
          <div className="text-2xl sm:text-3xl font-bold font-mono text-indigo-600 dark:text-indigo-400">
            {avgScore}
          </div>
          <span className="text-[11px] text-slate-400 mt-1 block">
            Standar KKM: {selectedExam?.kkm ?? 75}
          </span>
        </div>

        <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xs">
          <span className="text-xs text-slate-500 block mb-1">Tingkat Kelulusan (KKM)</span>
          <div className="text-2xl sm:text-3xl font-bold font-mono text-emerald-600 dark:text-emerald-400">
            {passRate}%
          </div>
          <span className="text-[11px] text-emerald-600 dark:text-emerald-400 mt-1 block">
            {passedStudents} Tuntas / {failedStudents} Remedial
          </span>
        </div>

        <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xs">
          <span className="text-xs text-slate-500 block mb-1">Nilai Tertinggi</span>
          <div className="text-2xl sm:text-3xl font-bold font-mono text-slate-900 dark:text-white">
            {maxScore}
          </div>
          <span className="text-[11px] text-slate-400 mt-1 block">
            Skor Maksimal 100
          </span>
        </div>

        <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xs">
          <span className="text-xs text-slate-500 block mb-1">Nilai Terendah</span>
          <div className="text-2xl sm:text-3xl font-bold font-mono text-amber-600 dark:text-amber-400">
            {minScore}
          </div>
          <span className="text-[11px] text-slate-400 mt-1 block">
            Selesai: {totalCompleted} / {filteredRows.length} Peserta
          </span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 mb-4 border-b border-slate-200 dark:border-slate-800 pb-2">
        <button
          onClick={() => setActiveTab('students')}
          className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${
            activeTab === 'students'
              ? 'bg-indigo-600 text-white'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          Daftar Rekap Nilai Peserta ({filteredRows.length})
        </button>
        <button
          onClick={() => setActiveTab('analysis')}
          className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${
            activeTab === 'analysis'
              ? 'bg-indigo-600 text-white'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          Analisis Butir Soal (Item Analysis)
        </button>
      </div>

      {activeTab === 'students' ? (
        /* Students Table */
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xs overflow-hidden">
          {/* Dynamic Filters: Search + Class List Box + Student List Box */}
          <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2 flex-1 min-w-[200px]">
              <Search className="w-4 h-4 text-slate-400 shrink-0" />
              <input
                type="text"
                placeholder="Cari berdasarkan nama, NIS, atau NISN..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full text-xs px-2.5 py-1.5 bg-slate-50 dark:bg-slate-800 rounded-md border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-hidden"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {/* List Box 2: Kelas yang Mengikuti Ujian */}
              <select
                value={filterClass}
                onChange={(e) => {
                  setFilterClass(e.target.value);
                  setFilterStudentId('all');
                }}
                aria-label="Filter Kelas Peserta Ujian"
                className="text-xs px-2.5 py-1.5 bg-slate-50 dark:bg-slate-800 rounded-md border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 font-medium"
              >
                <option value="all">
                  Semua Kelas ({participantRows.length} Peserta)
                </option>
                {availableClasses.map(c => (
                  <option key={c.key} value={c.key}>
                    {c.label} ({c.submittedCount}/{c.count} Selesai)
                  </option>
                ))}
              </select>

              {/* List Box 3: Daftar Siswa yang Mengikuti Ujian */}
              <div className="flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <select
                  value={filterStudentId}
                  onChange={(e) => setFilterStudentId(e.target.value)}
                  aria-label="Filter Nama Siswa Peserta Ujian"
                  className="text-xs px-2.5 py-1.5 bg-slate-50 dark:bg-slate-800 rounded-md border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 max-w-[240px]"
                >
                  <option value="all">
                    Semua Siswa ({classScopedParticipants.length})
                  </option>
                  {classScopedParticipants.map(p => (
                    <option key={p.rowKey} value={p.studentId}>
                      {p.studentName} — {p.className} ({p.nis !== '-' ? p.nis : p.nisn})
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/70 text-slate-600 dark:text-slate-300 font-semibold border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="py-3 px-3 text-center">No</th>
                  <SortableTh
                    label="NIS / NISN"
                    sortKey="nis"
                    sortState={studentSort}
                    onSort={(key) => setStudentSort(prev => toggleSortState(prev, key))}
                    className="py-3 px-3"
                  />
                  <SortableTh
                    label="Nama Lengkap Peserta"
                    sortKey="studentName"
                    sortState={studentSort}
                    onSort={(key) => setStudentSort(prev => toggleSortState(prev, key))}
                    className="py-3 px-3"
                  />
                  <SortableTh
                    label="Kelas"
                    sortKey="className"
                    sortState={studentSort}
                    onSort={(key) => setStudentSort(prev => toggleSortState(prev, key))}
                    className="py-3 px-3"
                  />
                  <SortableTh
                    label="Benar"
                    sortKey="correctCount"
                    sortState={studentSort}
                    onSort={(key) => setStudentSort(prev => toggleSortState(prev, key))}
                    align="center"
                    className="py-3 px-3"
                  />
                  <SortableTh
                    label="Salah"
                    sortKey="incorrectCount"
                    sortState={studentSort}
                    onSort={(key) => setStudentSort(prev => toggleSortState(prev, key))}
                    align="center"
                    className="py-3 px-3"
                  />
                  <SortableTh
                    label="Kosong"
                    sortKey="emptyCount"
                    sortState={studentSort}
                    onSort={(key) => setStudentSort(prev => toggleSortState(prev, key))}
                    align="center"
                    className="py-3 px-3"
                  />
                  <SortableTh
                    label="Pelanggaran"
                    sortKey="infractionsCount"
                    sortState={studentSort}
                    onSort={(key) => setStudentSort(prev => toggleSortState(prev, key))}
                    align="center"
                    className="py-3 px-3"
                  />
                  <SortableTh
                    label="Nilai Akhir"
                    sortKey="percentage"
                    sortState={studentSort}
                    onSort={(key) => setStudentSort(prev => toggleSortState(prev, key))}
                    align="center"
                    className="py-3 px-3"
                  />
                  <SortableTh
                    label="Status"
                    sortKey="status"
                    sortState={studentSort}
                    onSort={(key) => setStudentSort(prev => toggleSortState(prev, key))}
                    align="center"
                    className="py-3 px-3"
                  />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {sortedRows.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="py-8 text-center text-slate-400">
                      Tidak ada peserta atau rekaman nilai yang sesuai dengan filter ujian/kelas ini.
                    </td>
                  </tr>
                ) : (
                  sortedRows.map((row, idx) => {
                    const sub = row.submission;
                    return (
                      <tr key={row.rowKey} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                        <td className="py-2.5 px-3 text-center font-mono text-slate-400">
                          {idx + 1}
                        </td>
                        <td className="py-2.5 px-3 font-mono text-slate-700 dark:text-slate-300">
                          {row.nis !== '-' && (
                            <div className="font-semibold text-indigo-600 dark:text-indigo-400">
                              {row.nis}
                            </div>
                          )}
                          <div className="text-[11px] text-slate-500">{row.nisn}</div>
                        </td>
                        <td className="py-2.5 px-3 font-semibold text-slate-900 dark:text-white">
                          {row.studentName}
                        </td>
                        <td className="py-2.5 px-3 text-slate-600 dark:text-slate-300">
                          {row.className}
                        </td>
                        <td className="py-2.5 px-3 text-center font-mono text-emerald-600 dark:text-emerald-400 font-bold">
                          {sub ? sub.correctCount : '-'}
                        </td>
                        <td className="py-2.5 px-3 text-center font-mono text-red-600 dark:text-red-400">
                          {sub ? sub.incorrectCount : '-'}
                        </td>
                        <td className="py-2.5 px-3 text-center font-mono text-slate-400">
                          {sub ? sub.emptyCount : '-'}
                        </td>
                        <td className="py-2.5 px-3 text-center font-mono">
                          {sub ? (
                            sub.infractionsCount > 0 ? (
                              <span className="text-red-600 dark:text-red-400 font-bold">
                                {sub.infractionsCount}x
                              </span>
                            ) : (
                              <span className="text-slate-400">0</span>
                            )
                          ) : (
                            <span className="text-slate-400">-</span>
                          )}
                        </td>
                        <td className="py-2.5 px-3 text-center font-mono font-bold text-sm text-slate-900 dark:text-white">
                          {sub ? sub.percentage : '-'}
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          {sub ? (
                            <span
                              className={`text-[11px] font-semibold px-2 py-0.5 rounded ${
                                sub.isPassed
                                  ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300'
                                  : 'bg-red-50 text-red-700 dark:bg-red-950/60 dark:text-red-300'
                              }`}
                            >
                              {sub.isPassed ? 'TUNTAS' : 'BELUM TUNTAS'}
                            </span>
                          ) : row.examStatus === 'in_progress' ? (
                            <span className="text-[11px] font-semibold px-2 py-0.5 rounded bg-sky-50 text-sky-700 dark:bg-sky-950/60 dark:text-sky-300">
                              MENGERJAKAN
                            </span>
                          ) : (
                            <span className="text-[11px] font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400">
                              BELUM UJIAN
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* Item Analysis Table */
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-200 dark:border-slate-800">
            <h2 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
              Analisis Butir Soal (Tingkat Kesukaran &amp; Daya Pembeda)
            </h2>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Standar psikometrik evaluasi pembelajaran madrasah/sekolah: P &gt; 70% (Mudah), 35-70% (Sedang), &lt; 35% (Sukar).
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/70 text-slate-600 dark:text-slate-300 font-semibold border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <SortableTh
                    label="No Soal"
                    sortKey="questionNumber"
                    sortState={analysisSort}
                    onSort={(key) => setAnalysisSort(prev => toggleSortState(prev, key))}
                    align="center"
                    className="py-3 px-3"
                  />
                  <SortableTh
                    label="Tingkat Kesukaran"
                    sortKey="difficulty"
                    sortState={analysisSort}
                    onSort={(key) => setAnalysisSort(prev => toggleSortState(prev, key))}
                    align="center"
                    className="py-3 px-3"
                  />
                  <SortableTh
                    label="% Jawaban Benar"
                    sortKey="correctPercentage"
                    sortState={analysisSort}
                    onSort={(key) => setAnalysisSort(prev => toggleSortState(prev, key))}
                    align="center"
                    className="py-3 px-3"
                  />
                  <SortableTh
                    label="Daya Pembeda (D)"
                    sortKey="discriminatingPower"
                    sortState={analysisSort}
                    onSort={(key) => setAnalysisSort(prev => toggleSortState(prev, key))}
                    align="center"
                    className="py-3 px-3"
                  />
                  <SortableTh
                    label="Pilihan A"
                    sortKey="optA"
                    sortState={analysisSort}
                    onSort={(key) => setAnalysisSort(prev => toggleSortState(prev, key))}
                    align="center"
                    className="py-3 px-3"
                  />
                  <SortableTh
                    label="Pilihan B"
                    sortState={analysisSort}
                    sortKey="optB"
                    onSort={(key) => setAnalysisSort(prev => toggleSortState(prev, key))}
                    align="center"
                    className="py-3 px-3"
                  />
                  <SortableTh
                    label="Pilihan C"
                    sortKey="optC"
                    sortState={analysisSort}
                    onSort={(key) => setAnalysisSort(prev => toggleSortState(prev, key))}
                    align="center"
                    className="py-3 px-3"
                  />
                  <SortableTh
                    label="Pilihan D"
                    sortKey="optD"
                    sortState={analysisSort}
                    onSort={(key) => setAnalysisSort(prev => toggleSortState(prev, key))}
                    align="center"
                    className="py-3 px-3"
                  />
                  <SortableTh
                    label="Pilihan E"
                    sortKey="optE"
                    sortState={analysisSort}
                    onSort={(key) => setAnalysisSort(prev => toggleSortState(prev, key))}
                    align="center"
                    className="py-3 px-3"
                  />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {sortedItemAnalysis.map((ia) => (
                  <tr key={ia.questionId} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                    <td className="py-3 px-3 text-center font-bold text-slate-900 dark:text-white">
                      Soal {ia.questionNumber}
                    </td>
                    <td className="py-3 px-3 text-center">
                      <span
                        className={`text-[11px] font-semibold px-2 py-0.5 rounded ${
                          ia.difficulty === 'Mudah'
                            ? 'bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300'
                            : ia.difficulty === 'Sedang'
                            ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                            : 'bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300'
                        }`}
                      >
                        {ia.difficulty}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-center font-mono font-bold text-slate-800 dark:text-slate-200">
                      {ia.correctPercentage}%
                    </td>
                    <td className="py-3 px-3 text-center font-mono font-semibold text-slate-600 dark:text-slate-300">
                      {ia.discriminatingPower}
                    </td>
                    <td className="py-3 px-3 text-center font-mono text-slate-600 dark:text-slate-400">
                      {ia.optionDistribution['A'] || 0}
                    </td>
                    <td className="py-3 px-3 text-center font-mono text-slate-600 dark:text-slate-400">
                      {ia.optionDistribution['B'] || 0}
                    </td>
                    <td className="py-3 px-3 text-center font-mono text-slate-600 dark:text-slate-400">
                      {ia.optionDistribution['C'] || 0}
                    </td>
                    <td className="py-3 px-3 text-center font-mono text-slate-600 dark:text-slate-400">
                      {ia.optionDistribution['D'] || 0}
                    </td>
                    <td className="py-3 px-3 text-center font-mono text-slate-600 dark:text-slate-400">
                      {ia.optionDistribution['E'] || 0}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
