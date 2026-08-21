export type QuestionType = 'pg' | 'isian' | 'uraian';

export interface QuestionDefinition {
  id: string;
  number: number;
  type: QuestionType;
  maxScore: number;
  label: string;
}

export interface Student {
  id: string;
  nis: string;
  name: string;
  gender: 'L' | 'P';
  className: string;
  phone?: string;
  active: boolean;
}

export interface Teacher {
  id: string;
  nip: string;
  name: string;
  role: 'Kepala Madrasah' | 'Wali Kelas' | 'Guru Pengampu' | 'Staf';
  subject?: string;
  assignedClass?: string;
  phone?: string;
}

export interface ClassGroup {
  id: string;
  name: string; // e.g. '1', '2', '3', '7A', '10-IPA'
  level: string;
  academicYear: string;
  waliKelasName?: string;
}

export interface Subject {
  id: string;
  code: string;
  name: string; // e.g. 'FIQIH', 'AQIDAH', 'MATEMATIKA'
  kkm: number;
  category?: string;
}

export interface StudentScoreRow {
  studentId: string;
  studentName: string;
  scores: Record<string, number>; // questionId -> score obtained (e.g. 5 for full PG, 0 for wrong, or partial)
  correctQuestionsCount: number;
  wrongQuestionsCount: number;
  totalScore: number;
  isPassed: boolean;
  notes?: string;
}

export interface QuestionAnalysis {
  questionId: string;
  number: number;
  type: QuestionType;
  maxScore: number;
  correctCount: number;
  wrongCount: number;
  totalPointsAwarded: number;
  difficultyIndex: number; // 0.0 - 1.0 (proportion answering correctly)
  difficultyCategory: 'Sukar' | 'Sedang' | 'Mudah';
  discriminationIndex?: number; // Daya pembeda (-1.0 to 1.0)
  discriminationCategory?: string; // 'Sangat Baik' | 'Baik' | 'Cukup' | 'Jelek / Revisi' | 'Ditolak'
  itemRecommendation?: 'Diterima' | 'Diterima & Direvisi' | 'Ditolak / Dibuang';
}

export interface RemedialStudentDetail {
  studentId: string;
  nis: string;
  name: string;
  score: number;
  deficientTypes: string[];
  wrongQuestionNumbers: number[];
  suggestedAction: string;
}

export interface EnrichmentStudentDetail {
  studentId: string;
  nis: string;
  name: string;
  score: number;
  suggestedActivity: string;
}

export interface ItemQualitySummary {
  accepted: number;
  revised: number;
  rejected: number;
  easyCount: number;
  mediumCount: number;
  hardCount: number;
}

export interface ExamSheetConfig {
  id: string;
  title: string; // e.g. 'LEMBAR ANALISA HASIL UJIAN MURID (IMDA 1)'
  schoolName: string; // e.g. 'MMU A-22 KARANGNONGKO'
  academicYear: string; // e.g. 'TAHUN 1447-1448 H' / '2024-2025'
  className: string; // e.g. '1'
  subjectName: string; // e.g. 'FIQIH'
  kkm: number; // default 70
  dateLocation: string; // e.g. 'Karangnongko'
  dateDayMonth?: string; // e.g. '.............' or '15 Sya\'ban' or '24 November'
  dateHijri: string; // e.g. '1448'
  headmasterName: string; // e.g. "M. MAS'UD"
  teacherName: string; // e.g. "Wali Kelas" or teacher name
  questions: QuestionDefinition[];
  updatedAt: string;
}

export interface ExamRecord {
  id: string;
  config: ExamSheetConfig;
  rows: StudentScoreRow[];
  createdAt: string;
  updatedAt: string;
}

export interface ExamStatistics {
  totalStudents: number;
  averageScore: number;
  highestScore: number;
  lowestScore: number;
  medianScore: number;
  standardDeviation: number;
  passedCount: number;
  failedCount: number;
  passPercentage: number;
  gradeDistribution: {
    gradeA: number; // >= 85
    gradeB: number; // 75 - 84
    gradeC: number; // 65 - 74 (or KKM threshold)
    gradeD: number; // < 65
  };
  topStudents: { name: string; score: number }[];
  needRemedial: { name: string; score: number; deficientTypes: string[] }[];
  remedialDetails?: RemedialStudentDetail[];
  enrichmentDetails?: EnrichmentStudentDetail[];
  qualitySummary?: ItemQualitySummary;
  questionAnalyses: QuestionAnalysis[];
  hardestQuestions: QuestionAnalysis[];
  easiestQuestions: QuestionAnalysis[];
}

export interface AIAnalysisResult {
  summary: string;
  strengths: string[];
  weaknesses: string[];
  recommendations: string[];
  isAiGenerated: boolean;
}
