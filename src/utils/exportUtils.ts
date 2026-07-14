import { Student, AttendanceRecord, JournalRecord, AttendanceStatus } from '../types';

/**
 * Utility to trigger download of a generated file
 */
export function downloadFile(content: string, filename: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Exports Journal data to Excel-compatible CSV format
 */
export function exportJournalsToCSV(journals: JournalRecord[], filename: string = 'Jurnal_Mengajar.csv') {
  // UTF-8 BOM to ensure Excel opens it correctly
  const BOM = '\uFEFF';
  
  const headers = ['ID Jurnal', 'Tanggal', 'Kelas', 'Jam Ke', 'Mata Pelajaran', 'Nama Guru', 'Materi Pokok', 'Media Pembelajaran', 'Catatan KBM'];
  
  const rows = journals.map(j => [
    j.id,
    j.date,
    j.className,
    j.session,
    j.subject,
    j.teacherName,
    j.topic,
    j.media,
    j.notes
  ]);
  
  const csvContent = [headers, ...rows]
    .map(row => row.map(val => `"${String(val).replace(/"/g, '""')}"`).join(','))
    .join('\n');
    
  downloadFile(BOM + csvContent, filename, 'text/csv;charset=utf-8;');
}

/**
 * Exports Attendance Recap Matrix to Excel-compatible CSV format
 */
export function exportAttendanceToCSV(
  students: Student[],
  records: AttendanceRecord[],
  className: string,
  monthYearStr: string, // e.g. "2026-07"
  filename: string = 'Rekap_Kehadiran.csv'
) {
  const BOM = '\uFEFF';
  
  // Filter records for this class and month
  const classRecords = records
    .filter(r => r.className === className && r.date.startsWith(monthYearStr))
    .sort((a, b) => a.date.localeCompare(b.date));
    
  // Extract unique dates
  const dates = Array.from(new Set(classRecords.map(r => r.date))).sort();
  
  // Headers: NIS, Nama, Gender, [Dates...], H, S, I, A, % Kehadiran
  const headers = ['NIS', 'Nama Siswa', 'L/P', ...dates.map(d => d.split('-')[2]), 'Hadir', 'Sakit', 'Izin', 'Alpa', '% Kehadiran'];
  
  // Rows
  const rows = students
    .filter(s => s.className === className)
    .map(student => {
      let h = 0, s = 0, i = 0, a = 0;
      
      const dailyStatuses = dates.map(date => {
        // Find if student has a recorded status for this date
        const dayRecord = classRecords.find(r => r.date === date);
        const status = dayRecord?.attendance[student.id] || '';
        
        if (status === 'H') h++;
        else if (status === 'S') s++;
        else if (status === 'I') i++;
        else if (status === 'A') a++;
        
        return status;
      });
      
      const totalDays = h + s + i + a;
      const rate = totalDays > 0 ? Math.round(((h + s + i) / totalDays) * 100) : 100;
      
      return [
        student.id,
        student.name,
        student.gender,
        ...dailyStatuses,
        h,
        s,
        i,
        a,
        `${rate}%`
      ];
    });
    
  const csvContent = [headers, ...rows]
    .map(row => row.map(val => `"${String(val).replace(/"/g, '""')}"`).join(','))
    .join('\n');
    
  downloadFile(BOM + csvContent, filename, 'text/csv;charset=utf-8;');
}

/**
 * Helper to display human-readable attendance label
 */
export function getStatusLabel(status: AttendanceStatus | ''): string {
  switch (status) {
    case 'H': return 'Hadir';
    case 'S': return 'Sakit';
    case 'I': return 'Izin';
    case 'A': return 'Alpa';
    default: return '-';
  }
}
