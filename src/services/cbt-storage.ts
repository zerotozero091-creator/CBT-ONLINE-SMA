/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  Exam,
  Question,
  Student,
  Submission,
  StudentAnswer,
  InfractionLog,
  SyncQueueItem,
  ItemAnalysis,
  AppBrandingSettings,
  StudentClass,
  ExamActivity,
  Subject,
  ExamSchedule,
  AuthUser,
  Teacher,
} from '../types/cbt';
import defaultSchoolSeal from '../assets/images/cbt_school_seal_1794586949675.jpg';

const LEGACY_DEFAULT_LOGO_PATH = '/src/assets/images/cbt_school_seal_1794586949675.jpg';
export const DEFAULT_SCHOOL_LOGO_URL = defaultSchoolSeal;

const STORAGE_KEYS = {
  EXAMS: 'cbt_exams_v1',
  QUESTIONS: 'cbt_questions_v1',
  STUDENTS: 'cbt_students_v1',
  TEACHERS: 'cbt_teachers_v1',
  SUBMISSIONS: 'cbt_submissions_v1',
  SYNC_QUEUE: 'cbt_sync_queue_v1',
  ACTIVE_TOKEN: 'cbt_active_token_v1',
  SIMULATED_OFFLINE: 'cbt_simulated_offline',
  CURRENT_STUDENT: 'cbt_current_session_student',
  BRANDING: 'cbt_branding_v1',
  CLASSES: 'cbt_classes_v1',
  ACTIVITIES: 'cbt_activities_v1',
  SUBJECTS: 'cbt_subjects_v1',
  SCHEDULES: 'cbt_schedules_v1',
  AUTH_USER: 'cbt_auth_user_v1',
};

export const INITIAL_TEACHERS: Teacher[] = [
  {
    id: 'tch-001',
    nip: '1978XXXXXXXX',
    name: 'Mr. xxxxxxxxxxx, S.Kom',
    subject: 'Matematika Peminatan',
    gender: 'Laki-laki',
    username: 'guru',
    email: 'xxxxxxxxxx@man1ic.sch.id',
    phone: '081xxxxxxxx',
  },
  {
    id: 'tch-002',
    nip: '1982xxxxxxxxxxxxx',
    name: 'Dra. xxxxxxxxxx',
    subject: 'Fisika Terapan & Mekanika',
    gender: 'Laki-laki',
    username: 'guru2',
    email: 'michaelxxxxx@man1ic.sch.id',
    phone: '081xxxxxxx',
  },
  {
    id: 'tch-003',
    nip: '1985xxxxxxxxx',
    name: 'Dr. Warbird',
    subject: 'Kimia Sains Terpadu',
    gender: 'Laki-laki',
    username: 'guru3',
    email: 'birdwar@man1ic.sch.id',
    phone: '081xxxxxxxx',
  },
  {
    id: 'tch-004',
    nip: '1985xxxxxxxxx',
    name: 'Thermal',
    subject: 'Kimia Sains Terpadu',
    gender: 'Laki-laki',
    username: 'guru4',
    email: 'thermal@man1ic.sch.id',
    phone: '081xxxxxxxxx',
  },
];

export const INITIAL_BRANDING: AppBrandingSettings = {
  title1: 'PEMERINTAH PROVINSI JAWA TENGAH',
  title2: 'SMA NEGERI 1 REMBANG',
  title3: 'SISTEM CBT ONLINE & ASESMEN DIGITAL MANDIRI',
  logoUrl: DEFAULT_SCHOOL_LOGO_URL,
  adminUsername: 'admin',
  adminPassword: 'admin',
};

export const INITIAL_CLASSES: StudentClass[] = [
  { id: 'cls-1', name: 'XII MIPA 1', gradeLevel: 'Kelas XII', academicYear: '2026/2027' },
  { id: 'cls-2', name: 'XII MIPA 2', gradeLevel: 'Kelas XII', academicYear: '2026/2027' },
  { id: 'cls-3', name: 'XII MIPA 3', gradeLevel: 'Kelas XII', academicYear: '2026/2027' },
  { id: 'cls-4', name: 'XII IPS 1', gradeLevel: 'Kelas XII', academicYear: '2026/2027' },
  { id: 'cls-5', name: 'XII IPS 2', gradeLevel: 'Kelas XII', academicYear: '2026/2027' },
  { id: 'cls-6', name: 'XI MIPA 1', gradeLevel: 'Kelas XI', academicYear: '2026/2027' },
  { id: 'cls-7', name: 'XI MIPA 2', gradeLevel: 'Kelas XI', academicYear: '2026/2027' },
];

export const INITIAL_ACTIVITIES: ExamActivity[] = [
  { id: 'act-1', code: 'ASAJ', name: 'Asesmen Sumatif Akhir Jenjang (ASAJ)', description: 'Ujian penentu kelulusan akhir jenjang kelas XII' },
  { id: 'act-2', code: 'PTS', name: 'Penilaian Tengah Semester (PTS)', description: 'Evaluasi capaian pembelajaran tengah semester' },
  { id: 'act-3', code: 'PAS', name: 'Penilaian Akhir Semester (PAS)', description: 'Evaluasi menyeluruh akhir semester' },
  { id: 'act-4', code: 'UM', name: 'Ujian Madrasah (UM)', description: 'Ujian standar madrasah kementerian agama' },
  { id: 'act-5', code: 'TO-ANBK', name: 'Try Out Simulasi ANBK', description: 'Simulasi asesmen nasional berbasis komputer' },
];

export const INITIAL_SUBJECTS: Subject[] = [
  { id: 'sbj-1', code: 'MAT-PEM', name: 'Matematika', category: 'MIPA' },
  { id: 'sbj-2', code: 'FIS', name: 'Fisika', category: 'MIPA' },
  { id: 'sbj-3', code: 'KIM', name: 'Kimia', category: 'MIPA' },
  { id: 'sbj-4', code: 'BIO', name: 'Biologi', category: 'MIPA' },
  { id: 'sbj-5', code: 'BINDO', name: 'Bahasa Indonesia', category: 'Umum' },
  { id: 'sbj-6', code: 'BING', name: 'Bahasa Inggris', category: 'Umum' },
  { id: 'sbj-7', code: 'INF', name: "Informatika", category: 'Umum' },
  { id: 'sbj-8', code: 'GEO', name: 'Geografi', category: 'IPS' },
];

export const INITIAL_SCHEDULES: ExamSchedule[] = [
  {
    id: 'sch-1',
    examId: 'exam-mat-xii',
    activityId: 'act-1',
    activityName: 'Asesmen Sumatif Akhir Jenjang (ASAJ)',
    subjectId: 'sbj-1',
    subjectName: 'Matematika',
    materialTheme: 'Limit Fungsi Aljabar, Turunan, & Integral Tentu',
    dayName: 'Senin',
    examDate: '2026-11-17',
    startTime: '07:30',
    endTime: '09:00',
    durationMinutes: 90,
    targetClasses: ['XII MIPA 1', 'XII MIPA 2', 'XII MIPA 3'],
    token: 'MADR26',
    teacherName: 'Thermal.',
    status: 'in_progress',
  },
  {
    id: 'sch-2',
    examId: 'exam-fis-xi',
    activityId: 'act-2',
    activityName: 'Penilaian Tengah Semester (PTS)',
    subjectId: 'sbj-2',
    subjectName: 'Fisika',
    materialTheme: 'Dinamika Partikel, Usaha, & Energi Kinetik',
    dayName: 'Selasa',
    examDate: '2026-11-18',
    startTime: '09:30',
    endTime: '10:30',
    durationMinutes: 60,
    targetClasses: ['XI MIPA 1', 'XI MIPA 2'],
    token: 'GARUDA',
    teacherName: 'Warbird.',
    status: 'scheduled',
  },
];

// Initial mock students with NIS and gender
export const INITIAL_STUDENTS: Student[] = [
  { id: 'std-001', nis: '20241001', nisn: '0067829101', name: 'Ahmad Faiz Al-Faruqi', className: 'XII MIPA 1', room: 'Lab Komputer 1', gender: 'Laki-laki' },
  { id: 'std-002', nis: '20241002', nisn: '0067829102', name: 'Nurul Aisyah Maharani', className: 'XII MIPA 1', room: 'Lab Komputer 1', gender: 'Perempuan' },
  { id: 'std-003', nis: '20241003', nisn: '0067829103', name: 'Muhammad Rizky Ramadhan', className: 'XII MIPA 1', room: 'Lab Komputer 1', gender: 'Laki-laki' },
  { id: 'std-004', nis: '20241004', nisn: '0067829104', name: 'Siti Zahra Khairunnisa', className: 'XII MIPA 2', room: 'Lab Komputer 2', gender: 'Perempuan' },
  { id: 'std-005', nis: '20241005', nisn: '0067829105', name: 'Fatih Dwi Anggoro', className: 'XII MIPA 2', room: 'Lab Komputer 2', gender: 'Laki-laki' },
  { id: 'std-006', nis: '20241006', nisn: '0067829106', name: 'Kayla Bilqis Syahida', className: 'XII MIPA 2', room: 'Lab Komputer 2', gender: 'Perempuan' },
  { id: 'std-007', nis: '20241007', nisn: '0067829107', name: 'Dimas Bagus Prasetyo', className: 'XII MIPA 3', room: 'Ruang Ujian A', gender: 'Laki-laki' },
  { id: 'std-008', nis: '20241008', nisn: '0067829108', name: 'Salma Putri Anindita', className: 'XII MIPA 3', room: 'Ruang Ujian A', gender: 'Perempuan' },
  { id: 'std-009', nis: '20241009', nisn: '0067829109', name: 'Farhan Aditya Pratama', className: 'XII MIPA 3', room: 'Ruang Ujian B', gender: 'Laki-laki' },
  { id: 'std-010', nis: '20241010', nisn: '0067829110', name: 'Zaskia Adya Mecca', className: 'XII MIPA 3', room: 'Ruang Ujian B', gender: 'Perempuan' },
];

// Initial seed exams
export const INITIAL_EXAMS: Exam[] = [
  {
    id: 'exam-mat-xii',
    code: 'MAT-XII-2026',
    title: 'Asesmen Sumatif Akhir Jenjang (ASAJ) Matematika Peminatan',
    subject: 'Matematika',
    gradeLevel: 'Kelas XII - MIPA',
    academicYear: '2025/2026',
    schoolName: 'SMA NEGERI 1 REMBANG',
    durationMinutes: 90,
    token: 'MADR26',
    kkm: 75,
    instructions: [
      'Periksa dan bacalah soal-soal dengan teliti sebelum Anda menjawabnya.',
      'Soal terdiri dari pilihan ganda yang memuat formula matematika dan sains.',
      'Paket soal telah diunduh ke perangkat Anda dan dapat dikerjakan secara offline.',
      'Dilarang membuka tab baru, minimize jendela ujian, atau keluar dari mode layar penuh.',
      'Sistem akan mencatat aktivitas mencurigakan dan melaporkannya secara otomatis ke pengawas.',
    ],
    randomizeQuestions: true,
    randomizeOptions: false,
    totalQuestions: 6,
    status: 'active',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'exam-fis-xi',
    code: 'FIS-XI-2026',
    title: 'Penilaian Tengah Semester (PTS) Fisika',
    subject: 'Fisika',
    gradeLevel: 'Kelas XI - MIPA',
    academicYear: '2025/2026',
    schoolName: 'SMA NEGERI 1 REMBANG',
    durationMinutes: 60,
    token: 'GARUDA',
    kkm: 75,
    instructions: [
      'Pastikan koneksi awal stabil untuk memuat bank soal.',
      'Gunakan tombol Ragu-Ragu jika belum yakin dengan jawaban Anda.',
      'Waktu akan terus berjalan secara presisi pada perangkat lokal.',
    ],
    randomizeQuestions: true,
    randomizeOptions: false,
    totalQuestions: 2,
    status: 'active',
    createdAt: new Date().toISOString(),
  },
];

