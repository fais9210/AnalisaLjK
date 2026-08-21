import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { AIAnalysisResult, ExamSheetConfig, ExamStatistics, QuestionAnalysis, StudentScoreRow } from '../types';
import { formatSignatureDate } from './analysisEngine';

export const PdfService = {
  // 1. Official Lembar Analisa Sheet (A4 Landscape)
  generateExamSheetPdf(
    config: ExamSheetConfig,
    rows: StudentScoreRow[],
    questionAnalyses: QuestionAnalysis[]
  ): void {
    const doc = new jsPDF({
      orientation: 'landscape',
      unit: 'mm',
      format: 'a4',
    });

    const pageWidth = doc.internal.pageSize.getWidth();

    // 1. Official Header
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.text(config.title.toUpperCase(), pageWidth / 2, 14, { align: 'center' });

    doc.setFontSize(12);
    doc.text(config.schoolName.toUpperCase(), pageWidth / 2, 20, { align: 'center' });

    doc.setFontSize(10);
    doc.text(config.academicYear.toUpperCase(), pageWidth / 2, 25, { align: 'center' });

    // Meta row (Kelas, Fan, KKM)
    doc.setFontSize(9.5);
    doc.setFont('helvetica', 'bold');
    doc.text(`KELAS : ${config.className}`, 14, 32);
    doc.text(`FAN / MAPEL : ${config.subjectName}`, 80, 32);
    doc.text(`KKM : ${config.kkm}`, 160, 32);
    doc.text(`TOTAL SISWA : ${rows.length}`, 220, 32);

    // Filter questions
    const pgQuestions = config.questions.filter((q) => q.type === 'pg');
    const isianQuestions = config.questions.filter((q) => q.type === 'isian');
    const uraianQuestions = config.questions.filter((q) => q.type === 'uraian');

    // Build autotable headers
    const headRow1: any[] = [
      { content: 'NO', rowSpan: 2, styles: { halign: 'center', valign: 'middle' } },
      { content: 'NAMA MURID', rowSpan: 2, styles: { halign: 'center', valign: 'middle' } },
    ];

    if (pgQuestions.length > 0) {
      headRow1.push({
        content: `PILIHAN GANDA (POIN ${pgQuestions[0]?.maxScore || 5})`,
        colSpan: pgQuestions.length,
        styles: { halign: 'center', fillColor: [219, 234, 254], textColor: [17, 24, 39] },
      });
    }

    if (isianQuestions.length > 0) {
      headRow1.push({
        content: `ISIAN (POIN ${isianQuestions[0]?.maxScore || 6})`,
        colSpan: isianQuestions.length,
        styles: { halign: 'center', fillColor: [243, 232, 255], textColor: [17, 24, 39] },
      });
    }

    if (uraianQuestions.length > 0) {
      headRow1.push({
        content: `URAIAN (POIN ${uraianQuestions[0]?.maxScore || 7})`,
        colSpan: uraianQuestions.length,
        styles: { halign: 'center', fillColor: [220, 252, 231], textColor: [17, 24, 39] },
      });
    }

    headRow1.push(
      { content: 'JML\nBENAR', rowSpan: 2, styles: { halign: 'center', valign: 'middle' } },
      { content: 'JML\nSALAH', rowSpan: 2, styles: { halign: 'center', valign: 'middle' } },
      { content: 'NILAI', rowSpan: 2, styles: { halign: 'center', valign: 'middle' } },
      { content: 'STATUS', rowSpan: 2, styles: { halign: 'center', valign: 'middle' } }
    );

    // Head Row 2: Question Numbers
    const headRow2: any[] = [];
    pgQuestions.forEach((q) => headRow2.push({ content: String(q.number), styles: { halign: 'center', fillColor: [219, 234, 254] } }));
    isianQuestions.forEach((q) => headRow2.push({ content: String(q.number), styles: { halign: 'center', fillColor: [243, 232, 255] } }));
    uraianQuestions.forEach((q) => headRow2.push({ content: String(q.number), styles: { halign: 'center', fillColor: [220, 252, 231] } }));

    // Body rows
    const bodyRows = rows.map((r, index) => {
      const rowArr: any[] = [
        { content: String(index + 1), styles: { halign: 'center' } },
        { content: r.studentName, styles: { halign: 'left' } },
      ];

      for (const q of config.questions) {
        const score = r.scores[q.id] !== undefined ? r.scores[q.id] : 0;
        let cellBg = [255, 255, 255];
        if (q.type === 'pg') cellBg = [245, 250, 255];
        else if (q.type === 'isian') cellBg = [253, 248, 255];
        else if (q.type === 'uraian') cellBg = [245, 254, 247];

        rowArr.push({
          content: score > 0 ? String(score) : '0',
          styles: { halign: 'center', fillColor: cellBg },
        });
      }

      rowArr.push(
        { content: String(r.correctQuestionsCount), styles: { halign: 'center' } },
        { content: String(r.wrongQuestionsCount), styles: { halign: 'center' } },
        { content: String(r.totalScore), styles: { halign: 'center', fontStyle: 'bold' } },
        { content: r.isPassed ? 'TUNTAS' : 'REMEDIAL', styles: { halign: 'center', fontStyle: 'bold', textColor: r.isPassed ? [22, 101, 52] : [185, 28, 28] } }
      );

      return rowArr;
    });

    // Summary Rows
    const summaryBenarRow: any[] = [
      { content: 'JUMLAH JAWABAN BENAR', colSpan: 2, styles: { fontStyle: 'bold', halign: 'center' } },
    ];
    const summarySalahRow: any[] = [
      { content: 'JUMLAH JAWABAN SALAH', colSpan: 2, styles: { fontStyle: 'bold', halign: 'center' } },
    ];

    for (const q of config.questions) {
      const qa = questionAnalyses.find((a) => a.questionId === q.id);
      summaryBenarRow.push({ content: String(qa ? qa.correctCount : 0), styles: { halign: 'center', fontStyle: 'bold' } });
      summarySalahRow.push({ content: String(qa ? qa.wrongCount : 0), styles: { halign: 'center', fontStyle: 'bold' } });
    }

    summaryBenarRow.push({ content: '', colSpan: 4 });
    summarySalahRow.push({ content: '', colSpan: 4 });

    bodyRows.push(summaryBenarRow as any);
    bodyRows.push(summarySalahRow as any);

    // Render table
    autoTable(doc, {
      startY: 35,
      head: [headRow1, headRow2],
      body: bodyRows,
      theme: 'grid',
      styles: {
        fontSize: 7.5,
        cellPadding: 1.2,
        lineColor: [120, 120, 120],
        lineWidth: 0.2,
        textColor: [20, 20, 20],
      },
      headStyles: {
        textColor: [0, 0, 0],
        lineColor: [80, 80, 80],
        lineWidth: 0.3,
        fontStyle: 'bold',
      },
      margin: { left: 8, right: 8 },
    });

    // Signatures
    const finalY = (doc as any).lastAutoTable ? (doc as any).lastAutoTable.finalY + 8 : 160;
    const signY = Math.min(finalY, 175);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);

    // Left Signature: Kepala Madrasah
    doc.text('Mengetahui,', 25, signY);
    doc.text('Kepala Madrasah', 25, signY + 5);

    doc.setFont('helvetica', 'bold');
    doc.text(config.headmasterName, 25, signY + 22);
    doc.setLineWidth(0.3);
    doc.line(25, signY + 23, 25 + doc.getTextWidth(config.headmasterName), signY + 23);

    // Right Signature: Wali Kelas
    const rightColX = pageWidth - 75;
    doc.setFont('helvetica', 'normal');
    doc.text(formatSignatureDate(config), rightColX, signY);
    doc.text('Wali Kelas / Guru Pengampu', rightColX, signY + 5);

    doc.setFont('helvetica', 'bold');
    doc.text(config.teacherName || '...........................................', rightColX, signY + 22);
    doc.line(rightColX, signY + 23, rightColX + doc.getTextWidth(config.teacherName || '...........................................'), signY + 23);

    doc.save(`Lembar_Analisa_${config.className}_${config.subjectName}_${Date.now()}.pdf`);
  },

  // 2. Program Remedial & Hasil Perbaikan Nilai (A4 Portrait)
  generateRemedialProgramPdf(
    config: ExamSheetConfig,
    stats: ExamStatistics
  ): void {
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    });

    const pageWidth = doc.internal.pageSize.getWidth();

    // Kop Madrasah
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(13);
    doc.text('PROGRAM & PELAKSANAAN REMEDIAL (PERBAIKAN PEMBELAJARAN)', pageWidth / 2, 14, { align: 'center' });

    doc.setFontSize(11);
    doc.text(config.schoolName.toUpperCase(), pageWidth / 2, 20, { align: 'center' });

    doc.setFontSize(9.5);
    doc.setFont('helvetica', 'normal');
    doc.text(`Tahun Ajaran: ${config.academicYear}   |   Mata Pelajaran: ${config.subjectName}   |   Kelas: ${config.className}   |   KKM: ${config.kkm}`, pageWidth / 2, 26, { align: 'center' });

    // Table Data
    const remedialRows = (stats.remedialDetails || []).map((s, idx) => [
      String(idx + 1),
      s.name,
      String(s.score),
      s.wrongQuestionNumbers.length > 0 ? `No. ${s.wrongQuestionNumbers.slice(0, 5).join(', ')}` : 'Konsep Dasar',
      s.suggestedAction,
      '', // Nilai Remedial (dikosongkan untuk diisi guru/arsip)
      'TUNTAS',
    ]);

    if (remedialRows.length === 0) {
      remedialRows.push(['-', 'Seluruh Siswa Tuntas KKM', '-', '-', '-', '-', 'TUNTAS']);
    }

    autoTable(doc, {
      startY: 32,
      head: [['NO', 'NAMA SISWA', 'NILAI AWAL', 'BUTIR SOAL / MATERI REMEDIAL', 'BENTUK PELAKSANAAN REMEDIAL', 'NILAI AKHIR', 'KET']],
      body: remedialRows,
      theme: 'grid',
      headStyles: { fillColor: [185, 28, 28], textColor: [255, 255, 255], fontStyle: 'bold', halign: 'center' },
      styles: { fontSize: 8, cellPadding: 2 },
      columnStyles: {
        0: { halign: 'center', cellWidth: 10 },
        1: { halign: 'left', cellWidth: 42 },
        2: { halign: 'center', cellWidth: 16, fontStyle: 'bold' },
        3: { halign: 'left', cellWidth: 38 },
        4: { halign: 'left', cellWidth: 50 },
        5: { halign: 'center', cellWidth: 18 },
        6: { halign: 'center', cellWidth: 16, fontStyle: 'bold' },
      },
      margin: { left: 10, right: 10 },
    });

    // Catatan Pelaksanaan
    const finalY = (doc as any).lastAutoTable ? (doc as any).lastAutoTable.finalY + 8 : 180;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.text('Keterangan & Rekomendasi Guru:', 12, finalY);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.text('1. Remedial dilaksanakan dengan pemberian bimbingan khusus pada materi butir soal yang belum dikuasai.', 12, finalY + 5);
    doc.text('2. Nilai akhir remedial disesuaikan dengan ketentuan KKM madrasah yang berlaku.', 12, finalY + 10);

    // Signatures
    const signY = finalY + 22;
    doc.setFontSize(9);
    doc.text('Mengetahui,', 25, signY);
    doc.text('Kepala Madrasah', 25, signY + 5);
    doc.setFont('helvetica', 'bold');
    doc.text(config.headmasterName, 25, signY + 22);
    doc.line(25, signY + 23, 25 + doc.getTextWidth(config.headmasterName), signY + 23);

    const rightColX = pageWidth - 70;
    doc.setFont('helvetica', 'normal');
    doc.text(formatSignatureDate(config), rightColX, signY);
    doc.text('Guru Pengampu / Wali Kelas', rightColX, signY + 5);
    doc.setFont('helvetica', 'bold');
    doc.text(config.teacherName || '...........................................', rightColX, signY + 22);
    doc.line(rightColX, signY + 23, rightColX + doc.getTextWidth(config.teacherName || '...........................................'), signY + 23);

    doc.save(`Program_Remedial_${config.className}_${config.subjectName}_${Date.now()}.pdf`);
  },

  // 3. Program Pengayaan (A4 Portrait)
  generateEnrichmentProgramPdf(
    config: ExamSheetConfig,
    stats: ExamStatistics
  ): void {
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    });

    const pageWidth = doc.internal.pageSize.getWidth();

    // Header
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(13);
    doc.text('PROGRAM PENGAYAAN SISWA BERPRESTASI', pageWidth / 2, 14, { align: 'center' });

    doc.setFontSize(11);
    doc.text(config.schoolName.toUpperCase(), pageWidth / 2, 20, { align: 'center' });

    doc.setFontSize(9.5);
    doc.setFont('helvetica', 'normal');
    doc.text(`Tahun Ajaran: ${config.academicYear}   |   Mata Pelajaran: ${config.subjectName}   |   Kelas: ${config.className}   |   KKM: ${config.kkm}`, pageWidth / 2, 26, { align: 'center' });

    // Table Data
    const enrichmentRows = (stats.enrichmentDetails || []).map((s, idx) => [
      String(idx + 1),
      s.name,
      String(s.score),
      s.suggestedActivity,
      'MANDIRI / KELOMPOK',
      'TERLAKSANA',
    ]);

    if (enrichmentRows.length === 0) {
      enrichmentRows.push(['-', 'Belum ada data siswa tuntas', '-', '-', '-', '-']);
    }

    autoTable(doc, {
      startY: 32,
      head: [['NO', 'NAMA SISWA', 'NILAI AWAL', 'BENTUK KEGIATAN PENGAYAAN', 'METODE', 'STATUS']],
      body: enrichmentRows,
      theme: 'grid',
      headStyles: { fillColor: [21, 128, 61], textColor: [255, 255, 255], fontStyle: 'bold', halign: 'center' },
      styles: { fontSize: 8, cellPadding: 2 },
      columnStyles: {
        0: { halign: 'center', cellWidth: 10 },
        1: { halign: 'left', cellWidth: 48 },
        2: { halign: 'center', cellWidth: 20, fontStyle: 'bold' },
        3: { halign: 'left', cellWidth: 65 },
        4: { halign: 'center', cellWidth: 28 },
        5: { halign: 'center', cellWidth: 19, fontStyle: 'bold' },
      },
      margin: { left: 10, right: 10 },
    });

    const finalY = (doc as any).lastAutoTable ? (doc as any).lastAutoTable.finalY + 8 : 180;
    const signY = finalY + 14;
    doc.setFontSize(9);
    doc.text('Mengetahui,', 25, signY);
    doc.text('Kepala Madrasah', 25, signY + 5);
    doc.setFont('helvetica', 'bold');
    doc.text(config.headmasterName, 25, signY + 22);
    doc.line(25, signY + 23, 25 + doc.getTextWidth(config.headmasterName), signY + 23);

    const rightColX = pageWidth - 70;
    doc.setFont('helvetica', 'normal');
    doc.text(formatSignatureDate(config), rightColX, signY);
    doc.text('Guru Pengampu / Wali Kelas', rightColX, signY + 5);
    doc.setFont('helvetica', 'bold');
    doc.text(config.teacherName || '...........................................', rightColX, signY + 22);
    doc.line(rightColX, signY + 23, rightColX + doc.getTextWidth(config.teacherName || '...........................................'), signY + 23);

    doc.save(`Program_Pengayaan_${config.className}_${config.subjectName}_${Date.now()}.pdf`);
  },

  // 4. Rekapitulasi Analisis Kualitas Butir Soal (A4 Portrait)
  generateItemAnalysisSummaryPdf(
    config: ExamSheetConfig,
    stats: ExamStatistics
  ): void {
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    });

    const pageWidth = doc.internal.pageSize.getWidth();

    // Header
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(13);
    doc.text('REKAPITULASI ANALISIS KUALITAS BUTIR SOAL', pageWidth / 2, 14, { align: 'center' });

    doc.setFontSize(11);
    doc.text(config.schoolName.toUpperCase(), pageWidth / 2, 20, { align: 'center' });

    doc.setFontSize(9.5);
    doc.setFont('helvetica', 'normal');
    doc.text(`Tahun Ajaran: ${config.academicYear}   |   Mata Pelajaran: ${config.subjectName}   |   Kelas: ${config.className}`, pageWidth / 2, 26, { align: 'center' });

    const rows = stats.questionAnalyses.map((q) => [
      `No. ${q.number}`,
      q.type.toUpperCase(),
      `${q.maxScore} Poin`,
      `${q.correctCount}`,
      `${q.wrongCount}`,
      `${q.difficultyIndex}`,
      q.difficultyCategory,
      `${q.discriminationIndex ?? 0}`,
      q.discriminationCategory ?? '-',
      q.itemRecommendation ?? 'Diterima',
    ]);

    autoTable(doc, {
      startY: 32,
      head: [['NO', 'TIPE', 'BOBOT', 'BENAR', 'SALAH', 'INDEKS P', 'KESUKARAN', 'DAYA BEDA (D)', 'KATEGORI D', 'REKOMENDASI']],
      body: rows,
      theme: 'grid',
      headStyles: { fillColor: [30, 58, 138], textColor: [255, 255, 255], fontStyle: 'bold', halign: 'center' },
      styles: { fontSize: 7.5, cellPadding: 1.5, halign: 'center' },
      columnStyles: {
        0: { halign: 'center', fontStyle: 'bold' },
        6: { fontStyle: 'bold' },
        9: { fontStyle: 'bold' },
      },
      margin: { left: 8, right: 8 },
    });

    // Summary Box
    const finalY = (doc as any).lastAutoTable ? (doc as any).lastAutoTable.finalY + 8 : 180;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.text('Ringkasan Rekomendasi Bank Soal Madrasah:', 12, finalY);

    const qSummary = stats.qualitySummary || { accepted: 0, revised: 0, rejected: 0, easyCount: 0, mediumCount: 0, hardCount: 0 };
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.text(`• Soal Diterima (Kualitas Baik): ${qSummary.accepted} butir`, 12, finalY + 5);
    doc.text(`• Soal Perlu Revisi (Ditingkatkan): ${qSummary.revised} butir`, 12, finalY + 10);
    doc.text(`• Soal Ditolak / Diganti: ${qSummary.rejected} butir`, 12, finalY + 15);
    doc.text(`• Proporsi Kesukaran: Mudah (${qSummary.easyCount}), Sedang (${qSummary.mediumCount}), Sukar (${qSummary.hardCount})`, 12, finalY + 20);

    // Signatures
    const signY = finalY + 30;
    doc.setFontSize(9);
    doc.text('Mengetahui,', 25, signY);
    doc.text('Kepala Madrasah', 25, signY + 5);
    doc.setFont('helvetica', 'bold');
    doc.text(config.headmasterName, 25, signY + 22);
    doc.line(25, signY + 23, 25 + doc.getTextWidth(config.headmasterName), signY + 23);

    const rightColX = pageWidth - 70;
    doc.setFont('helvetica', 'normal');
    doc.text(formatSignatureDate(config), rightColX, signY);
    doc.text('Guru Pengampu / Tim Evaluasi', rightColX, signY + 5);
    doc.setFont('helvetica', 'bold');
    doc.text(config.teacherName || '...........................................', rightColX, signY + 22);
    doc.line(rightColX, signY + 23, rightColX + doc.getTextWidth(config.teacherName || '...........................................'), signY + 23);

    doc.save(`Rekap_Kualitas_Soal_${config.className}_${config.subjectName}_${Date.now()}.pdf`);
  },

  // 5. Comprehensive Educational Analysis & Statistical Report PDF (A4 Portrait)
  generateFullStatisticalReportPdf(
    config: ExamSheetConfig,
    stats: ExamStatistics,
    aiAnalysis?: AIAnalysisResult | null
  ): void {
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    });

    const pageWidth = doc.internal.pageSize.getWidth();

    // Header
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(13);
    doc.text('LAPORAN STATISTIK & EVALUASI PEDAGOGIS MADRASAH', pageWidth / 2, 15, { align: 'center' });

    doc.setFontSize(11);
    doc.text(`${config.schoolName} | TAHUN AJARAN ${config.academicYear}`, pageWidth / 2, 21, { align: 'center' });

    doc.setFontSize(8.5);
    doc.setFont('helvetica', 'normal');
    doc.text(`Kelas: ${config.className}   |   Mata Pelajaran: ${config.subjectName}   |   KKM: ${config.kkm}   |   Total Siswa: ${stats.totalStudents}`, pageWidth / 2, 27, { align: 'center' });

    // Section 1: Ringkasan Nilai & Metrik
    autoTable(doc, {
      startY: 32,
      head: [['Metrik Evaluasi', 'Nilai', 'Metrik Evaluasi', 'Nilai']],
      body: [
        ['Rata-rata Kelas', `${stats.averageScore} / 100`, 'Persentase Ketuntasan', `${stats.passPercentage}%`],
        ['Nilai Tertinggi', `${stats.highestScore}`, 'Jumlah Siswa Tuntas', `${stats.passedCount} Siswa`],
        ['Nilai Terendah', `${stats.lowestScore}`, 'Jumlah Belum Tuntas (Remedial)', `${stats.failedCount} Siswa`],
        ['Median Nilai', `${stats.medianScore}`, 'Standar Deviasi (Simpangan)', `${stats.standardDeviation}`],
      ],
      theme: 'striped',
      headStyles: { fillColor: [41, 128, 185], textColor: [255, 255, 255], fontStyle: 'bold' },
      styles: { fontSize: 8.5 },
      margin: { left: 12, right: 12 },
    });

    // Section 2: Analisis Butir Soal (Difficulty & Discrimination)
    const tableStartY = (doc as any).lastAutoTable.finalY + 6;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.text('Tabel Analisis Butir Soal & Daya Pembeda', 12, tableStartY);

    const questionRows = stats.questionAnalyses.map((q) => [
      `No. ${q.number} (${q.type.toUpperCase()})`,
      `${q.maxScore} Poin`,
      `${q.correctCount}`,
      `${q.wrongCount}`,
      `${(q.difficultyIndex * 100).toFixed(0)}%`,
      q.difficultyCategory,
      `${q.discriminationIndex ?? 0}`,
      q.discriminationCategory ?? '-',
      q.itemRecommendation ?? 'Diterima',
    ]);

    autoTable(doc, {
      startY: tableStartY + 3,
      head: [['No & Tipe Soal', 'Bobot', 'Benar', 'Salah', 'Indeks P', 'Tingkat Kesukaran', 'Daya Beda (D)', 'Kualitas D', 'Rekomendasi']],
      body: questionRows,
      theme: 'grid',
      headStyles: { fillColor: [52, 73, 94], textColor: [255, 255, 255], fontStyle: 'bold' },
      styles: { fontSize: 7.5, halign: 'center' },
      columnStyles: {
        0: { halign: 'left' },
        5: { fontStyle: 'bold' },
        8: { fontStyle: 'bold' },
      },
      margin: { left: 12, right: 12 },
    });

    // Section 3: Rekomendasi Pedagogis & Remedial
    let recStartY = (doc as any).lastAutoTable.finalY + 6;
    if (recStartY > 220) {
      doc.addPage();
      recStartY = 16;
    }

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.text('Tindak Lanjut Pedagogis & Program Remedial', 12, recStartY);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    let currY = recStartY + 5;

    if (stats.needRemedial.length > 0) {
      doc.setFont('helvetica', 'bold');
      doc.text(`Siswa Memerlukan Remedial (${stats.needRemedial.length} orang):`, 12, currY);
      doc.setFont('helvetica', 'normal');
      currY += 4.5;
      stats.needRemedial.slice(0, 6).forEach((s) => {
        doc.text(`• ${s.name} (Nilai: ${s.score}) - Fokus: ${s.deficientTypes.join(', ')}`, 16, currY);
        currY += 4;
      });
      currY += 2;
    } else {
      doc.text('• Seluruh siswa berhasil mencapai KKM.', 16, currY);
      currY += 5;
    }

    if (aiAnalysis) {
      doc.setFont('helvetica', 'bold');
      doc.text('Rekomendasi Strategi Pengajaran Guru:', 12, currY);
      currY += 4.5;
      doc.setFont('helvetica', 'normal');
      aiAnalysis.recommendations.forEach((rec) => {
        const splitText = doc.splitTextToSize(`• ${rec}`, pageWidth - 28);
        doc.text(splitText, 16, currY);
        currY += splitText.length * 4;
      });
    }

    doc.save(`Laporan_Statistik_Pedagogis_${config.className}_${config.subjectName}_${Date.now()}.pdf`);
  },
};

