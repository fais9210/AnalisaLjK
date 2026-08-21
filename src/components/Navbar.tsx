import React from 'react';
import {
  FileSpreadsheet,
  BarChart3,
  Users,
  Database,
  GraduationCap,
  Printer,
} from 'lucide-react';

export type ActiveTab = 'table' | 'dashboard' | 'reports' | 'master' | 'history';

interface NavbarProps {
  activeTab: ActiveTab;
  onSelectTab: (tab: ActiveTab) => void;
  schoolName: string;
  academicYear: string;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  onSelectTab,
  schoolName,
  academicYear,
}) => {
  return (
    <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 backdrop-blur-md shadow-2xs">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between gap-4">
          {/* Logo & School Title */}
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-700 text-white shadow-sm ring-2 ring-blue-500/20">
              <GraduationCap className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base sm:text-lg font-black tracking-tight text-slate-900 leading-tight">
                  Analisis Hasil Ujian Siswa
                </h1>
                <span className="hidden sm:inline-flex items-center rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-bold text-blue-700 border border-blue-200">
                  v2.0 Otomatis
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium truncate max-w-xs sm:max-w-md">
                {schoolName} • {academicYear}
              </p>
            </div>
          </div>

          {/* Tab Navigation */}
          <nav className="flex items-center gap-1 sm:gap-2">
            <button
              id="nav-tab-table"
              onClick={() => onSelectTab('table')}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs sm:text-sm font-bold transition ${
                activeTab === 'table'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              <FileSpreadsheet className="h-4 w-4" />
              <span className="hidden md:inline">Lembar Analisa</span>
              <span className="md:hidden">Lembar</span>
            </button>

            <button
              id="nav-tab-dashboard"
              onClick={() => onSelectTab('dashboard')}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs sm:text-sm font-bold transition ${
                activeTab === 'dashboard'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              <BarChart3 className="h-4 w-4" />
              <span className="hidden md:inline">Statistik & Pedagogis</span>
              <span className="md:hidden">Statistik</span>
            </button>

            <button
              id="nav-tab-reports"
              onClick={() => onSelectTab('reports')}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs sm:text-sm font-bold transition ${
                activeTab === 'reports'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              <Printer className="h-4 w-4" />
              <span className="hidden md:inline">Pelaporan & Cetak</span>
              <span className="md:hidden">Cetak</span>
            </button>

            <button
              id="nav-tab-master"
              onClick={() => onSelectTab('master')}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs sm:text-sm font-bold transition ${
                activeTab === 'master'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              <Users className="h-4 w-4" />
              <span className="hidden md:inline">Data Siswa & Guru</span>
              <span className="md:hidden">Master</span>
            </button>

            <button
              id="nav-tab-history"
              onClick={() => onSelectTab('history')}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs sm:text-sm font-bold transition ${
                activeTab === 'history'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              <Database className="h-4 w-4" />
              <span className="hidden md:inline">Database & Riwayat</span>
              <span className="md:hidden">Database</span>
            </button>
          </nav>
        </div>
      </div>
    </header>
  );
};

