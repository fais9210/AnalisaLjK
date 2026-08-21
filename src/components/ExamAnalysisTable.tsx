import React, { useState } from 'react';
import {
  ClassGroup,
  ExamSheetConfig,
  QuestionAnalysis,
  Student,
  StudentScoreRow,
  Subject,
  Teacher,
} from '../types';
import { calculateRowScores, formatSignatureDate, getTeacherForClass, isSameClass } from '../services/analysisEngine';
import { SAMPLE_KELAS_1_SCORES } from '../data/initialData';
import {
  FileText,
  FileSpreadsheet,
  Save,
  Sliders,
  Sparkles,
  UserPlus,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  Search,
  Check,
  X,
  Edit2,
  Trash2,
  Layers,
  Users,
  RefreshCw,
  Calendar,
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface ExamAnalysisTableProps {
  config: ExamSheetConfig;
  rows: StudentScoreRow[];
  questionAnalyses: QuestionAnalysis[];
  classes: ClassGroup[];
  subjects: Subject[];
  allStudents: Student[];
  teachers?: Teacher[];
  onConfigChange: (newConfig: ExamSheetConfig) => void;
  onRowsChange: (newRows: StudentScoreRow[]) => void;
  onOpenConfigModal: () => void;
  onExportPdf: () => void;
  onExportExcel: () => void;
  onSaveRecord: () => void;
  onAddNewStudentToClass: (name: string, gender: 'L' | 'P') => void;
}

export const ExamAnalysisTable: React.FC<ExamAnalysisTableProps> = ({
  config,
  rows,
  questionAnalyses,
  classes,
  subjects,
  allStudents,
  teachers = [],
  onConfigChange,
  onRowsChange,
  onOpenConfigModal,
  onExportPdf,
  onExportExcel,
  onSaveRecord,
  onAddNewStudentToClass,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [inputMode, setInputMode] = useState<'quick' | 'direct'>('quick');
  const [editingStudentId, setEditingStudentId] = useState<string | null>(null);
  const [newStudentName, setNewStudentName] = useState('');
  const [newStudentGender, setNewStudentGender] = useState<'L' | 'P'>('L');
  const [showAddStudentModal, setShowAddStudentModal] = useState(false);
  const [quickNotification, setQuickNotification] = useState<string | null>(null);

  // Date Titimangsa Modal State
  const [showDateModal, setShowDateModal] = useState(false);
  const [tempDateLocation, setTempDateLocation] = useState('');
  const [tempDateDayMonth, setTempDateDayMonth] = useState('');
  const [tempDateHijri, setTempDateHijri] = useState('');

  const handleOpenDateModal = () => {
    setTempDateLocation(config.dateLocation || 'Karangnongko');
    setTempDateDayMonth(config.dateDayMonth !== undefined ? config.dateDayMonth : '.............');
    setTempDateHijri(config.dateHijri || '1448');
    setShowDateModal(true);
  };

  const handleSaveDateModal = (e: React.FormEvent) => {
    e.preventDefault();
    const updatedConfig: ExamSheetConfig = {
      ...config,
      dateLocation: tempDateLocation.trim() || 'Karangnongko',
      dateDayMonth: tempDateDayMonth.trim(),
      dateHijri: tempDateHijri.trim() || '1448',
      updatedAt: new Date().toISOString(),
    };
    onConfigChange(updatedConfig);
    setShowDateModal(false);
    showToast(`Titimangsa tanggal berhasil disimpan: ${formatSignatureDate(updatedConfig)}`);
  };

  const showToast = (msg: string) => {
    setQuickNotification(msg);
    setTimeout(() => setQuickNotification(null), 3000);
  };

  // Split questions
  const pgQuestions = config.questions.filter((q) => q.type === 'pg');
  const isianQuestions = config.questions.filter((q) => q.type === 'isian');
  const uraianQuestions = config.questions.filter((q) => q.type === 'uraian');

  // Handle cell click (Quick click cycles: 0 -> maxScore -> 0)
  const handleCellClick = (studentId: string, questionId: string, maxScore: number) => {
    if (inputMode === 'direct') return; // Handled by input change

    const updatedRows = rows.map((r) => {
      if (r.studentId === studentId) {
        const currentScore = Number(r.scores[questionId]) || 0;
        const newScore = currentScore >= maxScore ? 0 : maxScore;
        const newScores = { ...r.scores, [questionId]: newScore };

        // Recalculate row
        let correctCount = 0;
        let total = 0;
        for (const q of config.questions) {
          const s = newScores[q.id] !== undefined ? Number(newScores[q.id]) : 0;
          total += s;
          if (s >= q.maxScore) correctCount++;
        }

        return {
          ...r,
          scores: newScores,
          correctQuestionsCount: correctCount,
          wrongQuestionsCount: config.questions.length - correctCount,
          totalScore: total,
          isPassed: total >= config.kkm,
        };
      }
      return r;
    });

    onRowsChange(updatedRows);
  };

  // Handle direct numeric score change
  const handleScoreInputChange = (studentId: string, questionId: string, val: string, maxScore: number) => {
    let numeric = Number(val);
    if (isNaN(numeric) || numeric < 0) numeric = 0;
    if (numeric > maxScore) numeric = maxScore;

    const updatedRows = rows.map((r) => {
      if (r.studentId === studentId) {
        const newScores = { ...r.scores, [questionId]: numeric };

        let correctCount = 0;
        let total = 0;
        for (const q of config.questions) {
          const s = newScores[q.id] !== undefined ? Number(newScores[q.id]) : 0;
          total += s;
          if (s >= q.maxScore) correctCount++;
        }

        return {
          ...r,
          scores: newScores,
          correctQuestionsCount: correctCount,
          wrongQuestionsCount: config.questions.length - correctCount,
          totalScore: total,
          isPassed: total >= config.kkm,
        };
      }
      return r;
    });

    onRowsChange(updatedRows);
  };

  // Batch actions
  const handleSetAllMax = () => {
    const updated = rows.map((r) => {
      const fullScores: Record<string, number> = {};
      let total = 0;
      for (const q of config.questions) {
        fullScores[q.id] = q.maxScore;
        total += q.maxScore;
      }
      return {
        ...r,
        scores: fullScores,
        correctQuestionsCount: config.questions.length,
        wrongQuestionsCount: 0,
        totalScore: total,
        isPassed: true,
      };
    });
    onRowsChange(updated);
    confetti({ particleCount: 60, spread: 70, origin: { y: 0.6 } });
    showToast('Semua nilai siswa berhasil diisi nilai maksimal (100)!');
  };

  const handleResetAllScores = () => {
    if (!window.confirm('Yakin ingin mengosongkan semua isian nilai pada tabel ini?')) return;
    const updated = rows.map((r) => {
      const emptyScores: Record<string, number> = {};
      for (const q of config.questions) {
        emptyScores[q.id] = 0;
      }
      return {
        ...r,
        scores: emptyScores,
        correctQuestionsCount: 0,
        wrongQuestionsCount: config.questions.length,
        totalScore: 0,
        isPassed: false,
      };
    });
    onRowsChange(updated);
    showToast('Seluruh skor ujian berhasil dikosongkan.');
  };

  const handleGenerateRealisticScores = () => {
    const updated = rows.map((r) => {
      const simScores: Record<string, number> = {};
      let total = 0;
      let correct = 0;

      // Realistic pass likelihood between 65% - 95%
      const studentProficiency = 0.55 + Math.random() * 0.42;

      for (const q of config.questions) {
        const passChance =
          q.type === 'pg'
            ? studentProficiency + 0.1
            : q.type === 'isian'
            ? studentProficiency
            : studentProficiency - 0.12;

        if (Math.random() < passChance) {
          simScores[q.id] = q.maxScore;
          total += q.maxScore;
          correct++;
        } else {
          simScores[q.id] = 0;
        }
      }

      return {
        ...r,
        scores: simScores,
        correctQuestionsCount: correct,
        wrongQuestionsCount: config.questions.length - correct,
        totalScore: total,
        isPassed: total >= config.kkm,
      };
    });

    onRowsChange(updated);
    confetti({ particleCount: 40, spread: 50 });
    showToast('Nilai simulasi realistis berhasil diterapkan.');
  };

  const handleClassFilterChange = (newClass: string) => {
    const foundClass = classes.find((c) => isSameClass(c.name, newClass));
    // Sesuaikan guru pengampu/wali kelas dengan database master data
    const newTeacherName = getTeacherForClass(newClass, classes, teachers);
    const academicYear = foundClass?.academicYear || config.academicYear;

    const updatedConfig: ExamSheetConfig = {
      ...config,
      className: newClass,
      teacherName: newTeacherName,
      academicYear,
    };
    onConfigChange(updatedConfig);

    // Filter students for this class
    const classStudents = allStudents.filter((s) => isSameClass(s.className, newClass) && s.active);
    const existingRowsMap = new Map<string, StudentScoreRow>(rows.map((r) => [r.studentId, r]));

    const newRows: StudentScoreRow[] = classStudents.map((s) => {
      const existing = existingRowsMap.get(s.id);
      if (existing) {
        return {
          ...existing,
          studentName: s.name,
          isPassed: existing.totalScore >= updatedConfig.kkm,
        };
      }

      // If switching to class 1, check sample scores
      const sampleScores = isSameClass(newClass, '1') ? (SAMPLE_KELAS_1_SCORES[s.id] || {}) : {};
      const { correctQuestionsCount, wrongQuestionsCount, totalScore, isPassed } = calculateRowScores(
        sampleScores,
        updatedConfig
      );

      return {
        studentId: s.id,
        studentName: s.name,
        scores: sampleScores,
        correctQuestionsCount,
        wrongQuestionsCount,
        totalScore,
        isPassed,
      };
    });

    onRowsChange(newRows);
    showToast(
      `Beralih ke Kelas ${newClass} • Guru Pengampu: ${newTeacherName || 'Belum diatur'} (${newRows.length} siswa)`
    );
  };

  const handleSyncWithMasterData = () => {
    const classStudents = allStudents.filter((s) => isSameClass(s.className, config.className) && s.active);
    const existingRowsMap = new Map<string, StudentScoreRow>(rows.map((r) => [r.studentId, r]));

    const syncedRows: StudentScoreRow[] = classStudents.map((s) => {
      const existing = existingRowsMap.get(s.id);
      if (existing) {
        return {
          ...existing,
          studentName: s.name,
          isPassed: existing.totalScore >= config.kkm,
        };
      }

      const sampleScores = isSameClass(config.className, '1') ? (SAMPLE_KELAS_1_SCORES[s.id] || {}) : {};
      const { correctQuestionsCount, wrongQuestionsCount, totalScore, isPassed } = calculateRowScores(
        sampleScores,
        config
      );

      return {
        studentId: s.id,
        studentName: s.name,
        scores: sampleScores,
        correctQuestionsCount,
        wrongQuestionsCount,
        totalScore,
        isPassed,
      };
    });

    onRowsChange(syncedRows);
    showToast(`Data siswa Kelas ${config.className} berhasil disinkronkan (${syncedRows.length} siswa).`);
  };

  const handleSubjectFilterChange = (newSubject: string) => {
    const selectedSbj = subjects.find((s) => s.name === newSubject);
    const newKkm = selectedSbj ? selectedSbj.kkm : config.kkm;
    onConfigChange({
      ...config,
      subjectName: newSubject,
      kkm: newKkm,
    });
    const updatedRows = rows.map((r) => ({
      ...r,
      isPassed: r.totalScore >= newKkm,
    }));
    onRowsChange(updatedRows);
  };

  const handleTeacherFilterChange = (newTeacherName: string) => {
    onConfigChange({
      ...config,
      teacherName: newTeacherName,
    });
    showToast(`Guru Pengampu dipilih: ${newTeacherName}`);
  };

  const handleRemoveRow = (studentId: string) => {
    if (confirm('Hapus siswa ini dari lembar analisa saat ini?')) {
      onRowsChange(rows.filter((r) => r.studentId !== studentId));
    }
  };

  const handleAddStudentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStudentName.trim()) return;
    onAddNewStudentToClass(newStudentName.trim().toUpperCase(), newStudentGender);
    setNewStudentName('');
    setShowAddStudentModal(false);
    showToast('Siswa baru berhasil ditambahkan!');
  };

  const filteredRows = rows.filter((r) =>
    r.studentName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-4">
      {/* Toast alert */}
      {quickNotification && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-3 text-sm font-medium text-white shadow-xl animate-bounce">
          <CheckCircle2 className="h-4 w-4 text-green-400" />
          {quickNotification}
        </div>
      )}

      {/* Action Toolbar & Filters */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-white p-4 border border-slate-200 shadow-xs">
        {/* Left: Filters */}
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="flex items-center gap-1.5 bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200">
            <span className="text-xs font-bold text-slate-600">Kelas:</span>
            <select
              id="select-filter-class"
              value={config.className}
              onChange={(e) => handleClassFilterChange(e.target.value)}
              className="bg-transparent text-sm font-bold text-blue-700 outline-none cursor-pointer"
            >
              {classes.map((c) => (
                <option key={c.id} value={c.name}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-1.5 bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200">
            <span className="text-xs font-bold text-slate-600">Fan / Mapel:</span>
            <select
              id="select-filter-subject"
              value={config.subjectName}
              onChange={(e) => handleSubjectFilterChange(e.target.value)}
              className="bg-transparent text-sm font-bold text-blue-700 outline-none cursor-pointer"
            >
              {subjects.map((s) => (
                <option key={s.id} value={s.name}>
                  {s.name} (KKM: {s.kkm})
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-1.5 bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200">
            <span className="text-xs font-bold text-slate-600">Guru:</span>
            <select
              id="select-filter-teacher"
              value={config.teacherName || ''}
              onChange={(e) => handleTeacherFilterChange(e.target.value)}
              className="bg-transparent text-sm font-bold text-blue-700 outline-none cursor-pointer max-w-[170px] sm:max-w-[210px] truncate"
            >
              <option value="">-- Belum Diatur --</option>
              {config.teacherName && !teachers.some((t) => t.name === config.teacherName) && (
                <option value={config.teacherName}>{config.teacherName}</option>
              )}
              {teachers.map((t) => (
                <option key={t.id} value={t.name}>
                  {t.name}
                </option>
              ))}
            </select>
          </div>

          {/* Search student in table */}
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-400" />
            <input
              id="input-search-table-student"
              type="text"
              placeholder="Cari nama murid..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-8 rounded-lg border border-slate-200 pl-8 pr-3 text-xs focus:border-blue-500 focus:outline-none w-36 sm:w-48 bg-slate-50"
            />
          </div>

          {/* Input Mode Switch */}
          <div className="flex items-center rounded-lg bg-slate-100 p-0.5 border border-slate-200 text-xs">
            <button
              id="btn-mode-quick"
              onClick={() => setInputMode('quick')}
              className={`rounded-md px-2.5 py-1 font-semibold transition ${
                inputMode === 'quick' ? 'bg-white text-blue-700 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
              }`}
              title="Klik kotak tabel untuk otomatis toggle Benar/Salah (0 atau Full Poin)"
            >
              ⚡ Klik Cepat (0/Poin)
            </button>
            <button
              id="btn-mode-direct"
              onClick={() => setInputMode('direct')}
              className={`rounded-md px-2.5 py-1 font-semibold transition ${
                inputMode === 'direct' ? 'bg-white text-blue-700 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
              }`}
              title="Ketik angka skor manual pada setiap kotak nilai"
            >
              🔢 Input Manual
            </button>
          </div>
        </div>

        {/* Right: Actions */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Quick automation tools dropdown / buttons */}
          <button
            id="btn-quick-fill-all"
            onClick={handleSetAllMax}
            className="flex items-center gap-1 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-200 px-2.5 py-1.5 rounded-lg transition"
            title="Isi semua nomor dengan nilai penuh (100)"
          >
            <CheckCircle2 className="h-3.5 w-3.5 text-green-600" /> Semua Benar
          </button>

          <button
            id="btn-quick-demo-scores"
            onClick={handleGenerateRealisticScores}
            className="flex items-center gap-1 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-200 px-2.5 py-1.5 rounded-lg transition"
            title="Isi nilai realistis untuk pengujian"
          >
            <Sparkles className="h-3.5 w-3.5 text-amber-500" /> Nilai Demo
          </button>

          <button
            id="btn-quick-reset"
            onClick={handleResetAllScores}
            className="flex items-center gap-1 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-red-50 hover:text-red-700 border border-slate-200 px-2 py-1.5 rounded-lg transition"
            title="Kosongkan semua nilai"
          >
            <RotateCcw className="h-3.5 w-3.5" />
          </button>

          <div className="h-5 w-px bg-slate-200 mx-1 hidden sm:block"></div>

          <button
            id="btn-sync-students-toolbar"
            onClick={handleSyncWithMasterData}
            title="Sinkronkan daftar siswa kelas ini dari Data Siswa"
            className="flex items-center gap-1.5 text-xs font-bold text-slate-700 bg-white hover:bg-slate-100 border border-slate-300 px-3 py-1.5 rounded-lg transition shadow-2xs"
          >
            <RefreshCw className="h-3.5 w-3.5 text-blue-600" /> Sinkron Siswa
          </button>

          <button
            id="btn-open-config"
            onClick={onOpenConfigModal}
            className="flex items-center gap-1.5 text-xs font-bold text-slate-700 bg-white hover:bg-slate-100 border border-slate-300 px-3 py-1.5 rounded-lg transition shadow-2xs"
          >
            <Sliders className="h-3.5 w-3.5 text-slate-600" /> Format Soal
          </button>

          <button
            id="btn-add-student-row"
            onClick={() => setShowAddStudentModal(true)}
            className="flex items-center gap-1.5 text-xs font-bold text-slate-700 bg-white hover:bg-slate-100 border border-slate-300 px-3 py-1.5 rounded-lg transition shadow-2xs"
          >
            <UserPlus className="h-3.5 w-3.5 text-blue-600" /> Tambah Murid
          </button>

          {/* Export PDF Button */}
          <button
            id="btn-export-pdf"
            onClick={onExportPdf}
            className="flex items-center gap-1.5 text-xs font-bold text-white bg-red-600 hover:bg-red-700 px-3 py-1.5 rounded-lg transition shadow-2xs"
          >
            <FileText className="h-3.5 w-3.5" /> Ekspor PDF
          </button>

          {/* Export Excel Button */}
          <button
            id="btn-export-excel"
            onClick={onExportExcel}
            className="flex items-center gap-1.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 px-3 py-1.5 rounded-lg transition shadow-2xs"
          >
            <FileSpreadsheet className="h-3.5 w-3.5" /> Ekspor Excel
          </button>

          {/* Save to History Button */}
          <button
            id="btn-save-record"
            onClick={() => {
              onSaveRecord();
              showToast('Hasil analisis ujian berhasil disimpan ke database riwayat!');
            }}
            className="flex items-center gap-1.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 px-3.5 py-1.5 rounded-lg transition shadow-xs"
          >
            <Save className="h-3.5 w-3.5" /> Simpan
          </button>
        </div>
      </div>

      {/* Main Authentic Sheet Container */}
      <div
        id="official-sheet-container"
        className="rounded-xl border border-slate-300 bg-white p-4 sm:p-6 shadow-sm overflow-hidden"
      >
        {/* Top Header matching the uploaded image */}
        <div className="mb-4 text-center border-b border-slate-200 pb-4">
          <h2 className="text-base sm:text-lg font-black tracking-wide text-slate-900 uppercase">
            {config.title}
          </h2>
          <h3 className="text-sm sm:text-base font-bold text-slate-800 uppercase tracking-wider">
            {config.schoolName}
          </h3>
          <h4 className="text-xs sm:text-sm font-semibold text-slate-700 uppercase">
            {config.academicYear}
          </h4>

          {/* Meta Info Bar */}
          <div className="mt-3 flex flex-wrap items-center justify-between px-2 text-xs sm:text-sm font-bold text-slate-800">
            <div className="flex items-center gap-6">
              <span>
                KELAS : <span className="text-blue-700 underline underline-offset-4">{config.className}</span>
              </span>
              <span>
                FAN : <span className="text-blue-700 underline underline-offset-4">{config.subjectName}</span>
              </span>
            </div>
            <div className="flex items-center gap-4 text-xs font-semibold text-slate-600">
              <span className="rounded bg-blue-50 px-2.5 py-1 text-blue-800 border border-blue-200">
                KKM: <b>{config.kkm}</b>
              </span>
              <span className="rounded bg-slate-100 px-2.5 py-1 text-slate-700 border border-slate-200">
                Jumlah Siswa: <b>{rows.length}</b>
              </span>
            </div>
          </div>
        </div>

        {/* Scrollable Matrix Table */}
        <div className="overflow-x-auto rounded-lg border border-slate-400">
          <table id="exam-analysis-matrix-table" className="w-full border-collapse text-center text-xs">
            <thead>
              {/* Top grouped header */}
              <tr className="bg-slate-100 text-slate-900 border-b border-slate-400">
                <th
                  rowSpan={2}
                  className="w-10 border-r border-slate-400 px-2 py-2 font-black text-center"
                >
                  NO
                </th>
                <th
                  rowSpan={2}
                  className="min-w-[180px] sm:min-w-[220px] border-r border-slate-400 px-3 py-2 font-black text-center"
                >
                  NAMA MURID
                </th>

                {/* Question category blocks */}
                {pgQuestions.length > 0 && (
                  <th
                    colSpan={pgQuestions.length}
                    className="border-r border-slate-400 bg-sky-200 text-sky-950 px-2 py-1.5 font-bold uppercase tracking-tight text-[11px]"
                  >
                    PILIHAN GANDA (POINT PER NOMOR {pgQuestions[0]?.maxScore || 5})
                  </th>
                )}

                {isianQuestions.length > 0 && (
                  <th
                    colSpan={isianQuestions.length}
                    className="border-r border-slate-400 bg-purple-200 text-purple-950 px-2 py-1.5 font-bold uppercase tracking-tight text-[11px]"
                  >
                    ISIAN (POIN PER NOMOR {isianQuestions[0]?.maxScore || 6})
                  </th>
                )}

                {uraianQuestions.length > 0 && (
                  <th
                    colSpan={uraianQuestions.length}
                    className="border-r border-slate-400 bg-emerald-200 text-emerald-950 px-2 py-1.5 font-bold uppercase tracking-tight text-[11px]"
                  >
                    URAIAN (POIN PER NOMOR {uraianQuestions[0]?.maxScore || 7})
                  </th>
                )}

                <th
                  rowSpan={2}
                  className="w-16 border-r border-slate-400 px-1 py-1 font-bold leading-tight text-[10px] bg-slate-100"
                >
                  JUMLAH<br />SOAL<br />BENAR
                </th>
                <th
                  rowSpan={2}
                  className="w-16 border-r border-slate-400 px-1 py-1 font-bold leading-tight text-[10px] bg-slate-100"
                >
                  JUMLAH<br />SOAL<br />SALAH
                </th>
                <th
                  rowSpan={2}
                  className="w-16 border-r border-slate-400 px-2 py-2 font-black text-[12px] bg-slate-200"
                >
                  NILAI
                </th>
                <th
                  rowSpan={2}
                  className="w-10 px-1 py-2 font-medium text-[10px] text-slate-400"
                >
                  AKSI
                </th>
              </tr>

              {/* Subheader: Question Numbers */}
              <tr className="border-b border-slate-400 text-slate-800 font-bold">
                {pgQuestions.map((q) => (
                  <th
                    key={q.id}
                    className="w-8 border-r border-slate-400 bg-sky-100 py-1 text-center font-bold text-sky-950"
                  >
                    {q.number}
                  </th>
                ))}
                {isianQuestions.map((q) => (
                  <th
                    key={q.id}
                    className="w-8 border-r border-slate-400 bg-purple-100 py-1 text-center font-bold text-purple-950"
                  >
                    {q.number}
                  </th>
                ))}
                {uraianQuestions.map((q) => (
                  <th
                    key={q.id}
                    className="w-8 border-r border-slate-400 bg-emerald-100 py-1 text-center font-bold text-emerald-950"
                  >
                    {q.number}
                  </th>
                ))}
              </tr>
            </thead>

            <tbody>
              {filteredRows.length === 0 ? (
                <tr>
                  <td
                    colSpan={config.questions.length + 6}
                    className="py-12 text-center text-slate-500 bg-slate-50/50"
                  >
                    <div className="flex flex-col items-center justify-center gap-2 max-w-md mx-auto">
                      <Users className="h-8 w-8 text-slate-400" />
                      <p className="font-semibold text-slate-700 text-sm">
                        Tidak ada siswa yang dimuat untuk Kelas {config.className}.
                      </p>
                      <p className="text-xs text-slate-500">
                        {allStudents.filter((s) => isSameClass(s.className, config.className) && s.active).length > 0
                          ? `Tersedia ${allStudents.filter((s) => isSameClass(s.className, config.className) && s.active).length} siswa di Master Data Siswa untuk Kelas ${config.className}.`
                          : `Belum ada siswa aktif terdaftar di Data Siswa untuk Kelas ${config.className}.`}
                      </p>
                      {allStudents.filter((s) => isSameClass(s.className, config.className) && s.active).length > 0 && (
                        <button
                          id="btn-sync-empty-class"
                          onClick={handleSyncWithMasterData}
                          className="mt-2 inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-xs font-bold text-white hover:bg-blue-700 shadow-sm transition"
                        >
                          <RefreshCw className="h-3.5 w-3.5" />
                          Muat {allStudents.filter((s) => isSameClass(s.className, config.className) && s.active).length} Siswa Kelas {config.className} ke Tabel
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                filteredRows.map((row, index) => {
                  const isPassing = row.totalScore >= config.kkm;

                  return (
                    <tr
                      key={row.studentId}
                      className="border-b border-slate-300 hover:bg-amber-50/40 transition-colors"
                    >
                      {/* NO */}
                      <td className="border-r border-slate-300 px-2 py-1.5 font-medium text-slate-700">
                        {index + 1}
                      </td>

                      {/* NAMA MURID */}
                      <td className="border-r border-slate-300 px-3 py-1.5 text-left font-bold text-slate-900 whitespace-nowrap">
                        {row.studentName}
                      </td>

                      {/* PG Question Cells */}
                      {pgQuestions.map((q) => {
                        const score = row.scores[q.id] !== undefined ? row.scores[q.id] : 0;
                        const isFull = score >= q.maxScore;

                        return (
                          <td
                            key={q.id}
                            onClick={() => handleCellClick(row.studentId, q.id, q.maxScore)}
                            className={`border-r border-slate-300 p-0 text-center font-bold transition select-none ${
                              inputMode === 'quick' ? 'cursor-pointer' : ''
                            } ${
                              isFull
                                ? 'bg-sky-100/70 text-sky-950 hover:bg-sky-200'
                                : score > 0
                                ? 'bg-amber-50 text-amber-900'
                                : 'bg-white text-slate-300 hover:bg-sky-50'
                            }`}
                          >
                            {inputMode === 'quick' ? (
                              <div className="flex h-7 items-center justify-center text-xs">
                                {score > 0 ? score : ''}
                              </div>
                            ) : (
                              <input
                                type="number"
                                min="0"
                                max={q.maxScore}
                                value={score}
                                onChange={(e) =>
                                  handleScoreInputChange(row.studentId, q.id, e.target.value, q.maxScore)
                                }
                                className="h-7 w-full text-center text-xs font-bold text-sky-950 bg-transparent outline-none focus:bg-sky-200"
                              />
                            )}
                          </td>
                        );
                      })}

                      {/* Isian Question Cells */}
                      {isianQuestions.map((q) => {
                        const score = row.scores[q.id] !== undefined ? row.scores[q.id] : 0;
                        const isFull = score >= q.maxScore;

                        return (
                          <td
                            key={q.id}
                            onClick={() => handleCellClick(row.studentId, q.id, q.maxScore)}
                            className={`border-r border-slate-300 p-0 text-center font-bold transition select-none ${
                              inputMode === 'quick' ? 'cursor-pointer' : ''
                            } ${
                              isFull
                                ? 'bg-purple-100/70 text-purple-950 hover:bg-purple-200'
                                : score > 0
                                ? 'bg-amber-50 text-amber-900'
                                : 'bg-white text-slate-300 hover:bg-purple-50'
                            }`}
                          >
                            {inputMode === 'quick' ? (
                              <div className="flex h-7 items-center justify-center text-xs">
                                {score > 0 ? score : ''}
                              </div>
                            ) : (
                              <input
                                type="number"
                                min="0"
                                max={q.maxScore}
                                value={score}
                                onChange={(e) =>
                                  handleScoreInputChange(row.studentId, q.id, e.target.value, q.maxScore)
                                }
                                className="h-7 w-full text-center text-xs font-bold text-purple-950 bg-transparent outline-none focus:bg-purple-200"
                              />
                            )}
                          </td>
                        );
                      })}

                      {/* Uraian Question Cells */}
                      {uraianQuestions.map((q) => {
                        const score = row.scores[q.id] !== undefined ? row.scores[q.id] : 0;
                        const isFull = score >= q.maxScore;

                        return (
                          <td
                            key={q.id}
                            onClick={() => handleCellClick(row.studentId, q.id, q.maxScore)}
                            className={`border-r border-slate-300 p-0 text-center font-bold transition select-none ${
                              inputMode === 'quick' ? 'cursor-pointer' : ''
                            } ${
                              isFull
                                ? 'bg-emerald-100/70 text-emerald-950 hover:bg-emerald-200'
                                : score > 0
                                ? 'bg-amber-50 text-amber-900'
                                : 'bg-white text-slate-300 hover:bg-emerald-50'
                            }`}
                          >
                            {inputMode === 'quick' ? (
                              <div className="flex h-7 items-center justify-center text-xs">
                                {score > 0 ? score : ''}
                              </div>
                            ) : (
                              <input
                                type="number"
                                min="0"
                                max={q.maxScore}
                                value={score}
                                onChange={(e) =>
                                  handleScoreInputChange(row.studentId, q.id, e.target.value, q.maxScore)
                                }
                                className="h-7 w-full text-center text-xs font-bold text-emerald-950 bg-transparent outline-none focus:bg-emerald-200"
                              />
                            )}
                          </td>
                        );
                      })}

                      {/* JUMLAH SOAL BENAR */}
                      <td className="border-r border-slate-300 px-1 py-1.5 font-bold text-slate-800 bg-slate-50/50">
                        {row.correctQuestionsCount}
                      </td>

                      {/* JUMLAH SOAL SALAH */}
                      <td className="border-r border-slate-300 px-1 py-1.5 font-bold text-slate-800 bg-slate-50/50">
                        {row.wrongQuestionsCount}
                      </td>

                      {/* NILAI */}
                      <td
                        className={`border-r border-slate-300 px-2 py-1.5 font-black text-sm ${
                          isPassing
                            ? 'bg-emerald-50 text-emerald-700'
                            : 'bg-red-50 text-red-700'
                        }`}
                      >
                        {row.totalScore}
                      </td>

                      {/* ACTION */}
                      <td className="px-1 py-1 text-center">
                        <button
                          onClick={() => handleRemoveRow(row.studentId)}
                          className="rounded p-1 text-slate-300 hover:bg-red-100 hover:text-red-600 transition"
                          title="Hapus baris"
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}

              {/* SUMMARY ROW 1: JUMLAH JAWABAN BENAR */}
              <tr className="border-t-2 border-b border-slate-400 bg-slate-100 font-bold text-slate-900">
                <td colSpan={2} className="border-r border-slate-400 px-3 py-2 text-center uppercase tracking-tight text-xs font-black">
                  JUMLAH JAWABAN BENAR
                </td>
                {config.questions.map((q) => {
                  const qa = questionAnalyses.find((a) => a.questionId === q.id);
                  const count = qa ? qa.correctCount : 0;
                  return (
                    <td
                      key={`sum-correct-${q.id}`}
                      className="border-r border-slate-400 py-2 text-center font-bold text-slate-900"
                    >
                      {count}
                    </td>
                  );
                })}
                <td colSpan={4} className="bg-slate-200"></td>
              </tr>

              {/* SUMMARY ROW 2: JUMLAH JAWABAN SALAH */}
              <tr className="border-b border-slate-400 bg-slate-100 font-bold text-slate-900">
                <td colSpan={2} className="border-r border-slate-400 px-3 py-2 text-center uppercase tracking-tight text-xs font-black">
                  JUMLAH JAWABAN SALAH
                </td>
                {config.questions.map((q) => {
                  const qa = questionAnalyses.find((a) => a.questionId === q.id);
                  const count = qa ? qa.wrongCount : 0;
                  return (
                    <td
                      key={`sum-wrong-${q.id}`}
                      className="border-r border-slate-400 py-2 text-center font-bold text-slate-900"
                    >
                      {count}
                    </td>
                  );
                })}
                <td colSpan={4} className="bg-slate-200"></td>
              </tr>

              {/* SUMMARY ROW 3: TINGKAT KESUKARAN */}
              <tr className="border-b-2 border-slate-400 bg-slate-50 text-[11px] font-semibold text-slate-800">
                <td colSpan={2} className="border-r border-slate-400 px-3 py-1.5 text-center uppercase font-bold text-slate-700">
                  TINGKAT KESUKARAN (P)
                </td>
                {config.questions.map((q) => {
                  const qa = questionAnalyses.find((a) => a.questionId === q.id);
                  const cat = qa?.difficultyCategory || 'Sedang';
                  const indexVal = qa?.difficultyIndex ?? 0;
                  return (
                    <td
                      key={`sum-diff-${q.id}`}
                      className={`border-r border-slate-400 py-1 text-center text-[10px] font-bold ${
                        cat === 'Mudah'
                          ? 'text-emerald-700 bg-emerald-50/60'
                          : cat === 'Sukar'
                          ? 'text-red-700 bg-red-50/60'
                          : 'text-amber-700 bg-amber-50/60'
                      }`}
                      title={`Indeks Kesukaran: ${indexVal}`}
                    >
                      {cat.charAt(0)}
                    </td>
                  );
                })}
                <td colSpan={4} className="text-[10px] text-slate-500 text-center px-1">
                  M=Mudah, S=Sedang, K=Sukar
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Signatures block matching the uploaded image */}
        <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 text-xs text-slate-800 pt-4">
          {/* Left signature */}
          <div className="flex flex-col items-center text-center">
            <p>Mengetahui,</p>
            <p className="font-semibold mb-14">Kepala Madrasah</p>
            <p className="font-bold underline underline-offset-4 uppercase tracking-wider text-slate-900">
              {config.headmasterName}
            </p>
          </div>

          {/* Right signature */}
          <div className="flex flex-col items-center text-center">
            <button
              type="button"
              onClick={handleOpenDateModal}
              title="Klik untuk mengubah tanggal titimangsa"
              className="group/date flex items-center gap-1.5 rounded-lg px-3 py-1 text-slate-800 hover:bg-blue-50 hover:text-blue-700 transition cursor-pointer border border-transparent hover:border-blue-200"
            >
              <span className="font-semibold text-xs">
                {formatSignatureDate(config)}
              </span>
              <Edit2 className="h-3.5 w-3.5 text-slate-400 opacity-60 group-hover/date:opacity-100 group-hover/date:text-blue-600 transition" />
            </button>
            <p className="font-semibold mb-14 mt-1">Wali Kelas / Guru Pengampu</p>
            <p className="font-bold underline underline-offset-4 uppercase tracking-wider text-slate-900">
              {config.teacherName || '...........................................'}
            </p>
          </div>
        </div>
      </div>

      {/* Date Titimangsa Modal */}
      {showDateModal && (
        <div
          id="date-titimangsa-modal-overlay"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs"
        >
          <div
            id="date-titimangsa-modal-card"
            className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl border border-slate-200 space-y-5"
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-600 text-white shadow-xs">
                  <Calendar className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-base">Edit Tanggal & Titimangsa</h3>
                  <p className="text-xs text-slate-500">Sesuaikan lokasi kota, tanggal/bulan, dan tahun pengesahan lembar analisa</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowDateModal(false)}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Live Preview Box */}
            <div className="rounded-xl bg-slate-50 p-3.5 border border-slate-200">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                Tampilan Hasil Titimangsa:
              </span>
              <p className="text-sm font-black text-blue-900">
                {tempDateLocation.trim() || 'Karangnongko'}, {tempDateDayMonth.trim() || '.............'} {tempDateHijri.trim() || '1448'}
              </p>
            </div>

            {/* Presets */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">Pilihan Cepat Format Tanggal:</label>
              <div className="flex flex-wrap gap-1.5">
                <button
                  type="button"
                  onClick={() => setTempDateDayMonth('.............')}
                  className={`rounded-lg px-2.5 py-1 text-xs font-semibold border transition ${
                    tempDateDayMonth === '.............'
                      ? 'bg-blue-600 text-white border-blue-600 shadow-2xs'
                      : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  Titik-titik (.............)
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const today = new Date();
                    const months = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
                    setTempDateDayMonth(`${today.getDate()} ${months[today.getMonth()]}`);
                    setTempDateHijri(`${today.getFullYear()} M`);
                  }}
                  className="rounded-lg px-2.5 py-1 text-xs font-semibold bg-white text-slate-700 border border-slate-200 hover:bg-slate-50 transition"
                >
                  Hari Ini (Masehi)
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setTempDateDayMonth("15 Sya'ban");
                    setTempDateHijri('1448 H');
                  }}
                  className="rounded-lg px-2.5 py-1 text-xs font-semibold bg-white text-slate-700 border border-slate-200 hover:bg-slate-50 transition"
                >
                  15 Sya'ban 1448 H
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setTempDateDayMonth("12 Rabi'ul Awwal");
                    setTempDateHijri('1448 H');
                  }}
                  className="rounded-lg px-2.5 py-1 text-xs font-semibold bg-white text-slate-700 border border-slate-200 hover:bg-slate-50 transition"
                >
                  12 Rabi'ul Awwal
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setTempDateDayMonth('10 Muharram');
                    setTempDateHijri('1448 H');
                  }}
                  className="rounded-lg px-2.5 py-1 text-xs font-semibold bg-white text-slate-700 border border-slate-200 hover:bg-slate-50 transition"
                >
                  10 Muharram
                </button>
              </div>
            </div>

            {/* Form Fields */}
            <form onSubmit={handleSaveDateModal} className="space-y-4">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <div className="sm:col-span-1">
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Kota / Lokasi
                  </label>
                  <input
                    type="text"
                    required
                    value={tempDateLocation}
                    onChange={(e) => setTempDateLocation(e.target.value)}
                    placeholder="e.g. Karangnongko"
                    className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-900 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
                  />
                </div>

                <div className="sm:col-span-1">
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Tanggal & Bulan
                  </label>
                  <input
                    type="text"
                    required
                    value={tempDateDayMonth}
                    onChange={(e) => setTempDateDayMonth(e.target.value)}
                    placeholder="e.g. ............. atau 15 Sya'ban"
                    className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-900 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
                  />
                </div>

                <div className="sm:col-span-1">
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Tahun
                  </label>
                  <input
                    type="text"
                    required
                    value={tempDateHijri}
                    onChange={(e) => setTempDateHijri(e.target.value)}
                    placeholder="e.g. 1448 atau 1447-1448 H"
                    className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-900 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowDateModal(false)}
                  className="rounded-xl border border-slate-300 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-blue-600 px-5 py-2 text-xs font-bold text-white hover:bg-blue-700 shadow-sm transition"
                >
                  Simpan Perubahan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Student Modal */}
      {showAddStudentModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl border border-slate-200">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-slate-800 text-base">Tambah Murid Baru ke Kelas {config.className}</h3>
              <button onClick={() => setShowAddStudentModal(false)} className="text-slate-400 hover:text-slate-700">
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleAddStudentSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Nama Lengkap Murid</label>
                <input
                  type="text"
                  required
                  value={newStudentName}
                  onChange={(e) => setNewStudentName(e.target.value)}
                  placeholder="e.g. AHMAD SYAFI'I"
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 outline-none uppercase"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Jenis Kelamin</label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-1.5 text-sm">
                    <input
                      type="radio"
                      name="gender"
                      checked={newStudentGender === 'L'}
                      onChange={() => setNewStudentGender('L')}
                    />
                    Laki-laki (L)
                  </label>
                  <label className="flex items-center gap-1.5 text-sm">
                    <input
                      type="radio"
                      name="gender"
                      checked={newStudentGender === 'P'}
                      onChange={() => setNewStudentGender('P')}
                    />
                    Perempuan (P)
                  </label>
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddStudentModal(false)}
                  className="rounded-lg border border-slate-300 px-4 py-2 text-sm text-slate-700 hover:bg-slate-100"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-bold text-white hover:bg-blue-700 shadow-sm"
                >
                  Tambahkan Siswa
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