export const INITIAL_QUESTIONS: Question[] = [
  // MATEMATIKA PEMINATAN
  {
    id: 'q-mat-1',
    examId: 'exam-mat-xii',
    number: 1,
    type: 'single_choice',
    questionText: 'Tentukan nilai limit fungsi trigonometri berikut:\n$$\\lim_{x \\to 0} \\frac{1 - \\cos 4x}{x \\sin 2x}$$',
    options: [
      { id: 'opt-1-a', label: 'A', text: '$2$' },
      { id: 'opt-1-b', label: 'B', text: '$4$' },
      { id: 'opt-1-c', label: 'C', text: '$8$' },
      { id: 'opt-1-d', label: 'D', text: '$\\frac{1}{2}$' },
      { id: 'opt-1-e', label: 'E', text: '$\\frac{1}{4}$' },
    ],
    correctAnswer: 'opt-1-b',
    explanation: 'Gunakan identitas trigonometri $1 - \\cos 4x = 2\\sin^2 2x$. Maka:\n$$\\lim_{x \\to 0} \\frac{2\\sin^2 2x}{x \\sin 2x} = \\lim_{x \\to 0} 2 \\cdot \\frac{\\sin 2x}{x} = 2 \\cdot 2 = 4$$',
    points: 16,
  },
  {
    id: 'q-mat-2',
    examId: 'exam-mat-xii',
    number: 2,
    type: 'single_choice',
    questionText: 'Hasil dari pengintegralan tentu berikut adalah:\n$$\\int_{1}^{3} (3x^2 - 4x + 2) \\, dx$$',
    options: [
      { id: 'opt-2-a', label: 'A', text: '$12$' },
      { id: 'opt-2-b', label: 'B', text: '$14$' },
      { id: 'opt-2-c', label: 'C', text: '$16$' },
      { id: 'opt-2-d', label: 'D', text: '$18$' },
      { id: 'opt-2-e', label: 'E', text: '$20$' },
    ],
    correctAnswer: 'opt-2-b',
    explanation: 'Antiturunan dari $3x^2 - 4x + 2$ adalah $F(x) = x^3 - 2x^2 + 2x$.\nHitung $F(3) = 27 - 18 + 6 = 15$.\nHitung $F(1) = 1 - 2 + 2 = 1$.\nMaka $F(3) - F(1) = 15 - 1 = 14$.',
    points: 16,
  },
  {
    id: 'q-mat-3',
    examId: 'exam-mat-xii',
    number: 3,
    type: 'single_choice',
    questionText: 'Jika diketahui matriks $A = \\begin{pmatrix} 3 & -2 \\\\ 4 & -1 \\end{pmatrix}$, maka nilai dari $\\det(A^{-1})$ adalah...',
    options: [
      { id: 'opt-3-a', label: 'A', text: '$\\frac{1}{5}$' },
      { id: 'opt-3-b', label: 'B', text: '$5$' },
      { id: 'opt-3-c', label: 'C', text: '$-\\frac{1}{5}$' },
      { id: 'opt-3-d', label: 'D', text: '$\\frac{1}{11}$' },
      { id: 'opt-3-e', label: 'E', text: '$-5$' },
    ],
    correctAnswer: 'opt-3-a',
    explanation: 'Determinan matriks $A$:\n$$\\det(A) = (3)(-1) - (-2)(4) = -3 + 8 = 5$$\nBerdasarkan sifat matriks, $\\det(A^{-1}) = \\frac{1}{\\det(A)} = \\frac{1}{5}$.',
    points: 17,
  },
  {
    id: 'q-mat-4',
    examId: 'exam-mat-xii',
    number: 4,
    type: 'single_choice',
    questionText: 'Turunan pertama dari fungsi $f(x) = \\sin^3(2x - \\pi)$ adalah $f\'(x)$. Nilai $f\'\\left(\\frac{\\pi}{4}\\right)$ adalah...',
    options: [
      { id: 'opt-4-a', label: 'A', text: '$0$' },
      { id: 'opt-4-b', label: 'B', text: '$-6$' },
      { id: 'opt-4-c', label: 'C', text: '$3$' },
      { id: 'opt-4-d', label: 'D', text: '$-3\\sqrt{2}$' },
      { id: 'opt-4-e', label: 'E', text: '$6$' },
    ],
    correctAnswer: 'opt-4-a',
    explanation: 'Turunan berantai: $f\'(x) = 3\\sin^2(2x - \\pi) \\cdot \\cos(2x - \\pi) \\cdot 2 = 6\\sin^2(2x - \\pi)\\cos(2x - \\pi)$.\nUntuk $x = \\frac{\\pi}{4}$, $2x - \\pi = -\\frac{\\pi}{2}$.\nKarena $\\cos\\left(-\\frac{\\pi}{2}\\right) = 0$, maka $f\'\\left(\\frac{\\pi}{4}\\right) = 0$.',
    points: 17,
  },
  {
    id: 'q-mat-5',
    examId: 'exam-mat-xii',
    number: 5,
    type: 'single_choice',
    questionText: 'Diketahui vektor $\\vec{u} = 2\\hat{i} - \\hat{j} + 3\\hat{k}$ dan $\\vec{v} = \\hat{i} + 3\\hat{j} - 2\\hat{k}$. Nilai perkalian skalar (dot product) $\\vec{u} \\cdot \\vec{v}$ adalah...',
    options: [
      { id: 'opt-5-a', label: 'A', text: '$-7$' },
      { id: 'opt-5-b', label: 'B', text: '$-5$' },
      { id: 'opt-5-c', label: 'C', text: '$5$' },
      { id: 'opt-5-d', label: 'D', text: '$7$' },
      { id: 'opt-5-e', label: 'E', text: '$11$' },
    ],
    correctAnswer: 'opt-5-a',
    explanation: 'Perkalian titik dua vektor:\n$$\\vec{u} \\cdot \\vec{v} = (2)(1) + (-1)(3) + (3)(-2) = 2 - 3 - 6 = -7$$',
    points: 17,
  },
  {
    id: 'q-mat-6',
    examId: 'exam-mat-xii',
    number: 6,
    type: 'single_choice',
    questionText: 'Persamaan lingkaran yang berpusat di titik $P(2, -3)$ dan menyinggung garis $3x - 4y + 7 = 0$ memiliki jari-jari $r$ sebesar...',
    options: [
      { id: 'opt-6-a', label: 'A', text: '$3$' },
      { id: 'opt-6-b', label: 'B', text: '$4$' },
      { id: 'opt-6-c', label: 'C', text: '$5$' },
      { id: 'opt-6-d', label: 'D', text: '$6$' },
      { id: 'opt-6-e', label: 'E', text: '$7$' },
    ],
    correctAnswer: 'opt-6-c',
    explanation: 'Jarak titik $(x_1, y_1)$ ke garis $Ax + By + C = 0$:\n$$r = \\frac{|Ax_1 + By_1 + C|}{\\sqrt{A^2 + B^2}} = \\frac{|3(2) - 4(-3) + 7|}{\\sqrt{3^2 + (-4)^2}} = \\frac{|6 + 12 + 7|}{\\sqrt{25}} = \\frac{25}{5} = 5$$',
    points: 17,
  },
  // FISIKA
  {
    id: 'q-fis-1',
    examId: 'exam-fis-xi',
    number: 1,
    type: 'single_choice',
    questionText: 'Sebuah mesin Carnot bekerja di antara suhu reservoir tinggi $T_1 = 600\\text{ K}$ dan reservoir rendah $T_2 = 400\\text{ K}$. Efisiensi termal mesin tersebut adalah:\n$$\\eta = \\left(1 - \\frac{T_2}{T_1}\\right) \\times 100\\%$$',
    options: [
      { id: 'opt-f1-a', label: 'A', text: '$25\\%$' },
      { id: 'opt-f1-b', label: 'B', text: '$33{,}3\\%$' },
      { id: 'opt-f1-c', label: 'C', text: '$40\\%$' },
      { id: 'opt-f1-d', label: 'D', text: '$50\\%$' },
      { id: 'opt-f1-e', label: 'E', text: '$66{,}7\\%$' },
    ],
    correctAnswer: 'opt-f1-b',
    explanation: '$\\eta = \\left(1 - \\frac{400}{600}\\right) \\times 100\\% = \\left(1 - \\frac{2}{3}\\right) \\times 100\\% = 33{,}33\\%$.',
    points: 20,
  },
  {
    id: 'q-fis-2',
    examId: 'exam-fis-xi',
    number: 2,
    type: 'single_choice',
    questionText: 'Dua buah muatan titik $q_1 = +2\\mu\\text{C}$ dan $q_2 = -4\\mu\\text{C}$ terpisah pada jarak $r = 30\\text{ cm}$ di udara ($k = 9 \\times 10^9\\text{ N}\\cdot\\text{m}^2/\\text{C}^2$). Besar gaya Coulomb antar muatan adalah:\n$$F = k \\frac{|q_1 q_2|}{r^2}$$',
    options: [
      { id: 'opt-f2-a', label: 'A', text: '$0{,}4\\text{ N}$' },
      { id: 'opt-f2-b', label: 'B', text: '$0{,}8\\text{ N}$' },
      { id: 'opt-f2-c', label: 'C', text: '$1{,}2\\text{ N}$' },
      { id: 'opt-f2-d', label: 'D', text: '$1{,}6\\text{ N}$' },
      { id: 'opt-f2-e', label: 'E', text: '$2{,}4\\text{ N}$' },
    ],
    correctAnswer: 'opt-f2-b',
    explanation: '$$F = 9\\times 10^9 \\cdot \\frac{(2\\times 10^{-6})(4\\times 10^{-6})}{(0{,}3)^2} = \\frac{72\\times 10^{-3}}{0{,}09} = 0{,}8\\text{ N}$$',
    points: 20,
  },
];

export class CBTStorageService {
  private static isInitialized = false;
  private static hasStorageListener = false;
  private static studentsCache: Student[] | null = null;
  private static studentNisMap: Map<string, Student> | null = null;
  private static teachersCache: Teacher[] | null = null;
  private static teacherUsernameMap: Map<string, Teacher> | null = null;

  private static invalidateStudentsCache(): void {
    this.studentsCache = null;
    this.studentNisMap = null;
  }

  private static invalidateTeachersCache(): void {
    this.teachersCache = null;
    this.teacherUsernameMap = null;
  }

  private static ensureStorageSyncListener(): void {
    if (this.hasStorageListener || typeof window === 'undefined') return;
    this.hasStorageListener = true;
    window.addEventListener('storage', (e) => {
      if (!e.key || e.key === STORAGE_KEYS.STUDENTS) {
        this.invalidateStudentsCache();
      }
      if (!e.key || e.key === STORAGE_KEYS.TEACHERS) {
        this.invalidateTeachersCache();
      }
    });
  }

  // --- Corrupt-Database & Quota-Safe Storage Helpers ---
  private static safeReadJson<T>(key: string, fallback: T, expectArray = false): T {
    try {
      const raw = localStorage.getItem(key);
      if (!raw) return fallback;
      const parsed = JSON.parse(raw);
      if (expectArray && !Array.isArray(parsed)) {
        this.safeWriteJson(key, fallback);
        return fallback;
      }
      if (!expectArray && (parsed === null || typeof parsed !== 'object')) {
        this.safeWriteJson(key, fallback);
        return fallback;
      }
      return parsed as T;
    } catch {
      // Auto-heal corrupted JSON entry so the application never crashes
      this.safeWriteJson(key, fallback);
      return fallback;
    }
  }

  private static safeWriteJson(key: string, value: unknown): boolean {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch {
      return false;
    }
  }

