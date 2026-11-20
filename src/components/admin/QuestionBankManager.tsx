/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef, useState } from 'react';
import {
  BookOpen,
  Plus,
  Trash2,
  Edit3,
  CheckCircle2,
  Sparkles,
  Eye,
  Sigma,
  Code,
  Save,
  Clock,
  Award,
  Layers,
  AlertTriangle,
  Download,
  Upload,
  FileText,
  AlertCircle,
  X,
  Check,
  CheckSquare,
  CircleDot,
  ListChecks,
  AlignLeft
} from 'lucide-react';
import {
  EssayQuestionOptions,
  Exam,
  ExamActivity,
  Question,
  QuestionOption,
  Subject,
} from '../../types/cbt';
import { CBTStorageService } from '../../services/cbt-storage';
import { QuestionDocService } from '../../services/question-doc-service';
import { MathText } from '../MathText';

const OPTION_LETTERS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'] as const;

const createDefaultChoiceOptions = (): QuestionOption[] => [
  { id: 'opt-a', label: 'A', text: '' },
  { id: 'opt-b', label: 'B', text: '' },
  { id: 'opt-c', label: 'C', text: '' },
  { id: 'opt-d', label: 'D', text: '' },
  { id: 'opt-e', label: 'E', text: '' },
];

const isMcmaQuestion = (q: Question): boolean => q.type === 'multiple_choice';
const isEssayQuestion = (q: Question): boolean => q.type === 'essay' || q.type === 'short_answer';

const getEssayConfig = (q: Question): EssayQuestionOptions => ({
  inputMode: q.essayOptions?.inputMode || (q.type === 'short_answer' ? 'short' : 'long'),
  matchMode: q.essayOptions?.matchMode || 'contains',
});

const getEssayAcceptedAnswers = (q: Question): string[] => {
  const fromCorrect = Array.isArray(q.correctAnswer)
    ? q.correctAnswer
    : q.correctAnswer
      ? [q.correctAnswer]
      : [];
  const fromOpts = (q.options || []).map(o => o.text);
  return Array.from(new Set([...fromCorrect, ...fromOpts].map(s => s.trim()).filter(Boolean)));
};

interface QuestionBankManagerProps {
  exams: Exam[];
  onRefreshExams: () => void;
}

