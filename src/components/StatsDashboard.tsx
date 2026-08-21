import React, { useState } from 'react';
import {
  AIAnalysisResult,
  ClassGroup,
  ExamSheetConfig,
  ExamStatistics,
  QuestionAnalysis,
  Student,
  StudentScoreRow,
  Subject,
  Teacher,
} from '../types';
import { calculateRowScores, getTeacherForClass, isSameClass } from '../services/analysisEngine';
import { SAMPLE_KELAS_1_SCORES } from '../data/initialData';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import {
  Award,
  AlertCircle,
  Brain,
  Sparkles,
  FileText,
  Users,
  CheckCircle2,
  BarChart3,
  BookOpen,
  UserCheck,
  Calendar,
  Layers,
  Check,
  RefreshCw,
  XCircle,
  HelpCircle,
  FileSpreadsheet,
} from 'lucide-react';
import { PdfService } from '../services/pdfService';
import { ExcelService } from '../services/excelService';

interface StatsDashboardProps {
  config: ExamSheetConfig;
  stats: ExamStatistics;
  rows: StudentScoreRow[];
  classes: ClassGroup[];
  subjects: Subject[];
  teachers?: Teacher[];
  allStudents?: Student[];
  onConfigChange?: (newConfig: ExamSheetConfig) => void;
  onRowsChange?: (newRows: StudentScoreRow[]) => void;
  onGenerateAiAnalysis: () => Promise<void>;
  aiAnalysis: AIAnalysisResult | null;
  isAiLoading: boolean;
  onExportReportPdf: () => void;
  onNavigateToPrintCenter?: () => void;
}

