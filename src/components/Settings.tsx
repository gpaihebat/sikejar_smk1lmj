import React, { useState } from 'react';
import { SyncConfig, Student, Teacher } from '../types';
import { DEFAULT_CLASSES, DEFAULT_SUBJECTS } from '../data/mockData';
import { 
  Database, Wifi, WifiOff, RefreshCw, Send, CheckCircle2, AlertCircle, 
  Trash2, UserPlus, FileSpreadsheet, RotateCcw, ShieldAlert, GraduationCap,
  Printer, FileText
} from 'lucide-react';

interface SettingsProps {
  syncConfig: SyncConfig;
  onUpdateSyncConfig: (config: SyncConfig) => void;
  students: Student[];
  onUpdateStudents: (students: Student[]) => void;
  teachers: Teacher[];
  onUpdateTeachers: (teachers: Teacher[]) => void;
  classes: string[];
  onUpdateClasses: (classes: string[]) => void;
  onSyncAllData: () => Promise<{ success: boolean; message: string }>;
  onResetData: () => void;
  currentTeacher: Teacher;
}

export default function Settings({
  syncConfig,
  onUpdateSyncConfig,
  students,
  onUpdateStudents,
  teachers,
  onUpdateTeachers,
  classes,
  onUpdateClasses,
  onSyncAllData,
  onResetData,
  currentTeacher
}: SettingsProps) {
  const [url, setUrl] = useState(syncConfig.appsScriptUrl);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [syncing, setSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState<{ success: boolean; message: string } | null>(null);

  // Print Configuration states
  const [printProvinsi, setPrintProvinsi] = useState(() => {
    try {
      const saved = localStorage.getItem('portal_print_config');
      if (saved) {
        const parsed = JSON.parse(saved);
        return parsed.provinsi || "PEMERINTAH PROVINSI JAWA BARAT";
      }
    } catch (e) {}
    return "PEMERINTAH PROVINSI JAWA BARAT";
  });

  const [printSekolah, setPrintSekolah] = useState(() => {
    try {
      const saved = localStorage.getItem('portal_print_config');
      if (saved) {
        const parsed = JSON.parse(saved);
        return parsed.sekolah || "SMA NEGERI 1 TARUNA";
      }
    } catch (e) {}
    return "SMA NEGERI 1 TARUNA";
  });

  const [printAlamat, setPrintAlamat] = useState(() => {
    try {
      const saved = localStorage.getItem('portal_print_config');
      if (saved) {
        const parsed = JSON.parse(saved);
        return parsed.alamat || "Jl. Pendidikan No. 45, Bandung • Telp: (022) 1234567 • Email: info@sman1taruna.sch.id";
      }
    } catch (e) {}
    return "Jl. Pendidikan No. 45, Bandung • Telp: (022) 1234567 • Email: info@sman1taruna.sch.id";
  });

  const [printKepalaSekolah, setPrintKepalaSekolah] = useState(() => {
    try {
      const saved = localStorage.getItem('portal_print_config');
      if (saved) {
        const parsed = JSON.parse(saved);
        return parsed.kepalaSekolah || "Drs. H. Mulyadi Kartawijaya, M.Pd.";
      }
    } catch (e) {}
    return "Drs. H. Mulyadi Kartawijaya, M.Pd.";
  });

  const [printNipKepala, setPrintNipKepala] = useState(() => {
    try {
      const saved = localStorage.getItem('portal_print_config');
      if (saved) {
        const parsed = JSON.parse(saved);
        return parsed.nipKepalaSekolah || "19720815 199803 1 004";
      }
    } catch (e) {}
    return "19720815 199803 1 004";
  });

  const [printKota, setPrintKota] = useState(() => {
    try {
      const saved = localStorage.getItem('portal_print_config');
      if (saved) {
        const parsed = JSON.parse(saved);
        return parsed.kota || "Bandung";
      }
    } catch (e) {}
    return "Bandung";
  });

  const [printFeedback, setPrintFeedback] = useState<string | null>(null);

  const handleSavePrintConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    const config = {
      provinsi: printProvinsi,
      sekolah: printSekolah,
      alamat: printAlamat,
      kepalaSekolah: printKepalaSekolah,
      nipKepalaSekolah: printNipKepala,
      kota: printKota
    };
    localStorage.setItem('portal_print_config', JSON.stringify(config));
    
    // Dispatch print config changed event
    window.dispatchEvent(new Event('print_config_changed'));

    if (syncConfig.mode === 'sheets' && syncConfig.appsScriptUrl) {
      setPrintFeedback('Menyimpan secara lokal dan menyelaraskan ke Google Sheets...');
      const res = await onSyncAllData();
      if (res.success) {
        setPrintFeedback('Pengaturan Kop & Tanda Tangan Cetak berhasil disimpan dan diselaraskan ke Google Sheets!');
      } else {
        setPrintFeedback(`Berhasil disimpan secara lokal, namun gagal disinkronkan ke Google Sheets: ${res.message}`);
      }
    } else {
      setPrintFeedback('Pengaturan Kop & Tanda Tangan Cetak berhasil disimpan secara lokal!');
    }
    setTimeout(() => setPrintFeedback(null), 4000);
  };

  // Form states for adding student
  const [newStudId, setNewStudId] = useState('');
  const [newStudName, setNewStudName] = useState('');
  const [newStudClass, setNewStudClass] = useState('');
  const [newStudGender, setNewStudGender] = useState<'L' | 'P'>('L');
  const [studFeedback, setStudFeedback] = useState<string | null>(null);

  // Form states for adding teacher
  const [newTeachUser, setNewTeachUser] = useState('');
  const [newTeachName, setNewTeachName] = useState('');
  const [newTeachNip, setNewTeachNip] = useState('');
  const [newTeachSubject, setNewTeachSubject] = useState(DEFAULT_SUBJECTS[0]);
  const [newTeachSchool, setNewTeachSchool] = useState(currentTeacher.schoolName || 'SMA Negeri 1 Taruna');
  const [newTeachIsAdmin, setNewTeachIsAdmin] = useState(false);
  const [teachFeedback, setTeachFeedback] = useState<string | null>(null);
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  // Class Management and Teacher-Class Mapping states
  const [newClassNameInput, setNewClassNameInput] = useState('');
  const [classFeedback, setClassFeedback] = useState<string | null>(null);
  const [mapTeacherUser, setMapTeacherUser] = useState(teachers[0]?.username || '');
  const [mapCheckedClasses, setMapCheckedClasses] = useState<string[]>([]);
  const [mapTeacherFeedback, setMapTeacherFeedback] = useState<string | null>(null);
  const [newTeachClasses, setNewTeachClasses] = useState<string[]>([]);

  React.useEffect(() => {
    if (classes && classes.length > 0 && !newStudClass) {
      setNewStudClass(classes[0]);
    }
  }, [classes, newStudClass]);

  React.useEffect(() => {
    if (mapTeacherUser) {
      const t = teachers.find(x => x.username === mapTeacherUser);
      setMapCheckedClasses(t?.classes || []);
    }
  }, [mapTeacherUser, teachers]);

  React.useEffect(() => {
    if (teachers.length > 0 && !mapTeacherUser) {
      setMapTeacherUser(teachers[0].username);
    }
  }, [teachers, mapTeacherUser]);

  // Test Apps Script connection
  const handleTestConnection = async () => {
    if (!url.trim()) {
      setTestResult({ success: false, message: 'Harap isi URL Google Apps Script terlebih dahulu.' });
      return;
    }

    setTesting(true);
    setTestResult(null);

    try {
      // Create JSONP or CORS request to doGet
      const testUrl = `${url.trim()}${url.includes('?') ? '&' : '?'}action=test`;
      const response = await fetch(testUrl, { method: 'GET', mode: 'cors' });
      const data = await response.json();

      if (data && data.status === 'success') {
        setTestResult({ success: true, message: data.message || 'Koneksi Spreadsheet sukses!' });
      } else {
        setTestResult({ success: false, message: data?.message || 'Gagal tersambung. Periksa izin deployment script.' });
      }
    } catch (err: any) {
      console.error(err);
      setTestResult({
        success: false,
        message: 'Koneksi gagal. Pastikan URL benar, dideploy sebagai "Anyone", dan Anda telah mengizinkan akses CORS.'
      });
    } finally {
      setTesting(false);
    }
  };

  // Save Apps Script URL and toggle mode
  const handleToggleMode = (newMode: 'local' | 'sheets') => {
    onUpdateSyncConfig({
      appsScriptUrl: url.trim(),
      mode: newMode,
      lastSynced: syncConfig.lastSynced
    });
  };

  // Execute full synchronization push
  const handleSyncData = async () => {
    if (syncConfig.mode !== 'sheets' || !syncConfig.appsScriptUrl) {
      setSyncResult({ success: false, message: 'Harap aktifkan Mode Google Sheets terlebih dahulu.' });
      return;
    }

    setSyncing(true);
    setSyncResult(null);

    try {
      const res = await onSyncAllData();
      if (res.success) {
        setSyncResult({ success: true, message: res.message });
      } else {
        setSyncResult({ success: false, message: res.message });
      }
    } catch (err: any) {
      setSyncResult({ success: false, message: err.toString() });
    } finally {
      setSyncing(false);
    }
  };

  // Add a student locally
  const handleAddStudent = (e: React.FormEvent) => {
    e.preventDefault();
    setStudFeedback(null);

    if (!newStudId.trim() || !newStudName.trim()) {
      setStudFeedback('ID dan Nama siswa tidak boleh kosong.');
      return;
    }

    if (students.some(s => s.id === newStudId.trim())) {
      setStudFeedback('Siswa dengan NIS tersebut sudah terdaftar.');
      return;
    }

    const newStudent: Student = {
      id: newStudId.trim(),
      name: newStudName.trim(),
      className: newStudClass,
      gender: newStudGender
    };

    onUpdateStudents([...students, newStudent]);
    setNewStudId('');
    setNewStudName('');
    setStudFeedback('Siswa berhasil ditambahkan!');
  };

  // Delete student
  const handleDeleteStudent = (id: string) => {
    const student = students.find(s => s.id === id);
    onUpdateStudents(students.filter(s => s.id !== id));
    setStudFeedback(student ? `Siswa "${student.name}" berhasil dihapus.` : 'Siswa berhasil dihapus.');
  };

  // Add teacher
  const handleAddTeacher = (e: React.FormEvent) => {
    e.preventDefault();
    setTeachFeedback(null);

    if (!newTeachUser.trim() || !newTeachName.trim()) {
      setTeachFeedback('Username dan Nama Guru tidak boleh kosong.');
      return;
    }

    const cleanUsername = newTeachUser.trim().toLowerCase();
    if (teachers.some(t => t.username.toLowerCase() === cleanUsername)) {
      setTeachFeedback('Username guru sudah terdaftar.');
      return;
    }

    const newTeacher: Teacher = {
      username: cleanUsername,
      name: newTeachName.trim(),
      subject: newTeachSubject,
      schoolName: newTeachSchool.trim() || 'SMA Negeri 1 Taruna',
      classes: newTeachClasses.length > 0 ? newTeachClasses : classes,
      isAdmin: newTeachIsAdmin,
      nip: newTeachNip.trim()
    };

    onUpdateTeachers([...teachers, newTeacher]);
    setNewTeachUser('');
    setNewTeachName('');
    setNewTeachNip('');
    setNewTeachClasses([]);
    setNewTeachIsAdmin(false);
    setTeachFeedback('Guru berhasil didaftarkan!');
  };

  // Delete teacher
  const handleDeleteTeacher = (username: string) => {
    setTeachFeedback(null);
    if (username === 'admin') {
      setTeachFeedback('Keamanan: Username "admin" tidak dapat dihapus.');
      return;
    }
    if (username === currentTeacher.username) {
      setTeachFeedback('Gagal: Anda tidak dapat menghapus akun Anda sendiri yang sedang aktif.');
      return;
    }
    const teacher = teachers.find(t => t.username === username);
    onUpdateTeachers(teachers.filter(t => t.username !== username));
    setTeachFeedback(teacher ? `Akun guru "${teacher.name}" berhasil dihapus.` : 'Akun guru berhasil dihapus.');
  };

  // Add Class
  const handleAddClass = (e: React.FormEvent) => {
    e.preventDefault();
    setClassFeedback(null);
    const cleanClassName = newClassNameInput.trim().toUpperCase();
    if (!cleanClassName) {
      setClassFeedback('Nama kelas tidak boleh kosong.');
      return;
    }
    if (classes.includes(cleanClassName)) {
      setClassFeedback('Kelas tersebut sudah terdaftar.');
      return;
    }
    onUpdateClasses([...classes, cleanClassName]);
    setNewClassNameInput('');
    setClassFeedback(`Kelas "${cleanClassName}" berhasil ditambahkan.`);
  };

  // Delete Class
  const handleDeleteClass = (clsName: string) => {
    setClassFeedback(null);
    if (classes.length <= 1) {
      setClassFeedback('Gagal: Minimal harus menyisakan 1 kelas dalam daftar.');
      return;
    }
    onUpdateClasses(classes.filter(c => c !== clsName));
    setClassFeedback(`Kelas "${clsName}" berhasil dihapus.`);
  };

  // Save Teacher Mapping
  const handleSaveTeacherMapping = (e: React.FormEvent) => {
    e.preventDefault();
    setMapTeacherFeedback(null);
    if (!mapTeacherUser) {
      setMapTeacherFeedback('Silakan pilih guru terlebih dahulu.');
      return;
    }
    const updatedTeachers = teachers.map(t => {
      if (t.username === mapTeacherUser) {
        return {
          ...t,
          classes: mapCheckedClasses
        };
      }
      return t;
    });
    onUpdateTeachers(updatedTeachers);
    setMapTeacherFeedback('Pemetaan kelas untuk guru berhasil disimpan!');
  };

  return (
    <div className="space-y-6">
      {/* 1. APPS SCRIPT SYNC SECTION */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 shadow-sm space-y-6">
        <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
          <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl">
            <Database className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-800 font-sans">Koneksi Database Spreadsheet</h2>
            <p className="text-xs text-slate-500 mt-0.5">Atur sinkronisasi data cloud real-time ke Google Drive Anda.</p>
          </div>
        </div>

        {/* Input Web App URL */}
        <div className="space-y-2">
          <label className="block text-sm font-semibold text-slate-700">URL Web App Google Apps Script</label>
          <div className="flex flex-col sm:flex-row gap-2">
            <input
              type="text"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://script.google.com/macros/s/.../exec"
              className="flex-grow bg-slate-50/50 border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 focus:bg-white transition-all"
            />
            <button
              onClick={handleTestConnection}
              disabled={testing || !url.trim()}
              className="px-5 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 disabled:bg-slate-50 disabled:text-slate-400 rounded-xl text-xs font-bold border border-slate-200 flex items-center justify-center gap-1.5 transition-all cursor-pointer"
            >
              {testing ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
              Tes Koneksi
            </button>
          </div>
          <p className="text-[11px] text-slate-400">
            Dapatkan URL di atas dengan melakukan deployment skrip Google Sheets Anda sebagai Aplikasi Web (Web App) dengan akses "Siapa saja / Anyone".
          </p>
        </div>

        {/* Test Result Feedback */}
        {testResult && (
          <div
            className={`p-3.5 rounded-xl border text-xs flex items-start gap-2.5 ${
              testResult.success
                ? 'bg-emerald-50 border-emerald-100 text-emerald-800'
                : 'bg-rose-50 border-rose-100 text-rose-800'
            }`}
          >
            {testResult.success ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            )}
            <div>
              <p className="font-bold">{testResult.success ? 'Koneksi Berhasil' : 'Koneksi Gagal'}</p>
              <p className="mt-0.5 leading-normal">{testResult.message}</p>
            </div>
          </div>
        )}

        {/* Mode Toggle Slider Controls */}
        <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <p className="text-sm font-bold text-slate-700">Status Database Saat Ini</p>
            <p className="text-xs text-slate-400 mt-0.5">Mode aktif menentukan penyimpanan data sekunder.</p>
          </div>

          <div className="flex bg-slate-200 p-1 rounded-xl w-full sm:w-auto">
            <button
              onClick={() => handleToggleMode('local')}
              className={`flex-1 sm:flex-initial px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1 cursor-pointer ${
                syncConfig.mode === 'local'
                  ? 'bg-white text-slate-800 shadow-sm'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <WifiOff className="w-3.5 h-3.5" /> Demo Lokal
            </button>
            <button
              onClick={() => {
                if (!syncConfig.appsScriptUrl && !url.trim()) {
                  alert('Harap isi URL skrip terlebih dahulu sebelum mengaktifkan mode spreadsheet!');
                  return;
                }
                handleToggleMode('sheets');
              }}
              className={`flex-1 sm:flex-initial px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1 cursor-pointer ${
                syncConfig.mode === 'sheets'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <Wifi className="w-3.5 h-3.5" /> Spreadsheet Cloud
            </button>
          </div>
        </div>

        {/* Sync Data Button (Pushes all data to sheets) */}
        {syncConfig.mode === 'sheets' && (
          <div className="border-t border-slate-100 pt-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <p className="text-sm font-semibold text-slate-800">Paksa Sinkronisasi (Sync All Data)</p>
              <p className="text-xs text-slate-400 mt-0.5">Mengunggah seluruh data lokal Anda (Siswa, Guru, Presensi, Jurnal) ke Google Sheets sekaligus.</p>
              {syncConfig.lastSynced && (
                <p className="text-[10px] text-emerald-600 font-medium mt-1">Terakhir sinkronisasi berhasil: {syncConfig.lastSynced}</p>
              )}
            </div>

            <button
              onClick={handleSyncData}
              disabled={syncing}
              className="w-full sm:w-auto px-5 py-3 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all shadow-sm cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${syncing ? 'animate-spin' : ''}`} />
              {syncing ? 'Mensinkronkan...' : 'Sinkronisasikan Sekarang'}
            </button>
          </div>
        )}

        {/* Sync Result Feedback */}
        {syncResult && (
          <div
            className={`p-3.5 rounded-xl border text-xs flex items-start gap-2.5 ${
              syncResult.success
                ? 'bg-emerald-50 border-emerald-100 text-emerald-800'
                : 'bg-rose-50 border-rose-100 text-rose-800'
            }`}
          >
            {syncResult.success ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            )}
            <div>
              <p className="font-bold">{syncResult.success ? 'Sinkronisasi Sukses!' : 'Sinkronisasi Gagal'}</p>
              <p className="mt-0.5 leading-normal text-slate-600">{syncResult.message}</p>
            </div>
          </div>
        )}
      </div>

      {/* PENGATURAN KOP SURAT & TANDA TANGAN (CETAK PDF) */}
      {currentTeacher.isAdmin && (
        <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 shadow-sm space-y-4">
          <h3 className="font-bold text-slate-800 text-base flex items-center gap-2 border-b border-slate-100 pb-3">
            <Printer className="w-5 h-5 text-emerald-600" /> Pengaturan Kop & Tanda Tangan Cetak PDF
          </h3>
          <p className="text-xs text-slate-500 leading-relaxed">
            Sesuaikan informasi kop surat kedinasan dan nama penandatangan laporan (Kepala Sekolah & kota penerbitan) untuk format cetak PDF / Print Laporan.
          </p>

          <form onSubmit={handleSavePrintConfig} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Nama Provinsi / Institusi Atas</label>
              <input
                type="text"
                value={printProvinsi}
                onChange={(e) => setPrintProvinsi(e.target.value)}
                placeholder="Contoh: PEMERINTAH PROVINSI JAWA BARAT"
                className="w-full bg-slate-50/50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Nama Sekolah / Lembaga</label>
              <input
                type="text"
                value={printSekolah}
                onChange={(e) => setPrintSekolah(e.target.value)}
                placeholder="Contoh: SMA NEGERI 1 TARUNA"
                className="w-full bg-slate-50/50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1">Alamat Lengkap & Kontak (Sub-header)</label>
              <input
                type="text"
                value={printAlamat}
                onChange={(e) => setPrintAlamat(e.target.value)}
                placeholder="Contoh: Jl. Raya No. 123 • Telp: ... • Email: ..."
                className="w-full bg-slate-50/50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Nama Kepala Sekolah</label>
              <input
                type="text"
                value={printKepalaSekolah}
                onChange={(e) => setPrintKepalaSekolah(e.target.value)}
                placeholder="Contoh: Drs. H. Ahmad Fauzi, M.Pd."
                className="w-full bg-slate-50/50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">NIP Kepala Sekolah</label>
              <input
                type="text"
                value={printNipKepala}
                onChange={(e) => setPrintNipKepala(e.target.value)}
                placeholder="Contoh: 19750412 200312 1 002"
                className="w-full bg-slate-50/50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Kota Tempat Tanda Tangan</label>
              <input
                type="text"
                value={printKota}
                onChange={(e) => setPrintKota(e.target.value)}
                placeholder="Contoh: Bandung"
                className="w-full bg-slate-50/50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all"
              />
            </div>

            <div className="flex items-end justify-end">
              <button
                type="submit"
                className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm cursor-pointer flex items-center gap-1.5"
              >
                <Printer className="w-3.5 h-3.5" />
                Simpan Kop & Ttd
              </button>
            </div>
          </form>

          {printFeedback && (
            <div className="p-3 bg-emerald-50 border border-emerald-100 rounded-xl text-xs text-emerald-800 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{printFeedback}</span>
            </div>
          )}
        </div>
      )}

      {/* 2. ADMIN-ONLY MASTER MANAGEMENT */}
      {currentTeacher.isAdmin && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Master Siswa Table */}
          <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 shadow-sm space-y-4">
            <h3 className="font-bold text-slate-800 text-base flex items-center gap-2 border-b border-slate-100 pb-3">
              <UserPlus className="w-5 h-5 text-indigo-600" /> Kelola Master Siswa ({students.length})
            </h3>

            {/* Add Student Form */}
            <form onSubmit={handleAddStudent} className="bg-slate-50/50 p-3.5 rounded-xl border border-slate-100 grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="col-span-2 sm:col-span-1">
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">NIS (Nomor Induk)</label>
                <input
                  type="text"
                  required
                  value={newStudId}
                  onChange={(e) => setNewStudId(e.target.value)}
                  placeholder="Contoh: 1007"
                  className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-700"
                />
              </div>
              <div className="col-span-2 sm:col-span-1">
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Nama Siswa</label>
                <input
                  type="text"
                  required
                  value={newStudName}
                  onChange={(e) => setNewStudName(e.target.value)}
                  placeholder="Nama Lengkap"
                  className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-700"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Kelas</label>
                <select
                  value={newStudClass}
                  onChange={(e) => setNewStudClass(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-700"
                >
                  {classes.map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Gender</label>
                <select
                  value={newStudGender}
                  onChange={(e) => setNewStudGender(e.target.value as 'L' | 'P')}
                  className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-700"
                >
                  <option value="L">Laki-laki (L)</option>
                  <option value="P">Perempuan (P)</option>
                </select>
              </div>

              {studFeedback && (
                <p className={`col-span-2 text-[11px] font-semibold ${studFeedback.includes('berhasil') ? 'text-emerald-600' : 'text-rose-600'}`}>
                  {studFeedback}
                </p>
              )}

              <div className="col-span-2 flex justify-end">
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold cursor-pointer shadow-sm transition-colors"
                >
                  Tambah Siswa
                </button>
              </div>
            </form>

            {/* Students List Scroll View */}
            <div className="border border-slate-200 rounded-xl overflow-hidden max-h-[250px] overflow-y-auto divide-y divide-slate-100">
              {students.map(s => (
                <div key={s.id} className="p-2.5 flex items-center justify-between text-xs hover:bg-slate-50/40">
                  <div>
                    <p className="font-bold text-slate-800">{s.name}</p>
                    <p className="text-slate-400 text-[10px] mt-0.5">NIS: {s.id} • Kelas: {s.className} • Gender: {s.gender}</p>
                  </div>
                  <button
                    onClick={() => handleDeleteStudent(s.id)}
                    className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                    title="Hapus Siswa"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Master Guru Table */}
          <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 shadow-sm space-y-4">
            <h3 className="font-bold text-slate-800 text-base flex items-center gap-2 border-b border-slate-100 pb-3">
              <UserPlus className="w-5 h-5 text-amber-600" /> Pendaftaran Akun Guru ({teachers.length})
            </h3>

            {/* Add Teacher Form */}
            <form onSubmit={handleAddTeacher} className="bg-slate-50/50 p-3.5 rounded-xl border border-slate-100 grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Username Guru (Login)</label>
                <input
                  type="text"
                  required
                  value={newTeachUser}
                  onChange={(e) => setNewTeachUser(e.target.value)}
                  placeholder="Contoh: eko"
                  className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-700"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Nama Lengkap & Gelar</label>
                <input
                  type="text"
                  required
                  value={newTeachName}
                  onChange={(e) => setNewTeachName(e.target.value)}
                  placeholder="Eko Prasetyo, S.Pd."
                  className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-700"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">NIP / NUPTK</label>
                <input
                  type="text"
                  value={newTeachNip}
                  onChange={(e) => setNewTeachNip(e.target.value)}
                  placeholder="Contoh: 19900228 202012 1 005"
                  className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-700"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Mata Pelajaran Diampu</label>
                <select
                  value={newTeachSubject}
                  onChange={(e) => setNewTeachSubject(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-700"
                >
                  {DEFAULT_SUBJECTS.map(s => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Nama Sekolah</label>
                <input
                  type="text"
                  required
                  value={newTeachSchool}
                  onChange={(e) => setNewTeachSchool(e.target.value)}
                  placeholder="Contoh: SMA Negeri 1 Taruna"
                  className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-700"
                />
              </div>

              <div className="col-span-1 sm:col-span-2 border-t border-slate-100 pt-2.5">
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                  Pilih Kelas yang Diajar (Jika kosong, otomatis mengajar semua kelas)
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 bg-white border border-slate-200 rounded-lg p-2 max-h-[120px] overflow-y-auto">
                  {classes.map(c => (
                    <label key={c} className="flex items-center gap-1.5 text-xs text-slate-700 cursor-pointer hover:bg-slate-50 p-1 rounded">
                      <input
                        type="checkbox"
                        checked={newTeachClasses.includes(c)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setNewTeachClasses([...newTeachClasses, c]);
                          } else {
                            setNewTeachClasses(newTeachClasses.filter(cls => cls !== c));
                          }
                        }}
                        className="w-3.5 h-3.5 text-amber-600 focus:ring-amber-500 border-slate-300 rounded"
                      />
                      <span>{c}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-2 pt-4">
                <input
                  id="isAdmin"
                  type="checkbox"
                  checked={newTeachIsAdmin}
                  onChange={(e) => setNewTeachIsAdmin(e.target.checked)}
                  className="w-4 h-4 text-amber-600 focus:ring-amber-500 border-slate-300 rounded"
                />
                <label htmlFor="isAdmin" className="text-xs font-semibold text-slate-700">Set sebagai Admin</label>
              </div>

              {teachFeedback && (
                <p className={`col-span-2 text-[11px] font-semibold ${teachFeedback.includes('berhasil') ? 'text-emerald-600' : 'text-rose-600'}`}>
                  {teachFeedback}
                </p>
              )}

              <div className="col-span-2 flex justify-end">
                <button
                  type="submit"
                  className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-semibold cursor-pointer shadow-sm transition-colors"
                >
                  Daftarkan Guru
                </button>
              </div>
            </form>

            {/* Teachers Scroll View */}
            <div className="border border-slate-200 rounded-xl overflow-hidden max-h-[250px] overflow-y-auto divide-y divide-slate-100">
              {teachers.map(t => (
                <div key={t.username} className="p-2.5 flex items-center justify-between text-xs hover:bg-slate-50/40">
                  <div>
                    <p className="font-bold text-slate-800">{t.name} {t.isAdmin && <span className="bg-amber-100 text-amber-800 text-[9px] font-bold px-1.5 py-0.5 rounded ml-1">Admin</span>}</p>
                    <p className="text-slate-400 text-[10px] mt-0.5">Username: {t.username} • Mapel: {t.subject} • Sekolah: {t.schoolName || '-'}</p>
                  </div>
                  <button
                    onClick={() => handleDeleteTeacher(t.username)}
                    className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                    title="Hapus Akun Guru"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
        {/* Row 2: Classes Management & Teacher Mapping */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
            {/* Manajemen Kelas Sekolah */}
            <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 shadow-sm flex flex-col justify-between space-y-4">
              <div>
                <h3 className="font-bold text-slate-800 text-base flex items-center gap-2 border-b border-slate-100 pb-3">
                  <GraduationCap className="w-5 h-5 text-emerald-600" /> Manajemen Kelas Sekolah ({classes.length})
                </h3>
                <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                  Daftar seluruh kelas yang terdaftar di sekolah. Kelas-kelas ini akan muncul sebagai opsi pilihan utama pada pengisian presensi siswa dan jurnal pengajaran guru.
                </p>
                
                <form onSubmit={handleAddClass} className="bg-slate-50/50 p-3.5 rounded-xl border border-slate-100 flex gap-3 mt-4">
                  <div className="flex-1">
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Nama Kelas Baru</label>
                    <input
                      type="text"
                      required
                      value={newClassNameInput}
                      onChange={(e) => setNewClassNameInput(e.target.value)}
                      placeholder="Contoh: XII-MIPA-5"
                      className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                  <div className="flex items-end">
                    <button
                      type="submit"
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold cursor-pointer shadow-sm transition-colors"
                    >
                      Tambah Kelas
                    </button>
                  </div>
                </form>

                {classFeedback && (
                  <p className={`text-[11px] font-semibold mt-2 ${classFeedback.includes('berhasil') ? 'text-emerald-600' : 'text-rose-600'}`}>
                    {classFeedback}
                  </p>
                )}

                {/* Classes Scroll View */}
                <div className="border border-slate-200 rounded-xl overflow-hidden max-h-[220px] overflow-y-auto p-3.5 bg-slate-50/20 mt-4">
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {classes.map(c => (
                      <div key={c} className="flex items-center justify-between p-2.5 bg-white rounded-xl border border-slate-100 shadow-xs hover:border-emerald-200 hover:shadow-xs transition-all text-xs">
                        <span className="font-bold text-slate-700">{c}</span>
                        <button
                          type="button"
                          onClick={() => handleDeleteClass(c)}
                          className="p-1 text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                          title={`Hapus Kelas ${c}`}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="bg-emerald-50/50 border border-emerald-100 p-3 rounded-xl mt-4">
                <p className="text-[10px] text-emerald-800 leading-relaxed font-medium">
                  💡 <strong>Sinkronisasi Spreadsheet:</strong> Jika Anda menghubungkan aplikasi ke Google Sheets, daftar kelas juga dapat diselaraskan secara otomatis dari sheet <strong>Siswa</strong> (kolom Kelas) atau kolom Kelas guru!
                </p>
              </div>
            </div>

            {/* Pemetaan Kelas Guru */}
            <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 shadow-sm space-y-4 flex flex-col justify-between">
              <div>
                <h3 id="map-title" className="font-bold text-slate-800 text-base flex items-center gap-2 border-b border-slate-100 pb-3">
                  <ShieldAlert className="w-5 h-5 text-amber-600" /> Pemetaan Kelas Guru
                </h3>
                <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                  Tentukan kelas mana saja yang diampu oleh masing-masing guru. Guru yang login hanya akan melihat kelas yang dipetakan kepadanya untuk menjaga fokus.
                </p>

                <form onSubmit={handleSaveTeacherMapping} className="space-y-4 mt-4">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Pilih Guru Pengampu</label>
                    <select
                      value={mapTeacherUser}
                      onChange={(e) => setMapTeacherUser(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-amber-500 font-semibold"
                    >
                      {teachers.map(t => (
                        <option key={t.username} value={t.username}>{t.name} ({t.subject})</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                        Tentukan Kelas yang Diajar
                      </label>
                      <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full">
                        {mapCheckedClasses.length} Terpilih
                      </span>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 bg-slate-50/50 border border-slate-200 rounded-lg p-2.5 max-h-[140px] overflow-y-auto">
                      {classes.map(c => (
                        <label key={c} className="flex items-center gap-1.5 text-xs text-slate-700 cursor-pointer hover:bg-white p-1.5 rounded-lg transition-all border border-transparent hover:border-slate-100">
                          <input
                            type="checkbox"
                            checked={mapCheckedClasses.includes(c)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setMapCheckedClasses([...mapCheckedClasses, c]);
                              } else {
                                setMapCheckedClasses(mapCheckedClasses.filter(cls => cls !== c));
                              }
                            }}
                            className="w-3.5 h-3.5 text-amber-600 focus:ring-amber-500 border-slate-300 rounded cursor-pointer"
                          />
                          <span className="font-medium">{c}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  {mapTeacherFeedback && (
                    <p className={`text-[11px] font-semibold ${mapTeacherFeedback.includes('berhasil') ? 'text-emerald-600' : 'text-rose-600'}`}>
                      {mapTeacherFeedback}
                    </p>
                  )}

                  <div className="flex justify-end pt-2 border-t border-slate-100">
                    <button
                      type="submit"
                      className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-semibold cursor-pointer shadow-sm transition-colors"
                    >
                      Simpan Pemetaan Kelas
                    </button>
                  </div>
                </form>
              </div>

              <div className="bg-amber-50/50 border border-amber-100 p-3 rounded-xl mt-4">
                <p className="text-[10px] text-amber-800 leading-relaxed font-medium">
                  💡 <strong>Dukungan Spreadsheet:</strong> Jika diatur melalui mode Google Sheets, kolom <strong>Kelas</strong> pada sheet <strong>Guru</strong> dapat dipisahkan dengan tanda koma (Contoh: <code className="bg-white/80 px-1 rounded">X-A, X-B</code>) dan akan langsung terpetakan di sini!
                </p>
              </div>
            </div>
          </div>

          {/* TABLE OVERVIEW OF TEACHER MAPS */}
          <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 shadow-sm mt-6 space-y-4">
            <h3 className="font-bold text-slate-800 text-sm md:text-base flex items-center gap-2 border-b border-slate-100 pb-3">
              <Database className="w-5 h-5 text-indigo-600" /> Ringkasan Pemetaan Guru & Kelas Aktif
            </h3>
            <p className="text-xs text-slate-500">
              Berikut adalah peta pembagian tugas mengajar seluruh guru saat ini. Klik tombol edit pada guru manapun untuk mengubah daftar kelas yang mereka ajar.
            </p>
            <div className="border border-slate-100 rounded-xl overflow-hidden">
              <table className="w-full text-left border-collapse text-xs md:text-sm">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 text-[10px] font-bold uppercase tracking-wider">
                    <th className="p-3">Nama Lengkap Guru</th>
                    <th className="p-3">Mata Pelajaran</th>
                    <th className="p-3">Kelas Yang Diajar</th>
                    <th className="p-3 text-center">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {teachers.map(t => {
                    const hasClasses = t.classes && t.classes.length > 0;
                    return (
                      <tr key={t.username} className="hover:bg-slate-50/50 transition-colors">
                        <td className="p-3">
                          <span className="font-bold text-slate-800 block">{t.name}</span>
                          <span className="text-[10px] text-slate-400 block font-mono">Username: {t.username} {t.nip ? `• NIP: ${t.nip}` : ''}</span>
                        </td>
                        <td className="p-3 font-semibold text-slate-600">{t.subject}</td>
                        <td className="p-3">
                          {hasClasses ? (
                            <div className="flex flex-wrap gap-1">
                              {t.classes.map(cls => (
                                <span key={cls} className="px-1.5 py-0.5 bg-indigo-50 border border-indigo-100 text-indigo-700 rounded text-[10px] font-bold">
                                  {cls}
                                </span>
                              ))}
                            </div>
                          ) : (
                            <span className="text-rose-500 italic text-[11px] font-semibold">Belum dipetakan (akses diblokir)</span>
                          )}
                        </td>
                        <td className="p-3 text-center">
                          <button
                            type="button"
                            onClick={() => {
                              setMapTeacherUser(t.username);
                              setMapCheckedClasses(t.classes || []);
                              const formEl = document.getElementById('map-title');
                              if (formEl) {
                                formEl.scrollIntoView({ behavior: 'smooth' });
                              }
                            }}
                            className="px-2.5 py-1 bg-slate-100 hover:bg-amber-50 hover:text-amber-700 rounded-lg text-[11px] font-bold text-slate-600 transition-all cursor-pointer border border-transparent hover:border-amber-200"
                          >
                            Ubah Kelas
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* 3. DANGER RESET BUTTONS */}
      <div className="bg-rose-50 border border-rose-100 rounded-2xl p-4 sm:p-6 shadow-sm space-y-4">
        <h3 className="font-bold text-rose-800 text-base flex items-center gap-2">
          <ShieldAlert className="w-5 h-5 text-rose-600" /> Pusat Pemulihan Data (Danger Zone)
        </h3>
        <p className="text-xs text-rose-700 leading-relaxed">
          Jika Anda ingin membersihkan seluruh riwayat rekap presensi dan jurnal, atau mengembalikan database ke setelan bawaan pabrik (termasuk memulihkan data sampel untuk presentasi), silakan gunakan tombol di bawah. Tindakan ini bersifat permanen secara lokal.
        </p>

        <div className="flex flex-wrap items-center gap-2">
          {showResetConfirm ? (
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 bg-white p-3 rounded-xl border border-rose-200">
              <span className="text-xs text-rose-800 font-medium">Apakah Anda yakin? Seluruh data kustom akan diganti dengan data bawaan awal.</span>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    onResetData();
                    setShowResetConfirm(false);
                  }}
                  className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold cursor-pointer transition-colors"
                >
                  Ya, Reset Sekarang
                </button>
                <button
                  onClick={() => setShowResetConfirm(false)}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold cursor-pointer transition-colors"
                >
                  Batal
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setShowResetConfirm(true)}
              className="flex items-center gap-1.5 px-4 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" /> Reset ke Data Bawaan (Default Mock)
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
