/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  Database,
  Cloud,
  CheckCircle2,
  AlertCircle,
  Copy,
  Terminal,
  Zap,
  RefreshCw,
  Cpu,
  UploadCloud,
  DownloadCloud,
  ShieldCheck,
  Download,
  Upload,
  Globe,
  Activity,
  Wrench,
  Eye,
  EyeOff,
  RotateCcw,
} from 'lucide-react';
import {
  SupabaseService,
  SUPABASE_SQL_MIGRATION,
  DatabaseHealthReport,
} from '../../services/supabase-service';
import { CBTStorageService } from '../../services/cbt-storage';

export const SupabaseSettings: React.FC = () => {
  const [config, setConfig] = useState(() => SupabaseService.getConfig());
  const [configSource, setConfigSource] = useState<'env' | 'local' | 'none'>(() =>
    SupabaseService.getConfigSource()
  );
  const [url, setUrl] = useState(config.url);
  const [anonKey, setAnonKey] = useState(config.anonKey);
  const [showAnonKey, setShowAnonKey] = useState(false);
  const [queueCount, setQueueCount] = useState(() => CBTStorageService.getSyncQueue().length);

  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);

  const [isCheckingHealth, setIsCheckingHealth] = useState(false);
  const [healthReport, setHealthReport] = useState<DatabaseHealthReport | null>(null);

  const [isSyncing, setIsSyncing] = useState(false);
  const [isPushingAll, setIsPushingAll] = useState(false);
  const [isPullingAll, setIsPullingAll] = useState(false);
  const [syncResult, setSyncResult] = useState<{ success: boolean; message: string } | null>(null);

  const [repairResult, setRepairResult] = useState<{
    success: boolean;
    message: string;
  } | null>(null);
  const [copiedSql, setCopiedSql] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const inspection = useMemo(() => SupabaseService.inspectCredentials(url, anonKey), [url, anonKey]);

  useEffect(() => {
    const refreshQueue = () => {
      setQueueCount(CBTStorageService.getSyncQueue().length);
    };
    const refreshConfig = () => {
      setConfig(SupabaseService.getConfig());
      setConfigSource(SupabaseService.getConfigSource());
    };
    window.addEventListener('cbt-sync-enqueued', refreshQueue);
    window.addEventListener('cbt-supabase-config-change', refreshConfig);
    const timer = setInterval(refreshQueue, 3000);
    return () => {
      window.removeEventListener('cbt-sync-enqueued', refreshQueue);
      window.removeEventListener('cbt-supabase-config-change', refreshConfig);
      clearInterval(timer);
    };
  }, []);

  const handleTestConnection = async () => {
    setIsTesting(true);
    setTestResult(null);
    setSyncResult(null);
    setHealthReport(null);
    const res = await SupabaseService.testConnection(url, anonKey);
    const nextUrl = res.normalizedUrl || url;
    const nextKey = res.normalizedKey || anonKey;
    if (res.normalizedUrl && res.normalizedUrl !== url) {
      setUrl(res.normalizedUrl);
    }
    if (res.normalizedKey && res.normalizedKey !== anonKey) {
      setAnonKey(res.normalizedKey);
    }
    setTestResult(res);
    setConfig(SupabaseService.getConfig());
    setConfigSource(SupabaseService.getConfigSource());
    setIsTesting(false);
    if (res.success) {
      await handleCheckHealth(nextUrl, nextKey);
    }
  };

  const handleSaveConfig = () => {
    const updated = SupabaseService.saveConfig({ url, anonKey });
    setUrl(updated.url);
    setAnonKey(updated.anonKey);
    setConfig(updated);
    setConfigSource(SupabaseService.getConfigSource());
    setTestResult({
      success: true,
      message: 'Konfigurasi Supabase berhasil disimpan di perangkat Admin ini.',
    });
  };

  const handleResetConfig = () => {
    const reset = SupabaseService.resetConfig();
    setUrl(reset.url);
    setAnonKey(reset.anonKey);
    setConfig(reset);
    setConfigSource(SupabaseService.getConfigSource());
    setHealthReport(null);
    setSyncResult(null);
    setTestResult({
      success: true,
      message: 'Cache kredensial lokal dibersihkan. Silakan masukkan URL & Key yang benar.',
    });
  };

  const handleCheckHealth = async (customUrl?: string, customKey?: string) => {
    setIsCheckingHealth(true);
    const report = await SupabaseService.checkDatabaseHealth(
      customUrl ?? url,
      customKey ?? anonKey
    );
    setHealthReport(report);
    setIsCheckingHealth(false);
  };

  const handleCopySql = () => {
    navigator.clipboard.writeText(SUPABASE_SQL_MIGRATION);
    setCopiedSql(true);
    setTimeout(() => setCopiedSql(false), 2500);
  };

  const handleManualSync = async () => {
    setIsSyncing(true);
    setSyncResult(null);
    const res = await SupabaseService.flushSyncQueue();
    setQueueCount(CBTStorageService.getSyncQueue().length);
    setIsSyncing(false);
    setSyncResult({
      success: res.failed === 0,
      message:
        res.failed === 0
          ? `Sinkronisasi antrean selesai: ${res.synced} transaksi tersinkronisasi ke PostgreSQL.`
          : `Sinkronisasi parsial: ${res.synced} berhasil, ${res.failed} gagal (periksa tabel/koneksi).`,
    });
  };

  const handlePushAllToSupabase = async () => {
    setIsPushingAll(true);
    setSyncResult(null);
    // Verify credentials first so invalid keys never overwrite connection state or spam 10 failing requests
    const conn = await SupabaseService.testConnection(url, anonKey);
    const nextUrl = conn.normalizedUrl || url;
    const nextKey = conn.normalizedKey || anonKey;
    if (conn.normalizedUrl && conn.normalizedUrl !== url) setUrl(conn.normalizedUrl);
    if (conn.normalizedKey && conn.normalizedKey !== anonKey) setAnonKey(conn.normalizedKey);
    setConfig(SupabaseService.getConfig());
    setConfigSource(SupabaseService.getConfigSource());

    if (!conn.success) {
      setIsPushingAll(false);
      setTestResult(conn);
      setSyncResult({
        success: false,
        message: `Unggah dibatalkan sebelum mengirim data: ${conn.message}`,
      });
      return;
    }

    const res = await SupabaseService.pushAllLocalToSupabase();
    setQueueCount(CBTStorageService.getSyncQueue().length);
    setIsPushingAll(false);
    setSyncResult({
      success: res.success,
      message: res.success
        ? `Berhasil mengunggah seluruh ${res.totalSynced} baris data (10 tabel) ke PostgreSQL Supabase!`
        : `Sebagian unggahan gagal: ${res.errors.slice(0, 2).join(' | ')}`,
    });
    await handleCheckHealth(nextUrl, nextKey);
  };

  const handlePullAllFromSupabase = async () => {
    setIsPullingAll(true);
    setSyncResult(null);
    const conn = await SupabaseService.testConnection(url, anonKey);
    if (conn.normalizedUrl && conn.normalizedUrl !== url) setUrl(conn.normalizedUrl);
    if (conn.normalizedKey && conn.normalizedKey !== anonKey) setAnonKey(conn.normalizedKey);
    setConfig(SupabaseService.getConfig());
    setConfigSource(SupabaseService.getConfigSource());

    if (!conn.success) {
      setIsPullingAll(false);
      setTestResult(conn);
      setSyncResult({
        success: false,
        message: `Tarik data dibatalkan: ${conn.message}`,
      });
      return;
    }

    const res = await SupabaseService.pullAllFromSupabase();
    setIsPullingAll(false);
    setSyncResult({
      success: res.success,
      message: res.message,
    });
  };

  const handleRepairLocalDb = () => {
    const report = CBTStorageService.validateAndRepairLocalDatabase();
    setRepairResult({
      success: true,
      message: report.healthy
        ? `Database lokal dalam kondisi sehat & utuh (${report.totalRecords} total baris tervalidasi).`
        : `Berhasil memulihkan ${report.repairedKeys.length} struktur data yang rusak: ${report.repairedKeys.join(', ')}.`,
    });
  };

  const handleExportBackup = () => {
    const json = CBTStorageService.exportFullBackupJson();
    const blob = new Blob([json], { type: 'application/json' });
    const downloadUrl = URL.createObjectURL(blob);
    const a = document.createElement('a');
    const dateStamp = new Date().toISOString().slice(0, 10);
    a.href = downloadUrl;
    a.download = `backup-cbt-lengkap-${dateStamp}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(downloadUrl);
    setRepairResult({
      success: true,
      message: 'File backup JSON lengkap (10 tabel + konfigurasi) berhasil diunduh.',
    });
  };

  const handleRestoreFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const text = typeof reader.result === 'string' ? reader.result : '';
      const res = CBTStorageService.restoreFullBackupJson(text);
      setRepairResult({
        success: res.success,
        message: res.message,
      });
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
          Database PostgreSQL Supabase, Keamanan &amp; Publish Hosting
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
          Hubungkan seluruh transaksi aplikasi CBT (Admin, Guru, Bank Soal, Jadwal, dan Siswa) ke Supabase PostgreSQL, amankan dari kerusakan data, dan siapkan untuk hosting publik HTTPS.
        </p>
      </div>

      {/* Architecture Explainer Strip */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xs">
          <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mb-3">
            <Zap className="w-4 h-4" />
          </div>
          <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-1">
            1. Sinkronisasi Penuh 10 Tabel
          </h3>
          <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
            Seluruh transaksi Master Kelas, Aktivitas, Mapel, Guru, Siswa, Paket Ujian, Bank Soal, Jadwal, Token, hingga Hasil Ujian tersinkronisasi otomatis ke PostgreSQL.
          </p>
        </div>

        <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xs">
          <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-3">
            <ShieldCheck className="w-4 h-4" />
          </div>
          <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-1">
            2. Proteksi Anti-Database Rusak
          </h3>
          <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
            Dilengkapi JSON Auto-Heal, pemeriksaan skema 10 tabel, dan fitur ekspor/impor backup JSON penuh agar aplikasi tidak pernah crash jika penyimpanan korup.
          </p>
        </div>

        <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xs">
          <div className="w-8 h-8 rounded-lg bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center mb-3">
            <Cloud className="w-4 h-4" />
          </div>
          <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-1">
            3. Local-First &amp; Multi-Perangkat
          </h3>
          <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
            Jawaban siswa aman saat koneksi putus dan otomatis terunggah saat online. Variabel environment membuat seluruh perangkat otomatis terhubung saat di-hosting.
          </p>
        </div>
      </div>

      {/* Supabase Connection & Bidirectional Sync Card */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-xs space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <Database className="w-5 h-5 text-indigo-600" />
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                Koneksi Database PostgreSQL Supabase
              </h2>
              <p className="text-xs text-slate-500">
                Salin dari Dashboard Supabase &rarr; Project Settings &rarr; API Keys (Project URL &amp; Publishable Key <code className="font-mono">sb_publishable_...</code> atau Legacy <code className="font-mono">anon</code> key <code className="font-mono">eyJ...</code>)
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {configSource === 'env' && (
              <span className="text-[11px] px-2.5 py-1 rounded-md font-semibold bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300">
                Sumber: Environment Hosting (.env)
              </span>
            )}
            <span
              className={`text-xs px-2.5 py-1 rounded-md font-semibold ${
                config.isConnected
                  ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300'
                  : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
              }`}
            >
              {config.isConnected ? 'Terhubung ke Supabase' : 'Mode Offline / Belum Dikonfigurasi'}
            </span>
          </div>
        </div>

        {testResult && (
          <div
            className={`p-3 rounded-lg text-xs flex items-start gap-2.5 ${
              testResult.success
                ? 'bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200'
                : 'bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-800 text-red-800 dark:text-red-200'
            }`}
          >
            {testResult.success ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            ) : (
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
            )}
            <div className="space-y-1.5">
              <div>{testResult.message}</div>
              {!testResult.success &&
                (testResult.message.includes('401') || testResult.message.includes('Invalid API key')) && (
                  <div className="pt-1.5 border-t border-red-200/80 dark:border-red-800/80 text-[11px] space-y-1 text-red-700 dark:text-red-300">
                    <div className="font-bold">Cara Memperbaiki Error HTTP 401 Invalid API Key:</div>
                    <ol className="list-decimal pl-4 space-y-0.5">
                      <li>
                        Buka Supabase Dashboard &rarr; pastikan proyek aktif (di pojok kiri atas) sama dengan ID URL{' '}
                        <code className="font-mono font-semibold">
                          {inspection.urlProjectRef || 'kodeproyek'}
                        </code>
                        .
                      </li>
                      <li>
                        Masuk ke <strong>Project Settings &rarr; API Keys</strong> &rarr; buka tab{' '}
                        <strong>Publishable and secret API keys</strong> &rarr; klik ikon Copy di samping{' '}
                        <strong>Publishable key</strong> (<code className="font-mono">sb_publishable_...</code>).
                      </li>
                      <li>
                        Jika memakai <strong>Legacy anon key</strong> (<code className="font-mono">eyJ...</code>), buka tab{' '}
                        <em>Legacy anon, service_role API keys</em> dan pastikan tombolnya tidak dalam status <em>Disabled</em>.
                      </li>
                    </ol>
                  </div>
                )}
            </div>
          </div>
        )}

        {syncResult && (
          <div
            className={`p-3 rounded-lg text-xs flex items-center gap-2 border ${
              syncResult.success
                ? 'bg-indigo-50 dark:bg-indigo-950/50 border-indigo-200 dark:border-indigo-800 text-indigo-800 dark:text-indigo-200'
                : 'bg-amber-50 dark:bg-amber-950/50 border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-200'
            }`}
          >
            {syncResult.success ? (
              <CheckCircle2 className="w-4 h-4 text-indigo-600 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
            )}
            <span>{syncResult.message}</span>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Supabase Project URL
            </label>
            <input
              type="text"
              name="supabase-project-url"
              autoComplete="off"
              spellCheck={false}
              data-lpignore="true"
              data-1p-ignore="true"
              placeholder="https://xyzcompany.supabase.co"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              className="w-full text-xs font-mono px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Supabase Publishable / Anon Key
            </label>
            <div className="relative">
              <input
                type={showAnonKey ? 'text' : 'password'}
                name="supabase-api-key"
                autoComplete="new-password"
                spellCheck={false}
                data-lpignore="true"
                data-1p-ignore="true"
                placeholder="sb_publishable_... atau eyJhbGciOiJIUzI1NiIs..."
                value={anonKey}
                onChange={(e) => setAnonKey(e.target.value)}
                className="w-full text-xs font-mono pl-3 pr-9 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
              />
              <button
                type="button"
                onClick={() => setShowAnonKey(prev => !prev)}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                title={showAnonKey ? 'Sembunyikan Key' : 'Tampilkan Key'}
              >
                {showAnonKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>
        </div>

        {/* Live Credential Inspector (prevents hidden autofill / wrong project ref / truncated key) */}
        {(url.trim() || anonKey.trim()) && (
          <div className="px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-slate-600 dark:text-slate-300">
            <div>
              <span className="text-slate-400">Ref URL:</span>{' '}
              <span className="font-mono font-semibold text-slate-800 dark:text-slate-100">
                {inspection.urlProjectRef || 'Tidak terdeteksi'}
              </span>
            </div>
            <div>
              <span className="text-slate-400">Jenis Key:</span>{' '}
              <span
                className={`font-semibold ${
                  inspection.keyKind === 'publishable' || inspection.keyKind === 'legacy_anon_jwt'
                    ? 'text-emerald-700 dark:text-emerald-300'
                    : 'text-red-600 dark:text-red-400'
                }`}
              >
                {inspection.keyKind === 'publishable'
                  ? 'Publishable Key (sb_publishable_)'
                  : inspection.keyKind === 'legacy_anon_jwt'
                  ? 'Legacy Anon JWT (eyJ...)'
                  : inspection.keyKind === 'secret'
                  ? 'Secret Key (DILARANG di browser)'
                  : inspection.keyKind === 'service_role_jwt'
                  ? 'Service Role JWT (DILARANG di browser)'
                  : inspection.keyKind === 'pat'
                  ? 'Personal Access Token (sbp_ - Salah)'
                  : inspection.keyKind === 'empty'
                  ? 'Kosong'
                  : 'Format Tidak Dikenali'}
              </span>
            </div>
            <div>
              <span className="text-slate-400">Pratinjau &amp; Panjang:</span>{' '}
              <code className="font-mono">{inspection.maskedPreview}</code>{' '}
              <span className="text-slate-400">({inspection.keyLength} kar.)</span>
            </div>
            {inspection.jwtRef && (
              <div>
                <span className="text-slate-400">Ref JWT:</span>{' '}
                <span
                  className={`font-mono font-semibold ${
                    inspection.refMismatch
                      ? 'text-red-600 dark:text-red-400'
                      : 'text-emerald-700 dark:text-emerald-300'
                  }`}
                >
                  {inspection.jwtRef} {inspection.refMismatch ? '(TIDAK COCOK dengan URL!)' : '(Cocok)'}
                </span>
              </div>
            )}
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <span>Antrean Sinkronisasi Otomatis:</span>
            <span className="font-mono font-bold text-slate-900 dark:text-white">
              {queueCount} Item
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={handleResetConfig}
              className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5"
              title="Hapus cache kredensial di browser ini"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset Cache</span>
            </button>

            <button
              onClick={handleSaveConfig}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-semibold transition-colors"
            >
              Simpan Kredensial
            </button>

            <button
              onClick={handleTestConnection}
              disabled={isTesting}
              className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 shadow-xs disabled:opacity-60"
            >
              <Zap className="w-3.5 h-3.5" />
              <span>{isTesting ? 'Menguji...' : 'Uji Koneksi'}</span>
            </button>

            <button
              onClick={() => handleCheckHealth()}
              disabled={isCheckingHealth}
              className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 disabled:opacity-60"
            >
              <Activity className={`w-3.5 h-3.5 ${isCheckingHealth ? 'animate-pulse' : ''}`} />
              <span>{isCheckingHealth ? 'Memeriksa...' : 'Cek Kesehatan 10 Tabel'}</span>
            </button>

            <button
              onClick={handleManualSync}
              disabled={isSyncing}
              className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 disabled:opacity-60"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
              <span>Sinkronkan Antrean</span>
            </button>

            <button
              onClick={handlePushAllToSupabase}
              disabled={isPushingAll}
              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 shadow-xs disabled:opacity-60"
            >
              <UploadCloud className="w-3.5 h-3.5" />
              <span>{isPushingAll ? 'Mengunggah...' : 'Unggah Semua Data ke Supabase'}</span>
            </button>

            <button
              onClick={handlePullAllFromSupabase}
              disabled={isPullingAll}
              className="px-3 py-1.5 bg-sky-600 hover:bg-sky-700 text-white rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 shadow-xs disabled:opacity-60"
            >
              <DownloadCloud className="w-3.5 h-3.5" />
              <span>{isPullingAll ? 'Menarik Data...' : 'Tarik Data dari Supabase'}</span>
            </button>
          </div>
        </div>

        {/* 10-Table Health Status Grid */}
        {healthReport && (
          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-2.5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h3 className="text-xs font-bold text-slate-800 dark:text-slate-200">
                Status Kesiapan 10 Tabel PostgreSQL ({10 - healthReport.missingCount}/10 Siap)
              </h3>
              {healthReport.authError ? (
                <span className="text-[11px] text-red-600 dark:text-red-400 font-semibold">
                  Autentikasi API Key gagal — periksa Project URL &amp; API Key di atas terlebih dahulu.
                </span>
              ) : healthReport.missingCount > 0 ? (
                <span className="text-[11px] text-amber-600 dark:text-amber-400 font-medium">
                  Jalankan Script SQL di bawah pada SQL Editor Supabase untuk membuat tabel yang belum ada.
                </span>
              ) : null}
            </div>
            {healthReport.authError && (
              <div className="p-2.5 rounded-lg bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-[11px] text-red-700 dark:text-red-300">
                {healthReport.authError}
              </div>
            )}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2">
              {healthReport.tables.map((t) => (
                <div
                  key={t.table}
                  className={`p-2.5 rounded-lg border text-xs flex items-start gap-2 ${
                    t.ok
                      ? 'bg-emerald-50/70 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200'
                      : 'bg-red-50/70 dark:bg-red-950/30 border-red-200 dark:border-red-800 text-red-800 dark:text-red-200'
                  }`}
                >
                  {t.ok ? (
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                  ) : (
                    <AlertCircle className="w-3.5 h-3.5 text-red-600 shrink-0 mt-0.5" />
                  )}
                  <div className="min-w-0">
                    <div className="font-mono font-semibold truncate">{t.table}</div>
                    <div className="text-[11px] opacity-85 truncate">{t.ok ? t.label : t.error}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Corrupt-Database Protection & JSON Backup / Restore Card */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-xs space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <ShieldCheck className="w-5 h-5 text-emerald-600" />
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                Proteksi Database Rusak &amp; Backup Pemulihan (.JSON)
              </h2>
              <p className="text-xs text-slate-500">
                Validasi struktur penyimpanan lokal, bersihkan baris korup otomatis, dan simpan arsip backup sebelum/sesudah ujian.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handleRepairLocalDb}
              className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5"
            >
              <Wrench className="w-3.5 h-3.5" />
              <span>Periksa &amp; Perbaiki Data Lokal</span>
            </button>

            <button
              onClick={handleExportBackup}
              className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Unduh Backup (.json)</span>
            </button>

            <button
              onClick={() => fileInputRef.current?.click()}
              className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Pulihkan Backup (.json)</span>
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="application/json,.json"
              onChange={handleRestoreFileChange}
              className="hidden"
            />
          </div>
        </div>

        {repairResult && (
          <div
            className={`p-3 rounded-lg text-xs flex items-center gap-2 border ${
              repairResult.success
                ? 'bg-emerald-50 dark:bg-emerald-950/50 border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200'
                : 'bg-red-50 dark:bg-red-950/50 border-red-200 dark:border-red-800 text-red-800 dark:text-red-200'
            }`}
          >
            {repairResult.success ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
            )}
            <span>{repairResult.message}</span>
          </div>
        )}
      </div>

      {/* SQL Migration Script Viewer */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-xs">
        <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <Terminal className="w-4 h-4 text-indigo-600" />
            <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
              Skema SQL PostgreSQL Supabase (10 Tabel Lengkap &amp; Idempotent)
            </h3>
          </div>

          <button
            onClick={handleCopySql}
            className="px-3 py-1 bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 rounded-md text-xs font-semibold transition-colors flex items-center gap-1.5"
          >
            {copiedSql ? (
              <>
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>Tersalin ke Clipboard!</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>Salin Script SQL</span>
              </>
            )}
          </button>
        </div>

        <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">
          Tempel dan jalankan skrip ini pada menu <strong>SQL Editor &rarr; New Query</strong> di dashboard Supabase Anda. Script ini aman dijalankan ulang kapan saja tanpa menghapus data yang sudah ada.
        </p>

        <pre className="p-4 bg-slate-950 text-slate-200 text-xs font-mono rounded-lg overflow-x-auto max-h-80 border border-slate-800">
          <code>{SUPABASE_SQL_MIGRATION}</code>
        </pre>
      </div>

      {/* Public HTTPS Hosting & Publish Checklist */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-xs">
        <div className="flex items-center gap-2 pb-3 mb-4 border-b border-slate-100 dark:border-slate-800">
          <Globe className="w-4 h-4 text-indigo-600" />
          <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
            Checklist Publish &amp; File Hosting Aman (HTTPS Global)
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-slate-600 dark:text-slate-300">
          <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 space-y-2">
            <h4 className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
              <Cpu className="w-3.5 h-3.5 text-indigo-600" />
              <span>Opsi A: Cloud Hosting Otomatis (Vercel / Cloudflare Pages / Netlify)</span>
            </h4>
            <ol className="list-decimal pl-4 space-y-1.5 leading-relaxed">
              <li>
                Tambahkan <strong>Environment Variables</strong> pada pengaturan hosting:{' '}
                <code className="px-1 py-0.5 bg-slate-200 dark:bg-slate-700 rounded">VITE_SUPABASE_URL</code> dan{' '}
                <code className="px-1 py-0.5 bg-slate-200 dark:bg-slate-700 rounded">VITE_SUPABASE_ANON_KEY</code>.
              </li>
              <li>
                Gunakan build command <code className="px-1 py-0.5 bg-slate-200 dark:bg-slate-700 rounded">npm run build</code> dengan output folder{' '}
                <code className="px-1 py-0.5 bg-slate-200 dark:bg-slate-700 rounded">dist</code>.
              </li>
              <li>
                Sertifikat SSL/HTTPS otomatis aktif sehingga siswa, guru, dan proktor dapat mengakses dari HP/laptop mana saja dengan aman.
              </li>
            </ol>
          </div>

          <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 space-y-2">
            <h4 className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
              <Database className="w-3.5 h-3.5 text-emerald-600" />
              <span>Opsi B: Unggah Manual File Hosting Sekolah (cPanel / Plesk / Nginx)</span>
            </h4>
            <ol className="list-decimal pl-4 space-y-1.5 leading-relaxed">
              <li>
                Buat file <code className="px-1 py-0.5 bg-slate-200 dark:bg-slate-700 rounded">.env</code> berisi{' '}
                <code className="px-1 py-0.5 bg-slate-200 dark:bg-slate-700 rounded">VITE_SUPABASE_URL</code> dan{' '}
                <code className="px-1 py-0.5 bg-slate-200 dark:bg-slate-700 rounded">VITE_SUPABASE_ANON_KEY</code> (jangan pernah masukkan Service Role Key!).
              </li>
              <li>
                Jalankan <code className="px-1 py-0.5 bg-slate-200 dark:bg-slate-700 rounded">npm run build</code> lalu kompres isi folder{' '}
                <code className="px-1 py-0.5 bg-slate-200 dark:bg-slate-700 rounded">dist/</code> dan unggah ke{' '}
                <code className="px-1 py-0.5 bg-slate-200 dark:bg-slate-700 rounded">public_html/</code>.
              </li>
              <li>
                Aktifkan AutoSSL / Let&apos;s Encrypt HTTPS dan arahkan semua perangkat melalui link domain sekolah.
              </li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
};