  public static initialize(): void {
    if (this.isInitialized) return;

    if (!localStorage.getItem(STORAGE_KEYS.BRANDING)) {
      this.safeWriteJson(STORAGE_KEYS.BRANDING, INITIAL_BRANDING);
    }
    if (!localStorage.getItem(STORAGE_KEYS.CLASSES)) {
      this.safeWriteJson(STORAGE_KEYS.CLASSES, INITIAL_CLASSES);
    }
    if (!localStorage.getItem(STORAGE_KEYS.ACTIVITIES)) {
      this.safeWriteJson(STORAGE_KEYS.ACTIVITIES, INITIAL_ACTIVITIES);
    }
    if (!localStorage.getItem(STORAGE_KEYS.SUBJECTS)) {
      this.safeWriteJson(STORAGE_KEYS.SUBJECTS, INITIAL_SUBJECTS);
    }
    if (!localStorage.getItem(STORAGE_KEYS.SCHEDULES)) {
      this.safeWriteJson(STORAGE_KEYS.SCHEDULES, INITIAL_SCHEDULES);
    }
    if (!localStorage.getItem(STORAGE_KEYS.EXAMS)) {
      this.safeWriteJson(STORAGE_KEYS.EXAMS, INITIAL_EXAMS);
    }
    if (!localStorage.getItem(STORAGE_KEYS.QUESTIONS)) {
      this.safeWriteJson(STORAGE_KEYS.QUESTIONS, INITIAL_QUESTIONS);
    }
    if (!localStorage.getItem(STORAGE_KEYS.TEACHERS)) {
      this.safeWriteJson(STORAGE_KEYS.TEACHERS, INITIAL_TEACHERS);
    }
    const existingStudents = localStorage.getItem(STORAGE_KEYS.STUDENTS);
    if (!existingStudents) {
      this.safeWriteJson(STORAGE_KEYS.STUDENTS, INITIAL_STUDENTS);
    } else {
      try {
        const parsed: any[] = JSON.parse(existingStudents);
        if (!Array.isArray(parsed) || (parsed.length > 0 && !parsed[0]?.nis)) {
          this.safeWriteJson(STORAGE_KEYS.STUDENTS, INITIAL_STUDENTS);
        }
      } catch {
        this.safeWriteJson(STORAGE_KEYS.STUDENTS, INITIAL_STUDENTS);
      }
    }
    if (!localStorage.getItem(STORAGE_KEYS.ACTIVE_TOKEN)) {
      try {
        localStorage.setItem(STORAGE_KEYS.ACTIVE_TOKEN, 'MADR26');
      } catch {
        // Ignore storage quota error
      }
    }

    // Seed realistic submissions for analytics demonstration if none exist
    if (!localStorage.getItem(STORAGE_KEYS.SUBMISSIONS)) {
      this.seedSubmissions();
    }

    this.ensureStorageSyncListener();
    this.isInitialized = true;
  }

  // --- Database Integrity Check & Auto-Repair ---
  public static validateAndRepairLocalDatabase(): {
    healthy: boolean;
    repairedKeys: string[];
    totalRecords: number;
  } {
    const repairedKeys: string[] = [];
    const checkArray = (key: string, fallback: any[], label: string): any[] => {
      try {
        const raw = localStorage.getItem(key);
        if (!raw) {
          this.safeWriteJson(key, fallback);
          repairedKeys.push(`${label} (diinisialisasi ulang)`);
          return fallback;
        }
        const parsed = JSON.parse(raw);
        if (!Array.isArray(parsed)) {
          this.safeWriteJson(key, fallback);
          repairedKeys.push(`${label} (format non-array diperbaiki)`);
          return fallback;
        }
        const cleaned = parsed.filter((item) => item && typeof item === 'object' && item.id);
        if (cleaned.length !== parsed.length) {
          this.safeWriteJson(key, cleaned);
          repairedKeys.push(`${label} (${parsed.length - cleaned.length} baris korup dibersihkan)`);
        }
        return cleaned;
      } catch {
        this.safeWriteJson(key, fallback);
        repairedKeys.push(`${label} (JSON rusak dipulihkan)`);
        return fallback;
      }
    };

    try {
      const bRaw = localStorage.getItem(STORAGE_KEYS.BRANDING);
      if (!bRaw || typeof JSON.parse(bRaw) !== 'object') {
        this.safeWriteJson(STORAGE_KEYS.BRANDING, INITIAL_BRANDING);
        repairedKeys.push('Branding');
      }
    } catch {
      this.safeWriteJson(STORAGE_KEYS.BRANDING, INITIAL_BRANDING);
      repairedKeys.push('Branding (JSON rusak dipulihkan)');
    }

    const cls = checkArray(STORAGE_KEYS.CLASSES, INITIAL_CLASSES, 'Kelas');
    const act = checkArray(STORAGE_KEYS.ACTIVITIES, INITIAL_ACTIVITIES, 'Aktivitas');
    const sbj = checkArray(STORAGE_KEYS.SUBJECTS, INITIAL_SUBJECTS, 'Mata Pelajaran');
    const tch = checkArray(STORAGE_KEYS.TEACHERS, INITIAL_TEACHERS, 'Guru');
    const std = checkArray(STORAGE_KEYS.STUDENTS, INITIAL_STUDENTS, 'Siswa');
    const exm = checkArray(STORAGE_KEYS.EXAMS, INITIAL_EXAMS, 'Paket Ujian');
    const qst = checkArray(STORAGE_KEYS.QUESTIONS, INITIAL_QUESTIONS, 'Bank Soal');
    const sch = checkArray(STORAGE_KEYS.SCHEDULES, INITIAL_SCHEDULES, 'Jadwal Ujian');
    const sub = checkArray(STORAGE_KEYS.SUBMISSIONS, [], 'Hasil Ujian');
    checkArray(STORAGE_KEYS.SYNC_QUEUE, [], 'Antrean Sinkronisasi');

    const totalRecords =
      cls.length +
      act.length +
      sbj.length +
      tch.length +
      std.length +
      exm.length +
      qst.length +
      sch.length +
      sub.length;

    this.invalidateStudentsCache();
    this.invalidateTeachersCache();

    return {
      healthy: repairedKeys.length === 0,
      repairedKeys,
      totalRecords,
    };
  }

  public static exportFullBackupJson(): string {
    this.initialize();
    return JSON.stringify(
      {
        version: 'cbt-backup-v1',
        exportedAt: new Date().toISOString(),
        data: {
          branding: this.getBranding(),
          activeToken: this.getActiveToken(),
          classes: this.getClasses(),
          activities: this.getActivities(),
          subjects: this.getSubjects(),
          teachers: this.getTeachers(),
          students: this.getStudents(),
          exams: this.getExams(),
          questions: this.getQuestions(),
          schedules: this.getSchedules(),
          submissions: this.getSubmissions(),
        },
      },
      null,
      2
    );
  }

  public static restoreFullBackupJson(jsonText: string): { success: boolean; message: string } {
    try {
      const parsed = JSON.parse(jsonText);
      const payload = parsed?.data || parsed;
      if (!payload || typeof payload !== 'object') {
        return { success: false, message: 'Format file backup tidak valid.' };
      }

      if (payload.branding && typeof payload.branding === 'object') {
        this.saveBranding(payload.branding);
      }
      if (typeof payload.activeToken === 'string' && payload.activeToken.trim()) {
        localStorage.setItem(STORAGE_KEYS.ACTIVE_TOKEN, payload.activeToken.trim().toUpperCase());
      }
      if (Array.isArray(payload.classes)) {
        this.safeWriteJson(STORAGE_KEYS.CLASSES, payload.classes);
        window.dispatchEvent(new Event('cbt-classes-change'));
      }
      if (Array.isArray(payload.activities)) {
        this.safeWriteJson(STORAGE_KEYS.ACTIVITIES, payload.activities);
        window.dispatchEvent(new Event('cbt-activities-change'));
      }
      if (Array.isArray(payload.subjects)) {
        this.safeWriteJson(STORAGE_KEYS.SUBJECTS, payload.subjects);
        window.dispatchEvent(new Event('cbt-subjects-change'));
      }
      if (Array.isArray(payload.teachers)) {
        this.safeWriteJson(STORAGE_KEYS.TEACHERS, payload.teachers);
        this.invalidateTeachersCache();
        window.dispatchEvent(new Event('cbt-teachers-change'));
      }
      if (Array.isArray(payload.students)) {
        this.safeWriteJson(STORAGE_KEYS.STUDENTS, payload.students);
        this.invalidateStudentsCache();
        window.dispatchEvent(new Event('cbt-students-change'));
      }
      if (Array.isArray(payload.exams)) {
        this.safeWriteJson(STORAGE_KEYS.EXAMS, payload.exams);
        window.dispatchEvent(new Event('cbt-exams-change'));
      }
      if (Array.isArray(payload.questions)) {
        this.safeWriteJson(STORAGE_KEYS.QUESTIONS, payload.questions);
        window.dispatchEvent(new Event('cbt-questions-change'));
      }
      if (Array.isArray(payload.schedules)) {
        this.safeWriteJson(STORAGE_KEYS.SCHEDULES, payload.schedules);
        window.dispatchEvent(new Event('cbt-schedules-change'));
      }
      if (Array.isArray(payload.submissions)) {
        this.safeWriteJson(STORAGE_KEYS.SUBMISSIONS, payload.submissions);
        window.dispatchEvent(new Event('cbt-submissions-change'));
      }

      this.validateAndRepairLocalDatabase();
      return { success: true, message: 'Seluruh data database berhasil dipulihkan dari file backup.' };
    } catch (err: any) {
      return { success: false, message: `File backup rusak atau bukan JSON valid: ${err?.message || 'Parse error'}` };
    }
  }

  public static applyRemoteSnapshot(snapshot: {
    branding?: AppBrandingSettings | null;
    activeToken?: string | null;
    classes?: StudentClass[];
    activities?: ExamActivity[];
    subjects?: Subject[];
    teachers?: Teacher[];
    students?: Student[];
    exams?: Exam[];
    questions?: Question[];
    schedules?: ExamSchedule[];
    submissions?: Submission[];
  }): void {
    if (snapshot.branding) {
      const currentBranding = this.getBranding();
      const mergedBranding: AppBrandingSettings = {
        ...snapshot.branding,
        logoUrl: this.resolveLogoUrl(snapshot.branding.logoUrl),
        adminUsername: snapshot.branding.adminUsername || currentBranding.adminUsername || 'admin',
        adminPassword: snapshot.branding.adminPassword || currentBranding.adminPassword || 'admin',
      };
      this.safeWriteJson(STORAGE_KEYS.BRANDING, mergedBranding);
      window.dispatchEvent(new Event('cbt-branding-change'));
    }
    if (snapshot.activeToken) {
      try {
        localStorage.setItem(STORAGE_KEYS.ACTIVE_TOKEN, snapshot.activeToken);
      } catch {
        // Ignore
      }
    }
    if (Array.isArray(snapshot.classes) && snapshot.classes.length > 0) {
      this.safeWriteJson(STORAGE_KEYS.CLASSES, snapshot.classes);
      window.dispatchEvent(new Event('cbt-classes-change'));
    }
    if (Array.isArray(snapshot.activities) && snapshot.activities.length > 0) {
      this.safeWriteJson(STORAGE_KEYS.ACTIVITIES, snapshot.activities);
      window.dispatchEvent(new Event('cbt-activities-change'));
    }
    if (Array.isArray(snapshot.subjects) && snapshot.subjects.length > 0) {
      this.safeWriteJson(STORAGE_KEYS.SUBJECTS, snapshot.subjects);
      window.dispatchEvent(new Event('cbt-subjects-change'));
    }
    if (Array.isArray(snapshot.teachers) && snapshot.teachers.length > 0) {
      this.safeWriteJson(STORAGE_KEYS.TEACHERS, snapshot.teachers);
      this.invalidateTeachersCache();
      window.dispatchEvent(new Event('cbt-teachers-change'));
    }
    if (Array.isArray(snapshot.students) && snapshot.students.length > 0) {
      this.safeWriteJson(STORAGE_KEYS.STUDENTS, snapshot.students);
      this.invalidateStudentsCache();
      window.dispatchEvent(new Event('cbt-students-change'));
    }
    if (Array.isArray(snapshot.exams) && snapshot.exams.length > 0) {
      this.safeWriteJson(STORAGE_KEYS.EXAMS, snapshot.exams);
      window.dispatchEvent(new Event('cbt-exams-change'));
    }
    if (Array.isArray(snapshot.questions) && snapshot.questions.length > 0) {
      this.safeWriteJson(STORAGE_KEYS.QUESTIONS, snapshot.questions);
      window.dispatchEvent(new Event('cbt-questions-change'));
    }
    if (Array.isArray(snapshot.schedules) && snapshot.schedules.length > 0) {
      this.safeWriteJson(STORAGE_KEYS.SCHEDULES, snapshot.schedules);
      window.dispatchEvent(new Event('cbt-schedules-change'));
    }
    if (Array.isArray(snapshot.submissions) && snapshot.submissions.length > 0) {
      // Merge with any local submissions not yet on remote
      const localSubs = this.getSubmissions();
      const remoteMap = new Map(snapshot.submissions.map(s => [s.id, s]));
      localSubs.forEach(ls => {
        if (!remoteMap.has(ls.id)) {
          remoteMap.set(ls.id, ls);
        }
      });
      this.safeWriteJson(STORAGE_KEYS.SUBMISSIONS, Array.from(remoteMap.values()));
      window.dispatchEvent(new Event('cbt-submissions-change'));
    }
  }

