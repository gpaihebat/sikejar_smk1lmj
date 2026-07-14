import React, { useState } from 'react';
import { Copy, Check, ChevronDown, ChevronUp, Database, FileSpreadsheet, Eye, EyeOff } from 'lucide-react';

export default function AppsScriptGuide() {
  const [copied, setCopied] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  const appsScriptCode = `/**
 * GOOGLE APPS SCRIPT DATABASE BACKEND FOR PRESENSI & JURNAL GURU
 * 
 * Petunjuk Instalasi:
 * 1. Buka Google Sheets (buat spreadsheet baru).
 * 2. Klik menu "Ekstensi" -> "Apps Script".
 * 3. Hapus kode bawaan, lalu paste seluruh kode di bawah ini.
 * 4. Jalankan fungsi 'setupActiveSpreadsheet' dengan mengklik tombol "Run" untuk membuat sheet otomatis.
 * 5. Klik tombol "Terapkan" (Deploy) -> "Penerapan baru" (New deployment).
 * 6. Pilih jenis: "Aplikasi Web" (Web app).
 * 7. Konfigurasi:
 *    - Deskripsi: Database Presensi dan Jurnal Guru
 *    - Jalankan sebagai (Execute as): Saya (Me / Email Anda)
 *    - Siapa yang memiliki akses (Who has access): Siapa saja (Anyone)
 * 8. Klik "Terapkan", setujui izin (Authorize) jika diminta.
 * 9. Salin "URL Aplikasi Web" (Web App URL) yang dihasilkan, lalu masukkan ke Pengaturan aplikasi ini.
 */

function setupActiveSpreadsheet() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  
  // 1. Buat Sheet Guru (Data Master Guru) jika belum ada
  var sheetGuru = ss.getSheetByName("Guru");
  if (!sheetGuru) {
    sheetGuru = ss.insertSheet("Guru");
    sheetGuru.appendRow(["Username", "Nama Lengkap", "Mata Pelajaran", "Nama Sekolah", "Kelas", "isAdmin", "NIP"]);
    sheetGuru.appendRow(["admin", "Drs. H. Ahmad Fauzi, M.Pd.", "Matematika", "SMA Negeri 1 Taruna", "X-A, X-B, XI-MIPA-1, XI-MIPA-2, XII-IPS-1, XII-IPS-2", "TRUE", "19750412 200312 1 002"]);
    sheetGuru.appendRow(["budi", "Budi Santoso, S.Pd.", "Fisika", "SMA Negeri 1 Taruna", "XI-MIPA-1, XI-MIPA-2", "FALSE", "19820305 200904 1 003"]);
    sheetGuru.appendRow(["siti", "Siti Rahmawati, S.Pd.I.", "Bahasa Inggris", "SMA Negeri 1 Taruna", "X-A, X-B", "FALSE", "19881121 201503 2 001"]);
    sheetGuru.appendRow(["dewi", "Dewi Lestari, S.Si.", "Biologi", "SMA Negeri 1 Taruna", "XI-MIPA-2, XII-IPS-1", "FALSE", "19850914 201101 2 004"]);
    sheetGuru.appendRow(["eko", "Eko Prasetyo, S.Pd.", "PJOK", "SMA Negeri 1 Taruna", "X-B, XII-IPS-2", "FALSE", "19900228 202012 1 005"]);
    SpreadsheetApp.getActiveSpreadsheet().toast("Sheet Guru berhasil dibuat!", "Setup");
  }
  
  // 2. Buat Sheet Siswa (Data Master Siswa) jika belum ada
  var sheetSiswa = ss.getSheetByName("Siswa");
  if (!sheetSiswa) {
    sheetSiswa = ss.insertSheet("Siswa");
    sheetSiswa.appendRow(["NIS", "Nama Lengkap", "Kelas", "L/P"]);
    var defaultStudents = [
      ["1001", "Aditya Pratama", "X-A", "L"],
      ["1002", "Amanda Putri", "X-A", "P"],
      ["1003", "Bagus Wijaya", "X-A", "L"],
      ["1004", "Citra Kirana", "X-A", "P"],
      ["1005", "Dafa Ramadan", "X-A", "L"],
      ["1006", "Elsa Mayori", "X-A", "P"],
      ["1011", "Farhan Alatas", "X-B", "L"],
      ["1012", "Gisella Anastasia", "X-B", "P"],
      ["1101", "Joko Susilo", "XI-MIPA-1", "L"],
      ["1102", "Kartika Sari", "XI-MIPA-1", "P"],
      ["1201", "Taufik Hidayat", "XII-IPS-1", "L"],
      ["1202", "Ulya Rahma", "XII-IPS-1", "P"]
    ];
    defaultStudents.forEach(function(row) {
      sheetSiswa.appendRow(row);
    });
    SpreadsheetApp.getActiveSpreadsheet().toast("Sheet Siswa berhasil dibuat!", "Setup");
  }
  
  // 3. Buat Sheet Presensi jika belum ada
  var sheetPresensi = ss.getSheetByName("Presensi");
  if (!sheetPresensi) {
    sheetPresensi = ss.insertSheet("Presensi");
    sheetPresensi.appendRow(["ID Presensi", "Tanggal", "Kelas", "Jam Ke", "Mata Pelajaran", "Guru Pengampu", "Kehadiran (JSON)", "Catatan"]);
    SpreadsheetApp.getActiveSpreadsheet().toast("Sheet Presensi berhasil dibuat!", "Setup");
  }
  
  // 4. Buat Sheet Jurnal jika belum ada
  var sheetJurnal = ss.getSheetByName("Jurnal");
  if (!sheetJurnal) {
    sheetJurnal = ss.insertSheet("Jurnal");
    sheetJurnal.appendRow(["ID Jurnal", "Tanggal", "Kelas", "Jam Ke", "Mata Pelajaran", "Nama Guru", "Materi Pokok", "Media Pembelajaran", "Catatan KBM"]);
    SpreadsheetApp.getActiveSpreadsheet().toast("Sheet Jurnal berhasil dibuat!", "Setup");
  }

  // 5. Buat Sheet Pengaturan jika belum ada (Kop Surat & Tanda Tangan PDF)
  var sheetPengaturan = ss.getSheetByName("Pengaturan");
  if (!sheetPengaturan) {
    sheetPengaturan = ss.insertSheet("Pengaturan");
    sheetPengaturan.appendRow(["Kunci", "Nilai"]);
    sheetPengaturan.appendRow(["provinsi", "PEMERINTAH PROVINSI JAWA BARAT"]);
    sheetPengaturan.appendRow(["sekolah", "SMA NEGERI 1 TARUNA"]);
    sheetPengaturan.appendRow(["alamat", "Jl. Pendidikan No. 45, Bandung • Telp: (022) 1234567 • Email: info@sman1taruna.sch.id"]);
    sheetPengaturan.appendRow(["kepalaSekolah", "Drs. H. Mulyadi Kartawijaya, M.Pd."]);
    sheetPengaturan.appendRow(["nipKepalaSekolah", "19720815 199803 1 004"]);
    sheetPengaturan.appendRow(["kota", "Bandung"]);
    SpreadsheetApp.getActiveSpreadsheet().toast("Sheet Pengaturan berhasil dibuat!", "Setup");
  }
}

// Menangani permintaan GET (Membaca data)
function doGet(e) {
  var action = e.parameter.action;
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  
  try {
    if (action === "test") {
      return jsonResponse({ status: "success", message: "Koneksi ke Spreadsheet sukses!" });
    }
    
    if (action === "loadAll") {
      var teachers = readSheetData(ss.getSheetByName("Guru"));
      var students = readSheetData(ss.getSheetByName("Siswa"));
      var attendance = readSheetData(ss.getSheetByName("Presensi"));
      var journals = readSheetData(ss.getSheetByName("Jurnal"));
      
      // Membaca pengaturan kop & tanda tangan dari sheet Pengaturan
      var settings = {};
      var sheetPengaturan = ss.getSheetByName("Pengaturan");
      if (sheetPengaturan) {
        var rowsSettings = sheetPengaturan.getDataRange().getValues();
        for (var k = 1; k < rowsSettings.length; k++) {
          var key = rowsSettings[k][0].toString().trim();
          var val = rowsSettings[k][1].toString().trim();
          if (key) {
            settings[key] = val;
          }
        }
      }
      
      return jsonResponse({
        status: "success",
        teachers: teachers,
        students: students,
        attendance: attendance,
        journals: journals,
        settings: settings
      });
    }
    
    return jsonResponse({ status: "error", message: "Aksi tidak dikenali." });
  } catch (err) {
    return jsonResponse({ status: "error", message: err.toString() });
  }
}

// Menangani permintaan POST (Menyimpan data)
function doPost(e) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  
  try {
    if (!e.postData || !e.postData.contents) {
      return jsonResponse({ status: "error", message: "Payload tidak ditemukan." });
    }
    
    var payload = JSON.parse(e.postData.contents);
    var action = payload.action;
    
    if (action === "syncAll") {
      // Sinkronisasi data dari aplikasi ke Google Sheets (Dinamis: mencocokkan header kolom!)
      if (payload.teachers) overwriteSheet(ss.getSheetByName("Guru"), ["Username", "Nama Lengkap", "Mata Pelajaran", "Nama Sekolah", "Kelas", "isAdmin"], payload.teachers, "teacher");
      if (payload.students) overwriteSheet(ss.getSheetByName("Siswa"), ["NIS", "Nama Lengkap", "Kelas", "L/P"], payload.students, "student");
      if (payload.attendance) overwriteSheet(ss.getSheetByName("Presensi"), ["ID Presensi", "Tanggal", "Kelas", "Jam Ke", "Mata Pelajaran", "Guru Pengampu", "Kehadiran (JSON)", "Catatan"], payload.attendance, "attendance");
      if (payload.journals) overwriteSheet(ss.getSheetByName("Jurnal"), ["ID Jurnal", "Tanggal", "Kelas", "Jam Ke", "Mata Pelajaran", "Nama Guru", "Materi Pokok", "Media Pembelajaran", "Catatan KBM"], payload.journals, "journal");
      
      // Menyimpan pengaturan kop & tanda tangan ke sheet Pengaturan
      if (payload.settings) {
        var sheetPengaturan = ss.getSheetByName("Pengaturan");
        if (!sheetPengaturan) {
          sheetPengaturan = ss.insertSheet("Pengaturan");
          sheetPengaturan.appendRow(["Kunci", "Nilai"]);
        }
        if (sheetPengaturan.getLastRow() > 1) {
          sheetPengaturan.deleteRows(2, sheetPengaturan.getLastRow() - 1);
        } else if (sheetPengaturan.getLastRow() === 0) {
          sheetPengaturan.appendRow(["Kunci", "Nilai"]);
        }
        var keys = Object.keys(payload.settings);
        var rowsToWrite = [];
        keys.forEach(function(key) {
          rowsToWrite.push([key, payload.settings[key]]);
        });
        if (rowsToWrite.length > 0) {
          sheetPengaturan.getRange(2, 1, rowsToWrite.length, 2).setValues(rowsToWrite);
        }
      }
      
      return jsonResponse({ status: "success", message: "Sinkronisasi berhasil diselesaikan!" });
    }
    
    return jsonResponse({ status: "error", message: "Aksi post tidak dikenali." });
  } catch (err) {
    return jsonResponse({ status: "error", message: err.toString() });
  }
}

// Helper membaca seluruh baris data di sheet (Sangat dinamis berdasarkan nama kolom!)
function readSheetData(sheet) {
  if (!sheet) return [];
  var rows = sheet.getDataRange().getValues();
  if (rows.length <= 1) return []; // Hanya header
  
  var headers = rows[0];
  var data = [];
  
  for (var i = 1; i < rows.length; i++) {
    var row = rows[i];
    var obj = {};
    for (var j = 0; j < headers.length; j++) {
      var headerName = headers[j].toString().trim();
      if (!headerName) continue;
      var val = row[j];
      
      // Khusus konversi tipe data boolean
      if (val === "TRUE" || val === "true" || val === true) val = true;
      if (val === "FALSE" || val === "false" || val === false) val = false;
      
      obj[headerName] = val;
    }
    data.push(obj);
  }
  return data;
}

// Helper pintar menimpa isi sheet dengan mencocokkan nama header secara dinamis!
// Anda bebas menambah kolom baru atau memindahkan urutan kolom di Spreadsheet!
function overwriteSheet(sheet, defaultHeaders, dataArray, type) {
  if (!sheet) return;
  
  // Baca susunan kolom saat ini agar tidak merusak urutan/kolom kustom yang dibuat user
  var headers = defaultHeaders;
  var existingRange = sheet.getDataRange();
  if (existingRange && existingRange.getNumRows() >= 1) {
    var firstRow = existingRange.getValues()[0];
    if (firstRow && firstRow.length > 0 && firstRow[0].toString().trim() !== "") {
      headers = firstRow.map(function(h) { return h.toString().trim(); }).filter(Boolean);
    }
  }
  
  // Bersihkan data lama di bawah baris header
  if (sheet.getLastRow() > 1) {
    sheet.deleteRows(2, sheet.getLastRow() - 1);
  } else if (sheet.getLastRow() === 0) {
    sheet.appendRow(headers);
  }
  
  if (dataArray.length === 0) return;
  
  // Petakan array objek ke susunan baris sesuai header kolom
  var newRows = [];
  dataArray.forEach(function(item) {
    var row = [];
    headers.forEach(function(header) {
      var val = "";
      if (type === "teacher") {
        if (header === "Username") val = item.username || "";
        else if (header === "Nama Lengkap") val = item.name || "";
        else if (header === "Mata Pelajaran") val = item.subject || "";
        else if (header === "Nama Sekolah") val = item.schoolName || "";
        else if (header === "Kelas" || header === "Kelas yang Diajar" || header === "Kelas Yang Diajar" || header === "Kelas yang diajar" || header === "kelas yang diajar") val = Array.isArray(item.classes) ? item.classes.join(", ") : "";
        else if (header === "isAdmin") val = item.isAdmin ? "TRUE" : "FALSE";
        else if (header === "NIP" || header === "NIP / NUPTK" || header === "NIP/NUPTK" || header === "nip") val = item.nip || "";
        else val = item[header] !== undefined ? item[header] : "";
      } else if (type === "student") {
        if (header === "NIS") val = item.id || "";
        else if (header === "Nama Lengkap") val = item.name || "";
        else if (header === "Kelas") val = item.className || "";
        else if (header === "L/P") val = item.gender || "L";
        else val = item[header] !== undefined ? item[header] : "";
      } else if (type === "attendance") {
        if (header === "ID Presensi") val = item.id || "";
        else if (header === "Tanggal") val = item.date || "";
        else if (header === "Kelas") val = item.className || "";
        else if (header === "Jam Ke") val = item.session || "";
        else if (header === "Mata Pelajaran") val = item.subject || "";
        else if (header === "Guru Pengampu") val = item.teacherName || "";
        else if (header === "Kehadiran (JSON)") val = item.attendance ? JSON.stringify(item.attendance) : "{}";
        else if (header === "Catatan") val = item.notes || "";
        else val = item[header] !== undefined ? item[header] : "";
      } else if (type === "journal") {
        if (header === "ID Jurnal") val = item.id || "";
        else if (header === "Tanggal") val = item.date || "";
        else if (header === "Kelas") val = item.className || "";
        else if (header === "Jam Ke") val = item.session || "";
        else if (header === "Mata Pelajaran") val = item.subject || "";
        else if (header === "Nama Guru") val = item.teacherName || "";
        else if (header === "Materi Pokok") val = item.topic || "";
        else if (header === "Media Pembelajaran") val = item.media || "";
        else if (header === "Catatan KBM" || header === "Catatan" || header === "catatan") val = item.notes || "";
        else val = item[header] !== undefined ? item[header] : "";
      }
      row.push(val);
    });
    newRows.push(row);
  });
  
  // Tulis sekaligus untuk kecepatan optimal
  if (newRows.length > 0) {
    sheet.getRange(2, 1, newRows.length, headers.length).setValues(newRows);
  }
}

// Helper mengembalikan respon dalam format JSON
function jsonResponse(data) {
  return ContentService.createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}
`;

  const copyToClipboard = () => {
    navigator.clipboard.writeText(appsScriptCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div id="apps-script-guide" className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm transition-all">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-4 bg-slate-50 hover:bg-slate-100/80 transition-colors text-left"
      >
        <div className="flex items-center gap-3">
          <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
            <FileSpreadsheet className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-semibold text-slate-800 text-sm md:text-base">Panduan Database Google Sheets (Apps Script)</h3>
            <p className="text-xs text-slate-500 mt-0.5">Sambungkan aplikasi ini ke Google Spreadsheet pribadi Anda.</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-1 rounded-full font-medium hidden sm:inline-block">Integrasi Efisien</span>
          {isOpen ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
        </div>
      </button>

      {isOpen && (
        <div className="p-4 border-t border-slate-100 text-sm text-slate-600 leading-relaxed max-h-[600px] overflow-y-auto">
          <h4 className="font-bold text-slate-800 mb-2">Mengapa mengintegrasikan Google Sheets?</h4>
          <p className="mb-4 text-xs md:text-sm">
            Secara default, aplikasi berjalan dalam <strong>Mode Demo / Lokal</strong> yang menyimpan data secara instan di browser Anda (<code className="bg-slate-100 text-rose-600 px-1 py-0.5 rounded">localStorage</code>). 
            Dengan menghubungkan ke Google Sheets, seluruh guru dapat melakukan login, mengabsen siswa, mencatat jurnal pengajaran secara real-time, dan data Anda tersimpan aman dan terpusat di Google Drive Anda tanpa biaya tambahan!
          </p>

          <h4 className="font-bold text-slate-800 mb-2">Langkah Demi Langkah Konfigurasi:</h4>
          <ol className="list-decimal pl-5 space-y-2 mb-6 text-xs md:text-sm">
            <li>Buat sebuah <strong>Google Spreadsheet baru</strong> di Google Drive Anda.</li>
            <li>Di halaman Spreadsheet tersebut, klik menu atas: <strong>Ekstensi (Extensions)</strong> &gt; <strong>Apps Script</strong>.</li>
            <li>Hapus seluruh baris kode kosong bawaan di editor Apps Script.</li>
            <li>Klik tombol <strong>Salin Kode Script</strong> di bawah ini, lalu tempelkan (Paste) di editor Apps Script tersebut.</li>
            <li>Pilih fungsi <code className="bg-slate-100 text-emerald-700 px-1 py-0.5 rounded font-mono font-semibold">setupActiveSpreadsheet</code> di bagian atas editor, lalu klik tombol <strong>Run (Jalankan)</strong>. Ini akan secara otomatis membuat 4 lembar sheet baru (<code className="font-semibold text-slate-800">Guru</code>, <code className="font-semibold text-slate-800">Siswa</code>, <code className="font-semibold text-slate-800">Presensi</code>, dan <code className="font-semibold text-slate-800">Jurnal</code>) beserta struktur kolom dan data sampelnya di Google Sheets Anda.</li>
            <li>Setelah berhasil dijalankan, klik tombol biru <strong>Deploy (Terapkan)</strong> di sudut kanan atas &gt; pilih <strong>New deployment (Penerapan baru)</strong>.</li>
            <li>Klik ikon roda gigi kecil di sebelah "Select type", pilih <strong>Web app (Aplikasi Web)</strong>.</li>
            <li>Ubah konfigurasinya menjadi:
              <ul className="list-disc pl-5 mt-1 space-y-1 text-slate-500 font-medium">
                <li>Deskripsi: <span className="text-slate-700 font-normal">Database Jurnal dan Kehadiran</span></li>
                <li>Execute as (Jalankan sebagai): <span className="text-slate-700 font-normal">Me (Email Anda / Pencipta)</span></li>
                <li>Who has access (Siapa yang memiliki akses): <span className="text-slate-700 font-semibold text-emerald-600">Anyone (Siapa saja)</span> </li>
              </ul>
            </li>
            <li>Klik <strong>Deploy</strong>. Setujui permintaan izin akses Google (klik "Review permissions", pilih akun Anda, klik "Advanced", lalu klik "Go to... (unsafe)" dan pilih "Allow").</li>
            <li>Salin <strong>Web App URL</strong> yang diberikan oleh Google Apps Script (berawalan <code className="font-mono text-emerald-600 text-xs">https://script.google.com/macros/s/.../exec</code>).</li>
            <li>Buka tab <strong>Pengaturan Database</strong> di aplikasi ini, tempelkan URL tersebut, lalu aktifkan mode <strong>"Hubungkan ke Google Sheets"</strong>!</li>
          </ol>

          <div className="flex items-center justify-between mb-2">
            <span className="font-bold text-slate-800 flex items-center gap-2">
              <Database className="w-4 h-4 text-emerald-600" /> Kode Google Apps Script:
            </span>
            <button
              onClick={copyToClipboard}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold shadow-sm transition-colors cursor-pointer"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5" /> Berhasil Disalin!
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" /> Salin Kode Script
                </>
              )}
            </button>
          </div>

          <div className="relative">
            <pre className="bg-slate-900 text-slate-200 p-4 rounded-xl font-mono text-xs overflow-x-auto max-h-[350px] border border-slate-800 leading-relaxed shadow-inner">
              {appsScriptCode}
            </pre>
            <div className="absolute bottom-3 right-3 bg-slate-900/90 text-[10px] text-slate-400 px-2 py-1 rounded border border-slate-700">
              JavaScript (Google Apps Script)
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
