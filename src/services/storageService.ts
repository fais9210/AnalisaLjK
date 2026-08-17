import {
  DEFAULT_EXAM_CONFIG,
  INITIAL_CLASSES,
  INITIAL_STUDENTS,
  INITIAL_SUBJECTS,
  INITIAL_TEACHERS,
  SAMPLE_KELAS_1_SCORES,
} from '../data/initialData';
import { calculateRowScores, isSameClass, normalizeClassName } from './analysisEngine';
import { ClassGroup, ExamRecord, ExamSheetConfig, Student, StudentScoreRow, Subject, Teacher } from '../types';

const STORAGE_KEYS = {
  STUDENTS: 'analisa_ujian_students_v1',
  TEACHERS: 'analisa_ujian_teachers_v1',
  CLASSES: 'analisa_ujian_classes_v1',
  SUBJECTS: 'analisa_ujian_subjects_v1',
  CURRENT_CONFIG: 'analisa_ujian_current_config_v1',
  EXAM_RECORDS: 'analisa_ujian_exam_records_v1',
  CURRENT_ROWS: 'analisa_ujian_current_rows_v1',
};

// Initialize initial default score rows for the active class
export function generateInitialRows(students: Student[], config: ExamSheetConfig): StudentScoreRow[] {
  const classStudents = students.filter((s) => isSameClass(s.className, config.className) && s.active);
  return classStudents.map((s) => {
    const scores = isSameClass(config.className, 'I - SATU') ? (SAMPLE_KELAS_1_SCORES[s.id] || {}) : {};
    const { correctQuestionsCount, wrongQuestionsCount, totalScore, isPassed } = calculateRowScores(
      scores,
      config
    );
    return {
      studentId: s.id,
      studentName: s.name,
      scores,
      correctQuestionsCount,
      wrongQuestionsCount,
      totalScore,
      isPassed,
    };
  });
}

