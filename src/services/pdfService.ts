import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { AIAnalysisResult, ExamSheetConfig, ExamStatistics, QuestionAnalysis, StudentScoreRow } from '../types';

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

    doc.setFontSize(13);
    doc.text(config.schoolName.toUpperCase(), pageWidth / 2, 20, { align: 'center' });

    doc.setFontSize(11);
    doc.text(config.academicYear.toUpperCase(), pageWidth / 2, 26, { align: 'center' });

    // Meta row (Kelas, Fan, KKM)
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text(`KELAS : ${config.className}`, 14, 33);
    doc.text(`FAN : ${config.subjectName}`, 70, 33);
    doc.text(`KKM : ${config.kkm}`, 140, 33);

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
        content: `PILIHAN GANDA (POINT PER NOMOR ${pgQuestions[0]?.maxScore || 5})`,
        colSpan: pgQuestions.length,
        styles: { halign: 'center', fillColor: [219, 234, 254], textColor: [17, 24, 39] }, // Light blue
      });
    }

    if (isianQuestions.length > 0) {
      headRow1.push({
        content: `ISIAN (POIN PER NOMOR ${isianQuestions[0]?.maxScore || 6})`,
        colSpan: isianQuestions.length,
        styles: { halign: 'center', fillColor: [243, 232, 255], textColor: [17, 24, 39] }, // Light purple
      });
    }

    if (uraianQuestions.length > 0) {
      headRow1.push({
        content: `URAIAN (POIN PER NOMOR ${uraianQuestions[0]?.maxScore || 7})`,
        colSpan: uraianQuestions.length,
        styles: { halign: 'center', fillColor: [220, 252, 231], textColor: [17, 24, 39] }, // Light green
      });
    }

    headRow1.push(
      { content: 'JUMLAH\nSOAL\nBENAR', rowSpan: 2, styles: { halign: 'center', valign: 'middle' } },
      { content: 'JUMLAH\nSOAL\nSALAH', rowSpan: 2, styles: { halign: 'center', valign: 'middle' } },
      { content: 'NILAI', rowSpan: 2, styles: { halign: 'center', valign: 'middle' } }
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
        if (q.type === 'pg') cellBg = [240, 247, 255];
        else if (q.type === 'isian') cellBg = [250, 245, 255];
        else if (q.type === 'uraian') cellBg = [240, 253, 244];

        rowArr.push({
          content: score > 0 ? String(score) : '0',
          styles: { halign: 'center', fillColor: cellBg },
        });
      }

      rowArr.push(
        { content: String(r.correctQuestionsCount), styles: { halign: 'center' } },
        { content: String(r.wrongQuestionsCount), styles: { halign: 'center' } },
        { content: String(r.totalScore), styles: { halign: 'center', fontStyle: 'bold' } }
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

    summaryBenarRow.push({ content: '', colSpan: 3 });
    summarySalahRow.push({ content: '', colSpan: 3 });

    bodyRows.push(summaryBenarRow as any);
    bodyRows.push(summarySalahRow as any);

    // Render table
    autoTable(doc, {
      startY: 36,
      head: [headRow1, headRow2],
      body: bodyRows,
      theme: 'grid',
      styles: {
        fontSize: 8,
        cellPadding: 1.5,
        lineColor: [100, 100, 100],
        lineWidth: 0.2,
        textColor: [20, 20, 20],
      },
      headStyles: {
        textColor: [0, 0, 0],
        lineColor: [80, 80, 80],
        lineWidth: 0.3,
        fontStyle: 'bold',
      },
      margin: { left: 10, right: 10 },
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
    const rightColX = pageWidth - 70;
    doc.setFont('helvetica', 'normal');
    doc.text(`${config.dateLocation}, ............. ${config.dateHijri}`, rightColX, signY);
    doc.text('Wali Kelas / Guru Pengampu', rightColX, signY + 5);

    doc.setFont('helvetica', 'bold');
    doc.text(config.teacherName, rightColX, signY + 22);
    doc.line(rightColX, signY + 23, rightColX + doc.getTextWidth(config.teacherName), signY + 23);

    doc.save(`Lembar_Analisa_${config.className}_${config.subjectName}_${Date.now()}.pdf`);
  },

  // 2. Comprehensive Educational Analysis & Statistical Report PDF (A4 Portrait)
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
    doc.setFontSize(14);
    doc.text('LAPORAN STATISTIK & EVALUASI HASIL UJIAN', pageWidth / 2, 16, { align: 'center' });

    doc.setFontSize(11);
    doc.text(`${config.schoolName} | TAHUN AJARAN ${config.academicYear}`, pageWidth / 2, 22, { align: 'center' });

    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text(`Kelas: ${config.className}   |   Mata Pelajaran: ${config.subjectName}   |   KKM: ${config.kkm}   |   Total Siswa: ${stats.totalStudents}`, pageWidth / 2, 28, { align: 'center' });

    // Section 1: Ringkasan Nilai & Metrik
    autoTable(doc, {
      startY: 33,
      head: [['Metrik Evaluasi', 'Nilai', 'Metrik Evaluasi', 'Nilai']],
      body: [
        ['Rata-rata Kelas', `${stats.averageScore} / 100`, 'Persentase Ketuntasan', `${stats.passPercentage}%`],
        ['Nilai Tertinggi', `${stats.highestScore}`, 'Jumlah Siswa Tuntas', `${stats.passedCount} Siswa`],
        ['Nilai Terendah', `${stats.lowestScore}`, 'Jumlah Belum Tuntas', `${stats.failedCount} Siswa`],
        ['Median Nilai', `${stats.medianScore}`, 'Standar Deviasi', `${stats.standardDeviation}`],
      ],
      theme: 'striped',
      headStyles: { fillColor: [41, 128, 185], textColor: [255, 255, 255], fontStyle: 'bold' },
      styles: { fontSize: 9 },
      margin: { left: 14, right: 14 },
    });

    // Section 2: Analisis Butir Soal (Difficulty & Discrimination)
    const tableStartY = (doc as any).lastAutoTable.finalY + 8;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.text('Tabel Analisis Butir Soal (Tingkat Kesukaran & Daya Pembeda)', 14, tableStartY);

    const questionRows = stats.questionAnalyses.map((q) => [
      `No. ${q.number} (${q.type.toUpperCase()})`,
      `${q.maxScore} Poin`,
      `${q.correctCount}`,
      `${q.wrongCount}`,
      `${(q.difficultyIndex * 100).toFixed(0)}%`,
      q.difficultyCategory,
      `${q.discriminationIndex ?? 0}`,
      q.discriminationCategory ?? '-',
    ]);

    autoTable(doc, {
      startY: tableStartY + 3,
      head: [['No & Tipe Soal', 'Bobot', 'Benar', 'Salah', 'Indeks P', 'Kategori Kesukaran', 'Daya Pembeda (D)', 'Kualitas']],
      body: questionRows,
      theme: 'grid',
      headStyles: { fillColor: [52, 73, 94], textColor: [255, 255, 255], fontStyle: 'bold' },
      styles: { fontSize: 8, halign: 'center' },
      columnStyles: {
        0: { halign: 'left' },
        5: { fontStyle: 'bold' },
      },
      margin: { left: 14, right: 14 },
    });

    // Section 3: Rekomendasi Pedagogis & Remedial
    let recStartY = (doc as any).lastAutoTable.finalY + 8;
    if (recStartY > 220) {
      doc.addPage();
      recStartY = 16;
    }

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.text('Tindak Lanjut & Rekomendasi Guru', 14, recStartY);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    let currY = recStartY + 6;

    if (stats.needRemedial.length > 0) {
      doc.setFont('helvetica', 'bold');
      doc.text(`Siswa Memerlukan Remedial (${stats.needRemedial.length} orang):`, 14, currY);
      doc.setFont('helvetica', 'normal');
      currY += 5;
      stats.needRemedial.forEach((s) => {
        doc.text(`• ${s.name} (Nilai: ${s.score}) - Fokus: ${s.deficientTypes.join(', ')}`, 18, currY);
        currY += 4.5;
      });
      currY += 3;
    } else {
      doc.text('• Seluruh siswa berhasil mencapai KKM.', 18, currY);
      currY += 6;
    }

    if (aiAnalysis) {
      doc.setFont('helvetica', 'bold');
      doc.text('Rekomendasi Strategi Pembelajaran (AI & Analisis Otomatis):', 14, currY);
      currY += 5;
      doc.setFont('helvetica', 'normal');
      aiAnalysis.recommendations.forEach((rec) => {
        const splitText = doc.splitTextToSize(`• ${rec}`, pageWidth - 32);
        doc.text(splitText, 18, currY);
        currY += splitText.length * 4.5;
      });
    }

    doc.save(`Laporan_Statistik_Ujian_${config.className}_${config.subjectName}_${Date.now()}.pdf`);
  },
};
