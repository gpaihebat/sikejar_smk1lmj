import { Student, Teacher, AttendanceRecord, JournalRecord } from '../types';

export const DEFAULT_CLASSES = ['X-A', 'X-B', 'XI-MIPA-1', 'XI-MIPA-2', 'XII-IPS-1', 'XII-IPS-2'];

export const DEFAULT_SUBJECTS = [
  'Matematika',
  'Fisika',
  'Kimia',
  'Biologi',
  'Bahasa Indonesia',
  'Bahasa Inggris',
  'Sejarah',
  'Pendidikan Pancasila',
  'Seni Budaya',
  'PJOK'
];

export const DEFAULT_SESSIONS = [
  'Jam Ke-1', 'Jam Ke-2', 'Jam Ke-3', 'Jam Ke-4', 'Jam Ke-5', 'Jam Ke-6', 'Jam Ke-7', 'Jam Ke-8',
  'Jam Ke-1-2', 'Jam Ke-3-4', 'Jam Ke-5-6', 'Jam Ke-7-8'
];

export const DEFAULT_TEACHERS: Teacher[] = [
  { username: 'admin', name: 'Drs. H. Ahmad Fauzi, M.Pd.', subject: 'Matematika', schoolName: 'SMA Negeri 1 Taruna', classes: ['X-A', 'X-B', 'XI-MIPA-1', 'XI-MIPA-2', 'XII-IPS-1', 'XII-IPS-2'], isAdmin: true, nip: '19750412 200312 1 002' },
  { username: 'budi', name: 'Budi Santoso, S.Pd.', subject: 'Fisika', schoolName: 'SMA Negeri 1 Taruna', classes: ['XI-MIPA-1', 'XI-MIPA-2'], isAdmin: false, nip: '19820305 200904 1 003' },
  { username: 'siti', name: 'Siti Rahmawati, S.Pd.I.', subject: 'Bahasa Inggris', schoolName: 'SMA Negeri 1 Taruna', classes: ['X-A', 'X-B'], isAdmin: false, nip: '19881121 201503 2 001' },
  { username: 'dewi', name: 'Dewi Lestari, S.Si.', subject: 'Biologi', schoolName: 'SMA Negeri 1 Taruna', classes: ['XI-MIPA-2', 'XII-IPS-1'], isAdmin: false, nip: '19850914 201101 2 004' },
  { username: 'eko', name: 'Eko Prasetyo, S.Pd.', subject: 'PJOK', schoolName: 'SMA Negeri 1 Taruna', classes: ['X-B', 'XII-IPS-2'], isAdmin: false, nip: '19900228 202012 1 005' }
];

