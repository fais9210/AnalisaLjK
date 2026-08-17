import React, { useRef, useState } from 'react';
import { ClassGroup, Student, Subject, Teacher } from '../types';
import { ExcelService } from '../services/excelService';
import { isSameClass } from '../services/analysisEngine';
import {
  Users,
  GraduationCap,
  BookOpen,
  Plus,
  Download,
  Upload,
  Search,
  Edit,
  Trash2,
  FileSpreadsheet,
  Check,
  X,
  UserCheck,
  Building,
  CheckSquare,
  Square,
  AlertOctagon,
} from 'lucide-react';

interface MasterDataManagerProps {
  students: Student[];
  teachers: Teacher[];
  classes: ClassGroup[];
  subjects: Subject[];
  onSaveStudents: (newStudents: Student[]) => void;
  onSaveTeachers: (newTeachers: Teacher[]) => void;
  onSaveClasses: (newClasses: ClassGroup[]) => void;
  onSaveSubjects: (newSubjects: Subject[]) => void;
}

export const MasterDataManager: React.FC<MasterDataManagerProps> = ({
  students,
  teachers,
  classes,
  subjects,
  onSaveStudents,
  onSaveTeachers,
  onSaveClasses,
  onSaveSubjects,
}) => {
  const [activeTab, setActiveTab] = useState<'students' | 'teachers' | 'classes' | 'subjects'>('students');
  const [selectedClassFilter, setSelectedClassFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Bulk selection state for students
  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([]);
  const [isBulkDeleteModalOpen, setIsBulkDeleteModalOpen] = useState(false);

  // Single Item Delete Confirmation Modal state
  const [deleteConfirmation, setDeleteConfirmation] = useState<{
    type: 'student' | 'teacher' | 'class' | 'subject';
    id: string;
    name: string;
    title: string;
    description: string;
  } | null>(null);

  // Modals state
  const [isStudentModalOpen, setIsStudentModalOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [studentForm, setStudentForm] = useState<Partial<Student>>({
    name: '',
    nis: '',
    gender: 'L',
    className: classes[0]?.name || '1',
    phone: '',
    active: true,
  });

  const [isTeacherModalOpen, setIsTeacherModalOpen] = useState(false);
  const [editingTeacher, setEditingTeacher] = useState<Teacher | null>(null);
  const [teacherForm, setTeacherForm] = useState<Partial<Teacher>>({
    name: '',
    nip: '',
    role: 'Wali Kelas',
    subject: '',
    assignedClass: '1',
    phone: '',
  });

  const [isClassModalOpen, setIsClassModalOpen] = useState(false);
  const [editingClass, setEditingClass] = useState<ClassGroup | null>(null);
  const [classForm, setClassForm] = useState<Partial<ClassGroup>>({
    name: '',
    level: 'Ibtidaiyah / Dasar',
    academicYear: '1447-1448 H',
    waliKelasName: '',
  });

  const [isSubjectModalOpen, setIsSubjectModalOpen] = useState(false);
  const [editingSubject, setEditingSubject] = useState<Subject | null>(null);
  const [subjectForm, setSubjectForm] = useState<Partial<Subject>>({
    code: '',
    name: '',
    kkm: 70,
    category: 'Syari\'ah',
  });

  const studentFileInputRef = useRef<HTMLInputElement>(null);
  const teacherFileInputRef = useRef<HTMLInputElement>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const showNotification = (msg: string) => {
    setStatusMessage(msg);
    setTimeout(() => setStatusMessage(null), 3500);
  };

  // Student CRUD
  const handleOpenStudentModal = (student?: Student) => {
    if (student) {
      setEditingStudent(student);
      setStudentForm({ ...student });
    } else {
      setEditingStudent(null);
      setStudentForm({
        name: '',
        nis: `2024${String(students.length + 1).padStart(4, '0')}`,
        gender: 'L',
        className: selectedClassFilter !== 'all' ? selectedClassFilter : classes[0]?.name || '1',
        phone: '',
        active: true,
      });
    }
    setIsStudentModalOpen(true);
  };

  const handleSaveStudent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!studentForm.name) return;

    if (editingStudent) {
      const updated = students.map((s) =>
        s.id === editingStudent.id ? ({ ...s, ...studentForm } as Student) : s
      );
      onSaveStudents(updated);
      showNotification(`Data siswa ${studentForm.name} berhasil diperbarui.`);
    } else {
      const newStudent: Student = {
        id: `std-${Date.now()}`,
        nis: studentForm.nis || `2024${Date.now().toString().slice(-4)}`,
        name: studentForm.name.toUpperCase(),
        gender: studentForm.gender || 'L',
        className: studentForm.className || '1',
        phone: studentForm.phone || '',
        active: studentForm.active !== undefined ? studentForm.active : true,
      };
      onSaveStudents([...students, newStudent]);
      showNotification(`Siswa ${newStudent.name} berhasil ditambahkan.`);
    }
    setIsStudentModalOpen(false);
  };

  const handleDeleteStudent = (id: string, name: string) => {
    setDeleteConfirmation({
      type: 'student',
      id,
      name,
      title: 'Hapus Data Siswa',
      description: `Apakah Anda yakin ingin menghapus data siswa "${name}"? Tindakan ini tidak dapat dibatalkan.`,
    });
  };

  // Bulk Student Deletion Handlers
  const handleToggleSelectStudent = (id: string) => {
    setSelectedStudentIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleSelectAllFilteredStudents = () => {
    const filteredIds = filteredStudents.map((s) => s.id);
    const areAllSelected = filteredIds.length > 0 && filteredIds.every((id) => selectedStudentIds.includes(id));
    if (areAllSelected) {
      setSelectedStudentIds((prev) => prev.filter((id) => !filteredIds.includes(id)));
    } else {
      setSelectedStudentIds((prev) => Array.from(new Set([...prev, ...filteredIds])));
    }
  };

  const handleClearStudentSelection = () => {
    setSelectedStudentIds([]);
  };

  const handleConfirmBulkDeleteStudents = () => {
    if (selectedStudentIds.length === 0) return;
    const count = selectedStudentIds.length;
    const remainingStudents = students.filter((s) => !selectedStudentIds.includes(s.id));
    onSaveStudents(remainingStudents);
    setSelectedStudentIds([]);
    setIsBulkDeleteModalOpen(false);
    showNotification(`Berhasil menghapus ${count} data siswa secara kolektif.`);
  };

  // Teacher CRUD
  const handleOpenTeacherModal = (teacher?: Teacher) => {
    if (teacher) {
      setEditingTeacher(teacher);
      setTeacherForm({ ...teacher });
    } else {
      setEditingTeacher(null);
      setTeacherForm({
        name: '',
        nip: `1990${Date.now().toString().slice(-6)}`,
        role: 'Wali Kelas',
        subject: subjects[0]?.name || '',
        assignedClass: classes[0]?.name || '1',
        phone: '',
      });
    }
    setIsTeacherModalOpen(true);
  };

  const handleSaveTeacher = (e: React.FormEvent) => {
    e.preventDefault();
    if (!teacherForm.name) return;

    if (editingTeacher) {
      const updated = teachers.map((t) =>
        t.id === editingTeacher.id ? ({ ...t, ...teacherForm } as Teacher) : t
      );
      onSaveTeachers(updated);
      showNotification(`Data guru ${teacherForm.name} berhasil diperbarui.`);
    } else {
      const newTeacher: Teacher = {
        id: `tch-${Date.now()}`,
        nip: teacherForm.nip || '',
        name: teacherForm.name,
        role: teacherForm.role as any || 'Guru Pengampu',
        subject: teacherForm.subject,
        assignedClass: teacherForm.assignedClass,
        phone: teacherForm.phone,
      };
      onSaveTeachers([...teachers, newTeacher]);
      showNotification(`Guru ${newTeacher.name} berhasil ditambahkan.`);
    }
    setIsTeacherModalOpen(false);
  };

  const handleDeleteTeacher = (id: string, name: string) => {
    setDeleteConfirmation({
      type: 'teacher',
      id,
      name,
      title: 'Hapus Data Guru',
      description: `Apakah Anda yakin ingin menghapus data guru "${name}"? Data yang dihapus akan hilang dari daftar.`,
    });
  };

  // Single Item Delete Confirmation Execution
  const handleConfirmSingleDelete = () => {
    if (!deleteConfirmation) return;
    const { type, id, name } = deleteConfirmation;

    if (type === 'teacher') {
      const remaining = teachers.filter((t) => t.id !== id);
      onSaveTeachers(remaining);
      showNotification(`Guru ${name} berhasil dihapus.`);
    } else if (type === 'student') {
      const remaining = students.filter((s) => s.id !== id);
      onSaveStudents(remaining);
      setSelectedStudentIds((prev) => prev.filter((item) => item !== id));
      showNotification(`Siswa ${name} berhasil dihapus.`);
    } else if (type === 'class') {
      const remaining = classes.filter((c) => c.id !== id);
      onSaveClasses(remaining);
      if (isSameClass(selectedClassFilter, name)) {
        setSelectedClassFilter('all');
      }
      showNotification(`Kelas ${name} berhasil dihapus.`);
    } else if (type === 'subject') {
      const remaining = subjects.filter((s) => s.id !== id);
      onSaveSubjects(remaining);
      showNotification(`Mata pelajaran ${name} berhasil dihapus.`);
    }

    setDeleteConfirmation(null);
  };

  // Class CRUD
  const handleOpenClassModal = (cls?: ClassGroup) => {
    if (cls) {
      setEditingClass(cls);
      setClassForm({ ...cls });
    } else {
      setEditingClass(null);
      setClassForm({
        name: '',
        level: 'Ibtidaiyah / Dasar',
        academicYear: '1447-1448 H',
        waliKelasName: '',
      });
    }
    setIsClassModalOpen(true);
  };

  const handleSaveClass = (e: React.FormEvent) => {
    e.preventDefault();
    if (!classForm.name) return;
    const trimmedName = classForm.name.trim();

    if (editingClass) {
      const oldName = editingClass.name;
      const updated = classes.map((c) =>
        c.id === editingClass.id
          ? ({
              ...c,
              name: trimmedName,
              level: classForm.level || 'Ibtidaiyah / Dasar',
              academicYear: classForm.academicYear || '1447-1448 H',
              waliKelasName: classForm.waliKelasName || '',
            } as ClassGroup)
          : c
      );
      onSaveClasses(updated);

      // Cascading update: sync students and teachers if class name was changed
      if (oldName !== trimmedName) {
        const updatedStudents = students.map((s) =>
          isSameClass(s.className, oldName) ? { ...s, className: trimmedName } : s
        );
        onSaveStudents(updatedStudents);

        const updatedTeachers = teachers.map((t) =>
          isSameClass(t.assignedClass, oldName) ? { ...t, assignedClass: trimmedName } : t
        );
        onSaveTeachers(updatedTeachers);

        if (isSameClass(selectedClassFilter, oldName)) {
          setSelectedClassFilter(trimmedName);
        }
      }

      showNotification(`Data Kelas ${trimmedName} berhasil diperbarui.`);
    } else {
      const newClass: ClassGroup = {
        id: `cls-${Date.now()}`,
        name: trimmedName,
        level: classForm.level || 'Ibtidaiyah / Dasar',
        academicYear: classForm.academicYear || '1447-1448 H',
        waliKelasName: classForm.waliKelasName || '',
      };
      onSaveClasses([...classes, newClass]);
      showNotification(`Kelas ${newClass.name} berhasil dibuat.`);
    }

    setIsClassModalOpen(false);
    setEditingClass(null);
    setClassForm({ name: '', level: 'Ibtidaiyah / Dasar', academicYear: '1447-1448 H', waliKelasName: '' });
  };

  const handleDeleteClass = (id: string, name: string) => {
    const studentCount = students.filter((s) => isSameClass(s.className, name)).length;
    const description =
      studentCount > 0
        ? `Kelas ${name} memiliki ${studentCount} siswa terdaftar. Yakin ingin menghapus kelas ini? Tindakan ini tidak dapat dibatalkan.`
        : `Apakah Anda yakin ingin menghapus data Kelas ${name}?`;

    setDeleteConfirmation({
      type: 'class',
      id,
      name,
      title: 'Hapus Data Kelas',
      description,
    });
  };

  // Subject CRUD
  const handleOpenSubjectModal = (subj?: Subject) => {
    if (subj) {
      setEditingSubject(subj);
      setSubjectForm({
        code: subj.code || '',
        name: subj.name || '',
        kkm: subj.kkm || 70,
        category: subj.category || 'Syari\'ah',
      });
    } else {
      setEditingSubject(null);
      setSubjectForm({
        code: '',
        name: '',
        kkm: 70,
        category: 'Syari\'ah',
      });
    }
    setIsSubjectModalOpen(true);
  };

  const handleSaveSubject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!subjectForm.name) return;
    const trimmedName = subjectForm.name.trim().toUpperCase();
    const trimmedCode = (subjectForm.code?.trim() || trimmedName.slice(0, 3)).toUpperCase();
    const numKkm = Number(subjectForm.kkm) || 70;
    const category = subjectForm.category || 'Syari\'ah';

    if (editingSubject) {
      const oldName = editingSubject.name;
      const updated = subjects.map((s) =>
        s.id === editingSubject.id
          ? ({
              ...s,
              code: trimmedCode,
              name: trimmedName,
              kkm: numKkm,
              category,
            } as Subject)
          : s
      );
      onSaveSubjects(updated);

      // Sync teachers teaching this subject if renamed
      if (oldName !== trimmedName) {
        const updatedTeachers = teachers.map((t) =>
          t.subject === oldName ? { ...t, subject: trimmedName } : t
        );
        onSaveTeachers(updatedTeachers);
      }

      showNotification(`Mata pelajaran ${trimmedName} berhasil diperbarui.`);
    } else {
      const newSubject: Subject = {
        id: `sbj-${Date.now()}`,
        code: trimmedCode,
        name: trimmedName,
        kkm: numKkm,
        category,
      };
      onSaveSubjects([...subjects, newSubject]);
      showNotification(`Mata pelajaran ${newSubject.name} berhasil dibuat.`);
    }

    setIsSubjectModalOpen(false);
    setEditingSubject(null);
    setSubjectForm({ code: '', name: '', kkm: 70, category: 'Syari\'ah' });
  };

  const handleDeleteSubject = (id: string, name: string) => {
    setDeleteConfirmation({
      type: 'subject',
      id,
      name,
      title: 'Hapus Mata Pelajaran',
      description: `Apakah Anda yakin ingin menghapus data mata pelajaran "${name}"? Tindakan ini tidak dapat dibatalkan.`,
    });
  };

  // Excel / CSV File Handlers
  const handleStudentFileImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const imported = await ExcelService.parseStudentsFile(file);
      if (imported.length === 0) {
        alert('Tidak ada data siswa yang valid ditemukan dalam file.');
        return;
      }
      onSaveStudents([...students, ...imported]);
      showNotification(`Berhasil mengimpor ${imported.length} data siswa dari file!`);
    } catch (err: any) {
      alert(`Gagal mengimpor file siswa: ${err.message}`);
    }
    if (studentFileInputRef.current) studentFileInputRef.current.value = '';
  };

  const handleTeacherFileImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const imported = await ExcelService.parseTeachersFile(file);
      if (imported.length === 0) {
        alert('Tidak ada data guru yang valid ditemukan dalam file.');
        return;
      }
      onSaveTeachers([...teachers, ...imported]);
      showNotification(`Berhasil mengimpor ${imported.length} data guru dari file!`);
    } catch (err: any) {
      alert(`Gagal mengimpor file guru: ${err.message}`);
    }
    if (teacherFileInputRef.current) teacherFileInputRef.current.value = '';
  };

  // Filtered Students
  const filteredStudents = students.filter((s) => {
    const matchesClass = selectedClassFilter === 'all' || isSameClass(s.className, selectedClassFilter);
    const matchesSearch =
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.nis.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesClass && matchesSearch;
  });

  // Filtered Teachers
  const filteredTeachers = teachers.filter(
    (t) =>
      t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (t.subject && t.subject.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      {statusMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded-lg bg-emerald-700 px-4 py-3 text-sm font-medium text-white shadow-xl">
          <Check className="h-4 w-4" /> {statusMessage}
        </div>
      )}

      {/* Navigation tabs */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 bg-white px-6 pt-3 rounded-xl shadow-2xs">
        <div className="flex gap-2">
          <button
            onClick={() => {
              setActiveTab('students');
              setSearchQuery('');
            }}
            className={`flex items-center gap-2 border-b-2 py-3 px-4 text-sm font-bold transition ${
              activeTab === 'students'
                ? 'border-blue-600 text-blue-700'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <Users className="h-4 w-4" /> Data Murid ({students.length})
          </button>
          <button
            onClick={() => {
              setActiveTab('teachers');
              setSearchQuery('');
            }}
            className={`flex items-center gap-2 border-b-2 py-3 px-4 text-sm font-bold transition ${
              activeTab === 'teachers'
                ? 'border-blue-600 text-blue-700'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <GraduationCap className="h-4 w-4" /> Data Guru ({teachers.length})
          </button>
          <button
            onClick={() => setActiveTab('classes')}
            className={`flex items-center gap-2 border-b-2 py-3 px-4 text-sm font-bold transition ${
              activeTab === 'classes'
                ? 'border-blue-600 text-blue-700'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <Building className="h-4 w-4" /> Kelas ({classes.length})
          </button>
          <button
            onClick={() => setActiveTab('subjects')}
            className={`flex items-center gap-2 border-b-2 py-3 px-4 text-sm font-bold transition ${
              activeTab === 'subjects'
                ? 'border-blue-600 text-blue-700'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <BookOpen className="h-4 w-4" /> Mata Pelajaran ({subjects.length})
          </button>
        </div>
      </div>

      {/* TAB 1: DATA SISWA */}
      {activeTab === 'students' && (
        <div className="space-y-4">
          {/* Action Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-white p-4 border border-slate-200 shadow-xs">
            <div className="flex flex-wrap items-center gap-3">
              {/* Filter Class */}
              <div className="flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200">
                <span className="text-xs font-bold text-slate-600">Filter Kelas:</span>
                <select
                  value={selectedClassFilter}
                  onChange={(e) => {
                    setSelectedClassFilter(e.target.value);
                    setSelectedStudentIds([]);
                  }}
                  className="bg-transparent text-xs font-bold text-blue-700 outline-none cursor-pointer"
                >
                  <option value="all">Semua Kelas ({students.length})</option>
                  {classes.map((c) => {
                    const count = students.filter((s) => isSameClass(s.className, c.name)).length;
                    return (
                      <option key={c.id} value={c.name}>
                        {c.name} ({count} Siswa)
                      </option>
                    );
                  })}
                </select>
                {selectedClassFilter !== 'all' && (
                  <button
                    type="button"
                    onClick={() => {
                      const found = classes.find((c) => c.name === selectedClassFilter);
                      if (found) handleOpenClassModal(found);
                    }}
                    className="flex items-center gap-1 ml-1 rounded-md bg-blue-100 hover:bg-blue-200 px-2 py-0.5 text-[11px] font-bold text-blue-800 transition"
                    title={`Edit Pengaturan Data Kelas ${selectedClassFilter}`}
                  >
                    <Edit className="h-3 w-3" />
                    <span>Edit Kelas</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => handleOpenSubjectModal()}
                  className="flex items-center gap-1 ml-1 rounded-md bg-emerald-100 hover:bg-emerald-200 px-2 py-0.5 text-[11px] font-bold text-emerald-800 transition"
                  title="Tambah / Edit Data Mata Pelajaran (Fan)"
                >
                  <BookOpen className="h-3 w-3" />
                  <span>+ Mapel</span>
                </button>
              </div>

              {/* Search */}
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Cari NIS atau nama murid..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="h-8 rounded-lg border border-slate-200 pl-8 pr-3 text-xs focus:border-blue-500 outline-none w-48 sm:w-60 bg-slate-50"
                />
              </div>
            </div>

            {/* Buttons */}
            <div className="flex flex-wrap items-center gap-2">
              {/* Collective / Bulk Delete Button */}
              <button
                type="button"
                id="btn-bulk-delete-students"
                onClick={() => {
                  if (selectedStudentIds.length === 0) {
                    if (filteredStudents.length > 0) {
                      // Select all in current filter and open modal directly or ask
                      handleSelectAllFilteredStudents();
                    } else {
                      alert('Tidak ada siswa yang dapat dipilih.');
                    }
                  } else {
                    setIsBulkDeleteModalOpen(true);
                  }
                }}
                className={`flex items-center gap-1.5 text-xs font-bold px-3.5 py-1.5 rounded-lg transition shadow-2xs ${
                  selectedStudentIds.length > 0
                    ? 'bg-red-600 hover:bg-red-700 text-white animate-pulse'
                    : 'bg-red-50 hover:bg-red-100 text-red-700 border border-red-200'
                }`}
                title={
                  selectedStudentIds.length > 0
                    ? `Hapus ${selectedStudentIds.length} siswa terpilih`
                    : 'Pilih siswa menggunakan kotak centang lalu hapus bersamaan'
                }
              >
                <Trash2 className="h-3.5 w-3.5" />
                <span>
                  Hapus Kolektif {selectedStudentIds.length > 0 ? `(${selectedStudentIds.length})` : ''}
                </span>
              </button>

              <button
                onClick={() => ExcelService.downloadTemplate('students')}
                className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-lg transition"
                title="Unduh format template Excel untuk import siswa masal"
              >
                <Download className="h-3.5 w-3.5" /> Template Excel
              </button>

              <label className="flex items-center gap-1.5 text-xs font-bold text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 px-3 py-1.5 rounded-lg transition cursor-pointer shadow-2xs">
                <Upload className="h-3.5 w-3.5 text-blue-600" /> Import CSV/Excel
                <input
                  ref={studentFileInputRef}
                  type="file"
                  accept=".xlsx,.xls,.csv"
                  onChange={handleStudentFileImport}
                  className="hidden"
                />
              </label>

              <button
                onClick={() => ExcelService.exportStudentsToExcel(students)}
                className="flex items-center gap-1.5 text-xs font-bold text-emerald-800 bg-emerald-50 border border-emerald-300 hover:bg-emerald-100 px-3 py-1.5 rounded-lg transition"
              >
                <FileSpreadsheet className="h-3.5 w-3.5 text-emerald-600" /> Export Excel
              </button>

              <button
                onClick={() => handleOpenStudentModal()}
                className="flex items-center gap-1.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 px-3.5 py-1.5 rounded-lg transition shadow-2xs"
              >
                <Plus className="h-3.5 w-3.5" /> Tambah Siswa
              </button>
            </div>
          </div>

          {/* Floating / Contextual Selection Banner */}
          {selectedStudentIds.length > 0 && (
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-xs text-red-900 shadow-xs animate-in fade-in">
              <div className="flex items-center gap-2">
                <CheckSquare className="h-4 w-4 text-red-600" />
                <span className="font-bold">
                  {selectedStudentIds.length} dari {students.length} siswa dipilih
                </span>
                <span className="text-red-600/70 hidden sm:inline">
                  (Beri centang pada siswa yang ingin dihapus sekaligus)
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleSelectAllFilteredStudents}
                  className="rounded-lg bg-white border border-red-200 px-2.5 py-1 font-semibold text-red-700 hover:bg-red-100 transition"
                >
                  {filteredStudents.every((s) => selectedStudentIds.includes(s.id))
                    ? 'Batal Pilih Semua Tampilan'
                    : `Pilih Semua (${filteredStudents.length})`}
                </button>
                <button
                  type="button"
                  onClick={handleClearStudentSelection}
                  className="rounded-lg bg-white border border-slate-200 px-2.5 py-1 font-semibold text-slate-600 hover:bg-slate-100 transition"
                >
                  Batalkan Pilihan
                </button>
                <button
                  type="button"
                  onClick={() => setIsBulkDeleteModalOpen(true)}
                  className="flex items-center gap-1 rounded-lg bg-red-600 px-3 py-1 font-bold text-white hover:bg-red-700 transition shadow-2xs"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  Hapus {selectedStudentIds.length} Siswa Terpilih
                </button>
              </div>
            </div>
          )}

          {/* Students Table */}
          <div className="rounded-xl border border-slate-200 bg-white shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
                  <tr>
                    <th className="px-3 py-3 text-center w-10">
                      <input
                        type="checkbox"
                        checked={
                          filteredStudents.length > 0 &&
                          filteredStudents.every((s) => selectedStudentIds.includes(s.id))
                        }
                        onChange={handleSelectAllFilteredStudents}
                        className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                        title="Pilih / Batal Semua Siswa yang Ditampilkan"
                      />
                    </th>
                    <th className="px-3 py-3 text-center w-10">NO</th>
                    <th className="px-4 py-3">NIS</th>
                    <th className="px-4 py-3">NAMA MURID</th>
                    <th className="px-4 py-3 text-center">L/P</th>
                    <th className="px-4 py-3 text-center">KELAS</th>
                    <th className="px-4 py-3">NO TELEPON</th>
                    <th className="px-4 py-3 text-center">STATUS</th>
                    <th className="px-4 py-3 text-center w-24">AKSI</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {filteredStudents.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="py-8 text-center text-slate-400">
                        Tidak ada data siswa yang ditemukan.
                      </td>
                    </tr>
                  ) : (
                    filteredStudents.map((s, idx) => {
                      const isSelected = selectedStudentIds.includes(s.id);
                      return (
                        <tr
                          key={s.id}
                          className={`transition ${
                            isSelected ? 'bg-red-50/50 hover:bg-red-50/80' : 'hover:bg-slate-50/70'
                          }`}
                        >
                          <td className="px-3 py-2.5 text-center">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => handleToggleSelectStudent(s.id)}
                              className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                            />
                          </td>
                          <td className="px-3 py-2.5 text-center font-medium text-slate-500">{idx + 1}</td>
                          <td className="px-4 py-2.5 font-mono font-medium text-slate-600">{s.nis}</td>
                          <td className="px-4 py-2.5 font-bold text-slate-900">{s.name}</td>
                          <td className="px-4 py-2.5 text-center">
                            <span
                              className={`inline-block rounded px-2 py-0.5 font-bold text-[10px] ${
                                s.gender === 'L' ? 'bg-sky-100 text-sky-800' : 'bg-pink-100 text-pink-800'
                              }`}
                            >
                              {s.gender}
                            </span>
                          </td>
                          <td className="px-4 py-2.5 text-center font-bold text-blue-700">{s.className}</td>
                          <td className="px-4 py-2.5 text-slate-600">{s.phone || '-'}</td>
                          <td className="px-4 py-2.5 text-center">
                            <span
                              className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold ${
                                s.active ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-slate-100 text-slate-500'
                              }`}
                            >
                              {s.active ? 'Aktif' : 'Non-Aktif'}
                            </span>
                          </td>
                          <td className="px-4 py-2.5 text-center">
                            <div className="flex items-center justify-center gap-1">
                              <button
                                onClick={() => handleOpenStudentModal(s)}
                                className="rounded p-1 text-slate-500 hover:bg-slate-200 hover:text-blue-600 transition"
                                title="Edit"
                              >
                                <Edit className="h-3.5 w-3.5" />
                              </button>
                              <button
                                onClick={() => handleDeleteStudent(s.id, s.name)}
                                className="rounded p-1 text-slate-500 hover:bg-red-100 hover:text-red-600 transition"
                                title="Hapus"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: DATA GURU */}
      {activeTab === 'teachers' && (
        <div className="space-y-4">
          {/* Action Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-white p-4 border border-slate-200 shadow-xs">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-400" />
              <input
                type="text"
                placeholder="Cari nama guru atau mata pelajaran..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-8 rounded-lg border border-slate-200 pl-8 pr-3 text-xs focus:border-blue-500 outline-none w-64 bg-slate-50"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => ExcelService.downloadTemplate('teachers')}
                className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-lg transition"
              >
                <Download className="h-3.5 w-3.5" /> Template Excel
              </button>

              <label className="flex items-center gap-1.5 text-xs font-bold text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 px-3 py-1.5 rounded-lg transition cursor-pointer shadow-2xs">
                <Upload className="h-3.5 w-3.5 text-blue-600" /> Import Excel/CSV
                <input
                  ref={teacherFileInputRef}
                  type="file"
                  accept=".xlsx,.xls,.csv"
                  onChange={handleTeacherFileImport}
                  className="hidden"
                />
              </label>

              <button
                onClick={() => ExcelService.exportTeachersToExcel(teachers)}
                className="flex items-center gap-1.5 text-xs font-bold text-emerald-800 bg-emerald-50 border border-emerald-300 hover:bg-emerald-100 px-3 py-1.5 rounded-lg transition"
              >
                <FileSpreadsheet className="h-3.5 w-3.5 text-emerald-600" /> Export Excel
              </button>

              <button
                onClick={() => handleOpenTeacherModal()}
                className="flex items-center gap-1.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 px-3.5 py-1.5 rounded-lg transition shadow-2xs"
              >
                <Plus className="h-3.5 w-3.5" /> Tambah Guru
              </button>
            </div>
          </div>

          {/* Teacher Table */}
          <div className="rounded-xl border border-slate-200 bg-white shadow-xs overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3 text-center w-12">NO</th>
                  <th className="px-4 py-3">NIP / ID</th>
                  <th className="px-4 py-3">NAMA LENGKAP GURU</th>
                  <th className="px-4 py-3">JABATAN</th>
                  <th className="px-4 py-3">MATA PELAJARAN / FAN</th>
                  <th className="px-4 py-3 text-center">WALI KELAS</th>
                  <th className="px-4 py-3">NO TELEPON</th>
                  <th className="px-4 py-3 text-center w-24">AKSI</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {filteredTeachers.map((t, idx) => (
                  <tr key={t.id} className="hover:bg-slate-50/70 transition">
                    <td className="px-4 py-2.5 text-center font-medium text-slate-500">{idx + 1}</td>
                    <td className="px-4 py-2.5 font-mono text-slate-600">{t.nip || '-'}</td>
                    <td className="px-4 py-2.5 font-bold text-slate-900">{t.name}</td>
                    <td className="px-4 py-2.5">
                      <span className="rounded bg-blue-50 px-2 py-0.5 font-semibold text-blue-800 border border-blue-200 text-[10px]">
                        {t.role}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 font-semibold text-slate-700">{t.subject || '-'}</td>
                    <td className="px-4 py-2.5 text-center font-bold text-slate-700">
                      {t.assignedClass || '-'}
                    </td>
                    <td className="px-4 py-2.5 text-slate-600">{t.phone || '-'}</td>
                    <td className="px-4 py-2.5 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => handleOpenTeacherModal(t)}
                          className="rounded p-1 text-slate-500 hover:bg-slate-200 hover:text-blue-600 transition"
                        >
                          <Edit className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteTeacher(t.id, t.name)}
                          className="rounded p-1 text-slate-500 hover:bg-red-100 hover:text-red-600 transition"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: DATA KELAS */}
      {activeTab === 'classes' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center bg-white p-4 rounded-xl border border-slate-200">
            <div>
              <h3 className="font-bold text-slate-800 text-sm">Daftar Tingkat & Rombongan Belajar</h3>
              <p className="text-xs text-slate-500">Kelola kelas, jenjang, wali kelas, dan filter analisa nilai siswa</p>
            </div>
            <button
              onClick={() => handleOpenClassModal()}
              className="flex items-center gap-1.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 px-3.5 py-1.5 rounded-lg transition shadow-2xs"
            >
              <Plus className="h-3.5 w-3.5" /> Tambah Kelas
            </button>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-4">
            {classes.map((c) => {
              const studentCount = students.filter((s) => isSameClass(s.className, c.name)).length;
              return (
                <div key={c.id} className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs flex flex-col justify-between hover:border-blue-300 transition group">
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="text-2xl font-black text-blue-700">Kelas {c.name}</span>
                      <span className="rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-bold text-blue-700 border border-blue-200">
                        {studentCount} Siswa
                      </span>
                    </div>
                    <p className="mt-2 text-xs font-semibold text-slate-600">{c.level}</p>
                    <p className="text-xs text-slate-400">{c.academicYear}</p>
                  </div>
                  <div className="mt-3 pt-3 border-t border-slate-100 flex justify-between items-center text-xs">
                    <span className="text-slate-500 truncate max-w-[130px]" title={c.waliKelasName || 'Belum diatur'}>
                      Wali: <b className="text-slate-700">{c.waliKelasName || 'Belum diatur'}</b>
                    </span>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleOpenClassModal(c)}
                        className="rounded p-1 text-slate-500 hover:bg-blue-50 hover:text-blue-600 transition"
                        title="Edit Data Kelas"
                      >
                        <Edit className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeleteClass(c.id, c.name)}
                        className="rounded p-1 text-slate-500 hover:bg-red-50 hover:text-red-600 transition"
                        title="Hapus Kelas"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 4: MATA PELAJARAN */}
      {activeTab === 'subjects' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center bg-white p-4 rounded-xl border border-slate-200">
            <div>
              <h3 className="font-bold text-slate-800 text-sm">Daftar Mata Pelajaran (Fan) & KKM</h3>
              <p className="text-xs text-slate-500">Kelola kurikulum, kode fan, dan nilai ambang batas kelulusan (KKM)</p>
            </div>
            <button
              onClick={() => handleOpenSubjectModal()}
              className="flex items-center gap-1.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 px-3.5 py-1.5 rounded-lg transition shadow-2xs"
            >
              <Plus className="h-3.5 w-3.5" /> Tambah Mata Pelajaran
            </button>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
            {subjects.map((s) => (
              <div key={s.id} className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs flex flex-col justify-between hover:border-blue-300 transition group">
                <div>
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="font-mono text-xs font-bold text-slate-400">{s.code}</span>
                      <h4 className="font-bold text-slate-900 text-base">{s.name}</h4>
                      <span className="inline-block mt-1 rounded bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-600">
                        {s.category || 'Bidang Syari\'ah'}
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] uppercase font-bold text-slate-400">KKM</span>
                      <div className="text-2xl font-black text-emerald-600">{s.kkm}</div>
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 flex justify-end items-center gap-1.5 text-xs">
                  <button
                    onClick={() => handleOpenSubjectModal(s)}
                    className="flex items-center gap-1 rounded px-2.5 py-1 text-slate-600 hover:bg-blue-50 hover:text-blue-700 font-semibold transition"
                    title="Edit Mata Pelajaran"
                  >
                    <Edit className="h-3.5 w-3.5" />
                    <span>Edit</span>
                  </button>
                  <button
                    onClick={() => handleDeleteSubject(s.id, s.name)}
                    className="flex items-center gap-1 rounded px-2.5 py-1 text-slate-600 hover:bg-red-50 hover:text-red-700 font-semibold transition"
                    title="Hapus Mata Pelajaran"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    <span>Hapus</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Modal: Add/Edit Student */}
      {isStudentModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl border border-slate-200">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-slate-800 text-base">
                {editingStudent ? 'Edit Data Murid' : 'Tambah Murid Baru'}
              </h3>
              <button onClick={() => setIsStudentModalOpen(false)} className="text-slate-400 hover:text-slate-700">
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleSaveStudent} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Nama Lengkap Murid</label>
                <input
                  type="text"
                  required
                  value={studentForm.name || ''}
                  onChange={(e) => setStudentForm({ ...studentForm, name: e.target.value })}
                  placeholder="e.g. JAMALUDDIN HIDAYAH"
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 outline-none uppercase"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">NIS</label>
                  <input
                    type="text"
                    value={studentForm.nis || ''}
                    onChange={(e) => setStudentForm({ ...studentForm, nis: e.target.value })}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Kelas</label>
                  <select
                    value={studentForm.className || classes[0]?.name || 'I - SATU'}
                    onChange={(e) => setStudentForm({ ...studentForm, className: e.target.value })}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 outline-none font-bold text-blue-700"
                  >
                    {classes.map((c) => (
                      <option key={c.id} value={c.name}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Jenis Kelamin</label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-1.5 text-sm">
                    <input
                      type="radio"
                      name="m_gender"
                      checked={studentForm.gender === 'L'}
                      onChange={() => setStudentForm({ ...studentForm, gender: 'L' })}
                    />
                    Laki-laki (L)
                  </label>
                  <label className="flex items-center gap-1.5 text-sm">
                    <input
                      type="radio"
                      name="m_gender"
                      checked={studentForm.gender === 'P'}
                      onChange={() => setStudentForm({ ...studentForm, gender: 'P' })}
                    />
                    Perempuan (P)
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">No Telepon / WhatsApp Orang Tua</label>
                <input
                  type="text"
                  value={studentForm.phone || ''}
                  onChange={(e) => setStudentForm({ ...studentForm, phone: e.target.value })}
                  placeholder="08123456789"
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsStudentModalOpen(false)}
                  className="rounded-lg border border-slate-300 px-4 py-2 text-sm text-slate-700 hover:bg-slate-100"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-blue-600 px-5 py-2 text-sm font-bold text-white hover:bg-blue-700 shadow-sm"
                >
                  Simpan Data
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Add/Edit Teacher */}
      {isTeacherModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl border border-slate-200">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-slate-800 text-base">
                {editingTeacher ? 'Edit Data Guru' : 'Tambah Guru Baru'}
              </h3>
              <button onClick={() => setIsTeacherModalOpen(false)} className="text-slate-400 hover:text-slate-700">
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleSaveTeacher} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Nama Lengkap & Gelar</label>
                <input
                  type="text"
                  required
                  value={teacherForm.name || ''}
                  onChange={(e) => setTeacherForm({ ...teacherForm, name: e.target.value })}
                  placeholder="e.g. Ust. Faishol, S.Pd.I"
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">NIP / ID</label>
                  <input
                    type="text"
                    value={teacherForm.nip || ''}
                    onChange={(e) => setTeacherForm({ ...teacherForm, nip: e.target.value })}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Jabatan</label>
                  <select
                    value={teacherForm.role || 'Guru Pengampu'}
                    onChange={(e) => setTeacherForm({ ...teacherForm, role: e.target.value as any })}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 outline-none"
                  >
                    <option value="Kepala Madrasah">Kepala Madrasah</option>
                    <option value="Wali Kelas">Wali Kelas</option>
                    <option value="Guru Pengampu">Guru Pengampu</option>
                    <option value="Staf">Staf</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Mata Pelajaran (Fan)</label>
                  <select
                    value={teacherForm.subject || ''}
                    onChange={(e) => setTeacherForm({ ...teacherForm, subject: e.target.value })}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 outline-none"
                  >
                    <option value="">- Pilih Mapel -</option>
                    {subjects.map((s) => (
                      <option key={s.id} value={s.name}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Wali Kelas (Jika Ada)</label>
                  <select
                    value={teacherForm.assignedClass || ''}
                    onChange={(e) => setTeacherForm({ ...teacherForm, assignedClass: e.target.value })}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 outline-none"
                  >
                    <option value="">- Bukan Wali -</option>
                    {classes.map((c) => (
                      <option key={c.id} value={c.name}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">No Telepon / WhatsApp</label>
                <input
                  type="text"
                  value={teacherForm.phone || ''}
                  onChange={(e) => setTeacherForm({ ...teacherForm, phone: e.target.value })}
                  placeholder="08123456789"
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsTeacherModalOpen(false)}
                  className="rounded-lg border border-slate-300 px-4 py-2 text-sm text-slate-700 hover:bg-slate-100"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-blue-600 px-5 py-2 text-sm font-bold text-white hover:bg-blue-700 shadow-sm"
                >
                  Simpan Data
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Add/Edit Class */}
      {isClassModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-sm rounded-xl bg-white p-6 shadow-xl border border-slate-200">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-bold text-slate-800 text-base">
                  {editingClass ? `Edit Data Kelas: ${editingClass.name}` : 'Tambah Rombongan Belajar / Kelas'}
                </h3>
                <p className="text-xs text-slate-500">
                  {editingClass ? 'Perbarui informasi kelas & wali kelas' : 'Tambahkan kelas baru ke master data'}
                </p>
              </div>
              <button
                onClick={() => {
                  setIsClassModalOpen(false);
                  setEditingClass(null);
                }}
                className="text-slate-400 hover:text-slate-700"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleSaveClass} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Nama / Kode Kelas</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 1, 2, 7A, 10-MIPA"
                  value={classForm.name || ''}
                  onChange={(e) => setClassForm({ ...classForm, name: e.target.value })}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 outline-none"
                />
                {editingClass && (
                  <p className="text-[10px] text-blue-600 mt-1">
                    * Perubahan nama kelas akan otomatis disinkronkan ke seluruh siswa & guru di kelas ini.
                  </p>
                )}
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Tingkat / Jenjang</label>
                <input
                  type="text"
                  placeholder="e.g. Ibtidaiyah / Dasar"
                  value={classForm.level || ''}
                  onChange={(e) => setClassForm({ ...classForm, level: e.target.value })}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Tahun Ajaran</label>
                <input
                  type="text"
                  placeholder="e.g. 1447-1448 H / 2025-2026 M"
                  value={classForm.academicYear || ''}
                  onChange={(e) => setClassForm({ ...classForm, academicYear: e.target.value })}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Nama Wali Kelas</label>
                <input
                  type="text"
                  list="teacher-names-list"
                  placeholder="e.g. Ust. Ahmad Fauzi"
                  value={classForm.waliKelasName || ''}
                  onChange={(e) => setClassForm({ ...classForm, waliKelasName: e.target.value })}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 outline-none"
                />
                <datalist id="teacher-names-list">
                  {teachers.map((t) => (
                    <option key={t.id} value={t.name} />
                  ))}
                </datalist>
              </div>
              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => {
                    setIsClassModalOpen(false);
                    setEditingClass(null);
                  }}
                  className="rounded-lg border border-slate-300 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-bold text-white hover:bg-blue-700 transition shadow-2xs"
                >
                  {editingClass ? 'Simpan Perubahan' : 'Simpan Kelas'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Add/Edit Subject */}
      {isSubjectModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-sm rounded-xl bg-white p-6 shadow-xl border border-slate-200">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-bold text-slate-800 text-base">
                  {editingSubject ? `Edit Mapel: ${editingSubject.name}` : 'Tambah Mata Pelajaran (Fan)'}
                </h3>
                <p className="text-xs text-slate-500">
                  {editingSubject ? 'Perbarui informasi fan & batas KKM' : 'Tambahkan mata pelajaran baru ke kurikulum'}
                </p>
              </div>
              <button
                onClick={() => {
                  setIsSubjectModalOpen(false);
                  setEditingSubject(null);
                }}
                className="text-slate-400 hover:text-slate-700"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleSaveSubject} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Nama Mata Pelajaran (Fan)</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. TAJWID, BALAGHAH, FIQIH"
                  value={subjectForm.name || ''}
                  onChange={(e) => setSubjectForm({ ...subjectForm, name: e.target.value })}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 outline-none uppercase font-bold text-slate-800"
                />
                {editingSubject && (
                  <p className="text-[10px] text-blue-600 mt-1">
                    * Perubahan nama fan & KKM akan otomatis disinkronkan ke lembar analisa & guru pengampu terkait.
                  </p>
                )}
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Kode Singkat</label>
                  <input
                    type="text"
                    placeholder="e.g. TJD, BLG, FQH"
                    value={subjectForm.code || ''}
                    onChange={(e) => setSubjectForm({ ...subjectForm, code: e.target.value })}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 outline-none uppercase font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Nilai KKM (Ketuntasan)</label>
                  <input
                    type="number"
                    min="1"
                    max="100"
                    required
                    value={subjectForm.kkm ?? 70}
                    onChange={(e) => setSubjectForm({ ...subjectForm, kkm: Number(e.target.value) })}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 outline-none font-bold text-emerald-700"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Kategori / Rumpun Ilmu</label>
                <select
                  value={subjectForm.category || 'Syari\'ah'}
                  onChange={(e) => setSubjectForm({ ...subjectForm, category: e.target.value })}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 outline-none text-slate-700 font-medium"
                >
                  <option value="Syari'ah">Syari'ah / Fiqih</option>
                  <option value="Lughah / Bahasa">Lughah / Bahasa Arab</option>
                  <option value="Al-Qur'an & Hadits">Al-Qur'an & Hadits</option>
                  <option value="Akhlaq / Tasawwuf">Akhlaq / Tasawwuf</option>
                  <option value="Tauhid / Aqidah">Tauhid / Aqidah</option>
                  <option value="Tarikh / Sejarah">Tarikh / Sejarah Islam</option>
                  <option value="Umum">Umum / Pengetahuan</option>
                </select>
              </div>
              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => {
                    setIsSubjectModalOpen(false);
                    setEditingSubject(null);
                  }}
                  className="rounded-lg border border-slate-300 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-bold text-white hover:bg-blue-700 transition shadow-2xs"
                >
                  {editingSubject ? 'Simpan Perubahan' : 'Simpan Mata Pelajaran'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Bulk Delete Students Confirmation */}
      {isBulkDeleteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl border border-slate-200">
            <div className="flex items-start gap-4 mb-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-red-100 text-red-600">
                <AlertOctagon className="h-6 w-6" />
              </div>
              <div className="flex-1">
                <h3 className="text-base font-bold text-slate-900">
                  Hapus {selectedStudentIds.length} Data Siswa Terpilih?
                </h3>
                <p className="mt-1 text-xs text-slate-600">
                  Tindakan ini akan menghapus data siswa yang dipilih secara permanen dari daftar master data.
                </p>
              </div>
              <button
                onClick={() => setIsBulkDeleteModalOpen(false)}
                className="text-slate-400 hover:text-slate-700"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* List preview of selected students */}
            <div className="mb-5 rounded-xl border border-slate-200 bg-slate-50 p-3 max-h-48 overflow-y-auto">
              <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">
                Daftar Siswa yang Akan Dihapus ({selectedStudentIds.length}):
              </div>
              <ul className="space-y-1.5 divide-y divide-slate-200/60">
                {students
                  .filter((s) => selectedStudentIds.includes(s.id))
                  .map((s, idx) => (
                    <li key={s.id} className="pt-1.5 flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-[10px] text-slate-500">{idx + 1}.</span>
                        <span className="font-semibold text-slate-800">{s.name}</span>
                        <span className="text-[10px] font-mono text-slate-500">({s.nis})</span>
                      </div>
                      <span className="rounded bg-blue-100 px-1.5 py-0.5 text-[10px] font-bold text-blue-700">
                        Kelas {s.className}
                      </span>
                    </li>
                  ))}
              </ul>
            </div>

            <div className="flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setIsBulkDeleteModalOpen(false)}
                className="rounded-lg border border-slate-300 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition"
              >
                Batalkan
              </button>
              <button
                type="button"
                onClick={handleConfirmBulkDeleteStudents}
                className="flex items-center gap-1.5 rounded-lg bg-red-600 px-4 py-2 text-xs font-bold text-white hover:bg-red-700 transition shadow-sm"
              >
                <Trash2 className="h-4 w-4" />
                Ya, Hapus {selectedStudentIds.length} Siswa
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Single Item Delete Confirmation */}
      {deleteConfirmation && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl border border-slate-200">
            <div className="flex items-start gap-4 mb-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-red-100 text-red-600">
                <Trash2 className="h-6 w-6" />
              </div>
              <div className="flex-1">
                <h3 className="text-base font-bold text-slate-900">
                  {deleteConfirmation.title}
                </h3>
                <p className="mt-1 text-sm text-slate-600">
                  {deleteConfirmation.description}
                </p>
              </div>
              <button
                onClick={() => setDeleteConfirmation(null)}
                className="text-slate-400 hover:text-slate-700"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mt-6 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setDeleteConfirmation(null)}
                className="rounded-lg border border-slate-300 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition"
              >
                Batalkan
              </button>
              <button
                type="button"
                onClick={handleConfirmSingleDelete}
                className="flex items-center gap-1.5 rounded-lg bg-red-600 px-4 py-2 text-xs font-bold text-white hover:bg-red-700 transition shadow-sm"
              >
                <Trash2 className="h-4 w-4" />
                Ya, Hapus Data
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
