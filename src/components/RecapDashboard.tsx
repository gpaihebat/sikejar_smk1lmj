import React, { useState, useMemo, useEffect } from 'react';
import { Student, AttendanceRecord, JournalRecord, AttendanceStatus, Teacher } from '../types';
import { DEFAULT_CLASSES, DEFAULT_SUBJECTS } from '../data/mockData';
import { exportAttendanceToCSV, exportJournalsToCSV, getStatusLabel } from '../utils/exportUtils';
import { 
  BarChart2, FileText, Calendar, Search, Printer, Filter, BookOpen,
  ChevronRight, Users, CheckSquare, XCircle, FileSpreadsheet, Eye, Info 
} from 'lucide-react';

interface RecapDashboardProps {
  students: Student[];
  attendanceRecords: AttendanceRecord[];
  journalRecords: JournalRecord[];
  teachers: Teacher[];
  currentTeacher?: Teacher;
  classes?: string[];
}

type TabType = 'ringkasan' | 'kehadiran' | 'jurnal';

export default function RecapDashboard({ students, attendanceRecords, journalRecords, teachers, currentTeacher, classes = DEFAULT_CLASSES }: RecapDashboardProps) {
  const [activeTab, setActiveTab] = useState<TabType>('ringkasan');

  const [printConfig, setPrintConfig] = useState(() => {
    try {
      const saved = localStorage.getItem('portal_print_config');
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {}
    return {
      provinsi: "PEMERINTAH PROVINSI JAWA BARAT",
      sekolah: "SMA NEGERI 1 TARUNA",
      alamat: "Jl. Pendidikan No. 45, Bandung • Telp: (022) 1234567 • Email: info@sman1taruna.sch.id",
      kepalaSekolah: "Drs. H. Mulyadi Kartawijaya, M.Pd.",
      nipKepalaSekolah: "19720815 199803 1 004",
      kota: "Bandung"
    };
  });

  // Listen to print config changes
  useEffect(() => {
    const handleConfigChange = () => {
      try {
        const saved = localStorage.getItem('portal_print_config');
        if (saved) {
          setPrintConfig(JSON.parse(saved));
        }
      } catch (e) {}
    };
    window.addEventListener('print_config_changed', handleConfigChange);
    return () => {
      window.removeEventListener('print_config_changed', handleConfigChange);
    };
  }, []);

  const teacherClasses = useMemo(() => {
    return currentTeacher?.classes && currentTeacher.classes.length > 0
      ? currentTeacher.classes
      : classes;
  }, [currentTeacher, classes]);

  // Attendance filters
  const [attClass, setAttClass] = useState(() => {
    return currentTeacher?.classes?.[0] || classes[0] || DEFAULT_CLASSES[0];
  });
  const [attMonth, setAttMonth] = useState('2026-07'); // Default to current July 2026 from metadata

  // Keep attClass synchronized if teacherClasses list changes
  useEffect(() => {
    if (teacherClasses.length > 0) {
      if (!attClass || !teacherClasses.includes(attClass)) {
        setAttClass(teacherClasses[0]);
      }
    }
  }, [teacherClasses, attClass]);

  // Journal filters
  const [jrClass, setJrClass] = useState<string>('SEMUA');
  const [jrSearch, setJrSearch] = useState('');

  // Print Preview state
  const [printData, setPrintData] = useState<{
    type: 'attendance' | 'journal';
    title: string;
    className: string;
    monthYearStr?: string;
  } | null>(null);

  // --- CALCULATE BENTO STATS ---
  const stats = useMemo(() => {
    const totalStudentsCount = students.length;
    const totalTeachersCount = teachers.length;
    // Filter journal count to current logged-in teacher's journals
    const totalJournalsCount = journalRecords.filter(j => j.teacherUsername === currentTeacher?.username).length;

    let h = 0, s = 0, i = 0, a = 0;
    attendanceRecords.forEach(rec => {
      Object.values(rec.attendance).forEach(status => {
        if (status === 'H') h++;
        else if (status === 'S') s++;
        else if (status === 'I') i++;
        else if (status === 'A') a++;
      });
    });

    const totalDays = h + s + i + a;
    const attendanceRate = totalDays > 0 ? Math.round(((h + s + i) / totalDays) * 100) : 100;

    return {
      totalStudents: totalStudentsCount,
      totalTeachers: totalTeachersCount,
      totalJournals: totalJournalsCount,
      attendanceRate,
      statusSummary: { H: h, S: s, I: i, A: a }
    };
  }, [students, attendanceRecords, journalRecords, teachers, currentTeacher]);

  // --- FILTERED JOURNALS ---
  const filteredJournals = useMemo(() => {
    return journalRecords.filter(j => {
      // ONLY show records belonging to the currently logged-in teacher!
      const teacherMatch = j.teacherUsername === currentTeacher?.username;
      const classMatch = jrClass === 'SEMUA' || j.className === jrClass;
      const searchMatch = jrSearch.trim() === '' || 
        j.topic.toLowerCase().includes(jrSearch.toLowerCase()) || 
        j.notes.toLowerCase().includes(jrSearch.toLowerCase()) ||
        j.media.toLowerCase().includes(jrSearch.toLowerCase());
      
      return teacherMatch && classMatch && searchMatch;
    }).sort((a, b) => b.date.localeCompare(a.date)); // Newest first
  }, [journalRecords, jrClass, currentTeacher, jrSearch]);

  // --- ATTENDANCE RECAP PREPARATIONS ---
  const attClassRecords = useMemo(() => {
    return attendanceRecords
      .filter(r => r.className === attClass && r.date.startsWith(attMonth))
      .sort((a, b) => a.date.localeCompare(b.date));
  }, [attendanceRecords, attClass, attMonth]);

  const attDates = useMemo(() => {
    return Array.from(new Set(attClassRecords.map(r => r.date))).sort();
  }, [attClassRecords]);

  const classStudents = useMemo(() => {
    return students.filter(s => s.className === attClass);
  }, [students, attClass]);

  // Calculate Student-Specific Totals
  const attendanceMatrix = useMemo(() => {
    return classStudents.map(student => {
      let h = 0, s = 0, i = 0, a = 0;
      const statuses = attDates.map(date => {
        const dayRecord = attClassRecords.find(r => r.date === date);
        const status = dayRecord?.attendance[student.id] || '';
        
        if (status === 'H') h++;
        else if (status === 'S') s++;
        else if (status === 'I') i++;
        else if (status === 'A') a++;
        
        return status;
      });

      const totalDays = h + s + i + a;
      const rate = totalDays > 0 ? Math.round(((h + s + i) / totalDays) * 100) : 100;

      return {
        student,
        statuses,
        h, s, i, a,
        rate
      };
    });
  }, [classStudents, attDates, attClassRecords]);

  // Handle excel exports
  const triggerExcelExport = () => {
    if (activeTab === 'kehadiran') {
      const monthLabel = new Date(`${attMonth}-02`).toLocaleString('id-ID', { month: 'long', year: 'numeric' });
      exportAttendanceToCSV(
        students,
        attendanceRecords,
        attClass,
        attMonth,
        `Rekap_Absensi_Kelas_${attClass}_${monthLabel.replace(' ', '_')}.csv`
      );
    } else if (activeTab === 'jurnal') {
      exportJournalsToCSV(filteredJournals, `Jurnal_Mengajar_Terfilter_${Date.now()}.csv`);
    }
  };

  // Trigger Print to PDF flow
  const handlePrint = (type: 'attendance' | 'journal') => {
    if (type === 'attendance') {
      const monthLabel = new Date(`${attMonth}-02`).toLocaleString('id-ID', { month: 'long', year: 'numeric' });
      setPrintData({
        type: 'attendance',
        title: `Laporan Bulanan Kehadiran Siswa Kelas ${attClass}`,
        className: attClass,
        monthYearStr: monthLabel
      });
    } else {
      setPrintData({
        type: 'journal',
        title: `Laporan Jurnal Mengajar Guru`,
        className: jrClass === 'SEMUA' ? 'Semua Kelas' : jrClass
      });
    }

    // Give state a fraction of time to render, then open print panel
    setTimeout(() => {
      window.print();
    }, 150);
  };

  return (
    <div className="space-y-6">
      {/* Print-Only Layout Component (Dynamically rendered & active only during browser printing) */}
      {printData && (
        <div className="hidden print:block bg-white text-black p-8 font-sans" style={{ minHeight: '297mm' }}>
          {/* Official Letterhead (KOP SURAT) */}
          <div className="text-center border-b-4 border-double border-black pb-4 mb-6">
            <h1 className="text-xl font-bold uppercase tracking-wider">{printConfig.provinsi}</h1>
            <h1 className="text-2xl font-black uppercase tracking-wide">{printConfig.sekolah}</h1>
            <p className="text-xs italic mt-1">{printConfig.alamat}</p>
          </div>

          {/* Laporan Title */}
          <div className="text-center mb-6">
            <h2 className="text-lg font-bold uppercase underline">{printData.title}</h2>
            {printData.type === 'attendance' && printData.monthYearStr && (
              <p className="text-sm font-semibold mt-1">Periode: {printData.monthYearStr}</p>
            )}
            {printData.type === 'journal' && (
              <p className="text-sm font-semibold mt-1">
                Filter Kelas: {printData.className} • Diunduh tanggal: {new Date().toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
              </p>
            )}
          </div>

          {/* Table Render */}
          {printData.type === 'attendance' ? (
            <div>
              <table className="w-full text-xs border-collapse border border-black">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="border border-black p-1.5 text-center">No</th>
                    <th className="border border-black p-1.5 text-left">NIS</th>
                    <th className="border border-black p-1.5 text-left">Nama Siswa</th>
                    <th className="border border-black p-1.5 text-center">L/P</th>
                    {attDates.map(d => (
                      <th key={d} className="border border-black p-1 text-center font-mono">{d.split('-')[2]}</th>
                    ))}
                    <th className="border border-black p-1 text-center font-bold">H</th>
                    <th className="border border-black p-1 text-center font-bold">S</th>
                    <th className="border border-black p-1 text-center font-bold">I</th>
                    <th className="border border-black p-1 text-center font-bold">A</th>
                    <th className="border border-black p-1 text-center font-bold">%</th>
                  </tr>
                </thead>
                <tbody>
                  {attendanceMatrix.length === 0 ? (
                    <tr>
                      <td colSpan={5 + attDates.length} className="border border-black p-4 text-center">Tidak ada data kehadiran siswa</td>
                    </tr>
                  ) : (
                    attendanceMatrix.map((row, idx) => (
                      <tr key={row.student.id}>
                        <td className="border border-black p-1.5 text-center">{idx + 1}</td>
                        <td className="border border-black p-1.5 font-mono">{row.student.id}</td>
                        <td className="border border-black p-1.5">{row.student.name}</td>
                        <td className="border border-black p-1.5 text-center">{row.student.gender}</td>
                        {row.statuses.map((st, sIdx) => (
                          <th key={sIdx} className="border border-black p-1 text-center font-mono text-[10px] font-normal">{st || '-'}</th>
                        ))}
                        <td className="border border-black p-1 text-center font-semibold">{row.h}</td>
                        <td className="border border-black p-1 text-center font-semibold">{row.s}</td>
                        <td className="border border-black p-1 text-center font-semibold">{row.i}</td>
                        <td className="border border-black p-1 text-center font-semibold">{row.a}</td>
                        <td className="border border-black p-1 text-center font-bold">{row.rate}%</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>

              <div className="mt-4 text-[10px] text-slate-500">
                *Keterangan: H: Hadir, S: Sakit, I: Izin, A: Alpa (Tanpa Keterangan)
              </div>
            </div>
          ) : (
            <table className="w-full text-xs border-collapse border border-black">
              <thead>
                <tr className="bg-gray-100">
                  <th className="border border-black p-2 text-center" style={{ width: '5%' }}>No</th>
                  <th className="border border-black p-2 text-left" style={{ width: '15%' }}>Tanggal</th>
                  <th className="border border-black p-2 text-center" style={{ width: '20%' }}>Kelas / Jam</th>
                  <th className="border border-black p-2 text-left" style={{ width: '30%' }}>Materi Pokok & Media</th>
                  <th className="border border-black p-2 text-left" style={{ width: '30%' }}>Catatan Proses KBM</th>
                </tr>
              </thead>
              <tbody>
                {filteredJournals.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="border border-black p-4 text-center">Tidak ada catatan jurnal mengajar yang cocok.</td>
                  </tr>
                ) : (
                  filteredJournals.map((j, idx) => (
                    <tr key={j.id}>
                      <td className="border border-black p-2 text-center">{idx + 1}</td>
                      <td className="border border-black p-2 font-mono">{j.date}</td>
                      <td className="border border-black p-2 text-center">
                        <div className="font-semibold">{j.className}</div>
                        <div className="text-[10px] text-gray-600">{j.session}</div>
                      </td>
                      <td className="border border-black p-2">
                        <div className="font-medium">{j.topic}</div>
                        <div className="text-[10px] text-gray-500 mt-1 italic">Media: {j.media}</div>
                      </td>
                      <td className="border border-black p-2 text-gray-700 leading-normal">{j.notes}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}

          {/* SIGNATURE FIELDS (TANDA TANGAN RESMI) */}
          <div className="mt-12 grid grid-cols-2 text-center text-sm gap-12">
            <div>
              <p>Mengetahui,</p>
              <p className="font-semibold mb-20">Kepala Sekolah {printConfig.sekolah}</p>
              <p className="font-bold underline">{printConfig.kepalaSekolah}</p>
              <p className="text-xs text-slate-500">NIP. {printConfig.nipKepalaSekolah}</p>
            </div>
            <div>
              <p>{printConfig.kota}, {new Date().toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
              <p className="font-semibold mb-20">Guru Pengajar,</p>
              <p className="font-bold underline">{currentTeacher?.name || '......................................................'}</p>
              <p className="text-xs text-slate-500">
                {currentTeacher?.nip ? `NIP. ${currentTeacher.nip}` : 'NIP. / NUPTK. ....................................'}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Screen Interface - hidden when printing */}
      <div className="print:hidden space-y-6">
        {/* Navigation Tabs */}
        <div className="flex border-b border-slate-200 bg-white p-1 rounded-xl shadow-sm border max-w-md">
          <button
            onClick={() => setActiveTab('ringkasan')}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              activeTab === 'ringkasan'
                ? 'bg-slate-900 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <BarChart2 className="w-3.5 h-3.5" /> Ringkasan
          </button>
          <button
            onClick={() => setActiveTab('kehadiran')}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              activeTab === 'kehadiran'
                ? 'bg-slate-900 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <Users className="w-3.5 h-3.5" /> Rekap Kehadiran
          </button>
          <button
            onClick={() => setActiveTab('jurnal')}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              activeTab === 'jurnal'
                ? 'bg-slate-900 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <FileText className="w-3.5 h-3.5" /> Jurnal Mengajar
          </button>
        </div>

        {/* --- TAB CONTENT: RINGKASAN BENTO STATS --- */}
        {activeTab === 'ringkasan' && (
          <div className="space-y-6">
            {/* Metric Bento Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm hover:shadow transition-shadow">
                <div className="flex justify-between items-start">
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Kehadiran Rerata</p>
                  <span className="p-1.5 bg-emerald-50 text-emerald-600 rounded-lg text-xs font-bold">{stats.attendanceRate}%</span>
                </div>
                <p className="text-3xl font-extrabold text-slate-800 mt-2">{stats.attendanceRate}%</p>
                <div className="w-full bg-slate-100 h-1.5 rounded-full mt-3 overflow-hidden">
                  <div className="bg-emerald-500 h-full rounded-full" style={{ width: `${stats.attendanceRate}%` }}></div>
                </div>
                <p className="text-[10px] text-slate-400 mt-2">Akumulasi seluruh siswa terdaftar.</p>
              </div>

              <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm hover:shadow transition-shadow">
                <div className="flex justify-between items-start">
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Jurnal Terisi</p>
                  <span className="p-1.5 bg-indigo-50 text-indigo-600 rounded-lg">
                    <BookOpen className="w-4 h-4" />
                  </span>
                </div>
                <p className="text-3xl font-extrabold text-slate-800 mt-2">{stats.totalJournals}</p>
                <p className="text-[10px] text-slate-400 mt-3.5">Total jam mengajar terdokumentasi.</p>
              </div>

              <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm hover:shadow transition-shadow">
                <div className="flex justify-between items-start">
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Murid</p>
                  <span className="p-1.5 bg-blue-50 text-blue-600 rounded-lg">
                    <Users className="w-4 h-4" />
                  </span>
                </div>
                <p className="text-3xl font-extrabold text-slate-800 mt-2">{stats.totalStudents}</p>
                <p className="text-[10px] text-slate-400 mt-3.5">Siswa terbagi dalam {DEFAULT_CLASSES.length} kelas master.</p>
              </div>

              <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm hover:shadow transition-shadow">
                <div className="flex justify-between items-start">
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Jumlah Guru</p>
                  <span className="p-1.5 bg-amber-50 text-amber-600 rounded-lg">
                    <CheckSquare className="w-4 h-4" />
                  </span>
                </div>
                <p className="text-3xl font-extrabold text-slate-800 mt-2">{stats.totalTeachers}</p>
                <p className="text-[10px] text-slate-400 mt-3.5">Guru aktif dengan akun terdaftar.</p>
              </div>
            </div>

            {/* Attendance Status Stack Graph */}
            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
              <h3 className="text-sm font-bold text-slate-800 mb-4 uppercase tracking-wider">Akumulasi Status Presensi</h3>
              <div className="space-y-4">
                {/* Visual Stacked Bar */}
                <div className="w-full h-8 bg-slate-100 rounded-xl overflow-hidden flex shadow-inner">
                  {(Object.entries(stats.statusSummary) as Array<[AttendanceStatus, number]>).map(([code, count]) => {
                    const total = stats.statusSummary.H + stats.statusSummary.S + stats.statusSummary.I + stats.statusSummary.A;
                    const pct = total > 0 ? (count / total) * 100 : 0;
                    if (pct === 0) return null;

                    let bg = 'bg-slate-400';
                    if (code === 'H') bg = 'bg-emerald-500';
                    if (code === 'S') bg = 'bg-blue-500';
                    if (code === 'I') bg = 'bg-amber-500';
                    if (code === 'A') bg = 'bg-rose-500';

                    return (
                      <div
                        key={code}
                        className={`${bg} h-full transition-all`}
                        style={{ width: `${pct}%` }}
                        title={`${getStatusLabel(code)}: ${count} (${Math.round(pct)}%)`}
                      />
                    );
                  })}
                </div>

                {/* Legend Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-2">
                  <div className="flex items-center gap-2">
                    <span className="w-3.5 h-3.5 bg-emerald-500 rounded"></span>
                    <div>
                      <p className="text-xs font-semibold text-slate-700">Hadir (H)</p>
                      <p className="text-lg font-bold text-slate-900">{stats.statusSummary.H} <span className="text-xs text-slate-400 font-medium">absen</span></p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-3.5 h-3.5 bg-blue-500 rounded"></span>
                    <div>
                      <p className="text-xs font-semibold text-slate-700">Sakit (S)</p>
                      <p className="text-lg font-bold text-slate-900">{stats.statusSummary.S} <span className="text-xs text-slate-400 font-medium">absen</span></p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-3.5 h-3.5 bg-amber-500 rounded"></span>
                    <div>
                      <p className="text-xs font-semibold text-slate-700">Izin (I)</p>
                      <p className="text-lg font-bold text-slate-900">{stats.statusSummary.I} <span className="text-xs text-slate-400 font-medium">absen</span></p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-3.5 h-3.5 bg-rose-500 rounded"></span>
                    <div>
                      <p className="text-xs font-semibold text-slate-700">Alpa (A)</p>
                      <p className="text-lg font-bold text-slate-900">{stats.statusSummary.A} <span className="text-xs text-slate-400 font-medium">absen</span></p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Tips Box */}
            <div className="bg-indigo-50/50 border border-indigo-100 rounded-2xl p-4 flex gap-3 text-slate-700 text-xs md:text-sm">
              <Info className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-indigo-900">Rekap Otomatis Siap Cetak</p>
                <p className="text-xs text-indigo-700 mt-1">
                  Seluruh data kehadiran murid dan jurnal mengajar yang Anda kumpulkan akan direkap secara bulanan secara otomatis. 
                  Anda dapat berpindah ke tab <strong>"Rekap Kehadiran"</strong> untuk mencetak matrix absensi bulanan atau tab <strong>"Jurnal Mengajar"</strong> untuk mengunduh catatan proses KBM.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* --- TAB CONTENT: REKAP KEHADIRAN MATRIX --- */}
        {activeTab === 'kehadiran' && (
          <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 shadow-sm space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-5">
              <div>
                <h2 className="text-lg font-bold text-slate-800">Rekapitulasi Kehadiran Bulanan</h2>
                <p className="text-xs text-slate-500 mt-0.5">Lihat matriks rekap absensi per kelas untuk pelaporan bulanan.</p>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={triggerExcelExport}
                  disabled={classStudents.length === 0}
                  className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-50 hover:bg-emerald-100 disabled:bg-slate-50 disabled:text-slate-400 disabled:border-slate-200 text-emerald-700 border border-emerald-200 rounded-xl text-xs font-semibold transition-all cursor-pointer"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5" /> Ekspor Excel (CSV)
                </button>
                <button
                  onClick={() => handlePrint('attendance')}
                  disabled={classStudents.length === 0}
                  className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-900 hover:bg-slate-800 disabled:bg-slate-200 disabled:text-slate-400 text-white rounded-xl text-xs font-semibold transition-all cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5" /> Cetak PDF Laporan
                </button>
              </div>
            </div>

            {/* Matrix Filters */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-100">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Pilih Kelas</label>
                <select
                  value={attClass}
                  onChange={(e) => setAttClass(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-500"
                >
                  {teacherClasses.map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Periode Bulan</label>
                <input
                  type="month"
                  value={attMonth}
                  onChange={(e) => setAttMonth(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-500"
                />
              </div>
            </div>

            {/* Matrix Scroll Container */}
            <div>
              <p className="text-xs text-amber-600 bg-amber-50 border border-amber-100 rounded-lg p-2.5 mb-4 flex items-center gap-1.5 font-medium">
                <Info className="w-4 h-4 shrink-0" />
                Daftar tanggal hanya akan memunculkan tanggal yang memiliki input presensi terekam pada periode terpilih ({attMonth}).
              </p>

              {classStudents.length === 0 ? (
                <div className="text-center py-12 text-slate-400 text-sm">
                  Tidak ada data siswa untuk kelas {attClass}.
                </div>
              ) : (
                <div className="overflow-x-auto border border-slate-200 rounded-xl shadow-inner max-h-[500px]">
                  <table className="w-full text-xs text-left border-collapse">
                    <thead className="bg-slate-50 text-slate-600 uppercase tracking-wider border-b border-slate-200 sticky top-0 z-10">
                      <tr>
                        <th className="p-3 text-center sticky left-0 bg-slate-50 border-r border-slate-200 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]" style={{ minWidth: '40px' }}>No</th>
                        <th className="p-3 sticky left-10 bg-slate-50 border-r border-slate-200 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]" style={{ minWidth: '80px' }}>NIS</th>
                        <th className="p-3 sticky left-[120px] bg-slate-50 border-r border-slate-200 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]" style={{ minWidth: '150px' }}>Nama Siswa</th>
                        <th className="p-3 text-center border-r border-slate-200" style={{ minWidth: '50px' }}>L/P</th>
                        {attDates.map(date => (
                          <th key={date} className="p-2 text-center border-r border-slate-200 font-mono text-[10px]" style={{ minWidth: '35px' }} title={date}>
                            {date.split('-')[2]}
                          </th>
                        ))}
                        <th className="p-3 text-center bg-emerald-50 text-emerald-800 border-r border-slate-200 font-bold" style={{ minWidth: '40px' }} title="Hadir">H</th>
                        <th className="p-3 text-center bg-blue-50 text-blue-800 border-r border-slate-200 font-bold" style={{ minWidth: '40px' }} title="Sakit">S</th>
                        <th className="p-3 text-center bg-amber-50 text-amber-800 border-r border-slate-200 font-bold" style={{ minWidth: '40px' }} title="Izin">I</th>
                        <th className="p-3 text-center bg-rose-50 text-rose-800 border-r border-slate-200 font-bold" style={{ minWidth: '40px' }} title="Alpa">A</th>
                        <th className="p-3 text-center bg-slate-900 text-white font-bold" style={{ minWidth: '60px' }}>%</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 bg-white">
                      {attendanceMatrix.map((row, idx) => (
                        <tr key={row.student.id} className="hover:bg-slate-50/70 transition-colors">
                          <td className="p-3 text-center font-medium text-slate-400 sticky left-0 bg-white group-hover:bg-slate-50 border-r border-slate-200 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">{idx + 1}</td>
                          <td className="p-3 font-mono text-slate-600 sticky left-10 bg-white border-r border-slate-200 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">{row.student.id}</td>
                          <td className="p-3 font-semibold text-slate-800 sticky left-[120px] bg-white border-r border-slate-200 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">{row.student.name}</td>
                          <td className="p-3 text-center text-slate-500 border-r border-slate-200">{row.student.gender}</td>
                          {row.statuses.map((st, sIdx) => {
                            let textClass = 'text-slate-300';
                            let bgClass = '';
                            if (st === 'H') { textClass = 'text-emerald-600 font-bold'; bgClass = 'bg-emerald-50/20'; }
                            if (st === 'S') { textClass = 'text-blue-600 font-bold'; bgClass = 'bg-blue-50/20'; }
                            if (st === 'I') { textClass = 'text-amber-600 font-bold'; bgClass = 'bg-amber-50/20'; }
                            if (st === 'A') { textClass = 'text-rose-600 font-bold'; bgClass = 'bg-rose-50/20'; }
                            
                            return (
                              <td key={sIdx} className={`p-2 text-center border-r border-slate-100 font-mono ${textClass} ${bgClass}`}>
                                {st || '-'}
                              </td>
                            );
                          })}
                          <td className="p-3 text-center bg-emerald-50/50 text-emerald-800 border-r border-slate-200 font-bold">{row.h}</td>
                          <td className="p-3 text-center bg-blue-50/50 text-blue-800 border-r border-slate-200 font-bold">{row.s}</td>
                          <td className="p-3 text-center bg-amber-50/50 text-amber-800 border-r border-slate-200 font-bold">{row.i}</td>
                          <td className="p-3 text-center bg-rose-50/50 text-rose-800 border-r border-slate-200 font-bold">{row.a}</td>
                          <td className="p-3 text-center bg-slate-100 text-slate-800 font-bold">{row.rate}%</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* --- TAB CONTENT: JURNAL MENGAJAR LIST --- */}
        {activeTab === 'jurnal' && (
          <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 shadow-sm space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-5">
              <div>
                <h2 className="text-lg font-bold text-slate-800">Jurnal Mengajar Guru</h2>
                <p className="text-xs text-slate-500 mt-0.5">Daftar rekaman materi pembelajaran dan hambatan selama KBM.</p>
              </div>

              {/* Actions */}
              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={triggerExcelExport}
                  disabled={filteredJournals.length === 0}
                  className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-50 hover:bg-emerald-100 disabled:bg-slate-50 disabled:text-slate-400 text-emerald-700 border border-emerald-200 rounded-xl text-xs font-semibold transition-all cursor-pointer"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5" /> Ekspor Jurnal (CSV)
                </button>
                <button
                  onClick={() => handlePrint('journal')}
                  disabled={filteredJournals.length === 0}
                  className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-900 hover:bg-slate-800 disabled:bg-slate-200 disabled:text-slate-400 text-white rounded-xl text-xs font-semibold transition-all cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5" /> Cetak PDF Jurnal
                </button>
              </div>
            </div>

            {/* Advanced Filters */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-100">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Filter Kelas</label>
                <select
                  value={jrClass}
                  onChange={(e) => setJrClass(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-500"
                >
                  <option value="SEMUA">Semua Kelas</option>
                  {teacherClasses.map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Cari Keyword</label>
                <div className="relative">
                  <input
                    type="text"
                    value={jrSearch}
                    onChange={(e) => setJrSearch(e.target.value)}
                    placeholder="Materi atau catatan..."
                    className="w-full bg-white border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-sm text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-500"
                  />
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                </div>
              </div>
            </div>

            {/* Desktop Table View / Mobile Cards */}
            <div>
              <p className="text-xs text-slate-400 mb-3 font-semibold uppercase tracking-wider">Ditemukan {filteredJournals.length} Jurnal</p>
              
              {filteredJournals.length === 0 ? (
                <div className="text-center py-12 bg-slate-50/50 rounded-xl border border-dashed border-slate-200 text-slate-400 text-sm">
                  Tidak ada catatan jurnal mengajar yang sesuai filter.
                </div>
              ) : (
                <>
                  {/* Desktop Table */}
                  <div className="hidden md:block border border-slate-200 rounded-xl overflow-hidden shadow-inner">
                    <table className="w-full text-xs text-left border-collapse">
                      <thead className="bg-slate-50 text-slate-600 uppercase tracking-wider border-b border-slate-200">
                        <tr>
                          <th className="p-3 text-center" style={{ width: '5%' }}>No</th>
                          <th className="p-3" style={{ width: '10%' }}>Tanggal</th>
                          <th className="p-3 text-center" style={{ width: '10%' }}>Kelas / Jam</th>
                          <th className="p-3" style={{ width: '20%' }}>Mapel & Guru</th>
                          <th className="p-3" style={{ width: '25%' }}>Materi Pokok & Media</th>
                          <th className="p-3" style={{ width: '30%' }}>Catatan KBM</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 bg-white">
                        {filteredJournals.map((j, idx) => (
                          <tr key={j.id} className="hover:bg-slate-50/50 transition-colors">
                            <td className="p-3 text-center font-medium text-slate-400">{idx + 1}</td>
                            <td className="p-3 font-mono text-slate-500">{j.date}</td>
                            <td className="p-3 text-center">
                              <div className="font-bold text-slate-800">{j.className}</div>
                              <div className="text-[10px] text-slate-400 mt-0.5">{j.session}</div>
                            </td>
                            <td className="p-3">
                              <div className="font-semibold text-slate-800">{j.subject}</div>
                              <div className="text-[10px] text-slate-400 mt-0.5">{j.teacherName}</div>
                            </td>
                            <td className="p-3">
                              <div className="font-semibold text-slate-700">{j.topic}</div>
                              <div className="text-[10px] text-slate-400 mt-1.5 italic">Media: {j.media}</div>
                            </td>
                            <td className="p-3 text-slate-600 leading-normal">{j.notes}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Mobile Cards (Responsive representation) */}
                  <div className="md:hidden space-y-4">
                    {filteredJournals.map((j, idx) => (
                      <div key={j.id} className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3 shadow-sm">
                        <div className="flex items-center justify-between border-b border-slate-200/60 pb-2">
                          <span className="text-xs font-mono font-bold bg-slate-200 text-slate-700 px-2 py-0.5 rounded">
                            {idx + 1}
                          </span>
                          <span className="text-xs font-mono text-slate-500">{j.date}</span>
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div>
                            <p className="text-slate-400 font-bold uppercase tracking-wider text-[10px]">Kelas</p>
                            <p className="font-semibold text-slate-800">{j.className}</p>
                          </div>
                          <div>
                            <p className="text-slate-400 font-bold uppercase tracking-wider text-[10px]">Jam</p>
                            <p className="font-semibold text-slate-800">{j.session}</p>
                          </div>
                          <div className="col-span-2">
                            <p className="text-slate-400 font-bold uppercase tracking-wider text-[10px]">Mapel & Guru</p>
                            <p className="font-semibold text-slate-800">{j.subject}</p>
                            <p className="text-[11px] text-slate-500">{j.teacherName}</p>
                          </div>
                          <div className="col-span-2 pt-1 border-t border-slate-200/50">
                            <p className="text-slate-400 font-bold uppercase tracking-wider text-[10px] mb-0.5">Materi</p>
                            <p className="font-medium text-slate-800">{j.topic}</p>
                            <p className="text-[11px] text-slate-400 italic mt-0.5">Media: {j.media}</p>
                          </div>
                        </div>
                        <div className="bg-white p-2.5 rounded-lg border border-slate-200/80 text-xs text-slate-600 leading-relaxed shadow-inner">
                          <p className="font-bold text-slate-500 uppercase tracking-wider text-[9px] mb-1">Catatan KBM:</p>
                          {j.notes}
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
