/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type UserRole = 'admin' | 'guru' | 'siswa';

export interface AuthUser {
  role: UserRole;
  id: string;
  name: string;
  username?: string;
  nis?: string;
  subject?: string;
  student?: Student;
}

export interface AppBrandingSettings {
  title1: string; // Header Kop Baris 1 (e.g. "KEMENTERIAN AGAMA REPUBLIK INDONESIA")
  title2: string; // Nama Madrasah / Sekolah (e.g. "MAN 1 INSAN CENDEKIA")
  title3: string; // Subjudul Aplikasi (e.g. "SISTEM CBT ONLINE & ASESMEN DIGITAL")
  logoUrl?: string;
  adminUsername?: string;
  adminPassword?: string;
}

export interface StudentClass {
  id: string;
  name: string; // e.g. "XII MIPA 1"
  gradeLevel: string; // e.g. "Kelas XII"
  academicYear: string;
}

export interface ExamActivity {
  id: string;
  code: string; // e.g. "ASAJ", "PTS", "PAS", "UM", "ANBK"
  name: string; // e.g. "Asesmen Sumatif Akhir Jenjang (ASAJ)"
  description?: string;
}

export interface Subject {
  id: string;
  code: string; // e.g. "MAT-PEM", "FIS", "KIM", "BIO"
  name: string; // e.g. "Matematika Peminatan"
  category?: string; // e.g. "MIPA", "Umum", "Keagamaan"
}

export interface ExamSchedule {
  id: string;
  examId: string;
  activityId: string;
  activityName: string;
  subjectId: string;
  subjectName: string;
  materialTheme?: string;
  dayName: string; // e.g. "Senin"
  examDate: string; // e.g. "2026-11-17"
  startTime: string; // e.g. "07:30"
  endTime: string; // e.g. "09:00"
  durationMinutes: number;
  targetClasses: string[]; // e.g. ['XII MIPA 1', 'XII MIPA 2']
  token: string;
  teacherName: string;
  status: 'scheduled' | 'in_progress' | 'completed';
}

export type QuestionType = 'single_choice' | 'multiple_choice' | 'true_false' | 'short_answer' | 'essay';

export interface EssayQuestionOptions {
  inputMode: 'short' | 'long';
  matchMode: 'contains' | 'exact' | 'manual';
}

export interface QuestionOption {
  id: string;
  label: string; // 'A', 'B', 'C', 'D', 'E' or '1', '2', ... for essay key alternatives
  text: string;
  formulaLatex?: string;
}

export interface Question {
  id: string;
  examId: string;
  number: number;
  type: QuestionType;
  questionText: string;
  imageUrl?: string;
  formulaLatex?: string;
  options: QuestionOption[];
  correctAnswer: string | string[]; // Option ID, array of IDs (MCMA), or accepted essay answer(s)
  essayOptions?: EssayQuestionOptions;
  explanation?: string;
  points: number;
}

export interface Exam {
  id: string;
  code: string;
  title: string;
  subject: string;
  gradeLevel: string; // e.g. "Kelas XII - MIPA"
  academicYear: string; // e.g. "2025/2026"
  schoolName: string;
  durationMinutes: number;
  token: string;
  kkm: number; // Kriteria Ketuntasan Minimal (e.g. 75)
  instructions: string[];
  randomizeQuestions: boolean;
  randomizeOptions: boolean;
  totalQuestions: number;
  status: 'draft' | 'active' | 'completed';
  createdAt: string;
}

export interface Student {
  id: string;
  nis: string; // Nomor Induk Siswa (e.g. "20241001")
  nisn: string; // Nomor Induk Siswa Nasional (e.g. "0067829101")
  name: string;
  className: string;
  room: string;
  avatarUrl?: string;
  gender: 'Laki-laki' | 'Perempuan';
}

export interface Teacher {
  id: string;
  nip: string; // Nomor Induk Pegawai / NUPTK
  name: string; // Nama Lengkap beserta gelar
  subject: string; // Mata pelajaran yang diampu
  gender: 'Laki-laki' | 'Perempuan';
  username: string; // Username login guru
  password?: string; // Custom password
  email?: string;
  phone?: string;
}

export interface StudentAnswer {
  questionId: string;
  selectedOption: string | string[]; // Option ID(s)
  isDoubtful: boolean; // Ragu-ragu
  answeredAt: number;
}

export interface InfractionLog {
  id: string;
  timestamp: number;
  type: 'tab_switch' | 'exit_fullscreen' | 'copy_attempt' | 'window_blur';
  message: string;
}

export interface Submission {
  id: string;
  examId: string;
  studentId: string;
  studentName: string;
  className: string;
  nisn: string;
  room: string;
  answers: Record<string, StudentAnswer>;
  score: number;
  maxScore: number;
  percentage: number;
  isPassed: boolean;
  correctCount: number;
  incorrectCount: number;
  emptyCount: number;
  doubtfulCount: number;
  startedAt: number;
  finishedAt?: number;
  durationSecondsUsed: number;
  status: 'in_progress' | 'completed' | 'terminated';
  infractionsCount: number;
  infractionLogs: InfractionLog[];
  syncStatus: 'synced' | 'pending' | 'failed';
  lastSyncedAt?: number;
}

export interface SupabaseConfig {
  url: string;
  anonKey: string;
  isConnected: boolean;
  autoSyncIntervalSec: number;
  batchSize: number;
}

export type SyncActionType =
  | 'save_answer'
  | 'submit_exam'
  | 'log_infraction'
  | 'upsert_branding'
  | 'upsert_token'
  | 'upsert_class'
  | 'delete_class'
  | 'upsert_activity'
  | 'delete_activity'
  | 'upsert_subject'
  | 'delete_subject'
  | 'upsert_teacher'
  | 'delete_teacher'
  | 'import_teachers'
  | 'upsert_student'
  | 'delete_student'
  | 'import_students'
  | 'upsert_exam'
  | 'delete_exam'
  | 'upsert_question'
  | 'delete_question'
  | 'import_questions'
  | 'upsert_schedule'
  | 'delete_schedule';

export interface SyncQueueItem {
  id: string;
  action: SyncActionType;
  entityKey?: string;
  examId: string;
  studentId: string;
  payload: any;
  retryCount: number;
  timestamp: number;
}

export interface ItemAnalysis {
  questionNumber: number;
  questionId: string;
  type: QuestionType;
  difficulty: 'Mudah' | 'Sedang' | 'Sukar';
  correctPercentage: number;
  totalAnswered: number;
  optionDistribution: Record<string, number>;
  discriminatingPower: number; // Daya pembeda
}