  // --- Branding Settings & Admin Credentials ---
  public static resolveLogoUrl(url?: string): string {
    const trimmed = (url || '').trim();
    if (!trimmed || trimmed === LEGACY_DEFAULT_LOGO_PATH) {
      return DEFAULT_SCHOOL_LOGO_URL;
    }
    return trimmed;
  }

  public static getBranding(): AppBrandingSettings {
    this.initialize();
    const raw = this.safeReadJson<AppBrandingSettings>(STORAGE_KEYS.BRANDING, INITIAL_BRANDING, false);
    const resolvedLogo = this.resolveLogoUrl(raw.logoUrl);
    if (resolvedLogo !== raw.logoUrl) {
      const healed = { ...raw, logoUrl: resolvedLogo };
      this.safeWriteJson(STORAGE_KEYS.BRANDING, healed);
      return healed;
    }
    return raw;
  }

  public static saveBranding(branding: AppBrandingSettings): void {
    const existing = this.safeReadJson<AppBrandingSettings>(STORAGE_KEYS.BRANDING, INITIAL_BRANDING, false);
    const merged: AppBrandingSettings = {
      ...branding,
      logoUrl: this.resolveLogoUrl(branding.logoUrl),
      adminUsername: (branding.adminUsername ?? existing.adminUsername ?? 'admin').trim(),
      adminPassword: (branding.adminPassword ?? existing.adminPassword ?? 'admin').trim(),
    };
    this.safeWriteJson(STORAGE_KEYS.BRANDING, merged);
    this.enqueueSync({
      id: `sync-branding-${Date.now()}`,
      action: 'upsert_branding',
      entityKey: 'branding:default',
      examId: '',
      studentId: '',
      payload: { ...merged, activeToken: this.getActiveToken() },
      retryCount: 0,
      timestamp: Date.now(),
    });
    window.dispatchEvent(new Event('cbt-branding-change'));
  }

  public static getAdminCredentials(): { username: string; password: string } {
    const b = this.getBranding();
    return {
      username: (b.adminUsername || 'admin').trim(),
      password: (b.adminPassword || 'admin').trim(),
    };
  }

  public static updateAdminCredentials(username: string, password: string): AppBrandingSettings {
    const current = this.getBranding();
    const updated: AppBrandingSettings = {
      ...current,
      adminUsername: username.trim(),
      adminPassword: password.trim(),
    };
    this.saveBranding(updated);
    return updated;
  }

  // --- Student Classes CRUD ---
  public static getClasses(): StudentClass[] {
    this.initialize();
    return this.safeReadJson<StudentClass[]>(STORAGE_KEYS.CLASSES, INITIAL_CLASSES, true);
  }

  public static saveClass(cls: StudentClass): void {
    const list = this.getClasses();
    const idx = list.findIndex(c => c.id === cls.id);
    if (idx >= 0) {
      list[idx] = cls;
    } else {
      list.push(cls);
    }
    this.safeWriteJson(STORAGE_KEYS.CLASSES, list);
    this.enqueueSync({
      id: `sync-cls-${cls.id}-${Date.now()}`,
      action: 'upsert_class',
      entityKey: `class:${cls.id}`,
      examId: '',
      studentId: '',
      payload: cls,
      retryCount: 0,
      timestamp: Date.now(),
    });
    window.dispatchEvent(new Event('cbt-classes-change'));
  }

  public static deleteClass(id: string): void {
    const list = this.getClasses().filter(c => c.id !== id);
    this.safeWriteJson(STORAGE_KEYS.CLASSES, list);
    this.enqueueSync({
      id: `sync-del-cls-${id}-${Date.now()}`,
      action: 'delete_class',
      entityKey: `class:${id}`,
      examId: '',
      studentId: '',
      payload: { id },
      retryCount: 0,
      timestamp: Date.now(),
    });
    window.dispatchEvent(new Event('cbt-classes-change'));
  }

  // --- Exam Activities CRUD ---
  public static getActivities(): ExamActivity[] {
    this.initialize();
    return this.safeReadJson<ExamActivity[]>(STORAGE_KEYS.ACTIVITIES, INITIAL_ACTIVITIES, true);
  }

  public static saveActivity(act: ExamActivity): void {
    const list = this.getActivities();
    const idx = list.findIndex(a => a.id === act.id);
    if (idx >= 0) {
      list[idx] = act;
    } else {
      list.push(act);
    }
    this.safeWriteJson(STORAGE_KEYS.ACTIVITIES, list);
    this.enqueueSync({
      id: `sync-act-${act.id}-${Date.now()}`,
      action: 'upsert_activity',
      entityKey: `activity:${act.id}`,
      examId: '',
      studentId: '',
      payload: act,
      retryCount: 0,
      timestamp: Date.now(),
    });
    window.dispatchEvent(new Event('cbt-activities-change'));
  }

  public static deleteActivity(id: string): void {
    const list = this.getActivities().filter(a => a.id !== id);
    this.safeWriteJson(STORAGE_KEYS.ACTIVITIES, list);
    this.enqueueSync({
      id: `sync-del-act-${id}-${Date.now()}`,
      action: 'delete_activity',
      entityKey: `activity:${id}`,
      examId: '',
      studentId: '',
      payload: { id },
      retryCount: 0,
      timestamp: Date.now(),
    });
    window.dispatchEvent(new Event('cbt-activities-change'));
  }

  // --- Subjects CRUD ---
  public static getSubjects(): Subject[] {
    this.initialize();
    return this.safeReadJson<Subject[]>(STORAGE_KEYS.SUBJECTS, INITIAL_SUBJECTS, true);
  }

  public static saveSubject(sbj: Subject): void {
    const list = this.getSubjects();
    const idx = list.findIndex(s => s.id === sbj.id);
    if (idx >= 0) {
      list[idx] = sbj;
    } else {
      list.push(sbj);
    }
    this.safeWriteJson(STORAGE_KEYS.SUBJECTS, list);
    this.enqueueSync({
      id: `sync-sbj-${sbj.id}-${Date.now()}`,
      action: 'upsert_subject',
      entityKey: `subject:${sbj.id}`,
      examId: '',
      studentId: '',
      payload: sbj,
      retryCount: 0,
      timestamp: Date.now(),
    });
    window.dispatchEvent(new Event('cbt-subjects-change'));
  }

  public static deleteSubject(id: string): void {
    const list = this.getSubjects().filter(s => s.id !== id);
    this.safeWriteJson(STORAGE_KEYS.SUBJECTS, list);
    this.enqueueSync({
      id: `sync-del-sbj-${id}-${Date.now()}`,
      action: 'delete_subject',
      entityKey: `subject:${id}`,
      examId: '',
      studentId: '',
      payload: { id },
      retryCount: 0,
      timestamp: Date.now(),
    });
    window.dispatchEvent(new Event('cbt-subjects-change'));
  }

  public static normalizeClassName(name: string): string {
    return (name || '')
      .trim()
      .toLowerCase()
      .replace(/^kelas\s+/i, '')
      .replace(/[.\-_/]+/g, ' ')
      .replace(/\s+/g, ' ')
      .replace(/\b(x|xi|xii|vii|viii|ix|\d{1,2})([a-h])\b/g, '$1 $2')
      .trim();
  }

  // --- Exam Schedules CRUD (Teacher & Admin) ---
  public static getSchedules(): ExamSchedule[] {
    this.initialize();
    try {
      const data = localStorage.getItem(STORAGE_KEYS.SCHEDULES);
      const list: ExamSchedule[] = data ? JSON.parse(data) : INITIAL_SCHEDULES;
      const activities = this.getActivities();
      const subjects = this.getSubjects();
      const allClasses = this.getClasses();

      let cachedDefaultMigratedClass: string | null = null;
      const resolveDefaultMigratedClass = () => {
        if (cachedDefaultMigratedClass !== null) return cachedDefaultMigratedClass;
        const seedClassNames = new Set(INITIAL_CLASSES.map((c) => this.normalizeClassName(c.name)));
        const customClasses = allClasses
          .filter((c) => (c.name || '').trim() && !seedClassNames.has(this.normalizeClassName(c.name)))
          .sort((a, b) => (a.name || '').localeCompare(b.name || '', 'id', { numeric: true }));

        if (customClasses[0]?.name) {
          cachedDefaultMigratedClass = customClasses[0].name;
          return cachedDefaultMigratedClass;
        }

        const seedStudentIds = new Set(INITIAL_STUDENTS.map((s) => s.id));
        const customStudentClasses = this.getStudents()
          .filter((s) => !seedStudentIds.has(s.id) && (s.className || '').trim())
          .map((s) => (s.className || '').trim())
          .sort((a, b) => a.localeCompare(b, 'id', { numeric: true }));

        cachedDefaultMigratedClass =
          customStudentClasses[0] || allClasses[0]?.name || 'XII MIPA 1';
        return cachedDefaultMigratedClass;
      };

      let healed = false;

      const normalized = list.map((sch) => {
        let updatedSch = sch;

        // Migrate legacy wildcard ['Semua Kelas'] or empty targetClasses to a specific class
        const rawTargets = Array.isArray(sch.targetClasses) ? sch.targetClasses : [];
        const hasWildcardOrEmpty =
          rawTargets.length === 0 ||
          rawTargets.some((c) => !c || String(c).trim().toLowerCase() === 'semua kelas');

        if (hasWildcardOrEmpty) {
          const cleanedTargets = rawTargets.filter(
            (c) => c && String(c).trim() !== '' && String(c).trim().toLowerCase() !== 'semua kelas'
          );
          const migratedTargets =
            cleanedTargets.length > 0 ? cleanedTargets : [resolveDefaultMigratedClass()];
          updatedSch = { ...updatedSch, targetClasses: migratedTargets };
          healed = true;
        }

        const act =
          activities.find((a) => a.id === updatedSch.activityId) ||
          activities.find((a) => (a.name || '').toLowerCase() === (updatedSch.activityName || '').toLowerCase());
        const subj =
          subjects.find((s) => s.id === updatedSch.subjectId) ||
          subjects.find((s) => (s.name || '').toLowerCase() === (updatedSch.subjectName || '').toLowerCase());

        if (act && subj) {
          const expectedExam = this.ensureExamForActivitySubject(act, subj, updatedSch.token);
          if (updatedSch.examId !== expectedExam.id) {
            healed = true;
            updatedSch = { ...updatedSch, examId: expectedExam.id };
          }
        }
        return updatedSch;
      });

      if (healed) {
        localStorage.setItem(STORAGE_KEYS.SCHEDULES, JSON.stringify(normalized));
      }

      return normalized;
    } catch {
      return INITIAL_SCHEDULES;
    }
  }

