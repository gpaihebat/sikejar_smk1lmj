import React, { useState, useEffect, useCallback } from 'react';
import { Student, Teacher, AttendanceRecord, JournalRecord, SyncConfig } from './types';
import { 
  DEFAULT_TEACHERS, DEFAULT_STUDENTS, DEFAULT_ATTENDANCE, DEFAULT_JOURNALS, DEFAULT_CLASSES 
} from './data/mockData';
import { APP_CONFIG } from './config';

// Component imports
import Login from './components/Login';
import AttendanceForm from './components/AttendanceForm';
import JournalForm from './components/JournalForm';
import RecapDashboard from './components/RecapDashboard';
import Settings from './components/Settings';
import AppsScriptGuide from './components/AppsScriptGuide';

// Icons
import { 
  BarChart2, Users, BookOpen, Settings as SettingsIcon, LogOut, 
  HelpCircle, Wifi, WifiOff, RefreshCw, ChevronRight, User, GraduationCap, ShieldAlert,
  Sun, Moon
} from 'lucide-react';

export default function App() {
  // --- STATE DECLARATIONS ---
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [classes, setClasses] = useState<string[]>([]);
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const [journalRecords, setJournalRecords] = useState<JournalRecord[]>([]);
  const [syncConfig, setSyncConfig] = useState<SyncConfig>(() => {
    const defaultUrl = (import.meta as any).env?.VITE_APPS_SCRIPT_URL || APP_CONFIG.defaultAppsScriptUrl || '';
    const defaultMode = defaultUrl ? 'sheets' : (APP_CONFIG.defaultMode || 'local');
    return {
      appsScriptUrl: defaultUrl,
      mode: defaultMode
    };
  });
  const [currentTeacher, setCurrentTeacher] = useState<Teacher | null>(null);
  
  const [activeMenu, setActiveMenu] = useState<'dashboard' | 'attendance' | 'journal' | 'settings' | 'guide'>('dashboard');
  
  // Theme state
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    const localTheme = localStorage.getItem('portal_theme');
    return (localTheme as 'light' | 'dark') || 'light';
  });

  // Apply dark mode class to document element
  useEffect(() => {
    localStorage.setItem('portal_theme', theme);
    const root = window.document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [theme]);

  // Protect Admin Pages - force change menu if user is not an admin
  useEffect(() => {
    if (currentTeacher && !currentTeacher.isAdmin && (activeMenu === 'settings' || activeMenu === 'guide')) {
      setActiveMenu('dashboard');
    }
  }, [currentTeacher, activeMenu]);
  
  // Statuses
  const [initialLoading, setInitialLoading] = useState(false);
  const [syncLoading, setSyncLoading] = useState(false);
  const [notification, setNotification] = useState<{ type: 'info' | 'success' | 'error'; message: string } | null>(null);

  // --- LOCAL STORAGE & BOOTSTRAP LOGIC ---
  useEffect(() => {
    // 1. Load Teachers
    const localTeachers = localStorage.getItem('portal_teachers');
    if (localTeachers) {
      setTeachers(JSON.parse(localTeachers));
    } else {
      setTeachers(DEFAULT_TEACHERS);
      localStorage.setItem('portal_teachers', JSON.stringify(DEFAULT_TEACHERS));
    }

    // 2. Load Students
    const localStudents = localStorage.getItem('portal_students');
    if (localStudents) {
      setStudents(JSON.parse(localStudents));
    } else {
      setStudents(DEFAULT_STUDENTS);
      localStorage.setItem('portal_students', JSON.stringify(DEFAULT_STUDENTS));
    }

    // 3. Load Attendance
    const localAttendance = localStorage.getItem('portal_attendance');
    if (localAttendance) {
      setAttendanceRecords(JSON.parse(localAttendance));
    } else {
      setAttendanceRecords(DEFAULT_ATTENDANCE);
      localStorage.setItem('portal_attendance', JSON.stringify(DEFAULT_ATTENDANCE));
    }

    // 4. Load Journals
    const localJournals = localStorage.getItem('portal_journals');
    if (localJournals) {
      setJournalRecords(JSON.parse(localJournals));
    } else {
      setJournalRecords(DEFAULT_JOURNALS);
      localStorage.setItem('portal_journals', JSON.stringify(DEFAULT_JOURNALS));
    }

    // 5. Load Classes
    const localClasses = localStorage.getItem('portal_classes');
    if (localClasses) {
      setClasses(JSON.parse(localClasses));
    } else {
      setClasses(DEFAULT_CLASSES);
      localStorage.setItem('portal_classes', JSON.stringify(DEFAULT_CLASSES));
    }

    // 6. Load Sync Config
    const localConfigStr = localStorage.getItem('portal_sync_config');
    const defaultUrl = (import.meta as any).env?.VITE_APPS_SCRIPT_URL || APP_CONFIG.defaultAppsScriptUrl || '';
    const defaultMode = defaultUrl ? 'sheets' : (APP_CONFIG.defaultMode || 'local');
    
    let activeConfig: SyncConfig = {
      appsScriptUrl: defaultUrl,
      mode: defaultMode
    };

    if (localConfigStr) {
      const parsed = JSON.parse(localConfigStr);
      // If the local storage config has empty url OR the default build url is different,
      // override to use the defaultUrl so everyone gets automatically connected!
      if ((!parsed.appsScriptUrl && defaultUrl) || (defaultUrl && parsed.appsScriptUrl !== defaultUrl)) {
        activeConfig = {
          appsScriptUrl: defaultUrl,
          mode: defaultMode
        };
        localStorage.setItem('portal_sync_config', JSON.stringify(activeConfig));
      } else {
        activeConfig = parsed;
      }
    } else {
      if (defaultUrl) {
        localStorage.setItem('portal_sync_config', JSON.stringify(activeConfig));
      }
    }
    setSyncConfig(activeConfig);

    // 7. Load Active Session Teacher
    const sessionTeacher = localStorage.getItem('portal_current_teacher');
    if (sessionTeacher) {
      setCurrentTeacher(JSON.parse(sessionTeacher));
    }
  }, []);

  // Keep currentTeacher in sync with latest teachers list data (e.g. from Sheets sync)
  useEffect(() => {
    if (currentTeacher && teachers.length > 0) {
      const updated = teachers.find(t => t.username.toLowerCase() === currentTeacher.username.toLowerCase());
      if (updated) {
        // Only update if there are actual changes to prevent unnecessary re-renders
        if (JSON.stringify(updated) !== JSON.stringify(currentTeacher)) {
          setCurrentTeacher(updated);
          localStorage.setItem('portal_current_teacher', JSON.stringify(updated));
        }
      }
    }
  }, [teachers, currentTeacher]);

  // Show sliding notification helper
  const showNotification = useCallback((type: 'info' | 'success' | 'error', message: string) => {
    setNotification({ type, message });
    setTimeout(() => {
      setNotification(null);
    }, 4000);
  }, []);

  // --- SPREADSHEET SYNC METHODS ---
  
  // Translate Sheets arrays back to typed lists safely
  const mapDataFromSheets = useCallback((data: any) => {
    const mappedTeachers: Teacher[] = (data.teachers || []).map((t: any) => {
      const username = String(t.Username || t.username || '').trim();
      const name = String(t["Nama Lengkap"] || t.name || t.Name || t["Nama lengkap"] || '').trim();
      const subject = String(t["Mata Pelajaran"] || t.subject || t.Subject || t["Mata pelajaran"] || t.mapel || t.Mapel || '').trim();
      const schoolName = String(t["Nama Sekolah"] || t.schoolName || t.SchoolName || t["Nama sekolah"] || 'SMA Negeri 1 Taruna').trim();
      const rawClasses = t["Kelas yang Diajar"] || t["Kelas Yang Diajar"] || t["Kelas yang diajar"] || t["kelas yang diajar"] || t.Kelas || t.kelas || t.Classes || t.classes;
      let parsedClasses: string[] = [];
      if (Array.isArray(rawClasses)) {
        parsedClasses = rawClasses.map((x: any) => String(x).trim()).filter(Boolean);
      } else if (rawClasses) {
        parsedClasses = String(rawClasses).split(/[,;]+/).map((x: string) => x.trim()).filter(Boolean);
      }
      const isAdmin = String(t.isAdmin || t.IsAdmin || t.isadmin || '').toUpperCase() === 'TRUE' || t.isAdmin === true || t.IsAdmin === true;
      const nip = String(t.NIP || t.nip || t["NIP / NUPTK"] || t["NIP"] || t["NIP/NUPTK"] || '').trim();
      
      return {
        username,
        name,
        subject,
        schoolName,
        classes: parsedClasses,
        isAdmin,
        nip
      };
    });

    const mappedStudents: Student[] = (data.students || []).map((s: any) => ({
      id: String(s.NIS || '').trim(),
      name: String(s["Nama Lengkap"] || '').trim(),
      className: String(s.Kelas || '').trim(),
      gender: String(s["L/P"] || 'L').trim() as 'L' | 'P'
    }));

    const mappedAttendance: AttendanceRecord[] = (data.attendance || []).map((a: any) => {
      let rawAttendance: Record<string, any> = {};
      try {
        rawAttendance = JSON.parse(a["Kehadiran (JSON)"] || '{}');
      } catch (err) {
        rawAttendance = {};
      }

      // Ensure proper date string (sometimes sheets represents dates as stringified dates or objects)
      let dateStr = String(a.Tanggal || '');
      if (dateStr.includes('T')) {
        dateStr = dateStr.split('T')[0];
      }

      return {
        id: String(a["ID Presensi"] || ''),
        date: dateStr,
        className: String(a.Kelas || ''),
        session: String(a["Jam Ke"] || ''),
        subject: String(a["Mata Pelajaran"] || ''),
        teacherUsername: '', // Will default
        teacherName: String(a["Guru Pengampu"] || ''),
        attendance: rawAttendance,
        notes: String(a.Catatan || '')
      };
    });

    const mappedJournals: JournalRecord[] = (data.journals || []).map((j: any) => {
      let dateStr = String(j.Tanggal || '');
      if (dateStr.includes('T')) {
        dateStr = dateStr.split('T')[0];
      }

      return {
        id: String(j["ID Jurnal"] || ''),
        date: dateStr,
        className: String(j.Kelas || ''),
        session: String(j["Jam Ke"] || ''),
        subject: String(j["Mata Pelajaran"] || ''),
        teacherUsername: '',
        teacherName: String(j["Nama Guru"] || ''),
        topic: String(j["Materi Pokok"] || ''),
        media: String(j["Media Pembelajaran"] || ''),
        notes: String(j["Catatan KBM"] || '')
      };
    });

    return { mappedTeachers, mappedStudents, mappedAttendance, mappedJournals };
  }, []);

  // Fetch all databases from Google Sheets
  const loadAllDataFromSheets = useCallback(async (customUrl?: string) => {
    const targetUrl = customUrl || syncConfig.appsScriptUrl;
    if (!targetUrl) return;

    setInitialLoading(true);
    try {
      const fetchUrl = `${targetUrl}${targetUrl.includes('?') ? '&' : '?'}action=loadAll`;
      const response = await fetch(fetchUrl, { method: 'GET', mode: 'cors' });
      const data = await response.json();

      if (data && data.status === 'success') {
        const { mappedTeachers, mappedStudents, mappedAttendance, mappedJournals } = mapDataFromSheets(data);
        
        // Save to state
        if (mappedTeachers.length > 0) {
          setTeachers(mappedTeachers);
          localStorage.setItem('portal_teachers', JSON.stringify(mappedTeachers));
        }
        if (mappedStudents.length > 0) {
          setStudents(mappedStudents);
          localStorage.setItem('portal_students', JSON.stringify(mappedStudents));
        }
        
        // Load and update print configuration from settings tab if present
        if (data.settings) {
          try {
            const currentPrintConfigStr = localStorage.getItem('portal_print_config');
            const currentPrintConfig = currentPrintConfigStr ? JSON.parse(currentPrintConfigStr) : {};
            const updatedConfig = {
              provinsi: data.settings.provinsi || currentPrintConfig.provinsi || "PEMERINTAH PROVINSI JAWA BARAT",
              sekolah: data.settings.sekolah || currentPrintConfig.sekolah || "SMA NEGERI 1 TARUNA",
              alamat: data.settings.alamat || currentPrintConfig.alamat || "Jl. Pendidikan No. 45, Bandung • Telp: (022) 1234567 • Email: info@sman1taruna.sch.id",
              kepalaSekolah: data.settings.kepalaSekolah || currentPrintConfig.kepalaSekolah || "Drs. H. Mulyadi Kartawijaya, M.Pd.",
              nipKepalaSekolah: data.settings.nipKepalaSekolah || currentPrintConfig.nipKepalaSekolah || "19720815 199803 1 004",
              kota: data.settings.kota || currentPrintConfig.kota || "Bandung"
            };
            localStorage.setItem('portal_print_config', JSON.stringify(updatedConfig));
            window.dispatchEvent(new Event('print_config_changed'));
          } catch (e) {
            console.error('Failed to parse fetched print config', e);
          }
        }
        
        // Derive unique classes from students and teachers loaded from sheets
        const studentClasses = mappedStudents.map((s: any) => s.className);
        const teacherClassesList = mappedTeachers.flatMap((t: any) => t.classes || []);
        const allUniqueClasses = Array.from(new Set([...studentClasses, ...teacherClassesList]))
          .map(c => String(c).trim())
          .filter(Boolean)
          .sort();

        if (allUniqueClasses.length > 0) {
          setClasses(allUniqueClasses);
          localStorage.setItem('portal_classes', JSON.stringify(allUniqueClasses));
        }
        
        setAttendanceRecords(mappedAttendance);
        localStorage.setItem('portal_attendance', JSON.stringify(mappedAttendance));
        
        setJournalRecords(mappedJournals);
        localStorage.setItem('portal_journals', JSON.stringify(mappedJournals));

        showNotification('success', 'Berhasil sinkronisasi dan memuat data dari Google Sheets.');
      } else {
        showNotification('error', 'Spreadsheet gagal merespon: ' + (data?.message || 'Error tidak diketahui'));
      }
    } catch (err: any) {
      console.error(err);
      showNotification('error', 'Koneksi Sheets gagal. Memakai data cadangan lokal browser.');
    } finally {
      setInitialLoading(false);
    }
  }, [syncConfig.appsScriptUrl, mapDataFromSheets, showNotification]);

  // Push full lists to Sheets (Synchronization Overwrite)
  const syncAllDataToSheets = useCallback(async (
    targetUrl?: string, 
    overrideData?: { teachers: Teacher[]; students: Student[]; attendance: AttendanceRecord[]; journals: JournalRecord[] }
  ): Promise<{ success: boolean; message: string }> => {
    const url = targetUrl || syncConfig.appsScriptUrl;
    if (!url) {
      return { success: false, message: 'URL skrip belum dikonfigurasi.' };
    }

    // Prepare mapped lists for payload to perfectly match Google Sheets headers
    const rawTeachers = overrideData ? overrideData.teachers : teachers;
    const rawJournals = overrideData ? overrideData.journals : journalRecords;
    const rawAttendance = overrideData ? overrideData.attendance : attendanceRecords;

    // Load local print configuration
    let printSettings = {
      provinsi: "PEMERINTAH PROVINSI JAWA BARAT",
      sekolah: "SMA NEGERI 1 TARUNA",
      alamat: "Jl. Pendidikan No. 45, Bandung • Telp: (022) 1234567 • Email: info@sman1taruna.sch.id",
      kepalaSekolah: "Drs. H. Mulyadi Kartawijaya, M.Pd.",
      nipKepalaSekolah: "19720815 199803 1 004",
      kota: "Bandung"
    };
    try {
      const saved = localStorage.getItem('portal_print_config');
      if (saved) {
        const parsed = JSON.parse(saved);
        printSettings = {
          provinsi: parsed.provinsi || printSettings.provinsi,
          sekolah: parsed.sekolah || printSettings.sekolah,
          alamat: parsed.alamat || printSettings.alamat,
          kepalaSekolah: parsed.kepalaSekolah || printSettings.kepalaSekolah,
          nipKepalaSekolah: parsed.nipKepalaSekolah || printSettings.nipKepalaSekolah,
          kota: parsed.kota || printSettings.kota
        };
      }
    } catch (e) {}

    const payload = {
      action: 'syncAll',
      teachers: rawTeachers.map((t: Teacher) => ({
        ...t,
        "Kelas": Array.isArray(t.classes) ? t.classes.join(", ") : "",
        "Kelas yang Diajar": Array.isArray(t.classes) ? t.classes.join(", ") : "",
        "Kelas Yang Diajar": Array.isArray(t.classes) ? t.classes.join(", ") : "",
        "Kelas yang diajar": Array.isArray(t.classes) ? t.classes.join(", ") : "",
        "kelas yang diajar": Array.isArray(t.classes) ? t.classes.join(", ") : "",
        "NIP": t.nip || "",
        "NIP / NUPTK": t.nip || "",
        "NIP/NUPTK": t.nip || "",
        "nip": t.nip || ""
      })),
      students: overrideData ? overrideData.students : students,
      attendance: rawAttendance.map((a: AttendanceRecord) => ({
        ...a,
        "Catatan": a.notes || "",
        "catatan": a.notes || ""
      })),
      journals: rawJournals.map((j: JournalRecord) => ({
        ...j,
        "Catatan KBM": j.notes || "",
        "Catatan": j.notes || "",
        "catatan": j.notes || ""
      })),
      settings: printSettings
    };

    try {
      const res = await fetch(url, {
        method: 'POST',
        mode: 'cors',
        headers: {
          'Content-Type': 'text/plain;charset=utf-8' // Crucial CORS preflight bypass for GAS
        },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      
      if (data && data.status === 'success') {
        // Update last synced time
        const syncTime = new Date().toLocaleString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit', day: '2-digit', month: 'long', year: 'numeric' });
        const updatedConfig = { ...syncConfig, lastSynced: syncTime };
        setSyncConfig(updatedConfig);
        localStorage.setItem('portal_sync_config', JSON.stringify(updatedConfig));
        
        return { success: true, message: 'Seluruh data berhasil dicadangkan ke Google Sheets!' };
      } else {
        return { success: false, message: data?.message || 'Google Sheets menolak request sinkronisasi.' };
      }
    } catch (err: any) {
      console.error(err);
      return { success: false, message: 'Gagal menghubungi server Apps Script. Pastikan Anda terhubung ke internet.' };
    }
  }, [syncConfig, teachers, students, attendanceRecords, journalRecords]);

  // Automatically trigger fetch from sheets on boot if connected
  useEffect(() => {
    if (syncConfig.mode === 'sheets' && syncConfig.appsScriptUrl) {
      loadAllDataFromSheets();
    }
  }, [syncConfig.mode, syncConfig.appsScriptUrl]);

  // --- USER INTERFACE HANDLERS ---
  
  const handleLoginSuccess = (teacher: Teacher) => {
    setCurrentTeacher(teacher);
    localStorage.setItem('portal_current_teacher', JSON.stringify(teacher));
    showNotification('success', `Selamat datang kembali, ${teacher.name}!`);
  };

  const handleLogout = () => {
    setCurrentTeacher(null);
    localStorage.removeItem('portal_current_teacher');
    setActiveMenu('dashboard');
  };

  // Add attendance record
  const handleSaveAttendance = async (record: AttendanceRecord) => {
    const updatedRecords = [record, ...attendanceRecords];
    setAttendanceRecords(updatedRecords);
    localStorage.setItem('portal_attendance', JSON.stringify(updatedRecords));

    // Optimistic Cloud Sync
    if (syncConfig.mode === 'sheets' && syncConfig.appsScriptUrl) {
      setSyncLoading(true);
      try {
        const res = await syncAllDataToSheets(syncConfig.appsScriptUrl, {
          teachers,
          students,
          attendance: updatedRecords,
          journals: journalRecords
        });
        if (res.success) {
          showNotification('success', 'Absensi disimpan dan disinkronkan ke Google Sheets.');
        } else {
          showNotification('info', 'Absensi disimpan lokal. Sync tertunda: ' + res.message);
        }
      } catch (err) {
        showNotification('info', 'Absensi disimpan lokal. Gagal sync cloud (Offline).');
      } finally {
        setSyncLoading(false);
      }
    } else {
      showNotification('success', 'Absensi berhasil disimpan ke penyimpanan lokal browser.');
    }
  };

  // Add journal record
  const handleSaveJournal = async (record: JournalRecord) => {
    const updatedJournals = [record, ...journalRecords];
    setJournalRecords(updatedJournals);
    localStorage.setItem('portal_journals', JSON.stringify(updatedJournals));

    // Optimistic Cloud Sync
    if (syncConfig.mode === 'sheets' && syncConfig.appsScriptUrl) {
      setSyncLoading(true);
      try {
        const res = await syncAllDataToSheets(syncConfig.appsScriptUrl, {
          teachers,
          students,
          attendance: attendanceRecords,
          journals: updatedJournals
        });
        if (res.success) {
          showNotification('success', 'Jurnal berhasil disimpan dan disinkronkan ke Google Sheets.');
        } else {
          showNotification('info', 'Jurnal disimpan lokal. Sync tertunda: ' + res.message);
        }
      } catch (err) {
        showNotification('info', 'Jurnal disimpan lokal. Gagal sync cloud (Offline).');
      } finally {
        setSyncLoading(false);
      }
    } else {
      showNotification('success', 'Jurnal mengajar berhasil disimpan ke penyimpanan lokal.');
    }
  };

  // Master update configuration
  const handleUpdateSyncConfig = (config: SyncConfig) => {
    setSyncConfig(config);
    localStorage.setItem('portal_sync_config', JSON.stringify(config));
    
    if (config.mode === 'sheets' && config.appsScriptUrl) {
      showNotification('info', 'Berpindah ke Mode Google Sheets. Mengimpor data...');
      loadAllDataFromSheets(config.appsScriptUrl);
    } else {
      showNotification('success', 'Mode beralih ke Demo Offline Lokal.');
    }
  };

  const handleUpdateStudents = async (newStudents: Student[]) => {
    setStudents(newStudents);
    localStorage.setItem('portal_students', JSON.stringify(newStudents));

    if (syncConfig.mode === 'sheets' && syncConfig.appsScriptUrl) {
      showNotification('info', 'Menyinkronkan data murid baru ke spreadsheet...');
      await syncAllDataToSheets(syncConfig.appsScriptUrl, {
        teachers,
        students: newStudents,
        attendance: attendanceRecords,
        journals: journalRecords
      });
    }
  };

  const handleUpdateTeachers = async (newTeachers: Teacher[]) => {
    setTeachers(newTeachers);
    localStorage.setItem('portal_teachers', JSON.stringify(newTeachers));

    if (syncConfig.mode === 'sheets' && syncConfig.appsScriptUrl) {
      showNotification('info', 'Menyinkronkan data guru baru ke spreadsheet...');
      await syncAllDataToSheets(syncConfig.appsScriptUrl, {
        teachers: newTeachers,
        students,
        attendance: attendanceRecords,
        journals: journalRecords
      });
    }
  };

  const handleUpdateClasses = (newClasses: string[]) => {
    setClasses(newClasses);
    localStorage.setItem('portal_classes', JSON.stringify(newClasses));
  };

  // Reset system back to demo mock defaults
  const handleResetData = () => {
    localStorage.removeItem('portal_teachers');
    localStorage.removeItem('portal_students');
    localStorage.removeItem('portal_classes');
    localStorage.removeItem('portal_attendance');
    localStorage.removeItem('portal_journals');
    localStorage.removeItem('portal_sync_config');

    setTeachers(DEFAULT_TEACHERS);
    setStudents(DEFAULT_STUDENTS);
    setClasses(DEFAULT_CLASSES);
    setAttendanceRecords(DEFAULT_ATTENDANCE);
    setJournalRecords(DEFAULT_JOURNALS);
    setSyncConfig({ appsScriptUrl: '', mode: 'local' });
    setActiveMenu('dashboard');
    showNotification('success', 'Seluruh data berhasil di-reset ke nilai demo.');
  };

  // --- RENDER PORTAL ---
  if (!currentTeacher) {
    return (
      <div className="bg-slate-50 min-h-screen transition-colors duration-200">
        {/* Top Floating Theme Toggle */}
        <div className="fixed top-4 right-4 z-50 flex items-center gap-2">
          <button
            onClick={() => setTheme(t => t === 'light' ? 'dark' : 'light')}
            className="p-2.5 bg-white text-slate-700 hover:bg-slate-100 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700 dark:border-slate-700 rounded-xl shadow-md border border-slate-200 flex items-center justify-center transition-all cursor-pointer"
            aria-label="Toggle Theme"
            title={theme === 'light' ? 'Aktifkan Mode Gelap' : 'Aktifkan Mode Terang'}
          >
            {theme === 'light' ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
          </button>
        </div>

        {/* Simple top slide-in notification */}
        {notification && (
          <div className="fixed top-4 left-4 right-4 sm:left-auto sm:right-4 bg-slate-900 text-white px-4 py-3 rounded-xl shadow-lg border border-slate-800 text-xs flex items-center gap-2 z-50 animate-bounce">
            <RefreshCw className="w-4 h-4 animate-spin text-emerald-500 shrink-0" />
            <span>{notification.message}</span>
          </div>
        )}
        
        <Login 
          teachers={teachers} 
          syncConfig={syncConfig} 
          onLoginSuccess={handleLoginSuccess} 
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 font-sans text-slate-800 transition-colors duration-200">
      {/* Dynamic Slide Global Notification */}
      {notification && (
        <div className="fixed top-4 left-4 right-4 sm:left-auto sm:right-4 bg-slate-900 text-white px-4 py-3 rounded-xl shadow-lg border border-slate-800 text-xs flex items-center gap-2 z-50">
          <RefreshCw className="w-4 h-4 animate-spin text-emerald-500 shrink-0" />
          <span>{notification.message}</span>
        </div>
      )}

      {/* Loading Full Backdrop overlay */}
      {initialLoading && (
        <div className="fixed inset-0 bg-slate-900/65 flex flex-col items-center justify-center text-white z-50 gap-3 backdrop-blur-sm">
          <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="font-bold text-sm">Menyinkronkan Google Sheets...</p>
          <p className="text-xs text-slate-400">Sedang mengimpor daftar siswa dan log riwayat mengajar.</p>
        </div>
      )}

      {/* --- DASHBOARD HEADER PANEL (Hidden on Print) --- */}
      <header className="print:hidden bg-slate-900 text-white border-b border-slate-800 sticky top-0 z-40 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-emerald-500 text-slate-950 font-black rounded-xl flex items-center justify-center text-xl">
                📚
              </div>
              <div>
                <h1 className="font-bold text-sm tracking-tight leading-none sm:text-base">SIKEJAR</h1>
                <p className="text-[10px] text-slate-400 mt-0.5 sm:text-xs">Sistem Kehadiran dan Jurnal Mengajar</p>
              </div>
            </div>

            {/* User Session Info / Theme / Logout Button */}
            <div className="flex items-center gap-3">
              <div className="hidden md:flex flex-col text-right">
                <span className="text-xs font-bold text-slate-100">{currentTeacher.name}</span>
                <span className="text-[10px] text-slate-400 font-medium">
                  {currentTeacher.isAdmin ? 'Akses Admin / Guru ' : 'Akses Guru '} • {currentTeacher.subject} {currentTeacher.schoolName ? `• ${currentTeacher.schoolName}` : ''}
                </span>
              </div>
              
              {/* Header Theme Toggle */}
              <button
                onClick={() => setTheme(t => t === 'light' ? 'dark' : 'light')}
                className="p-1.5 bg-slate-800 text-slate-400 hover:text-white rounded-lg transition-colors cursor-pointer"
                title={theme === 'light' ? 'Mode Gelap' : 'Mode Terang'}
              >
                {theme === 'light' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
              </button>

              <div className="p-1.5 bg-slate-800 rounded-lg text-slate-400 hover:text-white transition-colors">
                <User className="w-4 h-4" />
              </div>
              <button
                onClick={handleLogout}
                className="flex items-center gap-1 bg-rose-950/40 hover:bg-rose-900 border border-rose-900/60 text-rose-200 text-xs px-2.5 py-1.5 rounded-lg font-semibold transition-all cursor-pointer"
                title="Keluar Akun"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Keluar</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* --- APP SHELL MAIN CONTAINER --- */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 print:max-w-none print:p-0 print:m-0">
        {/* --- DUAL GRID SYSTEM: SIDEBAR CONTROLS & MAIN CONTENT --- */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* 1. SIDEBAR RAIL */}
          <aside className="print:hidden lg:col-span-3 space-y-4">
            {/* Quick Status Pill */}
            <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-500">Database Sekunder:</span>
              <span className="flex items-center gap-1 font-bold">
                {syncConfig.mode === 'sheets' ? (
                  <>
                    <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
                    <span className="text-emerald-700">Google Sheets Connected</span>
                  </>
                ) : (
                  <>
                    <span className="w-2 h-2 bg-amber-500 rounded-full"></span>
                    <span className="text-amber-700">Offline (Demo Lokal)</span>
                  </>
                )}
              </span>
            </div>

            {/* Sidebar navigation list */}
            <nav className="bg-white border border-slate-200 rounded-2xl p-3.5 shadow-sm space-y-1">
              <button
                onClick={() => setActiveMenu('dashboard')}
                className={`w-full flex items-center justify-between px-3.5 py-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  activeMenu === 'dashboard'
                    ? 'bg-slate-900 text-white shadow-md'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                <span className="flex items-center gap-2">
                  <BarChart2 className="w-4 h-4" /> Rekapitulasi & Statistik
                </span>
                <ChevronRight className="w-3.5 h-3.5 opacity-60" />
              </button>

              <button
                onClick={() => setActiveMenu('attendance')}
                className={`w-full flex items-center justify-between px-3.5 py-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  activeMenu === 'attendance'
                    ? 'bg-slate-900 text-white shadow-md'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                <span className="flex items-center gap-2">
                  <Users className="w-4 h-4" /> Input Presensi Siswa
                </span>
                <ChevronRight className="w-3.5 h-3.5 opacity-60" />
              </button>

              <button
                onClick={() => setActiveMenu('journal')}
                className={`w-full flex items-center justify-between px-3.5 py-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  activeMenu === 'journal'
                    ? 'bg-slate-900 text-white shadow-md'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                <span className="flex items-center gap-2">
                  <BookOpen className="w-4 h-4" /> Jurnal Mengajar Guru
                </span>
                <ChevronRight className="w-3.5 h-3.5 opacity-60" />
              </button>

              {currentTeacher.isAdmin && (
                <>
                  <button
                    onClick={() => setActiveMenu('settings')}
                    className={`w-full flex items-center justify-between px-3.5 py-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      activeMenu === 'settings'
                        ? 'bg-slate-900 text-white shadow-md'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      <SettingsIcon className="w-4 h-4" /> Pengaturan & Master
                    </span>
                    <ChevronRight className="w-3.5 h-3.5 opacity-60" />
                  </button>

                  <button
                    onClick={() => setActiveMenu('guide')}
                    className={`w-full flex items-center justify-between px-3.5 py-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      activeMenu === 'guide'
                        ? 'bg-slate-900 text-white shadow-md'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      <HelpCircle className="w-4 h-4" /> Panduan Spreadsheet
                    </span>
                    <ChevronRight className="w-3.5 h-3.5 opacity-60" />
                  </button>
                </>
              )}
            </nav>

            {/* Quick Helper Profile info */}
            <div className="bg-slate-800 text-slate-300 border border-slate-700 rounded-2xl p-4 shadow-sm text-xs space-y-2">
              <p className="font-bold text-slate-100 flex items-center gap-1.5 border-b border-slate-700 pb-1.5">
                <GraduationCap className="w-4 h-4 text-emerald-400" /> Profil Pengajar
              </p>
              <p><strong className="text-slate-400">Nama:</strong> {currentTeacher.name}</p>
              <p><strong className="text-slate-400">Username:</strong> <code className="bg-slate-900 px-1 py-0.5 rounded text-emerald-400 font-mono font-medium">{currentTeacher.username}</code></p>
              <p><strong className="text-slate-400">NIP/NUPTK:</strong> {currentTeacher.nip || '-'}</p>
              <p><strong className="text-slate-400">Mata Pelajaran:</strong> {currentTeacher.subject}</p>
              <p><strong className="text-slate-400">Sekolah:</strong> {currentTeacher.schoolName || '-'}</p>
              <p><strong className="text-slate-400">Status Akun:</strong> {currentTeacher.isAdmin ? 'Administrator' : 'Guru Pengajar'}</p>
            </div>
          </aside>

          {/* 2. MAIN ACTIVE VIEW PORTAL */}
          <main className="lg:col-span-9 space-y-6">
            {activeMenu === 'dashboard' && (
              <RecapDashboard 
                students={students}
                attendanceRecords={attendanceRecords}
                journalRecords={journalRecords}
                teachers={teachers}
                currentTeacher={currentTeacher}
                classes={classes}
              />
            )}

            {activeMenu === 'attendance' && (
              <div className="print:hidden">
                <AttendanceForm 
                  students={students}
                  currentTeacher={currentTeacher}
                  classes={classes}
                  onSave={handleSaveAttendance}
                  isLoading={syncLoading}
                />
              </div>
            )}

            {activeMenu === 'journal' && (
              <div className="print:hidden">
                <JournalForm 
                  currentTeacher={currentTeacher}
                  classes={classes}
                  onSave={handleSaveJournal}
                  isLoading={syncLoading}
                />
              </div>
            )}

            {activeMenu === 'settings' && currentTeacher.isAdmin && (
              <div className="print:hidden">
                <Settings 
                  syncConfig={syncConfig}
                  onUpdateSyncConfig={handleUpdateSyncConfig}
                  students={students}
                  onUpdateStudents={handleUpdateStudents}
                  teachers={teachers}
                  onUpdateTeachers={handleUpdateTeachers}
                  classes={classes}
                  onUpdateClasses={handleUpdateClasses}
                  onSyncAllData={syncAllDataToSheets}
                  onResetData={handleResetData}
                  currentTeacher={currentTeacher}
                />
              </div>
            )}

            {activeMenu === 'guide' && currentTeacher.isAdmin && (
              <div className="print:hidden space-y-4">
                <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
                  <h2 className="text-lg font-bold text-slate-800 mb-2">Panduan Integrasi Spreadsheet</h2>
                  <p className="text-xs sm:text-sm text-slate-500 leading-relaxed">
                    Sistem ini terintegrasi penuh secara asinkron (optimis) dengan Google Spreadsheet. 
                    Anda dapat menyalin seluruh kode skrip di bawah, menempelkannya pada lembar Apps Script Spreadsheet Anda, dan langsung meluncurkan sistem cloud mandiri secara gratis!
                  </p>
                </div>
                <AppsScriptGuide />
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}
