/**
 * CONFIGURASI DEFAULT SIKEJAR
 * 
 * Tulis URL Google Apps Script Web App Anda di bawah ini agar aplikasi secara default
 * langsung terhubung ke database Google Sheets Anda di semua perangkat/HP guru lainnya.
 */
export const APP_CONFIG = {
  // Masukkan URL Web App Google Apps Script Anda (berawalan https://script.google.com/macros/s/...)
  defaultAppsScriptUrl: "https://script.google.com/macros/s/AKfycbx5EDfe_GhfvCwD0cEYjx1CETUYS5D7WBYJRxyBg4tJwvavm2ErkydiFzJKQNNNpOyMeg/exec", 
  
  // Mode default awal saat aplikasi dibuka pertama kali tanpa konfigurasi localstorage
  // 'sheets' jika ingin langsung terhubung ke Google Sheets, atau 'local' untuk mode demo lokal
  defaultMode: "sheets" as "local" | "sheets"
};
