/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import {
  AppBrandingSettings,
  Exam,
  ExamActivity,
  ExamSchedule,
  Question,
  Student,
  StudentClass,
  Subject,
  Submission,
  SupabaseConfig,
  SyncQueueItem,
  Teacher,
} from '../types/cbt';
import { CBTStorageService } from './cbt-storage';

const CONFIG_KEY = 'cbt_supabase_config_v1';

export const DEFAULT_SUPABASE_CONFIG: SupabaseConfig = {
  url: '',
  anonKey: '',
  isConnected: false,
  autoSyncIntervalSec: 15,
  batchSize: 50,
};

export const CBT_SUPABASE_TABLES: { table: string; label: string }[] = [
  { table: 'cbt_branding', label: 'Identitas & Token Sekolah' },
  { table: 'cbt_classes', label: 'Master Kelas' },
  { table: 'cbt_activities', label: 'Aktivitas Ujian' },
  { table: 'cbt_subjects', label: 'Mata Pelajaran' },
  { table: 'cbt_teachers', label: 'Master Guru' },
  { table: 'cbt_students', label: 'Master Siswa' },
  { table: 'cbt_exams', label: 'Paket Ujian' },
  { table: 'cbt_questions', label: 'Bank Soal & Gambar' },
  { table: 'cbt_schedules', label: 'Jadwal Ujian' },
  { table: 'cbt_submissions', label: 'Hasil & Nilai Ujian' },
];

export interface TableHealthStatus {
  table: string;
  label: string;
  ok: boolean;
  status: number;
  error?: string;
}

export interface DatabaseHealthReport {
  connected: boolean;
  tables: TableHealthStatus[];
  missingCount: number;
  authError?: string;
}

export type SupabaseKeyKind =
  | 'empty'
  | 'publishable'
  | 'legacy_anon_jwt'
  | 'service_role_jwt'
  | 'other_jwt'
  | 'secret'
  | 'pat'
  | 'unknown';

export interface SupabaseKeyInspection {
  normalizedUrl: string;
  normalizedKey: string;
  urlProjectRef: string | null;
  keyKind: SupabaseKeyKind;
  keyLength: number;
  maskedPreview: string;
  jwtRef: string | null;
  jwtRole: string | null;
  jwtExpired: boolean;
  refMismatch: boolean;
  formatError: string | null;
}

export const SUPABASE_SQL_MIGRATION = `-- ============================================================
-- SKEMA DATABASE POSTGRESQL SUPABASE - CBT ONLINE MANDIRI
-- Aman dijalankan ulang (Idempotent) & Dioptimalkan untuk Free Tier
-- ============================================================

-- 1. Tabel Identitas Sekolah, Token Aktif & Kredensial Admin
CREATE TABLE IF NOT EXISTS public.cbt_branding (
  id TEXT PRIMARY KEY DEFAULT 'default',
  title1 TEXT NOT NULL DEFAULT '',
  title2 TEXT NOT NULL DEFAULT '',
  title3 TEXT NOT NULL DEFAULT '',
  logo_url TEXT,
  active_token VARCHAR(16) NOT NULL DEFAULT 'MADR26',
  admin_username VARCHAR(80) NOT NULL DEFAULT 'admin',
  admin_password TEXT NOT NULL DEFAULT 'admin',
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.cbt_branding ADD COLUMN IF NOT EXISTS admin_username VARCHAR(80) NOT NULL DEFAULT 'admin';
ALTER TABLE public.cbt_branding ADD COLUMN IF NOT EXISTS admin_password TEXT NOT NULL DEFAULT 'admin';

-- 2. Tabel Master Kelas
CREATE TABLE IF NOT EXISTS public.cbt_classes (
  id TEXT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  grade_level VARCHAR(50) NOT NULL,
  academic_year VARCHAR(30) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Tabel Master Aktivitas Ujian (ASAJ, PTS, PAS, UM, dll)
CREATE TABLE IF NOT EXISTS public.cbt_activities (
  id TEXT PRIMARY KEY,
  code VARCHAR(50) NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Tabel Master Mata Pelajaran
CREATE TABLE IF NOT EXISTS public.cbt_subjects (
  id TEXT PRIMARY KEY,
  code VARCHAR(50) NOT NULL,
  name TEXT NOT NULL,
  category VARCHAR(60),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Tabel Master Guru
CREATE TABLE IF NOT EXISTS public.cbt_teachers (
  id TEXT PRIMARY KEY,
  nip VARCHAR(50) NOT NULL DEFAULT '',
  name VARCHAR(150) NOT NULL,
  subject TEXT NOT NULL DEFAULT '',
  gender VARCHAR(20) NOT NULL DEFAULT 'Laki-laki',
  username VARCHAR(80) NOT NULL,
  password TEXT,
  email VARCHAR(150),
  phone VARCHAR(40),
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_cbt_teachers_username ON public.cbt_teachers(username);

-- 6. Tabel Master Siswa / Peserta
CREATE TABLE IF NOT EXISTS public.cbt_students (
  id TEXT PRIMARY KEY,
  nis VARCHAR(40) NOT NULL DEFAULT '',
  nisn VARCHAR(40) NOT NULL DEFAULT '',
  name VARCHAR(150) NOT NULL,
  class_name VARCHAR(80) NOT NULL,
  room VARCHAR(80) NOT NULL DEFAULT 'Ruang Ujian',
  avatar_url TEXT,
  gender VARCHAR(20) NOT NULL DEFAULT 'Laki-laki',
  created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.cbt_students ADD COLUMN IF NOT EXISTS nis VARCHAR(40) NOT NULL DEFAULT '';
ALTER TABLE public.cbt_students ADD COLUMN IF NOT EXISTS avatar_url TEXT;
ALTER TABLE public.cbt_students DROP CONSTRAINT IF EXISTS cbt_students_nisn_key;
CREATE INDEX IF NOT EXISTS idx_cbt_students_class ON public.cbt_students(class_name);
CREATE INDEX IF NOT EXISTS idx_cbt_students_nis ON public.cbt_students(nis);
CREATE INDEX IF NOT EXISTS idx_cbt_students_nisn ON public.cbt_students(nisn);

-- 7. Tabel Paket Ujian (Exams)
CREATE TABLE IF NOT EXISTS public.cbt_exams (
  id TEXT PRIMARY KEY,
  code VARCHAR(80) NOT NULL,
  title TEXT NOT NULL,
  subject VARCHAR(150) NOT NULL,
  grade_level VARCHAR(80) NOT NULL DEFAULT 'Semua Tingkat',
  academic_year VARCHAR(30) NOT NULL DEFAULT '2025/2026',
  school_name TEXT NOT NULL DEFAULT '',
  duration_minutes INT NOT NULL DEFAULT 90,
  token VARCHAR(16) NOT NULL DEFAULT 'MADR26',
  kkm NUMERIC(5,2) NOT NULL DEFAULT 75.00,
  instructions JSONB DEFAULT '[]'::jsonb,
  randomize_questions BOOLEAN DEFAULT true,
  randomize_options BOOLEAN DEFAULT false,
  total_questions INT NOT NULL DEFAULT 0,
  status VARCHAR(30) NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.cbt_exams DROP CONSTRAINT IF EXISTS cbt_exams_code_key;

-- 8. Tabel Bank Soal, Gambar & Formula (Questions)
CREATE TABLE IF NOT EXISTS public.cbt_questions (
  id TEXT PRIMARY KEY,
  exam_id TEXT NOT NULL REFERENCES public.cbt_exams(id) ON DELETE CASCADE,
  number INT NOT NULL DEFAULT 1,
  type VARCHAR(30) NOT NULL DEFAULT 'single_choice',
  question_text TEXT NOT NULL,
  image_url TEXT,
  formula_latex TEXT,
  options JSONB NOT NULL DEFAULT '[]'::jsonb,
  correct_answer JSONB NOT NULL,
  explanation TEXT,
  points NUMERIC(6,2) NOT NULL DEFAULT 10.00,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.cbt_questions ADD COLUMN IF NOT EXISTS image_url TEXT;
CREATE INDEX IF NOT EXISTS idx_cbt_questions_exam_id ON public.cbt_questions(exam_id);

-- 9. Tabel Jadwal Ujian (Schedules)
CREATE TABLE IF NOT EXISTS public.cbt_schedules (
  id TEXT PRIMARY KEY,
  exam_id TEXT NOT NULL,
  activity_id TEXT NOT NULL,
  activity_name TEXT NOT NULL,
  subject_id TEXT NOT NULL,
  subject_name TEXT NOT NULL,
  material_theme TEXT,
  day_name VARCHAR(30) NOT NULL,
  exam_date VARCHAR(30) NOT NULL,
  start_time VARCHAR(20) NOT NULL,
  end_time VARCHAR(20) NOT NULL,
  duration_minutes INT NOT NULL DEFAULT 90,
  target_classes JSONB NOT NULL DEFAULT '[]'::jsonb,
  token VARCHAR(16) NOT NULL DEFAULT 'MADR26',
  teacher_name TEXT NOT NULL DEFAULT '',
  status VARCHAR(30) NOT NULL DEFAULT 'scheduled',
  created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.cbt_schedules ADD COLUMN IF NOT EXISTS material_theme TEXT;
CREATE INDEX IF NOT EXISTS idx_cbt_schedules_exam_id ON public.cbt_schedules(exam_id);

-- 10. Tabel Hasil & Rekap Nilai Ujian (Submissions)
CREATE TABLE IF NOT EXISTS public.cbt_submissions (
  id TEXT PRIMARY KEY,
  exam_id TEXT NOT NULL,
  student_id TEXT NOT NULL,
  student_name VARCHAR(150) NOT NULL,
  class_name VARCHAR(80) NOT NULL,
  nisn VARCHAR(40) NOT NULL DEFAULT '',
  room VARCHAR(80) NOT NULL DEFAULT '',
  answers JSONB NOT NULL DEFAULT '{}'::jsonb,
  score NUMERIC(8,2) NOT NULL DEFAULT 0,
  max_score NUMERIC(8,2) NOT NULL DEFAULT 100,
  percentage NUMERIC(6,2) NOT NULL DEFAULT 0,
  is_passed BOOLEAN NOT NULL DEFAULT false,
  correct_count INT NOT NULL DEFAULT 0,
  incorrect_count INT NOT NULL DEFAULT 0,
  empty_count INT NOT NULL DEFAULT 0,
  doubtful_count INT NOT NULL DEFAULT 0,
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  finished_at TIMESTAMPTZ,
  duration_seconds_used INT NOT NULL DEFAULT 0,
  status VARCHAR(30) NOT NULL DEFAULT 'completed',
  infractions_count INT NOT NULL DEFAULT 0,
  infraction_logs JSONB NOT NULL DEFAULT '[]'::jsonb,
  synced_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.cbt_submissions DROP CONSTRAINT IF EXISTS cbt_submissions_student_id_fkey;
ALTER TABLE public.cbt_submissions DROP CONSTRAINT IF EXISTS cbt_submissions_exam_id_fkey;
CREATE INDEX IF NOT EXISTS idx_cbt_submissions_exam_score ON public.cbt_submissions(exam_id, score DESC);
CREATE INDEX IF NOT EXISTS idx_cbt_submissions_class ON public.cbt_submissions(class_name);

-- 11. Row Level Security (RLS) & Kebijakan Akses Transaksi Aplikasi CBT
ALTER TABLE public.cbt_branding ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cbt_classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cbt_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cbt_subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cbt_teachers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cbt_students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cbt_exams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cbt_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cbt_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cbt_submissions ENABLE ROW LEVEL SECURITY;

DO $$
DECLARE
  tbl TEXT;
BEGIN
  FOREACH tbl IN ARRAY ARRAY[
    'cbt_branding','cbt_classes','cbt_activities','cbt_subjects',
    'cbt_teachers','cbt_students','cbt_exams','cbt_questions',
    'cbt_schedules','cbt_submissions'
  ]
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS "Allow all select on %I" ON public.%I;', tbl, tbl);
    EXECUTE format('DROP POLICY IF EXISTS "Allow all insert on %I" ON public.%I;', tbl, tbl);
    EXECUTE format('DROP POLICY IF EXISTS "Allow all update on %I" ON public.%I;', tbl, tbl);
    EXECUTE format('DROP POLICY IF EXISTS "Allow all delete on %I" ON public.%I;', tbl, tbl);
    EXECUTE format('CREATE POLICY "Allow all select on %I" ON public.%I FOR SELECT USING (true);', tbl, tbl);
    EXECUTE format('CREATE POLICY "Allow all insert on %I" ON public.%I FOR INSERT WITH CHECK (true);', tbl, tbl);
    EXECUTE format('CREATE POLICY "Allow all update on %I" ON public.%I FOR UPDATE USING (true) WITH CHECK (true);', tbl, tbl);
    EXECUTE format('CREATE POLICY "Allow all delete on %I" ON public.%I FOR DELETE USING (true);', tbl, tbl);
  END LOOP;
END $$;

NOTIFY pgrst, 'reload schema';
`;

