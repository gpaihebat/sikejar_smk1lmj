import React, { useState, useEffect } from 'react';
import { JournalRecord, Teacher } from '../types';
import { DEFAULT_CLASSES, DEFAULT_SUBJECTS, DEFAULT_SESSIONS } from '../data/mockData';
import { Save, BookOpen, AlertCircle, CheckCircle, RefreshCw } from 'lucide-react';
import DatePickerPopup from './DatePickerPopup';

interface JournalFormProps {
  currentTeacher: Teacher;
  classes: string[];
  onSave: (record: JournalRecord) => void;
  isLoading: boolean;
}

export default function JournalForm({ currentTeacher, classes, onSave, isLoading }: JournalFormProps) {
  const teacherClasses = currentTeacher.classes && currentTeacher.classes.length > 0
    ? currentTeacher.classes
    : classes;

  const [selectedClass, setSelectedClass] = useState(teacherClasses[0]);
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [sessionStart, setSessionStart] = useState('1');
  const [sessionEnd, setSessionEnd] = useState('1');
  const [subject, setSubject] = useState(currentTeacher.subject || DEFAULT_SUBJECTS[0]);
  const [topic, setTopic] = useState('');
  const [media, setMedia] = useState('Papan Tulis, Buku Paket');
  const [notes, setNotes] = useState('');
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Keep selectedClass synchronized if the list of teacher classes changes
  useEffect(() => {
    if (teacherClasses.length > 0) {
      if (!selectedClass || !teacherClasses.includes(selectedClass)) {
        setSelectedClass(teacherClasses[0]);
      }
    }
  }, [teacherClasses, selectedClass]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback(null);

    if (!topic.trim()) {
      setFeedback({
        type: 'error',
        message: 'Materi Pokok / Bahasan tidak boleh kosong.'
      });
      return;
    }

    if (!notes.trim()) {
      setFeedback({
        type: 'error',
        message: 'Catatan KBM / Kejadian penting tidak boleh kosong.'
      });
      return;
    }

    const sessionStr = sessionStart === sessionEnd
      ? `Jam Ke-${sessionStart}`
      : `Jam Ke-${sessionStart}-${sessionEnd}`;

    const newJournal: JournalRecord = {
      id: `JUR-${Date.now()}`,
      date,
      className: selectedClass,
      session: sessionStr,
      subject,
      teacherUsername: currentTeacher.username,
      teacherName: currentTeacher.name,
      topic: topic.trim(),
      media: media.trim(),
      notes: notes.trim()
    };

    onSave(newJournal);
    setFeedback({
      type: 'success',
      message: `Jurnal mengajar kelas ${selectedClass} berhasil disimpan.`
    });

    // Clear inputs that vary from class to class
    setTopic('');
    setNotes('');
  };

  return (
    <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-4 sm:p-6">
      <div className="flex items-center gap-3 border-b border-slate-100 pb-4 mb-6">
        <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl">
          <BookOpen className="w-5 h-5" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-slate-800">Isi Jurnal Mengajar Guru</h2>
          <p className="text-xs text-slate-500 mt-0.5">Catat pokok bahasan, media, dan capaian pembelajaran per jam pelajaran.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Row 1: Metadata Selection */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 bg-slate-50/50 p-4 rounded-xl border border-slate-100">
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Kelas</label>
            <select
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              {teacherClasses.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Tanggal</label>
            <DatePickerPopup
              value={date}
              onChange={(newDate) => setDate(newDate)}
              colorTheme="indigo"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Jam Ke</label>
            <select
              value={sessionStart}
              onChange={(e) => {
                const val = e.target.value;
                setSessionStart(val);
                if (parseInt(val) > parseInt(sessionEnd)) {
                  setSessionEnd(val);
                }
              }}
              className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              {Array.from({ length: 12 }, (_, i) => String(i + 1)).map(num => (
                <option key={num} value={num}>{num}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Sampai Jam Ke</label>
            <select
              value={sessionEnd}
              onChange={(e) => setSessionEnd(e.target.value)}
              className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              {Array.from({ length: 12 }, (_, i) => String(i + 1)).filter(num => parseInt(num) >= parseInt(sessionStart)).map(num => (
                <option key={num} value={num}>{num}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Topic Input */}
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-1.5">
            Materi Pokok / Pembahasan <span className="text-rose-500">*</span>
          </label>
          <input
            type="text"
            required
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder="Contoh: Turunan Fungsi Aljabar atau Membaca Puisi Rakyat"
            className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all shadow-sm"
          />
        </div>

        {/* Media Input */}
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-1.5">
            Media Pembelajaran / Alat Bantu
          </label>
          <input
            type="text"
            value={media}
            onChange={(e) => setMedia(e.target.value)}
            placeholder="Contoh: Papan Tulis, LCD Proyektor, Google Slides, Quizizz"
            className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all shadow-sm"
          />
        </div>

        {/* Notes Area */}
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-1.5">
            Catatan Proses KBM & Hambatan Siswa <span className="text-rose-500">*</span>
          </label>
          <textarea
            rows={4}
            required
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Contoh: Pembelajaran kondusif, siswa antusias mengerjakan latihan kelompok. Ada 3 siswa yang masih lambat memahami konsep dan diberi bimbingan khusus."
            className="w-full bg-white border border-slate-200 rounded-xl p-3.5 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all shadow-sm"
          />
        </div>

        {/* Feedbacks */}
        {feedback && (
          <div
            className={`rounded-xl p-4 border text-sm flex items-start gap-2.5 ${
              feedback.type === 'success'
                ? 'bg-emerald-50 border-emerald-100 text-emerald-800'
                : 'bg-rose-50 border-rose-100 text-rose-800'
            }`}
          >
            {feedback.type === 'success' ? (
              <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
            ) : (
              <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
            )}
            <div>
              <p className="font-semibold">{feedback.type === 'success' ? 'Sukses!' : 'Kesalahan'}</p>
              <p className="text-xs mt-0.5">{feedback.message}</p>
            </div>
          </div>
        )}

        {/* Submit */}
        <div className="flex justify-end pt-2 border-t border-slate-100">
          <button
            type="submit"
            disabled={isLoading}
            className="flex items-center gap-2 px-6 py-3.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white rounded-xl text-sm font-semibold shadow-sm hover:shadow transition-all cursor-pointer"
          >
            {isLoading ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" /> Menyimpan...
              </>
            ) : (
              <>
                <Save className="w-4 h-4" /> Simpan Jurnal Mengajar
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
