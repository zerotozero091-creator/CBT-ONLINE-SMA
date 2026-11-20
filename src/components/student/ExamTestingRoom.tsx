/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Clock,
  ChevronLeft,
  ChevronRight,
  HelpCircle,
  CheckCircle2,
  AlertTriangle,
  Grid3X3,
  Maximize2,
  Minimize2,
  ShieldAlert,
  Wifi,
  WifiOff,
  Send,
  X,
  RotateCcw,
  Check
} from 'lucide-react';
import { Exam, Question, Student, StudentAnswer, InfractionLog, Submission } from '../../types/cbt';
import { CBTStorageService, DEFAULT_SCHOOL_LOGO_URL } from '../../services/cbt-storage';
import { MathText } from '../MathText';

interface ExamTestingRoomProps {
  exam: Exam;
  questions: Question[];
  student: Student;
  onFinishExam: (submission: Submission) => void;
  onExitEmpty?: () => void;
  onExitToLogin?: () => void;
  isSimulatedOffline: boolean;
  initialTimeLeftSeconds?: number;
  sessionKey?: number;
}

export const ExamTestingRoom: React.FC<ExamTestingRoomProps> = ({
  exam,
  questions,
  student,
  onFinishExam,
  onExitEmpty,
  onExitToLogin,
  isSimulatedOffline,
  initialTimeLeftSeconds,
  sessionKey,
}) => {
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [answers, setAnswers] = useState<Record<string, StudentAnswer>>(() => {
    return CBTStorageService.getStudentAnswers(exam.id, student.id);
  });
  const [infractions, setInfractions] = useState<InfractionLog[]>(() => {
    return CBTStorageService.getStudentInfractions(exam.id, student.id);
  });
  const branding = CBTStorageService.getBranding();

  // Timer states (Local authoritative timer synced to schedule remaining window)
  const initialSeconds =
    typeof initialTimeLeftSeconds === 'number' && initialTimeLeftSeconds > 0
      ? initialTimeLeftSeconds
      : exam.durationMinutes * 60;
  const [timeLeft, setTimeLeft] = useState<number>(initialSeconds);
  const startTimeRef = useRef<number>(Date.now());
  const answersRef = useRef<Record<string, StudentAnswer>>(answers);
  const infractionsRef = useRef<InfractionLog[]>(infractions);
  const hasSubmittedRef = useRef<boolean>(false);

  useEffect(() => {
    answersRef.current = answers;
  }, [answers]);

  useEffect(() => {
    infractionsRef.current = infractions;
  }, [infractions]);

  // UI States
  const [fontSize, setFontSize] = useState<'normal' | 'large' | 'xlarge'>('normal');
  const [showQuestionGrid, setShowQuestionGrid] = useState<boolean>(false);
  const [showConfirmSubmit, setShowConfirmSubmit] = useState<boolean>(false);
  const [agreeConfirm, setAgreeConfirm] = useState<boolean>(false);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(() =>
    Boolean(document.fullscreenElement || (document as unknown as { webkitFullscreenElement?: Element }).webkitFullscreenElement)
  );
  const [showFullscreenAlert, setShowFullscreenAlert] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const wasFullscreenRef = useRef<boolean>(
    Boolean(document.fullscreenElement || (document as unknown as { webkitFullscreenElement?: Element }).webkitFullscreenElement)
  );
  const isIntentionalExitRef = useRef<boolean>(false);
  const hasTriggeredExitRef = useRef<boolean>(false);

  useEffect(() => {
    hasSubmittedRef.current = false;
    hasTriggeredExitRef.current = false;
    isIntentionalExitRef.current = false;
    wasFullscreenRef.current = Boolean(
      document.fullscreenElement || (document as unknown as { webkitFullscreenElement?: Element }).webkitFullscreenElement
    );
    setCurrentIndex(0);
    const loadedAnswers = CBTStorageService.getStudentAnswers(exam.id, student.id);
    const loadedInfractions = CBTStorageService.getStudentInfractions(exam.id, student.id);
    setAnswers(loadedAnswers);
    setInfractions(loadedInfractions);
    answersRef.current = loadedAnswers;
    infractionsRef.current = loadedInfractions;
    setTimeLeft(initialSeconds);
    setShowQuestionGrid(false);
    setShowConfirmSubmit(false);
    setAgreeConfirm(false);
    startTimeRef.current = Date.now();
  }, [exam.id, student.id, sessionKey, initialSeconds]);

  const currentQuestion = questions[currentIndex] || questions[0];
  const currentAnswer = answers[currentQuestion?.id];

  // Show temporary toast notification
  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(prev => (prev === msg ? null : prev));
    }, 3500);
  }, []);

  // Record an infraction
  const handleInfraction = useCallback((type: InfractionLog['type'], message: string) => {
    const log = CBTStorageService.recordInfractionLocally(exam.id, student.id, type, message);
    setInfractions(prev => [...prev, log]);
    showToast(message);
  }, [exam.id, student.id, showToast]);

  // Request fullscreen on entrance
  const enterFullscreen = useCallback(() => {
    const elem = document.documentElement as HTMLElement & {
      webkitRequestFullscreen?: () => Promise<void> | void;
      msRequestFullscreen?: () => Promise<void> | void;
    };
    if (document.fullscreenElement) return;
    if (elem.requestFullscreen) {
      elem.requestFullscreen().catch(() => {
        // Browser may require direct user gesture
      });
    } else if (elem.webkitRequestFullscreen) {
      try {
        elem.webkitRequestFullscreen();
      } catch {
        // Ignore vendor fullscreen error
      }
    } else if (elem.msRequestFullscreen) {
      try {
        elem.msRequestFullscreen();
      } catch {
        // Ignore vendor fullscreen error
      }
    }
  }, []);

  // Immediately exit fullscreen and return to LoginForm when ESC is pressed or fullscreen exits unexpectedly
  const triggerReturnToLogin = useCallback(() => {
    if (hasTriggeredExitRef.current || hasSubmittedRef.current) return;
    hasTriggeredExitRef.current = true;
    isIntentionalExitRef.current = true;

    const doc = document as Document & { webkitExitFullscreen?: () => Promise<void> | void };
    if (doc.fullscreenElement && doc.exitFullscreen) {
      doc.exitFullscreen().catch(() => {});
    } else if (doc.webkitExitFullscreen) {
      try {
        doc.webkitExitFullscreen();
      } catch {
        // Ignore vendor exit error
      }
    }

    if (onExitToLogin) {
      onExitToLogin();
    } else if (onExitEmpty) {
      onExitEmpty();
    }
  }, [onExitToLogin, onExitEmpty]);

  // Attempt fullscreen on mount if not already active from download trigger
  useEffect(() => {
    if (questions.length > 0 && !document.fullscreenElement) {
      enterFullscreen();
    }
  }, [enterFullscreen, questions.length]);

  // Fullscreen change listener (detects ESC exiting fullscreen in browsers that consume ESC)
  useEffect(() => {
    const onFullscreenChange = () => {
      const doc = document as Document & { webkitFullscreenElement?: Element };
      const active = Boolean(doc.fullscreenElement || doc.webkitFullscreenElement);
      setIsFullscreen(active);

      if (active) {
        wasFullscreenRef.current = true;
        setShowFullscreenAlert(false);
        return;
      }

      if (wasFullscreenRef.current && !isIntentionalExitRef.current) {
        if (onExitToLogin) {
          triggerReturnToLogin();
        } else {
          setShowFullscreenAlert(true);
          handleInfraction(
            'exit_fullscreen',
            'Peringatan! Terdeteksi keluar dari mode layar penuh (Fullscreen).'
          );
        }
      }
    };

    document.addEventListener('fullscreenchange', onFullscreenChange);
    document.addEventListener('webkitfullscreenchange', onFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', onFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', onFullscreenChange);
    };
  }, [handleInfraction, onExitToLogin, triggerReturnToLogin]);

  // Tab switch & window blur detection (Anti-Fraud)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden && !hasTriggeredExitRef.current && !isIntentionalExitRef.current) {
        handleInfraction(
          'tab_switch',
          'Peringatan Integritas: Anda terdeteksi beralih tab atau membuka aplikasi lain!'
        );
      }
    };

    const handleWindowBlur = () => {
      if (!hasTriggeredExitRef.current && !isIntentionalExitRef.current) {
        handleInfraction(
          'window_blur',
          'Peringatan Integritas: Jendela lembar ujian kehilangan fokus kursor.'
        );
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('blur', handleWindowBlur);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('blur', handleWindowBlur);
    };
  }, [handleInfraction]);

  // Clipboard & Keyboard shortcut restrictions + ESC emergency return to login
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Pressing ESC returns immediately to LoginForm when trouble occurs
      if (e.key === 'Escape') {
        e.preventDefault();
        triggerReturnToLogin();
        return;
      }

      // Prevent F12 (Inspect Element)
      if (e.key === 'F12') {
        e.preventDefault();
        showToast('Inspect element dinonaktifkan.');
        return;
      }

      // Prevent Ctrl+Shift+I, Ctrl+Shift+J, Ctrl+U
      if (e.ctrlKey && (e.shiftKey && (e.key === 'I' || e.key === 'J') || e.key === 'u' || e.key === 'U')) {
        e.preventDefault();
        showToast('Pintasan keyboard pengembang dinonaktifkan.');
        return;
      }

      // Prevent Alt+Tab or Windows key warning
      if (e.altKey && e.key === 'Tab') {
        showToast('Peringatan: Dilarang beralih jendela selama ujian.');
      }
    };

    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
      showToast('Menu klik kanan dinonaktifkan selama ujian berlangsung.');
    };

    const handleCopyCutPaste = (e: ClipboardEvent) => {
      e.preventDefault();
      showToast('Aktivitas salin/tempel dinonaktifkan demi integritas ujian.');
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('contextmenu', handleContextMenu);
    window.addEventListener('copy', handleCopyCutPaste);
    window.addEventListener('cut', handleCopyCutPaste);
    window.addEventListener('paste', handleCopyCutPaste);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('contextmenu', handleContextMenu);
      window.removeEventListener('copy', handleCopyCutPaste);
      window.removeEventListener('cut', handleCopyCutPaste);
      window.removeEventListener('paste', handleCopyCutPaste);
    };
  }, [showToast, triggerReturnToLogin]);

  // Local authoritative countdown timer
  useEffect(() => {
    if (questions.length === 0) return;
    const timer = setInterval(() => {
      setTimeLeft(prev => (prev <= 1 ? 0 : prev - 1));
    }, 1000);

    return () => clearInterval(timer);
  }, [exam.id, student.id, sessionKey, questions.length]);

  useEffect(() => {
    if (timeLeft === 0 && questions.length > 0 && !hasSubmittedRef.current) {
      handleSubmitExam();
    }
  }, [timeLeft, questions.length]);

  // Format seconds to HH:MM:SS
  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  // Select a single option with immediate local persistence
  const handleSelectOption = (optionId: string) => {
    const newAnswer: StudentAnswer = {
      questionId: currentQuestion.id,
      selectedOption: optionId,
      isDoubtful: currentAnswer?.isDoubtful ?? false,
      answeredAt: Date.now(),
    };

    setAnswers(prev => ({
      ...prev,
      [currentQuestion.id]: newAnswer,
    }));

    // Immediate Local-First Save
    CBTStorageService.saveStudentAnswerLocally(exam.id, student.id, newAnswer);
  };

  // Toggle an option for MCMA (Pilihan Ganda Kompleks)
  const handleToggleMcmaOption = (optionId: string) => {
    const currentSelected = Array.isArray(currentAnswer?.selectedOption)
      ? currentAnswer.selectedOption
      : currentAnswer?.selectedOption
        ? [currentAnswer.selectedOption]
        : [];
    const exists = currentSelected.includes(optionId);
    const nextSelected = exists
      ? currentSelected.filter(id => id !== optionId)
      : [...currentSelected, optionId];

    const newAnswer: StudentAnswer = {
      questionId: currentQuestion.id,
      selectedOption: nextSelected,
      isDoubtful: currentAnswer?.isDoubtful ?? false,
      answeredAt: Date.now(),
    };

    setAnswers(prev => ({
      ...prev,
      [currentQuestion.id]: newAnswer,
    }));

    CBTStorageService.saveStudentAnswerLocally(exam.id, student.id, newAnswer);
  };

  // Save essay / short answer text locally
  const handleChangeEssayAnswer = (value: string) => {
    const newAnswer: StudentAnswer = {
      questionId: currentQuestion.id,
      selectedOption: value,
      isDoubtful: currentAnswer?.isDoubtful ?? false,
      answeredAt: Date.now(),
    };

    setAnswers(prev => ({
      ...prev,
      [currentQuestion.id]: newAnswer,
    }));

    CBTStorageService.saveStudentAnswerLocally(exam.id, student.id, newAnswer);
  };

  // Toggle doubtful flag
  const handleToggleDoubtful = () => {
    const isCurrentlyDoubtful = currentAnswer?.isDoubtful ?? false;
    const newAnswer: StudentAnswer = {
      questionId: currentQuestion.id,
      selectedOption: currentAnswer?.selectedOption ?? '',
      isDoubtful: !isCurrentlyDoubtful,
      answeredAt: Date.now(),
    };

    setAnswers(prev => ({
      ...prev,
      [currentQuestion.id]: newAnswer,
    }));

    CBTStorageService.saveStudentAnswerLocally(exam.id, student.id, newAnswer);
  };

  // Submit final exam (reads latest refs so timer auto-submit never drops answers)
  const handleSubmitExam = () => {
    if (hasSubmittedRef.current) return;
    hasSubmittedRef.current = true;
    isIntentionalExitRef.current = true;

    const durationUsed = Math.floor((Date.now() - startTimeRef.current) / 1000);
    const submission = CBTStorageService.calculateAndSubmitExam(
      exam.id,
      student,
      answersRef.current,
      infractionsRef.current,
      durationUsed
    );

    // If in fullscreen, exit cleanly
    if (document.fullscreenElement) {
      document.exitFullscreen().catch(() => {});
    }

    onFinishExam(submission);
  };

  const hasAnswerValue = (sel: string | string[] | undefined) => {
    if (!sel) return false;
    if (Array.isArray(sel)) return sel.length > 0;
    return sel.trim().length > 0;
  };

  // Stats for confirmation
  const answeredCount = questions.filter(
    q => hasAnswerValue(answers[q.id]?.selectedOption)
  ).length;
  const doubtfulCount = questions.filter(q => answers[q.id]?.isDoubtful).length;
  const unansweredCount = questions.length - answeredCount;

  const isMcma = currentQuestion?.type === 'multiple_choice';
  const isEssay = currentQuestion?.type === 'essay' || currentQuestion?.type === 'short_answer';
  const essayMode = currentQuestion?.essayOptions?.inputMode || (currentQuestion?.type === 'short_answer' ? 'short' : 'long');

  // Font size class mapping
  const fontClasses = {
    normal: 'text-sm sm:text-base',
    large: 'text-base sm:text-lg',
    xlarge: 'text-lg sm:text-xl',
  };

  if (!currentQuestion) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-100 dark:bg-slate-950 p-4">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 max-w-md w-full text-center space-y-4 shadow-lg">
          <div className="w-12 h-12 rounded-full bg-amber-100 dark:bg-amber-950 text-amber-600 dark:text-amber-400 flex items-center justify-center mx-auto">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <h2 className="text-base font-bold text-slate-900 dark:text-white">
            Naskah Soal Belum Tersedia
          </h2>
          <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
            Belum ada butir soal yang dapat dimuat untuk ujian{' '}
            <strong>{exam.title}</strong>. Silakan kembali ke dashboard dan hubungi guru pengampu.
          </p>
          <button
            type="button"
            onClick={() => {
              isIntentionalExitRef.current = true;
              if (document.fullscreenElement) {
                document.exitFullscreen().catch(() => {});
              }
              if (onExitEmpty) {
                onExitEmpty();
              } else {
                handleSubmitExam();
              }
            }}
            className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold transition-colors"
          >
            Kembali ke Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-100 dark:bg-slate-950 text-slate-900 dark:text-slate-100 select-none">
      {/* Toast alert banner */}
      {toastMessage && (
        <div className="fixed top-18 right-4 z-50 max-w-md bg-amber-500 text-white px-4 py-3 rounded-lg shadow-lg flex items-center gap-3 animate-fade-in text-xs sm:text-sm font-medium">
          <ShieldAlert className="w-5 h-5 shrink-0" />
          <span>{toastMessage}</span>
          <button onClick={() => setToastMessage(null)} className="ml-auto text-white/80 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Fullscreen Warning Modal */}
      {showFullscreenAlert && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 max-w-md w-full rounded-xl p-6 border-2 border-red-500 shadow-2xl text-center">
            <div className="w-14 h-14 mx-auto mb-4 bg-red-100 dark:bg-red-950 text-red-600 dark:text-red-400 rounded-full flex items-center justify-center">
              <ShieldAlert className="w-8 h-8" />
            </div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-2">
              Peringatan Pelanggaran Layar Penuh!
            </h2>
            <p className="text-xs text-slate-600 dark:text-slate-300 mb-4 leading-relaxed">
              Anda terdeteksi keluar dari mode layar penuh (Fullscreen). Tindakan ini telah dicatat dalam log integritas pengawas ruang. Silakan klik tombol di bawah untuk melanjutkan ujian.
            </p>
            <div className="text-xs font-mono text-red-600 dark:text-red-400 mb-6 bg-red-50 dark:bg-red-950/50 py-1.5 px-3 rounded-md">
              Total Catatan Pelanggaran: {infractions.length}
            </div>
            <button
              onClick={() => {
                enterFullscreen();
                setShowFullscreenAlert(false);
              }}
              className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white text-xs sm:text-sm font-semibold rounded-lg shadow-sm transition-colors flex items-center justify-center gap-2"
            >
              <Maximize2 className="w-4 h-4" />
              <span>Kembalikan ke Layar Penuh (Fullscreen)</span>
            </button>
          </div>
        </div>
      )}

      {/* Official ANBK / CBT Header Bar */}
      <header className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 shadow-2xs sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2.5">
          <div className="flex flex-wrap items-center justify-between gap-4">
            {/* Student & Exam Info with School Logo */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white dark:bg-slate-800 p-1 border border-slate-200 dark:border-slate-700 shadow-2xs flex items-center justify-center shrink-0 overflow-hidden">
                <img
                  src={CBTStorageService.resolveLogoUrl(branding.logoUrl)}
                  alt="Logo Sekolah"
                  className="w-full h-full object-contain"
                  onError={(e) => {
                    e.currentTarget.onerror = null;
                    e.currentTarget.src = DEFAULT_SCHOOL_LOGO_URL;
                  }}
                  referrerPolicy="no-referrer"
                />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
                    {student.name}
                  </span>
                  <span className="text-xs text-slate-500 font-mono">
                    ({student.nis || student.nisn})
                  </span>
                </div>
                <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-2">
                  <span>{exam.subject}</span>
                  <span>·</span>
                  <span>{student.className}</span>
                  <span>·</span>
                  <span>{student.room}</span>
                </div>
              </div>
            </div>

            {/* Countdown Timer & Action Controls */}
            <div className="flex items-center gap-3 sm:gap-4 ml-auto">
              {/* Font Sizer */}
              <div className="hidden md:flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-md text-xs font-semibold">
                <button
                  onClick={() => setFontSize('normal')}
                  className={`px-2 py-0.5 rounded transition-colors ${
                    fontSize === 'normal' ? 'bg-white dark:bg-slate-700 shadow-2xs text-indigo-600 dark:text-indigo-300' : 'text-slate-600 dark:text-slate-400'
                  }`}
                  title="Ukuran font normal"
                >
                  A
                </button>
                <button
                  onClick={() => setFontSize('large')}
                  className={`px-2 py-0.5 rounded transition-colors ${
                    fontSize === 'large' ? 'bg-white dark:bg-slate-700 shadow-2xs text-indigo-600 dark:text-indigo-300' : 'text-slate-600 dark:text-slate-400'
                  }`}
                  title="Ukuran font sedang"
                >
                  A+
                </button>
                <button
                  onClick={() => setFontSize('xlarge')}
                  className={`px-2 py-0.5 rounded transition-colors ${
                    fontSize === 'xlarge' ? 'bg-white dark:bg-slate-700 shadow-2xs text-indigo-600 dark:text-indigo-300' : 'text-slate-600 dark:text-slate-400'
                  }`}
                  title="Ukuran font besar"
                >
                  A++
                </button>
              </div>

              {/* Countdown Display */}
              <div
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border font-mono font-bold text-xs sm:text-sm transition-colors ${
                  timeLeft <= 600
                    ? 'bg-red-50 dark:bg-red-950/60 border-red-300 dark:border-red-800 text-red-600 dark:text-red-400 animate-pulse'
                    : 'bg-indigo-50 dark:bg-indigo-950/50 border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300'
                }`}
              >
                <Clock className="w-4 h-4 shrink-0" />
                <span className="tracking-wider">{formatTime(timeLeft)}</span>
              </div>

              {/* Daftar Soal Button */}
              <button
                onClick={() => setShowQuestionGrid(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-semibold shadow-2xs transition-colors"
              >
                <Grid3X3 className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Daftar Soal</span>
                <span className="sm:hidden font-mono">({currentIndex + 1}/{questions.length})</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Local-First & Sync Status Indicator Bar */}
      <div className="bg-slate-200/70 dark:bg-slate-800/60 border-b border-slate-300/60 dark:border-slate-700/60 py-1 px-4 text-[11px] text-slate-600 dark:text-slate-300">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            <span>
              <strong>Local-First Active:</strong> Jawaban otomatis tersimpan pada memori perangkat.
            </span>
          </div>

          <div className="flex items-center gap-3">
            {isFullscreen ? (
              <span className="hidden sm:flex items-center gap-1 text-indigo-700 dark:text-indigo-300 font-medium">
                <Minimize2 className="w-3.5 h-3.5" />
                Layar Penuh (ESC: ke Login)
              </span>
            ) : (
              <button
                type="button"
                onClick={enterFullscreen}
                className="flex items-center gap-1 px-2 py-0.5 rounded bg-indigo-600 hover:bg-indigo-700 text-white font-semibold transition-colors"
                title="Aktifkan Layar Penuh (tekan ESC jika terjadi kendala untuk kembali ke Login)"
              >
                <Maximize2 className="w-3 h-3" />
                <span>Layar Penuh</span>
              </button>
            )}
            {isSimulatedOffline ? (
              <span className="flex items-center gap-1 text-amber-700 dark:text-amber-300">
                <WifiOff className="w-3.5 h-3.5" />
                Mode Offline (Ujian Aman)
              </span>
            ) : (
              <span className="flex items-center gap-1 text-emerald-700 dark:text-emerald-400">
                <Wifi className="w-3.5 h-3.5" />
                Online & Auto Sync
              </span>
            )}
            {infractions.length > 0 && (
              <span className="text-red-600 dark:text-red-400 font-semibold">
                Pelanggaran: {infractions.length}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Main Question Testing Area */}
      <main className="flex-1 max-w-5xl mx-auto w-full p-4 sm:p-6 lg:p-8 flex flex-col justify-between">
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 sm:p-8 shadow-xs">
          {/* Question Header */}
          <div className="flex flex-wrap items-center justify-between gap-2 pb-4 mb-6 border-b border-slate-100 dark:border-slate-800">
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="w-8 h-8 rounded-lg bg-indigo-600 text-white font-bold text-sm flex items-center justify-center">
                {currentIndex + 1}
              </span>
              <span className="text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-300">
                Soal Nomor {currentIndex + 1} dari {questions.length}
              </span>
              <span
                className={`px-2 py-0.5 rounded text-[11px] font-semibold ${
                  isMcma
                    ? 'bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300'
                    : isEssay
                      ? 'bg-teal-100 dark:bg-teal-950 text-teal-700 dark:text-teal-300'
                      : 'bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300'
                }`}
              >
                {isMcma
                  ? 'Pilihan Ganda Kompleks (MCMA)'
                  : isEssay
                    ? essayMode === 'short'
                      ? 'Uraian Singkat'
                      : 'Soal Uraian'
                    : 'Pilihan Ganda Biasa'}
              </span>
            </div>

            <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
              <span>Bobot: <strong>{currentQuestion.points} Poin</strong></span>
              {currentAnswer?.isDoubtful && (
                <span className="px-2 py-0.5 bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 rounded font-semibold text-[11px]">
                  Ragu-Ragu
                </span>
              )}
            </div>
          </div>

          {/* Question Text with KaTeX Rendering */}
          <div className={`mb-6 leading-relaxed ${fontClasses[fontSize]}`}>
            <MathText content={currentQuestion.questionText} />
          </div>

          {currentQuestion.imageUrl && (
            <div className="mb-6">
              <img
                src={currentQuestion.imageUrl}
                alt={`Ilustrasi Soal ${currentIndex + 1}`}
                className="max-h-72 rounded-xl object-contain border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 p-1"
              />
            </div>
          )}

          {/* Answer Input / Options */}
          {isEssay ? (
            <div className="space-y-2.5">
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300">
                {essayMode === 'short'
                  ? 'Tuliskan jawaban singkat Anda pada kolom di bawah ini:'
                  : 'Tuliskan jawaban uraian Anda dengan jelas dan lengkap pada kolom di bawah ini:'}
              </label>
              {essayMode === 'short' ? (
                <input
                  type="text"
                  value={typeof currentAnswer?.selectedOption === 'string' ? currentAnswer.selectedOption : ''}
                  onChange={(e) => handleChangeEssayAnswer(e.target.value)}
                  placeholder="Ketik jawaban singkat Anda di sini..."
                  className={`w-full px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/70 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500 select-text ${fontClasses[fontSize]}`}
                />
              ) : (
                <textarea
                  rows={5}
                  value={typeof currentAnswer?.selectedOption === 'string' ? currentAnswer.selectedOption : ''}
                  onChange={(e) => handleChangeEssayAnswer(e.target.value)}
                  placeholder="Ketik jawaban uraian Anda di sini..."
                  className={`w-full p-4 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/70 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500 select-text ${fontClasses[fontSize]}`}
                />
              )}
              <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
                <span>Jawaban Anda tersimpan otomatis setiap kali diketik.</span>
                <span className="font-mono">
                  {(typeof currentAnswer?.selectedOption === 'string' ? currentAnswer.selectedOption.length : 0)} karakter
                </span>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {isMcma && (
                <div className="text-xs font-medium text-purple-700 dark:text-purple-300 bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800 px-3 py-2 rounded-lg">
                  Pilih <strong>lebih dari satu jawaban</strong> yang menurut Anda paling tepat (centang kotak di samping opsi).
                </div>
              )}
              {currentQuestion.options.map((opt) => {
                const selectedArray = Array.isArray(currentAnswer?.selectedOption)
                  ? currentAnswer.selectedOption
                  : [];
                const isSelected = isMcma
                  ? selectedArray.includes(opt.id)
                  : currentAnswer?.selectedOption === opt.id;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => (isMcma ? handleToggleMcmaOption(opt.id) : handleSelectOption(opt.id))}
                    className={`w-full text-left p-3.5 sm:p-4 rounded-xl border transition-all flex items-start gap-3 sm:gap-4 ${
                      isSelected
                        ? isMcma
                          ? 'border-purple-600 bg-purple-50/70 dark:bg-purple-950/40 text-purple-950 dark:text-purple-100 shadow-xs'
                          : 'border-indigo-600 bg-indigo-50/70 dark:bg-indigo-950/40 text-indigo-900 dark:text-indigo-100 shadow-xs'
                        : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300 dark:hover:border-slate-700 text-slate-800 dark:text-slate-200'
                    }`}
                  >
                    {isMcma ? (
                      <div className="flex items-center gap-2 shrink-0">
                        <span
                          className={`w-6 h-6 rounded border-2 flex items-center justify-center transition-colors ${
                            isSelected
                              ? 'bg-purple-600 border-purple-600 text-white'
                              : 'border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800'
                          }`}
                        >
                          {isSelected && <Check className="w-4 h-4" />}
                        </span>
                        <span
                          className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs sm:text-sm transition-colors ${
                            isSelected
                              ? 'bg-purple-600 text-white'
                              : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                          }`}
                        >
                          {opt.label}
                        </span>
                      </div>
                    ) : (
                      <div
                        className={`w-7 h-7 sm:w-8 sm:h-8 rounded-lg shrink-0 flex items-center justify-center font-bold text-xs sm:text-sm transition-colors ${
                          isSelected
                            ? 'bg-indigo-600 text-white'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                        }`}
                      >
                        {opt.label}
                      </div>
                    )}

                    {/* Option Content with KaTeX */}
                    <div className={`flex-1 pt-0.5 sm:pt-1 ${fontClasses[fontSize]}`}>
                      <MathText content={opt.text} />
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Bottom Navigation Buttons (Standard Kemdikbud/ANBK Layout) */}
        <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
          {/* Previous Button */}
          <button
            type="button"
            disabled={currentIndex === 0}
            onClick={() => setCurrentIndex(prev => Math.max(0, prev - 1))}
            className="px-4 py-2.5 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-40 border border-slate-300 dark:border-slate-700 rounded-lg text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-200 transition-colors flex items-center gap-2 shadow-2xs"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Soal Sebelumnya</span>
          </button>

          {/* Doubtful (Ragu-ragu) Toggle Button */}
          <button
            type="button"
            onClick={handleToggleDoubtful}
            className={`px-4 py-2.5 rounded-lg text-xs sm:text-sm font-semibold transition-all border flex items-center gap-2 shadow-2xs ${
              currentAnswer?.isDoubtful
                ? 'bg-amber-500 border-amber-600 text-white'
                : 'bg-amber-50 dark:bg-amber-950/40 border-amber-300 dark:border-amber-800 text-amber-800 dark:text-amber-200 hover:bg-amber-100'
            }`}
          >
            <HelpCircle className="w-4 h-4" />
            <span>{currentAnswer?.isDoubtful ? 'Status: Ragu-Ragu' : 'Tandai Ragu-Ragu'}</span>
          </button>

          {/* Next / Submit Button */}
          {currentIndex < questions.length - 1 ? (
            <button
              type="button"
              onClick={() => setCurrentIndex(prev => Math.min(questions.length - 1, prev + 1))}
              className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs sm:text-sm font-semibold transition-colors flex items-center gap-2 shadow-xs"
            >
              <span>Soal Selanjutnya</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setShowConfirmSubmit(true)}
              className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs sm:text-sm font-bold transition-colors flex items-center gap-2 shadow-xs"
            >
              <Send className="w-4 h-4" />
              <span>Selesai & Kumpulkan Ujian</span>
            </button>
          )}
        </div>
      </main>

      {/* Slide-out Question Navigation Modal */}
      {showQuestionGrid && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 backdrop-blur-2xs">
          <div className="bg-white dark:bg-slate-900 max-w-lg w-full rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-2xl">
            <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-100 dark:border-slate-800">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Daftar Navigasi Soal
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Pilih nomor soal untuk melompat langsung ke soal tersebut
                </p>
              </div>
              <button
                onClick={() => setShowQuestionGrid(false)}
                className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-300 hover:bg-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Legend */}
            <div className="grid grid-cols-3 gap-2 mb-6 text-xs text-slate-600 dark:text-slate-300">
              <div className="flex items-center gap-2">
                <span className="w-3.5 h-3.5 rounded bg-emerald-500 shrink-0" />
                <span>Sudah ({answeredCount})</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3.5 h-3.5 rounded bg-amber-500 shrink-0" />
                <span>Ragu ({doubtfulCount})</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3.5 h-3.5 rounded bg-slate-200 dark:bg-slate-700 shrink-0" />
                <span>Kosong ({unansweredCount})</span>
              </div>
            </div>

            {/* Grid of question buttons */}
            <div className="grid grid-cols-5 sm:grid-cols-6 gap-2.5 max-h-72 overflow-y-auto p-1">
              {questions.map((q, idx) => {
                const ans = answers[q.id];
                const isCurrent = idx === currentIndex;
                const isAnswered = hasAnswerValue(ans?.selectedOption);
                const isDoubtful = ans?.isDoubtful;

                let colorClasses = 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-700';
                if (isDoubtful) {
                  colorClasses = 'bg-amber-500 border-amber-600 text-white font-bold';
                } else if (isAnswered) {
                  colorClasses = 'bg-emerald-600 border-emerald-700 text-white font-bold';
                }

                return (
                  <button
                    key={q.id}
                    onClick={() => {
                      setCurrentIndex(idx);
                      setShowQuestionGrid(false);
                    }}
                    className={`h-11 rounded-lg border text-sm font-semibold flex items-center justify-center transition-all ${colorClasses} ${
                      isCurrent ? 'ring-3 ring-indigo-500 ring-offset-2 dark:ring-offset-slate-900 scale-105' : ''
                    }`}
                  >
                    {idx + 1}
                  </button>
                );
              })}
            </div>

            <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <button
                onClick={() => {
                  setShowQuestionGrid(false);
                  setShowConfirmSubmit(true);
                }}
                className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs sm:text-sm font-semibold rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                <Send className="w-4 h-4" />
                <span>Kumpulkan Ujian Sekarang</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Final Submit Confirmation Modal */}
      {showConfirmSubmit && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4 backdrop-blur-2xs">
          <div className="bg-white dark:bg-slate-900 max-w-md w-full rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-2xl">
            <div className="w-12 h-12 mx-auto mb-3 bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 rounded-full flex items-center justify-center">
              <CheckCircle2 className="w-6 h-6" />
            </div>

            <h3 className="text-lg font-bold text-slate-900 dark:text-white text-center mb-1">
              Konfirmasi Selesai Ujian
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 text-center mb-4">
              Periksa kembali rekapitulasi pengerjaan Anda sebelum mengumpulkan.
            </p>

            {/* Summary statistics */}
            <div className="grid grid-cols-3 gap-2 p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl mb-4 border border-slate-200 dark:border-slate-700 text-center">
              <div>
                <span className="block text-lg font-bold text-emerald-600 dark:text-emerald-400 font-mono">
                  {answeredCount}
                </span>
                <span className="text-[11px] text-slate-500">Terjawab</span>
              </div>
              <div>
                <span className="block text-lg font-bold text-amber-500 font-mono">
                  {doubtfulCount}
                </span>
                <span className="text-[11px] text-slate-500">Ragu-Ragu</span>
              </div>
              <div>
                <span className="block text-lg font-bold text-slate-600 dark:text-slate-400 font-mono">
                  {unansweredCount}
                </span>
                <span className="text-[11px] text-slate-500">Kosong</span>
              </div>
            </div>

            {(doubtfulCount > 0 || unansweredCount > 0) && (
              <div className="mb-4 p-3 bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-800 rounded-lg text-xs text-amber-800 dark:text-amber-200 flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <span>
                  Perhatian: Anda masih memiliki <strong>{doubtfulCount} soal ragu-ragu</strong> dan <strong>{unansweredCount} soal yang belum dijawab</strong>. Jawaban yang belum diisi akan bernilai 0.
                </span>
              </div>
            )}

            <div className="mb-5">
              <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-700 dark:text-slate-300">
                <input
                  type="checkbox"
                  checked={agreeConfirm}
                  onChange={(e) => setAgreeConfirm(e.target.checked)}
                  className="rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4"
                />
                <span>Saya yakin ingin mengakhiri dan mengumpulkan jawaban ujian ini.</span>
              </label>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setShowConfirmSubmit(false)}
                className="flex-1 py-2.5 px-3 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 text-xs font-semibold rounded-lg transition-colors"
              >
                Batal & Lanjut Mengerjakan
              </button>
              <button
                type="button"
                disabled={!agreeConfirm}
                onClick={handleSubmitExam}
                className="flex-1 py-2.5 px-3 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-bold rounded-lg transition-colors shadow-xs"
              >
                Kumpulkan Ujian
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
