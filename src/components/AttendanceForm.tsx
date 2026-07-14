import React, { useState, useEffect } from 'react';
import { Student, AttendanceRecord, AttendanceStatus, Teacher } from '../types';
import { DEFAULT_CLASSES, DEFAULT_SUBJECTS, DEFAULT_SESSIONS } from '../data/mockData';
import { Save, CheckCircle, HelpCircle, AlertCircle, RefreshCw } from 'lucide-react';
import DatePickerPopup from './DatePickerPopup';

interface AttendanceFormProps {
  students: Student[];
  currentTeacher: Teacher;
  classes: string[];
  onSave: (record: AttendanceRecord) => void;
  isLoading: boolean;
}

export default function AttendanceForm({ students, currentTeacher, classes, onSave, isLoading }: AttendanceFormProps) {
  const teacherClasses = currentTeacher.classes && currentTeacher.classes.length > 0
    ? currentTeacher.classes
    : classes;

  const [selectedClass, setSelectedClass] = useState(teacherClasses[0]);
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [sessionStart, setSessionStart] = useState('1');
  const [sessionEnd, setSessionEnd] = useState('1');
  const [subject, setSubject] = useState(currentTeacher.subject || DEFAULT_SUBJECTS[0]);
  const [attendance, setAttendance] = useState<Record<string, AttendanceStatus>>({});
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

  // Filter students for the selected class
  const classStudents = students.filter(s => s.className === selectedClass);

  // Initialize attendance map when class changes or students load
  useEffect(() => {
    const initialAttendance: Record<string, AttendanceStatus> = {};
    classStudents.forEach(student => {
      initialAttendance[student.id] = 'H'; // Default to Present (Hadir)
    });
    setAttendance(initialAttendance);
    setFeedback(null);
  }, [selectedClass, students]);

  const handleStatusChange = (studentId: string, status: AttendanceStatus) => {
    setAttendance(prev => ({
      ...prev,
      [studentId]: status
    }));
  };

  const markAllAsPresent = () => {
    const allPresent: Record<string, AttendanceStatus> = {};
    classStudents.forEach(s => {
      allPresent[s.id] = 'H';
    });
    setAttendance(allPresent);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback(null);

    if (classStudents.length === 0) {
      setFeedback({
        type: 'error',
        message: 'Tidak ada siswa yang terdaftar di kelas ini.'
      });
      return;
    }

    // Verify all filtered students have a status
    const missingStatus = classStudents.some(s => !attendance[s.id]);
    if (missingStatus) {
      setFeedback({
        type: 'error',
        message: 'Mohon lengkapi kehadiran untuk seluruh siswa.'
      });
      return;
    }

    const sessionStr = sessionStart === sessionEnd
      ? `Jam Ke-${sessionStart}`
      : `Jam Ke-${sessionStart}-${sessionEnd}`;

    const newRecord: AttendanceRecord = {
      id: `ATT-${Date.now()}`,
      date,
      className: selectedClass,
      session: sessionStr,
      subject,
      teacherUsername: currentTeacher.username,
      teacherName: currentTeacher.name,
      attendance,
      notes: notes.trim()
    };

    onSave(newRecord);
    setFeedback({
      type: 'success',
      message: `Presensi kelas ${selectedClass} berhasil disimpan.`
    });
    
    // Clear notes but keep the rest for quick logging of other classes
    setNotes('');
  };

  return (
    <div className="space-y-6">
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-100 pb-4 mb-6 gap-2">
          <div>
            <h2 className="text-lg font-bold text-slate-800">Input Presensi Siswa</h2>
            <p className="text-xs text-slate-500 mt-0.5">Catat kehadiran murid kelas harian secara langsung.</p>
          </div>
          <button
            type="button"
            onClick={markAllAsPresent}
            className="self-start sm:self-center px-4 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-xl text-xs font-semibold border border-emerald-200 transition-colors cursor-pointer"
          >
            Set Semua Hadir (H)
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Metadata Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 bg-slate-50/50 p-4 rounded-xl border border-slate-100">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Kelas</label>
              <select
                value={selectedClass}
                onChange={(e) => setSelectedClass(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500"
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
                colorTheme="emerald"
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
                className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500"
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
                className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                {Array.from({ length: 12 }, (_, i) => String(i + 1)).filter(num => parseInt(num) >= parseInt(sessionStart)).map(num => (
                  <option key={num} value={num}>{num}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Student Roster */}
          <div>
            <h3 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-1.5">
              Daftar Roster Kelas {selectedClass} <span className="text-xs bg-slate-200 text-slate-600 px-2 py-0.5 rounded-full font-normal">{classStudents.length} Siswa</span>
            </h3>

            {classStudents.length === 0 ? (
              <div className="text-center py-8 bg-slate-50 rounded-xl border border-dashed border-slate-200 text-slate-400 text-sm">
                Tidak ada data siswa untuk kelas {selectedClass}. Daftarkan siswa di Pengaturan Master.
              </div>
            ) : (
              <div className="border border-slate-200 rounded-xl overflow-hidden divide-y divide-slate-100 shadow-inner">
                {classStudents.map((student, idx) => {
                  const status = attendance[student.id] || 'H';
                  return (
                    <div
                      key={student.id}
                      className="flex flex-col sm:flex-row sm:items-center justify-between p-3.5 hover:bg-slate-50/50 transition-colors gap-3"
                    >
                      <div className="flex items-center gap-3">
                        <span className="w-6 text-xs font-mono text-slate-400 text-center">{idx + 1}</span>
                        <div>
                          <div className="font-semibold text-slate-800 text-sm">{student.name}</div>
                          <div className="text-xs text-slate-400 flex items-center gap-1.5 mt-0.5">
                            <span>NIS: {student.id}</span>
                            <span>•</span>
                            <span className="bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded text-[10px] font-medium">
                              {student.gender === 'L' ? 'Laki-laki (L)' : 'Perempuan (P)'}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Status Selector Button Group - optimized for touch targets (44px heights/widths) */}
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => handleStatusChange(student.id, 'H')}
                          className={`w-11 h-11 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                            status === 'H'
                              ? 'bg-emerald-600 text-white shadow-sm ring-2 ring-emerald-200'
                              : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
                          }`}
                          title="Hadir"
                        >
                          H
                        </button>
                        <button
                          type="button"
                          onClick={() => handleStatusChange(student.id, 'S')}
                          className={`w-11 h-11 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                            status === 'S'
                              ? 'bg-blue-600 text-white shadow-sm ring-2 ring-blue-200'
                              : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
                          }`}
                          title="Sakit"
                        >
                          S
                        </button>
                        <button
                          type="button"
                          onClick={() => handleStatusChange(student.id, 'I')}
                          className={`w-11 h-11 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                            status === 'I'
                              ? 'bg-amber-500 text-white shadow-sm ring-2 ring-amber-200'
                              : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
                          }`}
                          title="Izin"
                        >
                          I
                        </button>
                        <button
                          type="button"
                          onClick={() => handleStatusChange(student.id, 'A')}
                          className={`w-11 h-11 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                            status === 'A'
                              ? 'bg-rose-600 text-white shadow-sm ring-2 ring-rose-200'
                              : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
                          }`}
                          title="Alpa"
                        >
                          A
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Notes Area */}
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Catatan Kejadian / Hambatan Kelas (Opsional)</label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Contoh: Siswa aktif, materi tersampaikan penuh, Budi izin keluar lebih awal..."
              className="w-full bg-white border border-slate-200 rounded-xl p-3 text-sm text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 focus:bg-white transition-all"
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

          {/* Submit Action */}
          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={isLoading || classStudents.length === 0}
              className="flex items-center gap-2 px-6 py-3.5 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white rounded-xl text-sm font-semibold shadow-sm hover:shadow transition-all cursor-pointer"
            >
              {isLoading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" /> Menyimpan...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" /> Simpan Kehadiran
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Guide Notes */}
      <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 text-xs text-slate-500 space-y-1">
        <p className="font-semibold text-slate-600 flex items-center gap-1.5 mb-1.5">
          <HelpCircle className="w-4 h-4 text-emerald-600" /> Keterangan Kode Absensi:
        </p>
        <ul className="list-disc pl-5 space-y-1 font-medium">
          <li><span className="text-emerald-600 font-bold">H</span> = Hadir (Siswa mengikuti KBM secara penuh di kelas).</li>
          <li><span className="text-blue-600 font-bold">S</span> = Sakit (Siswa berhalangan karena kondisi medis dengan surat dokter/izin).</li>
          <li><span className="text-amber-500 font-bold">I</span> = Izin (Siswa berhalangan karena ada urusan penting keluarga/dispensasi sekolah).</li>
          <li><span className="text-rose-600 font-bold">A</span> = Alpa (Siswa tidak hadir tanpa ada kabar/keterangan yang valid).</li>
        </ul>
      </div>
    </div>
  );
}
