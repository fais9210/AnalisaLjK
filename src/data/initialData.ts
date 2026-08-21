import { ClassGroup, ExamSheetConfig, QuestionDefinition, Student, Subject, Teacher } from '../types';

export const DEFAULT_QUESTIONS: QuestionDefinition[] = [
  // Pilihan Ganda (7 nomor, 5 poin per nomor = 35)
  { id: 'pg_1', number: 1, type: 'pg', maxScore: 5, label: 'PG 1' },
  { id: 'pg_2', number: 2, type: 'pg', maxScore: 5, label: 'PG 2' },
  { id: 'pg_3', number: 3, type: 'pg', maxScore: 5, label: 'PG 3' },
  { id: 'pg_4', number: 4, type: 'pg', maxScore: 5, label: 'PG 4' },
  { id: 'pg_5', number: 5, type: 'pg', maxScore: 5, label: 'PG 5' },
  { id: 'pg_6', number: 6, type: 'pg', maxScore: 5, label: 'PG 6' },
  { id: 'pg_7', number: 7, type: 'pg', maxScore: 5, label: 'PG 7' },

  // Isian (5 nomor, 6 poin per nomor = 30)
  { id: 'is_1', number: 1, type: 'isian', maxScore: 6, label: 'Isian 1' },
  { id: 'is_2', number: 2, type: 'isian', maxScore: 6, label: 'Isian 2' },
  { id: 'is_3', number: 3, type: 'isian', maxScore: 6, label: 'Isian 3' },
  { id: 'is_4', number: 4, type: 'isian', maxScore: 6, label: 'Isian 4' },
  { id: 'is_5', number: 5, type: 'isian', maxScore: 6, label: 'Isian 5' },

  // Uraian (5 nomor, 7 poin per nomor = 35)
  { id: 'ur_1', number: 1, type: 'uraian', maxScore: 7, label: 'Uraian 1' },
  { id: 'ur_2', number: 2, type: 'uraian', maxScore: 7, label: 'Uraian 2' },
  { id: 'ur_3', number: 3, type: 'uraian', maxScore: 7, label: 'Uraian 3' },
  { id: 'ur_4', number: 4, type: 'uraian', maxScore: 7, label: 'Uraian 4' },
  { id: 'ur_5', number: 5, type: 'uraian', maxScore: 7, label: 'Uraian 5' },
];

export const INITIAL_CLASSES: ClassGroup[] = [
  { id: 'cls-1', name: 'I - SATU', level: 'Ibtidaiyah / Dasar', academicYear: '1447-1448 H', waliKelasName: '' },
  { id: 'cls-2', name: 'II - DUA', level: 'Ibtidaiyah / Dasar', academicYear: '1447-1448 H', waliKelasName: '' },
  { id: 'cls-3', name: 'III - TIGA', level: 'Ibtidaiyah / Dasar', academicYear: '1447-1448 H', waliKelasName: '' },
  { id: 'cls-4', name: 'IV - EMPAT', level: 'Ibtidaiyah / Dasar', academicYear: '1447-1448 H', waliKelasName: '' },
  { id: 'cls-5', name: 'V - LIMA', level: 'Ibtidaiyah / Dasar', academicYear: '1447-1448 H', waliKelasName: '' },
  { id: 'cls-6', name: 'VI - ENAM', level: 'Ibtidaiyah / Dasar', academicYear: '1447-1448 H', waliKelasName: '' },
];

export const INITIAL_SUBJECTS: Subject[] = [
  { id: 'sbj-1', code: 'FQH', name: 'FIQIH', kkm: 70, category: 'Syari\'ah' },
  { id: 'sbj-2', code: 'AQD', name: 'AQIDAH AKHLAK', kkm: 75, category: 'Ushuluddin' },
  { id: 'sbj-3', code: 'NHW', name: 'NAHWU', kkm: 68, category: 'Lughah' },
  { id: 'sbj-4', code: 'SRF', name: 'SHOROF', kkm: 68, category: 'Lughah' },
  { id: 'sbj-5', code: 'TRK', name: 'TARIKH ISLAM', kkm: 70, category: 'Sejarah' },
  { id: 'sbj-6', code: 'BAR', name: 'BAHASA ARAB', kkm: 70, category: 'Lughah' },
  { id: 'sbj-7', code: 'MTK', name: 'MATEMATIKA', kkm: 70, category: 'Umum' },
];

