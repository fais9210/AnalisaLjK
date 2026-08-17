import React, { useEffect, useRef, useState } from 'react';
import { ExamRecord } from '../types';
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
  History,
  Archive,
  CloudUpload,
  CloudDownload,
  RefreshCw,
  Server,
  Zap,
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

  // Cloud Neon DB state
  const [cloudStatus, setCloudStatus] = useState<{
    loading: boolean;
    connected: boolean;
    version?: string;
    error?: string;
  }>({
    loading: true,
    connected: false,
  });
  const [isSyncingToCloud, setIsSyncingToCloud] = useState(false);
  const [isSyncingFromCloud, setIsSyncingFromCloud] = useState(false);

  const showToast = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3500);
  };

  const checkDb = async () => {
    setCloudStatus((prev) => ({ ...prev, loading: true }));
    const res = await StorageService.checkCloudDbStatus();
    setCloudStatus({
      loading: false,
      connected: res.connected,
      version: res.version,
      error: res.error,
    });
  };

  useEffect(() => {
    checkDb();
  }, []);

  const handlePushToCloud = async () => {
    setIsSyncingToCloud(true);
    const res = await StorageService.syncToCloudDb();
    setIsSyncingToCloud(false);
    if (res.success) {
      showToast(res.message || 'Berhasil mengunggah seluruh data ke Neon DB!');
      checkDb();
    } else {
      showToast(`Gagal sinkronisasi: ${res.message}`);
    }
  };

  const handlePullFromCloud = async () => {
    setIsSyncingFromCloud(true);
    const res = await StorageService.syncFromCloudDb();
    setIsSyncingFromCloud(false);
    if (res.success) {
      onRefreshAllData();
      showToast(res.message || 'Berhasil memperbarui data lokal dari Neon DB!');
    } else {
      showToast(`Gagal mengambil data dari cloud: ${res.message}`);
    }
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
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-3 text-sm font-medium text-white shadow-xl animate-in fade-in">
          <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
          <span>{notification}</span>
        </div>
      )}

      {/* Cloud Database (Neon DB / Render) Card */}
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-xs">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-4 mb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-xs">
              <Server className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-slate-900">Integrasi Cloud Database (Neon DB & Render)</h3>
                {cloudStatus.loading ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-600">
                    <RefreshCw className="h-3 w-3 animate-spin" /> Memeriksa...
                  </span>
                ) : cloudStatus.connected ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-0.5 text-[11px] font-bold text-emerald-800 border border-emerald-200">
                    <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" /> Terhubung ke Neon DB
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-0.5 text-[11px] font-bold text-amber-800 border border-amber-200">
                    Mode Lokal / Standalone
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                {cloudStatus.connected
                  ? 'Aplikasi terhubung ke PostgreSQL Neon DB. Data tersinkronisasi di cloud.'
                  : 'Variabel DATABASE_URL belum terpasang. Data disimpan aman di browser dan siap disambungkan ke Neon DB saat deploy.'}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={checkDb}
              disabled={cloudStatus.loading}
              className="flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-50 transition disabled:opacity-50"
              title="Periksa koneksi PostgreSQL"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${cloudStatus.loading ? 'animate-spin' : ''}`} /> Cek Status
            </button>

            <button
              onClick={handlePushToCloud}
              disabled={isSyncingToCloud || !cloudStatus.connected}
              className="flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3.5 py-1.5 text-xs font-bold text-white hover:bg-indigo-700 transition shadow-2xs disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <CloudUpload className="h-3.5 w-3.5" />
              {isSyncingToCloud ? 'Mengunggah...' : 'Unggah ke Neon DB'}
            </button>

            <button
              onClick={handlePullFromCloud}
              disabled={isSyncingFromCloud || !cloudStatus.connected}
              className="flex items-center gap-1.5 rounded-lg border border-indigo-200 bg-indigo-50 px-3.5 py-1.5 text-xs font-bold text-indigo-700 hover:bg-indigo-100 transition shadow-2xs disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <CloudDownload className="h-3.5 w-3.5" />
              {isSyncingFromCloud ? 'Mengambil...' : 'Tarik dari Neon DB'}
            </button>
          </div>
        </div>

        <div className="rounded-lg bg-slate-50 border border-slate-200 p-3 text-xs text-slate-600 flex items-start gap-2.5">
          <Zap className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-slate-800">Petunjuk Konfigurasi Render & Neon DB:</p>
            <p className="mt-0.5 text-[11px] text-slate-500">
              Di dashboard <b>Render Web Service</b>, masukkan Environment Variable <code className="bg-white px-1.5 py-0.5 rounded border border-slate-200 font-mono text-indigo-700">DATABASE_URL</code> dengan connection string PostgreSQL dari <b>Neon DB</b> (contoh: <code className="text-slate-600 font-mono">postgres://user:pass@ep-xyz.aws.neon.tech/neondb?sslmode=require</code>). Aplikasi akan otomatis membuat tabel dan menyinkronkan data.
            </p>
          </div>
        </div>
      </div>

      {/* Database & Backup Actions Banner */}
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-xs">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-white shadow-xs">
              <Database className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Pencadangan File & Cadangan Lokal</h3>
              <p className="text-xs text-slate-500">
                Ekspor dan impor data lengkap master murid, guru, kelas, mata pelajaran, serta arsip rekaman ujian ke format file JSON.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={handleDownloadFullBackup}
              className="flex items-center gap-1.5 rounded-lg bg-blue-50 border border-blue-200 px-3.5 py-2 text-xs font-bold text-blue-700 hover:bg-blue-100 transition shadow-2xs"
            >
              <Download className="h-3.5 w-3.5" /> Unduh Backup (.JSON)
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
              <RotateCcw className="h-3.5 w-3.5" /> Reset Default
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