  public static saveSchedule(sch: ExamSchedule): void {
    const list = this.getSchedules();
    const idx = list.findIndex(s => s.id === sch.id);
    if (idx >= 0) {
      list[idx] = sch;
    } else {
      list.push(sch);
    }
    this.safeWriteJson(STORAGE_KEYS.SCHEDULES, list);
    this.enqueueSync({
      id: `sync-sch-${sch.id}-${Date.now()}`,
      action: 'upsert_schedule',
      entityKey: `schedule:${sch.id}`,
      examId: sch.examId,
      studentId: '',
      payload: sch,
      retryCount: 0,
      timestamp: Date.now(),
    });
    window.dispatchEvent(new Event('cbt-schedules-change'));
  }

  public static deleteSchedule(id: string): void {
    const list = this.getSchedules().filter(s => s.id !== id);
    this.safeWriteJson(STORAGE_KEYS.SCHEDULES, list);
    this.enqueueSync({
      id: `sync-del-sch-${id}-${Date.now()}`,
      action: 'delete_schedule',
      entityKey: `schedule:${id}`,
      examId: '',
      studentId: '',
      payload: { id },
      retryCount: 0,
      timestamp: Date.now(),
    });
    window.dispatchEvent(new Event('cbt-schedules-change'));
  }

  public static getScheduleTimingStatus(
    sch: ExamSchedule,
    nowMs = Date.now()
  ): {
    status: 'active' | 'upcoming' | 'ended';
    startMs: number;
    endMs: number;
    remainingSeconds: number;
  } {
    let y = 0;
    let m = 0;
    let d = 0;
    const rawDate = (sch.examDate || '').trim();
    if (/^\d{4}[-/]\d{1,2}[-/]\d{1,2}$/.test(rawDate)) {
      const parts = rawDate.split(/[-/]/).map(Number);
      [y, m, d] = parts;
    } else if (/^\d{1,2}[-/]\d{1,2}[-/]\d{4}$/.test(rawDate)) {
      const parts = rawDate.split(/[-/]/).map(Number);
      [d, m, y] = parts;
    }

    const cleanTime = (sch.startTime || '00:00').replace(/[^\d:.]/g, '');
    const [rawSh, rawSm] = cleanTime.split(/[:.]/).map(Number);
    const sh = Number.isNaN(rawSh) ? 0 : rawSh;
    const sm = Number.isNaN(rawSm) ? 0 : rawSm;

    if (!y || !m || !d) {
      const durationSec = Math.max(1, Number(sch.durationMinutes) || 60) * 60;
      return {
        status: 'active',
        startMs: nowMs,
        endMs: nowMs + durationSec * 1000,
        remainingSeconds: durationSec,
      };
    }

    const startMs = new Date(y, m - 1, d, sh, sm, 0, 0).getTime();
    const durationMs = Math.max(1, Number(sch.durationMinutes) || 60) * 60 * 1000;
    const endMs = startMs + durationMs;

    if (nowMs < startMs) {
      return {
        status: 'upcoming',
        startMs,
        endMs,
        remainingSeconds: Math.floor((endMs - startMs) / 1000),
      };
    }
    if (nowMs > endMs) {
      return {
        status: 'ended',
        startMs,
        endMs,
        remainingSeconds: 0,
      };
    }
    return {
      status: 'active',
      startMs,
      endMs,
      remainingSeconds: Math.max(1, Math.floor((endMs - nowMs) / 1000)),
    };
  }

  public static resolveExamForSchedule(sch: ExamSchedule): Exam | undefined {
    const activities = this.getActivities();
    const subjects = this.getSubjects();
    const act =
      activities.find((a) => a.id === sch.activityId) ||
      activities.find((a) => a.name.toLowerCase() === (sch.activityName || '').toLowerCase());
    const subj =
      subjects.find((s) => s.id === sch.subjectId) ||
      subjects.find((s) => s.name.toLowerCase() === (sch.subjectName || '').toLowerCase());

    let resolved: Exam | undefined;
    if (act && subj) {
      resolved = this.ensureExamForActivitySubject(act, subj, sch.token);
    } else {
      resolved = this.getExamById(sch.examId);
    }

    // If the exact (activity, subject) packet has 0 questions yet,
    // check if another exam packet for the same subject already has questions.
    if (resolved && this.getQuestions(resolved.id).length === 0) {
      const targetSubjectName = (subj?.name || sch.subjectName || resolved.subject || '')
        .trim()
        .toLowerCase();
      const sameSubjectWithQuestions = this.getExams().find(
        (ex) =>
          ex.subject.trim().toLowerCase() === targetSubjectName &&
          this.getQuestions(ex.id).length > 0
      );
      if (sameSubjectWithQuestions) {
        resolved = sameSubjectWithQuestions;
      }
    }

    if (resolved) {
      const targetDuration = Number(sch.durationMinutes) || resolved.durationMinutes;
      const targetToken = (sch.token || resolved.token).toUpperCase();
      return {
        ...resolved,
        title: `${sch.activityName} ${sch.subjectName}`,
        durationMinutes: targetDuration,
        token: targetToken,
      };
    }
    return resolved;
  }

  // --- Students CRUD & O(1) NIS Index Lookup ---
  public static getStudents(): Student[] {
    this.initialize();
    if (this.studentsCache && this.studentNisMap) {
      return this.studentsCache;
    }

    try {
      const data = localStorage.getItem(STORAGE_KEYS.STUDENTS);
      const rawList: any[] = data ? JSON.parse(data) : INITIAL_STUDENTS;

      const nisMap = new Map<string, Student>();
      const sanitized: Student[] = rawList.map((s, idx) => {
        const fallbackNis = `2024${String(1001 + idx)}`;
        const nis = s.nis || (s.nisn ? s.nisn.slice(-8) : fallbackNis);
        let gender: 'Laki-laki' | 'Perempuan' = 'Laki-laki';
        if (s.gender === 'P' || s.gender === 'Perempuan') {
          gender = 'Perempuan';
        } else if (s.gender === 'L' || s.gender === 'Laki-laki') {
          gender = 'Laki-laki';
        }

        const studentObj: Student = {
          id: s.id || `std-${idx + 1}`,
          nis: String(nis).trim(),
          nisn: String(s.nisn || `008${nis}`).trim(),
          name: s.name || `Siswa ${idx + 1}`,
          className: s.className || 'XII MIPA 1',
          room: s.room || 'Lab Komputer 1',
          gender,
          avatarUrl: s.avatarUrl,
        };

        const nisKey = studentObj.nis.toLowerCase();
        const nisnKey = studentObj.nisn.toLowerCase();
        if (nisKey && !nisMap.has(nisKey)) nisMap.set(nisKey, studentObj);
        if (nisnKey && !nisMap.has(nisnKey)) nisMap.set(nisnKey, studentObj);

        return studentObj;
      });

      this.studentsCache = sanitized;
      this.studentNisMap = nisMap;
      return sanitized;
    } catch {
      return INITIAL_STUDENTS;
    }
  }

  public static findStudentByNis(nis: string): Student | undefined {
    const trimmed = (nis || '').trim().toLowerCase();
    if (!trimmed) return undefined;
    this.getStudents();
    return this.studentNisMap?.get(trimmed);
  }

  public static cacheRemoteStudent(student: Student): void {
    const list = [...this.getStudents()];
    const idx = list.findIndex(s => s.id === student.id || s.nis.toLowerCase() === student.nis.toLowerCase());
    if (idx >= 0) {
      list[idx] = student;
    } else {
      list.push(student);
    }
    this.safeWriteJson(STORAGE_KEYS.STUDENTS, list);
    this.invalidateStudentsCache();
    window.dispatchEvent(new Event('cbt-students-change'));
  }

  public static saveStudent(student: Student): void {
    const list = [...this.getStudents()];
    const idx = list.findIndex(s => s.id === student.id || s.nis === student.nis);
    if (idx >= 0) {
      list[idx] = student;
    } else {
      list.push(student);
    }
    this.safeWriteJson(STORAGE_KEYS.STUDENTS, list);
    this.invalidateStudentsCache();
    this.enqueueSync({
      id: `sync-std-${student.id}-${Date.now()}`,
      action: 'upsert_student',
      entityKey: `student:${student.id}`,
      examId: '',
      studentId: student.id,
      payload: student,
      retryCount: 0,
      timestamp: Date.now(),
    });
    window.dispatchEvent(new Event('cbt-students-change'));
  }

  public static deleteStudent(id: string): void {
    const list = this.getStudents().filter(s => s.id !== id);
    this.safeWriteJson(STORAGE_KEYS.STUDENTS, list);
    this.invalidateStudentsCache();
    this.enqueueSync({
      id: `sync-del-std-${id}-${Date.now()}`,
      action: 'delete_student',
      entityKey: `student:${id}`,
      examId: '',
      studentId: id,
      payload: { id },
      retryCount: 0,
      timestamp: Date.now(),
    });
    window.dispatchEvent(new Event('cbt-students-change'));
  }

