/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Exam, Submission, ItemAnalysis } from '../types/cbt';
import { CBTStorageService } from './cbt-storage';

export class CBTExportService {
  /**
   * Export comprehensive multi-sheet Excel file (.xlsx)
   */
  public static exportToExcel(
    exam: Exam,
    submissions: Submission[],
    itemAnalysis: ItemAnalysis[]
  ): void {
    const workbook = XLSX.utils.book_new();

    // 1. Sheet 1: Rekap Nilai Siswa
    const recapData = submissions.map((sub, index) => ({
      'No': index + 1,
      'NISN': sub.nisn,
      'Nama Siswa': sub.studentName,
      'Kelas': sub.className,
      'Ruang Ujian': sub.room,
      'Benar': sub.correctCount,
      'Salah': sub.incorrectCount,
      'Kosong': sub.emptyCount,
      'Ragu-ragu': sub.doubtfulCount,
      'Pelanggaran (Anti-Fraud)': sub.infractionsCount,
      'Skor Perolehan': sub.score,
      'Skor Maksimal': sub.maxScore,
      'Nilai Akhir (0-100)': sub.percentage,
      'KKM': exam.kkm,
      'Status Kelulusan': sub.isPassed ? 'TUNTAS' : 'BELUM TUNTAS',
      'Durasi Pengerjaan (Menit)': Math.round(sub.durationSecondsUsed / 60),
      'Waktu Selesai': sub.finishedAt ? new Date(sub.finishedAt).toLocaleString('id-ID') : '-',
    }));

    const recapSheet = XLSX.utils.json_to_sheet(recapData);
    // Set auto column widths
    recapSheet['!cols'] = [
      { wch: 5 },  // No
      { wch: 14 }, // NISN
      { wch: 28 }, // Nama
      { wch: 14 }, // Kelas
      { wch: 16 }, // Ruang
      { wch: 8 },  // Benar
      { wch: 8 },  // Salah
      { wch: 8 },  // Kosong
      { wch: 10 }, // Ragu
      { wch: 14 }, // Pelanggaran
      { wch: 12 }, // Skor
      { wch: 12 }, // Max Skor
      { wch: 18 }, // Nilai Akhir
      { wch: 8 },  // KKM
      { wch: 16 }, // Status
      { wch: 14 }, // Durasi
      { wch: 22 }, // Waktu
    ];
    XLSX.utils.book_append_sheet(workbook, recapSheet, 'Rekap Nilai Siswa');

    // 2. Sheet 2: Matriks Jawaban Siswa
    const examQuestions = CBTStorageService.getQuestions(exam.id);
    const questionMap = new Map(examQuestions.map(q => [q.id, q]));

    const matrixData = submissions.map((sub, index) => {
      const row: Record<string, any> = {
        'No': index + 1,
        'NISN': sub.nisn,
        'Nama Siswa': sub.studentName,
        'Kelas': sub.className,
      };

      // Add answer per question
      itemAnalysis.forEach((ia) => {
        const q = questionMap.get(ia.questionId);
        const ans = sub.answers[ia.questionId];
        let displayAnswer = '-';
        if (ans && ans.selectedOption) {
          if (Array.isArray(ans.selectedOption)) {
            if (ans.selectedOption.length > 0) {
              displayAnswer = ans.selectedOption
                .map(id => {
                  const found = q?.options.find(o => o.id === id);
                  return found ? found.label : id.replace(/.*-([a-h])$/i, '$1').toUpperCase();
                })
                .join(', ');
            }
          } else if (q?.type === 'essay' || q?.type === 'short_answer') {
            displayAnswer = ans.selectedOption.trim() || '-';
          } else {
            const found = q?.options.find(o => o.id === ans.selectedOption);
            displayAnswer = found
              ? found.label
              : ans.selectedOption.replace(/.*-([a-h])$/i, '$1').toUpperCase();
          }
          if (displayAnswer !== '-' && ans.isDoubtful) {
            displayAnswer += ' (R)';
          }
        }
        row[`Soal ${ia.questionNumber}`] = displayAnswer;
      });

      row['Nilai'] = sub.percentage;
      return row;
    });

    const matrixSheet = XLSX.utils.json_to_sheet(matrixData);
    XLSX.utils.book_append_sheet(workbook, matrixSheet, 'Matriks Jawaban');

    // 3. Sheet 3: Analisis Butir Soal (Item Analysis)
    const analysisData = itemAnalysis.map(ia => ({
      'Nomor Soal': ia.questionNumber,
      'Tingkat Kesukaran': ia.difficulty,
      'Persentase Benar (%)': `${ia.correctPercentage}%`,
      'Daya Pembeda (D)': ia.discriminatingPower,
      'Total Menjawab': ia.totalAnswered,
      'Pilihan A': ia.optionDistribution['A'] || 0,
      'Pilihan B': ia.optionDistribution['B'] || 0,
      'Pilihan C': ia.optionDistribution['C'] || 0,
      'Pilihan D': ia.optionDistribution['D'] || 0,
      'Pilihan E': ia.optionDistribution['E'] || 0,
    }));

    const analysisSheet = XLSX.utils.json_to_sheet(analysisData);
    analysisSheet['!cols'] = [
      { wch: 12 }, { wch: 18 }, { wch: 20 }, { wch: 18 }, { wch: 14 },
      { wch: 10 }, { wch: 10 }, { wch: 10 }, { wch: 10 }, { wch: 10 }
    ];
    XLSX.utils.book_append_sheet(workbook, analysisSheet, 'Analisis Butir Soal');

    // Save file
    const safeTitle = exam.title.replace(/[^a-zA-Z0-9]/g, '_');
    const filename = `REKAP_NILAI_CBT_${safeTitle}_${new Date().toISOString().slice(0, 10)}.xlsx`;
    XLSX.writeFile(workbook, filename);
  }

