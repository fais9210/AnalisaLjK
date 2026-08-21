import * as XLSX from 'xlsx';
import { ExamSheetConfig, ExamStatistics, QuestionAnalysis, Student, StudentScoreRow, Teacher } from '../types';
import { normalizeClassName, formatSignatureDate } from './analysisEngine';

export const ExcelService = {
  // Export Comprehensive Multi-Sheet Excel Report
  exportComprehensiveReportToExcel(
    config: ExamSheetConfig,
    rows: StudentScoreRow[],
    stats: ExamStatistics,
    questionAnalyses: QuestionAnalysis[]
  ): void {
    const wb = XLSX.utils.book_new();

    // ==========================================
    // SHEET 1: LEMBAR ANALISIS NILAI UTAMA
    // ==========================================
    const headerRows = [
      [config.title],
      [config.schoolName],
      [config.academicYear],
      [],
      [`KELAS : ${config.className}`, '', '', `FAN / MAPEL : ${config.subjectName}`, '', '', `KKM : ${config.kkm}`],
      [],
    ];

    const pgQuestions = config.questions.filter((q) => q.type === 'pg');
    const isianQuestions = config.questions.filter((q) => q.type === 'isian');
    const uraianQuestions = config.questions.filter((q) => q.type === 'uraian');

    const subHeader1: string[] = ['NO', 'NAMA MURID'];
    const subHeader2: string[] = ['', ''];

    if (pgQuestions.length > 0) {
      subHeader1.push(`PILIHAN GANDA (POIN ${pgQuestions[0]?.maxScore || 5})`);
      for (let i = 1; i < pgQuestions.length; i++) subHeader1.push('');
      for (const q of pgQuestions) subHeader2.push(String(q.number));
    }

    if (isianQuestions.length > 0) {
      subHeader1.push(`ISIAN (POIN ${isianQuestions[0]?.maxScore || 6})`);
      for (let i = 1; i < isianQuestions.length; i++) subHeader1.push('');
      for (const q of isianQuestions) subHeader2.push(String(q.number));
    }

    if (uraianQuestions.length > 0) {
      subHeader1.push(`URAIAN (POIN ${uraianQuestions[0]?.maxScore || 7})`);
      for (let i = 1; i < uraianQuestions.length; i++) subHeader1.push('');
      for (const q of uraianQuestions) subHeader2.push(String(q.number));
    }

    subHeader1.push('JML BENAR', 'JML SALAH', 'NILAI AKHIR', 'STATUS KETUNTASAN');
    subHeader2.push('', '', '', '');

    const dataRows = rows.map((r, idx) => {
      const rowArr: any[] = [idx + 1, r.studentName];
      for (const q of config.questions) {
        rowArr.push(r.scores[q.id] !== undefined ? r.scores[q.id] : 0);
      }
      rowArr.push(r.correctQuestionsCount, r.wrongQuestionsCount, r.totalScore, r.isPassed ? 'TUNTAS' : 'REMEDIAL');
      return rowArr;
    });

    const summaryBenarRow: any[] = ['', 'JUMLAH JAWABAN BENAR'];
    const summarySalahRow: any[] = ['', 'JUMLAH JAWABAN SALAH'];
    const summaryTingkatRow: any[] = ['', 'TINGKAT KESUKARAN (P)'];
    const summaryDayaBedaRow: any[] = ['', 'DAYA PEMBEDA (D)'];

    for (const q of config.questions) {
      const qa = questionAnalyses.find((a) => a.questionId === q.id);
      summaryBenarRow.push(qa ? qa.correctCount : 0);
      summarySalahRow.push(qa ? qa.wrongCount : 0);
      summaryTingkatRow.push(qa ? `${qa.difficultyCategory} (${qa.difficultyIndex})` : '-');
      summaryDayaBedaRow.push(qa ? `${qa.discriminationCategory} (${qa.discriminationIndex})` : '-');
    }
    summaryBenarRow.push('', '', '', '');
    summarySalahRow.push('', '', '', '');
    summaryTingkatRow.push('', '', '', '');
    summaryDayaBedaRow.push('', '', '', '');

    const signatureRows = [
      [],
      ['', 'Mengetahui,', '', '', '', '', '', '', '', '', formatSignatureDate(config)],
      ['', 'Kepala Madrasah', '', '', '', '', '', '', '', '', 'Wali Kelas / Guru Pengampu'],
      [],
      [],
      ['', config.headmasterName, '', '', '', '', '', '', '', '', config.teacherName || '...........................................'],
    ];

    const allSheetData = [
      ...headerRows,
      subHeader1,
      subHeader2,
      ...dataRows,
      [],
      summaryBenarRow,
      summarySalahRow,
      summaryTingkatRow,
      summaryDayaBedaRow,
      ...signatureRows,
    ];

    const ws1 = XLSX.utils.aoa_to_sheet(allSheetData);
    ws1['!cols'] = [
      { wch: 5 },
      { wch: 28 },
      ...config.questions.map(() => ({ wch: 6 })),
      { wch: 14 },
      { wch: 14 },
      { wch: 12 },
      { wch: 18 },
    ];
    XLSX.utils.book_append_sheet(wb, ws1, 'Lembar_Analisa_Nilai');

    // ==========================================
    // SHEET 2: ANALISIS BUTIR SOAL
    // ==========================================
    const itemAnalysisHeaders = [
      ['ANALISIS KUALITAS BUTIR SOAL UJIAN'],
      [`Mata Pelajaran: ${config.subjectName} | Kelas: ${config.className} | Tahun Ajaran: ${config.academicYear}`],
      [],
      ['NO SOAL', 'TIPE SOAL', 'BOBOT MAKS', 'JUMLAH BENAR', 'JUMLAH SALAH', 'INDEKS KESUKARAN (P)', 'KATEGORI KESUKARAN', 'DAYA PEMBEDA (D)', 'KATEGORI DAYA BEDA', 'REKOMENDASI SOAL'],
    ];

    const itemAnalysisRows = questionAnalyses.map((q) => [
      `Soal No. ${q.number}`,
      q.type.toUpperCase(),
      q.maxScore,
      q.correctCount,
      q.wrongCount,
      q.difficultyIndex,
      q.difficultyCategory,
      q.discriminationIndex ?? 0,
      q.discriminationCategory ?? '-',
      q.itemRecommendation ?? 'Diterima',
    ]);

    const ws2 = XLSX.utils.aoa_to_sheet([...itemAnalysisHeaders, ...itemAnalysisRows]);
    ws2['!cols'] = [
      { wch: 14 },
      { wch: 12 },
      { wch: 12 },
      { wch: 14 },
      { wch: 14 },
      { wch: 22 },
      { wch: 20 },
      { wch: 18 },
      { wch: 22 },
      { wch: 22 },
    ];
    XLSX.utils.book_append_sheet(wb, ws2, 'Analisis_Butir_Soal');

    // ==========================================
    // SHEET 3: PROGRAM REMEDIAL
    // ==========================================
    const remedialHeaders = [
      ['PROGRAM & PELAKSANAAN REMEDIAL (PERBAIKAN PEMBELAJARAN)'],
      [`Madrasah: ${config.schoolName} | Mapel: ${config.subjectName} | Kelas: ${config.className} | KKM: ${config.kkm}`],
      [],
      ['NO', 'NAMA SISWA', 'NILAI AWAL', 'BUTIR SOAL BERMASALAH', 'BENTUK PELAKSANAAN REMEDIAL', 'NILAI AKHIR REMEDIAL', 'STATUS'],
    ];

    const remedialData = (stats.remedialDetails || []).map((s, idx) => [
      idx + 1,
      s.name,
      s.score,
      s.wrongQuestionNumbers.length > 0 ? `No. ${s.wrongQuestionNumbers.join(', ')}` : 'Konsep Dasar',
      s.suggestedAction,
      '',
      'TUNTAS',
    ]);

    const ws3 = XLSX.utils.aoa_to_sheet([...remedialHeaders, ...(remedialData.length > 0 ? remedialData : [['-', 'Semua Siswa Telah Tuntas', '-', '-', '-', '-', 'TUNTAS']])]);
    ws3['!cols'] = [
      { wch: 6 },
      { wch: 28 },
      { wch: 12 },
      { wch: 30 },
      { wch: 45 },
      { wch: 20 },
      { wch: 12 },
    ];
    XLSX.utils.book_append_sheet(wb, ws3, 'Program_Remedial');

    // ==========================================
    // SHEET 4: PROGRAM PENGAYAAN
    // ==========================================
    const enrichmentHeaders = [
      ['PROGRAM PENGAYAAN SISWA BERPRESTASI'],
      [`Madrasah: ${config.schoolName} | Mapel: ${config.subjectName} | Kelas: ${config.className} | KKM: ${config.kkm}`],
      [],
      ['NO', 'NAMA SISWA', 'NILAI AWAL', 'BENTUK KEGIATAN PENGAYAAN', 'METODE', 'STATUS'],
    ];

    const enrichmentData = (stats.enrichmentDetails || []).map((s, idx) => [
      idx + 1,
      s.name,
      s.score,
      s.suggestedActivity,
      'Mandiri / Tutor Sebaya',
      'Terlaksana',
    ]);

    const ws4 = XLSX.utils.aoa_to_sheet([...enrichmentHeaders, ...(enrichmentData.length > 0 ? enrichmentData : [['-', 'Belum ada data', '-', '-', '-', '-']])]);
    ws4['!cols'] = [
      { wch: 6 },
      { wch: 28 },
      { wch: 12 },
      { wch: 50 },
      { wch: 25 },
      { wch: 15 },
    ];
    XLSX.utils.book_append_sheet(wb, ws4, 'Program_Pengayaan');

    // ==========================================
    // SHEET 5: REKAPITULASI STATISTIK
    // ==========================================
    const statsData = [
      ['REKAPITULASI STATISTIK HASIL EVALUASI PEMBELAJARAN'],
      [`Madrasah: ${config.schoolName} | Tahun: ${config.academicYear} | Kelas: ${config.className} | Mapel: ${config.subjectName}`],
      [],
      ['PARAMETER STATISTIK', 'NILAI / HASIL', 'KETERANGAN'],
      ['Jumlah Total Siswa', stats.totalStudents, 'Orang'],
      ['Rata-rata Nilai Kelas', stats.averageScore, 'Skala 0-100'],
      ['Nilai Tertinggi', stats.highestScore, 'Skor Tertinggi'],
      ['Nilai Terendah', stats.lowestScore, 'Skor Terendah'],
      ['Median (Nilai Tengah)', stats.medianScore, 'Skor Tengah'],
      ['Standar Deviasi', stats.standardDeviation, 'Tingkat Persebaran Nilai'],
      ['Siswa Tuntas (>= KKM)', stats.passedCount, `Persentase: ${stats.passPercentage}%`],
      ['Siswa Belum Tuntas (< KKM)', stats.failedCount, 'Perlu Remedial'],
      [],
      ['DISTRIBUSI PREDIKAT NILAI', 'JUMLAH SISWA', 'PERSENTASE'],
      ['Sangat Baik (Grade A >= 85)', stats.gradeDistribution.gradeA, `${stats.totalStudents > 0 ? ((stats.gradeDistribution.gradeA / stats.totalStudents) * 100).toFixed(1) : 0}%`],
      ['Baik (Grade B 75 - 84)', stats.gradeDistribution.gradeB, `${stats.totalStudents > 0 ? ((stats.gradeDistribution.gradeB / stats.totalStudents) * 100).toFixed(1) : 0}%`],
      ['Cukup (Grade C KKM - 74)', stats.gradeDistribution.gradeC, `${stats.totalStudents > 0 ? ((stats.gradeDistribution.gradeC / stats.totalStudents) * 100).toFixed(1) : 0}%`],
      ['Kurang / Remedial (Grade D < KKM)', stats.gradeDistribution.gradeD, `${stats.totalStudents > 0 ? ((stats.gradeDistribution.gradeD / stats.totalStudents) * 100).toFixed(1) : 0}%`],
    ];

    const ws5 = XLSX.utils.aoa_to_sheet(statsData);
    ws5['!cols'] = [
      { wch: 35 },
      { wch: 20 },
      { wch: 30 },
    ];
    XLSX.utils.book_append_sheet(wb, ws5, 'Rekap_Statistik');

    const fileName = `Paket_Lengkap_Analisis_Ujian_${config.className}_${config.subjectName}_${Date.now()}.xlsx`;
    XLSX.writeFile(wb, fileName);
  },

  // Export Lembar Analisa to XLSX (Legacy single sheet)
  exportExamSheetToExcel(
    config: ExamSheetConfig,
    rows: StudentScoreRow[],
    questionAnalyses: QuestionAnalysis[]
  ): void {
    const wb = XLSX.utils.book_new();

    // 1. Header rows
    const headerRows = [
      [config.title],
      [config.schoolName],
      [config.academicYear],
      [],
      [`KELAS : ${config.className}`, '', '', `FAN : ${config.subjectName}`, '', '', `KKM : ${config.kkm}`],
      [],
    ];

    // Build question columns headers
    const pgQuestions = config.questions.filter((q) => q.type === 'pg');
    const isianQuestions = config.questions.filter((q) => q.type === 'isian');
    const uraianQuestions = config.questions.filter((q) => q.type === 'uraian');

    const subHeader1: string[] = ['NO', 'NAMA MURID'];
    const subHeader2: string[] = ['', ''];

    // PG Group
    if (pgQuestions.length > 0) {
      subHeader1.push(`PILIHAN GANDA (POINT PER NOMOR ${pgQuestions[0]?.maxScore || 5})`);
      for (let i = 1; i < pgQuestions.length; i++) subHeader1.push('');
      for (const q of pgQuestions) subHeader2.push(String(q.number));
    }

    // Isian Group
    if (isianQuestions.length > 0) {
      subHeader1.push(`ISIAN (POIN PER NOMOR ${isianQuestions[0]?.maxScore || 6})`);
      for (let i = 1; i < isianQuestions.length; i++) subHeader1.push('');
      for (const q of isianQuestions) subHeader2.push(String(q.number));
    }

    // Uraian Group
    if (uraianQuestions.length > 0) {
      subHeader1.push(`URAIAN (POIN PER NOMOR ${uraianQuestions[0]?.maxScore || 7})`);
      for (let i = 1; i < uraianQuestions.length; i++) subHeader1.push('');
      for (const q of uraianQuestions) subHeader2.push(String(q.number));
    }

    subHeader1.push('JUMLAH SOAL BENAR', 'JUMLAH SOAL SALAH', 'NILAI', 'STATUS');
    subHeader2.push('', '', '', '');

    // Student score data rows
    const dataRows = rows.map((r, idx) => {
      const rowArr: any[] = [idx + 1, r.studentName];
      for (const q of config.questions) {
        rowArr.push(r.scores[q.id] !== undefined ? r.scores[q.id] : 0);
      }
      rowArr.push(r.correctQuestionsCount, r.wrongQuestionsCount, r.totalScore, r.isPassed ? 'TUNTAS' : 'BELUM');
      return rowArr;
    });

    // Summary rows
    const summaryBenarRow: any[] = ['', 'JUMLAH JAWABAN BENAR'];
    const summarySalahRow: any[] = ['', 'JUMLAH JAWABAN SALAH'];
    const summaryTingkatRow: any[] = ['', 'TINGKAT KESUKARAN'];

    for (const q of config.questions) {
      const qa = questionAnalyses.find((a) => a.questionId === q.id);
      summaryBenarRow.push(qa ? qa.correctCount : 0);
      summarySalahRow.push(qa ? qa.wrongCount : 0);
      summaryTingkatRow.push(qa ? `${qa.difficultyCategory} (${qa.difficultyIndex})` : '-');
    }
    summaryBenarRow.push('', '', '', '');
    summarySalahRow.push('', '', '', '');
    summaryTingkatRow.push('', '', '', '');

    // Signature rows
    const signatureRows = [
      [],
      ['', 'Mengetahui,', '', '', '', '', '', '', '', '', formatSignatureDate(config)],
      ['', 'Kepala Madrasah', '', '', '', '', '', '', '', '', 'Wali Kelas / Guru Pengampu'],
      [],
      [],
      ['', config.headmasterName, '', '', '', '', '', '', '', '', config.teacherName || '...........................................'],
    ];

    const allSheetData = [
      ...headerRows,
      subHeader1,
      subHeader2,
      ...dataRows,
      [],
      summaryBenarRow,
      summarySalahRow,
      summaryTingkatRow,
      ...signatureRows,
    ];

    const ws = XLSX.utils.aoa_to_sheet(allSheetData);

    // Set auto column width
    ws['!cols'] = [
      { wch: 5 },  // NO
      { wch: 28 }, // NAMA MURID
      ...config.questions.map(() => ({ wch: 6 })),
      { wch: 18 }, // Benar
      { wch: 18 }, // Salah
      { wch: 10 }, // Nilai
      { wch: 12 }, // Status
    ];

    XLSX.utils.book_append_sheet(wb, ws, `Analisa_${config.className}_${config.subjectName}`);

    const fileName = `Analisa_Hasil_Ujian_Kelas_${config.className}_${config.subjectName}_${Date.now()}.xlsx`;
    XLSX.writeFile(wb, fileName);
  },

  // Export Data Siswa
  exportStudentsToExcel(students: Student[]): void {
    const wsData = students.map((s, idx) => ({
      No: idx + 1,
      NIS: s.nis,
      'Nama Lengkap': s.name,
      'Jenis Kelamin (L/P)': s.gender,
      Kelas: s.className,
      'No Telepon': s.phone || '',
      Status: s.active ? 'Aktif' : 'Non-Aktif',
    }));

    const ws = XLSX.utils.json_to_sheet(wsData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Data_Siswa');
    XLSX.writeFile(wb, `Data_Siswa_${Date.now()}.xlsx`);
  },

  // Export Data Guru
  exportTeachersToExcel(teachers: Teacher[]): void {
    const wsData = teachers.map((t, idx) => ({
      No: idx + 1,
      NIP: t.nip,
      'Nama Guru': t.name,
      Jabatan: t.role,
      'Mata Pelajaran': t.subject || '',
      'Wali Kelas': t.assignedClass || '',
      'No Telepon': t.phone || '',
    }));

    const ws = XLSX.utils.json_to_sheet(wsData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Data_Guru');
    XLSX.writeFile(wb, `Data_Guru_${Date.now()}.xlsx`);
  },

  // Download Templates
  downloadTemplate(type: 'students' | 'teachers' | 'scores', config?: ExamSheetConfig): void {
    const wb = XLSX.utils.book_new();

    if (type === 'students') {
      const template = [
        { NIS: '20240101', 'Nama Lengkap': 'AHMAD FAUZAN', 'Jenis Kelamin (L/P)': 'L', Kelas: 'I - SATU', 'No Telepon': '08123456789' },
        { NIS: '20240102', 'Nama Lengkap': 'FATIMAH AZ-ZAHRA', 'Jenis Kelamin (L/P)': 'P', Kelas: 'I - SATU', 'No Telepon': '08123456780' },
        { NIS: '20240103', 'Nama Lengkap': 'MUHAMMAD ILHAM', 'Jenis Kelamin (L/P)': 'L', Kelas: 'II - DUA', 'No Telepon': '' },
      ];
      const ws = XLSX.utils.json_to_sheet(template);
      XLSX.utils.book_append_sheet(wb, ws, 'Template_Siswa');
      XLSX.writeFile(wb, 'Template_Import_Siswa.xlsx');
    } else if (type === 'teachers') {
      const template = [
        { NIP: '198501012010011001', 'Nama Guru': "M. MAS'UD", Jabatan: 'Kepala Madrasah', 'Mata Pelajaran': '', 'Wali Kelas': '', 'No Telepon': '08123456789' },
        { NIP: '199203152019031002', 'Nama Guru': 'Ust. Faishol', Jabatan: 'Wali Kelas', 'Mata Pelajaran': 'FIQIH', 'Wali Kelas': 'I - SATU', 'No Telepon': '08139876543' },
      ];
      const ws = XLSX.utils.json_to_sheet(template);
      XLSX.utils.book_append_sheet(wb, ws, 'Template_Guru');
      XLSX.writeFile(wb, 'Template_Import_Guru.xlsx');
    } else if (type === 'scores' && config) {
      const templateHeaders: Record<string, any> = {
        'Nama Siswa': 'JAMALUDDIN HIDAYAH',
        Kelas: config.className,
      };
      config.questions.forEach((q) => {
        templateHeaders[`${q.label} (Max ${q.maxScore})`] = q.maxScore;
      });
      const ws = XLSX.utils.json_to_sheet([templateHeaders]);
      XLSX.utils.book_append_sheet(wb, ws, 'Template_Nilai');
      XLSX.writeFile(wb, `Template_Import_Nilai_${config.subjectName}.xlsx`);
    }
  },

  // Parse Student File (CSV or Excel)
  async parseStudentsFile(file: File): Promise<Student[]> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target?.result as ArrayBuffer);
          const workbook = XLSX.read(data, { type: 'array' });
          const firstSheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[firstSheetName];
          const rawRows: any[] = XLSX.utils.sheet_to_json(worksheet);

          const parsedStudents: Student[] = [];
          for (let i = 0; i < rawRows.length; i++) {
            const r = rawRows[i];
            const name = r['Nama Lengkap'] || r['Nama'] || r['nama'] || r['NAME'] || r['nama_lengkap'];
            const nis = String(r['NIS'] || r['nis'] || r['Nomor Induk'] || `2024${String(i + 1).padStart(4, '0')}`);
            const genderRaw = String(r['Jenis Kelamin (L/P)'] || r['Jenis Kelamin'] || r['JK'] || r['gender'] || 'L').toUpperCase();
            const gender: 'L' | 'P' = genderRaw.startsWith('P') || genderRaw.startsWith('W') ? 'P' : 'L';
            const classNameRaw = String(r['Kelas'] || r['kelas'] || r['Class'] || 'I - SATU').trim();
            const className = normalizeClassName(classNameRaw);
            const phone = r['No Telepon'] || r['Telepon'] || r['phone'] || '';

            if (name) {
              parsedStudents.push({
                id: `std-imp-${Date.now()}-${i}`,
                nis,
                name: String(name).trim().toUpperCase(),
                gender,
                className,
                phone: String(phone),
                active: true,
              });
            }
          }

          resolve(parsedStudents);
        } catch (err) {
          reject(err);
        }
      };
      reader.onerror = (error) => reject(error);
      reader.readAsArrayBuffer(file);
    });
  },

  // Parse Teacher File (CSV or Excel)
  async parseTeachersFile(file: File): Promise<Teacher[]> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target?.result as ArrayBuffer);
          const workbook = XLSX.read(data, { type: 'array' });
          const firstSheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[firstSheetName];
          const rawRows: any[] = XLSX.utils.sheet_to_json(worksheet);

          const parsedTeachers: Teacher[] = [];
          for (let i = 0; i < rawRows.length; i++) {
            const r = rawRows[i];
            const name = r['Nama Guru'] || r['Nama'] || r['nama'] || r['NAME'];
            const nip = String(r['NIP'] || r['nip'] || r['ID'] || `1990${String(i + 1).padStart(6, '0')}`);
            const role = (r['Jabatan'] || r['role'] || 'Guru Pengampu') as any;
            const subject = r['Mata Pelajaran'] || r['Mapel'] || '';
            const assignedClassRaw = r['Wali Kelas'] || r['Kelas'] || '';
            const assignedClass = assignedClassRaw ? normalizeClassName(String(assignedClassRaw)) : '';
            const phone = r['No Telepon'] || r['phone'] || '';

            if (name) {
              parsedTeachers.push({
                id: `tch-imp-${Date.now()}-${i}`,
                nip,
                name: String(name).trim(),
                role,
                subject: String(subject),
                assignedClass: String(assignedClass),
                phone: String(phone),
              });
            }
          }

          resolve(parsedTeachers);
        } catch (err) {
          reject(err);
        }
      };
      reader.onerror = (error) => reject(error);
      reader.readAsArrayBuffer(file);
    });
  },
};