export class SupabaseService {
  private static isFlushing = false;
  private static clientCache = new Map<string, SupabaseClient>();

  public static getEnvCredentials(): { url: string; anonKey: string } {
    const envUrl = this.normalizeUrl(import.meta.env?.VITE_SUPABASE_URL || '');
    const envKey = this.sanitizeKey(import.meta.env?.VITE_SUPABASE_ANON_KEY || '');
    return { url: envUrl, anonKey: envKey };
  }

  public static getConfigSource(): 'env' | 'local' | 'none' {
    try {
      const raw = localStorage.getItem(CONFIG_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed?.url && parsed?.anonKey) {
          return 'local';
        }
      }
    } catch {
      // Ignore corrupt config JSON
    }
    const env = this.getEnvCredentials();
    if (env.url && env.anonKey) {
      return 'env';
    }
    return 'none';
  }

  public static sanitizeKey(rawKey: string): string {
    let cleaned = (rawKey || '')
      .replace(/[\u200B-\u200D\u2060\uFEFF\u00A0]/g, '')
      .trim()
      // Strip accidental .env variable assignments or JSON labels copied together
      .replace(
        /^(?:VITE_SUPABASE_ANON_KEY|VITE_SUPABASE_PUBLISHABLE_KEY|NEXT_PUBLIC_SUPABASE_ANON_KEY|NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY|SUPABASE_ANON_KEY|SUPABASE_PUBLISHABLE_KEY|ANON_KEY|PUBLISHABLE_KEY|anonKey|apikey|api_key)\s*[:=]\s*/i,
        ''
      )
      .replace(/^Bearer\s+/i, '')
      .replace(/["'“”‘’`\r\n\s]+/g, '')
      .replace(/[,;]+$/, '');
    return cleaned;
  }

  public static normalizeUrl(rawUrl: string): string {
    let cleaned = (rawUrl || '')
      .replace(/[\u200B-\u200D\u2060\uFEFF\u00A0]/g, '')
      .trim()
      .replace(/^(?:VITE_SUPABASE_URL|NEXT_PUBLIC_SUPABASE_URL|SUPABASE_URL|PROJECT_URL|url)\s*[:=]\s*/i, '')
      .replace(/["'“”‘’`\s]+/g, '')
      .replace(/[,;]+$/, '')
      .replace(/\/+$/, '');
    if (!cleaned) return '';

    // Auto-convert Supabase Dashboard URL (https://supabase.com/dashboard/project/<ref>...) to API URL
    const dashboardMatch = cleaned.match(
      /^https?:\/\/(?:app\.)?supabase\.com\/dashboard\/project\/([a-z0-9-]+)(?:[/?#].*)?$/i
    );
    if (dashboardMatch && dashboardMatch[1]) {
      return `https://${dashboardMatch[1].toLowerCase()}.supabase.co`;
    }

    // Prepend https:// if user pasted bare project host (e.g. abcxyz.supabase.co)
    if (!/^https?:\/\//i.test(cleaned) && /^[a-z0-9-]+\.supabase\.(co|in|net)/i.test(cleaned)) {
      cleaned = `https://${cleaned}`;
    }

    // Strip query params, hash fragments, and accidental /rest/v1, /auth/v1, /storage/v1 suffixes
    cleaned = cleaned.replace(/[?#].*$/, '');
    cleaned = cleaned.replace(/\/(?:rest|auth|storage|realtime)\/v1(?:\/.*)?$/i, '');
    cleaned = cleaned.replace(/\/+$/, '');

    try {
      const parsed = new URL(cleaned);
      return `${parsed.protocol.toLowerCase()}//${parsed.host.toLowerCase()}${parsed.pathname.replace(/\/+$/, '')}`;
    } catch {
      return cleaned;
    }
  }

  public static isJwtKey(key: string): boolean {
    const k = this.sanitizeKey(key);
    return k.startsWith('eyJ') && k.split('.').length === 3;
  }

  public static extractProjectRefFromUrl(rawUrl: string): string | null {
    const cleanUrl = this.normalizeUrl(rawUrl);
    const match = cleanUrl.match(/^https?:\/\/([a-z0-9-]+)\.supabase\.(?:co|in|net)/i);
    return match?.[1] ? match[1].toLowerCase() : null;
  }

  public static inspectCredentials(rawUrl: string, rawKey: string): SupabaseKeyInspection {
    const normalizedUrl = this.normalizeUrl(rawUrl);
    const normalizedKey = this.sanitizeKey(rawKey);
    const urlProjectRef = this.extractProjectRefFromUrl(normalizedUrl);
    const keyLength = normalizedKey.length;

    const maskedPreview =
      keyLength === 0
        ? '-'
        : keyLength <= 18
        ? `${normalizedKey.slice(0, 6)}••••`
        : `${normalizedKey.slice(0, 14)}••••${normalizedKey.slice(-4)}`;

    let keyKind: SupabaseKeyKind = 'unknown';
    let jwtRef: string | null = null;
    let jwtRole: string | null = null;
    let jwtExpired = false;
    let refMismatch = false;

    if (!normalizedKey) {
      keyKind = 'empty';
    } else if (normalizedKey.startsWith('sb_publishable_')) {
      keyKind = 'publishable';
    } else if (normalizedKey.startsWith('sb_secret_')) {
      keyKind = 'secret';
    } else if (normalizedKey.startsWith('sbp_')) {
      keyKind = 'pat';
    } else if (this.isJwtKey(normalizedKey)) {
      keyKind = 'other_jwt';
      try {
        const part = normalizedKey.split('.')[1];
        const base64 = part.replace(/-/g, '+').replace(/_/g, '/');
        const padded = base64 + '='.repeat((4 - (base64.length % 4)) % 4);
        const payload = JSON.parse(atob(padded));
        if (typeof payload?.ref === 'string') {
          jwtRef = payload.ref.toLowerCase();
        }
        if (typeof payload?.role === 'string') {
          jwtRole = payload.role;
        }
        if (typeof payload?.exp === 'number') {
          jwtExpired = payload.exp * 1000 < Date.now();
        }
        if (jwtRole === 'anon') {
          keyKind = 'legacy_anon_jwt';
        } else if (jwtRole === 'service_role') {
          keyKind = 'service_role_jwt';
        }
        if (jwtRef && urlProjectRef && jwtRef !== urlProjectRef) {
          refMismatch = true;
        }
      } catch {
        // Malformed JWT payload
      }
    }

    const formatError = this.validateKeyFormat(normalizedUrl, normalizedKey, {
      keyKind,
      jwtRef,
      jwtRole,
      jwtExpired,
      urlProjectRef,
    });

    return {
      normalizedUrl,
      normalizedKey,
      urlProjectRef,
      keyKind,
      keyLength,
      maskedPreview,
      jwtRef,
      jwtRole,
      jwtExpired,
      refMismatch,
      formatError,
    };
  }

  private static validateKeyFormat(
    cleanUrl: string,
    cleanKey: string,
    precomputed?: {
      keyKind: SupabaseKeyKind;
      jwtRef: string | null;
      jwtRole: string | null;
      jwtExpired: boolean;
      urlProjectRef: string | null;
    }
  ): string | null {
    if (!cleanKey) {
      return 'API Key Supabase belum diisi.';
    }
    if (cleanKey.startsWith('sb_secret_')) {
      return 'Jangan gunakan Secret Key (sb_secret_...). Buka Project Settings -> API Keys -> salin Publishable Key (sb_publishable_...) atau Legacy anon public key (eyJ...).';
    }
    if (cleanKey.startsWith('sbp_')) {
      return 'Anda memasukkan Personal Access Token (sbp_...). Itu token akun Dashboard, bukan API Key proyek. Buka Project Settings -> API Keys lalu salin Publishable Key (sb_publishable_...) atau Legacy anon key (eyJ...).';
    }
    if (cleanKey.length < 20) {
      return `API Key terlalu pendek (${cleanKey.length} karakter). Kemungkinan terpotong saat menyalin atau terisi otomatis oleh password browser. Salin ulang seluruh Publishable Key (sb_publishable_...) atau Legacy anon key (eyJ...).`;
    }

    if (cleanKey.startsWith('sb_publishable_')) {
      if (cleanKey.length < 28 || !/^sb_publishable_[A-Za-z0-9._-]+$/.test(cleanKey)) {
        return 'Format Publishable Key (sb_publishable_...) tampak tidak lengkap atau mengandung karakter asing. Salin ulang langsung menggunakan tombol Copy di Supabase Dashboard.';
      }
      return null;
    }

    if (this.isJwtKey(cleanKey)) {
      const role = precomputed?.jwtRole;
      const ref = precomputed?.jwtRef;
      const expired = precomputed?.jwtExpired;
      const urlRef = precomputed?.urlProjectRef ?? this.extractProjectRefFromUrl(cleanUrl);

      if (!role || !ref) {
        try {
          const part = cleanKey.split('.')[1];
          const base64 = part.replace(/-/g, '+').replace(/_/g, '/');
          const padded = base64 + '='.repeat((4 - (base64.length % 4)) % 4);
          const payload = JSON.parse(atob(padded));
          if (payload?.role === 'service_role') {
            return 'Jangan gunakan Service Role Key di browser! Gunakan Publishable Key (sb_publishable_...) atau Legacy anon public key (role: anon).';
          }
          if (payload?.ref && urlRef && String(payload.ref).toLowerCase() !== urlRef) {
            return `URL dan API Key berasal dari proyek Supabase yang berbeda! URL mengarah ke proyek "${urlRef}", sedangkan API Key berasal dari proyek "${payload.ref}".`;
          }
          if (typeof payload?.exp === 'number' && payload.exp * 1000 < Date.now()) {
            return 'Legacy anon key (JWT) ini sudah kedaluwarsa (expired). Salin kunci terbaru atau gunakan Publishable Key (sb_publishable_...) dari Project Settings -> API Keys.';
          }
        } catch {
          return 'Token JWT (eyJ...) gagal dibaca atau terpotong. Salin ulang Legacy anon key secara utuh.';
        }
      } else {
        if (role === 'service_role') {
          return 'Jangan gunakan Service Role Key di browser! Gunakan Publishable Key (sb_publishable_...) atau Legacy anon public key (role: anon).';
        }
        if (ref && urlRef && ref !== urlRef) {
          return `URL dan API Key berasal dari proyek Supabase yang berbeda! URL mengarah ke proyek "${urlRef}", sedangkan API Key berasal dari proyek "${ref}".`;
        }
        if (expired) {
          return 'Legacy anon key (JWT) ini sudah kedaluwarsa (expired). Salin kunci terbaru atau gunakan Publishable Key (sb_publishable_...) dari Project Settings -> API Keys.';
        }
      }
      return null;
    }

    return `Format API Key tidak dikenali (${cleanKey.length} karakter, bukan "sb_publishable_..." maupun "eyJ..."). Pastikan Anda menyalin API Key publik proyek, bukan Key ID (UUID) atau JWT Secret.`;
  }

  private static getClient(customUrl?: string, customKey?: string): SupabaseClient | null {
    const cfg = this.getConfig();
    const cleanUrl = this.normalizeUrl(customUrl !== undefined ? customUrl : cfg.url);
    const cleanKey = this.sanitizeKey(customKey !== undefined ? customKey : cfg.anonKey);
    if (!cleanUrl || !cleanKey) return null;

    const cacheKey = `${cleanUrl}::${cleanKey}`;
    const cached = this.clientCache.get(cacheKey);
    if (cached) return cached;

    // New Supabase Publishable keys (`sb_publishable_...`) are NOT JWTs and must be sent only
    // in the `apikey` header (never as `Authorization: Bearer sb_publishable_...`).
    const isPublishableKey = cleanKey.startsWith('sb_publishable_');
    const customFetch: typeof fetch | undefined = isPublishableKey
      ? (input, init) => {
          const headers = new Headers(init?.headers);
          if (headers.get('Authorization') === `Bearer ${cleanKey}`) {
            headers.delete('Authorization');
          }
          return fetch(input, { ...init, headers });
        }
      : undefined;

    const client = createClient(cleanUrl, cleanKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false,
      },
      ...(customFetch ? { global: { fetch: customFetch } } : {}),
    });
    this.clientCache.set(cacheKey, client);
    return client;
  }

  public static getConfig(): SupabaseConfig {
    let localCfg: Partial<SupabaseConfig> = {};
    try {
      const data = localStorage.getItem(CONFIG_KEY);
      if (data) {
        const parsed = JSON.parse(data);
        if (parsed && typeof parsed === 'object') {
          localCfg = parsed;
        }
      }
    } catch {
      localStorage.removeItem(CONFIG_KEY);
    }

    const env = this.getEnvCredentials();
    const effectiveUrl = this.normalizeUrl(localCfg.url || env.url || '');
    const effectiveKey = this.sanitizeKey(localCfg.anonKey || env.anonKey || '');
    const hasEnv = Boolean(env.url && env.anonKey);

    return {
      ...DEFAULT_SUPABASE_CONFIG,
      ...localCfg,
      url: effectiveUrl,
      anonKey: effectiveKey,
      isConnected:
        localCfg.url && localCfg.anonKey
          ? Boolean(localCfg.isConnected)
          : hasEnv
          ? true
          : false,
    };
  }

  public static saveConfig(config: Partial<SupabaseConfig>): SupabaseConfig {
    const current = this.getConfig();
    const updated: SupabaseConfig = {
      ...current,
      ...config,
      url: this.normalizeUrl(config.url !== undefined ? config.url : current.url),
      anonKey: this.sanitizeKey(config.anonKey !== undefined ? config.anonKey : current.anonKey),
    };
    this.clientCache.clear();
    try {
      localStorage.setItem(CONFIG_KEY, JSON.stringify(updated));
    } catch {
      // Ignore storage quota error
    }
    window.dispatchEvent(new Event('cbt-supabase-config-change'));
    return updated;
  }

  public static resetConfig(): SupabaseConfig {
    this.clientCache.clear();
    try {
      localStorage.removeItem(CONFIG_KEY);
    } catch {
      // Ignore storage error
    }
    window.dispatchEvent(new Event('cbt-supabase-config-change'));
    return this.getConfig();
  }

  // --- Row Mappers (CamelCase <-> SnakeCase PostgreSQL) ---
  private static toDbBranding(b: AppBrandingSettings, activeToken: string, includeAdminCreds = true) {
    const base: Record<string, any> = {
      id: 'default',
      title1: b.title1 || '',
      title2: b.title2 || '',
      title3: b.title3 || '',
      logo_url: b.logoUrl || null,
      active_token: activeToken || 'MADR26',
      updated_at: new Date().toISOString(),
    };
    if (includeAdminCreds) {
      base.admin_username = (b.adminUsername || 'admin').trim();
      base.admin_password = (b.adminPassword || 'admin').trim();
    }
    return base;
  }

  private static fromDbBranding(row: any): { branding: AppBrandingSettings; activeToken: string } | null {
    if (!row || typeof row !== 'object') return null;
    return {
      branding: {
        title1: String(row.title1 || ''),
        title2: String(row.title2 || ''),
        title3: String(row.title3 || ''),
        logoUrl: row.logo_url || undefined,
        adminUsername: row.admin_username ? String(row.admin_username).trim() : undefined,
        adminPassword: row.admin_password ? String(row.admin_password) : undefined,
      },
      activeToken: String(row.active_token || 'MADR26'),
    };
  }

  private static async upsertBrandingSafe(
    config: SupabaseConfig,
    branding: AppBrandingSettings,
    activeToken: string
  ): Promise<{ ok: boolean; error?: string }> {
    const res = await this.upsertRows(config, 'cbt_branding', [
      this.toDbBranding(branding, activeToken, true),
    ]);
    if (res.ok) return res;
    // Fallback if cbt_branding table hasn't added admin_username/admin_password columns yet
    if (res.error && (res.error.includes('400') || res.error.includes('PGRST204') || res.error.includes('admin_'))) {
      return await this.upsertRows(config, 'cbt_branding', [
        this.toDbBranding(branding, activeToken, false),
      ]);
    }
    return res;
  }

  public static async pullBrandingOnly(): Promise<void> {
    const config = this.getConfig();
    if (!config.isConnected || !config.url || !config.anonKey) return;
    if (CBTStorageService.isSimulatedOffline()) return;
    if (typeof navigator !== 'undefined' && !navigator.onLine) return;
    const rows = await this.fetchTable(config, 'cbt_branding');
    if (rows && rows.length > 0) {
      const parsed = this.fromDbBranding(rows[0]);
      if (parsed) {
        CBTStorageService.applyRemoteSnapshot({
          branding: parsed.branding,
          activeToken: parsed.activeToken,
        });
      }
    }
  }

  public static async pullTeachersOnly(): Promise<void> {
    const config = this.getConfig();
    if (!config.isConnected || !config.url || !config.anonKey) return;
    if (CBTStorageService.isSimulatedOffline()) return;
    if (typeof navigator !== 'undefined' && !navigator.onLine) return;
    const rows = await this.fetchTable(config, 'cbt_teachers');
    if (rows && rows.length > 0) {
      const teachers = rows.map(r => this.fromDbTeacher(r));
      CBTStorageService.applyRemoteSnapshot({ teachers });
    }
  }

  private static toDbClass(c: StudentClass) {
    return {
      id: c.id,
      name: c.name,
      grade_level: c.gradeLevel,
      academic_year: c.academicYear,
    };
  }

  private static fromDbClass(row: any): StudentClass {
    return {
      id: String(row.id),
      name: String(row.name || ''),
      gradeLevel: String(row.grade_level || 'Kelas XII'),
      academicYear: String(row.academic_year || '2025/2026'),
    };
  }

  private static toDbActivity(a: ExamActivity) {
    return {
      id: a.id,
      code: a.code,
      name: a.name,
      description: a.description || null,
    };
  }

  private static fromDbActivity(row: any): ExamActivity {
    return {
      id: String(row.id),
      code: String(row.code || ''),
      name: String(row.name || ''),
      description: row.description || undefined,
    };
  }

  private static toDbSubject(s: Subject) {
    return {
      id: s.id,
      code: s.code,
      name: s.name,
      category: s.category || null,
    };
  }

  private static fromDbSubject(row: any): Subject {
    return {
      id: String(row.id),
      code: String(row.code || ''),
      name: String(row.name || ''),
      category: row.category || undefined,
    };
  }

  private static toDbTeacher(t: Teacher) {
    return {
      id: t.id,
      nip: t.nip || '',
      name: t.name,
      subject: t.subject || '',
      gender: t.gender || 'Laki-laki',
      username: t.username || '',
      password: t.password || null,
      email: t.email || null,
      phone: t.phone || null,
    };
  }

  private static fromDbTeacher(row: any): Teacher {
    return {
      id: String(row.id),
      nip: String(row.nip || ''),
      name: String(row.name || ''),
      subject: String(row.subject || ''),
      gender: row.gender === 'Perempuan' ? 'Perempuan' : 'Laki-laki',
      username: String(row.username || ''),
      password: row.password || undefined,
      email: row.email || undefined,
      phone: row.phone || undefined,
    };
  }

  private static toDbStudent(s: Student) {
    return {
      id: s.id,
      nis: s.nis || '',
      nisn: s.nisn || '',
      name: s.name,
      class_name: s.className,
      room: s.room || 'Lab Komputer 1',
      avatar_url: s.avatarUrl || null,
      gender: s.gender || 'Laki-laki',
    };
  }

  private static fromDbStudent(row: any): Student {
    return {
      id: String(row.id),
      nis: String(row.nis || ''),
      nisn: String(row.nisn || ''),
      name: String(row.name || ''),
      className: String(row.class_name || ''),
      room: String(row.room || 'Ruang Ujian'),
      avatarUrl: row.avatar_url || undefined,
      gender: row.gender === 'Perempuan' || row.gender === 'P' ? 'Perempuan' : 'Laki-laki',
    };
  }

  private static toDbExam(e: Exam) {
    return {
      id: e.id,
      code: e.code,
      title: e.title,
      subject: e.subject,
      grade_level: e.gradeLevel,
      academic_year: e.academicYear,
      school_name: e.schoolName,
      duration_minutes: Number(e.durationMinutes) || 90,
      token: e.token || 'MADR26',
      kkm: Number(e.kkm) || 75,
      instructions: Array.isArray(e.instructions) ? e.instructions : [],
      randomize_questions: Boolean(e.randomizeQuestions),
      randomize_options: Boolean(e.randomizeOptions),
      total_questions: Number(e.totalQuestions) || 0,
      status: e.status || 'active',
      created_at: e.createdAt || new Date().toISOString(),
    };
  }

  private static fromDbExam(row: any): Exam {
    return {
      id: String(row.id),
      code: String(row.code || ''),
      title: String(row.title || ''),
      subject: String(row.subject || ''),
      gradeLevel: String(row.grade_level || ''),
      academicYear: String(row.academic_year || '2025/2026'),
      schoolName: String(row.school_name || ''),
      durationMinutes: Number(row.duration_minutes) || 90,
      token: String(row.token || 'MADR26'),
      kkm: Number(row.kkm) || 75,
      instructions: Array.isArray(row.instructions) ? row.instructions : [],
      randomizeQuestions: Boolean(row.randomize_questions),
      randomizeOptions: Boolean(row.randomize_options),
      totalQuestions: Number(row.total_questions) || 0,
      status: row.status === 'draft' || row.status === 'completed' ? row.status : 'active',
      createdAt: String(row.created_at || new Date().toISOString()),
    };
  }

  private static toDbQuestion(q: Question) {
    const serializedFormula = q.essayOptions
      ? `__ESSAY_CFG__:${JSON.stringify(q.essayOptions)}`
      : q.formulaLatex || null;

    return {
      id: q.id,
      exam_id: q.examId,
      number: Number(q.number) || 1,
      type: q.type || 'single_choice',
      question_text: q.questionText || '',
      image_url: q.imageUrl || null,
      formula_latex: serializedFormula,
      options: Array.isArray(q.options) ? q.options : [],
      correct_answer: q.correctAnswer ?? '',
      explanation: q.explanation || null,
      points: Number(q.points) || 10,
    };
  }

  private static fromDbQuestion(row: any): Question {
    const rawFormula = typeof row.formula_latex === 'string' ? row.formula_latex : '';
    let essayOptions: Question['essayOptions'] = undefined;
    let formulaLatex: string | undefined = rawFormula || undefined;

    if (rawFormula.startsWith('__ESSAY_CFG__:')) {
      try {
        const parsed = JSON.parse(rawFormula.slice('__ESSAY_CFG__:'.length));
        if (parsed && typeof parsed === 'object') {
          essayOptions = {
            inputMode: parsed.inputMode === 'short' ? 'short' : 'long',
            matchMode:
              parsed.matchMode === 'exact'
                ? 'exact'
                : parsed.matchMode === 'manual'
                ? 'manual'
                : 'contains',
          };
          formulaLatex = undefined;
        }
      } catch {
        // Ignore malformed config
      }
    }

    return {
      id: String(row.id),
      examId: String(row.exam_id || ''),
      number: Number(row.number) || 1,
      type: row.type || 'single_choice',
      questionText: String(row.question_text || ''),
      imageUrl: row.image_url || undefined,
      formulaLatex,
      options: Array.isArray(row.options) ? row.options : [],
      correctAnswer: row.correct_answer ?? '',
      essayOptions,
      explanation: row.explanation || undefined,
      points: Number(row.points) || 10,
    };
  }

  private static toDbSchedule(s: ExamSchedule) {
    return {
      id: s.id,
      exam_id: s.examId,
      activity_id: s.activityId,
      activity_name: s.activityName,
      subject_id: s.subjectId,
      subject_name: s.subjectName,
      material_theme: s.materialTheme || null,
      day_name: s.dayName,
      exam_date: s.examDate,
      start_time: s.startTime,
      end_time: s.endTime,
      duration_minutes: Number(s.durationMinutes) || 90,
      target_classes: Array.isArray(s.targetClasses) ? s.targetClasses : [],
      token: s.token || 'MADR26',
      teacher_name: s.teacherName || '',
      status: s.status || 'scheduled',
    };
  }

  private static fromDbSchedule(row: any): ExamSchedule {
    return {
      id: String(row.id),
      examId: String(row.exam_id || ''),
      activityId: String(row.activity_id || ''),
      activityName: String(row.activity_name || ''),
      subjectId: String(row.subject_id || ''),
      subjectName: String(row.subject_name || ''),
      materialTheme: row.material_theme || undefined,
      dayName: String(row.day_name || ''),
      examDate: String(row.exam_date || ''),
      startTime: String(row.start_time || ''),
      endTime: String(row.end_time || ''),
      durationMinutes: Number(row.duration_minutes) || 90,
      targetClasses: Array.isArray(row.target_classes) ? row.target_classes : [],
      token: String(row.token || 'MADR26'),
      teacherName: String(row.teacher_name || ''),
      status:
        row.status === 'in_progress' || row.status === 'completed' ? row.status : 'scheduled',
    };
  }

  private static toDbSubmission(sub: Submission) {
    return {
      id: sub.id,
      exam_id: sub.examId,
      student_id: sub.studentId,
      student_name: sub.studentName,
      class_name: sub.className,
      nisn: sub.nisn || '',
      room: sub.room || '',
      answers: sub.answers || {},
      score: Number(sub.score) || 0,
      max_score: Number(sub.maxScore) || 100,
      percentage: Number(sub.percentage) || 0,
      is_passed: Boolean(sub.isPassed),
      correct_count: Number(sub.correctCount) || 0,
      incorrect_count: Number(sub.incorrectCount) || 0,
      empty_count: Number(sub.emptyCount) || 0,
      doubtful_count: Number(sub.doubtfulCount) || 0,
      started_at: new Date(sub.startedAt || Date.now()).toISOString(),
      finished_at: sub.finishedAt ? new Date(sub.finishedAt).toISOString() : null,
      duration_seconds_used: Number(sub.durationSecondsUsed) || 0,
      status: sub.status || 'completed',
      infractions_count: Number(sub.infractionsCount) || 0,
      infraction_logs: Array.isArray(sub.infractionLogs) ? sub.infractionLogs : [],
      synced_at: new Date().toISOString(),
    };
  }

  private static fromDbSubmission(row: any): Submission {
    return {
      id: String(row.id),
      examId: String(row.exam_id || ''),
      studentId: String(row.student_id || ''),
      studentName: String(row.student_name || ''),
      className: String(row.class_name || ''),
      nisn: String(row.nisn || ''),
      room: String(row.room || ''),
      answers: row.answers && typeof row.answers === 'object' ? row.answers : {},
      score: Number(row.score) || 0,
      maxScore: Number(row.max_score) || 100,
      percentage: Number(row.percentage) || 0,
      isPassed: Boolean(row.is_passed),
      correctCount: Number(row.correct_count) || 0,
      incorrectCount: Number(row.incorrect_count) || 0,
      emptyCount: Number(row.empty_count) || 0,
      doubtfulCount: Number(row.doubtful_count) || 0,
      startedAt: row.started_at ? new Date(row.started_at).getTime() : Date.now(),
      finishedAt: row.finished_at ? new Date(row.finished_at).getTime() : undefined,
      durationSecondsUsed: Number(row.duration_seconds_used) || 0,
      status:
        row.status === 'in_progress' || row.status === 'terminated' ? row.status : 'completed',
      infractionsCount: Number(row.infractions_count) || 0,
      infractionLogs: Array.isArray(row.infraction_logs) ? row.infraction_logs : [],
      syncStatus: 'synced',
      lastSyncedAt: row.synced_at ? new Date(row.synced_at).getTime() : Date.now(),
    };
  }

  // --- Low-level SDK Helpers (@supabase/supabase-js) ---
  private static async upsertRows(
    config: SupabaseConfig,
    table: string,
    rows: any[],
    chunkSize = 50
  ): Promise<{ ok: boolean; error?: string }> {
    if (rows.length === 0) return { ok: true };
    const client = this.getClient(config.url, config.anonKey);
    if (!client) {
      return { ok: false, error: `Konfigurasi Supabase belum lengkap (${table}).` };
    }

    for (let i = 0; i < rows.length; i += chunkSize) {
      const chunk = rows.slice(i, i + chunkSize);
      const { error, status } = await client.from(table).upsert(chunk, { onConflict: 'id' });
      if (error) {
        const detail = [error.message, error.hint].filter(Boolean).join(' — ');
        return {
          ok: false,
          error: `HTTP ${status || 400} (${table}): ${detail.slice(0, 180)}`,
        };
      }
    }

    return { ok: true };
  }

  private static async deleteById(
    config: SupabaseConfig,
    table: string,
    id: string
  ): Promise<boolean> {
    const client = this.getClient(config.url, config.anonKey);
    if (!client) return false;
    const { error, status } = await client.from(table).delete().eq('id', id);
    return !error || status === 404;
  }

  private static async fetchTable(config: SupabaseConfig, table: string): Promise<any[] | null> {
    const client = this.getClient(config.url, config.anonKey);
    if (!client) return null;
    const pageSize = 1000;
    const allRows: any[] = [];
    let offset = 0;

    try {
      while (true) {
        const { data, error } = await client
          .from(table)
          .select('*')
          .range(offset, offset + pageSize - 1);
        if (error || !Array.isArray(data)) {
          return offset === 0 ? null : allRows;
        }
        allRows.push(...data);
        if (data.length < pageSize) {
          break;
        }
        offset += pageSize;
      }
      return allRows;
    } catch {
      return allRows.length > 0 ? allRows : null;
    }
  }

  /**
   * Direct single-student lookup by NIS/NISN against PostgreSQL indexes.
   * Returns in ~100ms regardless of total student count (850 to 50,000+).
   */
  public static async findStudentByNisRemote(nis: string): Promise<Student | null> {
    const trimmed = (nis || '').trim();
    if (!trimmed) return null;

    const config = this.getConfig();
    if (!config.isConnected || !config.url || !config.anonKey) return null;
    if (CBTStorageService.isSimulatedOffline()) return null;
    if (typeof navigator !== 'undefined' && !navigator.onLine) return null;

    const client = this.getClient(config.url, config.anonKey);
    if (!client) return null;

    const safe = trimmed.replace(/"/g, '\\"');
    try {
      const { data } = await client
        .from('cbt_students')
        .select('*')
        .or(`nis.eq."${safe}",nisn.eq."${safe}"`)
        .limit(1);
      if (Array.isArray(data) && data.length > 0) {
        return this.fromDbStudent(data[0]);
      }

      const { data: ilikeData } = await client
        .from('cbt_students')
        .select('*')
        .or(`nis.ilike."${safe}",nisn.ilike."${safe}"`)
        .limit(1);
      if (Array.isArray(ilikeData) && ilikeData.length > 0) {
        return this.fromDbStudent(ilikeData[0]);
      }
      return null;
    } catch {
      return null;
    }
  }

  /**
   * Test direct connectivity to the user's Supabase project via official SDK.
   */
  public static async testConnection(
    url: string,
    anonKey: string
  ): Promise<{
    success: boolean;
    message: string;
    normalizedUrl?: string;
    normalizedKey?: string;
    tablesMissing?: boolean;
  }> {
    if (!url || !anonKey) {
      return {
        success: false,
        message: 'URL Proyek Supabase dan Publishable / Anon Key wajib diisi.',
      };
    }

    const inspection = this.inspectCredentials(url, anonKey);
    const cleanUrl = inspection.normalizedUrl;
    const cleanKey = inspection.normalizedKey;

    if (!/^https?:\/\/[a-z0-9.-]+/i.test(cleanUrl)) {
      return {
        success: false,
        normalizedUrl: cleanUrl,
        normalizedKey: cleanKey,
        message: 'Format Supabase Project URL tidak valid. Contoh benar: https://kodeproyek.supabase.co',
      };
    }

    if (inspection.formatError) {
      return {
        success: false,
        normalizedUrl: cleanUrl,
        normalizedKey: cleanKey,
        message: inspection.formatError,
      };
    }

    try {
      const client = this.getClient(cleanUrl, cleanKey);
      if (!client) {
        return {
          success: false,
          normalizedUrl: cleanUrl,
          normalizedKey: cleanKey,
          message: 'Gagal menginisialisasi klien Supabase.',
        };
      }

      const { error, status } = await client.from('cbt_branding').select('id').limit(1);

      if (!error) {
        this.saveConfig({ url: cleanUrl, anonKey: cleanKey, isConnected: true });
        return {
          success: true,
          normalizedUrl: cleanUrl,
          normalizedKey: cleanKey,
          message:
            'Berhasil terhubung ke Supabase PostgreSQL! Silakan periksa status 10 tabel di bawah.',
        };
      }

      const errMsg = String(error.message || '');
      const errHint = String(error.hint || '');
      const errCode = String(error.code || '');
      const isMissingTable =
        errCode === 'PGRST205' ||
        errMsg.toLowerCase().includes('cbt_branding') ||
        errMsg.toLowerCase().includes('schema cache') ||
        errMsg.toLowerCase().includes('could not find the table');

      if (isMissingTable) {
        this.saveConfig({ url: cleanUrl, anonKey: cleanKey, isConnected: true });
        return {
          success: true,
          tablesMissing: true,
          normalizedUrl: cleanUrl,
          normalizedKey: cleanKey,
          message:
            'Koneksi & API Key VALID! Namun 10 tabel CBT belum dibuat di Supabase — silakan klik "Salin Script SQL" di bawah, tempel di menu SQL Editor Supabase, lalu klik Run.',
        };
      }

      const isPublishable = cleanKey.startsWith('sb_publishable_');
      const authHeaders: Record<string, string> = isPublishable
        ? { apikey: cleanKey }
        : { apikey: cleanKey, Authorization: `Bearer ${cleanKey}` };

      if (status === 404) {
        const authProbe = await fetch(`${cleanUrl}/auth/v1/settings`, {
          method: 'GET',
          headers: authHeaders,
        }).catch(() => null);

        if (authProbe && authProbe.ok) {
          return {
            success: false,
            normalizedUrl: cleanUrl,
            normalizedKey: cleanKey,
            message:
              'URL & API Key valid, tetapi Data API (REST) merespons 404. Buka Supabase -> Project Settings -> Data API, pastikan "Enable Data API" aktif dan "public" ada di Exposed schemas.',
          };
        }

        return {
          success: false,
          normalizedUrl: cleanUrl,
          normalizedKey: cleanKey,
          message:
            'Endpoint REST Supabase tidak ditemukan (HTTP 404). Pastikan Project URL berformat https://kodeproyek.supabase.co dan proyek tidak sedang paused.',
        };
      }

      if (
        status === 401 ||
        status === 403 ||
        errCode === 'PGRST301' ||
        errMsg.toLowerCase().includes('invalid api key') ||
        errMsg.toLowerCase().includes('jwt')
      ) {
        // Ensure failed auth doesn't remain flagged as connected
        this.saveConfig({ url: cleanUrl, anonKey: cleanKey, isConnected: false });

        // Also probe Auth gateway to verify if Gateway itself rejects apikey
        const authProbe = await fetch(`${cleanUrl}/auth/v1/settings`, {
          method: 'GET',
          headers: authHeaders,
        }).catch(() => null);

        const authStatus = authProbe?.status || status || 401;
        const refLabel = inspection.urlProjectRef ? `"${inspection.urlProjectRef}"` : cleanUrl;

        let reasonHint = '';
        if (inspection.keyKind === 'publishable') {
          reasonHint =
            `Server Supabase (proyek ${refLabel}) menolak Publishable Key Anda (${inspection.keyLength} karakter, awalan ${cleanKey.slice(0, 18)}...). Kemungkinan besar: (1) Key tersebut berasal dari proyek Supabase yang BERBEDA dengan URL ${refLabel}, atau (2) Key sudah di-rotate/dihapus di Dashboard Supabase.`;
        } else if (inspection.keyKind === 'legacy_anon_jwt') {
          reasonHint =
            `Server Supabase (proyek ${refLabel}) menolak Legacy anon key (${inspection.keyLength} karakter). Kemungkinan besar: (1) Fitur "Legacy anon, service_role API keys" sedang NONAKTIF (Disabled) di Dashboard Supabase -> Project Settings -> API Keys (aktifkan lagi atau salin Publishable Key "sb_publishable_..."), atau (2) JWT Secret pernah di-rotate.`;
        } else {
          reasonHint = `Server Supabase (proyek ${refLabel}) menolak API Key yang dikirim (HTTP ${authStatus}).`;
        }

        const detail = [errMsg, errHint].filter(Boolean).join(' — ');
        return {
          success: false,
          normalizedUrl: cleanUrl,
          normalizedKey: cleanKey,
          message: `Autentikasi gagal (HTTP ${status || 401}). ${reasonHint} Detail server: ${detail.slice(0, 160)}`,
        };
      }

      return {
        success: false,
        normalizedUrl: cleanUrl,
        normalizedKey: cleanKey,
        message: `Koneksi Supabase merespons error (HTTP ${status || '?'}): ${errMsg.slice(0, 160)}`,
      };
    } catch (err: any) {
      return {
        success: false,
        normalizedUrl: cleanUrl,
        normalizedKey: cleanKey,
        message: `Gagal menjangkau server Supabase: ${err?.message || 'Network error'}. Pastikan URL valid, proyek tidak paused, dan koneksi internet aktif.`,
      };
    }
  }

  /**
   * Probe all 10 PostgreSQL tables via official SDK to verify migration readiness.
   */
  public static async checkDatabaseHealth(
    customUrl?: string,
    customAnonKey?: string
  ): Promise<DatabaseHealthReport> {
    const config = this.getConfig();
    const inspection = this.inspectCredentials(
      customUrl !== undefined ? customUrl : config.url,
      customAnonKey !== undefined ? customAnonKey : config.anonKey
    );
    const url = inspection.normalizedUrl;
    const anonKey = inspection.normalizedKey;

    if (!url || !anonKey) {
      return {
        connected: false,
        authError: 'Kredensial Supabase (Project URL & API Key) belum diisi.',
        tables: CBT_SUPABASE_TABLES.map(t => ({
          ...t,
          ok: false,
          status: 0,
          error: 'Kredensial Supabase belum diisi',
        })),
        missingCount: CBT_SUPABASE_TABLES.length,
      };
    }

    if (inspection.formatError) {
      return {
        connected: false,
        authError: inspection.formatError,
        tables: CBT_SUPABASE_TABLES.map(t => ({
          ...t,
          ok: false,
          status: 401,
          error: 'API Key tidak valid',
        })),
        missingCount: CBT_SUPABASE_TABLES.length,
      };
    }

    const client = this.getClient(url, anonKey);
    if (!client) {
      return {
        connected: false,
        authError: 'Konfigurasi Supabase tidak valid.',
        tables: CBT_SUPABASE_TABLES.map(t => ({
          ...t,
          ok: false,
          status: 0,
          error: 'Konfigurasi tidak valid',
        })),
        missingCount: CBT_SUPABASE_TABLES.length,
      };
    }

    const results = await Promise.all(
      CBT_SUPABASE_TABLES.map(async (entry): Promise<TableHealthStatus> => {
        try {
          const { error, status } = await client.from(entry.table).select('id').limit(1);
          if (!error) {
            return { ...entry, ok: true, status: status || 200 };
          }
          const msg = String(error.message || '');
          const code = String(error.code || '');
          let errorLabel = msg.slice(0, 120);
          if (
            code === 'PGRST205' ||
            status === 404 ||
            msg.toLowerCase().includes('schema cache') ||
            msg.toLowerCase().includes('could not find the table')
          ) {
            errorLabel = 'Tabel belum dibuat';
          } else if (
            status === 401 ||
            status === 403 ||
            code === 'PGRST301' ||
            msg.toLowerCase().includes('invalid api key')
          ) {
            errorLabel = 'API Key ditolak (401/403)';
          } else if (code === '42501') {
            errorLabel = 'Izin RLS ditolak — jalankan Script SQL';
          }
          return {
            ...entry,
            ok: false,
            status: status || 400,
            error: errorLabel || `HTTP ${status || 400}`,
          };
        } catch (err: any) {
          return {
            ...entry,
            ok: false,
            status: 0,
            error: err?.message || 'Network error',
          };
        }
      })
    );

    const missingCount = results.filter(r => !r.ok).length;
    const allAuthRejected =
      results.length > 0 &&
      results.every(r => !r.ok && (r.status === 401 || r.status === 403 || r.error?.includes('401')));

    return {
      connected: missingCount < results.length,
      tables: results,
      missingCount,
      authError: allAuthRejected
        ? 'Semua 10 tabel ditolak oleh server Supabase (HTTP 401/403: Invalid API key). Masalahnya ada pada Project URL / API Key di atas — bukan pada skema SQL Anda. Perbaiki URL & API Key lalu klik "Uji Koneksi" lagi.'
        : undefined,
    };
  }

  /**
   * Push ALL local CBT tables to Supabase PostgreSQL in safe dependency order.
   */
  public static async pushAllLocalToSupabase(): Promise<{
    success: boolean;
    totalSynced: number;
    errors: string[];
  }> {
    const config = this.getConfig();
    if (!config.url || !config.anonKey) {
      return {
        success: false,
        totalSynced: 0,
        errors: ['URL atau Anon Key Supabase belum dikonfigurasi.'],
      };
    }

    const errors: string[] = [];
    let totalSynced = 0;

    const brandingRes = await this.upsertBrandingSafe(
      config,
      CBTStorageService.getBranding(),
      CBTStorageService.getActiveToken()
    );
    if (brandingRes.ok) {
      totalSynced += 1;
    } else if (brandingRes.error) {
      errors.push(brandingRes.error);
      if (brandingRes.error.includes('401') || brandingRes.error.includes('403') || brandingRes.error.includes('Invalid API key')) {
        return {
          success: false,
          totalSynced: 0,
          errors,
        };
      }
    }

    const steps: { table: string; rows: any[] }[] = [
      {
        table: 'cbt_classes',
        rows: CBTStorageService.getClasses().map(c => this.toDbClass(c)),
      },
      {
        table: 'cbt_activities',
        rows: CBTStorageService.getActivities().map(a => this.toDbActivity(a)),
      },
      {
        table: 'cbt_subjects',
        rows: CBTStorageService.getSubjects().map(s => this.toDbSubject(s)),
      },
      {
        table: 'cbt_teachers',
        rows: CBTStorageService.getTeachers().map(t => this.toDbTeacher(t)),
      },
      {
        table: 'cbt_students',
        rows: CBTStorageService.getStudents().map(s => this.toDbStudent(s)),
      },
      {
        table: 'cbt_exams',
        rows: CBTStorageService.getExams().map(e => this.toDbExam(e)),
      },
      {
        table: 'cbt_questions',
        rows: CBTStorageService.getQuestions().map(q => this.toDbQuestion(q)),
      },
      {
        table: 'cbt_schedules',
        rows: CBTStorageService.getSchedules().map(s => this.toDbSchedule(s)),
      },
      {
        table: 'cbt_submissions',
        rows: CBTStorageService.getSubmissions().map(sub => this.toDbSubmission(sub)),
      },
    ];

    for (const step of steps) {
      if (step.rows.length === 0) continue;
      try {
        const isHeavyPayload = step.table === 'cbt_questions' || step.table === 'cbt_submissions';
        const chunkSize = isHeavyPayload ? (config.batchSize || 50) : 200;
        const res = await this.upsertRows(config, step.table, step.rows, chunkSize);
        if (res.ok) {
          totalSynced += step.rows.length;
        } else if (res.error) {
          errors.push(res.error);
        }
      } catch (err: any) {
        errors.push(`${step.table}: ${err?.message || 'Gagal unggah'}`);
      }
    }

    if (errors.length === 0) {
      // Clear pending queue since full snapshot was pushed
      CBTStorageService.getSyncQueue().forEach(item => {
        CBTStorageService.removeSyncQueueItem(item.id);
      });
    }

    return {
      success: errors.length === 0,
      totalSynced,
      errors,
    };
  }

  /**
   * Pull all 10 tables from Supabase PostgreSQL into safe local cache.
   */
  public static async pullAllFromSupabase(): Promise<{
    success: boolean;
    totalPulled: number;
    message: string;
  }> {
    const config = this.getConfig();
    if (!config.isConnected || !config.url || !config.anonKey) {
      return {
        success: false,
        totalPulled: 0,
        message: 'Supabase belum terhubung.',
      };
    }

    try {
      // Phase 1: Pull fast login & schedule essentials first so student login is ready immediately
      const [
        brandingRows,
        classRows,
        activityRows,
        subjectRows,
        teacherRows,
        studentRows,
        examRows,
        scheduleRows,
      ] = await Promise.all([
        this.fetchTable(config, 'cbt_branding'),
        this.fetchTable(config, 'cbt_classes'),
        this.fetchTable(config, 'cbt_activities'),
        this.fetchTable(config, 'cbt_subjects'),
        this.fetchTable(config, 'cbt_teachers'),
        this.fetchTable(config, 'cbt_students'),
        this.fetchTable(config, 'cbt_exams'),
        this.fetchTable(config, 'cbt_schedules'),
      ]);

      const parsedBranding =
        brandingRows && brandingRows.length > 0 ? this.fromDbBranding(brandingRows[0]) : null;

      const classes = classRows ? classRows.map(r => this.fromDbClass(r)) : undefined;
      const activities = activityRows ? activityRows.map(r => this.fromDbActivity(r)) : undefined;
      const subjects = subjectRows ? subjectRows.map(r => this.fromDbSubject(r)) : undefined;
      const teachers = teacherRows ? teacherRows.map(r => this.fromDbTeacher(r)) : undefined;
      const students = studentRows ? studentRows.map(r => this.fromDbStudent(r)) : undefined;
      const exams = examRows ? examRows.map(r => this.fromDbExam(r)) : undefined;
      const schedules = scheduleRows ? scheduleRows.map(r => this.fromDbSchedule(r)) : undefined;

      CBTStorageService.applyRemoteSnapshot({
        branding: parsedBranding?.branding || null,
        activeToken: parsedBranding?.activeToken || null,
        classes,
        activities,
        subjects,
        teachers,
        students,
        exams,
        schedules,
      });

      // Phase 2: Pull heavier question bank & submission payloads right after
      const [questionRows, submissionRows] = await Promise.all([
        this.fetchTable(config, 'cbt_questions'),
        this.fetchTable(config, 'cbt_submissions'),
      ]);

      const questions = questionRows ? questionRows.map(r => this.fromDbQuestion(r)) : undefined;
      const submissions = submissionRows
        ? submissionRows.map(r => this.fromDbSubmission(r))
        : undefined;

      CBTStorageService.applyRemoteSnapshot({
        questions,
        schedules,
        submissions,
      });

      const totalPulled =
        (brandingRows?.length || 0) +
        (classes?.length || 0) +
        (activities?.length || 0) +
        (subjects?.length || 0) +
        (teachers?.length || 0) +
        (students?.length || 0) +
        (exams?.length || 0) +
        (questions?.length || 0) +
        (schedules?.length || 0) +
        (submissions?.length || 0);

      return {
        success: true,
        totalPulled,
        message: `Berhasil menarik ${totalPulled} baris data terbaru dari PostgreSQL Supabase.`,
      };
    } catch (err: any) {
      return {
        success: false,
        totalPulled: 0,
        message: `Gagal menarik data dari Supabase: ${err?.message || 'Network error'}`,
      };
    }
  }

  /**
   * Flush local sync queue to Supabase PostgreSQL
   */
  public static async flushSyncQueue(): Promise<{ synced: number; failed: number }> {
    if (this.isFlushing) return { synced: 0, failed: 0 };
    if (CBTStorageService.isSimulatedOffline()) return { synced: 0, failed: 0 };
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      return { synced: 0, failed: 0 };
    }

    const config = this.getConfig();
    const queue = CBTStorageService.getSyncQueue();

    if (queue.length === 0) {
      return { synced: 0, failed: 0 };
    }

    if (!config.isConnected || !config.url || !config.anonKey) {
      // Offline / non-cloud mode: keep data safe locally without failing
      return { synced: 0, failed: 0 };
    }

    this.isFlushing = true;
    let synced = 0;
    let failed = 0;

    try {
      const itemsToProcess = queue.slice(0, config.batchSize || 50);

      for (const item of itemsToProcess) {
        try {
          const success = await this.syncItemToSupabase(item, config);
          if (success) {
            CBTStorageService.removeSyncQueueItem(item.id);
            synced++;
          } else {
            failed++;
          }
        } catch {
          failed++;
        }
      }
    } finally {
      this.isFlushing = false;
    }

    return { synced, failed };
  }

  private static async syncItemToSupabase(
    item: SyncQueueItem,
    config: SupabaseConfig
  ): Promise<boolean> {
    try {
      const p = item.payload;

      switch (item.action) {
        case 'upsert_branding': {
          const res = await this.upsertBrandingSafe(
            config,
            p,
            p?.activeToken || CBTStorageService.getActiveToken()
          );
          return res.ok;
        }

        case 'upsert_token': {
          const branding = p?.branding || CBTStorageService.getBranding();
          const token = p?.token || CBTStorageService.getActiveToken();
          const bRes = await this.upsertBrandingSafe(config, branding, token);
          const exams = CBTStorageService.getExams();
          if (exams.length > 0) {
            await this.upsertRows(
              config,
              'cbt_exams',
              exams.map(e => this.toDbExam(e))
            );
          }
          const schedules = CBTStorageService.getSchedules();
          if (schedules.length > 0) {
            await this.upsertRows(
              config,
              'cbt_schedules',
              schedules.map(s => this.toDbSchedule(s))
            );
          }
          return bRes.ok;
        }

        case 'upsert_class': {
          const res = await this.upsertRows(config, 'cbt_classes', [this.toDbClass(p)]);
          return res.ok;
        }
        case 'delete_class': {
          return await this.deleteById(config, 'cbt_classes', p.id);
        }

        case 'upsert_activity': {
          const res = await this.upsertRows(config, 'cbt_activities', [this.toDbActivity(p)]);
          return res.ok;
        }
        case 'delete_activity': {
          return await this.deleteById(config, 'cbt_activities', p.id);
        }

        case 'upsert_subject': {
          const res = await this.upsertRows(config, 'cbt_subjects', [this.toDbSubject(p)]);
          return res.ok;
        }
        case 'delete_subject': {
          return await this.deleteById(config, 'cbt_subjects', p.id);
        }

        case 'upsert_teacher': {
          const res = await this.upsertRows(config, 'cbt_teachers', [this.toDbTeacher(p)]);
          return res.ok;
        }
        case 'delete_teacher': {
          return await this.deleteById(config, 'cbt_teachers', p.id);
        }
        case 'import_teachers': {
          const rows = Array.isArray(p) ? p.map(t => this.toDbTeacher(t)) : [];
          const res = await this.upsertRows(config, 'cbt_teachers', rows);
          return res.ok;
        }

        case 'upsert_student': {
          const res = await this.upsertRows(config, 'cbt_students', [this.toDbStudent(p)]);
          return res.ok;
        }
        case 'delete_student': {
          return await this.deleteById(config, 'cbt_students', p.id);
        }
        case 'import_students': {
          const rows = Array.isArray(p) ? p.map(s => this.toDbStudent(s)) : [];
          const res = await this.upsertRows(config, 'cbt_students', rows, 200);
          return res.ok;
        }

        case 'upsert_exam': {
          const res = await this.upsertRows(config, 'cbt_exams', [this.toDbExam(p)]);
          return res.ok;
        }
        case 'delete_exam': {
          return await this.deleteById(config, 'cbt_exams', p.id);
        }

        case 'upsert_question': {
          let res = await this.upsertRows(config, 'cbt_questions', [this.toDbQuestion(p)]);
          if (!res.ok && p?.examId) {
            // Ensure parent exam exists on remote before retrying question insert
            const parentExam = CBTStorageService.getExamById(p.examId);
            if (parentExam) {
              await this.upsertRows(config, 'cbt_exams', [this.toDbExam(parentExam)]);
              res = await this.upsertRows(config, 'cbt_questions', [this.toDbQuestion(p)]);
            }
          }
          return res.ok;
        }
        case 'delete_question': {
          return await this.deleteById(config, 'cbt_questions', p.id);
        }
        case 'import_questions': {
          const examId = p?.examId || item.examId;
          if (examId) {
            const parentExam = CBTStorageService.getExamById(examId);
            if (parentExam) {
              await this.upsertRows(config, 'cbt_exams', [this.toDbExam(parentExam)]);
            }
          }
          if (p?.replaceExisting && examId) {
            const client = this.getClient(config.url, config.anonKey);
            if (client) {
              await client.from('cbt_questions').delete().eq('exam_id', examId);
            }
          }
          const rows = Array.isArray(p?.questions)
            ? p.questions.map((q: Question) => this.toDbQuestion(q))
            : [];
          const res = await this.upsertRows(config, 'cbt_questions', rows);
          return res.ok;
        }

        case 'upsert_schedule': {
          const res = await this.upsertRows(config, 'cbt_schedules', [this.toDbSchedule(p)]);
          return res.ok;
        }
        case 'delete_schedule': {
          return await this.deleteById(config, 'cbt_schedules', p.id);
        }

        case 'submit_exam': {
          const res = await this.upsertRows(config, 'cbt_submissions', [this.toDbSubmission(p)]);
          return res.ok;
        }

        case 'save_answer':
        case 'log_infraction': {
          // Local-first exam draft & infraction events are safely bundled into submit_exam
          return true;
        }

        default:
          return true;
      }
    } catch {
      return false;
    }
  }

  /**
   * Initialize automatic background sync and initial cloud hydration.
   */
  public static initAutoSync(): () => void {
    let debounceTimer: ReturnType<typeof setTimeout> | null = null;

    const triggerFlushSoon = () => {
      if (debounceTimer) clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        void this.flushSyncQueue();
      }, 1000);
    };

    const handleOnlineOrNetwork = () => {
      if (!CBTStorageService.isSimulatedOffline() && navigator.onLine) {
        void this.flushSyncQueue();
      }
    };

    window.addEventListener('cbt-sync-enqueued', triggerFlushSoon);
    window.addEventListener('online', handleOnlineOrNetwork);
    window.addEventListener('cbt-network-change', handleOnlineOrNetwork);

    const intervalMs = Math.max(10, this.getConfig().autoSyncIntervalSec || 15) * 1000;
    const intervalId = setInterval(() => {
      void this.flushSyncQueue();
    }, intervalMs);

    // Initial startup sync: flush pending items first, then pull remote updates
    const cfg = this.getConfig();
    if (cfg.isConnected && cfg.url && cfg.anonKey && !CBTStorageService.isSimulatedOffline()) {
      void this.flushSyncQueue().then(() => this.pullAllFromSupabase());
    }

    return () => {
      if (debounceTimer) clearTimeout(debounceTimer);
      clearInterval(intervalId);
      window.removeEventListener('cbt-sync-enqueued', triggerFlushSoon);
      window.removeEventListener('online', handleOnlineOrNetwork);
      window.removeEventListener('cbt-network-change', handleOnlineOrNetwork);
    };
  }
}