export const DEFAULT_STUDENTS: Student[] = [
  // Class X-A
  { id: '1001', name: 'Aditya Pratama', className: 'X-A', gender: 'L' },
  { id: '1002', name: 'Amanda Putri', className: 'X-A', gender: 'P' },
  { id: '1003', name: 'Bagus Wijaya', className: 'X-A', gender: 'L' },
  { id: '1004', name: 'Citra Kirana', className: 'X-A', gender: 'P' },
  { id: '1005', name: 'Dafa Ramadan', className: 'X-A', gender: 'L' },
  { id: '1006', name: 'Elsa Mayori', className: 'X-A', gender: 'P' },
  
  // Class X-B
  { id: '1011', name: 'Farhan Alatas', className: 'X-B', gender: 'L' },
  { id: '1012', name: 'Gisella Anastasia', className: 'X-B', gender: 'P' },
  { id: '1013', name: 'Hendra Setiawan', className: 'X-B', gender: 'L' },
  { id: '1014', name: 'Indah Permatasari', className: 'X-B', gender: 'P' },
  
  // Class XI-MIPA-1
  { id: '1101', name: 'Joko Susilo', className: 'XI-MIPA-1', gender: 'L' },
  { id: '1102', name: 'Kartika Sari', className: 'XI-MIPA-1', gender: 'P' },
  { id: '1103', name: 'Lukman Hakim', className: 'XI-MIPA-1', gender: 'L' },
  { id: '1104', name: 'Nadia Syafira', className: 'XI-MIPA-1', gender: 'P' },
  { id: '1105', name: 'Oki Setiana', className: 'XI-MIPA-1', gender: 'P' },
  
  // Class XI-MIPA-2
  { id: '1111', name: 'Putra Siregar', className: 'XI-MIPA-2', gender: 'L' },
  { id: '1112', name: 'Rania Salsabila', className: 'XI-MIPA-2', gender: 'P' },
  { id: '1113', name: 'Sandiaga Uno', className: 'XI-MIPA-2', gender: 'L' },
  
  // Class XII-IPS-1
  { id: '1201', name: 'Taufik Hidayat', className: 'XII-IPS-1', gender: 'L' },
  { id: '1202', name: 'Ulya Rahma', className: 'XII-IPS-1', gender: 'P' },
  { id: '1203', name: 'Vicky Prasetyo', className: 'XII-IPS-1', gender: 'L' },
  
  // Class XII-IPS-2
  { id: '1211', name: 'Wahyu Hidayat', className: 'XII-IPS-2', gender: 'L' },
  { id: '1212', name: 'Yulia Ningsih', className: 'XII-IPS-2', gender: 'P' },
  { id: '1213', name: 'Zulkifli Hasan', className: 'XII-IPS-2', gender: 'L' }
];

// Helper to generate dates relative to current date (e.g. 2026-07-11)
const getDateOffset = (offsetDays: number): string => {
  const d = new Date('2026-07-11T12:00:00');
  d.setDate(d.getDate() - offsetDays);
  return d.toISOString().split('T')[0];
};

export const DEFAULT_ATTENDANCE: AttendanceRecord[] = [
  {
    id: 'ATT-2026071101',
    date: getDateOffset(0), // Today (2026-07-11)
    className: 'X-A',
    session: 'Jam Ke-1-2',
    subject: 'Matematika',
    teacherUsername: 'admin',
    teacherName: 'Drs. H. Ahmad Fauzi, M.Pd.',
    attendance: {
      '1001': 'H',
      '1002': 'H',
      '1003': 'S',
      '1004': 'H',
      '1005': 'I',
      '1006': 'H'
    },
    notes: 'KBM berjalan lancar, Bagus Wijaya mengirimkan surat dokter, Dafa izin ada urusan keluarga.'
  },
  {
    id: 'ATT-2026071102',
    date: getDateOffset(0),
    className: 'XI-MIPA-1',
    session: 'Jam Ke-3-4',
    subject: 'Fisika',
    teacherUsername: 'budi',
    teacherName: 'Budi Santoso, S.Pd.',
    attendance: {
      '1101': 'H',
      '1102': 'H',
      '1103': 'H',
      '1104': 'A',
      '1105': 'H'
    },
    notes: 'Nadia Syafira absen tanpa keterangan.'
  },
  {
    id: 'ATT-2026071001',
    date: getDateOffset(1), // Yesterday
    className: 'X-A',
    session: 'Jam Ke-3-4',
    subject: 'Bahasa Inggris',
    teacherUsername: 'siti',
    teacherName: 'Siti Rahmawati, S.Pd.I.',
    attendance: {
      '1001': 'H',
      '1002': 'H',
      '1003': 'H',
      '1004': 'H',
      '1005': 'H',
      '1006': 'I'
    },
    notes: 'Elsa Mayori izin mewakili sekolah lomba tari.'
  },
  {
    id: 'ATT-2026071002',
    date: getDateOffset(1),
    className: 'XII-IPS-1',
    session: 'Jam Ke-5-6',
    subject: 'Biologi',
    teacherUsername: 'dewi',
    teacherName: 'Dewi Lestari, S.Si.',
    attendance: {
      '1201': 'H',
      '1202': 'H',
      '1203': 'S'
    },
    notes: 'Vicky Prasetyo izin sakit flu.'
  },
  {
    id: 'ATT-2026070901',
    date: getDateOffset(2), // 2 days ago
    className: 'X-B',
    session: 'Jam Ke-1-2',
    subject: 'PJOK',
    teacherUsername: 'eko',
    teacherName: 'Eko Prasetyo, S.Pd.',
    attendance: {
      '1011': 'H',
      '1012': 'H',
      '1013': 'H',
      '1014': 'H'
    },
    notes: 'Praktik senam lantai di lapangan.'
  },
  {
    id: 'ATT-2026070801',
    date: getDateOffset(3), // 3 days ago
    className: 'XI-MIPA-2',
    session: 'Jam Ke-5-6',
    subject: 'Biologi',
    teacherUsername: 'dewi',
    teacherName: 'Dewi Lestari, S.Si.',
    attendance: {
      '1111': 'H',
      '1112': 'I',
      '1113': 'H'
    },
    notes: 'Rania izin dispensasi OSIS.'
  }
];

