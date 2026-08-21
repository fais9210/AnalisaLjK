/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState, useMemo } from 'react';
import {
  AIAnalysisResult,
  ClassGroup,
  ExamRecord,
  ExamSheetConfig,
  Student,
  StudentScoreRow,
  Subject,
  Teacher,
} from './types';
import { generateInitialRows, StorageService } from './services/storageService';
import {
  computeExamStatistics,
  computeQuestionAnalyses,
  isSameClass,
} from './services/analysisEngine';
import { PdfService } from './services/pdfService';
import { ExcelService } from './services/excelService';
import { Sidebar, ActiveTab } from './components/Sidebar';
import { ExamAnalysisTable } from './components/ExamAnalysisTable';
import { StatsDashboard } from './components/StatsDashboard';
import { MasterDataManager } from './components/MasterDataManager';
import { HistoryAndBackup } from './components/HistoryAndBackup';
import { ExamConfigModal } from './components/ExamConfigModal';
import { ReportAndPrintCenter } from './components/ReportAndPrintCenter';
import {
  PanelLeft,
  PanelLeftClose,
  Sliders,
  Printer,
  Sparkles,
  Layers,
  BookOpen,
  UserCheck,
  CheckCircle2,
  Calendar,
} from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('table');
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(() => {
    // Default open on wide screens, closed on small mobile
    if (typeof window !== 'undefined') {
      return window.innerWidth >= 1024;
    }
    return true;
  });

  // Master Data
  const [students, setStudents] = useState<Student[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [classes, setClasses] = useState<ClassGroup[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);

  // Current Active Exam Sheet
  const [currentConfig, setCurrentConfig] = useState<ExamSheetConfig | null>(null);
  const [currentRows, setCurrentRows] = useState<StudentScoreRow[]>([]);
  const [examRecords, setExamRecords] = useState<ExamRecord[]>([]);

  // Config modal
  const [isConfigModalOpen, setIsConfigModalOpen] = useState(false);

  // AI Analysis state
  const [aiAnalysis, setAiAnalysis] = useState<AIAnalysisResult | null>(null);
  const [isAiLoading, setIsAiLoading] = useState(false);

  // Initial load
  useEffect(() => {
    refreshAllData();

    // Check Cloud DB connection and sync if data exists
    StorageService.checkCloudDbStatus().then((status) => {
      if (status.connected) {
        StorageService.syncFromCloudDb().then((res) => {
          if (res.success) {
            refreshAllData();
          }
        });
      }
    });
  }, []);

  const refreshAllData = () => {
    const loadedStudents = StorageService.getStudents();
    const loadedTeachers = StorageService.getTeachers();
    const loadedClasses = StorageService.getClasses();
    const loadedSubjects = StorageService.getSubjects();
    const loadedConfig = StorageService.getCurrentConfig();
    let loadedRows = StorageService.getCurrentRows(loadedConfig);
    const loadedRecords = StorageService.getExamRecords();

    // Ensure loadedRows has active students for loadedConfig.className
    if (loadedRows.length === 0 && loadedStudents.length > 0) {
      loadedRows = generateInitialRows(loadedStudents, loadedConfig);
      StorageService.saveCurrentRows(loadedRows);
    }

    setStudents(loadedStudents);
    setTeachers(loadedTeachers);
    setClasses(loadedClasses);
    setSubjects(loadedSubjects);
    setCurrentConfig(loadedConfig);
    setCurrentRows(loadedRows);
    setExamRecords(loadedRecords);
  };

  // Sync rows whenever currentRows change
  const handleRowsChange = (newRows: StudentScoreRow[]) => {
    setCurrentRows(newRows);
    StorageService.saveCurrentRows(newRows);
  };

  // Sync config whenever currentConfig change
  const handleConfigChange = (newConfig: ExamSheetConfig) => {
    setCurrentConfig(newConfig);
    StorageService.saveCurrentConfig(newConfig);
  };

  // Save student modifications
  const handleSaveStudents = (newStudents: Student[]) => {
    setStudents(newStudents);
    StorageService.saveStudents(newStudents);
    // If current class matches, sync rows
    if (currentConfig) {
      const classStudents = newStudents.filter(
        (s) => isSameClass(s.className, currentConfig.className) && s.active
      );
      const existingRowsMap = new Map<string, StudentScoreRow>(currentRows.map((r) => [r.studentId, r]));
      const syncedRows: StudentScoreRow[] = classStudents.map((s) => {
        const existing = existingRowsMap.get(s.id);
        if (existing) {
          return {
            studentId: existing.studentId,
            studentName: s.name,
            scores: existing.scores,
            correctQuestionsCount: existing.correctQuestionsCount,
            wrongQuestionsCount: existing.wrongQuestionsCount,
            totalScore: existing.totalScore,
            isPassed: existing.isPassed,
            notes: existing.notes,
          };
        }
        const emptyScores: Record<string, number> = {};
        for (const q of currentConfig.questions) emptyScores[q.id] = 0;
        return {
          studentId: s.id,
          studentName: s.name,
          scores: emptyScores,
          correctQuestionsCount: 0,
          wrongQuestionsCount: currentConfig.questions.length,
          totalScore: 0,
          isPassed: false,
        };
      });
      handleRowsChange(syncedRows);
    }
  };

  // Add single student directly from table
  const handleAddNewStudentToClass = (name: string, gender: 'L' | 'P') => {
    if (!currentConfig) return;
    const newStudent: Student = {
      id: `std-${Date.now()}`,
      nis: `2024${String(students.length + 1).padStart(4, '0')}`,
      name,
      gender,
      className: currentConfig.className,
      active: true,
    };
    const updatedStudents = [...students, newStudent];
    handleSaveStudents(updatedStudents);
  };

  // Save teacher modifications
  const handleSaveTeachers = (newTeachers: Teacher[]) => {
    setTeachers(newTeachers);
    StorageService.saveTeachers(newTeachers);
    if (currentConfig) {
      const assignedTeacher = newTeachers.find(
        (t) => isSameClass(t.assignedClass, currentConfig.className) && (t.role === 'Wali Kelas' || t.subject === currentConfig.subjectName)
      );
      const updatedTeacherName = assignedTeacher ? assignedTeacher.name : (newTeachers.some(t => t.name === currentConfig.teacherName) ? currentConfig.teacherName : '');
      const updatedConfig: ExamSheetConfig = {
        ...currentConfig,
        teacherName: updatedTeacherName,
      };
      setCurrentConfig(updatedConfig);
      StorageService.saveCurrentConfig(updatedConfig);
    }
  };

  // Save class modifications
  const handleSaveClasses = (newClasses: ClassGroup[]) => {
    setClasses(newClasses);
    StorageService.saveClasses(newClasses);
    if (currentConfig) {
      const activeClass = newClasses.find((c) => isSameClass(c.name, currentConfig.className));
      if (activeClass) {
        const updatedConfig: ExamSheetConfig = {
          ...currentConfig,
          teacherName: activeClass.waliKelasName || currentConfig.teacherName,
          academicYear: activeClass.academicYear || currentConfig.academicYear,
        };
        setCurrentConfig(updatedConfig);
        StorageService.saveCurrentConfig(updatedConfig);
      }
    }
  };

  // Save subject modifications
  const handleSaveSubjects = (newSubjects: Subject[]) => {
    setSubjects(newSubjects);
    StorageService.saveSubjects(newSubjects);
    if (currentConfig) {
      const activeSubject = newSubjects.find((s) => s.name === currentConfig.subjectName);
      if (activeSubject) {
        const updatedConfig: ExamSheetConfig = {
          ...currentConfig,
          kkm: activeSubject.kkm,
        };
        setCurrentConfig(updatedConfig);
        StorageService.saveCurrentConfig(updatedConfig);

        // Re-evaluate passing status on rows with updated KKM
        const syncedRows = currentRows.map((r) => ({
          ...r,
          isPassed: r.totalScore >= activeSubject.kkm,
        }));
        handleRowsChange(syncedRows);
      }
    }
  };

  // Save current active exam to history
  const handleSaveRecord = () => {
    if (!currentConfig) return;
    const newRecord: ExamRecord = {
      id: `rec-${Date.now()}`,
      config: { ...currentConfig },
      rows: [...currentRows],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    StorageService.saveExamRecord(newRecord);
    setExamRecords(StorageService.getExamRecords());
    StorageService.saveExamRecordToCloud(newRecord);
  };

  // Load a record from history
  const handleLoadRecord = (record: ExamRecord) => {
    setCurrentConfig(record.config);
    setCurrentRows(record.rows);
    StorageService.saveCurrentConfig(record.config);
    StorageService.saveCurrentRows(record.rows);
    setActiveTab('table');
  };

  // Delete record from history
  const handleDeleteRecord = (recordId: string) => {
    if (confirm('Hapus arsip rekaman ujian ini dari riwayat database?')) {
      StorageService.deleteExamRecord(recordId);
      setExamRecords(StorageService.getExamRecords());
      StorageService.deleteExamRecordFromCloud(recordId);
    }
  };

  // Computations
  const questionAnalyses = useMemo(() => {
    if (!currentConfig) return [];
    return computeQuestionAnalyses(currentRows, currentConfig);
  }, [currentRows, currentConfig]);

  const examStats = useMemo(() => {
    if (!currentConfig) {
      return {
        totalStudents: 0,
        averageScore: 0,
        highestScore: 0,
        lowestScore: 0,
        medianScore: 0,
        standardDeviation: 0,
        passedCount: 0,
        failedCount: 0,
        passPercentage: 0,
        gradeDistribution: { gradeA: 0, gradeB: 0, gradeC: 0, gradeD: 0 },
        topStudents: [],
        needRemedial: [],
        questionAnalyses: [],
        hardestQuestions: [],
        easiestQuestions: [],
      };
    }
    return computeExamStatistics(currentRows, currentConfig);
  }, [currentRows, currentConfig]);

  // AI Analysis Trigger
  const handleGenerateAiAnalysis = async () => {
    if (!currentConfig) return;
    setIsAiLoading(true);
    try {
      const response = await fetch('/api/analyze-exam', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          examTitle: currentConfig.title,
          subject: currentConfig.subjectName,
          className: currentConfig.className,
          stats: examStats,
          questions: questionAnalyses,
          studentHighlights: {
            topStudents: examStats.topStudents.map((s) => `${s.name} (${s.score})`),
            needRemedial: examStats.needRemedial.map((s) => `${s.name} (${s.score})`),
          },
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setAiAnalysis(data);
      } else {
        throw new Error('Gagal mendapatkan respon analisis');
      }
    } catch (e: any) {
      console.error(e);
      // Fallback rule-based analysis
      setAiAnalysis({
        summary: `Analisis evaluasi untuk ${currentConfig.title} mata pelajaran ${currentConfig.subjectName} Kelas ${currentConfig.className}: Rata-rata kelas ${examStats.averageScore} dengan ketuntasan KKM ${examStats.passPercentage}%.`,
        strengths: [
          `Sebanyak ${examStats.passedCount} siswa (${examStats.passPercentage}%) telah mencapai nilai KKM (${currentConfig.kkm}).`,
          `Sebagian besar siswa menguasai soal-soal pilihan ganda dengan persentase jawaban benar yang tinggi.`,
        ],
        weaknesses: [
          `Terdapat ${examStats.failedCount} siswa yang masih berada di bawah KKM dan memerlukan pengayaan pemahaman konsep.`,
          `Soal nomor dengan tingkat kesukaran tinggi memerlukan evaluasi kedalaman materi.`,
        ],
        recommendations: [
          `Jadwalkan sesi remedial untuk ${examStats.needRemedial.map((r) => r.name).join(', ') || 'siswa belum tuntas'}.`,
          `Berikan tugas pengayaan aplikatif bagi ${examStats.topStudents.map((t) => t.name).slice(0, 3).join(', ')}.`,
          `Ulas kembali materi pokok pada butir soal dengan persentase salah terbanyak di kelas.`,
        ],
        isAiGenerated: false,
      });
    } finally {
      setIsAiLoading(false);
    }
  };

  // Export Handlers
  const handleExportOfficialPdf = () => {
    if (!currentConfig) return;
    PdfService.generateExamSheetPdf(currentConfig, currentRows, questionAnalyses);
  };

  const handleExportReportPdf = () => {
    if (!currentConfig) return;
    PdfService.generateFullStatisticalReportPdf(currentConfig, examStats, aiAnalysis);
  };

  const handleExportExcel = () => {
    if (!currentConfig) return;
    ExcelService.exportExamSheetToExcel(currentConfig, currentRows, questionAnalyses);
  };

  if (!currentConfig) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent mx-auto mb-3"></div>
          <p className="font-semibold text-slate-600">Memuat data analisis ujian...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100/80 text-slate-800 antialiased flex flex-col font-sans">
      {/* Left Sidebar (Collapsible / Hideable) */}
      <Sidebar
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        config={currentConfig}
        onOpenConfigModal={() => setIsConfigModalOpen(true)}
        isOpen={isSidebarOpen}
        onToggle={() => setIsSidebarOpen((prev) => !prev)}
      />

      {/* Main Content Area Container with dynamic left padding */}
      <div
        className={`flex-1 flex flex-col min-w-0 transition-all duration-300 ease-in-out ${
          isSidebarOpen ? 'lg:pl-72' : 'lg:pl-0'
        }`}
      >
        {/* Top Action Header Bar */}
        <header
          id="app-top-action-bar"
          className="sticky top-0 z-30 flex flex-wrap items-center justify-between border-b border-slate-200 bg-white/95 px-4 sm:px-6 py-3 shadow-2xs backdrop-blur-xs print:hidden gap-3"
        >
          {/* Left section: Toggle button & Breadcrumbs */}
          <div className="flex items-center gap-3 min-w-0">
            <button
              id="header-sidebar-toggle"
              onClick={() => setIsSidebarOpen((prev) => !prev)}
              title={isSidebarOpen ? 'Sembunyikan Menu Samping' : 'Tampilkan Menu Samping'}
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-slate-50 text-slate-700 hover:bg-blue-50 hover:border-blue-300 hover:text-blue-700 transition"
              aria-label="Toggle Sidebar Menu"
            >
              {isSidebarOpen ? (
                <PanelLeftClose className="h-5 w-5" />
              ) : (
                <PanelLeft className="h-5 w-5 text-blue-600" />
              )}
            </button>

            <div className="min-w-0">
              <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
                <span>Analisis Ujian</span>
                <span className="text-slate-300">•</span>
                <span className="font-bold text-blue-700 capitalize">
                  {activeTab === 'table' && 'Lembar Analisa & Input Nilai'}
                  {activeTab === 'dashboard' && 'Statistik & Psikometri AI'}
                  {activeTab === 'reports' && 'Pelaporan & Cetak Resmi'}
                  {activeTab === 'master' && 'Data Siswa & Guru'}
                  {activeTab === 'history' && 'Database & Backup'}
                </span>
              </div>
              <h1 className="text-sm sm:text-base font-black text-slate-900 leading-tight truncate">
                {currentConfig.schoolName}
              </h1>
            </div>
          </div>

          {/* Right section: Active context tags & Quick Settings Button */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Quick Context Badges */}
            <div className="hidden sm:flex items-center gap-1.5 rounded-lg bg-slate-50 border border-slate-200/80 px-2.5 py-1 text-xs">
              <span className="font-bold text-slate-700 flex items-center gap-1">
                <Layers className="h-3.5 w-3.5 text-blue-600" />
                {currentConfig.className}
              </span>
              <span className="text-slate-300">|</span>
              <span className="font-semibold text-emerald-700 flex items-center gap-1">
                <BookOpen className="h-3.5 w-3.5 text-emerald-600" />
                {currentConfig.subjectName}
              </span>
              <span className="text-slate-300">|</span>
              <span className="font-medium text-slate-600 flex items-center gap-1">
                <UserCheck className="h-3.5 w-3.5 text-purple-600" />
                {currentConfig.teacherName || 'Guru'}
              </span>
            </div>

            {/* Quick Button to open Config */}
            <button
              id="header-open-config-btn"
              onClick={() => setIsConfigModalOpen(true)}
              className="flex items-center gap-1.5 rounded-lg border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs font-bold text-blue-700 hover:bg-blue-100 hover:border-blue-300 transition shadow-2xs"
            >
              <Sliders className="h-3.5 w-3.5" />
              <span className="hidden md:inline">Format Soal</span>
            </button>
          </div>
        </header>

        {/* Responsive Main Content Grid / Flow */}
        <main className="flex-1 w-full p-3 sm:p-5 lg:p-6 min-w-0">
          <div className="mx-auto w-full max-w-full space-y-6">
            {activeTab === 'table' && (
              <ExamAnalysisTable
                config={currentConfig}
                rows={currentRows}
                questionAnalyses={questionAnalyses}
                classes={classes}
                subjects={subjects}
                teachers={teachers}
                allStudents={students}
                onConfigChange={handleConfigChange}
                onRowsChange={handleRowsChange}
                onOpenConfigModal={() => setIsConfigModalOpen(true)}
                onExportPdf={handleExportOfficialPdf}
                onExportExcel={handleExportExcel}
                onSaveRecord={handleSaveRecord}
                onAddNewStudentToClass={handleAddNewStudentToClass}
              />
            )}

            {activeTab === 'dashboard' && (
              <StatsDashboard
                config={currentConfig}
                stats={examStats}
                rows={currentRows}
                classes={classes}
                subjects={subjects}
                teachers={teachers}
                allStudents={students}
                onConfigChange={handleConfigChange}
                onRowsChange={handleRowsChange}
                onGenerateAiAnalysis={handleGenerateAiAnalysis}
                aiAnalysis={aiAnalysis}
                isAiLoading={isAiLoading}
                onExportReportPdf={handleExportReportPdf}
                onNavigateToPrintCenter={() => setActiveTab('reports')}
              />
            )}

            {activeTab === 'reports' && (
              <ReportAndPrintCenter
                config={currentConfig}
                stats={examStats}
                rows={currentRows}
                questionAnalyses={questionAnalyses}
                onConfigChange={handleConfigChange}
              />
            )}

            {activeTab === 'master' && (
              <MasterDataManager
                students={students}
                teachers={teachers}
                classes={classes}
                subjects={subjects}
                onSaveStudents={handleSaveStudents}
                onSaveTeachers={handleSaveTeachers}
                onSaveClasses={handleSaveClasses}
                onSaveSubjects={handleSaveSubjects}
              />
            )}

            {activeTab === 'history' && (
              <HistoryAndBackup
                examRecords={examRecords}
                onLoadRecord={handleLoadRecord}
                onDeleteRecord={handleDeleteRecord}
                onRefreshAllData={refreshAllData}
              />
            )}
          </div>
        </main>

        {/* Modal: Configure Exam & Questions */}
        {isConfigModalOpen && (
          <ExamConfigModal
            isOpen={isConfigModalOpen}
            onClose={() => setIsConfigModalOpen(false)}
            config={currentConfig}
            classes={classes}
            subjects={subjects}
            teachers={teachers}
            onSave={handleConfigChange}
          />
        )}

        {/* Footer */}
        <footer className="border-t border-slate-200 bg-white py-3.5 text-center text-xs text-slate-500 print:hidden">
          <div className="mx-auto w-full px-4 sm:px-6 flex flex-wrap items-center justify-between gap-2">
            <span>
              <b>Sistem Analisis Hasil Ujian Siswa & Butir Soal</b> • MMU A-22 Karangnongko
            </span>
            <span>Dukungan Ekspor PDF, Excel, Statistik Visual & Analisis Pedagogis</span>
          </div>
        </footer>
      </div>
    </div>
  );
}
