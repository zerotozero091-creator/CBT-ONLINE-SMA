/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import confetti from 'canvas-confetti';
import { CheckCircle2, XCircle, Award, Printer, RotateCcw, AlertTriangle, BookOpen, Clock, ChevronDown, ChevronUp } from 'lucide-react';
import { Submission, Exam } from '../../types/cbt';
import { CBTStorageService, DEFAULT_SCHOOL_LOGO_URL } from '../../services/cbt-storage';
import { MathText } from '../MathText';

interface ExamResultModalProps {
  submission: Submission;
  exam: Exam;
  onClose: () => void;
}

export const ExamResultModal: React.FC<ExamResultModalProps> = ({ submission, exam, onClose }) => {
  const [showExplanation, setShowExplanation] = useState<boolean>(false);
  const [branding, setBranding] = useState(() => CBTStorageService.getBranding());
  const questions = CBTStorageService.getQuestions(exam.id);

  useEffect(() => {
    const handleBrandingChange = () => {
      setBranding(CBTStorageService.getBranding());
    };
    window.addEventListener('cbt-branding-change', handleBrandingChange);
    return () => window.removeEventListener('cbt-branding-change', handleBrandingChange);
  }, []);

  useEffect(() => {
    if (submission.isPassed) {
      confetti({
        particleCount: 80,
        spread: 60,
        origin: { y: 0.6 },
      });
    }
  }, [submission.isPassed]);

  const handlePrint = () => {
    window.print();
  };

  const defaultLogoUrl = DEFAULT_SCHOOL_LOGO_URL;

  return (
    <div className="min-h-[calc(100vh-4rem)] py-8 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto w-full">
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        {/* Official School/Madrasah Kop Surat Header */}
        <div className="px-6 sm:px-8 pt-6 pb-4 bg-white dark:bg-slate-900">
          <div className="flex items-center gap-4 sm:gap-6">
            <div className="w-16 h-16 sm:w-20 sm:h-20 shrink-0 p-1 rounded-xl bg-white border border-slate-200 dark:border-slate-700 shadow-2xs flex items-center justify-center overflow-hidden">
              <img
                src={CBTStorageService.resolveLogoUrl(branding.logoUrl)}
                alt="Logo Sekolah"
                className="w-full h-full object-contain"
                onError={(e) => {
                  e.currentTarget.onerror = null;
                  e.currentTarget.src = defaultLogoUrl;
                }}
                referrerPolicy="no-referrer"
              />
            </div>

            <div className="flex-1 text-center">
              <p className="text-[11px] sm:text-xs font-bold text-teal-700 dark:text-teal-400 uppercase tracking-widest leading-snug">
                {branding.title1 || 'KEMENTERIAN AGAMA REPUBLIK INDONESIA'}
              </p>
              <h2 className="text-base sm:text-xl font-extrabold text-slate-900 dark:text-white uppercase tracking-wide leading-tight mt-0.5">
                {branding.title2 || exam.schoolName}
              </h2>
              <p className="text-xs sm:text-sm font-medium text-slate-600 dark:text-slate-300 mt-0.5">
                {branding.title3 || 'SISTEM CBT ONLINE & ASESMEN DIGITAL MANDIRI'}
              </p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                Tahun Pelajaran {exam.academicYear} · {exam.gradeLevel}
              </p>
            </div>

            <div className="hidden sm:block w-20 shrink-0" aria-hidden="true" />
          </div>

          {/* Double Official Kop Surat Border */}
          <div className="mt-4">
            <div className="border-b-[3px] border-slate-900 dark:border-slate-200" />
            <div className="border-b border-slate-900 dark:border-slate-200 mt-[2px]" />
          </div>

          <div className="pt-3 text-center">
            <span className="text-xs sm:text-sm font-bold uppercase tracking-wider text-slate-800 dark:text-slate-100 underline underline-offset-4 decoration-slate-400">
              Lembar Hasil Ujian Berbasis Komputer
            </span>
          </div>
        </div>

        {/* Status Banner */}
        <div
          className={`px-6 py-5 sm:px-8 text-center text-white ${
            submission.isPassed ? 'bg-gradient-to-r from-emerald-600 to-teal-700' : 'bg-gradient-to-r from-amber-600 to-orange-700'
          }`}
        >
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <div className="w-11 h-11 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-xs shrink-0">
              <Award className="w-6 h-6 text-white" />
            </div>
            <div className="text-center sm:text-left">
              <h1 className="text-lg sm:text-xl font-bold leading-tight">
                {submission.isPassed ? 'Ujian Berhasil Diselesaikan! (TUNTAS)' : 'Ujian Telah Selesai (BELUM TUNTAS)'}
              </h1>
              <p className="text-xs sm:text-sm text-white/90 mt-0.5">
                {exam.title} · {exam.subject} ({exam.gradeLevel})
              </p>
            </div>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 sm:p-8">
          {/* Student metadata */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl mb-6 text-xs border border-slate-200 dark:border-slate-800">
            <div>
              <span className="text-slate-500 block">Nama Peserta:</span>
              <strong className="text-slate-900 dark:text-white">{submission.studentName}</strong>
            </div>
            <div>
              <span className="text-slate-500 block">NISN:</span>
              <strong className="text-slate-900 dark:text-white font-mono">{submission.nisn}</strong>
            </div>
            <div>
              <span className="text-slate-500 block">Kelas & Ruang:</span>
              <strong className="text-slate-900 dark:text-white">{submission.className} ({submission.room})</strong>
            </div>
            <div>
              <span className="text-slate-500 block">Waktu Selesai:</span>
              <strong className="text-slate-900 dark:text-white">
                {submission.finishedAt ? new Date(submission.finishedAt).toLocaleTimeString('id-ID') : '-'}
              </strong>
            </div>
          </div>

          {/* Big Score Card */}
          <div className="grid grid-cols-1 sm:grid-cols-5 gap-4 mb-6">
            <div className="sm:col-span-2 p-5 bg-indigo-50 dark:bg-indigo-950/40 rounded-xl border border-indigo-200 dark:border-indigo-800 flex flex-col items-center justify-center text-center">
              <span className="text-xs font-semibold text-indigo-700 dark:text-indigo-300 mb-1">
                NILAI AKHIR CBT
              </span>
              <div className="text-4xl sm:text-5xl font-black font-mono text-indigo-600 dark:text-indigo-400">
                {submission.percentage}
              </div>
              <div className="mt-2 text-xs text-slate-600 dark:text-slate-300">
                Standar KKM: <strong>{exam.kkm}</strong>
              </div>
            </div>

            <div className="sm:col-span-3 grid grid-cols-2 gap-3">
              <div className="p-3 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/60 rounded-xl flex items-center gap-3">
                <CheckCircle2 className="w-7 h-7 text-emerald-600 dark:text-emerald-400 shrink-0" />
                <div>
                  <span className="text-lg font-bold font-mono text-emerald-700 dark:text-emerald-300 block">
                    {submission.correctCount}
                  </span>
                  <span className="text-xs text-slate-500">Jawaban Benar</span>
                </div>
              </div>

              <div className="p-3 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800/60 rounded-xl flex items-center gap-3">
                <XCircle className="w-7 h-7 text-red-600 dark:text-red-400 shrink-0" />
                <div>
                  <span className="text-lg font-bold font-mono text-red-700 dark:text-red-300 block">
                    {submission.incorrectCount}
                  </span>
                  <span className="text-xs text-slate-500">Jawaban Salah</span>
                </div>
              </div>

              <div className="p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl flex items-center gap-3">
                <Clock className="w-7 h-7 text-slate-500 shrink-0" />
                <div>
                  <span className="text-lg font-bold font-mono text-slate-700 dark:text-slate-300 block">
                    {Math.round(submission.durationSecondsUsed / 60)} m
                  </span>
                  <span className="text-xs text-slate-500">Durasi Pengerjaan</span>
                </div>
              </div>

              <div className="p-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/60 rounded-xl flex items-center gap-3">
                <AlertTriangle className="w-7 h-7 text-amber-600 dark:text-amber-400 shrink-0" />
                <div>
                  <span className="text-lg font-bold font-mono text-amber-700 dark:text-amber-300 block">
                    {submission.infractionsCount}
                  </span>
                  <span className="text-xs text-slate-500">Pelanggaran Integritas</span>
                </div>
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-2 pb-6 border-b border-slate-200 dark:border-slate-800 no-print">
            <button
              onClick={() => setShowExplanation(!showExplanation)}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-lg text-xs font-semibold transition-colors flex items-center gap-2"
            >
              <BookOpen className="w-4 h-4" />
              <span>{showExplanation ? 'Sembunyikan Pembahasan Soal' : 'Lihat Kunci & Pembahasan Soal'}</span>
              {showExplanation ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>

            <div className="flex items-center gap-2">
              <button
                onClick={handlePrint}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-semibold transition-colors flex items-center gap-2"
              >
                <Printer className="w-4 h-4" />
                <span>Cetak Lembar Nilai</span>
              </button>

              <button
                onClick={onClose}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold transition-colors flex items-center gap-2"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Kembali ke Beranda</span>
              </button>
            </div>
          </div>

          {/* Question & Answer Review Section */}
          {showExplanation && (
            <div className="mt-6 space-y-6">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Analisis Kunci Jawaban &amp; Pembahasan Soal:
              </h3>

              {questions.map((q) => {
                const ans = submission.answers[q.id];
                const isMcma = q.type === 'multiple_choice';
                const isEssay = q.type === 'essay' || q.type === 'short_answer';
                const isManualEssay = isEssay && q.essayOptions?.matchMode === 'manual';
                const isCorrect = CBTStorageService.evaluateQuestionAnswer(q, ans?.selectedOption);

                const selectedIds = Array.isArray(ans?.selectedOption)
                  ? ans.selectedOption
                  : ans?.selectedOption
                    ? [ans.selectedOption]
                    : [];
                const correctIds = Array.isArray(q.correctAnswer)
                  ? q.correctAnswer
                  : q.correctAnswer
                    ? [q.correctAnswer]
                    : [];

                const selectedOpts = q.options.filter(o => selectedIds.includes(o.id));
                const correctOpts = q.options.filter(o => correctIds.includes(o.id));
                const essayAcceptedList = Array.from(
                  new Set([
                    ...(Array.isArray(q.correctAnswer) ? q.correctAnswer : q.correctAnswer ? [q.correctAnswer] : []),
                    ...q.options.map(o => o.text),
                  ].filter(Boolean))
                );

                return (
                  <div
                    key={q.id}
                    className={`p-4 rounded-xl border ${
                      isManualEssay
                        ? 'border-slate-200 dark:border-slate-700 bg-slate-50/40 dark:bg-slate-800/30'
                        : isCorrect
                          ? 'border-emerald-200 dark:border-emerald-900/60 bg-emerald-50/30 dark:bg-emerald-950/20'
                          : 'border-red-200 dark:border-red-900/60 bg-red-50/30 dark:bg-red-950/20'
                    }`}
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                          Soal Nomor {q.number} ({q.points} Poin)
                        </span>
                        <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                          {isMcma ? 'PG Kompleks (MCMA)' : isEssay ? 'Uraian' : 'PG Biasa'}
                        </span>
                      </div>
                      <span
                        className={`text-xs font-semibold px-2 py-0.5 rounded ${
                          isManualEssay
                            ? 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                            : isCorrect
                              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200'
                              : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                        }`}
                      >
                        {isManualEssay
                          ? 'Tersimpan (Koreksi Guru)'
                          : isCorrect
                            ? 'Jawaban Benar'
                            : 'Jawaban Salah'}
                      </span>
                    </div>

                    <div className="text-xs sm:text-sm text-slate-900 dark:text-slate-100 mb-3">
                      <MathText content={q.questionText} />
                    </div>

                    {isEssay ? (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs mb-3">
                        <div className="p-2.5 rounded bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                          <span className="text-slate-500 block mb-1">Jawaban Anda:</span>
                          <p className="font-semibold text-slate-900 dark:text-white whitespace-pre-wrap">
                            {typeof ans?.selectedOption === 'string' && ans.selectedOption.trim()
                              ? ans.selectedOption
                              : 'Tidak dijawab'}
                          </p>
                        </div>

                        <div className="p-2.5 rounded bg-white dark:bg-slate-800 border border-emerald-300 dark:border-emerald-700">
                          <span className="text-emerald-600 dark:text-emerald-400 block mb-1">
                            {isManualEssay ? 'Pedoman Penilaian:' : 'Opsi Kunci / Kata Kunci Diterima:'}
                          </span>
                          {essayAcceptedList.length > 0 ? (
                            <div className="flex flex-wrap gap-1">
                              {essayAcceptedList.map((txt, i) => (
                                <span
                                  key={i}
                                  className="px-2 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 font-semibold"
                                >
                                  {txt}
                                </span>
                              ))}
                            </div>
                          ) : (
                            <span className="text-slate-500 italic">Dinilai manual oleh guru pengampu</span>
                          )}
                        </div>
                      </div>
                    ) : isMcma ? (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs mb-3">
                        <div className="p-2 rounded bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                          <span className="text-slate-500 block mb-1">Jawaban Anda:</span>
                          {selectedOpts.length > 0 ? (
                            <div className="space-y-1">
                              {selectedOpts.map(opt => (
                                <div key={opt.id} className="font-semibold text-slate-900 dark:text-white flex items-center gap-1.5">
                                  <span className="w-5 h-5 rounded bg-slate-100 dark:bg-slate-700 flex items-center justify-center text-[11px] shrink-0">
                                    {opt.label}
                                  </span>
                                  <MathText content={opt.text} inline />
                                </div>
                              ))}
                            </div>
                          ) : (
                            <span className="font-semibold text-slate-500">Tidak dijawab</span>
                          )}
                        </div>

                        <div className="p-2 rounded bg-white dark:bg-slate-800 border border-emerald-300 dark:border-emerald-700">
                          <span className="text-emerald-600 dark:text-emerald-400 block mb-1">Kunci Jawaban Benar (MCMA):</span>
                          <div className="space-y-1">
                            {correctOpts.map(opt => (
                              <div key={opt.id} className="font-semibold text-slate-900 dark:text-white flex items-center gap-1.5">
                                <span className="w-5 h-5 rounded bg-emerald-100 dark:bg-emerald-900 text-emerald-800 dark:text-emerald-200 flex items-center justify-center text-[11px] shrink-0">
                                  {opt.label}
                                </span>
                                <MathText content={opt.text} inline />
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs mb-3">
                        <div className="p-2 rounded bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                          <span className="text-slate-500 block mb-0.5">Jawaban Anda:</span>
                          <div className="font-semibold text-slate-900 dark:text-white flex items-center gap-1.5">
                            <span className="w-5 h-5 rounded bg-slate-100 dark:bg-slate-700 flex items-center justify-center text-[11px]">
                              {selectedOpts[0]?.label || '-'}
                            </span>
                            <MathText content={selectedOpts[0]?.text || 'Tidak dijawab'} inline />
                          </div>
                        </div>

                        <div className="p-2 rounded bg-white dark:bg-slate-800 border border-emerald-300 dark:border-emerald-700">
                          <span className="text-emerald-600 dark:text-emerald-400 block mb-0.5">Kunci Jawaban Benar:</span>
                          <div className="font-semibold text-slate-900 dark:text-white flex items-center gap-1.5">
                            <span className="w-5 h-5 rounded bg-emerald-100 dark:bg-emerald-900 text-emerald-800 dark:text-emerald-200 flex items-center justify-center text-[11px]">
                              {correctOpts[0]?.label || '-'}
                            </span>
                            <MathText content={correctOpts[0]?.text || ''} inline />
                          </div>
                        </div>
                      </div>
                    )}

                    {q.explanation && (
                      <div className="p-3 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 text-xs">
                        <span className="font-semibold text-indigo-600 dark:text-indigo-400 block mb-1">
                          Pembahasan Rumus:
                        </span>
                        <MathText content={q.explanation} />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