  public static importStudents(newStudents: Student[]): number {
    const currentList = [...this.getStudents()];
    const indexByNis = new Map<string, number>();
    currentList.forEach((s, i) => {
      if (s.nis) indexByNis.set(s.nis.toLowerCase(), i);
    });

    let importedCount = 0;
    const syncedStudents: Student[] = [];

    newStudents.forEach(newStd => {
      if (!newStd.nis || !newStd.name) return;
      const nisKey = newStd.nis.trim().toLowerCase();
      const existingIdx = indexByNis.get(nisKey);
      if (existingIdx !== undefined) {
        currentList[existingIdx] = { ...currentList[existingIdx], ...newStd };
        syncedStudents.push(currentList[existingIdx]);
      } else {
        const created = {
          ...newStd,
          id: newStd.id || `std-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        };
        indexByNis.set(nisKey, currentList.length);
        currentList.push(created);
        syncedStudents.push(created);
      }
      importedCount++;
    });

    this.safeWriteJson(STORAGE_KEYS.STUDENTS, currentList);
    this.invalidateStudentsCache();
    if (syncedStudents.length > 0) {
      this.enqueueSync({
        id: `sync-imp-std-${Date.now()}`,
        action: 'import_students',
        entityKey: `import_students:${Date.now()}`,
        examId: '',
        studentId: '',
        payload: syncedStudents,
        retryCount: 0,
        timestamp: Date.now(),
      });
    }
    window.dispatchEvent(new Event('cbt-students-change'));
    return importedCount;
  }

  // --- Teachers CRUD & O(1) Username Lookup ---
  public static getTeachers(): Teacher[] {
    this.initialize();
    if (this.teachersCache && this.teacherUsernameMap) {
      return this.teachersCache;
    }

    const list = this.safeReadJson<Teacher[]>(STORAGE_KEYS.TEACHERS, INITIAL_TEACHERS, true);
    const unameMap = new Map<string, Teacher>();
    list.forEach(t => {
      const u = (t.username || '').trim().toLowerCase();
      const n = (t.nip || '').trim().toLowerCase();
      if (u && !unameMap.has(u)) unameMap.set(u, t);
      if (n && !unameMap.has(n)) unameMap.set(n, t);
    });
    this.teachersCache = list;
    this.teacherUsernameMap = unameMap;
    return list;
  }

  public static saveTeacher(teacher: Teacher): void {
    const list = [...this.getTeachers()];
    const idx = list.findIndex(t => t.id === teacher.id || (t.nip && t.nip === teacher.nip));
    if (idx >= 0) {
      list[idx] = teacher;
    } else {
      list.push(teacher);
    }
    this.safeWriteJson(STORAGE_KEYS.TEACHERS, list);
    this.invalidateTeachersCache();
    this.enqueueSync({
      id: `sync-tch-${teacher.id}-${Date.now()}`,
      action: 'upsert_teacher',
      entityKey: `teacher:${teacher.id}`,
      examId: '',
      studentId: '',
      payload: teacher,
      retryCount: 0,
      timestamp: Date.now(),
    });
    window.dispatchEvent(new Event('cbt-teachers-change'));
  }

  public static deleteTeacher(id: string): void {
    const list = this.getTeachers().filter(t => t.id !== id);
    this.safeWriteJson(STORAGE_KEYS.TEACHERS, list);
    this.invalidateTeachersCache();
    this.enqueueSync({
      id: `sync-del-tch-${id}-${Date.now()}`,
      action: 'delete_teacher',
      entityKey: `teacher:${id}`,
      examId: '',
      studentId: '',
      payload: { id },
      retryCount: 0,
      timestamp: Date.now(),
    });
    window.dispatchEvent(new Event('cbt-teachers-change'));
  }

  public static importTeachers(newTeachers: Teacher[]): number {
    const currentList = [...this.getTeachers()];
    let importedCount = 0;
    const syncedTeachers: Teacher[] = [];

    newTeachers.forEach(newTch => {
      if (!newTch.name) return;
      const existingIdx = currentList.findIndex(
        t => (t.nip && newTch.nip && t.nip === newTch.nip) || (t.username && newTch.username && t.username.toLowerCase() === newTch.username.toLowerCase())
      );
      if (existingIdx >= 0) {
        currentList[existingIdx] = { ...currentList[existingIdx], ...newTch };
        syncedTeachers.push(currentList[existingIdx]);
      } else {
        const created = {
          ...newTch,
          id: newTch.id || `tch-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        };
        currentList.push(created);
        syncedTeachers.push(created);
      }
      importedCount++;
    });

    this.safeWriteJson(STORAGE_KEYS.TEACHERS, currentList);
    this.invalidateTeachersCache();
    if (syncedTeachers.length > 0) {
      this.enqueueSync({
        id: `sync-imp-tch-${Date.now()}`,
        action: 'import_teachers',
        entityKey: `import_teachers:${Date.now()}`,
        examId: '',
        studentId: '',
        payload: syncedTeachers,
        retryCount: 0,
        timestamp: Date.now(),
      });
    }
    window.dispatchEvent(new Event('cbt-teachers-change'));
    return importedCount;
  }

  public static findTeacherByUsername(username: string): Teacher | undefined {
    const trimmed = (username || '').trim().toLowerCase();
    if (!trimmed) return undefined;
    this.getTeachers();
    return this.teacherUsernameMap?.get(trimmed);
  }

  public static updateTeacherPassword(username: string, newPassword: string): boolean {
    const list = [...this.getTeachers()];
    const idx = list.findIndex(t =>
      (t.username && t.username.toLowerCase() === username.toLowerCase()) ||
      (t.nip && t.nip.toLowerCase() === username.toLowerCase())
    );
    if (idx >= 0) {
      list[idx] = { ...list[idx], password: newPassword };
      this.safeWriteJson(STORAGE_KEYS.TEACHERS, list);
      this.invalidateTeachersCache();
      this.enqueueSync({
        id: `sync-tch-${list[idx].id}-${Date.now()}`,
        action: 'upsert_teacher',
        entityKey: `teacher:${list[idx].id}`,
        examId: '',
        studentId: '',
        payload: list[idx],
        retryCount: 0,
        timestamp: Date.now(),
      });
      window.dispatchEvent(new Event('cbt-teachers-change'));
      return true;
    }
    return false;
  }

