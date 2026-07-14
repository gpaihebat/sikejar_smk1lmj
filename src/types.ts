export interface Student {
  id: string; // Nomor Induk Siswa (NIS)
  name: string; // Nama Lengkap Siswa
  className: string; // Kelas (e.g. "X-A", "XI-IPA-1")
  gender: 'L' | 'P'; // Laki-laki / Perempuan
}

export interface Teacher {
  username: string; // Username untuk login
  name: string; // Nama lengkap guru beserta gelar
  subject: string; // Mata pelajaran utama yang diampu
  schoolName: string; // Nama sekolah
  classes: string[]; // Daftar kelas yang diajar oleh guru
  isAdmin: boolean; // Status Admin (dapat mengelola data master)
  nip?: string; // NIP atau NUPTK guru
}

export type AttendanceStatus = 'H' | 'S' | 'I' | 'A'; // Hadir, Sakit, Izin, Alpa

export interface AttendanceRecord {
  id: string; // ID unik record (e.g. ATT-12345678)
  date: string; // Tanggal (YYYY-MM-DD)
  className: string; // Kelas
  session: string; // Jam ke (e.g. "1-2", "3-4", "5-6")
  subject: string; // Mata Pelajaran
  teacherUsername: string; // Username guru pengajar
  teacherName: string; // Nama guru pengajar
  attendance: Record<string, AttendanceStatus>; // Map dari StudentID (id) ke Status Kehadiran
  notes?: string; // Catatan tambahan kehadiran
}

export interface JournalRecord {
  id: string; // ID unik record (e.g. JUR-12345678)
  date: string; // Tanggal (YYYY-MM-DD)
  className: string; // Kelas
  session: string; // Jam ke (e.g. "1-2", "3-4", "5-6")
  subject: string; // Mata Pelajaran
  teacherUsername: string; // Username guru
  teacherName: string; // Nama guru
  topic: string; // Materi Pokok yang diajarkan
  media: string; // Media Pembelajaran yang digunakan
  notes: string; // Catatan KBM / Hambatan / Kejadian Penting
}

export interface SyncConfig {
  appsScriptUrl: string; // URL Web App Google Apps Script
  mode: 'local' | 'sheets'; // Mode penyimpanan
  lastSynced?: string; // Waktu terakhir sinkronisasi sukses
}

export interface DashboardStats {
  totalStudents: number;
  totalTeachers: number;
  attendanceRate: number; // Persentase kehadiran rata-rata
  totalJournals: number;
  statusSummary: {
    H: number; // Total Hadir
    S: number; // Total Sakit
    I: number; // Total Izin
    A: number; // Total Alpa
  };
}