export const QuestionBankManager: React.FC<QuestionBankManagerProps> = ({
  exams,
  onRefreshExams,
}) => {
  const [activities, setActivities] = useState<ExamActivity[]>(() => CBTStorageService.getActivities());
  const [subjects, setSubjects] = useState<Subject[]>(() => CBTStorageService.getSubjects());

  const initialActivityId = (() => {
    const firstExam = exams[0];
    if (firstExam) {
      const matched = activities.find(
        a =>
          firstExam.title.toLowerCase().includes(a.code.toLowerCase()) ||
          firstExam.title.toLowerCase().includes(a.name.toLowerCase())
      );
      if (matched) return matched.id;
    }
    return activities[0]?.id || '';
  })();

  const initialSubjectId = (() => {
    const firstExam = exams[0];
    if (firstExam) {
      const matched = subjects.find(
        s => s.name.toLowerCase() === firstExam.subject.toLowerCase()
      );
      if (matched) return matched.id;
    }
    return subjects[0]?.id || '';
  })();

  const [selectedActivityId, setSelectedActivityId] = useState<string>(initialActivityId);
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>(initialSubjectId);
  const selectedActivityIdRef = useRef<string>(initialActivityId);
  const selectedSubjectIdRef = useRef<string>(initialSubjectId);

  const [selectedExam, setSelectedExam] = useState<Exam | undefined>(() => {
    const act = activities.find(a => a.id === initialActivityId);
    const subj = subjects.find(s => s.id === initialSubjectId);
    if (act && subj) {
      return CBTStorageService.ensureExamForActivitySubject(act, subj);
    }
    return exams[0];
  });
  const [kkmInput, setKkmInput] = useState<number>(() => selectedExam?.kkm ?? 75);

  const [questions, setQuestions] = useState<Question[]>(() => {
    return selectedExam ? CBTStorageService.getQuestions(selectedExam.id) : [];
  });

  const [activeTab, setActiveTab] = useState<'list' | 'editor'>('list');
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);
  const [saveNotice, setSaveNotice] = useState<string | null>(null);
  const [errorNotice, setErrorNotice] = useState<string | null>(null);
  const [isProcessingDoc, setIsProcessingDoc] = useState<boolean>(false);
  const [importPreviewModal, setImportPreviewModal] = useState<{
    fileName: string;
    questions: Question[];
    warnings: string[];
  } | null>(null);
  const [importMode, setImportMode] = useState<'append' | 'replace'>('append');
  const docUploadInputRef = useRef<HTMLInputElement | null>(null);
  const [deleteQuestionTarget, setDeleteQuestionTarget] = useState<{
    id: string;
    number: number;
  } | null>(null);

  // Form states for question editor
  const [questionType, setQuestionType] = useState<'single_choice' | 'multiple_choice' | 'essay'>('single_choice');
  const [questionText, setQuestionText] = useState<string>('');
  const [imageUrl, setImageUrl] = useState<string>('');
  const questionImageInputRef = useRef<HTMLInputElement | null>(null);
  const [points, setPoints] = useState<number>(20);
  const [options, setOptions] = useState<QuestionOption[]>(createDefaultChoiceOptions);
  const [correctAnswer, setCorrectAnswer] = useState<string>('opt-a');
  const [correctAnswers, setCorrectAnswers] = useState<string[]>(['opt-a']);
  const [essayInputMode, setEssayInputMode] = useState<'short' | 'long'>('long');
  const [essayMatchMode, setEssayMatchMode] = useState<'contains' | 'exact' | 'manual'>('contains');
  const [essayAnswers, setEssayAnswers] = useState<string[]>(['']);
  const [explanation, setExplanation] = useState<string>('');

  // Keep master Aktivitas Ujian & Mata Pelajaran listboxes synchronized with Admin edits & Supabase pulls
  useEffect(() => {
    const syncMasterLists = () => {
      const nextActivities = CBTStorageService.getActivities();
      const nextSubjects = CBTStorageService.getSubjects();
      setActivities(nextActivities);
      setSubjects(nextSubjects);

      const nextActId = nextActivities.some(a => a.id === selectedActivityIdRef.current)
        ? selectedActivityIdRef.current
        : (nextActivities[0]?.id || '');
      const nextSubjId = nextSubjects.some(s => s.id === selectedSubjectIdRef.current)
        ? selectedSubjectIdRef.current
        : (nextSubjects[0]?.id || '');

      if (nextActId !== selectedActivityIdRef.current) {
        selectedActivityIdRef.current = nextActId;
        setSelectedActivityId(nextActId);
      }
      if (nextSubjId !== selectedSubjectIdRef.current) {
        selectedSubjectIdRef.current = nextSubjId;
        setSelectedSubjectId(nextSubjId);
      }

      const act = nextActivities.find(a => a.id === nextActId);
      const subj = nextSubjects.find(s => s.id === nextSubjId);
      if (act && subj) {
        const resolved = CBTStorageService.ensureExamForActivitySubject(act, subj);
        setSelectedExam(resolved);
        setKkmInput(resolved.kkm ?? 75);
        setQuestions(CBTStorageService.getQuestions(resolved.id));
      } else {
        setSelectedExam(undefined);
        setQuestions([]);
      }
    };

    syncMasterLists();
    window.addEventListener('cbt-activities-change', syncMasterLists);
    window.addEventListener('cbt-subjects-change', syncMasterLists);
    window.addEventListener('cbt-questions-change', syncMasterLists);
    window.addEventListener('cbt-exams-change', syncMasterLists);
    window.addEventListener('storage', syncMasterLists);
    return () => {
      window.removeEventListener('cbt-activities-change', syncMasterLists);
      window.removeEventListener('cbt-subjects-change', syncMasterLists);
      window.removeEventListener('cbt-questions-change', syncMasterLists);
      window.removeEventListener('cbt-exams-change', syncMasterLists);
      window.removeEventListener('storage', syncMasterLists);
    };
  }, []);

  const syncSelection = (actId: string, subjId: string) => {
    const latestActivities = CBTStorageService.getActivities();
    const latestSubjects = CBTStorageService.getSubjects();
    setActivities(latestActivities);
    setSubjects(latestSubjects);

    const act = latestActivities.find(a => a.id === actId);
    const subj = latestSubjects.find(s => s.id === subjId);
    if (act && subj) {
      const resolved = CBTStorageService.ensureExamForActivitySubject(act, subj);
      setSelectedExam(resolved);
      setKkmInput(resolved.kkm ?? 75);
      setQuestions(CBTStorageService.getQuestions(resolved.id));
      onRefreshExams();
    } else {
      setSelectedExam(undefined);
      setQuestions([]);
    }
    setActiveTab('list');
    setEditingQuestion(null);
  };

  const handleSelectActivity = (actId: string) => {
    selectedActivityIdRef.current = actId;
    setSelectedActivityId(actId);
    syncSelection(actId, selectedSubjectIdRef.current);
  };

  const handleSelectSubject = (subjId: string) => {
    selectedSubjectIdRef.current = subjId;
    setSelectedSubjectId(subjId);
    syncSelection(selectedActivityIdRef.current, subjId);
  };

  const showNotice = (msg: string) => {
    setErrorNotice(null);
    setSaveNotice(msg);
    setTimeout(() => setSaveNotice(null), 4000);
  };

  const showError = (msg: string) => {
    setSaveNotice(null);
    setErrorNotice(msg);
  };

  const selectedActivity = activities.find(a => a.id === selectedActivityId);
  const selectedSubject = subjects.find(s => s.id === selectedSubjectId);

  const handleSaveKkm = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!selectedExam) return;
    const clampedKkm = Math.min(100, Math.max(0, Math.round(Number(kkmInput) || 0)));
    setKkmInput(clampedKkm);
    const updatedExam: Exam = { ...selectedExam, kkm: clampedKkm };
    CBTStorageService.saveExam(updatedExam);
    setSelectedExam(updatedExam);
    onRefreshExams();
    showNotice(`Nilai KKM untuk ${selectedSubject?.name || selectedExam.subject} berhasil disimpan (${clampedKkm}).`);
  };

  const handleUpdateQuestionPoints = (q: Question, rawValue: string) => {
    const parsed = Number(rawValue);
    const safePoints = Number.isFinite(parsed) && parsed >= 0 ? Math.min(1000, parsed) : 0;
    const updated: Question = { ...q, points: safePoints };
    CBTStorageService.saveQuestion(updated);
    setQuestions(prev => prev.map(item => (item.id === q.id ? updated : item)));
    onRefreshExams();
  };

  const handleDistributePointsEvenly = () => {
    if (!selectedExam || questions.length === 0) return;
    const base = Math.floor(100 / questions.length);
    const remainder = 100 - base * questions.length;
    const updatedList = questions.map((q, idx) => {
      const nextPoints = base + (idx < remainder ? 1 : 0);
      const updated = { ...q, points: Math.max(1, nextPoints) };
      CBTStorageService.saveQuestion(updated);
      return updated;
    });
    setQuestions(updatedList);
    onRefreshExams();
    showNotice(`Skor ${questions.length} butir soal berhasil dibagi rata (Total: 100 Poin).`);
  };

  const handleDownloadDocTemplate = async () => {
    try {
      setIsProcessingDoc(true);
      await QuestionDocService.downloadQuestionDocTemplate(
        selectedActivity?.name || 'Asesmen Ujian CBT',
        selectedSubject?.name || 'Mata Pelajaran'
      );
      showNotice('Template soal dokumen (.docx) berhasil diunduh!');
    } catch (err) {
      showError(
        err instanceof Error ? err.message : 'Gagal membuat file template dokumen soal.'
      );
    } finally {
      setIsProcessingDoc(false);
    }
  };

  const handleUploadDocFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !selectedExam) return;

    try {
      setIsProcessingDoc(true);
      setErrorNotice(null);
      const parsed = await QuestionDocService.parseQuestionDocumentFile(file, selectedExam.id);
      if (parsed.questions.length === 0) {
        showError(
          'Tidak ditemukan butir soal yang valid di dalam dokumen. Pastikan format mengikuti template (SOAL 1, TIPE: PG/MCMA/URAIAN, A.-E., KUNCI: ...).'
        );
        return;
      }
      setImportMode('append');
      setImportPreviewModal({
        fileName: file.name,
        questions: parsed.questions,
        warnings: parsed.warnings,
      });
    } catch (err) {
      showError(
        err instanceof Error
          ? err.message
          : 'Gagal membaca file dokumen soal. Pastikan file berformat .docx / .doc / .txt yang valid.'
      );
    } finally {
      setIsProcessingDoc(false);
      e.target.value = '';
    }
  };

  const updateImportedQuestion = (
    qId: string,
    updater: (prevQ: Question) => Question
  ) => {
    setImportPreviewModal(prev =>
      prev
        ? {
            ...prev,
            questions: prev.questions.map(item => (item.id === qId ? updater(item) : item)),
          }
        : null
    );
  };

  const handleChangeImportedQuestionType = (
    pq: Question,
    nextType: 'single_choice' | 'multiple_choice' | 'essay'
  ) => {
    updateImportedQuestion(pq.id, (item) => {
      if (nextType === 'essay') {
        const existingAccepted = isEssayQuestion(item)
          ? getEssayAcceptedAnswers(item)
          : item.options
              .filter(o =>
                Array.isArray(item.correctAnswer)
                  ? item.correctAnswer.includes(o.id)
                  : item.correctAnswer === o.id
              )
              .map(o => o.text)
              .filter(Boolean);
        const essayOpts: QuestionOption[] = existingAccepted.map((txt, idx) => ({
          id: `ans-${idx + 1}`,
          label: String(idx + 1),
          text: txt,
        }));
        return {
          ...item,
          type: 'essay',
          options: essayOpts,
          correctAnswer: existingAccepted,
          essayOptions: {
            inputMode: item.essayOptions?.inputMode || 'long',
            matchMode: existingAccepted.length > 0 ? item.essayOptions?.matchMode || 'contains' : 'manual',
          },
        };
      }

      const baseOptions =
        !isEssayQuestion(item) && item.options.length >= 2
          ? item.options
          : createDefaultChoiceOptions().map((opt, idx) => ({
              ...opt,
              text: isEssayQuestion(item) ? getEssayAcceptedAnswers(item)[idx] || '' : '',
            }));

      const prevKeyList = Array.isArray(item.correctAnswer)
        ? item.correctAnswer
        : item.correctAnswer
          ? [item.correctAnswer]
          : [];
      const validIds = prevKeyList.filter(id => baseOptions.some(o => o.id === id));
      const fallbackId = baseOptions[0]?.id || 'opt-a';

      return {
        ...item,
        type: nextType,
        options: baseOptions,
        correctAnswer:
          nextType === 'multiple_choice'
            ? validIds.length > 0
              ? validIds
              : [fallbackId]
            : validIds[0] || fallbackId,
        essayOptions: undefined,
      };
    });
  };

  const handleConfirmImportQuestions = () => {
    if (!importPreviewModal || !selectedExam) return;
    const count = CBTStorageService.importQuestions(
      selectedExam.id,
      importPreviewModal.questions,
      importMode === 'replace'
    );
    setQuestions(CBTStorageService.getQuestions(selectedExam.id));
    onRefreshExams();
    setImportPreviewModal(null);
    showNotice(
      `Berhasil mengimpor ${count} butir soal dari dokumen ke paket ${selectedSubject?.name || selectedExam.subject}!`
    );
  };

  const handleStartNewQuestion = () => {
    setEditingQuestion(null);
    setQuestionType('single_choice');
    setQuestionText('Tentukan nilai dari persamaan berikut:\n$$\\int_{0}^{2} (4x - 1) \\, dx$$');
    setImageUrl('');
    setPoints(20);
    setOptions([
      { id: 'opt-a', label: 'A', text: '$4$' },
      { id: 'opt-b', label: 'B', text: '$6$' },
      { id: 'opt-c', label: 'C', text: '$8$' },
      { id: 'opt-d', label: 'D', text: '$10$' },
      { id: 'opt-e', label: 'E', text: '$12$' },
    ]);
    setCorrectAnswer('opt-b');
    setCorrectAnswers(['opt-b']);
    setEssayInputMode('long');
    setEssayMatchMode('contains');
    setEssayAnswers(['']);
    setExplanation('Antiturunan: $F(x) = 2x^2 - x$.\n$F(2) = 2(4) - 2 = 6$.\n$F(0) = 0$.\nMaka $F(2) - F(0) = 6$.');
    setActiveTab('editor');
  };

  const handleEditQuestion = (q: Question) => {
    setEditingQuestion(q);
    setQuestionText(q.questionText);
    setImageUrl(q.imageUrl || '');
    setPoints(q.points);
    setExplanation(q.explanation || '');

    if (isEssayQuestion(q)) {
      setQuestionType('essay');
      const cfg = getEssayConfig(q);
      const accepted = getEssayAcceptedAnswers(q);
      setEssayInputMode(cfg.inputMode);
      setEssayMatchMode(cfg.matchMode);
      setEssayAnswers(accepted.length > 0 ? accepted : ['']);
      setOptions(createDefaultChoiceOptions());
      setCorrectAnswer('opt-a');
      setCorrectAnswers(['opt-a']);
    } else if (isMcmaQuestion(q)) {
      setQuestionType('multiple_choice');
      const opts = q.options.length >= 2 ? q.options : createDefaultChoiceOptions();
      const keys = Array.isArray(q.correctAnswer)
        ? q.correctAnswer
        : q.correctAnswer
          ? [q.correctAnswer]
          : [opts[0]?.id || 'opt-a'];
      setOptions(opts);
      setCorrectAnswers(keys);
      setCorrectAnswer(keys[0] || opts[0]?.id || 'opt-a');
      setEssayInputMode('long');
      setEssayMatchMode('contains');
      setEssayAnswers(['']);
    } else {
      setQuestionType('single_choice');
      const opts = q.options.length >= 2 ? q.options : createDefaultChoiceOptions();
      const singleKey = Array.isArray(q.correctAnswer)
        ? q.correctAnswer[0] || opts[0]?.id || 'opt-a'
        : q.correctAnswer || opts[0]?.id || 'opt-a';
      setOptions(opts);
      setCorrectAnswer(singleKey);
      setCorrectAnswers([singleKey]);
      setEssayInputMode('long');
      setEssayMatchMode('contains');
      setEssayAnswers(['']);
    }
    setActiveTab('editor');
  };

  const handleSwitchEditorType = (nextType: 'single_choice' | 'multiple_choice' | 'essay') => {
    if (nextType === questionType) return;
    setErrorNotice(null);
    if (nextType === 'single_choice') {
      if (options.length < 2) {
        setOptions(createDefaultChoiceOptions());
      }
      if (!options.some(o => o.id === correctAnswer)) {
        setCorrectAnswer(correctAnswers[0] || options[0]?.id || 'opt-a');
      }
    } else if (nextType === 'multiple_choice') {
      if (options.length < 2) {
        setOptions(createDefaultChoiceOptions());
      }
      if (correctAnswers.length === 0) {
        setCorrectAnswers([correctAnswer || options[0]?.id || 'opt-a']);
      }
    } else if (nextType === 'essay') {
      if (essayAnswers.length === 0) {
        setEssayAnswers(['']);
      }
    }
    setQuestionType(nextType);
  };

  const handleAddChoiceOption = () => {
    if (options.length >= OPTION_LETTERS.length) return;
    const nextLetter = OPTION_LETTERS[options.length];
    setOptions(prev => [
      ...prev,
      { id: `opt-${nextLetter.toLowerCase()}`, label: nextLetter, text: '' },
    ]);
  };

  const handleRemoveChoiceOption = (optId: string) => {
    if (options.length <= 2) return;
    const filtered = options.filter(o => o.id !== optId);
    const relabeled = filtered.map((o, idx) => {
      const letter = OPTION_LETTERS[idx];
      return {
        ...o,
        label: letter,
      };
    });
    setOptions(relabeled);
    if (correctAnswer === optId) {
      setCorrectAnswer(relabeled[0]?.id || '');
    }
    setCorrectAnswers(prev => prev.filter(id => id !== optId));
  };

  const handleToggleEditorMcmaKey = (optId: string) => {
    setCorrectAnswers(prev =>
      prev.includes(optId) ? prev.filter(id => id !== optId) : [...prev, optId]
    );
  };

  const handleDeleteQuestion = (q: Question, displayNumber: number) => {
    setDeleteQuestionTarget({ id: q.id, number: displayNumber });
  };

  const handleConfirmDeleteQuestion = () => {
    if (!deleteQuestionTarget || !selectedExam) return;
    CBTStorageService.deleteQuestion(deleteQuestionTarget.id);
    setQuestions(CBTStorageService.getQuestions(selectedExam.id));
    if (editingQuestion?.id === deleteQuestionTarget.id) {
      setEditingQuestion(null);
    }
    onRefreshExams();
    showNotice(`Butir soal nomor ${deleteQuestionTarget.number} berhasil dihapus.`);
    setDeleteQuestionTarget(null);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      showError('Ukuran gambar terlalu besar. Maksimal 5MB.');
      return;
    }
    const reader = new FileReader();
    reader.onload = (evt) => {
      const res = evt.target?.result as string;
      if (res) {
        setImageUrl(res);
        showNotice('Gambar soal berhasil diunggah!');
      }
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleDeleteImage = () => {
    setImageUrl('');
    showNotice('Gambar soal berhasil dihapus.');
  };

  // Quick insert math snippet into textarea
  const insertLatexSnippet = (snippet: string) => {
    setQuestionText(prev => prev + snippet);
  };

  const handleSaveQuestion = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedExam) return;

    let finalOptions: QuestionOption[] = options;
    let finalCorrectAnswer: string | string[] = correctAnswer;
    let finalEssayOptions: EssayQuestionOptions | undefined = undefined;

    if (questionType === 'single_choice') {
      const validOpts = options.filter(o => o.text.trim() !== '');
      if (validOpts.length < 2) {
        showError('Pilihan Ganda Biasa minimal harus memiliki 2 opsi jawaban yang terisi.');
        return;
      }
      if (!options.some(o => o.id === correctAnswer && o.text.trim() !== '')) {
        showError('Pilih salah satu opsi yang terisi sebagai kunci jawaban yang benar.');
        return;
      }
      finalOptions = options;
      finalCorrectAnswer = correctAnswer;
    } else if (questionType === 'multiple_choice') {
      const validOpts = options.filter(o => o.text.trim() !== '');
      if (validOpts.length < 2) {
        showError('Pilihan Ganda Kompleks (MCMA) minimal harus memiliki 2 opsi jawaban yang terisi.');
        return;
      }
      const validKeys = correctAnswers.filter(id =>
        options.some(o => o.id === id && o.text.trim() !== '')
      );
      if (validKeys.length === 0) {
        showError('Centang minimal 1 kunci jawaban benar untuk Pilihan Ganda Kompleks (MCMA).');
        return;
      }
      finalOptions = options;
      finalCorrectAnswer = validKeys;
    } else {
      const cleanedEssayAnswers = Array.from(
        new Set(essayAnswers.map(a => a.trim()).filter(Boolean))
      );
      if (essayMatchMode !== 'manual' && cleanedEssayAnswers.length === 0) {
        showError(
          'Tambahkan minimal 1 opsi kata kunci / jawaban benar untuk Uraian otomatis, atau pilih metode "Uraian Bebas / Koreksi Manual".'
        );
        return;
      }
      finalOptions = cleanedEssayAnswers.map((ansText, idx) => ({
        id: `ans-${idx + 1}`,
        label: String(idx + 1),
        text: ansText,
      }));
      finalCorrectAnswer = cleanedEssayAnswers;
      finalEssayOptions = {
        inputMode: essayInputMode,
        matchMode: essayMatchMode,
      };
    }

    const newQuestion: Question = {
      id: editingQuestion ? editingQuestion.id : `q-${Date.now()}`,
      examId: selectedExam.id,
      number: editingQuestion ? editingQuestion.number : questions.length + 1,
      type: questionType,
      questionText,
      imageUrl: imageUrl.trim() || undefined,
      options: finalOptions,
      correctAnswer: finalCorrectAnswer,
      essayOptions: finalEssayOptions,
      explanation,
      points: Number(points) || 10,
    };

    CBTStorageService.saveQuestion(newQuestion);
    setQuestions(CBTStorageService.getQuestions(selectedExam.id));
    onRefreshExams();
    setActiveTab('list');
    showNotice('Soal, jenis soal, dan opsi pilihan berhasil disimpan ke Bank Soal!');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Top Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
            Kelola Bank Soal &amp; Formula
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Editor naskah soal berstandar nasional dengan dukungan formula matematika, fisika, kimia, dan pratinjau langsung.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Master Nama Ujian from Admin */}
          <select
            aria-label="Master Nama Ujian"
            value={selectedActivityId}
            onChange={(e) => handleSelectActivity(e.target.value)}
            className="text-xs sm:text-sm px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white max-w-[260px]"
          >
            {activities.length === 0 ? (
              <option value="">Belum ada Aktivitas Ujian</option>
            ) : (
              activities.map(act => {
                const label =
                  act.code && !act.name.toLowerCase().includes(`(${act.code.toLowerCase()})`)
                    ? `${act.name} (${act.code})`
                    : act.name;
                return (
                  <option key={act.id} value={act.id}>
                    {label}
                  </option>
                );
              })
            )}
          </select>

          {/* Master Mata Pelajaran from Admin */}
          <select
            aria-label="Master Mata Pelajaran"
            value={selectedSubjectId}
            onChange={(e) => handleSelectSubject(e.target.value)}
            className="text-xs sm:text-sm px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white max-w-[240px]"
          >
            {subjects.length === 0 ? (
              <option value="">Belum ada Mata Pelajaran</option>
            ) : (
              subjects.map(sbj => (
                <option key={sbj.id} value={sbj.id}>
                  {sbj.name} ({sbj.code})
                </option>
              ))
            )}
          </select>

          {activeTab === 'list' ? (
            <button
              type="button"
              onClick={handleStartNewQuestion}
              disabled={!selectedExam}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white rounded-lg text-xs sm:text-sm font-semibold transition-colors flex items-center gap-2 shadow-xs"
            >
              <Plus className="w-4 h-4" />
              <span>Tambah Butir Soal</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setActiveTab('list')}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg text-xs sm:text-sm font-semibold transition-colors"
            >
              Kembali ke Daftar Soal
            </button>
          )}
        </div>
      </div>

      {/* Pengaturan KKM Paket Soal */}
      {selectedExam && (
        <form
          onSubmit={handleSaveKkm}
          className="mb-5 p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4"
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
              <Award className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
                Nilai KKM (Kriteria Ketuntasan Minimal) Paket Ujian
              </h2>
              <p className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400">
                Menentukan batas ketuntasan nilai akhir siswa untuk{' '}
                <strong className="text-slate-700 dark:text-slate-200">
                  {selectedActivity?.code} · {selectedSubject?.name}
                </strong>{' '}
                (KKM Aktif: <strong className="font-mono text-indigo-600 dark:text-indigo-400">{selectedExam.kkm}</strong>)
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <label className="text-xs font-semibold text-slate-600 dark:text-slate-300">
              Nilai KKM:
            </label>
            <input
              type="number"
              min={0}
              max={100}
              value={kkmInput}
              onChange={(e) => setKkmInput(Number(e.target.value))}
              className="w-20 text-xs sm:text-sm font-mono font-bold text-center px-2.5 py-1.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
              required
            />
            <button
              type="submit"
              className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 shadow-xs"
            >
              <Save className="w-3.5 h-3.5" />
              <span>Simpan KKM</span>
            </button>
          </div>
        </form>
      )}

      {/* Document Template Download & Upload Bar */}
      {activeTab === 'list' && (
        <div className="mb-6 p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xs space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
                <FileText className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
                  Unggah &amp; Impor Soal Massal dari Dokumen Word (.docx / .doc)
                </h2>
                <p className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Mendukung 3 jenis soal sekaligus: <strong>Pilihan Ganda Biasa</strong>, <strong>Pilihan Ganda Kompleks (MCMA)</strong>, dan <strong>Uraian</strong> berikut opsi pilihannya.
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={handleDownloadDocTemplate}
                disabled={isProcessingDoc}
                className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5"
              >
                <Download className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                <span>Unduh Template Soal (.docx)</span>
              </button>

              <input
                ref={docUploadInputRef}
                type="file"
                accept=".docx,.doc,.txt"
                onChange={handleUploadDocFile}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => docUploadInputRef.current?.click()}
                disabled={isProcessingDoc || !selectedExam}
                className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400 text-white rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 shadow-xs"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>{isProcessingDoc ? 'Memproses...' : 'Unggah File Soal'}</span>
              </button>
            </div>
          </div>

          {/* Supported Question Types Guide in Upload Card */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5 pt-3 border-t border-slate-100 dark:border-slate-800 text-[11px]">
            <div className="p-2.5 rounded-lg bg-indigo-50/70 dark:bg-indigo-950/30 border border-indigo-200/80 dark:border-indigo-900/60">
              <div className="font-bold text-indigo-800 dark:text-indigo-300 flex items-center gap-1.5 mb-0.5">
                <CircleDot className="w-3.5 h-3.5" />
                <span>1. Pilihan Ganda Biasa</span>
              </div>
              <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                Penanda <code className="font-mono font-semibold">TIPE: PG</code> · Opsi <code className="font-mono">A. s/d E.</code> · 1 kunci (<code className="font-mono">KUNCI: B</code>).
              </p>
            </div>
            <div className="p-2.5 rounded-lg bg-purple-50/70 dark:bg-purple-950/30 border border-purple-200/80 dark:border-purple-900/60">
              <div className="font-bold text-purple-800 dark:text-purple-300 flex items-center gap-1.5 mb-0.5">
                <ListChecks className="w-3.5 h-3.5" />
                <span>2. PG Kompleks (MCMA)</span>
              </div>
              <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                Penanda <code className="font-mono font-semibold">TIPE: MCMA</code> · Opsi <code className="font-mono">A. s/d H.</code> · Banyak kunci (<code className="font-mono">KUNCI: A, C</code>).
              </p>
            </div>
            <div className="p-2.5 rounded-lg bg-teal-50/70 dark:bg-teal-950/30 border border-teal-200/80 dark:border-teal-900/60">
              <div className="font-bold text-teal-800 dark:text-teal-300 flex items-center gap-1.5 mb-0.5">
                <AlignLeft className="w-3.5 h-3.5" />
                <span>3. Soal Uraian + Opsi</span>
              </div>
              <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                Penanda <code className="font-mono font-semibold">TIPE: URAIAN</code> · <code className="font-mono">MODE URAIAN: SINGKAT/PANJANG</code> · Opsi alternatif jawaban.
              </p>
            </div>
          </div>
        </div>
      )}

      {saveNotice && (
        <div className="mb-6 p-3 bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-300 dark:border-emerald-800 rounded-lg text-xs font-medium text-emerald-800 dark:text-emerald-200 flex items-center gap-2 animate-fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{saveNotice}</span>
        </div>
      )}

      {errorNotice && (
        <div className="mb-6 p-3 bg-red-50 dark:bg-red-950/50 border border-red-300 dark:border-red-800 rounded-lg text-xs font-medium text-red-800 dark:text-red-200 flex items-center justify-between gap-2 animate-fade-in">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
            <span>{errorNotice}</span>
          </div>
          <button
            type="button"
            onClick={() => setErrorNotice(null)}
            className="text-red-500 hover:text-red-700 p-1"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Tabs / Mode View */}
      {activeTab === 'list' ? (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500 mb-2">
            <span>Daftar {questions.length} Butir Soal Terdaftar dalam Paket</span>
            <div className="flex items-center gap-3">
              {questions.length > 0 && (
                <button
                  type="button"
                  onClick={handleDistributePointsEvenly}
                  className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-md text-[11px] font-semibold transition-colors"
                >
                  Bagi Rata Skor (Total = 100)
                </button>
              )}
              <span className="font-semibold text-slate-700 dark:text-slate-200">
                Total Skor / Bobot:{' '}
                <strong className="font-mono text-indigo-600 dark:text-indigo-400">
                  {questions.reduce((sum, q) => sum + (Number(q.points) || 0), 0)} Poin
                </strong>
              </span>
            </div>
          </div>

          {questions.length === 0 ? (
            <div className="p-12 text-center bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
              <BookOpen className="w-12 h-12 text-slate-400 mx-auto mb-3" />
              <p className="text-sm font-medium text-slate-600 dark:text-slate-300">
                Belum ada butir soal dalam paket ini.
              </p>
              <button
                onClick={handleStartNewQuestion}
                className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-lg text-xs font-semibold"
              >
                Buat Soal Pertama
              </button>
            </div>
          ) : (
            questions.map((q, idx) => {
              const isMcma = isMcmaQuestion(q);
              const isEssay = isEssayQuestion(q);
              const essayCfg = getEssayConfig(q);
              const essayKeys = isEssay ? getEssayAcceptedAnswers(q) : [];
              const mcmaKeyIds = Array.isArray(q.correctAnswer)
                ? q.correctAnswer
                : q.correctAnswer
                  ? [q.correctAnswer]
                  : [];

              return (
                <div
                  key={q.id}
                  className="p-5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col sm:flex-row items-start justify-between gap-4"
                >
                  <div className="flex-1 w-full">
                    <div className="flex flex-wrap items-center gap-2.5 mb-2">
                      <span className="w-6 h-6 rounded-md bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 font-bold text-xs flex items-center justify-center">
                        {idx + 1}
                      </span>
                      <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 px-2 py-0.5 rounded-lg">
                        <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-300">
                          Skor / Bobot:
                        </label>
                        <input
                          type="number"
                          min={1}
                          max={1000}
                          value={q.points}
                          onChange={(e) => handleUpdateQuestionPoints(q, e.target.value)}
                          aria-label={`Skor bobot soal nomor ${idx + 1}`}
                          className="w-14 text-xs font-mono font-bold text-center px-1.5 py-0.5 rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 focus:outline-hidden focus:ring-1 focus:ring-indigo-500"
                        />
                        <span className="text-[11px] text-slate-500">Poin</span>
                      </div>
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
                          ? 'PG Kompleks (MCMA)'
                          : isEssay
                            ? essayCfg.inputMode === 'short'
                              ? 'Uraian Singkat'
                              : 'Uraian Panjang'
                            : 'Pilihan Ganda Biasa'}
                      </span>
                    </div>

                    {/* Render Question with MathText */}
                    <div className="text-xs sm:text-sm text-slate-900 dark:text-slate-100 mb-3">
                      <MathText content={q.questionText} />
                    </div>

                    {q.imageUrl && (
                      <div className="mb-4">
                        <img
                          src={q.imageUrl}
                          alt={`Ilustrasi Soal ${idx + 1}`}
                          className="max-h-64 rounded-xl object-contain border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 p-1"
                        />
                      </div>
                    )}

                    {/* Options / Essay Key Preview */}
                    {isEssay ? (
                      <div className="p-3 rounded-lg bg-teal-50/50 dark:bg-teal-950/20 border border-teal-200 dark:border-teal-900/60 text-xs space-y-2">
                        <div className="flex flex-wrap items-center gap-2 text-[11px] text-teal-800 dark:text-teal-300">
                          <span className="font-semibold">
                            Mode: {essayCfg.inputMode === 'short' ? 'Uraian Singkat' : 'Uraian Panjang'}
                          </span>
                          <span>·</span>
                          <span>
                            Penilaian:{' '}
                            <strong>
                              {essayCfg.matchMode === 'manual'
                                ? 'Koreksi Manual Guru'
                                : essayCfg.matchMode === 'exact'
                                  ? 'Persis Salah Satu Opsi'
                                  : 'Mengandung Kata Kunci'}
                            </strong>
                          </span>
                        </div>
                        {essayKeys.length > 0 ? (
                          <div className="flex flex-wrap items-center gap-1.5">
                            <span className="text-[11px] text-slate-500">Opsi Jawaban Diterima:</span>
                            {essayKeys.map((ans, aIdx) => (
                              <span
                                key={aIdx}
                                className="px-2 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950 border border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 font-semibold text-[11px]"
                              >
                                {aIdx + 1}. {ans}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <p className="text-[11px] text-slate-500 italic">
                            Uraian terbuka tanpa kunci otomatis (dinilai manual oleh guru).
                          </p>
                        )}
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                        {q.options.map(opt => {
                          const isCorrect = isMcma
                            ? mcmaKeyIds.includes(opt.id)
                            : opt.id === q.correctAnswer;
                          return (
                            <div
                              key={opt.id}
                              className={`p-2 rounded-lg border flex items-center gap-2 ${
                                isCorrect
                                  ? 'border-emerald-300 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-100 font-medium'
                                  : 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 text-slate-700 dark:text-slate-300'
                              }`}
                            >
                              <span
                                className={`w-5 h-5 rounded flex items-center justify-center text-[10px] font-bold shrink-0 ${
                                  isCorrect ? 'bg-emerald-600 text-white' : 'bg-slate-200 dark:bg-slate-700'
                                }`}
                              >
                                {opt.label}
                              </span>
                              <div className="flex-1">
                                <MathText content={opt.text} inline />
                              </div>
                              {isCorrect && (
                                <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                {/* Edit & Delete Controls */}
                <div className="flex items-center gap-2 shrink-0 self-end sm:self-start">
                  <button
                    type="button"
                    onClick={() => handleEditQuestion(q)}
                    className="p-2 text-slate-600 dark:text-slate-300 hover:text-indigo-600 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"
                    title="Edit Soal"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDeleteQuestion(q, idx + 1)}
                    className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/50 rounded-lg"
                    title="Hapus Soal"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
              );
            })
          )}
        </div>
      ) : (
        /* Question Editor Mode with Live Preview */
        <form onSubmit={handleSaveQuestion} className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Form: Formula inputs */}
          <div className="lg:col-span-7 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-xs space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
              <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                {editingQuestion ? `Edit Soal Nomor ${editingQuestion.number}` : 'Buat Butir Soal Baru'}
              </h2>
              <div className="flex items-center gap-2">
                <label className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                  Skor / Bobot Nilai:
                </label>
                <input
                  type="number"
                  min={1}
                  max={1000}
                  value={points}
                  onChange={(e) => setPoints(Number(e.target.value))}
                  className="w-20 text-xs px-2 py-1 rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono font-bold text-center text-indigo-600 dark:text-indigo-400"
                  required
                />
                <span className="text-xs text-slate-500">Poin</span>
              </div>
            </div>

            {/* Question Type Selector */}
            <div className="space-y-2">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                Jenis Soal:
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                <button
                  type="button"
                  onClick={() => handleSwitchEditorType('single_choice')}
                  className={`p-3 rounded-xl border text-left transition-all flex items-start gap-2.5 ${
                    questionType === 'single_choice'
                      ? 'border-indigo-600 bg-indigo-50/70 dark:bg-indigo-950/40 ring-1 ring-indigo-500'
                      : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
                  }`}
                >
                  <CircleDot
                    className={`w-4 h-4 mt-0.5 shrink-0 ${
                      questionType === 'single_choice' ? 'text-indigo-600' : 'text-slate-400'
                    }`}
                  />
                  <div>
                    <div className="text-xs font-bold text-slate-900 dark:text-white">
                      Pilihan Ganda Biasa
                    </div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400">
                      1 kunci jawaban benar (A-H)
                    </div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => handleSwitchEditorType('multiple_choice')}
                  className={`p-3 rounded-xl border text-left transition-all flex items-start gap-2.5 ${
                    questionType === 'multiple_choice'
                      ? 'border-purple-600 bg-purple-50/70 dark:bg-purple-950/40 ring-1 ring-purple-500'
                      : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
                  }`}
                >
                  <ListChecks
                    className={`w-4 h-4 mt-0.5 shrink-0 ${
                      questionType === 'multiple_choice' ? 'text-purple-600' : 'text-slate-400'
                    }`}
                  />
                  <div>
                    <div className="text-xs font-bold text-slate-900 dark:text-white">
                      PG Kompleks (MCMA)
                    </div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400">
                      Lebih dari 1 jawaban benar
                    </div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => handleSwitchEditorType('essay')}
                  className={`p-3 rounded-xl border text-left transition-all flex items-start gap-2.5 ${
                    questionType === 'essay'
                      ? 'border-teal-600 bg-teal-50/70 dark:bg-teal-950/40 ring-1 ring-teal-500'
                      : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
                  }`}
                >
                  <AlignLeft
                    className={`w-4 h-4 mt-0.5 shrink-0 ${
                      questionType === 'essay' ? 'text-teal-600' : 'text-slate-400'
                    }`}
                  />
                  <div>
                    <div className="text-xs font-bold text-slate-900 dark:text-white">
                      Soal Uraian
                    </div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400">
                      Isian singkat/panjang &amp; opsi kunci
                    </div>
                  </div>
                </button>
              </div>
            </div>

            {/* Quick Insert Formula Toolbar */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <Sigma className="w-3.5 h-3.5 text-indigo-600" />
                  Sisipkan Rumus Cepat:
                </span>
                <span className="text-[11px] text-slate-400">Klik tombol untuk menambahkan</span>
              </div>
              <div className="flex flex-wrap gap-1 p-2 bg-slate-50 dark:bg-slate-800/80 rounded-lg border border-slate-200 dark:border-slate-700">
                <button
                  type="button"
                  onClick={() => insertLatexSnippet('\\frac{a}{b}')}
                  className="text-xs font-mono px-2 py-1 bg-white dark:bg-slate-700 rounded border border-slate-300 dark:border-slate-600 hover:border-indigo-400"
                  title="Pecahan"
                >
                  \frac&#123;a&#125;&#123;b&#125;
                </button>
                <button
                  type="button"
                  onClick={() => insertLatexSnippet('\\sqrt{x}')}
                  className="text-xs font-mono px-2 py-1 bg-white dark:bg-slate-700 rounded border border-slate-300 dark:border-slate-600 hover:border-indigo-400"
                  title="Akar"
                >
                  \sqrt&#123;x&#125;
                </button>
                <button
                  type="button"
                  onClick={() => insertLatexSnippet('x^{2}')}
                  className="text-xs font-mono px-2 py-1 bg-white dark:bg-slate-700 rounded border border-slate-300 dark:border-slate-600 hover:border-indigo-400"
                  title="Pangkat"
                >
                  x^2
                </button>
                <button
                  type="button"
                  onClick={() => insertLatexSnippet('\\lim_{x \\to 0}')}
                  className="text-xs font-mono px-2 py-1 bg-white dark:bg-slate-700 rounded border border-slate-300 dark:border-slate-600 hover:border-indigo-400"
                  title="Limit"
                >
                  \lim
                </button>
                <button
                  type="button"
                  onClick={() => insertLatexSnippet('\\int_{a}^{b} f(x) \\, dx')}
                  className="text-xs font-mono px-2 py-1 bg-white dark:bg-slate-700 rounded border border-slate-300 dark:border-slate-600 hover:border-indigo-400"
                  title="Integral"
                >
                  \int
                </button>
                <button
                  type="button"
                  onClick={() => insertLatexSnippet('\\begin{pmatrix} a & b \\\\ c & d \\end{pmatrix}')}
                  className="text-xs font-mono px-2 py-1 bg-white dark:bg-slate-700 rounded border border-slate-300 dark:border-slate-600 hover:border-indigo-400"
                  title="Matriks"
                >
                  Matriks 2x2
                </button>
                <button
                  type="button"
                  onClick={() => insertLatexSnippet('\\alpha')}
                  className="text-xs font-mono px-2 py-1 bg-white dark:bg-slate-700 rounded border border-slate-300 dark:border-slate-600 hover:border-indigo-400"
                >
                  \alpha
                </button>
                <button
                  type="button"
                  onClick={() => insertLatexSnippet('\\pi')}
                  className="text-xs font-mono px-2 py-1 bg-white dark:bg-slate-700 rounded border border-slate-300 dark:border-slate-600 hover:border-indigo-400"
                >
                  \pi
                </button>
                <button
                  type="button"
                  onClick={() => insertLatexSnippet('H_2O')}
                  className="text-xs font-mono px-2 py-1 bg-white dark:bg-slate-700 rounded border border-slate-300 dark:border-slate-600 hover:border-indigo-400"
                >
                  H2O
                </button>
                <button
                  type="button"
                  onClick={() => insertLatexSnippet('\\rightarrow')}
                  className="text-xs font-mono px-2 py-1 bg-white dark:bg-slate-700 rounded border border-slate-300 dark:border-slate-600 hover:border-indigo-400"
                >
                  \rightarrow
                </button>
              </div>
            </div>

            {/* Question Image Upload & Delete */}
            <div className="space-y-2">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                Gambar Ilustrasi Soal (Opsional):
              </label>
              <div className="flex flex-wrap items-center gap-2">
                <input
                  ref={questionImageInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => questionImageInputRef.current?.click()}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-lg text-xs font-semibold border border-slate-300 dark:border-slate-700 flex items-center gap-1.5 transition-colors"
                >
                  <Upload className="w-3.5 h-3.5 text-indigo-600" />
                  <span>{imageUrl ? 'Ganti Gambar Soal' : 'Unggah Soal Bergambar'}</span>
                </button>
                {imageUrl && (
                  <button
                    type="button"
                    onClick={handleDeleteImage}
                    className="px-3 py-1.5 bg-red-50 hover:bg-red-100 dark:bg-red-950/60 dark:hover:bg-red-900 text-red-600 dark:text-red-300 rounded-lg text-xs font-semibold border border-red-200 dark:border-red-800 flex items-center gap-1.5 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Hapus Soal Gambar</span>
                  </button>
                )}
              </div>
              {imageUrl && (
                <div className="relative mt-2 p-2 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl inline-block">
                  <img src={imageUrl} alt="Pratinjau Soal" className="max-h-48 rounded-lg object-contain" />
                </div>
              )}
            </div>

            {/* Question Textarea */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Teks Soal (Gunakan $..$ untuk inline formula atau $$..$$ untuk formula besar):
              </label>
              <textarea
                rows={5}
                value={questionText}
                onChange={(e) => setQuestionText(e.target.value)}
                placeholder="Tuliskan pertanyaan disini. Contoh: Hitung nilai dari $$\lim_{x \to 0} \frac{\sin x}{x}$$"
                className="w-full text-xs sm:text-sm font-mono p-3 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                required
              />
            </div>

            {/* Dynamic Options Section based on Question Type */}
            {questionType === 'essay' ? (
              <div className="space-y-4 p-4 rounded-xl bg-teal-50/40 dark:bg-teal-950/20 border border-teal-200 dark:border-teal-900/60">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Mode Input Jawaban Siswa:
                    </label>
                    <select
                      value={essayInputMode}
                      onChange={(e) => setEssayInputMode(e.target.value as 'short' | 'long')}
                      className="w-full text-xs px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
                    >
                      <option value="short">Uraian Singkat (1 Baris)</option>
                      <option value="long">Uraian Panjang (Paragraf)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Opsi Metode Penilaian:
                    </label>
                    <select
                      value={essayMatchMode}
                      onChange={(e) =>
                        setEssayMatchMode(e.target.value as 'contains' | 'exact' | 'manual')
                      }
                      className="w-full text-xs px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
                    >
                      <option value="contains">Otomatis: Mengandung Kata Kunci</option>
                      <option value="exact">Otomatis: Persis Salah Satu Opsi</option>
                      <option value="manual">Uraian Bebas (Koreksi Manual Guru)</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-2.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                      Opsi Kunci Jawaban / Alternatif Kata Kunci Diterima:
                    </label>
                    <button
                      type="button"
                      onClick={() => setEssayAnswers(prev => [...prev, ''])}
                      className="text-[11px] font-semibold text-teal-700 dark:text-teal-300 hover:underline flex items-center gap-1"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Tambah Opsi Jawaban</span>
                    </button>
                  </div>

                  {essayAnswers.map((ansVal, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <span className="w-6 h-6 rounded bg-teal-100 dark:bg-teal-900 text-teal-800 dark:text-teal-200 font-bold text-xs flex items-center justify-center shrink-0">
                        {idx + 1}
                      </span>
                      <input
                        type="text"
                        value={ansVal}
                        onChange={(e) => {
                          const next = [...essayAnswers];
                          next[idx] = e.target.value;
                          setEssayAnswers(next);
                        }}
                        placeholder={
                          essayMatchMode === 'manual'
                            ? `Catatan / pedoman rubrik jawaban ke-${idx + 1} (opsional)`
                            : `Opsi jawaban benar / kata kunci ke-${idx + 1}`
                        }
                        className="flex-1 text-xs px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
                      />
                      {essayAnswers.length > 1 && (
                        <button
                          type="button"
                          onClick={() =>
                            setEssayAnswers(prev => prev.filter((_, i) => i !== idx))
                          }
                          className="p-1.5 text-slate-400 hover:text-red-600 rounded-lg"
                          title="Hapus opsi jawaban"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  ))}
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    {essayMatchMode === 'contains'
                      ? 'Siswa dianggap benar apabila jawabannya mengandung salah satu kata kunci di atas (tidak peka huruf besar/kecil).'
                      : essayMatchMode === 'exact'
                        ? 'Siswa dianggap benar apabila jawabannya sama persis dengan salah satu opsi di atas.'
                        : 'Jawaban siswa disimpan untuk dikoreksi secara manual oleh guru.'}
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                    {questionType === 'multiple_choice'
                      ? 'Pilihan Jawaban MCMA & Centang Kunci Jawaban Benar (Bisa > 1):'
                      : 'Pilihan Jawaban (A-H) & Kunci Jawaban:'}
                  </label>
                  {options.length < OPTION_LETTERS.length && (
                    <button
                      type="button"
                      onClick={handleAddChoiceOption}
                      className="text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Tambah Opsi ({OPTION_LETTERS[options.length]})</span>
                    </button>
                  )}
                </div>

                {options.map((opt, idx) => {
                  const isMcmaSelected = correctAnswers.includes(opt.id);
                  return (
                    <div key={opt.id} className="flex items-center gap-2">
                      {questionType === 'multiple_choice' ? (
                        <button
                          type="button"
                          onClick={() => handleToggleEditorMcmaKey(opt.id)}
                          title="Centang sebagai salah satu kunci jawaban benar"
                          className={`w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 transition-colors ${
                            isMcmaSelected
                              ? 'bg-purple-600 border-purple-600 text-white'
                              : 'border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800'
                          }`}
                        >
                          {isMcmaSelected && <Check className="w-3.5 h-3.5" />}
                        </button>
                      ) : (
                        <input
                          type="radio"
                          name="correctAnswer"
                          checked={correctAnswer === opt.id}
                          onChange={() => setCorrectAnswer(opt.id)}
                          title="Pilih sebagai kunci jawaban yang benar"
                          className="w-4 h-4 text-emerald-600 focus:ring-emerald-500 cursor-pointer shrink-0"
                        />
                      )}
                      <span className="w-6 h-6 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs flex items-center justify-center shrink-0">
                        {opt.label}
                      </span>
                      <input
                        type="text"
                        value={opt.text}
                        onChange={(e) => {
                          const newOpts = [...options];
                          newOpts[idx] = { ...newOpts[idx], text: e.target.value };
                          setOptions(newOpts);
                        }}
                        placeholder={`Teks pilihan ${opt.label} (bisa format $..$)`}
                        className="flex-1 text-xs px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white font-mono"
                        required
                      />
                      {options.length > 2 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveChoiceOption(opt.id)}
                          className="p-1.5 text-slate-400 hover:text-red-600 rounded-lg shrink-0"
                          title={`Hapus opsi ${opt.label}`}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  );
                })}
                <p className="text-[11px] text-slate-400">
                  {questionType === 'multiple_choice'
                    ? `Centang satu atau lebih kotak di sebelah kiri opsi. Kunci aktif: ${
                        options
                          .filter(o => correctAnswers.includes(o.id))
                          .map(o => o.label)
                          .join(', ') || 'Belum dipilih'
                      }.`
                    : 'Pilih radio button di sebelah kiri opsi untuk menentukan Kunci Jawaban Benar.'}
                </p>
              </div>
            )}

            {/* Explanation */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Kunci &amp; Pembahasan Soal (Opsional, untuk review siswa):
              </label>
              <textarea
                rows={3}
                value={explanation}
                onChange={(e) => setExplanation(e.target.value)}
                placeholder="Penjelasan langkah penyelesaian rumus..."
                className="w-full text-xs font-mono p-2.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
              />
            </div>

            <div className="pt-2 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setActiveTab('list')}
                className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-lg text-xs font-semibold"
              >
                Batal
              </button>
              <button
                type="submit"
                className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold transition-colors flex items-center gap-2 shadow-xs"
              >
                <Save className="w-4 h-4" />
                <span>Simpan ke Bank Soal</span>
              </button>
            </div>
          </div>

          {/* Right: Live Formula Preview */}
          <div className="lg:col-span-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-xs sticky top-24">
            <div className="flex items-center justify-between gap-2 pb-3 mb-4 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <Eye className="w-4 h-4 text-indigo-600" />
                <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                  Pratinjau Langsung Soal &amp; Rumus
                </h3>
              </div>
              <span
                className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                  questionType === 'multiple_choice'
                    ? 'bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300'
                    : questionType === 'essay'
                      ? 'bg-teal-100 text-teal-700 dark:bg-teal-950 dark:text-teal-300'
                      : 'bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300'
                }`}
              >
                {questionType === 'multiple_choice'
                  ? 'PG Kompleks (MCMA)'
                  : questionType === 'essay'
                    ? essayInputMode === 'short'
                      ? 'Uraian Singkat'
                      : 'Uraian Panjang'
                    : 'PG Biasa'}
              </span>
            </div>

            <div className="mb-4">
              <span className="text-[11px] text-slate-400 block mb-1">Tampilan Teks Soal:</span>
              <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 text-xs sm:text-sm text-slate-900 dark:text-white min-h-[90px] leading-relaxed">
                {questionText ? (
                  <MathText content={questionText} />
                ) : (
                  <span className="text-slate-400 italic">Ketik teks soal untuk melihat preview formula...</span>
                )}
              </div>
              {imageUrl && (
                <div className="mt-2">
                  <img
                    src={imageUrl}
                    alt="Preview Ilustrasi"
                    className="max-h-40 rounded-lg object-contain border border-slate-200 dark:border-slate-700"
                  />
                </div>
              )}
            </div>

            {questionType === 'essay' ? (
              <div className="space-y-2.5">
                <span className="text-[11px] text-slate-400 block">
                  Tampilan Kolom Jawaban Uraian Siswa:
                </span>
                {essayInputMode === 'short' ? (
                  <div className="px-3 py-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-400 italic">
                    [ Kolom input uraian singkat 1 baris... ]
                  </div>
                ) : (
                  <div className="p-3 h-20 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-400 italic">
                    [ Area teks uraian panjang siswa... ]
                  </div>
                )}
                <div className="p-2.5 rounded-lg bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900 text-[11px] space-y-1">
                  <span className="font-semibold text-emerald-700 dark:text-emerald-300 block">
                    Opsi Kunci Jawaban ({essayMatchMode === 'manual' ? 'Manual' : essayMatchMode === 'exact' ? 'Persis' : 'Kata Kunci'}):
                  </span>
                  {essayAnswers.some(a => a.trim()) ? (
                    <div className="flex flex-wrap gap-1">
                      {essayAnswers
                        .map(a => a.trim())
                        .filter(Boolean)
                        .map((ans, i) => (
                          <span
                            key={i}
                            className="px-2 py-0.5 rounded bg-white dark:bg-slate-800 border border-emerald-300 dark:border-emerald-700 text-emerald-800 dark:text-emerald-200 font-semibold"
                          >
                            {ans}
                          </span>
                        ))}
                    </div>
                  ) : (
                    <span className="text-slate-500 italic">Belum ada opsi kunci diisi.</span>
                  )}
                </div>
              </div>
            ) : (
              <div>
                <span className="text-[11px] text-slate-400 block mb-1">
                  {questionType === 'multiple_choice'
                    ? 'Tampilan Opsi PG Kompleks (MCMA):'
                    : 'Tampilan Opsi Pilihan Ganda:'}
                </span>
                <div className="space-y-2">
                  {options.map(opt => {
                    const isCorrect =
                      questionType === 'multiple_choice'
                        ? correctAnswers.includes(opt.id)
                        : opt.id === correctAnswer;
                    return (
                      <div
                        key={opt.id}
                        className={`p-2.5 rounded-lg border text-xs flex items-center gap-2.5 ${
                          isCorrect
                            ? 'border-emerald-300 dark:border-emerald-700 bg-emerald-50/50 dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-100'
                            : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800'
                        }`}
                      >
                        <span
                          className={`w-5 h-5 rounded flex items-center justify-center font-bold text-[10px] shrink-0 ${
                            isCorrect ? 'bg-emerald-600 text-white' : 'bg-slate-100 dark:bg-slate-700'
                          }`}
                        >
                          {opt.label}
                        </span>
                        <div className="flex-1">
                          {opt.text ? (
                            <MathText content={opt.text} inline />
                          ) : (
                            <span className="text-slate-400 italic">(kosong)</span>
                          )}
                        </div>
                        {isCorrect && (
                          <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 shrink-0">
                            Kunci Benar
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {explanation && (
              <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800">
                <span className="text-[11px] text-slate-400 block mb-1">Preview Pembahasan:</span>
                <div className="p-3 bg-indigo-50/60 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-800 rounded-lg text-xs text-indigo-950 dark:text-indigo-200">
                  <MathText content={explanation} />
                </div>
              </div>
            )}
          </div>
        </form>
      )}

      {/* IN-APP PREVIEW & CONFIRM IMPORT MODAL FOR UPLOADED DOCUMENT */}
      {importPreviewModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl max-w-3xl w-full max-h-[88vh] flex flex-col overflow-hidden">
            <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
                    Pratinjau Impor Soal Dokumen ({importPreviewModal.questions.length} Butir Soal)
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 truncate max-w-md">
                    File: {importPreviewModal.fileName} · Target: {selectedActivity?.name} - {selectedSubject?.name}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setImportPreviewModal(null)}
                className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 overflow-y-auto space-y-4 flex-1">
              {importPreviewModal.warnings.length > 0 && (
                <div className="p-3 bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-800 rounded-xl text-xs text-amber-800 dark:text-amber-200 space-y-1">
                  <div className="font-bold flex items-center gap-1.5">
                    <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                    <span>Catatan Pembacaan Dokumen:</span>
                  </div>
                  <ul className="list-disc pl-5 space-y-0.5">
                    {importPreviewModal.warnings.map((w, i) => (
                      <li key={i}>{w}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Mode Impor */}
              <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl">
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-2">
                  Metode Penyimpanan ke Bank Soal:
                </span>
                <div className="flex flex-wrap gap-4 text-xs">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="importMode"
                      checked={importMode === 'append'}
                      onChange={() => setImportMode('append')}
                      className="text-indigo-600"
                    />
                    <span className="text-slate-800 dark:text-slate-200 font-medium">
                      Tambahkan ke daftar soal yang sudah ada ({questions.length} + {importPreviewModal.questions.length} soal)
                    </span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="importMode"
                      checked={importMode === 'replace'}
                      onChange={() => setImportMode('replace')}
                      className="text-indigo-600"
                    />
                    <span className="text-slate-800 dark:text-slate-200 font-medium">
                      Ganti seluruh soal pada paket ujian ini
                    </span>
                  </label>
                </div>
              </div>

              {/* Parsed Questions List with Type & Options Editor */}
              <div className="space-y-3">
                {importPreviewModal.questions.map((pq, idx) => {
                  const pqIsMcma = isMcmaQuestion(pq);
                  const pqIsEssay = isEssayQuestion(pq);
                  const pqEssayCfg = getEssayConfig(pq);
                  const pqEssayKeys = pqIsEssay ? getEssayAcceptedAnswers(pq) : [];
                  const pqMcmaIds = Array.isArray(pq.correctAnswer)
                    ? pq.correctAnswer
                    : pq.correctAnswer
                      ? [pq.correctAnswer]
                      : [];

                  return (
                    <div
                      key={pq.id}
                      className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl space-y-3"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-bold text-indigo-600 dark:text-indigo-400">
                            Soal #{idx + 1} (Asal No. {pq.number})
                          </span>
                          <select
                            aria-label={`Jenis soal impor nomor ${idx + 1}`}
                            value={pqIsEssay ? 'essay' : pqIsMcma ? 'multiple_choice' : 'single_choice'}
                            onChange={(e) =>
                              handleChangeImportedQuestionType(
                                pq,
                                e.target.value as 'single_choice' | 'multiple_choice' | 'essay'
                              )
                            }
                            className="text-[11px] font-semibold px-2 py-1 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-100"
                          >
                            <option value="single_choice">Pilihan Ganda Biasa</option>
                            <option value="multiple_choice">PG Kompleks (MCMA)</option>
                            <option value="essay">Uraian</option>
                          </select>
                        </div>

                        <div className="flex items-center gap-1.5">
                          <label className="text-[11px] font-semibold text-slate-500">
                            Skor / Bobot:
                          </label>
                          <input
                            type="number"
                            min={1}
                            max={1000}
                            value={pq.points}
                            onChange={(e) => {
                              const val = Math.max(1, Math.min(1000, Number(e.target.value) || 1));
                              updateImportedQuestion(pq.id, item => ({ ...item, points: val }));
                            }}
                            className="w-14 text-xs font-mono font-bold text-center px-1.5 py-0.5 rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400"
                          />
                          <span className="text-[11px] text-slate-500">Poin</span>
                        </div>
                      </div>

                      <div className="text-xs text-slate-900 dark:text-slate-100">
                        <MathText content={pq.questionText} />
                      </div>

                      {pqIsEssay ? (
                        <div className="p-3 rounded-lg bg-teal-50/50 dark:bg-teal-950/20 border border-teal-200 dark:border-teal-900/60 space-y-2.5 text-[11px]">
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            <div>
                              <label className="block font-semibold text-slate-600 dark:text-slate-300 mb-1">
                                Mode Tampilan Uraian:
                              </label>
                              <select
                                value={pqEssayCfg.inputMode}
                                onChange={(e) =>
                                  updateImportedQuestion(pq.id, item => ({
                                    ...item,
                                    essayOptions: {
                                      ...getEssayConfig(item),
                                      inputMode: e.target.value as 'short' | 'long',
                                    },
                                  }))
                                }
                                className="w-full px-2 py-1.5 rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100"
                              >
                                <option value="short">Uraian Singkat (1 Baris)</option>
                                <option value="long">Uraian Panjang (Paragraf)</option>
                              </select>
                            </div>
                            <div>
                              <label className="block font-semibold text-slate-600 dark:text-slate-300 mb-1">
                                Opsi Penilaian Uraian:
                              </label>
                              <select
                                value={pqEssayCfg.matchMode}
                                onChange={(e) =>
                                  updateImportedQuestion(pq.id, item => ({
                                    ...item,
                                    essayOptions: {
                                      ...getEssayConfig(item),
                                      matchMode: e.target.value as 'contains' | 'exact' | 'manual',
                                    },
                                  }))
                                }
                                className="w-full px-2 py-1.5 rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100"
                              >
                                <option value="contains">Mengandung Kata Kunci</option>
                                <option value="exact">Persis Salah Satu Opsi</option>
                                <option value="manual">Koreksi Manual Guru</option>
                              </select>
                            </div>
                          </div>

                          <div className="space-y-1.5">
                            <div className="flex items-center justify-between">
                              <span className="font-semibold text-slate-600 dark:text-slate-300">
                                Opsi Kunci / Kata Kunci Jawaban Uraian:
                              </span>
                              <button
                                type="button"
                                onClick={() =>
                                  updateImportedQuestion(pq.id, item => {
                                    const nextArr = [...getEssayAcceptedAnswers(item), 'Opsi baru'];
                                    return {
                                      ...item,
                                      correctAnswer: nextArr,
                                      options: nextArr.map((txt, aIdx) => ({
                                        id: `ans-${aIdx + 1}`,
                                        label: String(aIdx + 1),
                                        text: txt,
                                      })),
                                    };
                                  })
                                }
                                className="text-teal-700 dark:text-teal-300 font-semibold hover:underline flex items-center gap-0.5"
                              >
                                <Plus className="w-3 h-3" />
                                <span>Tambah Opsi</span>
                              </button>
                            </div>
                            {pqEssayKeys.length === 0 ? (
                              <p className="text-slate-500 italic">
                                Belum ada opsi kunci (dinilai manual, atau klik &quot;+ Tambah Opsi&quot;).
                              </p>
                            ) : (
                              <div className="space-y-1">
                                {pqEssayKeys.map((ansTxt, aIdx) => (
                                  <div key={aIdx} className="flex items-center gap-1.5">
                                    <span className="w-5 h-5 rounded bg-teal-100 dark:bg-teal-900 text-teal-800 dark:text-teal-200 font-bold flex items-center justify-center shrink-0">
                                      {aIdx + 1}
                                    </span>
                                    <input
                                      type="text"
                                      value={ansTxt}
                                      onChange={(e) => {
                                        const val = e.target.value;
                                        updateImportedQuestion(pq.id, item => {
                                          const list = [...getEssayAcceptedAnswers(item)];
                                          list[aIdx] = val;
                                          return {
                                            ...item,
                                            correctAnswer: list,
                                            options: list.map((txt, i2) => ({
                                              id: `ans-${i2 + 1}`,
                                              label: String(i2 + 1),
                                              text: txt,
                                            })),
                                          };
                                        });
                                      }}
                                      className="flex-1 px-2 py-1 rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                                    />
                                    <button
                                      type="button"
                                      onClick={() =>
                                        updateImportedQuestion(pq.id, item => {
                                          const list = getEssayAcceptedAnswers(item).filter(
                                            (_, i2) => i2 !== aIdx
                                          );
                                          return {
                                            ...item,
                                            correctAnswer: list,
                                            options: list.map((txt, i2) => ({
                                              id: `ans-${i2 + 1}`,
                                              label: String(i2 + 1),
                                              text: txt,
                                            })),
                                          };
                                        })
                                      }
                                      className="p-1 text-slate-400 hover:text-red-600"
                                      title="Hapus opsi"
                                    >
                                      <Trash2 className="w-3 h-3" />
                                    </button>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          <div className="flex items-center justify-between text-[11px]">
                            <span className="text-slate-500">
                              {pqIsMcma
                                ? 'Klik opsi untuk menambah/menghapus kunci jawaban benar (MCMA):'
                                : 'Klik opsi untuk memilih 1 kunci jawaban benar:'}
                            </span>
                            {pq.options.length < OPTION_LETTERS.length && (
                              <button
                                type="button"
                                onClick={() =>
                                  updateImportedQuestion(pq.id, item => {
                                    const nextLtr = OPTION_LETTERS[item.options.length];
                                    return {
                                      ...item,
                                      options: [
                                        ...item.options,
                                        { id: `opt-${nextLtr.toLowerCase()}`, label: nextLtr, text: `Opsi ${nextLtr}` },
                                      ],
                                    };
                                  })
                                }
                                className="text-indigo-600 dark:text-indigo-400 font-semibold hover:underline flex items-center gap-0.5"
                              >
                                <Plus className="w-3 h-3" />
                                <span>Tambah Opsi</span>
                              </button>
                            )}
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-[11px]">
                            {pq.options.map((opt) => {
                              const isKey = pqIsMcma
                                ? pqMcmaIds.includes(opt.id)
                                : opt.id === pq.correctAnswer;
                              return (
                                <button
                                  key={opt.id}
                                  type="button"
                                  onClick={() =>
                                    updateImportedQuestion(pq.id, item => {
                                      if (isMcmaQuestion(item)) {
                                        const curr = Array.isArray(item.correctAnswer)
                                          ? item.correctAnswer
                                          : item.correctAnswer
                                            ? [item.correctAnswer]
                                            : [];
                                        const exists = curr.includes(opt.id);
                                        const next = exists
                                          ? curr.length > 1
                                            ? curr.filter(id => id !== opt.id)
                                            : curr
                                          : [...curr, opt.id];
                                        return { ...item, correctAnswer: next };
                                      }
                                      return { ...item, correctAnswer: opt.id };
                                    })
                                  }
                                  className={`px-2.5 py-1.5 rounded border flex items-center gap-1.5 text-left transition-colors ${
                                    isKey
                                      ? pqIsMcma
                                        ? 'bg-purple-50 dark:bg-purple-950/40 border-purple-300 dark:border-purple-800 text-purple-900 dark:text-purple-200 font-semibold'
                                        : 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 font-semibold'
                                      : 'bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-slate-300'
                                  }`}
                                >
                                  {pqIsMcma ? (
                                    <CheckSquare
                                      className={`w-3.5 h-3.5 shrink-0 ${
                                        isKey ? 'text-purple-600' : 'text-slate-400'
                                      }`}
                                    />
                                  ) : (
                                    <span className="font-bold">{opt.label}.</span>
                                  )}
                                  {pqIsMcma && <span className="font-bold">{opt.label}.</span>}
                                  <span className="flex-1 truncate">
                                    <MathText content={opt.text || '-'} inline />
                                  </span>
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/40 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setImportPreviewModal(null)}
                className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-semibold transition-colors"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleConfirmImportQuestions}
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-colors flex items-center gap-2 shadow-xs"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Simpan {importPreviewModal.questions.length} Soal ke Bank Soal</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* IN-APP CONFIRMATION DELETE MODAL FOR QUESTION */}
      {deleteQuestionTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl max-w-md w-full p-6 text-center space-y-4">
            <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-950 text-red-600 dark:text-red-400 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Konfirmasi Hapus Butir Soal
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 leading-relaxed">
                Apakah Anda yakin ingin menghapus <strong>Soal Nomor {deleteQuestionTarget.number}</strong>? Data yang dihapus tidak dapat dipulihkan.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                type="button"
                onClick={() => setDeleteQuestionTarget(null)}
                className="py-2.5 px-4 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-semibold transition-colors"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleConfirmDeleteQuestion}
                className="py-2.5 px-4 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-semibold transition-colors shadow-2xs"
              >
                Ya, Hapus Soal
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