  // --- Current Authenticated User (Admin, Guru, Siswa) ---
  public static getAuthUser(): AuthUser | null {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.AUTH_USER);
      return data ? JSON.parse(data) : null;
    } catch {
      return null;
    }
  }

  public static setAuthUser(user: AuthUser | null): void {
    if (user) {
      localStorage.setItem(STORAGE_KEYS.AUTH_USER, JSON.stringify(user));
    } else {
      localStorage.removeItem(STORAGE_KEYS.AUTH_USER);
    }
    window.dispatchEvent(new Event('cbt-auth-change'));
  }

  // Generate realistic test submissions for analytics demonstration if none exist
  private static seedSubmissions(): void {
    const students = INITIAL_STUDENTS;
    const questions = INITIAL_QUESTIONS.filter(q => q.examId === 'exam-mat-xii');
    const exam = INITIAL_EXAMS[0];

    const mockSubmissions: Submission[] = students.map((std, idx) => {
      const answers: Record<string, StudentAnswer> = {};
      let score = 0;
      let correctCount = 0;
      let incorrectCount = 0;
      let emptyCount = 0;

      const performanceTier = idx % 4; // 0: Top, 1: High, 2: Moderate, 3: Remedial
      const infractionsCount = idx === 3 ? 2 : idx === 6 ? 1 : 0;
      const infractionLogs: InfractionLog[] = [];

      if (infractionsCount > 0) {
        infractionLogs.push({
          id: `inf-${idx}-1`,
          timestamp: Date.now() - 1000 * 60 * (15 - idx),
          type: 'tab_switch',
          message: 'Peringatan: Berpindah jendela browser / tab.',
        });
      }

      questions.forEach((q, qIdx) => {
        let isCorrect = false;
        if (performanceTier === 0) isCorrect = true;
        else if (performanceTier === 1) isCorrect = qIdx !== 3;
        else if (performanceTier === 2) isCorrect = qIdx < 3;
        else isCorrect = qIdx === 0 || qIdx === 4;

        let selectedOptionVal: string | string[] = '';
        if (isCorrect) {
          selectedOptionVal = q.correctAnswer;
          score += q.points;
          correctCount++;
        } else {
          const wrongOptions = q.options.filter(o =>
            Array.isArray(q.correctAnswer)
              ? !q.correctAnswer.includes(o.id)
              : o.id !== q.correctAnswer
          );
          selectedOptionVal =
            wrongOptions[qIdx % Math.max(1, wrongOptions.length)]?.id ||
            q.options[0]?.id ||
            'Jawaban belum tepat';
          incorrectCount++;
        }

        answers[q.id] = {
          questionId: q.id,
          selectedOption: selectedOptionVal,
          isDoubtful: qIdx === 2 && performanceTier > 1,
          answeredAt: Date.now() - 1000 * (60 * (idx + 1) + qIdx * 10),
        };
      });

      const maxScore = questions.reduce((sum, q) => sum + q.points, 0);
      const percentage = Math.round((score / maxScore) * 100);

      return {
        id: `sub-${exam.id}-${std.id}`,
        examId: exam.id,
        studentId: std.id,
        studentName: std.name,
        className: std.className,
        nisn: std.nisn,
        room: std.room,
        answers,
        score,
        maxScore,
        percentage,
        isPassed: percentage >= exam.kkm,
        correctCount,
        incorrectCount,
        emptyCount,
        doubtfulCount: performanceTier > 1 ? 1 : 0,
        startedAt: Date.now() - 1000 * 60 * 50,
        finishedAt: Date.now() - 1000 * 60 * (5 + idx),
        durationSecondsUsed: 45 * 60 - idx * 120,
        status: 'completed',
        infractionsCount,
        infractionLogs,
        syncStatus: 'synced',
        lastSyncedAt: Date.now() - 1000 * 60 * 2,
      };
    });

    localStorage.setItem(STORAGE_KEYS.SUBMISSIONS, JSON.stringify(mockSubmissions));
  }

  // --- Exam Operations ---
  public static getExams(): Exam[] {
    this.initialize();
    return this.safeReadJson<Exam[]>(STORAGE_KEYS.EXAMS, INITIAL_EXAMS, true);
  }

  public static getExamById(id: string): Exam | undefined {
    return this.getExams().find(e => e.id === id);
  }

  public static saveExam(exam: Exam): void {
    const exams = this.getExams();
    const idx = exams.findIndex(e => e.id === exam.id);
    if (idx >= 0) {
      exams[idx] = exam;
    } else {
      exams.push(exam);
    }
    this.safeWriteJson(STORAGE_KEYS.EXAMS, exams);
    this.enqueueSync({
      id: `sync-exm-${exam.id}-${Date.now()}`,
      action: 'upsert_exam',
      entityKey: `exam:${exam.id}`,
      examId: exam.id,
      studentId: '',
      payload: exam,
      retryCount: 0,
      timestamp: Date.now(),
    });
    window.dispatchEvent(new Event('cbt-exams-change'));
  }

  public static deleteExam(id: string): void {
    const exams = this.getExams().filter(e => e.id !== id);
    this.safeWriteJson(STORAGE_KEYS.EXAMS, exams);
    this.enqueueSync({
      id: `sync-del-exm-${id}-${Date.now()}`,
      action: 'delete_exam',
      entityKey: `exam:${id}`,
      examId: id,
      studentId: '',
      payload: { id },
      retryCount: 0,
      timestamp: Date.now(),
    });
    window.dispatchEvent(new Event('cbt-exams-change'));
  }

  public static ensureExamForActivitySubject(activity: ExamActivity, subject: Subject, defaultToken = 'MADR26'): Exam {
    const exams = this.getExams();
    const expectedTitle = `${activity.name} ${subject.name}`;
    const expectedId = `exam-${activity.id}-${subject.id}`;
    const escapedCode = activity.code.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const codeWordRegex = new RegExp(`\\b${escapedCode}\\b`, 'i');

    // 1. Try matching by exact ID, exact title, or subject + whole-word activity code/name
    let existing = exams.find(
      e =>
        e.id === expectedId ||
        e.title.toLowerCase() === expectedTitle.toLowerCase() ||
        ((e.subject.toLowerCase() === subject.name.toLowerCase() ||
          (e.id === 'exam-fis-xi' && subject.name.toLowerCase() === 'fisika')) &&
          (e.title.toLowerCase().includes(activity.name.toLowerCase()) ||
            codeWordRegex.test(e.title)))
    );

    if (existing) {
      return existing;
    }

    // 2. Otherwise create a new exam packet bound to this master activity + subject
    const branding = this.getBranding();
    const newExam: Exam = {
      id: `exam-${activity.id}-${subject.id}`,
      code: `${activity.code}-${subject.code}-2026`,
      title: expectedTitle,
      subject: subject.name,
      gradeLevel: subject.category ? `Program ${subject.category}` : 'Semua Tingkat',
      academicYear: '2025/2026',
      schoolName: branding.title2 || 'SMA NEGERI 1 REMBANG',
      durationMinutes: 90,
      token: defaultToken,
      kkm: 75,
      instructions: [
        'Periksa dan bacalah soal-soal dengan teliti sebelum Anda menjawabnya.',
        'Soal terdiri dari pilihan ganda yang memuat formula matematika dan sains.',
        'Paket soal telah diunduh ke perangkat Anda dan dapat dikerjakan secara offline.',
        'Dilarang membuka tab baru, minimize jendela ujian, atau keluar dari mode layar penuh.',
      ],
      randomizeQuestions: true,
      randomizeOptions: false,
      totalQuestions: 0,
      status: 'active',
      createdAt: new Date().toISOString(),
    };

    this.saveExam(newExam);
    return newExam;
  }

  // --- Question Operations ---
  public static getQuestions(examId?: string): Question[] {
    this.initialize();
    const questions = this.safeReadJson<Question[]>(STORAGE_KEYS.QUESTIONS, INITIAL_QUESTIONS, true);
    return examId ? questions.filter(q => q.examId === examId) : questions;
  }

  public static saveQuestion(question: Question): void {
    const all = this.getQuestions();
    const idx = all.findIndex(q => q.id === question.id);
    if (idx >= 0) {
      all[idx] = question;
    } else {
      all.push(question);
    }
    this.safeWriteJson(STORAGE_KEYS.QUESTIONS, all);
    this.enqueueSync({
      id: `sync-q-${question.id}-${Date.now()}`,
      action: 'upsert_question',
      entityKey: `question:${question.id}`,
      examId: question.examId,
      studentId: '',
      payload: question,
      retryCount: 0,
      timestamp: Date.now(),
    });

    const exams = this.getExams();
    const exam = exams.find(e => e.id === question.examId);
    if (exam) {
      exam.totalQuestions = all.filter(q => q.examId === question.examId).length;
      this.saveExam(exam);
    }
  }

  public static deleteQuestion(id: string): void {
    const all = this.getQuestions();
    const question = all.find(q => q.id === id);
    const filtered = all.filter(q => q.id !== id);
    this.safeWriteJson(STORAGE_KEYS.QUESTIONS, filtered);
    this.enqueueSync({
      id: `sync-del-q-${id}-${Date.now()}`,
      action: 'delete_question',
      entityKey: `question:${id}`,
      examId: question?.examId || '',
      studentId: '',
      payload: { id },
      retryCount: 0,
      timestamp: Date.now(),
    });

    if (question) {
      const exams = this.getExams();
      const exam = exams.find(e => e.id === question.examId);
      if (exam) {
        exam.totalQuestions = filtered.filter(q => q.examId === question.examId).length;
        this.saveExam(exam);
      }
    }
  }

  public static importQuestions(
    examId: string,
    newQuestions: Question[],
    replaceExisting = false
  ): number {
    const all = this.getQuestions();
    const otherExamQuestions = all.filter(q => q.examId !== examId);
    const existingForExam = replaceExisting ? [] : all.filter(q => q.examId === examId);

    const startNum = existingForExam.length;
    const normalizedNew = newQuestions.map((q, idx) => ({
      ...q,
      examId,
      number: startNum + idx + 1,
    }));

    const combined = [...otherExamQuestions, ...existingForExam, ...normalizedNew];
    this.safeWriteJson(STORAGE_KEYS.QUESTIONS, combined);

    this.enqueueSync({
      id: `sync-imp-q-${examId}-${Date.now()}`,
      action: 'import_questions',
      entityKey: `import_questions:${examId}`,
      examId,
      studentId: '',
      payload: { examId, questions: [...existingForExam, ...normalizedNew], replaceExisting },
      retryCount: 0,
      timestamp: Date.now(),
    });

    const exams = this.getExams();
    const exam = exams.find(e => e.id === examId);
    if (exam) {
      exam.totalQuestions = existingForExam.length + normalizedNew.length;
      this.saveExam(exam);
    }

    return normalizedNew.length;
  }

  // --- Local-First Exam Packet Bundle ---
  public static getExamBundle(
    examId: string,
    forceRandomize = true
  ): { exam: Exam; questions: Question[] } | null {
    const exam = this.getExamById(examId);
    if (!exam) return null;
    const baseQuestions = this.getQuestions(examId);

    if (!forceRandomize && !exam.randomizeQuestions) {
      return { exam, questions: baseQuestions };
    }

    const shuffle = (items: Question[]) => {
      const arr = [...items];
      for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
      }
      return arr;
    };

    let questions = shuffle(baseQuestions);
    if (baseQuestions.length >= 2) {
      for (let attempt = 0; attempt < 3; attempt++) {
        const isSameOrder = questions.every((q, idx) => q.id === baseQuestions[idx].id);
        if (!isSameOrder) break;
        questions = shuffle(baseQuestions);
      }
    }

    return { exam: { ...exam, randomizeQuestions: true }, questions };
  }

  // --- Student Answer & Local-First State ---
  public static getStudentAnswers(examId: string, studentId: string): Record<string, StudentAnswer> {
    const key = `cbt_answers_${examId}_${studentId}`;
    try {
      const data = localStorage.getItem(key);
      return data ? JSON.parse(data) : {};
    } catch {
      return {};
    }
  }

  public static clearStudentExamDraft(examId: string, studentId: string): void {
    localStorage.removeItem(`cbt_answers_${examId}_${studentId}`);
    localStorage.removeItem(`cbt_infractions_${examId}_${studentId}`);
  }

  public static saveStudentAnswerLocally(
    examId: string,
    studentId: string,
    answer: StudentAnswer
  ): void {
    const key = `cbt_answers_${examId}_${studentId}`;
    const answers = this.getStudentAnswers(examId, studentId);
    answers[answer.questionId] = answer;
    localStorage.setItem(key, JSON.stringify(answers));

    this.enqueueSync({
      id: `sync-ans-${examId}-${studentId}-${answer.questionId}-${Date.now()}`,
      action: 'save_answer',
      examId,
      studentId,
      payload: answer,
      retryCount: 0,
      timestamp: Date.now(),
    });
  }

  // --- Submissions & Auto Grading ---
  public static getSubmissions(examId?: string): Submission[] {
    this.initialize();
    try {
      const data = localStorage.getItem(STORAGE_KEYS.SUBMISSIONS);
      const rawList: Submission[] = data ? JSON.parse(data) : [];
      const students = this.getStudents();
      const exams = this.getExams();
      const examKkmMap = new Map(exams.map(e => [e.id, e.kkm]));
      const studentById = new Map(students.map(s => [s.id, s]));
      const studentByNisn = new Map(students.map(s => [s.nisn, s]));
      const studentByNis = new Map(students.map(s => [s.nis, s]));

      const synced = rawList
        .filter(sub => {
          // Drop mock seeded submissions if the mock student was deleted from Master Siswa
          if (sub.id.startsWith('sub-exam-mat-xii-std-')) {
            return studentById.has(sub.studentId) || studentByNisn.has(sub.nisn);
          }
          return true;
        })
        .map(sub => {
          const examKkm = examKkmMap.get(sub.examId);
          const updatedIsPassed =
            typeof examKkm === 'number' ? sub.percentage >= examKkm : sub.isPassed;

          if (sub.studentId.startsWith('sim-std-')) {
            return { ...sub, isPassed: updatedIsPassed };
          }

          const latest =
            studentById.get(sub.studentId) ||
            studentByNisn.get(sub.nisn) ||
            studentByNis.get(sub.nisn);

          if (!latest) {
            return { ...sub, isPassed: updatedIsPassed };
          }

          return {
            ...sub,
            studentName: latest.name,
            className: latest.className,
            room: latest.room,
            nisn: latest.nisn,
            isPassed: updatedIsPassed,
          };
        });

      return examId ? synced.filter(s => s.examId === examId) : synced;
    } catch {
      return [];
    }
  }

  public static getSubmissionByStudent(examId: string, studentId: string): Submission | undefined {
    return this.getSubmissions(examId).find(s => s.studentId === studentId);
  }

  public static evaluateQuestionAnswer(
    q: Question,
    selectedOption: string | string[] | undefined
  ): boolean {
    if (
      selectedOption === undefined ||
      selectedOption === null ||
      (Array.isArray(selectedOption) && selectedOption.length === 0) ||
      (typeof selectedOption === 'string' && selectedOption.trim() === '')
    ) {
      return false;
    }

    if (q.type === 'essay' || q.type === 'short_answer') {
      const studentText = (
        Array.isArray(selectedOption) ? selectedOption.join(' ') : String(selectedOption)
      )
        .trim()
        .toLowerCase();

      if (!studentText) return false;
      const matchMode = q.essayOptions?.matchMode || 'contains';
      if (matchMode === 'manual') return false;

      const rawCorrectList = Array.isArray(q.correctAnswer)
        ? q.correctAnswer
        : typeof q.correctAnswer === 'string' && q.correctAnswer.trim()
        ? [q.correctAnswer]
        : [];
      const optionTexts = (q.options || []).map((o) => (o.text || '').trim()).filter(Boolean);
      const acceptedAnswers = Array.from(
        new Set(
          [...optionTexts, ...rawCorrectList.map((v) => String(v).trim())]
            .filter(Boolean)
            .map((v) => v.toLowerCase())
        )
      );

      if (acceptedAnswers.length === 0) return false;

      if (matchMode === 'exact') {
        return acceptedAnswers.some((ans) => studentText === ans);
      }
      return acceptedAnswers.some((ans) => studentText.includes(ans));
    }

    if (q.type === 'multiple_choice' || Array.isArray(q.correctAnswer)) {
      const expectedList = Array.from(
        new Set(
          (Array.isArray(q.correctAnswer) ? q.correctAnswer : [String(q.correctAnswer || '')])
            .map((v) => v.trim())
            .filter(Boolean)
        )
      );
      const selectedList = Array.from(
        new Set(
          (Array.isArray(selectedOption) ? selectedOption : [String(selectedOption || '')])
            .map((v) => v.trim())
            .filter(Boolean)
        )
      );
      if (expectedList.length === 0 || selectedList.length !== expectedList.length) {
        return false;
      }
      return expectedList.every((val) => selectedList.includes(val));
    }

    const selectedStr = Array.isArray(selectedOption) ? selectedOption[0] || '' : selectedOption;
    return selectedStr === q.correctAnswer;
  }

  public static calculateAndSubmitExam(
    examId: string,
    student: Student,
    answers: Record<string, StudentAnswer>,
    infractions: InfractionLog[],
    durationSecondsUsed: number
  ): Submission {
    const exam = this.getExamById(examId);
    const questions = this.getQuestions(examId);

    let score = 0;
    let correctCount = 0;
    let incorrectCount = 0;
    let emptyCount = 0;
    let doubtfulCount = 0;

    questions.forEach(q => {
      const ans = answers[q.id];
      const hasAnswer =
        ans &&
        ans.selectedOption !== undefined &&
        ans.selectedOption !== null &&
        (Array.isArray(ans.selectedOption)
          ? ans.selectedOption.length > 0
          : String(ans.selectedOption).trim() !== '');

      if (!hasAnswer) {
        emptyCount++;
        return;
      }

      if (ans.isDoubtful) {
        doubtfulCount++;
      }

      const isCorrect = this.evaluateQuestionAnswer(q, ans.selectedOption);

      if (isCorrect) {
        score += q.points;
        correctCount++;
      } else {
        incorrectCount++;
      }
    });

    const maxScore = questions.reduce((sum, q) => sum + q.points, 0) || 100;
    const percentage = Math.round((score / maxScore) * 100);
    const kkm = exam?.kkm ?? 75;

    const submission: Submission = {
      id: `sub-${examId}-${student.id}`,
      examId,
      studentId: student.id,
      studentName: student.name,
      className: student.className,
      nisn: student.nisn,
      room: student.room,
      answers,
      score,
      maxScore,
      percentage,
      isPassed: percentage >= kkm,
      correctCount,
      incorrectCount,
      emptyCount,
      doubtfulCount,
      startedAt: Date.now() - durationSecondsUsed * 1000,
      finishedAt: Date.now(),
      durationSecondsUsed,
      status: 'completed',
      infractionsCount: infractions.length,
      infractionLogs: infractions,
      syncStatus: 'synced',
      lastSyncedAt: Date.now(),
    };

    const all = this.getSubmissions();
    const idx = all.findIndex(s => s.id === submission.id);
    if (idx >= 0) {
      all[idx] = submission;
    } else {
      all.push(submission);
    }
    localStorage.setItem(STORAGE_KEYS.SUBMISSIONS, JSON.stringify(all));

    this.enqueueSync({
      id: `sync-sub-${examId}-${student.id}-${Date.now()}`,
      action: 'submit_exam',
      examId,
      studentId: student.id,
      payload: submission,
      retryCount: 0,
      timestamp: Date.now(),
    });

    // Clear draft answers & infractions once final submission is recorded
    this.clearStudentExamDraft(examId, student.id);
    window.dispatchEvent(new Event('cbt-submissions-change'));

    return submission;
  }

  // --- Anti-Fraud Infraction Recording ---
  public static recordInfractionLocally(
    examId: string,
    studentId: string,
    type: InfractionLog['type'],
    message: string
  ): InfractionLog {
    const key = `cbt_infractions_${examId}_${studentId}`;
    let list: InfractionLog[] = [];
    try {
      const data = localStorage.getItem(key);
      if (data) list = JSON.parse(data);
    } catch {
      list = [];
    }

    const log: InfractionLog = {
      id: `inf-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      timestamp: Date.now(),
      type,
      message,
    };

    list.push(log);
    localStorage.setItem(key, JSON.stringify(list));

    this.enqueueSync({
      id: `sync-inf-${log.id}`,
      action: 'log_infraction',
      examId,
      studentId,
      payload: log,
      retryCount: 0,
      timestamp: Date.now(),
    });

    window.dispatchEvent(new Event('cbt-infraction-change'));

    return log;
  }

  public static getStudentInfractions(examId: string, studentId: string): InfractionLog[] {
    const key = `cbt_infractions_${examId}_${studentId}`;
    try {
      const data = localStorage.getItem(key);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }

  // --- Auto Sync Queue ---
  public static getSyncQueue(): SyncQueueItem[] {
    return this.safeReadJson<SyncQueueItem[]>(STORAGE_KEYS.SYNC_QUEUE, [], true);
  }

  public static enqueueSync(item: SyncQueueItem): void {
    const queue = this.getSyncQueue();
    if (item.entityKey) {
      const existingIdx = queue.findIndex(q => q.entityKey === item.entityKey);
      if (existingIdx >= 0) {
        queue[existingIdx] = item;
      } else {
        queue.push(item);
      }
    } else {
      queue.push(item);
    }
    this.safeWriteJson(STORAGE_KEYS.SYNC_QUEUE, queue);
    window.dispatchEvent(new Event('cbt-sync-enqueued'));
  }

  public static removeSyncQueueItem(id: string): void {
    const queue = this.getSyncQueue().filter(i => i.id !== id);
    this.safeWriteJson(STORAGE_KEYS.SYNC_QUEUE, queue);
  }

  // --- Proctor Token Operations ---
  public static getActiveToken(): string {
    return localStorage.getItem(STORAGE_KEYS.ACTIVE_TOKEN) || 'MADR26';
  }

  public static generateNewToken(): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let token = '';
    for (let i = 0; i < 6; i++) {
      token += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    try {
      localStorage.setItem(STORAGE_KEYS.ACTIVE_TOKEN, token);
    } catch {
      // Ignore quota error
    }

    const exams = this.getExams();
    exams.forEach(e => {
      e.token = token;
    });
    this.safeWriteJson(STORAGE_KEYS.EXAMS, exams);

    // Also update schedules
    const schedules = this.getSchedules();
    schedules.forEach(s => {
      s.token = token;
    });
    this.safeWriteJson(STORAGE_KEYS.SCHEDULES, schedules);

    this.enqueueSync({
      id: `sync-token-${Date.now()}`,
      action: 'upsert_token',
      entityKey: 'token:active',
      examId: '',
      studentId: '',
      payload: {
        token,
        branding: this.getBranding(),
        examIds: exams.map(e => e.id),
        scheduleIds: schedules.map(s => s.id),
      },
      retryCount: 0,
      timestamp: Date.now(),
    });
    window.dispatchEvent(new Event('cbt-exams-change'));
    window.dispatchEvent(new Event('cbt-schedules-change'));

    return token;
  }

  // --- Simulated Network Offline Toggle ---
  public static isSimulatedOffline(): boolean {
    return localStorage.getItem(STORAGE_KEYS.SIMULATED_OFFLINE) === 'true';
  }

  public static setSimulatedOffline(offline: boolean): void {
    localStorage.setItem(STORAGE_KEYS.SIMULATED_OFFLINE, offline ? 'true' : 'false');
    window.dispatchEvent(new Event('cbt-network-change'));
  }

  // --- Session Management ---
  public static getCurrentStudent(): Student | null {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.CURRENT_STUDENT);
      return data ? JSON.parse(data) : null;
    } catch {
      return null;
    }
  }

  public static setCurrentStudent(student: Student | null): void {
    if (student) {
      localStorage.setItem(STORAGE_KEYS.CURRENT_STUDENT, JSON.stringify(student));
    } else {
      localStorage.removeItem(STORAGE_KEYS.CURRENT_STUDENT);
    }
  }

  // --- Item Analysis ---
  public static computeItemAnalysis(examId: string): ItemAnalysis[] {
    const questions = this.getQuestions(examId);
    const submissions = this.getSubmissions(examId);

    if (submissions.length === 0) {
      return questions.map(q => ({
        questionNumber: q.number,
        questionId: q.id,
        type: q.type,
        difficulty: 'Sedang',
        correctPercentage: 0,
        totalAnswered: 0,
        optionDistribution: {},
        discriminatingPower: 0,
      }));
    }

    const sortedSubs = [...submissions].sort((a, b) => b.score - a.score);
    const groupSize = Math.max(1, Math.floor(sortedSubs.length * 0.27));
    const upperGroup = sortedSubs.slice(0, groupSize);
    const lowerGroup = sortedSubs.slice(-groupSize);

    return questions.map(q => {
      let correctCount = 0;
      let totalAnswered = 0;
      const optionDistribution: Record<string, number> = {};

      q.options.forEach(opt => {
        optionDistribution[opt.label] = 0;
      });

      submissions.forEach(sub => {
        const ans = sub.answers[q.id];
        const hasVal =
          ans &&
          ans.selectedOption !== undefined &&
          (Array.isArray(ans.selectedOption)
            ? ans.selectedOption.length > 0
            : String(ans.selectedOption).trim() !== '');

        if (hasVal) {
          totalAnswered++;
          if (q.type !== 'essay' && q.type !== 'short_answer') {
            const selectedIds = Array.isArray(ans.selectedOption)
              ? ans.selectedOption
              : [ans.selectedOption];
            selectedIds.forEach((selId) => {
              const opt = q.options.find(o => o.id === selId);
              if (opt) {
                optionDistribution[opt.label] = (optionDistribution[opt.label] || 0) + 1;
              }
            });
          }

          if (this.evaluateQuestionAnswer(q, ans.selectedOption)) {
            correctCount++;
          }
        }
      });

      const correctPercentage = totalAnswered > 0 ? Math.round((correctCount / totalAnswered) * 100) : 0;

      let difficulty: 'Mudah' | 'Sedang' | 'Sukar' = 'Sedang';
      if (correctPercentage >= 70) difficulty = 'Mudah';
      else if (correctPercentage < 35) difficulty = 'Sukar';

      let upperCorrect = 0;
      let lowerCorrect = 0;
      upperGroup.forEach(s => {
        if (this.evaluateQuestionAnswer(q, s.answers[q.id]?.selectedOption)) upperCorrect++;
      });
      lowerGroup.forEach(s => {
        if (this.evaluateQuestionAnswer(q, s.answers[q.id]?.selectedOption)) lowerCorrect++;
      });
      const dPower = groupSize > 0 ? Number(((upperCorrect - lowerCorrect) / groupSize).toFixed(2)) : 0;

      return {
        questionNumber: q.number,
        questionId: q.id,
        type: q.type,
        difficulty,
        correctPercentage,
        totalAnswered,
        optionDistribution,
        discriminatingPower: Math.max(0, dPower),
      };
    });
  }

  // --- Mass Student Simulation (1000+ Students Demo) ---
  public static simulate1000Students(examId: string): number {
    const exam = this.getExamById(examId) || INITIAL_EXAMS[0];
    const questions = this.getQuestions(exam.id);
    const classes = ['XII MIPA 1', 'XII MIPA 2', 'XII MIPA 3', 'XII IPS 1', 'XII IPS 2'];
    const rooms = ['Lab Komputer 1', 'Lab Komputer 2', 'Lab Komputer 3', 'Ruang A', 'Ruang B'];

    const newSubs: Submission[] = [];
    const count = 100;

    const firstNames = ['Muhammad', 'Ahmad', 'Siti', 'Nur', 'Fathir', 'Rafi', 'Daffa', 'Alifa', 'Nadia', 'Bintang', 'Dimas', 'Zahra', 'Tasya', 'Farhan', 'Bilqis', 'Faris'];
    const lastNames = ['Hidayat', 'Putra', 'Kusuma', 'Pratama', 'Safitri', 'Ramadhani', 'Siregar', 'Wibowo', 'Nugroho', 'Santoso', 'Utami', 'Anwar', 'Permata'];

    for (let i = 1; i <= count; i++) {
      const fName = firstNames[Math.floor(Math.random() * firstNames.length)];
      const lName = lastNames[Math.floor(Math.random() * lastNames.length)];
      const fullName = `${fName} ${lName} ${i}`;
      const nisn = `008${String(1000000 + i).slice(1)}`;
      const className = classes[i % classes.length];
      const room = rooms[i % rooms.length];
      const studentId = `sim-std-${i}`;

      const answers: Record<string, StudentAnswer> = {};
      let score = 0;
      let correctCount = 0;
      let incorrectCount = 0;
      let emptyCount = 0;

      const studentSkill = Math.random();

      questions.forEach((q) => {
        const isAnswered = Math.random() > 0.03;
        if (!isAnswered) {
          emptyCount++;
          return;
        }

        const isCorrect = Math.random() < (studentSkill * 0.7 + 0.25);
        let selectedOptionVal: string | string[] = '';

        if (isCorrect) {
          selectedOptionVal = q.correctAnswer;
          score += q.points;
          correctCount++;
        } else {
          const wrong = q.options.filter(o =>
            Array.isArray(q.correctAnswer)
              ? !q.correctAnswer.includes(o.id)
              : o.id !== q.correctAnswer
          );
          selectedOptionVal =
            wrong[Math.floor(Math.random() * wrong.length)]?.id ||
            q.options[0]?.id ||
            'Jawaban belum tepat';
          incorrectCount++;
        }

        answers[q.id] = {
          questionId: q.id,
          selectedOption: selectedOptionVal,
          isDoubtful: Math.random() < 0.1,
          answeredAt: Date.now() - Math.floor(Math.random() * 3000000),
        };
      });

      const maxScore = questions.reduce((sum, q) => sum + q.points, 0) || 100;
      const percentage = Math.round((score / maxScore) * 100);

      newSubs.push({
        id: `sim-sub-${exam.id}-${studentId}`,
        examId: exam.id,
        studentId,
        studentName: fullName,
        className,
        nisn,
        room,
        answers,
        score,
        maxScore,
        percentage,
        isPassed: percentage >= exam.kkm,
        correctCount,
        incorrectCount,
        emptyCount,
        doubtfulCount: Math.floor(Math.random() * 2),
        startedAt: Date.now() - 3600000,
        finishedAt: Date.now() - Math.floor(Math.random() * 600000),
        durationSecondsUsed: Math.floor(1800 + Math.random() * 1800),
        status: 'completed',
        infractionsCount: Math.random() < 0.08 ? 1 : 0,
        infractionLogs: [],
        syncStatus: 'synced',
        lastSyncedAt: Date.now(),
      });
    }

    const current = this.getSubmissions().filter(s => !s.id.startsWith('sim-sub-'));
    const combined = [...current, ...newSubs];
    localStorage.setItem(STORAGE_KEYS.SUBMISSIONS, JSON.stringify(combined));
    window.dispatchEvent(new Event('cbt-submissions-change'));

    return newSubs.length;
  }
}
