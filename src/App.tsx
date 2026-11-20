/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { ActiveView } from './components/Navbar';
import { LoginForm } from './components/auth/LoginForm';
import { AdminDashboard } from './components/admin/AdminDashboard';
import { GuruDashboard } from './components/guru/GuruDashboard';
import { SiswaDashboard } from './components/siswa/SiswaDashboard';
import { ExamTestingRoom } from './components/student/ExamTestingRoom';
import { ExamResultModal } from './components/student/ExamResultModal';
import { ProctorMonitor } from './components/proctor/ProctorMonitor';
import { QuestionBankManager } from './components/admin/QuestionBankManager';
import { ExamAnalyticsReport } from './components/admin/ExamAnalyticsReport';
import { SupabaseSettings } from './components/admin/SupabaseSettings';
import { CBTStorageService } from './services/cbt-storage';
import { SupabaseService } from './services/supabase-service';
import { Exam, Question, Student, Submission, AuthUser, AppBrandingSettings } from './types/cbt';
import { Menu, X, ChevronRight, KeyRound, Wifi, WifiOff } from 'lucide-react';

export default function App() {
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(() => CBTStorageService.getAuthUser());
  const [branding, setBranding] = useState<AppBrandingSettings>(() => CBTStorageService.getBranding());
  const [exams, setExams] = useState<Exam[]>(() => CBTStorageService.getExams());
  const [activeToken, setActiveToken] = useState<string>(() => CBTStorageService.getActiveToken());
  const [isSimulatedOffline, setIsSimulatedOffline] = useState<boolean>(() => CBTStorageService.isSimulatedOffline());
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState<boolean>(false);

  // Subtab for Admin Dashboard (syncs with left sidebar clicks)
  const [adminSubTab, setAdminSubTab] = useState<'branding' | 'classes' | 'activities' | 'subjects' | 'teachers' | 'students' | 'supabase'>('branding');

  // Set initial view based on login state
  const [activeView, setActiveView] = useState<ActiveView>(() => {
    const user = CBTStorageService.getAuthUser();
    if (!user) return 'auth';
    if (user.role === 'admin') return 'admin';
    if (user.role === 'guru') return 'guru';
    return 'siswa';
  });

  // Active exam session states
  const [activeExamSession, setActiveExamSession] = useState<{
    exam: Exam;
    questions: Question[];
    student: Student;
    remainingSeconds?: number;
    sessionId: number;
  } | null>(null);

  const [completedSubmission, setCompletedSubmission] = useState<{
    submission: Submission;
    exam: Exam;
  } | null>(null);

  useEffect(() => {
    CBTStorageService.initialize();
    CBTStorageService.validateAndRepairLocalDatabase();
    setExams(CBTStorageService.getExams());
    setBranding(CBTStorageService.getBranding());
    setActiveToken(CBTStorageService.getActiveToken());

    const stopAutoSync = SupabaseService.initAutoSync();
    return () => {
      stopAutoSync();
    };
  }, []);

  // Listen to network, branding, auth, and remote sync changes
  useEffect(() => {
    const handleNetworkChange = () => {
      setIsSimulatedOffline(CBTStorageService.isSimulatedOffline());
    };
    const handleBrandingChange = () => {
      setBranding(CBTStorageService.getBranding());
      setActiveToken(CBTStorageService.getActiveToken());
    };
    const handleAuthChange = () => {
      setCurrentUser(CBTStorageService.getAuthUser());
    };
    const handleExamsOrSchedulesChange = () => {
      setExams(CBTStorageService.getExams());
      setActiveToken(CBTStorageService.getActiveToken());
    };

    window.addEventListener('cbt-network-change', handleNetworkChange);
    window.addEventListener('cbt-branding-change', handleBrandingChange);
    window.addEventListener('cbt-auth-change', handleAuthChange);
    window.addEventListener('cbt-exams-change', handleExamsOrSchedulesChange);
    window.addEventListener('cbt-schedules-change', handleExamsOrSchedulesChange);

    return () => {
      window.removeEventListener('cbt-network-change', handleNetworkChange);
      window.removeEventListener('cbt-branding-change', handleBrandingChange);
      window.removeEventListener('cbt-auth-change', handleAuthChange);
      window.removeEventListener('cbt-exams-change', handleExamsOrSchedulesChange);
      window.removeEventListener('cbt-schedules-change', handleExamsOrSchedulesChange);
    };
  }, []);

  const handleToggleSimulatedOffline = () => {
    const nextState = !isSimulatedOffline;
    CBTStorageService.setSimulatedOffline(nextState);
    setIsSimulatedOffline(nextState);
  };

  const handleRefreshToken = () => {
    const newToken = CBTStorageService.generateNewToken();
    setActiveToken(newToken);
    setExams(CBTStorageService.getExams());
  };

  const handleLoginSuccess = (user: AuthUser) => {
    setCurrentUser(user);
    if (user.role === 'admin') {
      setActiveView('admin');
      setAdminSubTab('branding');
    } else if (user.role === 'guru') {
      setActiveView('guru');
    } else {
      setActiveView('siswa');
    }
  };

  const handleLogout = () => {
    if (document.fullscreenElement && document.exitFullscreen) {
      document.exitFullscreen().catch(() => {});
    }
    CBTStorageService.setAuthUser(null);
    CBTStorageService.setCurrentStudent(null);
    setCurrentUser(null);
    setActiveView('auth');
    setActiveExamSession(null);
    setCompletedSubmission(null);
    setMobileSidebarOpen(false);
  };

  const handleStartExam = (exam: Exam, student: Student, remainingSeconds?: number) => {
    CBTStorageService.clearStudentExamDraft(exam.id, student.id);
    const bundle = CBTStorageService.getExamBundle(exam.id, true);
    const randomizedQuestions = bundle ? bundle.questions : CBTStorageService.getQuestions(exam.id);
    setActiveExamSession({
      exam,
      questions: randomizedQuestions,
      student,
      remainingSeconds,
      sessionId: Date.now(),
    });
  };

  const handleFinishExam = (submission: Submission) => {
    if (activeExamSession) {
      setCompletedSubmission({
        submission,
        exam: activeExamSession.exam,
      });
      setActiveExamSession(null);
    }
  };

  const handleCloseResultModal = () => {
    setCompletedSubmission(null);
    setActiveView(currentUser?.role || 'siswa');
  };

  const handleRefreshExams = () => {
    setExams(CBTStorageService.getExams());
  };

  // If student is actively inside the testing room, render pure full-screen testing room without distraction
  if (activeExamSession) {
    return (
      <ExamTestingRoom
        key={`${activeExamSession.exam.id}-${activeExamSession.student.id}-${activeExamSession.sessionId}`}
        exam={activeExamSession.exam}
        questions={activeExamSession.questions}
        student={activeExamSession.student}
        onFinishExam={handleFinishExam}
        onExitEmpty={() => setActiveExamSession(null)}
        onExitToLogin={handleLogout}
        isSimulatedOffline={isSimulatedOffline}
        initialTimeLeftSeconds={activeExamSession.remainingSeconds}
        sessionKey={activeExamSession.sessionId}
      />
    );
  }

  // If student just completed exam, show result modal
  if (completedSubmission) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100">
        <ExamResultModal
          submission={completedSubmission.submission}
          exam={completedSubmission.exam}
          onClose={handleCloseResultModal}
        />
      </div>
    );
  }

  // VIEW 1: AUTH LOGIN MULTI-ROLE (WHEN NOT LOGGED IN)
  if (!currentUser || activeView === 'auth') {
    return (
      <LoginForm
        onLoginSuccess={handleLoginSuccess}
        branding={branding}
      />
    );
  }

  // Breadcrumb label helper
  const getBreadcrumbLabel = () => {
    if (activeView === 'admin') {
      const subLabels: Record<string, string> = {
        branding: 'Setting & Logo Sekolah',
        classes: 'Kelola Kelas Siswa',
        activities: 'Aktivitas Ujian',
        subjects: 'Mata Pelajaran',
        teachers: 'Master Guru',
        students: 'Master Siswa & NIS',
        supabase: 'Supabase PostgreSQL',
      };
      return `Panel Administrator / ${subLabels[adminSubTab] || 'Dashboard'}`;
    }
    if (activeView === 'guru') return 'Panel Guru / Jadwal & Bank Soal';
    if (activeView === 'siswa') return 'Portal Siswa / Jadwal Ujian Aktif';
    if (activeView === 'questions') return 'Manajemen / Bank Soal';
    if (activeView === 'proctor') return 'Monitoring / Ruang Pengawas Live';
    if (activeView === 'analytics') return 'Laporan / Rekapitulasi & Ekspor';
    return 'Dashboard';
  };

  // VIEW 2: TWO-COLUMN DASHBOARD WITH LEFT SIDEBAR NAVIGATION
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-row">
      {/* 1. Left Sidebar (Desktop Persistent) */}
      <div className="hidden md:block">
        <Sidebar
          activeView={activeView}
          setActiveView={setActiveView}
          currentUser={currentUser}
          onLogout={handleLogout}
          branding={branding}
          isSimulatedOffline={isSimulatedOffline}
          onToggleSimulatedOffline={handleToggleSimulatedOffline}
          activeToken={activeToken}
          adminSubTab={adminSubTab}
          setAdminSubTab={setAdminSubTab}
        />
      </div>

      {/* Mobile Drawer Backdrop & Sidebar */}
      {mobileSidebarOpen && (
        <div className="fixed inset-0 z-50 md:hidden bg-black/60 flex">
          <div className="w-72 bg-slate-900 h-full">
            <Sidebar
              activeView={activeView}
              setActiveView={(v) => {
                setActiveView(v);
                setMobileSidebarOpen(false);
              }}
              currentUser={currentUser}
              onLogout={handleLogout}
              branding={branding}
              isSimulatedOffline={isSimulatedOffline}
              onToggleSimulatedOffline={handleToggleSimulatedOffline}
              activeToken={activeToken}
              adminSubTab={adminSubTab}
              setAdminSubTab={(tab) => {
                setAdminSubTab(tab);
                setMobileSidebarOpen(false);
              }}
            />
          </div>
          <button
            onClick={() => setMobileSidebarOpen(false)}
            className="flex-1 p-4 text-white hover:text-white/80"
          >
            <X className="w-6 h-6" />
          </button>
        </div>
      )}

      {/* 2. Main Content Viewport Area */}
      <div className="flex-1 flex flex-col min-w-0 min-h-screen overflow-x-hidden">
        {/* Top Control Bar with Breadcrumbs & Token */}
        <header className="h-16 border-b border-slate-200 dark:border-slate-800 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md px-4 sm:px-6 flex items-center justify-between sticky top-0 z-20">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileSidebarOpen(true)}
              className="md:hidden p-2 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
              title="Buka Menu"
            >
              <Menu className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-300">
              <span className="font-semibold text-slate-900 dark:text-white">
                {branding.title2}
              </span>
              <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
              <span className="text-slate-500 truncate max-w-[200px] sm:max-w-none">
                {getBreadcrumbLabel()}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-lg">
              <KeyRound className="w-3.5 h-3.5 text-amber-500" />
              <span>Token:</span>
              <span className="font-mono font-bold text-slate-900 dark:text-white">
                {activeToken}
              </span>
            </div>

            <div className="flex items-center gap-1 text-xs text-emerald-600 dark:text-emerald-400 font-medium">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <span className="hidden sm:inline">Local-First Ready</span>
            </div>
          </div>
        </header>

        {/* Viewport Content */}
        <main className="flex-1">
          {activeView === 'admin' && (
            <AdminDashboard
              branding={branding}
              onUpdateBranding={setBranding}
              activeSubTab={adminSubTab}
              setActiveSubTab={setAdminSubTab}
            />
          )}

          {activeView === 'guru' && (
            <GuruDashboard
              exams={exams}
              onRefreshExams={handleRefreshExams}
              activeToken={activeToken}
              onRefreshToken={handleRefreshToken}
              teacherName={currentUser?.name || 'Dra. Hj. Siti Rahmawati, M.Pd.'}
            />
          )}

          {activeView === 'siswa' && (() => {
            const resolvedStudent =
              currentUser?.student ||
              CBTStorageService.findStudentByNis(currentUser?.nis || '') ||
              CBTStorageService.getCurrentStudent();

            if (!resolvedStudent) {
              return (
                <div className="p-8 text-center space-y-3">
                  <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                    Sesi biodata siswa tidak ditemukan. Silakan masuk kembali menggunakan NIS Anda.
                  </p>
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="px-4 py-2 bg-teal-700 hover:bg-teal-800 text-white text-xs font-semibold rounded-xl transition-colors"
                  >
                    Kembali ke Form Login
                  </button>
                </div>
              );
            }

            return (
              <SiswaDashboard
                student={resolvedStudent}
                exams={exams}
                onStartExam={handleStartExam}
                onLogout={handleLogout}
                activeToken={activeToken}
              />
            );
          })()}

          {activeView === 'questions' && (
            <QuestionBankManager
              exams={exams}
              onRefreshExams={handleRefreshExams}
            />
          )}

          {activeView === 'proctor' && (
            <ProctorMonitor
              exams={exams}
              activeToken={activeToken}
              onRefreshToken={handleRefreshToken}
            />
          )}

          {activeView === 'analytics' && (
            <ExamAnalyticsReport
              exams={exams}
            />
          )}

          {activeView === 'supabase' && (
            <SupabaseSettings />
          )}
        </main>

        {/* Clean Footer */}
        <footer className="border-t border-slate-200 dark:border-slate-800 py-4 px-6 text-xs text-slate-500 dark:text-slate-400 no-print flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>
            © 2026 {branding.title2} · {branding.title3}
          </span>
          <div className="flex items-center gap-4 text-[11px]">
            <span>Panel Menu Sebelah Kiri</span>
            <span>·</span>
            <span>Formula Matematika &amp; Sains</span>
            <span>·</span>
            <span>Standar ANBK</span>
          </div>
        </footer>
      </div>
    </div>
  );
}