export const StorageService = {
  getStudents(): Student[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.STUDENTS);
      if (data !== null) {
        const parsed: Student[] = JSON.parse(data);
        if (Array.isArray(parsed)) {
          return parsed.map((s) => ({
            ...s,
            className: normalizeClassName(s.className),
          }));
        }
      }
    } catch (e) {
      console.error('Error reading students from storage', e);
    }
    this.saveStudents(INITIAL_STUDENTS);
    return INITIAL_STUDENTS;
  },

  saveStudents(students: Student[]): void {
    localStorage.setItem(STORAGE_KEYS.STUDENTS, JSON.stringify(students));
  },

  getTeachers(): Teacher[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.TEACHERS);
      if (data !== null) {
        const parsed: Teacher[] = JSON.parse(data);
        if (Array.isArray(parsed)) {
          return parsed.map((t) => ({
            ...t,
            assignedClass: t.assignedClass ? normalizeClassName(t.assignedClass) : undefined,
          }));
        }
      }
    } catch (e) {
      console.error('Error reading teachers from storage', e);
    }
    this.saveTeachers(INITIAL_TEACHERS);
    return INITIAL_TEACHERS;
  },

  saveTeachers(teachers: Teacher[]): void {
    localStorage.setItem(STORAGE_KEYS.TEACHERS, JSON.stringify(teachers));
  },

  getClasses(): ClassGroup[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.CLASSES);
      if (data !== null) {
        const parsed: ClassGroup[] = JSON.parse(data);
        if (Array.isArray(parsed)) {
          return parsed.map((c) => ({
            ...c,
            name: normalizeClassName(c.name),
          }));
        }
      }
    } catch (e) {
      console.error('Error reading classes from storage', e);
    }
    this.saveClasses(INITIAL_CLASSES);
    return INITIAL_CLASSES;
  },

  saveClasses(classes: ClassGroup[]): void {
    localStorage.setItem(STORAGE_KEYS.CLASSES, JSON.stringify(classes));
  },

  getSubjects(): Subject[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.SUBJECTS);
      if (data !== null) return JSON.parse(data);
    } catch (e) {
      console.error('Error reading subjects from storage', e);
    }
    this.saveSubjects(INITIAL_SUBJECTS);
    return INITIAL_SUBJECTS;
  },

  saveSubjects(subjects: Subject[]): void {
    localStorage.setItem(STORAGE_KEYS.SUBJECTS, JSON.stringify(subjects));
  },

  getCurrentConfig(): ExamSheetConfig {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.CURRENT_CONFIG);
      if (data !== null) {
        const parsed: ExamSheetConfig = JSON.parse(data);
        const dateLoc =
          !parsed.dateLocation || parsed.dateLocation.toLowerCase().includes('karangasem')
            ? 'Karangnongko'
            : parsed.dateLocation;
        const schoolNm =
          parsed.schoolName && parsed.schoolName.toUpperCase().includes('KARANGASEM')
            ? parsed.schoolName.replace(/KARANGASEM/gi, 'KARANGNONGKO')
            : parsed.schoolName || 'MMU A-22 KARANGNONGKO';
        return {
          ...parsed,
          className: normalizeClassName(parsed.className) || 'I - SATU',
          dateLocation: dateLoc,
          schoolName: schoolNm,
        };
      }
    } catch (e) {
      console.error('Error reading config from storage', e);
    }
    this.saveCurrentConfig(DEFAULT_EXAM_CONFIG);
    return DEFAULT_EXAM_CONFIG;
  },

  saveCurrentConfig(config: ExamSheetConfig): void {
    localStorage.setItem(STORAGE_KEYS.CURRENT_CONFIG, JSON.stringify(config));
  },

  getCurrentRows(config: ExamSheetConfig): StudentScoreRow[] {
    const students = this.getStudents();
    const matchingStudents = students.filter((s) => isSameClass(s.className, config.className) && s.active);

    try {
      const data = localStorage.getItem(STORAGE_KEYS.CURRENT_ROWS);
      if (data) {
        const rows: StudentScoreRow[] = JSON.parse(data);
        if (rows.length > 0) {
          // If rows exist, check if they belong to this class or if we need to reconcile with students
          const studentIdsInClass = new Set(matchingStudents.map((s) => s.id));
          const hasMatchingStudent = rows.some((r) => studentIdsInClass.has(r.studentId));
          if (hasMatchingStudent || matchingStudents.length === 0) {
            return rows;
          }
        }
      }
    } catch (e) {
      console.error('Error reading current rows from storage', e);
    }

    const initialRows = generateInitialRows(students, config);
    this.saveCurrentRows(initialRows);
    return initialRows;
  },

  saveCurrentRows(rows: StudentScoreRow[]): void {
    localStorage.setItem(STORAGE_KEYS.CURRENT_ROWS, JSON.stringify(rows));
  },

  getExamRecords(): ExamRecord[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.EXAM_RECORDS);
      if (data) return JSON.parse(data);
    } catch (e) {
      console.error('Error reading exam records from storage', e);
    }
    return [];
  },

  saveExamRecord(record: ExamRecord): void {
    const records = this.getExamRecords();
    const existingIndex = records.findIndex((r) => r.id === record.id);
    if (existingIndex >= 0) {
      records[existingIndex] = record;
    } else {
      records.unshift(record);
    }
    localStorage.setItem(STORAGE_KEYS.EXAM_RECORDS, JSON.stringify(records));
  },

  deleteExamRecord(recordId: string): void {
    const records = this.getExamRecords().filter((r) => r.id !== recordId);
    localStorage.setItem(STORAGE_KEYS.EXAM_RECORDS, JSON.stringify(records));
  },

  exportFullBackup(): string {
    const backup = {
      version: '1.0',
      exportedAt: new Date().toISOString(),
      students: this.getStudents(),
      teachers: this.getTeachers(),
      classes: this.getClasses(),
      subjects: this.getSubjects(),
      currentConfig: this.getCurrentConfig(),
      currentRows: this.getCurrentRows(this.getCurrentConfig()),
      examRecords: this.getExamRecords(),
    };
    return JSON.stringify(backup, null, 2);
  },

  importFullBackup(jsonString: string): boolean {
    try {
      const parsed = JSON.parse(jsonString);
      if (parsed.students) this.saveStudents(parsed.students);
      if (parsed.teachers) this.saveTeachers(parsed.teachers);
      if (parsed.classes) this.saveClasses(parsed.classes);
      if (parsed.subjects) this.saveSubjects(parsed.subjects);
      if (parsed.currentConfig) this.saveCurrentConfig(parsed.currentConfig);
      if (parsed.currentRows) this.saveCurrentRows(parsed.currentRows);
      if (parsed.examRecords) {
        localStorage.setItem(STORAGE_KEYS.EXAM_RECORDS, JSON.stringify(parsed.examRecords));
      }
      return true;
    } catch (e) {
      console.error('Import error', e);
      return false;
    }
  },

  resetToDefault(): void {
    localStorage.clear();
    this.saveStudents(INITIAL_STUDENTS);
    this.saveTeachers(INITIAL_TEACHERS);
    this.saveClasses(INITIAL_CLASSES);
    this.saveSubjects(INITIAL_SUBJECTS);
    this.saveCurrentConfig(DEFAULT_EXAM_CONFIG);
    const initialRows = generateInitialRows(INITIAL_STUDENTS, DEFAULT_EXAM_CONFIG);
    this.saveCurrentRows(initialRows);
  },
};
