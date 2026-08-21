import {
  DEFAULT_EXAM_CONFIG,
  INITIAL_CLASSES,
  INITIAL_STUDENTS,
  INITIAL_SUBJECTS,
  INITIAL_TEACHERS,
  SAMPLE_KELAS_1_SCORES,
} from '../data/initialData';
import { calculateRowScores, getTeacherForClass, isSameClass, normalizeClassName } from './analysisEngine';
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

  clearAllTeachers(): void {
    this.saveTeachers([]);
    // Also clear waliKelasName in classes
    const classes = this.getClasses().map((c) => ({ ...c, waliKelasName: '' }));
    this.saveClasses(classes);
    // Also clear teacherName in current config
    const currentConfig = this.getCurrentConfig();
    this.saveCurrentConfig({ ...currentConfig, teacherName: '' });
  },

  getClasses(): ClassGroup[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.CLASSES);
      const currentTeachers = this.getTeachers();

      if (data !== null) {
        const parsed: ClassGroup[] = JSON.parse(data);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed.map((c) => {
            const normName = normalizeClassName(c.name);
            const teacherMatch = currentTeachers.find((t) => isSameClass(t.assignedClass, normName));
            const wali = teacherMatch ? teacherMatch.name : (c.waliKelasName && currentTeachers.some(t => t.name === c.waliKelasName) ? c.waliKelasName : '');

            return {
              ...c,
              name: normName,
              waliKelasName: wali,
            };
          });
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
      const classes = this.getClasses();
      const teachers = this.getTeachers();

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
        const normClass = normalizeClassName(parsed.className) || 'I - SATU';
        const properTeacher = getTeacherForClass(normClass, classes, teachers);
        const resolvedTeacher = properTeacher || (teachers.some((t) => t.name === parsed.teacherName) ? parsed.teacherName : '');

        return {
          ...parsed,
          className: normClass,
          teacherName: resolvedTeacher,
          dateLocation: dateLoc,
          dateDayMonth: parsed.dateDayMonth !== undefined ? parsed.dateDayMonth : '.............',
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

  // --- Neon DB / Cloud PostgreSQL API Integration ---
  async checkCloudDbStatus(): Promise<{ connected: boolean; version?: string; error?: string }> {
    try {
      const res = await fetch('/api/db/status');
      if (!res.ok) return { connected: false, error: `HTTP ${res.status}` };
      return await res.json();
    } catch (e: any) {
      return { connected: false, error: e.message || 'Cannot reach API' };
    }
  },

  async syncFromCloudDb(): Promise<{ success: boolean; message?: string }> {
    try {
      const res = await fetch('/api/db/sync');
      if (!res.ok) return { success: false, message: `HTTP ${res.status}` };
      const json = await res.json();
      if (json.connected && json.data) {
        const { students, teachers, classes, subjects, examArchives, currentConfig, currentScores } = json.data;
        if (students && students.length > 0) this.saveStudents(students);
        if (teachers && teachers.length > 0) this.saveTeachers(teachers);
        if (classes && classes.length > 0) this.saveClasses(classes);
        if (subjects && subjects.length > 0) this.saveSubjects(subjects);
        if (examArchives && examArchives.length > 0) {
          localStorage.setItem(STORAGE_KEYS.EXAM_RECORDS, JSON.stringify(examArchives));
        }
        if (currentConfig) this.saveCurrentConfig(currentConfig);
        if (currentScores) this.saveCurrentRows(currentScores);
        return { success: true, message: 'Data berhasil disinkronisasi dari Neon DB.' };
      }
      return { success: false, message: json.message || 'Tidak ada data di cloud' };
    } catch (e: any) {
      return { success: false, message: e.message };
    }
  },

  async syncToCloudDb(): Promise<{ success: boolean; message?: string }> {
    try {
      const payload = {
        students: this.getStudents(),
        teachers: this.getTeachers(),
        classes: this.getClasses(),
        subjects: this.getSubjects(),
        examArchives: this.getExamRecords(),
        currentConfig: this.getCurrentConfig(),
        currentScores: this.getCurrentRows(this.getCurrentConfig()),
      };

      const res = await fetch('/api/db/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: `HTTP ${res.status}` }));
        return { success: false, message: err.error || `HTTP ${res.status}` };
      }
      return { success: true, message: 'Seluruh data berhasil dicadangkan ke Neon DB!' };
    } catch (e: any) {
      return { success: false, message: e.message };
    }
  },

  async saveExamRecordToCloud(record: ExamRecord): Promise<void> {
    try {
      await fetch('/api/db/exam-records', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(record),
      });
    } catch (e) {
      console.warn('Could not sync exam record to cloud DB:', e);
    }
  },

  async deleteExamRecordFromCloud(recordId: string): Promise<void> {
    try {
      await fetch(`/api/db/exam-records/${recordId}`, {
        method: 'DELETE',
      });
    } catch (e) {
      console.warn('Could not delete exam record from cloud DB:', e);
    }
  },
};

