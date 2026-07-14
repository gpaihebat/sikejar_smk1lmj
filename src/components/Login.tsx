import React, { useState } from 'react';
import { Teacher, SyncConfig } from '../types';
import { LogIn, ShieldAlert, Wifi, WifiOff } from 'lucide-react';

interface LoginProps {
  teachers: Teacher[];
  syncConfig: SyncConfig;
  onLoginSuccess: (teacher: Teacher) => void;
}

export default function Login({ teachers, syncConfig, onLoginSuccess }: LoginProps) {
  const [username, setUsername] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!username.trim()) {
      setError('Username tidak boleh kosong.');
      return;
    }

    const cleanUsername = username.trim().toLowerCase();
    const foundTeacher = teachers.find(t => t.username.toLowerCase() === cleanUsername);

    if (foundTeacher) {
      onLoginSuccess(foundTeacher);
    } else {
      setError('Username tidak terdaftar. Hubungi Admin Sekolah untuk mendaftarkan akun Anda.');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <div className="w-16 h-16 bg-emerald-600 rounded-2xl flex items-center justify-center text-white font-bold text-3xl shadow-md border border-emerald-500 ring-4 ring-emerald-50">
            📚
          </div>
        </div>
        <h2 className="mt-6 text-center text-3xl font-extrabold text-slate-900 tracking-tight">
          SIKEJAR
        </h2>
        <p className="mt-2 text-center text-sm text-slate-500">
          Sistem Kehadiran dan Jurnal Mengajar
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4">
        <div className="bg-white py-8 px-4 shadow-sm border border-slate-200 rounded-2xl sm:px-10">
          <form className="space-y-6" onSubmit={handleSubmit}>
            <div>
              <label htmlFor="username" className="block text-sm font-medium text-slate-700">
                Username Guru
              </label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <input
                  id="username"
                  name="username"
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Masukkan username Anda"
                  className="block w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 focus:bg-white transition-all text-sm"
                />
              </div>
              <p className="mt-1.5 text-[11px] text-slate-400">
                Masukkan username guru yang telah terdaftar di sistem.
              </p>
            </div>

            {error && (
              <div className="rounded-lg bg-rose-50 p-3 border border-rose-100 text-rose-700 text-xs flex items-start gap-2">
                <ShieldAlert className="w-4 h-4 mt-0.5 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div>
              <button
                type="submit"
                className="w-full flex justify-center items-center gap-2 py-3 px-4 border border-transparent rounded-xl text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 shadow-sm transition-all cursor-pointer"
              >
                <LogIn className="w-4 h-4" /> Masuk Portal Guru
              </button>
            </div>
          </form>

          <div className="mt-6 pt-6 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400">
            <span className="flex items-center gap-1.5">
              {syncConfig.mode === 'sheets' ? (
                <>
                  <Wifi className="w-3.5 h-3.5 text-emerald-500 animate-pulse" />
                  <span className="text-emerald-600 font-medium">Google Sheets Aktif</span>
                </>
              ) : (
                <>
                  <WifiOff className="w-3.5 h-3.5 text-amber-500" />
                  <span className="text-amber-600 font-medium">Mode Demo Lokal</span>
                </>
              )}
            </span>
            <span className="text-slate-400">v1.1 - Responsif</span>
          </div>
        </div>
      </div>
    </div>
  );
}
