import React from 'react';
import {
  FileSpreadsheet,
  BarChart3,
  Users,
  Database,
  GraduationCap,
  Printer,
  X,
  Layers,
  BookOpen,
  UserCheck,
  CheckCircle2,
  Sliders,
  PanelLeftClose,
  ChevronLeft,
} from 'lucide-react';
import { ExamSheetConfig } from '../types';

export type ActiveTab = 'table' | 'dashboard' | 'reports' | 'master' | 'history';

interface SidebarProps {
  activeTab: ActiveTab;
  onSelectTab: (tab: ActiveTab) => void;
  config?: ExamSheetConfig | null;
  onOpenConfigModal?: () => void;
  isOpen: boolean;
  onToggle: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onSelectTab,
  config,
  onOpenConfigModal,
  isOpen,
  onToggle,
}) => {
  const menuItems: {
    id: ActiveTab;
    label: string;
    description: string;
    icon: React.FC<{ className?: string }>;
    badge?: string;
  }[] = [
    {
      id: 'table',
      label: 'Lembar Analisa',
      description: 'Tabel Skor & Butir Soal',
      icon: FileSpreadsheet,
    },
    {
      id: 'dashboard',
      label: 'Statistik & Pedagogis',
      description: 'Psikometri & Rekomendasi AI',
      icon: BarChart3,
      badge: 'Psikometri',
    },
    {
      id: 'reports',
      label: 'Pelaporan & Cetak',
      description: 'Format Cetak F4/A4 & Excel',
      icon: Printer,
      badge: '5-in-1',
    },
    {
      id: 'master',
      label: 'Data Siswa & Guru',
      description: 'Kelola Kelas, Siswa, Guru & Mapel',
      icon: Users,
    },
    {
      id: 'history',
      label: 'Database & Riwayat',
      description: 'Arsip Rekaman & Backup Data',
      icon: Database,
    },
  ];

  const handleTabClick = (tabId: ActiveTab) => {
    onSelectTab(tabId);
    // On small screens, close sidebar after choosing a tab
    if (window.innerWidth < 1024) {
      onToggle();
    }
  };

  return (
    <>
      {/* Mobile Backdrop Overlay (only on mobile when open) */}
      {isOpen && (
        <div
          id="sidebar-backdrop"
          className="fixed inset-0 z-40 bg-slate-950/60 backdrop-blur-xs lg:hidden print:hidden transition-opacity"
          onClick={onToggle}
          aria-hidden="true"
        />
      )}

      {/* Main Left Sidebar */}
      <aside
        id="app-sidebar-left"
        className={`fixed inset-y-0 left-0 z-50 flex w-72 flex-col bg-slate-900 text-slate-100 border-r border-slate-800 shadow-2xl transition-transform duration-300 ease-in-out print:hidden ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Sidebar Header with Brand & Close Button */}
        <div className="flex items-center justify-between border-b border-slate-800/80 px-4 py-4 bg-slate-950/60">
          <div className="flex items-center gap-3 min-w-0">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-indigo-700 text-white shadow-md ring-2 ring-blue-400/20">
              <GraduationCap className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <h2 className="text-xs font-black tracking-tight text-white uppercase truncate">
                  Analisis Ujian
                </h2>
                <span className="rounded-sm bg-emerald-500/20 px-1 py-0.2 text-[9px] font-bold text-emerald-400 border border-emerald-500/30">
                  v2.0
                </span>
              </div>
              <p className="text-[11px] font-semibold text-blue-300/90 truncate mt-0.5">
                {config?.schoolName || 'MMU A-22 KARANGNONGKO'}
              </p>
            </div>
          </div>

          {/* Hide Sidebar Button */}
          <button
            id="sidebar-collapse-button"
            onClick={onToggle}
            title="Sembunyikan Menu Samping"
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-700/60 bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white transition"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
        </div>

        {/* Navigation Items */}
        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-1.5 scrollbar-thin scrollbar-thumb-slate-700">
          <div className="px-3 pb-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">
            Menu Navigasi
          </div>

          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                id={`sidebar-nav-${item.id}`}
                onClick={() => handleTabClick(item.id)}
                className={`group relative flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-all ${
                  isActive
                    ? 'bg-blue-600 text-white font-bold shadow-md shadow-blue-900/30 ring-1 ring-blue-400/30'
                    : 'text-slate-300 hover:bg-slate-800/80 hover:text-white font-medium'
                }`}
              >
                <div
                  className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition-colors ${
                    isActive
                      ? 'bg-white/20 text-white'
                      : 'bg-slate-800 text-slate-400 group-hover:bg-slate-700 group-hover:text-blue-400'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-1">
                    <span className="text-xs sm:text-sm tracking-tight truncate">{item.label}</span>
                    {item.badge && (
                      <span
                        className={`text-[9px] font-extrabold uppercase px-1.5 py-0.2 rounded-full shrink-0 ${
                          isActive
                            ? 'bg-white/25 text-white'
                            : 'bg-blue-950 text-blue-300 border border-blue-800/50'
                        }`}
                      >
                        {item.badge}
                      </span>
                    )}
                  </div>
                  <p
                    className={`text-[10px] truncate mt-0.5 ${
                      isActive ? 'text-blue-100/90' : 'text-slate-400 group-hover:text-slate-300'
                    }`}
                  >
                    {item.description}
                  </p>
                </div>
              </button>
            );
          })}
        </div>

        {/* Active Context Card at bottom */}
        {config && (
          <div className="p-3 border-t border-slate-800/80 bg-slate-950/60">
            <div className="rounded-xl bg-slate-800/90 border border-slate-700/80 p-3 shadow-inner">
              <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-700/60">
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 flex items-center gap-1">
                  <CheckCircle2 className="h-3 w-3 text-emerald-400" />
                  Konteks Aktif
                </span>
                {onOpenConfigModal && (
                  <button
                    onClick={onOpenConfigModal}
                    title="Pengaturan Format Soal & Ujian"
                    className="flex items-center gap-1 text-[10px] font-bold text-blue-400 hover:text-blue-300 transition"
                  >
                    <Sliders className="h-3 w-3" />
                    Ubah
                  </button>
                )}
              </div>

              <div className="space-y-1.5 text-xs">
                <div className="flex items-center justify-between gap-1">
                  <span className="text-slate-400 flex items-center gap-1 text-[11px]">
                    <Layers className="h-3 w-3 text-blue-400" /> Kelas:
                  </span>
                  <span className="font-bold text-white truncate max-w-[125px] text-[11px]">
                    {config.className}
                  </span>
                </div>

                <div className="flex items-center justify-between gap-1">
                  <span className="text-slate-400 flex items-center gap-1 text-[11px]">
                    <BookOpen className="h-3 w-3 text-emerald-400" /> Fan / Mapel:
                  </span>
                  <span className="font-bold text-emerald-300 truncate max-w-[125px] text-[11px]">
                    {config.subjectName}
                  </span>
                </div>

                <div className="flex items-center justify-between gap-1">
                  <span className="text-slate-400 flex items-center gap-1 text-[11px]">
                    <UserCheck className="h-3 w-3 text-purple-400" /> Guru:
                  </span>
                  <span className="font-bold text-purple-300 truncate max-w-[125px] text-[11px]">
                    {config.teacherName || 'Belum diatur'}
                  </span>
                </div>

                <div className="flex items-center justify-between pt-1 text-[11px]">
                  <span className="text-slate-400">KKM:</span>
                  <span className="font-extrabold text-amber-400 bg-amber-950/60 border border-amber-800/60 px-1.5 py-0.2 rounded text-[10px]">
                    {config.kkm} Poin
                  </span>
                </div>
              </div>
            </div>

            {/* Quick Hide Footer Action */}
            <button
              id="sidebar-hide-text-button"
              onClick={onToggle}
              className="mt-2.5 flex w-full items-center justify-center gap-1.5 rounded-lg border border-slate-700/60 bg-slate-800/60 py-1.5 text-[11px] font-medium text-slate-400 hover:bg-slate-800 hover:text-slate-200 transition"
            >
              <PanelLeftClose className="h-3.5 w-3.5" />
              Sembunyikan Menu Samping
            </button>
          </div>
        )}
      </aside>
    </>
  );
};
