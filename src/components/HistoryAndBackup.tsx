import React, { useRef, useState } from 'react';
import { ExamRecord, ExamSheetConfig, StudentScoreRow } from '../types';
import { StorageService } from '../services/storageService';
import {
  Database,
  Calendar,
  Download,
  Upload,
  RotateCcw,
  Trash2,
  Eye,
  CheckCircle2,
  FileSpreadsheet,
  FileText,
  AlertTriangle,
  History,
  Archive,
} from 'lucide-react';

interface HistoryAndBackupProps {
  examRecords: ExamRecord[];
  onLoadRecord: (record: ExamRecord) => void;
  onDeleteRecord: (recordId: string) => void;
  onRefreshAllData: () => void;
}

export const HistoryAndBackup: React.FC<HistoryAndBackupProps> = ({
  examRecords,
  onLoadRecord,
  onDeleteRecord,
  onRefreshAllData,
}) => {
  const backupInputRef = useRef<HTMLInputElement>(null);
  const [notification, setNotification] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3000);
  };

  const handleDownloadFullBackup = () => {
    const jsonStr = StorageService.exportFullBackup();
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Backup_Database_Analisis_Ujian_${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('File backup database lengkap (.json) berhasil diunduh.');
  };

  const handleImportBackupFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const success = StorageService.importFullBackup(text);
        if (success) {
          onRefreshAllData();
          showToast('Database berhasil dipulihkan dari file backup!');
        } else {
          alert('Format file backup tidak sesuai.');
        }
      } catch (err) {
        alert('Gagal memproses file backup.');
      }
    };
    reader.readAsText(file);
    if (backupInputRef.current) backupInputRef.current.value = '';
  };

  const handleResetFactory = () => {
    if (
      confirm(
        'PERINGATAN: Tindakan ini akan mengembalikan seluruh data murid, guru, dan lembar analisa ke data awal (default MMU A-22 Karangnongko Fiqih Kelas 1). Lanjutkan?'
      )
    ) {
      StorageService.resetToDefault();
      onRefreshAllData();
      showToast('Database berhasil di-reset ke data bawaan.');
    }
  };

  return (
    <div className="space-y-6">
      {notification && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-3 text-sm font-medium text-white shadow-xl">
          <CheckCircle2 className="h-4 w-4 text-emerald-400" />
          {notification}
        </div>
      )}

      {/* Database & Backup Actions Banner */}
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-xs">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-white shadow-xs">
              <Database className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Penyimpanan & Pencadangan Data Aman</h3>
              <p className="text-xs text-slate-500">
                Data tersimpan otomatis secara aman di database lokal browser dan dapat dicadangkan ke file JSON
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={handleDownloadFullBackup}
              className="flex items-center gap-1.5 rounded-lg bg-blue-50 border border-blue-200 px-3.5 py-2 text-xs font-bold text-blue-700 hover:bg-blue-100 transition shadow-2xs"
            >
              <Download className="h-3.5 w-3.5" /> Cadangkan Database (.JSON)
            </button>

            <label className="flex items-center gap-1.5 rounded-lg bg-white border border-slate-300 px-3.5 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 transition cursor-pointer shadow-2xs">
              <Upload className="h-3.5 w-3.5 text-blue-600" /> Pulihkan Data (.JSON)
              <input
                ref={backupInputRef}
                type="file"
                accept=".json"
                onChange={handleImportBackupFile}
                className="hidden"
              />
            </label>

            <button
              onClick={handleResetFactory}
              className="flex items-center gap-1.5 rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-xs font-bold text-red-700 hover:bg-red-100 transition shadow-2xs"
              title="Kembalikan semua data ke sampel bawaan"
            >
              <RotateCcw className="h-3.5 w-3.5" /> Reset Database Bawaan
            </button>
          </div>
        </div>
      </div>

      {/* Riwayat Sesi Analisa Ujian Tersimpan */}
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-xs">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-4">
          <div className="flex items-center gap-2">
            <History className="h-5 w-5 text-blue-600" />
            <div>
              <h3 className="font-bold text-slate-900 text-base">Riwayat Rekam Nilai & Analisa Ujian</h3>
              <p className="text-xs text-slate-500">Daftar lembar analisa yang pernah disimpan ke database</p>
            </div>
          </div>
          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-700 border border-slate-200">
            Total {examRecords.length} Arsip
          </span>
        </div>

        {examRecords.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center">
            <Archive className="mx-auto h-10 w-10 text-slate-400 mb-2" />
            <p className="font-bold text-slate-700 text-sm">Belum Ada Riwayat Ujian yang Disimpan</p>
            <p className="text-xs text-slate-500 mt-1">
              Buka tab <span className="font-bold text-blue-600">"Lembar Analisa"</span>, isi atau sesuaikan nilai siswa, lalu klik tombol <span className="font-bold text-blue-600">"Simpan"</span> untuk mengarsipkan ke database ini.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {examRecords.map((record) => {
              const totalStudents = record.rows.length;
              const passed = record.rows.filter((r) => r.isPassed).length;
              const avgScore =
                totalStudents > 0
                  ? (record.rows.reduce((sum, r) => sum + r.totalScore, 0) / totalStudents).toFixed(1)
                  : 0;

              return (
                <div
                  key={record.id}
                  className="flex flex-col justify-between rounded-xl border border-slate-200 bg-slate-50/50 p-5 shadow-2xs hover:border-blue-300 hover:shadow-xs transition"
                >
                  <div>
                    <div className="flex items-center justify-between text-xs text-slate-500 mb-2">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {new Date(record.updatedAt || record.createdAt).toLocaleDateString('id-ID', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                      <span className="rounded bg-blue-100 px-2 py-0.5 font-bold text-blue-800 text-[10px]">
                        Kelas {record.config.className}
                      </span>
                    </div>

                    <h4 className="font-bold text-slate-900 text-sm line-clamp-1">{record.config.title}</h4>
                    <p className="text-xs font-bold text-blue-700 mt-0.5">Fan: {record.config.subjectName}</p>
                    <p className="text-[11px] text-slate-500 mt-0.5">{record.config.schoolName}</p>

                    <div className="mt-3 grid grid-cols-3 gap-2 rounded-lg bg-white p-2.5 border border-slate-200 text-center text-xs">
                      <div>
                        <span className="text-[10px] text-slate-400">Siswa</span>
                        <p className="font-bold text-slate-800">{totalStudents}</p>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400">Rata-rata</span>
                        <p className="font-bold text-blue-700">{avgScore}</p>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400">Tuntas</span>
                        <p className="font-bold text-emerald-700">{passed}</p>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 flex items-center justify-between border-t border-slate-200 pt-3">
                    <button
                      onClick={() => onLoadRecord(record)}
                      className="flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-blue-700 transition shadow-2xs"
                    >
                      <Eye className="h-3.5 w-3.5" /> Buka Lembar Ini
                    </button>

                    <button
                      onClick={() => onDeleteRecord(record.id)}
                      className="rounded-lg p-1.5 text-slate-400 hover:bg-red-100 hover:text-red-600 transition"
                      title="Hapus arsip ini"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