export const StatsDashboard: React.FC<StatsDashboardProps> = ({
  config,
  stats,
  rows,
  classes,
  subjects,
  teachers = [],
  allStudents = [],
  onConfigChange,
  onRowsChange,
  onGenerateAiAnalysis,
  aiAnalysis,
  isAiLoading,
  onExportReportPdf,
  onNavigateToPrintCenter,
}) => {
  const [activeChartTab, setActiveChartTab] = useState<'difficulty' | 'distribution' | 'discrimination'>('difficulty');

  const handleClassChange = (newClassName: string) => {
    if (!onConfigChange || !onRowsChange) return;
    const foundClass = classes.find((c) => isSameClass(c.name, newClassName));
    const teacherName = getTeacherForClass(newClassName, classes, teachers);
    const academicYear = foundClass?.academicYear || config.academicYear;

    const updatedConfig: ExamSheetConfig = {
      ...config,
      className: newClassName,
      teacherName,
      academicYear,
    };
    onConfigChange(updatedConfig);

    // Sync student score rows
    const classStudents = allStudents.filter((s) => isSameClass(s.className, newClassName) && s.active);
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

      const sampleScores = isSameClass(newClassName, 'I - SATU') ? (SAMPLE_KELAS_1_SCORES[s.id] || {}) : {};
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
  };

  const handleSubjectChange = (newSubjectName: string) => {
    if (!onConfigChange || !onRowsChange) return;
    const selectedSbj = subjects.find((s) => s.name === newSubjectName);
    const newKkm = selectedSbj ? selectedSbj.kkm : config.kkm;
    const updatedConfig: ExamSheetConfig = {
      ...config,
      subjectName: newSubjectName,
      kkm: newKkm,
    };
    onConfigChange(updatedConfig);

    const updatedRows = rows.map((r) => ({
      ...r,
      isPassed: r.totalScore >= newKkm,
    }));
    onRowsChange(updatedRows);
  };

  const handleTeacherChange = (newTeacherName: string) => {
    if (!onConfigChange) return;
    onConfigChange({
      ...config,
      teacherName: newTeacherName,
    });
  };

  // Chart data 1: Question item difficulty
  const questionDifficultyData = stats.questionAnalyses.map((q) => ({
    name: `No.${q.number}`,
    benar: q.correctCount,
    salah: q.wrongCount,
    indeks: Math.round(q.difficultyIndex * 100),
    kategori: q.difficultyCategory,
    dayaBeda: Math.round((q.discriminationIndex ?? 0) * 100),
    dayaBedaCat: q.discriminationCategory ?? '-',
    rekomendasi: q.itemRecommendation ?? 'Diterima',
  }));

  // Chart data 2: Grade distribution
  const gradeData = [
    { name: 'Sangat Baik (≥85)', count: stats.gradeDistribution.gradeA, color: '#10B981' },
    { name: 'Baik (75 - 84)', count: stats.gradeDistribution.gradeB, color: '#3B82F6' },
    { name: 'Cukup (KKM - 74)', count: stats.gradeDistribution.gradeC, color: '#F59E0B' },
    { name: 'Perlu Remedial (< KKM)', count: stats.gradeDistribution.gradeD, color: '#EF4444' },
  ];

  // Chart data 3: Pass vs Fail
  const passData = [
    { name: 'Tuntas (≥ KKM)', value: stats.passedCount, color: '#10B981' },
    { name: 'Belum Tuntas', value: stats.failedCount, color: '#EF4444' },
  ];

  const quality = stats.qualitySummary || {
    accepted: 0,
    revised: 0,
    rejected: 0,
    easyCount: 0,
    mediumCount: 0,
    hardCount: 0,
  };

  return (
    <div className="space-y-6">
      {/* Top Banner with Exam Meta and Quick Actions */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl bg-gradient-to-r from-blue-900 to-indigo-900 p-6 text-white shadow-md">
        <div>
          <div className="flex items-center gap-2 text-blue-200 text-xs font-bold uppercase tracking-wider mb-1">
            <BarChart3 className="h-4 w-4" /> Dashboard Analisis Statistik & Pedagogis Madrasah
          </div>
          <h2 className="text-xl sm:text-2xl font-black">{config.schoolName}</h2>
          <p className="text-sm text-blue-100 mt-0.5">
            {config.title} • Kelas {config.className} • Fan/Mapel: {config.subjectName} ({config.academicYear})
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            id="btn-ai-analyze"
            onClick={onGenerateAiAnalysis}
            disabled={isAiLoading}
            className="flex items-center gap-2 rounded-lg bg-amber-400 px-4 py-2.5 text-xs sm:text-sm font-bold text-slate-900 shadow-lg hover:bg-amber-300 transition disabled:opacity-50"
          >
            <Brain className="h-4 w-4 text-slate-900" />
            {isAiLoading ? 'Menganalisis Data...' : 'Analisis Cerdas Otomatis'}
          </button>

          <button
            onClick={() => ExcelService.exportComprehensiveReportToExcel(config, rows, stats, stats.questionAnalyses)}
            className="flex items-center gap-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 px-3.5 py-2.5 text-xs sm:text-sm font-bold text-white shadow-md transition"
            title="Ekspor Paket Excel Lengkap 5 Sheet"
          >
            <FileSpreadsheet className="h-4 w-4" />
            Paket Excel 5-in-1
          </button>

          <button
            id="btn-export-stats-pdf"
            onClick={onExportReportPdf}
            className="flex items-center gap-2 rounded-lg bg-white/10 hover:bg-white/20 border border-white/20 px-3.5 py-2.5 text-xs sm:text-sm font-bold text-white transition backdrop-blur-xs"
          >
            <FileText className="h-4 w-4" />
            Ekspor PDF
          </button>
        </div>
      </div>

      {/* Synchronized Data Control Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
        <div className="flex flex-wrap items-center gap-3">
          {/* Class Filter */}
          <div className="flex items-center gap-2 bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200">
            <Layers className="h-4 w-4 text-blue-600" />
            <span className="text-xs font-bold text-slate-600">Kelas:</span>
            <select
              value={config.className}
              onChange={(e) => handleClassChange(e.target.value)}
              className="bg-transparent text-sm font-bold text-blue-700 outline-none cursor-pointer"
            >
              {classes.map((c) => (
                <option key={c.id} value={c.name}>
                  {c.name} ({c.level})
                </option>
              ))}
            </select>
          </div>

          {/* Subject Filter */}
          <div className="flex items-center gap-2 bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200">
            <BookOpen className="h-4 w-4 text-emerald-600" />
            <span className="text-xs font-bold text-slate-600">Fan (Mapel):</span>
            <select
              value={config.subjectName}
              onChange={(e) => handleSubjectChange(e.target.value)}
              className="bg-transparent text-sm font-bold text-emerald-700 outline-none cursor-pointer uppercase"
            >
              {subjects.map((s) => (
                <option key={s.id} value={s.name}>
                  {s.name} (KKM: {s.kkm})
                </option>
              ))}
            </select>
          </div>

          {/* Teacher Filter */}
          <div className="flex items-center gap-2 bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200">
            <UserCheck className="h-4 w-4 text-purple-600" />
            <span className="text-xs font-bold text-slate-600">Guru:</span>
            <select
              value={config.teacherName || ''}
              onChange={(e) => handleTeacherChange(e.target.value)}
              className="bg-transparent text-sm font-bold text-purple-700 outline-none cursor-pointer max-w-[180px] truncate"
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
        </div>

        {/* Synchronized Meta Badges */}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <div className="flex items-center gap-1.5 rounded-lg bg-blue-50 px-3 py-1.5 text-blue-800 border border-blue-100 font-semibold">
            <UserCheck className="h-3.5 w-3.5 text-blue-600" />
            <span>Wali Kelas: <b>{config.teacherName || 'Belum Diatur'}</b></span>
          </div>
          <div className="flex items-center gap-1.5 rounded-lg bg-emerald-50 px-3 py-1.5 text-emerald-800 border border-emerald-100 font-semibold">
            <Award className="h-3.5 w-3.5 text-emerald-600" />
            <span>KKM: <b>{config.kkm}</b></span>
          </div>
          <div className="flex items-center gap-1.5 rounded-lg bg-purple-50 px-3 py-1.5 text-purple-800 border border-purple-100 font-semibold">
            <Calendar className="h-3.5 w-3.5 text-purple-600" />
            <span>Tahun: <b>{config.academicYear}</b></span>
          </div>
          <div className="flex items-center gap-1.5 rounded-lg bg-slate-100 px-3 py-1.5 text-slate-700 border border-slate-200 font-semibold">
            <Users className="h-3.5 w-3.5 text-slate-500" />
            <span>Total: <b>{stats.totalStudents} Siswa</b></span>
          </div>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Rata-rata Nilai</span>
          <div className="mt-1.5 flex items-baseline gap-1">
            <span className="text-2xl font-black text-blue-700">{stats.averageScore}</span>
            <span className="text-xs text-slate-400">/ 100</span>
          </div>
          <div className="mt-2 flex items-center gap-1 text-[11px] font-medium text-slate-500">
            <span>KKM: {config.kkm}</span>
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Ketuntasan (KKM)</span>
          <div className="mt-1.5 flex items-baseline gap-1">
            <span className={`text-2xl font-black ${stats.passPercentage >= 75 ? 'text-emerald-600' : 'text-amber-600'}`}>
              {stats.passPercentage}%
            </span>
          </div>
          <div className="mt-2 text-[11px] font-medium text-slate-500">
            {stats.passedCount} dari {stats.totalStudents} Siswa
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Nilai Tertinggi</span>
          <div className="mt-1.5 text-2xl font-black text-emerald-600">{stats.highestScore}</div>
          <div className="mt-2 text-[11px] font-medium text-emerald-700 flex items-center gap-1">
            <Award className="h-3 w-3" /> Peringkat 1
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Nilai Terendah</span>
          <div className="mt-1.5 text-2xl font-black text-red-600">{stats.lowestScore}</div>
          <div className="mt-2 text-[11px] font-medium text-slate-500">
            Perlu remedial
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Median (Nilai Tengah)</span>
          <div className="mt-1.5 text-2xl font-black text-purple-700">{stats.medianScore}</div>
          <div className="mt-2 text-[11px] font-medium text-slate-500">
            Distribusi sentral
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Standar Deviasi</span>
          <div className="mt-1.5 text-2xl font-black text-slate-800">{stats.standardDeviation}</div>
          <div className="mt-2 text-[11px] font-medium text-slate-500">
            Keragaman nilai
          </div>
        </div>
      </div>

      {/* Item Psychometrics & Bank Soal Quality Summary Bar */}
      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3 mb-4">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-100 text-indigo-700">
              <BookOpen className="h-4 w-4" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-sm">Analisis Psikometri & Kelayakan Bank Soal</h3>
              <p className="text-[11px] text-slate-500">Evaluasi daya beda (Metode 27% Kelompok Atas-Bawah) & tingkat kesukaran</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => PdfService.generateItemAnalysisSummaryPdf(config, stats)}
              className="flex items-center gap-1 text-xs font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 px-3 py-1.5 rounded-lg transition border border-indigo-200"
            >
              <FileText className="h-3.5 w-3.5" />
              Unduh Rekap Kualitas Soal (PDF)
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="rounded-lg bg-emerald-50 border border-emerald-200 p-3">
            <div className="flex items-center justify-between text-emerald-800 font-bold text-xs">
              <span className="flex items-center gap-1"><Check className="h-3.5 w-3.5" /> Soal Diterima (Baik)</span>
              <span className="text-base font-black">{quality.accepted}</span>
            </div>
            <p className="text-[11px] text-emerald-700 mt-1">Daya pembeda baik (D ≥ 0.30), siap masuk Bank Soal Madrasah.</p>
          </div>

          <div className="rounded-lg bg-amber-50 border border-amber-200 p-3">
            <div className="flex items-center justify-between text-amber-800 font-bold text-xs">
              <span className="flex items-center gap-1"><RefreshCw className="h-3.5 w-3.5" /> Perlu Direvisi</span>
              <span className="text-base font-black">{quality.revised}</span>
            </div>
            <p className="text-[11px] text-amber-700 mt-1">Daya pembeda cukup (0.20 ≤ D &lt; 0.30), perbaiki pilihan pengecoh.</p>
          </div>

          <div className="rounded-lg bg-red-50 border border-red-200 p-3">
            <div className="flex items-center justify-between text-red-800 font-bold text-xs">
              <span className="flex items-center gap-1"><XCircle className="h-3.5 w-3.5" /> Ditolak / Diganti</span>
              <span className="text-base font-black">{quality.rejected}</span>
            </div>
            <p className="text-[11px] text-red-700 mt-1">Daya pembeda buruk atau negatif (D &lt; 0.20), butir soal tidak valid.</p>
          </div>

          <div className="rounded-lg bg-slate-50 border border-slate-200 p-3">
            <div className="flex items-center justify-between text-slate-800 font-bold text-xs">
              <span className="flex items-center gap-1"><Layers className="h-3.5 w-3.5" /> Komposisi Soal</span>
              <span className="text-xs font-black">{config.questions.length} Butir</span>
            </div>
            <div className="mt-1 flex items-center justify-between text-[11px] font-semibold text-slate-600">
              <span>Mudah: <b>{quality.easyCount}</b></span>
              <span>Sedang: <b>{quality.mediumCount}</b></span>
              <span>Sukar: <b>{quality.hardCount}</b></span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Charts Section */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Left 2 Cols: Main Interactive Chart */}
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-xs lg:col-span-2">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4 mb-4">
            <div>
              <h3 className="font-bold text-slate-800 text-base">Visualisasi Analisis Butir Soal Ujian</h3>
              <p className="text-xs text-slate-500">Tingkat kesukaran, daya pembeda, dan sebaran perolehan nilai</p>
            </div>
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg text-xs font-semibold">
              <button
                onClick={() => setActiveChartTab('difficulty')}
                className={`rounded px-3 py-1 transition ${
                  activeChartTab === 'difficulty' ? 'bg-white text-blue-700 shadow-2xs' : 'text-slate-600'
                }`}
              >
                Tingkat Kesukaran
              </button>
              <button
                onClick={() => setActiveChartTab('discrimination')}
                className={`rounded px-3 py-1 transition ${
                  activeChartTab === 'discrimination' ? 'bg-white text-blue-700 shadow-2xs' : 'text-slate-600'
                }`}
              >
                Daya Pembeda (D)
              </button>
              <button
                onClick={() => setActiveChartTab('distribution')}
                className={`rounded px-3 py-1 transition ${
                  activeChartTab === 'distribution' ? 'bg-white text-blue-700 shadow-2xs' : 'text-slate-600'
                }`}
              >
                Sebaran Grade
              </button>
            </div>
          </div>

          <div className="h-80 w-full">
            {activeChartTab === 'difficulty' ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={questionDifficultyData} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                  <XAxis dataKey="name" angle={-35} textAnchor="end" height={50} tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip
                    content={({ active, payload, label }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload;
                        return (
                          <div className="rounded-lg bg-slate-900 p-3 text-xs text-white shadow-xl">
                            <p className="font-bold text-blue-300">{label}</p>
                            <p className="mt-1 text-emerald-400">Jawaban Benar: {data.benar} siswa</p>
                            <p className="text-red-400">Jawaban Salah: {data.salah} siswa</p>
                            <p className="mt-1 font-semibold text-amber-300">
                              Tingkat Kesukaran: {data.kategori} ({data.indeks}%)
                            </p>
                            <p className="text-cyan-300 font-semibold">
                              Rekomendasi: {data.rekomendasi}
                            </p>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Legend verticalAlign="top" height={36} />
                  <Bar dataKey="benar" name="Jawaban Benar" fill="#3B82F6" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="salah" name="Jawaban Salah" fill="#EF4444" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : activeChartTab === 'discrimination' ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={questionDifficultyData} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                  <XAxis dataKey="name" angle={-35} textAnchor="end" height={50} tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 11 }} domain={[-100, 100]} />
                  <Tooltip
                    content={({ active, payload, label }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload;
                        return (
                          <div className="rounded-lg bg-slate-900 p-3 text-xs text-white shadow-xl">
                            <p className="font-bold text-indigo-300">{label}</p>
                            <p className="mt-1 text-white font-bold">Indeks Daya Pembeda: {data.dayaBeda / 100}</p>
                            <p className="text-amber-300">Kategori: {data.dayaBedaCat}</p>
                            <p className="mt-1 text-emerald-300 font-semibold">Status: {data.rekomendasi}</p>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Bar dataKey="dayaBeda" name="Indeks Daya Pembeda (D x 100)" fill="#6366F1" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={gradeData} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Bar dataKey="count" name="Jumlah Siswa" radius={[6, 6, 0, 0]}>
                    {gradeData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* Item Analysis Legend */}
          <div className="mt-4 flex flex-wrap items-center justify-between gap-2 rounded-lg bg-slate-50 p-3 text-xs border border-slate-200">
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1.5 font-medium text-slate-700">
                <span className="h-2.5 w-2.5 rounded-full bg-emerald-500"></span> Mudah (P &gt; 0.70)
              </span>
              <span className="flex items-center gap-1.5 font-medium text-slate-700">
                <span className="h-2.5 w-2.5 rounded-full bg-blue-500"></span> Sedang (0.30 - 0.70)
              </span>
              <span className="flex items-center gap-1.5 font-medium text-slate-700">
                <span className="h-2.5 w-2.5 rounded-full bg-red-500"></span> Sukar (P &lt; 0.30)
              </span>
            </div>
            <span className="text-[11px] text-slate-500 italic">Daya Pembeda D = (Benar Atas - Benar Bawah) / (27% N)</span>
          </div>
        </div>

        {/* Right 1 Col: Pass vs Fail Donut & Top / Remedial Snippet */}
        <div className="space-y-6">
          {/* Ketuntasan Donut Chart */}
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-xs">
            <h3 className="font-bold text-slate-800 text-sm mb-1">Status Ketuntasan Belajar (KKM {config.kkm})</h3>
            <p className="text-xs text-slate-500 mb-4">Perbandingan siswa lulus KKM vs perlu remedial</p>

            <div className="h-44 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={passData}
                    cx="50%"
                    cy="50%"
                    innerRadius={45}
                    outerRadius={70}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {passData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div className="grid grid-cols-2 gap-2 text-center text-xs mt-2 border-t border-slate-100 pt-3">
              <div className="rounded-lg bg-emerald-50 p-2 text-emerald-900 border border-emerald-100">
                <p className="font-bold text-base">{stats.passedCount} Siswa</p>
                <p className="text-[11px] text-emerald-700">Tuntas ({stats.passPercentage}%)</p>
              </div>
              <div className="rounded-lg bg-red-50 p-2 text-red-900 border border-red-100">
                <p className="font-bold text-base">{stats.failedCount} Siswa</p>
                <p className="text-[11px] text-red-700">Remedial ({100 - stats.passPercentage}%)</p>
              </div>
            </div>
          </div>

          {/* Quick Problem Questions */}
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs">
            <h4 className="font-bold text-slate-800 text-xs uppercase tracking-wider text-slate-500 mb-3">
              Soal Paling Menantang (Perlu Dibahas)
            </h4>
            <div className="space-y-2">
              {stats.hardestQuestions.length === 0 ? (
                <p className="text-xs text-slate-400">Belum ada data analisis butir.</p>
              ) : (
                stats.hardestQuestions.map((q) => (
                  <div key={q.questionId} className="flex items-center justify-between rounded-lg bg-slate-50 p-2.5 border border-slate-200 text-xs">
                    <div>
                      <span className="font-bold text-slate-800">
                        No. {q.number} ({q.type.toUpperCase()})
                      </span>
                      <span className="ml-2 text-slate-500">Bobot: {q.maxScore} pts</span>
                    </div>
                    <span className="rounded bg-red-100 px-2 py-0.5 font-bold text-red-800 text-[11px]">
                      {q.wrongCount} Siswa Salah
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Automated Pedagogical & AI Insights Section */}
      <div className="rounded-xl border border-blue-200 bg-gradient-to-br from-blue-50/70 to-indigo-50/70 p-6 shadow-xs">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-600 text-white shadow-xs">
              <Brain className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                Analisis Otomatis & Rekomendasi Pedagogis Guru
                {aiAnalysis?.isAiGenerated && (
                  <span className="rounded-full bg-blue-600 px-2.5 py-0.5 text-[10px] font-bold text-white uppercase tracking-wider">
                    Powered by Gemini AI
                  </span>
                )}
              </h3>
              <p className="text-xs text-slate-600">
                Evaluasi otomatis hasil belajar siswa dan strategi tindak lanjut kelas
              </p>
            </div>
          </div>

          <button
            onClick={onGenerateAiAnalysis}
            disabled={isAiLoading}
            className="flex items-center gap-1.5 rounded-lg bg-white border border-blue-300 px-3.5 py-1.5 text-xs font-bold text-blue-700 hover:bg-blue-50 shadow-2xs transition disabled:opacity-50"
          >
            <Sparkles className="h-3.5 w-3.5 text-amber-500" />
            {isAiLoading ? 'Memproses...' : 'Perbarui Analisis'}
          </button>
        </div>

        {aiAnalysis ? (
          <div className="space-y-4 text-xs sm:text-sm">
            <div className="rounded-lg bg-white p-4 border border-blue-200 shadow-2xs">
              <p className="font-medium text-slate-800 leading-relaxed">{aiAnalysis.summary}</p>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              {/* Strengths */}
              <div className="rounded-lg bg-white p-4 border border-emerald-200 shadow-2xs">
                <h4 className="font-bold text-emerald-800 text-xs uppercase tracking-wider flex items-center gap-1.5 mb-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" /> Kekuatan & Capaian Positif
                </h4>
                <ul className="space-y-1.5 text-xs text-slate-700">
                  {aiAnalysis.strengths.map((s, i) => (
                    <li key={i} className="flex items-start gap-1.5">
                      <span className="text-emerald-500 font-bold">•</span>
                      <span>{s}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Weaknesses */}
              <div className="rounded-lg bg-white p-4 border border-amber-200 shadow-2xs">
                <h4 className="font-bold text-amber-800 text-xs uppercase tracking-wider flex items-center gap-1.5 mb-2">
                  <AlertCircle className="h-4 w-4 text-amber-600" /> Area Perlu Peningkatan
                </h4>
                <ul className="space-y-1.5 text-xs text-slate-700">
                  {aiAnalysis.weaknesses.map((w, i) => (
                    <li key={i} className="flex items-start gap-1.5">
                      <span className="text-amber-500 font-bold">•</span>
                      <span>{w}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Recommendations */}
              <div className="rounded-lg bg-white p-4 border border-indigo-200 shadow-2xs">
                <h4 className="font-bold text-indigo-800 text-xs uppercase tracking-wider flex items-center gap-1.5 mb-2">
                  <BookOpen className="h-4 w-4 text-indigo-600" /> Tindak Lanjut Guru (Remedial & Pengayaan)
                </h4>
                <ul className="space-y-1.5 text-xs text-slate-700">
                  {aiAnalysis.recommendations.map((r, i) => (
                    <li key={i} className="flex items-start gap-1.5">
                      <span className="text-indigo-500 font-bold">•</span>
                      <span>{r}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        ) : (
          <div className="rounded-lg bg-white/70 p-6 text-center border border-dashed border-blue-300">
            <p className="text-sm text-slate-600 font-medium">
              Klik tombol <span className="font-bold text-blue-700">"Analisis Cerdas Otomatis"</span> untuk mendapatkan rangkuman rekomendasi pedagogis, evaluasi butir soal, dan panduan tindak lanjut remedial.
            </p>
          </div>
        )}
      </div>

      {/* Pedagogical Action Tables: Remedial Planner & Enrichment Details */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        {/* Remedial Action Plan */}
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-xs">
          <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-100 text-red-700">
                <AlertCircle className="h-4 w-4" />
              </div>
              <div>
                <h3 className="font-bold text-slate-800 text-base">Rencana Program Remedial</h3>
                <p className="text-xs text-slate-500">Detail butir soal salah & saran tindakan perbaikan</p>
              </div>
            </div>
            <button
              onClick={() => PdfService.generateRemedialProgramPdf(config, stats)}
              className="flex items-center gap-1 text-xs font-bold text-red-700 bg-red-50 hover:bg-red-100 px-2.5 py-1 rounded-lg transition border border-red-200"
            >
              <FileText className="h-3 w-3" /> Cetak
            </button>
          </div>

          <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
            {stats.remedialDetails && stats.remedialDetails.length > 0 ? (
              stats.remedialDetails.map((s, idx) => (
                <div
                  key={s.studentId}
                  className="rounded-lg border border-red-200 bg-red-50/40 p-3 text-xs"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900 text-sm">{s.name}</span>
                    <span className="rounded bg-red-600 px-2 py-0.5 font-bold text-white text-[11px]">
                      Nilai: {s.score}
                    </span>
                  </div>
                  <div className="mt-1 text-slate-600">
                    <span className="font-semibold text-slate-700">Soal Salah: </span>
                    {s.wrongQuestionNumbers.length > 0 ? `No. ${s.wrongQuestionNumbers.join(', ')}` : 'Konsep Dasar'}
                  </div>
                  <div className="mt-1 rounded bg-white p-2 border border-red-100 text-slate-700">
                    <span className="font-bold text-red-800">Saran Tindakan: </span>
                    {s.suggestedAction}
                  </div>
                </div>
              ))
            ) : (
              <div className="rounded-lg bg-emerald-50 p-6 text-center border border-emerald-200">
                <CheckCircle2 className="mx-auto h-8 w-8 text-emerald-600 mb-2" />
                <p className="font-bold text-emerald-900 text-sm">Luar Biasa! Seluruh Siswa Telah Tuntas.</p>
                <p className="text-xs text-emerald-700 mt-1">Tidak ada siswa yang perlu mengikuti program remedial.</p>
              </div>
            )}
          </div>
        </div>

        {/* Enrichment Action Plan */}
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-xs">
          <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700">
                <Award className="h-4 w-4" />
              </div>
              <div>
                <h3 className="font-bold text-slate-800 text-base">Rencana Program Pengayaan</h3>
                <p className="text-xs text-slate-500">Pemberdayaan siswa tuntas & tutor sebaya</p>
              </div>
            </div>
            <button
              onClick={() => PdfService.generateEnrichmentProgramPdf(config, stats)}
              className="flex items-center gap-1 text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 px-2.5 py-1 rounded-lg transition border border-emerald-200"
            >
              <FileText className="h-3 w-3" /> Cetak
            </button>
          </div>

          <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
            {stats.enrichmentDetails && stats.enrichmentDetails.length > 0 ? (
              stats.enrichmentDetails.map((s, idx) => (
                <div
                  key={s.studentId}
                  className="rounded-lg border border-emerald-200 bg-emerald-50/40 p-3 text-xs"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900 text-sm">{s.name}</span>
                    <span className="rounded bg-emerald-600 px-2 py-0.5 font-bold text-white text-[11px]">
                      Nilai: {s.score}
                    </span>
                  </div>
                  <div className="mt-2 rounded bg-white p-2 border border-emerald-100 text-slate-700">
                    <span className="font-bold text-emerald-800">Bentuk Kegiatan: </span>
                    {s.suggestedActivity}
                  </div>
                </div>
              ))
            ) : (
              <div className="rounded-lg bg-slate-50 p-6 text-center border border-slate-200">
                <p className="text-xs text-slate-500">Belum ada siswa dengan nilai pengayaan.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