export const INITIAL_STUDENTS: Student[] = [
  // Kelas I - SATU (sesuai contoh gambar)
  { id: 'std-01', nis: '20240101', name: 'JAMALUDDIN HIDAYAH', gender: 'L', className: 'I - SATU', active: true },
  { id: 'std-02', nis: '20240102', name: 'M. ALI MUSTOFA', gender: 'L', className: 'I - SATU', active: true },
  { id: 'std-03', nis: '20240103', name: 'M. NAJIB FASYA', gender: 'L', className: 'I - SATU', active: true },
  { id: 'std-04', nis: '20240104', name: 'MUHAMMAD ABIDZAR MUSTOFA', gender: 'L', className: 'I - SATU', active: true },
  { id: 'std-05', nis: '20240105', name: 'MUHAMMAD ZAFRAN KAMIL', gender: 'L', className: 'I - SATU', active: true },
  { id: 'std-06', nis: '20240106', name: 'NUR HASANI', gender: 'L', className: 'I - SATU', active: true },
  { id: 'std-07', nis: '20240107', name: 'FARA ROSMALA', gender: 'P', className: 'I - SATU', active: true },
  { id: 'std-08', nis: '20240108', name: 'NAILA APRILIA DWI SAPUTRI', gender: 'P', className: 'I - SATU', active: true },
  { id: 'std-09', nis: '20240109', name: 'NAJWA HIZWATUL MAULIDA', gender: 'P', className: 'I - SATU', active: true },
  { id: 'std-10', nis: '20240110', name: 'ROSYA LUSIANA PUTRI', gender: 'P', className: 'I - SATU', active: true },
  { id: 'std-11', nis: '20240111', name: 'AHMAD ZAKI AL-FARIZI', gender: 'L', className: 'I - SATU', active: true },

  // Kelas II - DUA
  { id: 'std-12', nis: '20230201', name: 'BILAL AL-HABSYI', gender: 'L', className: 'II - DUA', active: true },
  { id: 'std-13', nis: '20230202', name: 'FATIMAH AZ-ZAHRA', gender: 'P', className: 'II - DUA', active: true },
  { id: 'std-14', nis: '20230203', name: 'HASAN AL-BASHRI', gender: 'L', className: 'II - DUA', active: true },
  { id: 'std-15', nis: '20230204', name: 'MARYAM NURSALIMA', gender: 'P', className: 'II - DUA', active: true },
  { id: 'std-16', nis: '20230205', name: 'ZUBAYR BIN AWWAM', gender: 'L', className: 'II - DUA', active: true },

  // Kelas III - TIGA
  { id: 'std-17', nis: '20220301', name: 'ABDULLAH BIN UMAR', gender: 'L', className: 'III - TIGA', active: true },
  { id: 'std-18', nis: '20220302', name: 'AISYAH HUMAIRA', gender: 'P', className: 'III - TIGA', active: true },
  { id: 'std-19', nis: '20220303', name: 'KHALID BIN WALID', gender: 'L', className: 'III - TIGA', active: true },

  // Kelas IV - EMPAT
  { id: 'std-20', nis: '20210401', name: 'AHMAD HABIBIE', gender: 'L', className: 'IV - EMPAT', active: true },
  { id: 'std-21', nis: '20210402', name: 'SITI AISYAH', gender: 'P', className: 'IV - EMPAT', active: true },
  { id: 'std-22', nis: '20210403', name: 'ZULFA AZIZAH', gender: 'P', className: 'IV - EMPAT', active: true },

  // Kelas V - LIMA
  { id: 'std-23', nis: '20200501', name: 'MUHAMMAD FAIZ', gender: 'L', className: 'V - LIMA', active: true },
  { id: 'std-24', nis: '20200502', name: 'SALMA NABILA', gender: 'P', className: 'V - LIMA', active: true },
  { id: 'std-25', nis: '20200503', name: 'RIZKY RAMADHAN', gender: 'L', className: 'V - LIMA', active: true },
  { id: 'std-26', nis: '20200504', name: 'NURUL HIDAYAH', gender: 'P', className: 'V - LIMA', active: true },

  // Kelas VI - ENAM
  { id: 'std-27', nis: '20190601', name: 'FARHAN MAULANA', gender: 'L', className: 'VI - ENAM', active: true },
  { id: 'std-28', nis: '20190602', name: 'ZASKIA MECCA', gender: 'P', className: 'VI - ENAM', active: true },
  { id: 'std-29', nis: '20190603', name: 'ILHAM PRATAMA', gender: 'L', className: 'VI - ENAM', active: true },
];

export const INITIAL_TEACHERS: Teacher[] = [];

