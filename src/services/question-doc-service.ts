/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  AlignmentType,
  BorderStyle,
  Document,
  HeadingLevel,
  Packer,
  Paragraph,
  TextRun,
} from 'docx';
import mammoth from 'mammoth';
import { EssayQuestionOptions, Question, QuestionOption, QuestionType } from '../types/cbt';

export interface ParsedDocumentQuestionsResult {
  questions: Question[];
  warnings: string[];
}

export class QuestionDocService {
  /**
   * Generate and download a real Microsoft Word (.docx) question template
   * supporting Pilihan Ganda Biasa, Pilihan Ganda Kompleks (MCMA), and Uraian.
   */
  public static async downloadQuestionDocTemplate(
    activityName = 'Asesmen Ujian CBT',
    subjectName = 'Mata Pelajaran'
  ): Promise<void> {
    const sampleBlocks = [
      {
        number: 1,
        typeLabel: 'PG',
        points: 20,
        extraLines: [] as string[],
        questionLines: [
          'Tentukan nilai limit fungsi trigonometri berikut:',
          '$$\\lim_{x \\to 0} \\frac{1 - \\cos 4x}{x \\sin 2x}$$',
        ],
        options: [
          'A. $2$',
          'B. $4$',
          'C. $6$',
          'D. $8$',
          'E. $10$',
        ],
        answer: 'B',
        explanation:
          'Gunakan identitas $1 - \\cos 4x = 2\\sin^2 2x$, sehingga hasil limit adalah $\\frac{2(2)^2}{2} = 4$.',
      },
      {
        number: 2,
        typeLabel: 'MCMA',
        points: 30,
        extraLines: [] as string[],
        questionLines: [
          'Manakah di antara pernyataan berikut yang BENAR mengenai fungsi sistem penyimpanan lokal pada ujian berbasis komputer? (Pilih lebih dari satu jawaban)',
        ],
        options: [
          'A. Menyimpan jawaban siswa secara aman di perangkat saat jaringan terputus sementara',
          'B. Menghapus seluruh riwayat pengerjaan ujian secara otomatis setiap menit',
          'C. Menjaga progres jawaban tetap tersimpan sebelum disinkronkan ke server pusat',
          'D. Mengubah kunci jawaban peserta secara acak sebelum dikirim',
          'E. Membatasi akses guru untuk melihat rekapitulasi nilai',
        ],
        answer: 'A, C',
        explanation:
          'Pilihan Ganda Kompleks (MCMA) memiliki lebih dari satu kunci jawaban benar, yaitu pernyataan A dan C.',
      },
      {
        number: 3,
        typeLabel: 'URAIAN',
        points: 50,
        extraLines: ['MODE URAIAN: SINGKAT', 'PENILAIAN: KATA_KUNCI'],
        questionLines: [
          'Tuliskan nama tokoh proklamator kemerdekaan Indonesia yang membacakan teks Proklamasi pada tanggal 17 Agustus 1945.',
        ],
        options: [
          'A. Soekarno',
          'B. Ir. Soekarno',
          'C. Bung Karno',
        ],
        answer: 'Soekarno | Ir. Soekarno | Bung Karno',
        explanation:
          'Opsi di atas adalah daftar variasi jawaban / kata kunci yang diterima sistem pada soal Uraian.',
      },
    ];

    const children: Paragraph[] = [
      new Paragraph({
        text: 'TEMPLATE BANK SOAL UJIAN CBT',
        heading: HeadingLevel.HEADING_1,
        alignment: AlignmentType.CENTER,
        spacing: { after: 100 },
      }),
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { after: 240 },
        children: [
          new TextRun({
            text: `${activityName} — ${subjectName}`,
            bold: true,
            size: 22,
            color: '3730A3',
          }),
        ],
      }),
      new Paragraph({
        border: {
          bottom: { style: BorderStyle.SINGLE, size: 6, color: 'CBD5E1' },
        },
        spacing: { after: 180 },
        children: [
          new TextRun({
            text: 'PETUNJUK PENGISIAN TEMPLATE (PG BIASA, PG KOMPLEKS / MCMA, & URAIAN):',
            bold: true,
            size: 20,
          }),
        ],
      }),
      new Paragraph({
        spacing: { after: 60 },
        children: [
          new TextRun({
            text: '1. Gunakan penanda "SOAL 1", "SOAL 2", dst. pada awal setiap butir soal.',
            size: 19,
          }),
        ],
      }),
      new Paragraph({
        spacing: { after: 60 },
        children: [
          new TextRun({
            text: '2. Tentukan jenis soal dengan baris "TIPE: PG" (Pilihan Ganda Biasa), "TIPE: MCMA" (Pilihan Ganda Kompleks), atau "TIPE: URAIAN".',
            size: 19,
          }),
        ],
      }),
      new Paragraph({
        spacing: { after: 60 },
        children: [
          new TextRun({
            text: '3. Untuk PG Biasa: tulis opsi "A." s/d "E." dan "KUNCI: B". Untuk MCMA: tulis beberapa kunci dipisah koma, misal "KUNCI: A, C".',
            size: 19,
          }),
        ],
      }),
      new Paragraph({
        spacing: { after: 60 },
        children: [
          new TextRun({
            text: '4. Untuk URAIAN: opsional tambahkan "MODE URAIAN: SINGKAT" atau "PANJANG", "PENILAIAN: KATA_KUNCI" / "PERSIS" / "MANUAL", serta opsi jawaban benar dengan "A.", "B." atau "KUNCI: jawaban1 | jawaban2".',
            size: 19,
          }),
        ],
      }),
      new Paragraph({
        spacing: { after: 240 },
        border: {
          bottom: { style: BorderStyle.SINGLE, size: 6, color: 'CBD5E1' },
        },
        children: [
          new TextRun({
            text: '5. Formula matematika/fisika/kimia dapat ditulis menggunakan $...$ (inline) atau $$...$$ (blok).',
            size: 19,
          }),
        ],
      }),
    ];

    sampleBlocks.forEach((item) => {
      children.push(
        new Paragraph({
          spacing: { before: 180, after: 60 },
          children: [
            new TextRun({
              text: `SOAL ${item.number}`,
              bold: true,
              size: 22,
              color: '1E293B',
            }),
          ],
        }),
        new Paragraph({
          spacing: { after: 40 },
          children: [
            new TextRun({
              text: `TIPE: ${item.typeLabel}`,
              bold: true,
              size: 20,
              color: '4338CA',
            }),
          ],
        }),
        new Paragraph({
          spacing: { after: 60 },
          children: [
            new TextRun({
              text: `BOBOT: ${item.points}`,
              bold: true,
              size: 20,
              color: '475569',
            }),
          ],
        })
      );

      item.extraLines.forEach((extra) => {
        children.push(
          new Paragraph({
            spacing: { after: 40 },
            children: [
              new TextRun({
                text: extra,
                bold: true,
                size: 19,
                color: '0F766E',
              }),
            ],
          })
        );
      });

      item.questionLines.forEach((line) => {
        children.push(
          new Paragraph({
            spacing: { after: 80 },
            children: [new TextRun({ text: line, size: 21 })],
          })
        );
      });

      item.options.forEach((optLine) => {
        children.push(
          new Paragraph({
            spacing: { after: 50 },
            children: [new TextRun({ text: optLine, size: 21 })],
          })
        );
      });

      children.push(
        new Paragraph({
          spacing: { before: 60, after: 50 },
          children: [
            new TextRun({
              text: `KUNCI: ${item.answer}`,
              bold: true,
              size: 20,
              color: '047857',
            }),
          ],
        }),
        new Paragraph({
          spacing: { after: 180 },
          border: {
            bottom: { style: BorderStyle.DASHED, size: 4, color: 'E2E8F0' },
          },
          children: [
            new TextRun({
              text: `PEMBAHASAN: ${item.explanation}`,
              size: 19,
              italics: true,
              color: '475569',
            }),
          ],
        })
      );
    });

    const doc = new Document({
      sections: [
        {
          properties: {},
          children,
        },
      ],
    });

    const blob = await Packer.toBlob(doc);
    const safeSubject = subjectName.replace(/[^a-zA-Z0-9]+/g, '_').replace(/^_|_$/g, '');
    const filename = `TEMPLATE_BANK_SOAL_${safeSubject || 'CBT'}.docx`;

    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  /**
   * Read an uploaded document (.docx, .doc HTML/text, or .txt) and extract Question[]
   */
  public static async parseQuestionDocumentFile(
    file: File,
    examId: string
  ): Promise<ParsedDocumentQuestionsResult> {
    const ext = file.name.split('.').pop()?.toLowerCase() || '';
    let rawText = '';

    if (ext === 'docx') {
      const arrayBuffer = await file.arrayBuffer();
      const result = await mammoth.extractRawText({ arrayBuffer });
      rawText = result.value || '';
    } else if (ext === 'doc') {
      const buffer = await file.arrayBuffer();
      const bytes = new Uint8Array(buffer.slice(0, 8));
      const isOleBinary =
        bytes.length >= 4 &&
        bytes[0] === 0xd0 &&
        bytes[1] === 0xcf &&
        bytes[2] === 0x11 &&
        bytes[3] === 0xe0;

      if (isOleBinary) {
        throw new Error(
          'File .doc format biner Word 97-2003 tidak dapat dibaca langsung di browser. Silakan "Save As" menjadi .docx di Microsoft Word atau gunakan file Template Soal (.docx) dari aplikasi ini.'
        );
      }

      const textContent = new TextDecoder('utf-8').decode(buffer);
      if (/<html|<body|<p|<div/i.test(textContent)) {
        const parser = new DOMParser();
        const htmlDoc = parser.parseFromString(textContent, 'text/html');
        rawText = htmlDoc.body?.innerText || htmlDoc.body?.textContent || '';
      } else {
        rawText = textContent;
      }
    } else if (ext === 'txt') {
      rawText = await file.text();
    } else {
      throw new Error('Format file tidak didukung. Gunakan file dokumen Word (.docx / .doc) atau .txt.');
    }

    return this.parseQuestionsFromText(rawText, examId);
  }

  private static resolveQuestionTypeTag(rawTag: string): QuestionType | null {
    const norm = rawTag.trim().toLowerCase();
    if (!norm) return null;
    if (
      norm.includes('mcma') ||
      norm.includes('komplek') ||
      norm.includes('pgk') ||
      norm.includes('multiple')
    ) {
      return 'multiple_choice';
    }
    if (
      norm.includes('uraian') ||
      norm.includes('esai') ||
      norm.includes('essay') ||
      norm.includes('isian') ||
      norm.includes('short')
    ) {
      return 'essay';
    }
    if (norm === 'pg' || norm.includes('biasa') || norm.includes('single') || norm.includes('pilihan ganda')) {
      return 'single_choice';
    }
    return null;
  }

  /**
   * Parse raw text extracted from a Word/TXT document into structured CBT questions
   */
  public static parseQuestionsFromText(
    rawText: string,
    examId: string
  ): ParsedDocumentQuestionsResult {
    const normalizedText = rawText.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
    const lines = normalizedText.split('\n');

    const explicitSoalRegex = /^SOAL\s*(?:NO\.?\s*)?(\d+)\b[:.]?\s*(.*)$/i;
    const hasExplicitSoalMarker = lines.some((l) => explicitSoalRegex.test(l.trim()));

    const numberedStartRegex = /^(\d+)\s*[.)]\s+(.+)$/;
    const tipeRegex = /^(?:TIPE|JENIS(?:\s+SOAL)?)\s*[:=]\s*(.+)$/i;
    const bobotRegex = /^(?:BOBOT|POIN|SKOR)\s*[:=]\s*(\d+(?:\.\d+)?)\b/i;
    const essayModeRegex = /^(?:MODE\s+URAIAN|BENTUK\s+URAIAN)\s*[:=]\s*(.+)$/i;
    const essayMatchRegex = /^(?:PENILAIAN(?:\s+URAIAN)?|METODE\s+PENILAIAN)\s*[:=]\s*(.+)$/i;
    const optionRegex = /^([A-H])\s*[.)]\s*(.*)$/;
    const essayBulletOptionRegex = /^(?:OPSI\s*(?:\d+|[A-H])|\d+\s*[.)])\s*[:=-]?\s*(.+)$/i;
    const kunciRegex = /^(?:KUNCI(?:\s+JAWABAN)?|JAWABAN(?:\s+BENAR)?)\s*[:=]\s*(.+)$/i;
    const pembahasanRegex = /^PEMBAHASAN\s*[:=]\s*(.*)$/i;

    interface DraftQuestion {
      number: number;
      explicitType: QuestionType | null;
      points: number;
      essayInputMode: 'short' | 'long';
      essayMatchMode: 'contains' | 'exact' | 'manual';
      questionLines: string[];
      optionsMap: Record<string, string[]>;
      essayOptions: string[];
      rawKey: string;
      explanationLines: string[];
      section: 'question' | 'option' | 'after_key' | 'explanation';
      activeOptionKey: string | null;
    }

    const drafts: DraftQuestion[] = [];
    let current: DraftQuestion | null = null;
    let inInstructionHeader = false;

    const pushCurrent = () => {
      if (current) {
        drafts.push(current);
        current = null;
      }
    };

    for (const rawLine of lines) {
      const trimmed = rawLine.trim();

      if (!trimmed || /^[-_=]{3,}$/.test(trimmed)) {
        continue;
      }

      if (/^PETUNJUK\b/i.test(trimmed)) {
        inInstructionHeader = true;
        continue;
      }

      const explicitMatch = trimmed.match(explicitSoalRegex);
      if (explicitMatch) {
        inInstructionHeader = false;
        pushCurrent();
        const num = Number(explicitMatch[1]) || drafts.length + 1;
        const remainder = explicitMatch[2]?.trim() || '';
        current = {
          number: num,
          explicitType: null,
          points: 20,
          essayInputMode: 'long',
          essayMatchMode: 'contains',
          questionLines: remainder ? [remainder] : [],
          optionsMap: {},
          essayOptions: [],
          rawKey: '',
          explanationLines: [],
          section: 'question',
          activeOptionKey: null,
        };
        continue;
      }

      if (hasExplicitSoalMarker && !current) {
        continue;
      }

      if (!hasExplicitSoalMarker) {
        if (inInstructionHeader && /^[-_]{3,}$/.test(trimmed)) {
          inInstructionHeader = false;
          continue;
        }
        const numberedMatch = trimmed.match(numberedStartRegex);
        if (
          numberedMatch &&
          (!current ||
            current.rawKey ||
            Object.keys(current.optionsMap).length >= 2 ||
            current.explicitType === 'essay')
        ) {
          inInstructionHeader = false;
          pushCurrent();
          current = {
            number: Number(numberedMatch[1]) || drafts.length + 1,
            explicitType: null,
            points: 20,
            essayInputMode: 'long',
            essayMatchMode: 'contains',
            questionLines: [numberedMatch[2].trim()],
            optionsMap: {},
            essayOptions: [],
            rawKey: '',
            explanationLines: [],
            section: 'question',
            activeOptionKey: null,
          };
          continue;
        }
      }

      if (!current) continue;

      const tipeMatch = trimmed.match(tipeRegex);
      if (tipeMatch && current.section === 'question') {
        const resolved = this.resolveQuestionTypeTag(tipeMatch[1]);
        if (resolved) {
          current.explicitType = resolved;
        }
        continue;
      }

      const bobotMatch = trimmed.match(bobotRegex);
      if (bobotMatch && current.section === 'question') {
        const parsedPoints = Number(bobotMatch[1]);
        if (!Number.isNaN(parsedPoints) && parsedPoints > 0) {
          current.points = parsedPoints;
        }
        continue;
      }

      const modeMatch = trimmed.match(essayModeRegex);
      if (modeMatch && current.section === 'question') {
        const val = modeMatch[1].toLowerCase();
        current.essayInputMode = val.includes('singkat') || val.includes('short') ? 'short' : 'long';
        if (!current.explicitType) current.explicitType = 'essay';
        continue;
      }

      const matchModeMatch = trimmed.match(essayMatchRegex);
      if (matchModeMatch && current.section === 'question') {
        const val = matchModeMatch[1].toLowerCase();
        if (val.includes('manual') || val.includes('bebas') || val.includes('rubrik')) {
          current.essayMatchMode = 'manual';
        } else if (val.includes('persis') || val.includes('exact') || val.includes('sama')) {
          current.essayMatchMode = 'exact';
        } else {
          current.essayMatchMode = 'contains';
        }
        if (!current.explicitType) current.explicitType = 'essay';
        continue;
      }

      const kunciMatch = trimmed.match(kunciRegex);
      if (kunciMatch) {
        current.rawKey = kunciMatch[1].trim();
        current.section = 'after_key';
        current.activeOptionKey = null;
        continue;
      }

      const pembahasanMatch = trimmed.match(pembahasanRegex);
      if (pembahasanMatch) {
        current.section = 'explanation';
        current.activeOptionKey = null;
        if (pembahasanMatch[1]?.trim()) {
          current.explanationLines.push(pembahasanMatch[1].trim());
        }
        continue;
      }

      const optionMatch = trimmed.match(optionRegex);
      if (optionMatch && current.section !== 'explanation') {
        const letter = optionMatch[1].toUpperCase();
        current.section = 'option';
        current.activeOptionKey = letter;
        current.optionsMap[letter] = [optionMatch[2]?.trim() || ''];
        continue;
      }

      if (current.explicitType === 'essay' && current.section !== 'explanation') {
        const essayOptMatch = trimmed.match(essayBulletOptionRegex);
        if (essayOptMatch && essayOptMatch[1]?.trim()) {
          current.section = 'option';
          current.activeOptionKey = `ESSAY_${current.essayOptions.length}`;
          current.essayOptions.push(essayOptMatch[1].trim());
          continue;
        }
      }

      if (current.section === 'explanation') {
        current.explanationLines.push(trimmed);
      } else if (current.section === 'option' && current.activeOptionKey) {
        if (current.activeOptionKey.startsWith('ESSAY_')) {
          const idx = Number(current.activeOptionKey.replace('ESSAY_', ''));
          if (!Number.isNaN(idx) && current.essayOptions[idx] !== undefined) {
            current.essayOptions[idx] = `${current.essayOptions[idx]}\n${trimmed}`;
          }
        } else {
          current.optionsMap[current.activeOptionKey].push(trimmed);
        }
      } else if (current.section === 'question') {
        current.questionLines.push(trimmed);
      }
    }

    pushCurrent();

    const warnings: string[] = [];
    const allLetters = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'] as const;
    const questions: Question[] = [];
    const batchTs = Date.now();

    drafts.forEach((draft, idx) => {
      const qText = draft.questionLines.join('\n').trim();
      if (!qText) {
        warnings.push(`Blok soal ke-${idx + 1} dilewati karena teks soal kosong.`);
        return;
      }

      const populatedChoiceLetters = allLetters.filter(
        (ltr) => draft.optionsMap[ltr] && draft.optionsMap[ltr].join(' ').trim() !== ''
      );

      // Parse potential letter keys (e.g. "A", "A, C", "A B D", "AC")
      const cleanedKey = draft.rawKey.trim();
      const letterTokens = cleanedKey
        .toUpperCase()
        .replace(/\bDAN\b/g, ',')
        .split(/[\s,;+/]+/)
        .map((t) => t.trim())
        .filter((t) => /^[A-H]$/.test(t));

      const compactLetters =
        letterTokens.length === 0 && /^[A-H]{2,8}$/i.test(cleanedKey)
          ? cleanedKey.toUpperCase().split('')
          : letterTokens;

      const uniqueKeyLetters = Array.from(new Set(compactLetters));

      // Infer question type if TIPE line wasn't supplied
      let resolvedType: QuestionType = draft.explicitType || 'single_choice';
      if (!draft.explicitType) {
        if (populatedChoiceLetters.length === 0) {
          resolvedType = 'essay';
        } else if (uniqueKeyLetters.length > 1) {
          resolvedType = 'multiple_choice';
        } else {
          resolvedType = 'single_choice';
        }
      }

      if (resolvedType === 'essay') {
        const optionTextsFromLetters = allLetters
          .map((ltr) => (draft.optionsMap[ltr] || []).join('\n').trim())
          .filter(Boolean);
        const keyParts = cleanedKey
          ? cleanedKey
              .split(/[|;\n]+/)
              .map((s) => s.trim())
              .filter(Boolean)
          : [];

        const combinedAnswers = Array.from(
          new Set([...draft.essayOptions, ...optionTextsFromLetters, ...keyParts])
        );

        const essayOpts: QuestionOption[] = combinedAnswers.map((ansText, aIdx) => ({
          id: `ans-${aIdx + 1}`,
          label: String(aIdx + 1),
          text: ansText,
        }));

        const essayConfig: EssayQuestionOptions = {
          inputMode: draft.essayInputMode,
          matchMode:
            combinedAnswers.length === 0 ? 'manual' : draft.essayMatchMode,
        };

        questions.push({
          id: `q-doc-${batchTs}-${idx + 1}`,
          examId,
          number: draft.number || questions.length + 1,
          type: 'essay',
          questionText: qText,
          options: essayOpts,
          correctAnswer: combinedAnswers,
          essayOptions: essayConfig,
          explanation: draft.explanationLines.join('\n').trim() || undefined,
          points: draft.points || 20,
        });
        return;
      }

      // PG Biasa & MCMA
      if (populatedChoiceLetters.length < 2) {
        warnings.push(
          `Soal nomor ${draft.number} dilewati karena Pilihan Ganda minimal harus memiliki 2 opsi jawaban.`
        );
        return;
      }

      const lastUsedLetterIndex = Math.max(
        3, // at least A-D
        ...populatedChoiceLetters.map((ltr) => allLetters.indexOf(ltr))
      );

      const finalOptions: QuestionOption[] = allLetters
        .slice(0, lastUsedLetterIndex + 1)
        .map((ltr) => ({
          id: `opt-${ltr.toLowerCase()}`,
          label: ltr,
          text: (draft.optionsMap[ltr] || []).join('\n').trim(),
        }))
        .filter((opt, optIdx) => optIdx < 4 || opt.text !== '');

      if (resolvedType === 'multiple_choice') {
        const validIds = uniqueKeyLetters
          .filter((ltr) => finalOptions.some((o) => o.label === ltr))
          .map((ltr) => `opt-${ltr.toLowerCase()}`);

        if (validIds.length === 0) {
          warnings.push(
            `Kunci jawaban MCMA pada Soal nomor ${draft.number} tidak valid, diset default ke opsi A.`
          );
          validIds.push(finalOptions[0]?.id || 'opt-a');
        }

        questions.push({
          id: `q-doc-${batchTs}-${idx + 1}`,
          examId,
          number: draft.number || questions.length + 1,
          type: 'multiple_choice',
          questionText: qText,
          options: finalOptions,
          correctAnswer: validIds,
          explanation: draft.explanationLines.join('\n').trim() || undefined,
          points: draft.points || 20,
        });
      } else {
        let chosenLetter = uniqueKeyLetters[0] || 'A';
        if (!finalOptions.some((o) => o.label === chosenLetter)) {
          warnings.push(
            `Kunci jawaban pada Soal nomor ${draft.number} tidak ditemukan/tidak valid, diset default ke A.`
          );
          chosenLetter = finalOptions[0]?.label || 'A';
        }

        questions.push({
          id: `q-doc-${batchTs}-${idx + 1}`,
          examId,
          number: draft.number || questions.length + 1,
          type: 'single_choice',
          questionText: qText,
          options: finalOptions,
          correctAnswer: `opt-${chosenLetter.toLowerCase()}`,
          explanation: draft.explanationLines.join('\n').trim() || undefined,
          points: draft.points || 20,
        });
      }
    });

    return { questions, warnings };
  }
}