  /**
   * Export formal Indonesian School/Madrasah Berita Acara & Rekap Nilai to PDF
   */
  public static exportToPdf(exam: Exam, submissions: Submission[]): void {
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    });

    const pageWidth = doc.internal.pageSize.getWidth();

    const branding = CBTStorageService.getBranding();
    const safeSchoolName = (branding.title2 || exam.schoolName).toUpperCase();
    const safeTitle1 = (branding.title1 || 'KEMENTERIAN AGAMA / DINAS PENDIDIKAN').toUpperCase();
    const safeTitle3 = (branding.title3 || 'SISTEM UJIAN BERBASIS KOMPUTER (CBT MANDIRI ONLINE)').toUpperCase();

    // 1. Header / Kop Resmi Madrasah/Sekolah
    // Try adding school logo if valid base64 data image
    if (branding.logoUrl && branding.logoUrl.startsWith('data:image')) {
      try {
        const format = branding.logoUrl.includes('image/png') ? 'PNG' : 'JPEG';
        doc.addImage(branding.logoUrl, format, 16, 12, 18, 18);
      } catch {
        // Fallback gracefully without image if format unsupported by jsPDF
      }
    }

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.text(safeTitle1, pageWidth / 2, 16, { align: 'center' });
    doc.setFontSize(14);
    doc.text(safeSchoolName, pageWidth / 2, 22, { align: 'center' });
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.text(safeTitle3, pageWidth / 2, 27, { align: 'center' });
    doc.text(`Tahun Pelajaran: ${exam.academicYear} | Jenjang: ${exam.gradeLevel}`, pageWidth / 2, 31, { align: 'center' });

    // Double hairline border under Kop
    doc.setLineWidth(0.8);
    doc.line(14, 34, pageWidth - 14, 34);
    doc.setLineWidth(0.2);
    doc.line(14, 35.5, pageWidth - 14, 35.5);

    // 2. Judul Dokumen
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.text('BERITA ACARA & REKAPITULASI HASIL UJIAN', pageWidth / 2, 43, { align: 'center' });

    // 3. Exam metadata summary block
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9.5);
    const startY = 49;
    const col1 = 16;
    const col2 = 62;
    const col3 = 115;
    const col4 = 155;

    doc.text('Mata Pelajaran', col1, startY);
    doc.text(`: ${exam.subject}`, col2, startY);
    doc.text('Tanggal Ujian', col3, startY);
    doc.text(`: ${new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}`, col4, startY);

    doc.text('Kode Ujian', col1, startY + 5);
    doc.text(`: ${exam.code}`, col2, startY + 5);
    doc.text('Standar KKM', col3, startY + 5);
    doc.text(`: ${exam.kkm}`, col4, startY + 5);

    doc.text('Jumlah Soal', col1, startY + 10);
    doc.text(`: ${exam.totalQuestions} Soal`, col2, startY + 10);
    doc.text('Total Peserta', col3, startY + 10);
    doc.text(`: ${submissions.length} Siswa`, col4, startY + 10);

    const passedCount = submissions.filter(s => s.isPassed).length;
    const passRate = submissions.length > 0 ? Math.round((passedCount / submissions.length) * 100) : 0;
    const avgScore = submissions.length > 0 ? (submissions.reduce((acc, s) => acc + s.percentage, 0) / submissions.length).toFixed(1) : '0';

    doc.text('Rata-rata Nilai', col1, startY + 15);
    doc.text(`: ${avgScore}`, col2, startY + 15);
    doc.text('Persentase Tuntas', col3, startY + 15);
    doc.text(`: ${passRate}% (${passedCount}/${submissions.length} Siswa)`, col4, startY + 15);

    // 4. AutoTable for student scores
    const tableBody = submissions.map((sub, idx) => [
      String(idx + 1),
      sub.nisn,
      sub.studentName,
      sub.className,
      String(sub.correctCount),
      String(sub.incorrectCount),
      String(sub.infractionsCount),
      String(sub.percentage),
      sub.isPassed ? 'TUNTAS' : 'BELUM TUNTAS',
    ]);

    autoTable(doc, {
      startY: startY + 22,
      head: [['No', 'NISN', 'Nama Peserta', 'Kelas', 'Benar', 'Salah', 'Plgrn', 'Nilai', 'Status']],
      body: tableBody,
      theme: 'grid',
      styles: {
        fontSize: 8.5,
        cellPadding: 2,
        font: 'helvetica',
      },
      headStyles: {
        fillColor: [30, 41, 59], // Dark slate
        textColor: 255,
        fontStyle: 'bold',
        halign: 'center',
      },
      columnStyles: {
        0: { halign: 'center', cellWidth: 10 },
        1: { halign: 'center', cellWidth: 26 },
        2: { cellWidth: 50 },
        3: { halign: 'center', cellWidth: 24 },
        4: { halign: 'center', cellWidth: 14 },
        5: { halign: 'center', cellWidth: 14 },
        6: { halign: 'center', cellWidth: 14 },
        7: { halign: 'center', fontStyle: 'bold', cellWidth: 16 },
        8: { halign: 'center', cellWidth: 22 },
      },
      didParseCell: (data) => {
        if (data.section === 'body' && data.column.index === 8) {
          if (data.cell.raw === 'TUNTAS') {
            data.cell.styles.textColor = [16, 120, 60];
            data.cell.styles.fontStyle = 'bold';
          } else {
            data.cell.styles.textColor = [180, 40, 40];
          }
        }
      },
    });

    // 5. Signature area at bottom of document
    const finalY = (doc as any).lastAutoTable.finalY + 14;
    const signY = finalY > 230 ? 245 : finalY;

    if (signY > 230) {
      doc.addPage();
    }

    const todayStr = new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
    doc.setFontSize(9);
    doc.text(`Ditetapkan pada: ${todayStr}`, pageWidth - 70, signY);
    doc.text('Pengawas Ruang / Guru Pengampu,', pageWidth - 70, signY + 6);
    doc.text('Mengetahui,', 20, signY + 6);
    doc.text('Kepala Madrasah / Sekolah,', 20, signY + 11);

    doc.setFont('helvetica', 'bold');
    doc.text('( _________________________ )', pageWidth - 70, signY + 30);
    doc.text('NIP. .................................................', pageWidth - 70, signY + 35);

    doc.text('( _________________________ )', 20, signY + 30);
    doc.text('NIP. .................................................', 20, signY + 35);

    const safeTitle = exam.title.replace(/[^a-zA-Z0-9]/g, '_');
    doc.save(`BERITA_ACARA_CBT_${safeTitle}.pdf`);
  }

  /**
   * Generate and download Excel template for importing students
   */
  public static downloadStudentTemplate(): void {
    const workbook = XLSX.utils.book_new();

    const templateData = [
      {
        'nis': '20241011',
        'nisn': '0078912345',
        'name': 'Muhammad Al-Fatih Pratama',
        'gender': 'Laki-laki',
        'className': 'XII MIPA 1',
        'room': 'Lab Komputer 1',
      },
      {
        'nis': '20241012',
        'nisn': '0078912346',
        'name': 'Annisa Tri Wahyuni',
        'gender': 'Perempuan',
        'className': 'XII MIPA 1',
        'room': 'Lab Komputer 1',
      },
      {
        'nis': '20241013',
        'nisn': '0078912347',
        'name': 'Rizky Kurniawan',
        'gender': 'Laki-laki',
        'className': 'XII MIPA 2',
        'room': 'Lab Komputer 2',
      },
    ];

    const worksheet = XLSX.utils.json_to_sheet(templateData);
    worksheet['!cols'] = [
      { wch: 14 }, // nis
      { wch: 16 }, // nisn
      { wch: 30 }, // name
      { wch: 14 }, // gender
      { wch: 16 }, // className
      { wch: 18 }, // room
    ];

    XLSX.utils.book_append_sheet(workbook, worksheet, 'Template Siswa');
    XLSX.writeFile(workbook, 'TEMPLATE_IMPORT_SISWA.xlsx');
  }

  /**
   * Generate and download Excel template for importing teachers
   */
  public static downloadTeacherTemplate(): void {
    const workbook = XLSX.utils.book_new();

    const templateData = [
      {
        'nip': '197805122003122001',
        'name': 'Dra. Hj. Siti Rahmawati, M.Pd.',
        'subject': 'Matematika Peminatan',
        'gender': 'Perempuan',
        'username': 'guru',
        'email': 'siti.rahmawati@sekolah.sch.id',
        'phone': '081234567890',
      },
      {
        'nip': '198204152006041003',
        'name': 'Ahmad Syafiq, M.Si.',
        'subject': 'Fisika Terapan & Mekanika',
        'gender': 'Laki-laki',
        'username': 'asyafiq',
        'email': 'ahmad.syafiq@sekolah.sch.id',
        'phone': '081298765432',
      },
    ];

    const worksheet = XLSX.utils.json_to_sheet(templateData);
    worksheet['!cols'] = [
      { wch: 22 }, // nip
      { wch: 32 }, // name
      { wch: 28 }, // subject
      { wch: 14 }, // gender
      { wch: 18 }, // username
      { wch: 28 }, // email
      { wch: 16 }, // phone
    ];

    XLSX.utils.book_append_sheet(workbook, worksheet, 'Template Guru');
    XLSX.writeFile(workbook, 'TEMPLATE_IMPORT_GURU.xlsx');
  }
}