export const DEFAULT_EXAM_CONFIG: ExamSheetConfig = {
  id: 'exam-default-1',
  title: 'LEMBAR ANALISA HASIL UJIAN MURID (IMDA 1)',
  schoolName: 'MMU A-22 KARANGNONGKO',
  academicYear: 'TAHUN 1447-1448 H',
  className: 'I - SATU',
  subjectName: 'FIQIH',
  kkm: 70,
  dateLocation: 'Karangnongko',
  dateDayMonth: '.............',
  dateHijri: '1448',
  headmasterName: 'M. MAS\'UD',
  teacherName: '',
  questions: DEFAULT_QUESTIONS,
  updatedAt: new Date().toISOString(),
};

// Generate initial sample realistic scores for Kelas 1 Fiqih
export const SAMPLE_KELAS_1_SCORES: Record<string, Record<string, number>> = {
  'std-01': { pg_1: 5, pg_2: 5, pg_3: 5, pg_4: 5, pg_5: 5, pg_6: 5, pg_7: 0, is_1: 6, is_2: 6, is_3: 6, is_4: 6, is_5: 0, ur_1: 7, ur_2: 7, ur_3: 7, ur_4: 7, ur_5: 7 }, // Total: 89
  'std-02': { pg_1: 5, pg_2: 5, pg_3: 5, pg_4: 5, pg_5: 5, pg_6: 0, pg_7: 5, is_1: 6, is_2: 6, is_3: 6, is_4: 0, is_5: 6, ur_1: 7, ur_2: 7, ur_3: 7, ur_4: 0, ur_5: 7 }, // Total: 77
  'std-03': { pg_1: 5, pg_2: 5, pg_3: 5, pg_4: 5, pg_5: 5, pg_6: 5, pg_7: 5, is_1: 6, is_2: 6, is_3: 6, is_4: 6, is_5: 6, ur_1: 7, ur_2: 7, ur_3: 7, ur_4: 7, ur_5: 7 }, // Total: 100
  'std-04': { pg_1: 5, pg_2: 0, pg_3: 5, pg_4: 5, pg_5: 0, pg_6: 5, pg_7: 5, is_1: 6, is_2: 0, is_3: 6, is_4: 6, is_5: 0, ur_1: 7, ur_2: 7, ur_3: 0, ur_4: 7, ur_5: 0 }, // Total: 59
  'std-05': { pg_1: 5, pg_2: 5, pg_3: 5, pg_4: 5, pg_5: 5, pg_6: 5, pg_7: 5, is_1: 6, is_2: 6, is_3: 6, is_4: 6, is_5: 6, ur_1: 7, ur_2: 7, ur_3: 7, ur_4: 7, ur_5: 0 }, // Total: 93
  'std-06': { pg_1: 5, pg_2: 5, pg_3: 0, pg_4: 5, pg_5: 5, pg_6: 0, pg_7: 5, is_1: 6, is_2: 6, is_3: 0, is_4: 6, is_5: 6, ur_1: 7, ur_2: 0, ur_3: 7, ur_4: 7, ur_5: 7 }, // Total: 72
  'std-07': { pg_1: 5, pg_2: 5, pg_3: 5, pg_4: 5, pg_5: 5, pg_6: 5, pg_7: 5, is_1: 6, is_2: 6, is_3: 6, is_4: 6, is_5: 6, ur_1: 7, ur_2: 7, ur_3: 7, ur_4: 7, ur_5: 7 }, // Total: 100
  'std-08': { pg_1: 5, pg_2: 5, pg_3: 5, pg_4: 5, pg_5: 5, pg_6: 5, pg_7: 5, is_1: 6, is_2: 6, is_3: 6, is_4: 6, is_5: 0, ur_1: 7, ur_2: 7, ur_3: 7, ur_4: 7, ur_5: 7 }, // Total: 94
  'std-09': { pg_1: 5, pg_2: 5, pg_3: 5, pg_4: 0, pg_5: 5, pg_6: 5, pg_7: 0, is_1: 6, is_2: 6, is_3: 0, is_4: 6, is_5: 6, ur_1: 7, ur_2: 7, ur_3: 7, ur_4: 0, ur_5: 7 }, // Total: 71
  'std-10': { pg_1: 5, pg_2: 5, pg_3: 5, pg_4: 5, pg_5: 5, pg_6: 5, pg_7: 5, is_1: 6, is_2: 6, is_3: 6, is_4: 6, is_5: 6, ur_1: 7, ur_2: 7, ur_3: 7, ur_4: 7, ur_5: 7 }, // Total: 100
  'std-11': { pg_1: 5, pg_2: 0, pg_3: 5, pg_4: 5, pg_5: 5, pg_6: 0, pg_7: 5, is_1: 6, is_2: 0, is_3: 6, is_4: 0, is_5: 6, ur_1: 7, ur_2: 7, ur_3: 0, ur_4: 7, ur_5: 0 }, // Total: 64
};
