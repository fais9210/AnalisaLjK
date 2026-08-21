import React, { useState, useRef } from 'react';
import {
  ExamSheetConfig,
  ExamStatistics,
  QuestionAnalysis,
  StudentScoreRow,
} from '../types';
import { PdfService } from '../services/pdfService';
import { ExcelService } from '../services/excelService';
import { formatSignatureDate } from '../services/analysisEngine';
import {
  Printer,
  FileSpreadsheet,
  FileText,
  CheckCircle2,
  AlertTriangle,
  Award,
  BookOpen,
  Calendar,
  UserCheck,
  Building,
  Download,
  Settings,
  Edit3,
} from 'lucide-react';

interface ReportAndPrintCenterProps {
  config: ExamSheetConfig;
  stats: ExamStatistics;
  rows: StudentScoreRow[];
  questionAnalyses: QuestionAnalysis[];
  onConfigChange: (newConfig: ExamSheetConfig) => void;
}

type ReportType = 'exam_sheet' | 'remedial' | 'enrichment' | 'item_analysis';

export const ReportAndPrintCenter: React.FC<ReportAndPrintCenterProps> = ({
  config,
  stats,
  rows,
  questionAnalyses,
  onConfigChange,
}) => {
  const [activeReport, setActiveReport] = useState<ReportType>('exam_sheet');
  const [paperSize, setPaperSize] = useState<'A4' | 'F4'>('A4');
  const [showConfigDrawer, setShowConfigDrawer] = useState(false);

  // Editable Kop & Signature Fields
  const [schoolName, setSchoolName] = useState(config.schoolName);
  const [title, setTitle] = useState(config.title);
  const [headmasterName, setHeadmasterName] = useState(config.headmasterName);
  const [teacherName, setTeacherName] = useState(config.teacherName);
  const [dateLocation, setDateLocation] = useState(config.dateLocation);
  const [dateDayMonth, setDateDayMonth] = useState(config.dateDayMonth !== undefined ? config.dateDayMonth : '.............');
  const [dateHijri, setDateHijri] = useState(config.dateHijri);

  const printAreaRef = useRef<HTMLDivElement>(null);

  const handleSaveMeta = () => {
    const updated: ExamSheetConfig = {
      ...config,
      schoolName,
      title,
      headmasterName,
      teacherName,
      dateLocation,
      dateDayMonth,
      dateHijri,
    };
    onConfigChange(updated);
    setShowConfigDrawer(false);
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPdf = () => {
    switch (activeReport) {
      case 'exam_sheet':
        PdfService.generateExamSheetPdf(config, rows, questionAnalyses);
        break;
      case 'remedial':
        PdfService.generateRemedialProgramPdf(config, stats);
        break;
      case 'enrichment':
        PdfService.generateEnrichmentProgramPdf(config, stats);
        break;
      case 'item_analysis':
        PdfService.generateItemAnalysisSummaryPdf(config, stats);
        break;
    }
  };

  const handleDownloadExcel = () => {
    ExcelService.exportComprehensiveReportToExcel(config, rows, stats, questionAnalyses);
  };

  const pgQuestions = config.questions.filter((q) => q.type === 'pg');
  const isianQuestions = config.questions.filter((q) => q.type === 'isian');
  const uraianQuestions = config.questions.filter((q) => q.type === 'uraian');

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl bg-gradient-to-r from-slate-900 via-indigo-950 to-blue-950 p-6 text-white shadow-md print:hidden">
        <div>
          <div className="flex items-center gap-2 text-blue-300 text-xs font-bold uppercase tracking-wider mb-1">
            <Printer className="h-4 w-4" /> Pusat Pelaporan & Format Cetak Resmi
          </div>
          <h2 className="text-xl sm:text-2xl font-black">Dokumen Evaluasi Pembelajaran Madrasah</h2>
          <p className="text-sm text-slate-300 mt-0.5">
            Format cetak siap pakai (A4/F4) sesuai standar administrasi ujian MMU A-22 Karangnongko
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => setShowConfigDrawer(!showConfigDrawer)}
            className="flex items-center gap-1.5 rounded-lg bg-white/10 hover:bg-white/20 border border-white/20 px-3.5 py-2 text-xs font-bold text-white transition backdrop-blur-xs"
          >
            <Settings className="h-4 w-4" />
            Pengaturan Kop & TTD
          </button>

          <button
            onClick={handleDownloadExcel}
            className="flex items-center gap-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 px-3.5 py-2 text-xs font-bold text-white shadow-md transition"
          >
            <FileSpreadsheet className="h-4 w-4" />
            Unduh Excel 5-in-1
          </button>

          <button
            onClick={handleDownloadPdf}
            className="flex items-center gap-1.5 rounded-lg bg-red-600 hover:bg-red-500 px-3.5 py-2 text-xs font-bold text-white shadow-md transition"
          >
            <Download className="h-4 w-4" />
            Unduh PDF
          </button>

          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 rounded-lg bg-blue-500 hover:bg-blue-400 px-4 py-2 text-xs sm:text-sm font-black text-white shadow-lg transition"
          >
            <Printer className="h-4 w-4" />
            Cetak Lembar Ini
          </button>
        </div>
      </div>

      {/* Meta Configuration Drawer */}
      {showConfigDrawer && (
        <div className="rounded-xl border border-blue-200 bg-blue-50/70 p-5 shadow-xs print:hidden space-y-4">
          <div className="flex items-center justify-between border-b border-blue-200 pb-2">
            <h4 className="font-bold text-blue-900 text-sm flex items-center gap-2">
              <Building className="h-4 w-4 text-blue-700" />
              Pengaturan Kop Surat, Titimangsa & Penandatangan
            </h4>
            <span className="text-xs text-blue-600">Perubahan akan langsung tertera pada format cetak</span>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Nama Madrasah</label>
              <input
                type="text"
                value={schoolName}
                onChange={(e) => setSchoolName(e.target.value)}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-800"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Judul Dokumen</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-800"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Nama Kepala Madrasah</label>
              <input
                type="text"
                value={headmasterName}
                onChange={(e) => setHeadmasterName(e.target.value)}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-800"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Nama Wali Kelas / Guru Pengampu</label>
              <input
                type="text"
                value={teacherName}
                onChange={(e) => setTeacherName(e.target.value)}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-800"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Kota / Lokasi Titimangsa</label>
              <input
                type="text"
                value={dateLocation}
                onChange={(e) => setDateLocation(e.target.value)}
                placeholder="e.g. Karangnongko"
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-800"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Tanggal & Bulan Titimangsa</label>
              <input
                type="text"
                value={dateDayMonth}
                onChange={(e) => setDateDayMonth(e.target.value)}
                placeholder="e.g. ............. atau 15 Sya'ban"
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-800"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Tahun Pengesahan</label>
              <input
                type="text"
                value={dateHijri}
                onChange={(e) => setDateHijri(e.target.value)}
                placeholder="e.g. 1448 atau 1447-1448 H"
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-800"
              />
            </div>
          </div>

          {/* Quick presets & Live Preview */}
          <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-blue-200/60">
            <div className="flex flex-wrap items-center gap-1.5 text-xs">
              <span className="font-bold text-slate-700">Format Cepat:</span>
              <button
                type="button"
                onClick={() => setDateDayMonth('.............')}
                className="rounded-md border border-slate-300 bg-white px-2 py-0.5 text-[11px] font-semibold text-slate-700 hover:bg-slate-50"
              >
                Titik-titik (.............)
              </button>
              <button
                type="button"
                onClick={() => {
                  const today = new Date();
                  const months = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
                  setDateDayMonth(`${today.getDate()} ${months[today.getMonth()]}`);
                  setDateHijri(`${today.getFullYear()} M`);
                }}
                className="rounded-md border border-slate-300 bg-white px-2 py-0.5 text-[11px] font-semibold text-slate-700 hover:bg-slate-50"
              >
                Hari Ini (Masehi)
              </button>
              <button
                type="button"
                onClick={() => {
                  setDateDayMonth("15 Sya'ban");
                  setDateHijri('1448 H');
                }}
                className="rounded-md border border-slate-300 bg-white px-2 py-0.5 text-[11px] font-semibold text-slate-700 hover:bg-slate-50"
              >
                15 Sya'ban 1448 H
              </button>
            </div>

            <div className="text-xs font-bold text-blue-900 bg-white px-3 py-1 rounded-lg border border-blue-200">
              Hasil: {dateLocation || 'Karangnongko'}, {dateDayMonth || '.............'} {dateHijri || '1448'}
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              onClick={() => setShowConfigDrawer(false)}
              className="rounded-lg bg-white border border-slate-300 px-3 py-1.5 text-xs font-bold text-slate-600 hover:bg-slate-50"
            >
              Tutup
            </button>
            <button
              onClick={handleSaveMeta}
              className="rounded-lg bg-blue-600 px-4 py-1.5 text-xs font-bold text-white hover:bg-blue-500 shadow-xs"
            >
              Terapkan Perubahan
            </button>
          </div>
        </div>
      )}

      {/* Navigation Tabs for 4 Official Madrasah Reports */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-3 print:hidden">
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setActiveReport('exam_sheet')}
            className={`flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-xs sm:text-sm font-bold transition ${
              activeReport === 'exam_sheet'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <FileSpreadsheet className="h-4 w-4" />
            1. Lembar Analisis Ujian (Landscape)
          </button>

          <button
            onClick={() => setActiveReport('remedial')}
            className={`flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-xs sm:text-sm font-bold transition ${
              activeReport === 'remedial'
                ? 'bg-red-600 text-white shadow-xs'
                : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <AlertTriangle className="h-4 w-4" />
            2. Program & Pelaksanaan Remedial
          </button>

          <button
            onClick={() => setActiveReport('enrichment')}
            className={`flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-xs sm:text-sm font-bold transition ${
              activeReport === 'enrichment'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <Award className="h-4 w-4" />
            3. Program Pengayaan Siswa
          </button>

          <button
            onClick={() => setActiveReport('item_analysis')}
            className={`flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-xs sm:text-sm font-bold transition ${
              activeReport === 'item_analysis'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <BookOpen className="h-4 w-4" />
            4. Rekapitulasi Kualitas Butir Soal
          </button>
        </div>

        {/* Paper Size selector */}
        <div className="flex items-center gap-1.5 bg-white p-1 rounded-lg border border-slate-200 text-xs font-bold text-slate-600">
          <span className="px-2">Ukuran Kertas:</span>
          <button
            onClick={() => setPaperSize('A4')}
            className={`rounded px-2.5 py-1 ${paperSize === 'A4' ? 'bg-blue-600 text-white' : 'hover:bg-slate-100'}`}
          >
            A4
          </button>
          <button
            onClick={() => setPaperSize('F4')}
            className={`rounded px-2.5 py-1 ${paperSize === 'F4' ? 'bg-blue-600 text-white' : 'hover:bg-slate-100'}`}
          >
            F4 (Folio)
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* PRINTABLE DOCUMENT PREVIEW CONTAINER                                     */}
      {/* ========================================================================= */}
      <div
        ref={printAreaRef}
        id="printable-document-sheet"
        className="mx-auto w-full max-w-6xl rounded-xl border border-slate-300 bg-white p-6 sm:p-10 shadow-lg text-slate-900 font-sans print:border-none print:shadow-none print:p-0 print:m-0"
      >
        {/* ================= REPORT 1: LEMBAR ANALISIS HASIL UJIAN MURID ================= */}
        {activeReport === 'exam_sheet' && (
          <div className="space-y-4">
            {/* Header Kop Madrasah */}
            <div className="text-center border-b-2 border-slate-900 pb-3">
              <h1 className="text-base sm:text-lg font-black tracking-wide uppercase">{config.title}</h1>
              <h2 className="text-lg sm:text-xl font-black text-slate-900 uppercase mt-0.5">{config.schoolName}</h2>
              <p className="text-xs sm:text-sm font-bold text-slate-700 mt-0.5 uppercase tracking-wider">
                {config.academicYear}
              </p>

              {/* Meta Grid */}
              <div className="mt-3 flex flex-wrap items-center justify-between text-xs font-bold px-2 pt-1 border-t border-slate-300">
                <span>KELAS : {config.className}</span>
                <span>FAN / MATA PELAJARAN : {config.subjectName}</span>
                <span>KKM : {config.kkm}</span>
                <span>JUMLAH SISWA : {rows.length} ORANG</span>
              </div>
            </div>

            {/* Analysis Matrix Table */}
            <div className="overflow-x-auto">
              <table className="w-full border-collapse border border-slate-800 text-[11px]">
                <thead>
                  <tr className="bg-slate-200 text-slate-900">
                    <th rowSpan={2} className="border border-slate-800 px-2 py-1.5 text-center w-8">NO</th>
                    <th rowSpan={2} className="border border-slate-800 px-3 py-1.5 text-left">NAMA MURID</th>
                    {pgQuestions.length > 0 && (
                      <th colSpan={pgQuestions.length} className="border border-slate-800 px-2 py-1 text-center bg-blue-100">
                        PILIHAN GANDA (POIN {pgQuestions[0]?.maxScore || 5})
                      </th>
                    )}
                    {isianQuestions.length > 0 && (
                      <th colSpan={isianQuestions.length} className="border border-slate-800 px-2 py-1 text-center bg-purple-100">
                        ISIAN (POIN {isianQuestions[0]?.maxScore || 6})
                      </th>
                    )}
                    {uraianQuestions.length > 0 && (
                      <th colSpan={uraianQuestions.length} className="border border-slate-800 px-2 py-1 text-center bg-green-100">
                        URAIAN (POIN {uraianQuestions[0]?.maxScore || 7})
                      </th>
                    )}
                    <th rowSpan={2} className="border border-slate-800 px-2 py-1.5 text-center bg-slate-100">JML BENAR</th>
                    <th rowSpan={2} className="border border-slate-800 px-2 py-1.5 text-center bg-slate-100">JML SALAH</th>
                    <th rowSpan={2} className="border border-slate-800 px-2.5 py-1.5 text-center bg-slate-200 font-black">NILAI</th>
                    <th rowSpan={2} className="border border-slate-800 px-2 py-1.5 text-center">KET</th>
                  </tr>
                  <tr className="bg-slate-100 text-slate-800 text-[10px]">
                    {pgQuestions.map((q) => (
                      <th key={q.id} className="border border-slate-800 px-1.5 py-1 text-center bg-blue-50">{q.number}</th>
                    ))}
                    {isianQuestions.map((q) => (
                      <th key={q.id} className="border border-slate-800 px-1.5 py-1 text-center bg-purple-50">{q.number}</th>
                    ))}
                    {uraianQuestions.map((q) => (
                      <th key={q.id} className="border border-slate-800 px-1.5 py-1 text-center bg-green-50">{q.number}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r, idx) => (
                    <tr key={r.studentId} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/60'}>
                      <td className="border border-slate-700 px-2 py-1 text-center font-medium">{idx + 1}</td>
                      <td className="border border-slate-700 px-3 py-1 font-bold text-slate-900 whitespace-nowrap">{r.studentName}</td>
                      {config.questions.map((q) => {
                        const s = r.scores[q.id] || 0;
                        return (
                          <td key={q.id} className="border border-slate-700 px-1 py-1 text-center font-medium">
                            {s > 0 ? s : '0'}
                          </td>
                        );
                      })}
                      <td className="border border-slate-700 px-2 py-1 text-center font-bold text-blue-900">{r.correctQuestionsCount}</td>
                      <td className="border border-slate-700 px-2 py-1 text-center font-bold text-red-700">{r.wrongQuestionsCount}</td>
                      <td className="border border-slate-700 px-2 py-1 text-center font-black bg-slate-100 text-slate-900 text-xs">
                        {r.totalScore}
                      </td>
                      <td className={`border border-slate-700 px-2 py-1 text-center font-bold text-[10px] ${r.isPassed ? 'text-emerald-800' : 'text-red-800'}`}>
                        {r.isPassed ? 'TUNTAS' : 'REMEDIAL'}
                      </td>
                    </tr>
                  ))}

                  {/* Summary Rows */}
                  <tr className="bg-slate-100 font-bold">
                    <td colSpan={2} className="border border-slate-800 px-2 py-1.5 text-center">JUMLAH JAWABAN BENAR</td>
                    {config.questions.map((q) => {
                      const qa = questionAnalyses.find((a) => a.questionId === q.id);
                      return (
                        <td key={q.id} className="border border-slate-800 px-1 py-1 text-center font-bold text-blue-900">
                          {qa ? qa.correctCount : 0}
                        </td>
                      );
                    })}
                    <td colSpan={4} className="border border-slate-800 bg-slate-200"></td>
                  </tr>

                  <tr className="bg-slate-100 font-bold">
                    <td colSpan={2} className="border border-slate-800 px-2 py-1.5 text-center">JUMLAH JAWABAN SALAH</td>
                    {config.questions.map((q) => {
                      const qa = questionAnalyses.find((a) => a.questionId === q.id);
                      return (
                        <td key={q.id} className="border border-slate-800 px-1 py-1 text-center font-bold text-red-700">
                          {qa ? qa.wrongCount : 0}
                        </td>
                      );
                    })}
                    <td colSpan={4} className="border border-slate-800 bg-slate-200"></td>
                  </tr>

                  <tr className="bg-slate-100 font-bold text-[10px]">
                    <td colSpan={2} className="border border-slate-800 px-2 py-1.5 text-center">TINGKAT KESUKARAN (P)</td>
                    {config.questions.map((q) => {
                      const qa = questionAnalyses.find((a) => a.questionId === q.id);
                      return (
                        <td key={q.id} className="border border-slate-800 px-0.5 py-1 text-center">
                          {qa ? `${qa.difficultyCategory.slice(0, 1)} (${qa.difficultyIndex})` : '-'}
                        </td>
                      );
                    })}
                    <td colSpan={4} className="border border-slate-800 bg-slate-200"></td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Official Signatures */}
            <div className="mt-8 grid grid-cols-2 text-center text-xs font-semibold pt-4">
              <div>
                <p>Mengetahui,</p>
                <p className="font-bold">Kepala Madrasah</p>
                <div className="h-16"></div>
                <p className="font-black text-slate-900 underline">{config.headmasterName}</p>
              </div>

              <div>
                <p
                  onClick={() => setShowConfigDrawer(true)}
                  className="cursor-pointer hover:text-blue-700 transition"
                  title="Klik untuk mengubah titimangsa tanggal"
                >
                  {formatSignatureDate(config)}
                </p>
                <p className="font-bold">Wali Kelas / Guru Pengampu</p>
                <div className="h-16"></div>
                <p className="font-black text-slate-900 underline">{config.teacherName || '...........................................'}</p>
              </div>
            </div>
          </div>
        )}

        {/* ================= REPORT 2: PROGRAM & PELAKSANAAN REMEDIAL ================= */}
        {activeReport === 'remedial' && (
          <div className="space-y-4">
            <div className="text-center border-b-2 border-slate-900 pb-3">
              <h1 className="text-base sm:text-lg font-black uppercase">
                PROGRAM & PELAKSANAAN REMEDIAL (PERBAIKAN PEMBELAJARAN)
              </h1>
              <h2 className="text-lg font-black uppercase mt-0.5">{config.schoolName}</h2>
              <p className="text-xs font-bold text-slate-700 mt-0.5">
                Tahun Ajaran: {config.academicYear} | Mata Pelajaran: {config.subjectName} | Kelas: {config.className} | KKM: {config.kkm}
              </p>
            </div>

            <table className="w-full border-collapse border border-slate-800 text-xs">
              <thead>
                <tr className="bg-red-800 text-white text-center font-bold">
                  <th className="border border-slate-800 px-2 py-2 w-10">NO</th>
                  <th className="border border-slate-800 px-3 py-2 text-left">NAMA SISWA</th>
                  <th className="border border-slate-800 px-2 py-2 w-16">NILAI AWAL</th>
                  <th className="border border-slate-800 px-3 py-2 text-left">BUTIR SOAL / MATERI BELUM TUNTAS</th>
                  <th className="border border-slate-800 px-3 py-2 text-left">BENTUK PELAKSANAAN REMEDIAL</th>
                  <th className="border border-slate-800 px-2 py-2 w-20">NILAI AKHIR</th>
                  <th className="border border-slate-800 px-2 py-2 w-16">KET</th>
                </tr>
              </thead>
              <tbody>
                {stats.remedialDetails && stats.remedialDetails.length > 0 ? (
                  stats.remedialDetails.map((s, idx) => (
                    <tr key={s.studentId} className={idx % 2 === 0 ? 'bg-white' : 'bg-red-50/30'}>
                      <td className="border border-slate-700 px-2 py-2 text-center font-medium">{idx + 1}</td>
                      <td className="border border-slate-700 px-3 py-2 font-bold text-slate-900">{s.name}</td>
                      <td className="border border-slate-700 px-2 py-2 text-center font-black text-red-700">{s.score}</td>
                      <td className="border border-slate-700 px-3 py-2 text-slate-800">
                        {s.wrongQuestionNumbers.length > 0
                          ? `Soal No. ${s.wrongQuestionNumbers.join(', ')} (${s.deficientTypes.join(', ')})`
                          : 'Konsep Dasar Materi Pokok'}
                      </td>
                      <td className="border border-slate-700 px-3 py-2 text-slate-800">{s.suggestedAction}</td>
                      <td className="border border-slate-700 px-2 py-2 text-center font-bold bg-slate-50"></td>
                      <td className="border border-slate-700 px-2 py-2 text-center font-bold text-emerald-800">TUNTAS</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={7} className="border border-slate-700 py-6 text-center text-slate-500 font-bold bg-emerald-50">
                      Alhamdulillah, Seluruh Siswa Telah Mencapai Nilai KKM ({config.kkm}).
                    </td>
                  </tr>
                )}
              </tbody>
            </table>

            {/* Notes */}
            <div className="rounded-lg border border-slate-300 p-3 text-xs text-slate-700 space-y-1 bg-slate-50">
              <p className="font-bold text-slate-900">Petunjuk & Ketentuan Remedial:</p>
              <p>1. Remedial dilaksanakan bagi siswa yang memperoleh nilai di bawah KKM ({config.kkm}).</p>
              <p>2. Bentuk bimbingan disesuaikan dengan jenis kesulitan butir soal (bimbingan perorangan / tutor sebaya / tugas terstruktur).</p>
              <p>3. Nilai akhir remedial maksimal adalah batas KKM ({config.kkm}) sesuai juknis madrasah.</p>
            </div>

            {/* Signatures */}
            <div className="mt-8 grid grid-cols-2 text-center text-xs font-semibold pt-4">
              <div>
                <p>Mengetahui,</p>
                <p className="font-bold">Kepala Madrasah</p>
                <div className="h-16"></div>
                <p className="font-black text-slate-900 underline">{config.headmasterName}</p>
              </div>

              <div>
                <p
                  onClick={() => setShowConfigDrawer(true)}
                  className="cursor-pointer hover:text-blue-700 transition"
                  title="Klik untuk mengubah titimangsa tanggal"
                >
                  {formatSignatureDate(config)}
                </p>
                <p className="font-bold">Guru Pengampu / Wali Kelas</p>
                <div className="h-16"></div>
                <p className="font-black text-slate-900 underline">{config.teacherName || '...........................................'}</p>
              </div>
            </div>
          </div>
        )}

        {/* ================= REPORT 3: PROGRAM PENGAYAAN ================= */}
        {activeReport === 'enrichment' && (
          <div className="space-y-4">
            <div className="text-center border-b-2 border-slate-900 pb-3">
              <h1 className="text-base sm:text-lg font-black uppercase">
                PROGRAM PENGAYAAN SISWA BERPRESTASI
              </h1>
              <h2 className="text-lg font-black uppercase mt-0.5">{config.schoolName}</h2>
              <p className="text-xs font-bold text-slate-700 mt-0.5">
                Tahun Ajaran: {config.academicYear} | Mata Pelajaran: {config.subjectName} | Kelas: {config.className} | KKM: {config.kkm}
              </p>
            </div>

            <table className="w-full border-collapse border border-slate-800 text-xs">
              <thead>
                <tr className="bg-emerald-800 text-white text-center font-bold">
                  <th className="border border-slate-800 px-2 py-2 w-10">NO</th>
                  <th className="border border-slate-800 px-3 py-2 text-left">NAMA SISWA</th>
                  <th className="border border-slate-800 px-2 py-2 w-20">NILAI AWAL</th>
                  <th className="border border-slate-800 px-3 py-2 text-left">BENTUK KEGIATAN PENGAYAAN</th>
                  <th className="border border-slate-800 px-3 py-2 text-center w-36">METODE PELAKSANAAN</th>
                  <th className="border border-slate-800 px-2 py-2 w-24">STATUS</th>
                </tr>
              </thead>
              <tbody>
                {stats.enrichmentDetails && stats.enrichmentDetails.length > 0 ? (
                  stats.enrichmentDetails.map((s, idx) => (
                    <tr key={s.studentId} className={idx % 2 === 0 ? 'bg-white' : 'bg-emerald-50/30'}>
                      <td className="border border-slate-700 px-2 py-2 text-center font-medium">{idx + 1}</td>
                      <td className="border border-slate-700 px-3 py-2 font-bold text-slate-900">{s.name}</td>
                      <td className="border border-slate-700 px-2 py-2 text-center font-black text-emerald-800">{s.score}</td>
                      <td className="border border-slate-700 px-3 py-2 text-slate-800">{s.suggestedActivity}</td>
                      <td className="border border-slate-700 px-3 py-2 text-center font-medium">Mandiri / Tutor Sebaya</td>
                      <td className="border border-slate-700 px-2 py-2 text-center font-bold text-emerald-800">TERLAKSANA</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="border border-slate-700 py-6 text-center text-slate-500 font-bold">
                      Belum ada data siswa tuntas KKM untuk pengayaan.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>

            {/* Signatures */}
            <div className="mt-8 grid grid-cols-2 text-center text-xs font-semibold pt-4">
              <div>
                <p>Mengetahui,</p>
                <p className="font-bold">Kepala Madrasah</p>
                <div className="h-16"></div>
                <p className="font-black text-slate-900 underline">{config.headmasterName}</p>
              </div>

              <div>
                <p
                  onClick={() => setShowConfigDrawer(true)}
                  className="cursor-pointer hover:text-blue-700 transition"
                  title="Klik untuk mengubah titimangsa tanggal"
                >
                  {formatSignatureDate(config)}
                </p>
                <p className="font-bold">Guru Pengampu / Wali Kelas</p>
                <div className="h-16"></div>
                <p className="font-black text-slate-900 underline">{config.teacherName || '...........................................'}</p>
              </div>
            </div>
          </div>
        )}

        {/* ================= REPORT 4: REKAPITULASI KUALITAS BUTIR SOAL ================= */}
        {activeReport === 'item_analysis' && (
          <div className="space-y-4">
            <div className="text-center border-b-2 border-slate-900 pb-3">
              <h1 className="text-base sm:text-lg font-black uppercase">
                REKAPITULASI ANALISIS KUALITAS BUTIR SOAL (PSIKOMETRI)
              </h1>
              <h2 className="text-lg font-black uppercase mt-0.5">{config.schoolName}</h2>
              <p className="text-xs font-bold text-slate-700 mt-0.5">
                Tahun Ajaran: {config.academicYear} | Mata Pelajaran: {config.subjectName} | Kelas: {config.className}
              </p>
            </div>

            <table className="w-full border-collapse border border-slate-800 text-xs">
              <thead>
                <tr className="bg-slate-900 text-white text-center font-bold">
                  <th className="border border-slate-800 px-2 py-2 w-12">NO SOAL</th>
                  <th className="border border-slate-800 px-2 py-2 w-16">TIPE</th>
                  <th className="border border-slate-800 px-2 py-2 w-14">BOBOT</th>
                  <th className="border border-slate-800 px-2 py-2 w-14">BENAR</th>
                  <th className="border border-slate-800 px-2 py-2 w-14">SALAH</th>
                  <th className="border border-slate-800 px-2 py-2 w-20">INDEKS (P)</th>
                  <th className="border border-slate-800 px-3 py-2 w-24">KESUKARAN</th>
                  <th className="border border-slate-800 px-2 py-2 w-20">DAYA BEDA (D)</th>
                  <th className="border border-slate-800 px-3 py-2 w-28">KATEGORI D</th>
                  <th className="border border-slate-800 px-3 py-2">STATUS REKOMENDASI</th>
                </tr>
              </thead>
              <tbody>
                {questionAnalyses.map((q, idx) => (
                  <tr key={q.questionId} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50'}>
                    <td className="border border-slate-700 px-2 py-1.5 text-center font-bold">{q.number}</td>
                    <td className="border border-slate-700 px-2 py-1.5 text-center uppercase text-[10px] font-semibold">{q.type}</td>
                    <td className="border border-slate-700 px-2 py-1.5 text-center font-medium">{q.maxScore}</td>
                    <td className="border border-slate-700 px-2 py-1.5 text-center font-bold text-blue-800">{q.correctCount}</td>
                    <td className="border border-slate-700 px-2 py-1.5 text-center font-bold text-red-700">{q.wrongCount}</td>
                    <td className="border border-slate-700 px-2 py-1.5 text-center font-bold">{q.difficultyIndex}</td>
                    <td className="border border-slate-700 px-2 py-1.5 text-center font-semibold">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        q.difficultyCategory === 'Mudah' ? 'bg-emerald-100 text-emerald-800' : q.difficultyCategory === 'Sedang' ? 'bg-blue-100 text-blue-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {q.difficultyCategory}
                      </span>
                    </td>
                    <td className="border border-slate-700 px-2 py-1.5 text-center font-bold">{q.discriminationIndex ?? 0}</td>
                    <td className="border border-slate-700 px-2 py-1.5 text-center font-medium text-[11px]">{q.discriminationCategory ?? '-'}</td>
                    <td className="border border-slate-700 px-3 py-1.5 text-center font-bold">
                      <span className={`px-2.5 py-0.5 rounded text-[11px] font-bold ${
                        q.itemRecommendation === 'Diterima' ? 'bg-emerald-100 text-emerald-800' : q.itemRecommendation === 'Diterima & Direvisi' ? 'bg-amber-100 text-amber-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {q.itemRecommendation ?? 'Diterima'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Quality Summary Box */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 p-3 rounded-lg border border-slate-300 text-xs">
              <div className="text-center p-2 bg-white rounded border border-slate-200">
                <span className="text-slate-500">Soal Diterima (Baik)</span>
                <p className="text-lg font-black text-emerald-700">{stats.qualitySummary?.accepted || 0} Soal</p>
              </div>
              <div className="text-center p-2 bg-white rounded border border-slate-200">
                <span className="text-slate-500">Perlu Revisi</span>
                <p className="text-lg font-black text-amber-600">{stats.qualitySummary?.revised || 0} Soal</p>
              </div>
              <div className="text-center p-2 bg-white rounded border border-slate-200">
                <span className="text-slate-500">Ditolak / Diganti</span>
                <p className="text-lg font-black text-red-600">{stats.qualitySummary?.rejected || 0} Soal</p>
              </div>
              <div className="text-center p-2 bg-white rounded border border-slate-200">
                <span className="text-slate-500">Komposisi Soal</span>
                <p className="text-xs font-bold text-slate-800 mt-1">
                  M: {stats.qualitySummary?.easyCount} | S: {stats.qualitySummary?.mediumCount} | Skr: {stats.qualitySummary?.hardCount}
                </p>
              </div>
            </div>

            {/* Signatures */}
            <div className="mt-8 grid grid-cols-2 text-center text-xs font-semibold pt-4">
              <div>
                <p>Mengetahui,</p>
                <p className="font-bold">Kepala Madrasah</p>
                <div className="h-16"></div>
                <p className="font-black text-slate-900 underline">{config.headmasterName}</p>
              </div>

              <div>
                <p
                  onClick={() => setShowConfigDrawer(true)}
                  className="cursor-pointer hover:text-blue-700 transition"
                  title="Klik untuk mengubah titimangsa tanggal"
                >
                  {formatSignatureDate(config)}
                </p>
                <p className="font-bold">Guru Pengampu / Tim Evaluasi</p>
                <div className="h-16"></div>
                <p className="font-black text-slate-900 underline">{config.teacherName || '...........................................'}</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
