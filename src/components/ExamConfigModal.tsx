import React, { useState } from 'react';
import {
  ClassGroup,
  ExamSheetConfig,
  QuestionDefinition,
  QuestionType,
  Subject,
  Teacher,
} from '../types';
import { isSameClass } from '../services/analysisEngine';
import { Plus, Trash2, X, Check, Sliders } from 'lucide-react';

interface ExamConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: ExamSheetConfig;
  classes?: ClassGroup[];
  subjects?: Subject[];
  teachers?: Teacher[];
  onSave: (newConfig: ExamSheetConfig) => void;
}

export const ExamConfigModal: React.FC<ExamConfigModalProps> = ({
  isOpen,
  onClose,
  config,
  classes = [],
  subjects = [],
  teachers = [],
  onSave,
}) => {
  const [formData, setFormData] = useState<ExamSheetConfig>({ ...config });
  const [activeTab, setActiveTab] = useState<'info' | 'questions'>('info');

  if (!isOpen) return null;

  const handleFieldChange = (field: keyof ExamSheetConfig, value: any) => {
    setFormData((prev) => {
      const updated = { ...prev, [field]: value };
      if (field === 'className') {
        const foundClass = classes.find((c) => isSameClass(c.name, value));
        const assignedTeacher = teachers.find((t) => isSameClass(t.assignedClass, value));
        if (foundClass) {
          if (foundClass.waliKelasName) updated.teacherName = foundClass.waliKelasName;
          else if (assignedTeacher?.name) updated.teacherName = assignedTeacher.name;
          if (foundClass.academicYear) updated.academicYear = foundClass.academicYear;
        }
      }
      if (field === 'subjectName') {
        const foundSubj = subjects.find((s) => s.name.toUpperCase() === String(value).trim().toUpperCase());
        if (foundSubj) {
          updated.kkm = foundSubj.kkm;
        }
      }
      return updated;
    });
  };

  const handleAddQuestion = (type: QuestionType) => {
    const existingTypeQuestions = formData.questions.filter((q) => q.type === type);
    const nextNumber = existingTypeQuestions.length + 1;
    const defaultMaxScore = type === 'pg' ? 5 : type === 'isian' ? 6 : 7;
    const newId = `${type}_${Date.now()}`;

    const newQuestion: QuestionDefinition = {
      id: newId,
      number: nextNumber,
      type,
      maxScore: defaultMaxScore,
      label: `${type === 'pg' ? 'PG' : type === 'isian' ? 'Isian' : 'Uraian'} ${nextNumber}`,
    };

    setFormData((prev) => ({
      ...prev,
      questions: [...prev.questions, newQuestion],
    }));
  };

  const handleRemoveQuestion = (id: string) => {
    const target = formData.questions.find((q) => q.id === id);
    if (!target) return;

    const remaining = formData.questions.filter((q) => q.id !== id);
    // Renumber remaining questions of that type
    let num = 1;
    const renumbered = remaining.map((q) => {
      if (q.type === target.type) {
        const updated = {
          ...q,
          number: num,
          label: `${q.type === 'pg' ? 'PG' : q.type === 'isian' ? 'Isian' : 'Uraian'} ${num}`,
        };
        num++;
        return updated;
      }
      return q;
    });

    setFormData((prev) => ({ ...prev, questions: renumbered }));
  };

  const handleQuestionScoreChange = (id: string, score: number) => {
    setFormData((prev) => ({
      ...prev,
      questions: prev.questions.map((q) =>
        q.id === id ? { ...q, maxScore: Math.max(1, score) } : q
      ),
    }));
  };

  const calculateTotalMaxScore = () => {
    return formData.questions.reduce((sum, q) => sum + q.maxScore, 0);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      ...formData,
      updatedAt: new Date().toISOString(),
    });
    onClose();
  };

  const pgList = formData.questions.filter((q) => q.type === 'pg');
  const isianList = formData.questions.filter((q) => q.type === 'isian');
  const uraianList = formData.questions.filter((q) => q.type === 'uraian');

  return (
    <div id="exam-config-modal-overlay" className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
      <div id="exam-config-modal-card" className="flex max-h-[90vh] w-full max-w-3xl flex-col rounded-xl bg-white shadow-2xl overflow-hidden border border-slate-200">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4 bg-slate-50">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-600 text-white shadow-xs">
              <Sliders className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-800 text-lg">Pengaturan Format Ujian & Bobot Soal</h3>
              <p className="text-xs text-slate-500">Sesuaikan kop lembar analisa, KKM, dan distribusi butir soal</p>
            </div>
          </div>
          <button
            id="btn-close-config-modal"
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-200 hover:text-slate-700 transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-200 bg-white px-6">
          <button
            id="tab-btn-info"
            onClick={() => setActiveTab('info')}
            className={`border-b-2 py-3 px-4 text-sm font-semibold transition ${
              activeTab === 'info'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            1. Informasi Lembaga & Lembar
          </button>
          <button
            id="tab-btn-questions"
            onClick={() => setActiveTab('questions')}
            className={`border-b-2 py-3 px-4 text-sm font-semibold transition ${
              activeTab === 'questions'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            2. Struktur Butir Soal (PG, Isian, Uraian)
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6">
          {activeTab === 'info' ? (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Judul Format Analisa
                </label>
                <input
                  id="input-config-title"
                  type="text"
                  value={formData.title}
                  onChange={(e) => handleFieldChange('title', e.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-3.5 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
                  placeholder="e.g. LEMBAR ANALISA HASIL UJIAN MURID (IMDA 1)"
                  required
                />
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Nama Madrasah / Sekolah
                  </label>
                  <input
                    id="input-config-school"
                    type="text"
                    value={formData.schoolName}
                    onChange={(e) => handleFieldChange('schoolName', e.target.value)}
                    className="w-full rounded-lg border border-slate-300 px-3.5 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
                    placeholder="e.g. MMU A-22 KARANGNONGKO"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Tahun Ajaran
                  </label>
                  <input
                    id="input-config-year"
                    type="text"
                    value={formData.academicYear}
                    onChange={(e) => handleFieldChange('academicYear', e.target.value)}
                    className="w-full rounded-lg border border-slate-300 px-3.5 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
                    placeholder="e.g. TAHUN 1447-1448 H / 2024-2025"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Mata Pelajaran (Fan)
                  </label>
                  <input
                    id="input-config-subject"
                    type="text"
                    list="config-subject-list"
                    value={formData.subjectName}
                    onChange={(e) => handleFieldChange('subjectName', e.target.value)}
                    className="w-full rounded-lg border border-slate-300 px-3.5 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none uppercase font-semibold"
                    placeholder="e.g. FIQIH"
                    required
                  />
                  <datalist id="config-subject-list">
                    {subjects.map((s) => (
                      <option key={s.id} value={s.name}>
                        {s.name} (KKM: {s.kkm})
                      </option>
                    ))}
                  </datalist>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Kelas
                  </label>
                  <input
                    id="input-config-class"
                    type="text"
                    list="config-class-list"
                    value={formData.className}
                    onChange={(e) => handleFieldChange('className', e.target.value)}
                    className="w-full rounded-lg border border-slate-300 px-3.5 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none font-semibold"
                    placeholder="e.g. I - SATU"
                    required
                  />
                  <datalist id="config-class-list">
                    {classes.map((c) => (
                      <option key={c.id} value={c.name}>
                        {c.name} - Wali: {c.waliKelasName || 'Belum diatur'}
                      </option>
                    ))}
                  </datalist>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Kriteria Ketuntasan (KKM)
                  </label>
                  <input
                    id="input-config-kkm"
                    type="number"
                    min="1"
                    max="100"
                    value={formData.kkm}
                    onChange={(e) => handleFieldChange('kkm', Number(e.target.value))}
                    className="w-full rounded-lg border border-slate-300 px-3.5 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none font-semibold text-blue-700"
                    required
                  />
                </div>
              </div>

              <div className="rounded-lg bg-slate-50 p-4 border border-slate-200">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-3">
                  Informasi Tanda Tangan & Lokasi
                </h4>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label className="block text-xs text-slate-600 mb-1">Nama Kepala Madrasah / Sekolah</label>
                    <input
                      id="input-config-headmaster"
                      type="text"
                      value={formData.headmasterName}
                      onChange={(e) => handleFieldChange('headmasterName', e.target.value)}
                      className="w-full rounded-lg border border-slate-300 px-3 py-1.5 text-sm bg-white outline-none"
                      placeholder="e.g. M. MAS'UD"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-600 mb-1">Nama Wali Kelas / Guru Pengampu</label>
                    <input
                      id="input-config-teacher"
                      type="text"
                      value={formData.teacherName}
                      onChange={(e) => handleFieldChange('teacherName', e.target.value)}
                      className="w-full rounded-lg border border-slate-300 px-3 py-1.5 text-sm bg-white outline-none"
                      placeholder="e.g. Ust. Faishol"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-600 mb-1">Kota / Tempat Pengesahan</label>
                    <input
                      id="input-config-location"
                      type="text"
                      value={formData.dateLocation}
                      onChange={(e) => handleFieldChange('dateLocation', e.target.value)}
                      className="w-full rounded-lg border border-slate-300 px-3 py-1.5 text-sm bg-white outline-none"
                      placeholder="e.g. Karangnongko"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-600 mb-1">Tahun Hijriyah / Kalender Pengesahan</label>
                    <input
                      id="input-config-datehijri"
                      type="text"
                      value={formData.dateHijri}
                      onChange={(e) => handleFieldChange('dateHijri', e.target.value)}
                      className="w-full rounded-lg border border-slate-300 px-3 py-1.5 text-sm bg-white outline-none"
                      placeholder="e.g. 1448"
                    />
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Total score badge */}
              <div className="flex items-center justify-between rounded-lg bg-blue-50 p-3.5 border border-blue-200">
                <div>
                  <span className="text-xs font-semibold text-blue-900">Total Skor Maksimal Instrumen:</span>
                  <span className="ml-2 font-bold text-blue-700 text-base">{calculateTotalMaxScore()} Poin</span>
                </div>
                <span className="text-xs text-blue-600">
                  {formData.questions.length} Butir Soal ({pgList.length} PG, {isianList.length} Isian, {uraianList.length} Uraian)
                </span>
              </div>

              {/* 1. Pilihan Ganda Section */}
              <div className="rounded-lg border border-blue-200 bg-blue-50/40 p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="h-3 w-3 rounded-full bg-blue-500"></span>
                    <h4 className="font-bold text-slate-800 text-sm">Pilihan Ganda ({pgList.length} Soal)</h4>
                  </div>
                  <button
                    type="button"
                    id="btn-add-pg"
                    onClick={() => handleAddQuestion('pg')}
                    className="flex items-center gap-1 text-xs font-semibold text-blue-700 bg-white border border-blue-300 px-2.5 py-1 rounded-md hover:bg-blue-50"
                  >
                    <Plus className="h-3.5 w-3.5" /> Tambah Soal PG
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 md:grid-cols-7">
                  {pgList.map((q) => (
                    <div key={q.id} className="flex flex-col rounded-md border border-blue-200 bg-white p-2 text-center shadow-2xs">
                      <div className="flex justify-between items-center text-xs text-slate-500 mb-1">
                        <span className="font-bold text-blue-900">No. {q.number}</span>
                        <button
                          type="button"
                          onClick={() => handleRemoveQuestion(q.id)}
                          className="text-slate-400 hover:text-red-500"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                      <div className="flex items-center justify-center gap-1">
                        <input
                          type="number"
                          min="1"
                          max="50"
                          value={q.maxScore}
                          onChange={(e) => handleQuestionScoreChange(q.id, Number(e.target.value))}
                          className="w-12 text-center font-bold text-blue-800 text-sm border rounded py-0.5"
                        />
                        <span className="text-[10px] text-slate-500">pts</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* 2. Isian Section */}
              <div className="rounded-lg border border-purple-200 bg-purple-50/40 p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="h-3 w-3 rounded-full bg-purple-500"></span>
                    <h4 className="font-bold text-slate-800 text-sm">Isian Singkat ({isianList.length} Soal)</h4>
                  </div>
                  <button
                    type="button"
                    id="btn-add-isian"
                    onClick={() => handleAddQuestion('isian')}
                    className="flex items-center gap-1 text-xs font-semibold text-purple-700 bg-white border border-purple-300 px-2.5 py-1 rounded-md hover:bg-purple-50"
                  >
                    <Plus className="h-3.5 w-3.5" /> Tambah Soal Isian
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-5">
                  {isianList.map((q) => (
                    <div key={q.id} className="flex flex-col rounded-md border border-purple-200 bg-white p-2 text-center shadow-2xs">
                      <div className="flex justify-between items-center text-xs text-slate-500 mb-1">
                        <span className="font-bold text-purple-900">No. {q.number}</span>
                        <button
                          type="button"
                          onClick={() => handleRemoveQuestion(q.id)}
                          className="text-slate-400 hover:text-red-500"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                      <div className="flex items-center justify-center gap-1">
                        <input
                          type="number"
                          min="1"
                          max="50"
                          value={q.maxScore}
                          onChange={(e) => handleQuestionScoreChange(q.id, Number(e.target.value))}
                          className="w-12 text-center font-bold text-purple-800 text-sm border rounded py-0.5"
                        />
                        <span className="text-[10px] text-slate-500">pts</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* 3. Uraian Section */}
              <div className="rounded-lg border border-green-200 bg-green-50/40 p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="h-3 w-3 rounded-full bg-green-500"></span>
                    <h4 className="font-bold text-slate-800 text-sm">Uraian / Esai ({uraianList.length} Soal)</h4>
                  </div>
                  <button
                    type="button"
                    id="btn-add-uraian"
                    onClick={() => handleAddQuestion('uraian')}
                    className="flex items-center gap-1 text-xs font-semibold text-green-700 bg-white border border-green-300 px-2.5 py-1 rounded-md hover:bg-green-50"
                  >
                    <Plus className="h-3.5 w-3.5" /> Tambah Soal Uraian
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-5">
                  {uraianList.map((q) => (
                    <div key={q.id} className="flex flex-col rounded-md border border-green-200 bg-white p-2 text-center shadow-2xs">
                      <div className="flex justify-between items-center text-xs text-slate-500 mb-1">
                        <span className="font-bold text-green-900">No. {q.number}</span>
                        <button
                          type="button"
                          onClick={() => handleRemoveQuestion(q.id)}
                          className="text-slate-400 hover:text-red-500"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                      <div className="flex items-center justify-center gap-1">
                        <input
                          type="number"
                          min="1"
                          max="50"
                          value={q.maxScore}
                          onChange={(e) => handleQuestionScoreChange(q.id, Number(e.target.value))}
                          className="w-12 text-center font-bold text-green-800 text-sm border rounded py-0.5"
                        />
                        <span className="text-[10px] text-slate-500">pts</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Footer buttons */}
          <div className="mt-6 flex items-center justify-end gap-3 border-t border-slate-200 pt-4">
            <button
              type="button"
              id="btn-cancel-config"
              onClick={onClose}
              className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 transition"
            >
              Batal
            </button>
            <button
              type="submit"
              id="btn-save-config"
              className="flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-2 text-sm font-bold text-white shadow-md hover:bg-blue-700 transition"
            >
              <Check className="h-4 w-4" /> Simpan Pengaturan
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