export const DEFAULT_JOURNALS: JournalRecord[] = [
  {
    id: 'JUR-2026071101',
    date: getDateOffset(0), // Today
    className: 'X-A',
    session: 'Jam Ke-1-2',
    subject: 'Matematika',
    teacherUsername: 'admin',
    teacherName: 'Drs. H. Ahmad Fauzi, M.Pd.',
    topic: 'Sistem Persamaan Linear Tiga Variabel (SPLTV)',
    media: 'Papan Tulis, Proyektor, Google Slides',
    notes: 'Penjelasan konsep dasar SPLTV dengan metode eliminasi-substitusi. Siswa mengerjakan latihan di buku tugas.'
  },
  {
    id: 'JUR-2026071102',
    date: getDateOffset(0),
    className: 'XI-MIPA-1',
    session: 'Jam Ke-3-4',
    subject: 'Fisika',
    teacherUsername: 'budi',
    teacherName: 'Budi Santoso, S.Pd.',
    topic: 'Hukum Newton tentang Gravitasi',
    media: 'Buku Paket, Simulasi PhET (Virtual Lab)',
    notes: 'Siswa antusias mengamati simulasi gaya tarik antar planet. Menugaskan pembuatan laporan singkat percobaan PhET.'
  },
  {
    id: 'JUR-2026071001',
    date: getDateOffset(1), // Yesterday
    className: 'X-A',
    session: 'Jam Ke-3-4',
    subject: 'Bahasa Inggris',
    teacherUsername: 'siti',
    teacherName: 'Siti Rahmawati, S.Pd.I.',
    topic: 'Introducing Oneself and Others',
    media: 'Flashcard, YouTube Video, Speaker',
    notes: 'Siswa mempraktikkan percakapan perkenalan di depan kelas secara berpasangan. Sangat percaya diri.'
  },
  {
    id: 'JUR-2026071002',
    date: getDateOffset(1),
    className: 'XII-IPS-1',
    session: 'Jam Ke-5-6',
    subject: 'Biologi',
    teacherUsername: 'dewi',
    teacherName: 'Dewi Lestari, S.Si.',
    topic: 'Metabolisme Sel: Enzim',
    media: 'Slide Presentasi, Video Animasi',
    notes: 'Diskusi mengenai faktor yang mempengaruhi kerja enzim. Penugasan dikerjakan via Google Classroom.'
  },
  {
    id: 'JUR-2026070901',
    date: getDateOffset(2),
    className: 'X-B',
    session: 'Jam Ke-1-2',
    subject: 'PJOK',
    teacherUsername: 'eko',
    teacherName: 'Eko Prasetyo, S.Pd.',
    topic: 'Senam Lantai: Roll Depan & Roll Belakang',
    media: 'Matras senam, Peluit',
    notes: 'Praktik di aula. Sebagian besar siswa dapat melakukan roll depan dengan baik, namun ada 2 siswa yang masih butuh bantuan.'
  }
];
