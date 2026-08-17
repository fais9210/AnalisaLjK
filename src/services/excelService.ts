import * as XLSX from 'xlsx';
import { ExamSheetConfig, QuestionAnalysis, Student, StudentScoreRow, Teacher } from '../types';
import { normalizeClassName } from './analysisEngine';

export const ExcelService = {
  // Export Lembar Analisa to XLSX
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
      ['', 'Mengetahui,', '', '', '', '', '', '', '', '', `${config.dateLocation}, ............. ${config.dateHijri}`],
      ['', 'Kepala Madrasah', '', '', '', '', '', '', '', '', 'Wali Kelas / Guru Pengampu'],
      [],
      [],
      ['', config.headmasterName, '', '', '', '', '', '', '', '', config.teacherName],
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
