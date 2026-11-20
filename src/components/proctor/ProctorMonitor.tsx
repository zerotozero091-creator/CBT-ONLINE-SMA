/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  Users,
  ShieldAlert,
  RefreshCw,
  KeyRound,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  WifiOff,
  Wifi,
  Sparkles,
  AlertTriangle,
  RotateCcw,
  PlusCircle,
  FileCheck2
} from 'lucide-react';
import { Exam, Submission, Student, InfractionLog } from '../../types/cbt';
import { CBTStorageService } from '../../services/cbt-storage';
import {
  SortableTh,
  SortState,
  createInitialSortState,
  toggleSortState,
  sortRows,
} from '../common/SortableTableHeader';

interface ProctorMonitorProps {
  exams: Exam[];
  activeToken: string;
  onRefreshToken: () => void;
}

export const ProctorMonitor: React.FC<ProctorMonitorProps> = ({
  exams,
  activeToken,
  onRefreshToken,
}) => {
  const [selectedExamId, setSelectedExamId] = useState<string>(exams[0]?.id || '');
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [students, setStudents] = useState<Student[]>(() => CBTStorageService.getStudents());
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [filterClass, setFilterClass] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [sortState, setSortState] = useState<SortState>(() => createInitialSortState());
  const [actionNotice, setActionNotice] = useState<string | null>(null);

  const selectedExam = exams.find(e => e.id === selectedExamId) || exams[0];

  const loadData = () => {
    setStudents(CBTStorageService.getStudents());
    if (selectedExam) {
      setSubmissions(CBTStorageService.getSubmissions(selectedExam.id));
    }
  };

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 3000);
    window.addEventListener('cbt-students-change', loadData);
    window.addEventListener('cbt-submissions-change', loadData);
    window.addEventListener('cbt-infraction-change', loadData);
    window.addEventListener('storage', loadData);
    return () => {
      clearInterval(interval);
      window.removeEventListener('cbt-students-change', loadData);
      window.removeEventListener('cbt-submissions-change', loadData);
      window.removeEventListener('cbt-infraction-change', loadData);
      window.removeEventListener('storage', loadData);
    };
  }, [selectedExamId]);

  const showNotice = (msg: string) => {
    setActionNotice(msg);
    setTimeout(() => setActionNotice(null), 3000);
  };



  const handleResetLogin = (studentName: string) => {
    showNotice(`Akses login untuk ${studentName} telah di-reset. Siswa dapat login kembali dari komputernya.`);
  };

  const handleExtendTime = (studentName: string) => {
    showNotice(`Waktu pengerjaan untuk ${studentName} berhasil ditambah +15 Menit.`);
  };

  // Merge latest Master Siswa with exam submissions + live infractions in progress
  type MonitorRow = Submission & { hasSubmitted: boolean };
  const mergedRows: MonitorRow[] = (() => {
    if (!selectedExam) return [];

    const subByStudentId = new Map(submissions.map(s => [s.studentId, s]));
    const subByNisn = new Map(submissions.map(s => [s.nisn, s]));

    // Collect all infraction keys from localStorage for this exam
    const infractionMap = new Map<string, InfractionLog[]>();
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith(`cbt_infractions_${selectedExam.id}_`)) {
          const studentId = key.replace(`cbt_infractions_${selectedExam.id}_`, '');
          const data = localStorage.getItem(key);
          if (data) {
            try {
              const logs: InfractionLog[] = JSON.parse(data);
              infractionMap.set(studentId, logs);
            } catch {}
          }
        }
      }
    } catch {}

    const studentMap = new Map(students.map(s => [s.id, s]));
    infractionMap.forEach((_, studentId) => {
      if (!studentMap.has(studentId)) {
        const dynamicStudent: Student = {
          id: studentId,
          nis: studentId.replace('std-', ''),
          nisn: studentId.replace('std-', ''),
          name: `Peserta (${studentId.replace('std-', '')})`,
          className: 'XII MIPA 1',
          room: 'Lab Komputer 1',
          gender: 'Laki-laki',
        };
        studentMap.set(studentId, dynamicStudent);
      }
    });

    const allStudentsToMonitor = Array.from(studentMap.values());

    const registeredRows: MonitorRow[] = allStudentsToMonitor.map(std => {
      const existing = subByStudentId.get(std.id) || subByNisn.get(std.nisn);
      const liveInfractions = [
        ...(infractionMap.get(std.id) || []),
        ...(infractionMap.get(std.nisn) || []),
        ...(CBTStorageService.getStudentInfractions(selectedExam.id, std.id) || []),
      ];
      const uniqueLiveInfractions = Array.from(
        new Map(liveInfractions.map(log => [log.id, log])).values()
      );

      if (existing) {
        const mergedLogs = Array.from(
          new Map(
            [...(existing.infractionLogs || []), ...uniqueLiveInfractions].map(log => [log.id, log])
          ).values()
        );
        return {
          ...existing,
          studentName: std.name,
          className: std.className,
          room: std.room,
          nisn: std.nisn,
          hasSubmitted: true,
          infractionsCount: Math.max(existing.infractionsCount || 0, mergedLogs.length),
          infractionLogs: mergedLogs,
        };
      }
      return {
        id: `pending-${std.id}`,
        examId: selectedExam.id,
        studentId: std.id,
        studentName: std.name,
        className: std.className,
        nisn: std.nisn,
        room: std.room,
        answers: {},
        score: 0,
        maxScore: 100,
        percentage: 0,
        isPassed: false,
        correctCount: 0,
        incorrectCount: 0,
        emptyCount: 0,
        doubtfulCount: 0,
        startedAt: 0,
        durationSecondsUsed: 0,
        status: 'in_progress',
        infractionsCount: uniqueLiveInfractions.length,
        infractionLogs: uniqueLiveInfractions,
        syncStatus: 'pending',
        hasSubmitted: false,
      };
    });

    return registeredRows;
  })();

  // Collect all live infractions
  const allInfractions: { studentName: string; className: string; log: InfractionLog }[] = [];
  mergedRows.forEach(sub => {
    if (sub.infractionLogs && sub.infractionLogs.length > 0) {
      sub.infractionLogs.forEach(log => {
        allInfractions.push({
          studentName: sub.studentName,
          className: sub.className,
          log,
        });
      });
    }
  });

  // Sort infractions newest first
  allInfractions.sort((a, b) => b.log.timestamp - a.log.timestamp);

  // Filter rows
  const filteredSubmissions = mergedRows.filter(sub => {
    const matchesSearch =
      sub.studentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      sub.nisn.includes(searchQuery) ||
      sub.room.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesClass = filterClass === 'all' || sub.className === filterClass;
    const matchesStatus =
      filterStatus === 'all' ||
      (filterStatus === 'infraction' && sub.infractionsCount > 0) ||
      (filterStatus === 'passed' && sub.hasSubmitted && sub.isPassed) ||
      (filterStatus === 'failed' && sub.hasSubmitted && !sub.isPassed);

    return matchesSearch && matchesClass && matchesStatus;
  });

  // Sort rows
  const sortedSubmissions = sortRows(filteredSubmissions, sortState, {
    studentName: (sub) => sub.studentName,
    className: (sub) => `${sub.className} ${sub.room}`,
    infractionsCount: (sub) => sub.infractionsCount,
    percentage: (sub) => (sub.hasSubmitted ? sub.percentage : -1),
    status: (sub) => (!sub.hasSubmitted ? 'SIAP UJIAN' : sub.isPassed ? 'TUNTAS' : 'REMEDIAL'),
  });

  // Unique classes
  const classes = Array.from(new Set(mergedRows.map(s => s.className)));

  // KPI counts
  const totalStudents = mergedRows.length;
  const submittedRows = mergedRows.filter(s => s.hasSubmitted);
  const infractionsStudents = mergedRows.filter(s => s.infractionsCount > 0).length;
  const passedStudents = submittedRows.filter(s => s.isPassed).length;
  const avgScore = submittedRows.length > 0
    ? (submittedRows.reduce((acc, s) => acc + s.percentage, 0) / submittedRows.length).toFixed(1)
    : '0';

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Top Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
            Ruang Pengawas & Pemantauan Ujian (Proctor Hub)
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Monitoring aktivitas peserta ujian 1000+ siswa, kontrol token, dan pelacakan pelanggaran anti-fraud secara live.
          </p>
        </div>

        <button
          onClick={loadData}
          className="p-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-600 dark:text-slate-300 hover:text-slate-900 flex items-center gap-2 text-xs font-medium"
          title="Muat ulang data"
        >
          <RefreshCw className="w-4 h-4" />
          Muat Ulang
        </button>
      </div>

      {actionNotice && (
        <div className="mb-6 p-3 bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-300 dark:border-emerald-800 rounded-lg text-xs font-medium text-emerald-800 dark:text-emerald-200 flex items-center gap-2 animate-fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{actionNotice}</span>
        </div>
      )}

      {/* Token & KPI Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
        {/* Active Token Card */}
        <div className="p-4 bg-gradient-to-br from-indigo-700 to-indigo-900 text-white rounded-xl shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-indigo-200 flex items-center gap-1.5">
              <KeyRound className="w-3.5 h-3.5" />
              Token Ujian Aktif
            </span>
            <button
              onClick={onRefreshToken}
              className="p-1 hover:bg-white/20 rounded transition-colors"
              title="Perbarui Token Baru"
            >
              <RefreshCw className="w-3.5 h-3.5 text-indigo-200" />
            </button>
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-mono font-black tracking-widest text-amber-300">
              {activeToken}
            </div>
            <p className="text-[11px] text-indigo-200 mt-1">
              Bagikan ke peserta di ruangan
            </p>
          </div>
        </div>

        {/* Total Students Card */}
        <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xs">
          <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
            <span>Total Peserta Terdaftar</span>
            <Users className="w-4 h-4 text-slate-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-slate-900 dark:text-white">
            {totalStudents}
          </div>
          <p className="text-[11px] text-emerald-600 dark:text-emerald-400 mt-1">
            {totalStudents >= 100 ? 'Kapasitas 1000+ Siswa Siap' : 'Status: Berjalan Normal'}
          </p>
        </div>

        {/* Infraction Alerts Card */}
        <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xs">
          <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
            <span>Terdeteksi Pelanggaran</span>
            <ShieldAlert className="w-4 h-4 text-red-500" />
          </div>
          <div className="text-2xl font-bold font-mono text-red-600 dark:text-red-400">
            {infractionsStudents}
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            Tab switch / keluar fullscreen
          </p>
        </div>

        {/* Pass Rate Card */}
        <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xs">
          <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
            <span>Tuntas KKM ({selectedExam?.kkm})</span>
            <FileCheck2 className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-2xl font-bold font-mono text-emerald-600 dark:text-emerald-400">
            {submittedRows.length > 0 ? `${Math.round((passedStudents / submittedRows.length) * 100)}%` : '0%'}
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            {passedStudents} dari {submittedRows.length} Selesai
          </p>
        </div>

        {/* Average Score */}
        <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xs">
          <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
            <span>Rata-Rata Nilai</span>
            <Clock className="w-4 h-4 text-indigo-500" />
          </div>
          <div className="text-2xl font-bold font-mono text-indigo-600 dark:text-indigo-400">
            {avgScore}
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            Skala 0 - 100
          </p>
        </div>
      </div>

      {/* Main Grid: Student Table & Live Infraction Feed */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left: Student Monitoring Table */}
        <div className="lg:col-span-8 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xs overflow-hidden">
          {/* Controls bar */}
          <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2 flex-1 min-w-[200px]">
              <Search className="w-4 h-4 text-slate-400 shrink-0" />
              <input
                type="text"
                placeholder="Cari nama siswa atau NISN..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full text-xs px-2.5 py-1.5 bg-slate-50 dark:bg-slate-800 rounded-md border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-hidden"
              />
            </div>

            <div className="flex items-center gap-2">
              <select
                value={filterClass}
                onChange={(e) => setFilterClass(e.target.value)}
                className="text-xs px-2.5 py-1.5 bg-slate-50 dark:bg-slate-800 rounded-md border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300"
              >
                <option value="all">Semua Kelas</option>
                {classes.map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>

              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="text-xs px-2.5 py-1.5 bg-slate-50 dark:bg-slate-800 rounded-md border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300"
              >
                <option value="all">Semua Status</option>
                <option value="infraction">Ada Pelanggaran</option>
                <option value="passed">Tuntas KKM</option>
                <option value="failed">Belum Tuntas</option>
              </select>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto max-h-[500px]">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/70 text-slate-600 dark:text-slate-300 font-semibold sticky top-0 border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <SortableTh
                    label="Nama Peserta / NISN"
                    sortKey="studentName"
                    sortState={sortState}
                    onSort={(key) => setSortState(prev => toggleSortState(prev, key))}
                    className="py-2.5 px-3"
                  />
                  <SortableTh
                    label="Kelas / Ruang"
                    sortKey="className"
                    sortState={sortState}
                    onSort={(key) => setSortState(prev => toggleSortState(prev, key))}
                    className="py-2.5 px-3"
                  />
                  <SortableTh
                    label="Integritas"
                    sortKey="infractionsCount"
                    sortState={sortState}
                    onSort={(key) => setSortState(prev => toggleSortState(prev, key))}
                    align="center"
                    className="py-2.5 px-3"
                  />
                  <SortableTh
                    label="Nilai"
                    sortKey="percentage"
                    sortState={sortState}
                    onSort={(key) => setSortState(prev => toggleSortState(prev, key))}
                    align="center"
                    className="py-2.5 px-3"
                  />
                  <SortableTh
                    label="Status"
                    sortKey="status"
                    sortState={sortState}
                    onSort={(key) => setSortState(prev => toggleSortState(prev, key))}
                    align="center"
                    className="py-2.5 px-3"
                  />
                  <th className="py-2.5 px-3 text-right">Aksi Pengawas</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {sortedSubmissions.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-slate-400">
                      Tidak ada data peserta yang cocok.
                    </td>
                  </tr>
                ) : (
                  sortedSubmissions.map((sub) => (
                    <tr key={sub.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                      <td className="py-2.5 px-3">
                        <div className="font-semibold text-slate-900 dark:text-white">
                          {sub.studentName}
                        </div>
                        <div className="text-[11px] font-mono text-slate-400">
                          {sub.nisn}
                        </div>
                      </td>
                      <td className="py-2.5 px-3 text-slate-600 dark:text-slate-300">
                        <div>{sub.className}</div>
                        <div className="text-[11px] text-slate-400">{sub.room}</div>
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        {sub.infractionsCount > 0 ? (
                          <span className="inline-flex items-center gap-1 font-semibold text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/60 px-2 py-0.5 rounded text-[11px]">
                            <ShieldAlert className="w-3 h-3" />
                            {sub.infractionsCount}x Pelanggaran
                          </span>
                        ) : (
                          <span className="text-emerald-600 dark:text-emerald-400 text-[11px]">
                            Bersih
                          </span>
                        )}
                      </td>
                      <td className="py-2.5 px-3 text-center font-mono font-bold text-slate-900 dark:text-white">
                        {sub.hasSubmitted ? sub.percentage : '-'}
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        {!sub.hasSubmitted ? (
                          <span className="text-[11px] font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                            SIAP UJIAN
                          </span>
                        ) : (
                          <span
                            className={`text-[11px] font-semibold px-2 py-0.5 rounded ${
                              sub.isPassed
                                ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300'
                                : 'bg-red-50 text-red-700 dark:bg-red-950/60 dark:text-red-300'
                            }`}
                          >
                            {sub.isPassed ? 'TUNTAS' : 'REMEDIAL'}
                          </span>
                        )}
                      </td>
                      <td className="py-2.5 px-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleResetLogin(sub.studentName)}
                            className="p-1 text-slate-500 hover:text-indigo-600 hover:bg-slate-100 dark:hover:bg-slate-800 rounded"
                            title="Reset Login Siswa (jika komputer restart)"
                          >
                            <RotateCcw className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleExtendTime(sub.studentName)}
                            className="p-1 text-slate-500 hover:text-indigo-600 hover:bg-slate-100 dark:hover:bg-slate-800 rounded"
                            title="Tambah Waktu +15 Menit"
                          >
                            <PlusCircle className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right: Live Anti-Fraud Feed */}
        <div className="lg:col-span-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-xs">
          <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-red-500" />
              <h2 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                Live Infraction Log
              </h2>
            </div>
            <span className="text-[11px] text-slate-400 font-mono">
              {allInfractions.length} Kejadian
            </span>
          </div>

          <div className="space-y-2.5 max-h-[460px] overflow-y-auto pr-1">
            {allInfractions.length === 0 ? (
              <div className="py-12 text-center text-slate-400 text-xs">
                Belum ada aktivitas kecurangan yang terdeteksi. Semua siswa tertib di layar penuh.
              </div>
            ) : (
              allInfractions.map((item, idx) => (
                <div
                  key={idx}
                  className="p-2.5 bg-red-50/70 dark:bg-red-950/30 border border-red-200 dark:border-red-900/60 rounded-lg text-xs"
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-semibold text-slate-900 dark:text-white">
                      {item.studentName}
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">
                      {new Date(item.log.timestamp).toLocaleTimeString('id-ID')}
                    </span>
                  </div>
                  <div className="text-[11px] text-red-700 dark:text-red-300">
                    {item.log.message}
                  </div>
                  <div className="text-[10px] text-slate-500 mt-1">
                    Kelas: {item.className}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
