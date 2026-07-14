import React, { useState, useRef, useEffect } from 'react';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight } from 'lucide-react';

interface DatePickerPopupProps {
  value: string; // YYYY-MM-DD
  onChange: (value: string) => void;
  colorTheme?: 'emerald' | 'indigo';
}

const MONTH_NAMES = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
];

const DAY_NAMES = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];

export default function DatePickerPopup({ value, onChange, colorTheme = 'emerald' }: DatePickerPopupProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Parse current value
  const currentDate = value ? new Date(value) : new Date();
  const [viewYear, setViewYear] = useState(currentDate.getFullYear() || 2026);
  const [viewMonth, setViewMonth] = useState(currentDate.getMonth() || 6); // 0-indexed

  // Sync state with value when value changes
  useEffect(() => {
    if (value) {
      const d = new Date(value);
      if (!isNaN(d.getTime())) {
        setViewYear(d.getFullYear());
        setViewMonth(d.getMonth());
      }
    }
  }, [value]);

  // Click outside to close
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handlePrevMonth = () => {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear(prev => prev - 1);
    } else {
      setViewMonth(prev => prev - 1);
    }
  };

  const handleNextMonth = () => {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear(prev => prev + 1);
    } else {
      setViewMonth(prev => prev + 1);
    }
  };

  const handleSelectDay = (day: number) => {
    const formattedMonth = String(viewMonth + 1).padStart(2, '0');
    const formattedDay = String(day).padStart(2, '0');
    const dateString = `${viewYear}-${formattedMonth}-${formattedDay}`;
    onChange(dateString);
    setIsOpen(false);
  };

  const handleToday = () => {
    const today = new Date();
    const y = today.getFullYear();
    const m = today.getMonth();
    const d = today.getDate();
    const dateString = `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    onChange(dateString);
    setViewYear(y);
    setViewMonth(m);
    setIsOpen(false);
  };

  // Generate calendar days
  const firstDayIndex = new Date(viewYear, viewMonth, 1).getDay();
  const totalDays = new Date(viewYear, viewMonth + 1, 0).getDate();
  const prevMonthTotalDays = new Date(viewYear, viewMonth, 0).getDate();

  const days: { day: number; isCurrentMonth: boolean; key: string }[] = [];

  // Previous month padding days
  for (let i = firstDayIndex - 1; i >= 0; i--) {
    days.push({
      day: prevMonthTotalDays - i,
      isCurrentMonth: false,
      key: `prev-${prevMonthTotalDays - i}`
    });
  }

  // Current month days
  for (let i = 1; i <= totalDays; i++) {
    days.push({
      day: i,
      isCurrentMonth: true,
      key: `curr-${i}`
    });
  }

  // Next month padding days to make perfect grids
  const remainingSlots = 42 - days.length; // 6 rows of 7 days
  for (let i = 1; i <= remainingSlots; i++) {
    days.push({
      day: i,
      isCurrentMonth: false,
      key: `next-${i}`
    });
  }

  // Format active date to human readable Indonesian
  const getFormattedDate = (dateStr: string) => {
    if (!dateStr) return 'Pilih Tanggal';
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    const day = d.getDate();
    const month = MONTH_NAMES[d.getMonth()];
    const year = d.getFullYear();
    return `${day} ${month} ${year}`;
  };

  // Theme colors
  const themeClasses = {
    emerald: {
      accentText: 'text-emerald-600',
      daySelected: 'bg-emerald-600 text-white hover:bg-emerald-700 font-bold',
      dayTodayBorder: 'border-2 border-emerald-600 text-emerald-700 font-semibold',
    },
    indigo: {
      accentText: 'text-indigo-600',
      daySelected: 'bg-indigo-600 text-white hover:bg-indigo-700 font-bold',
      dayTodayBorder: 'border-2 border-indigo-600 text-indigo-700 font-semibold',
    }
  }[colorTheme];

  // Helper to check if a day is today
  const isToday = (day: number) => {
    const today = new Date();
    return today.getDate() === day && today.getMonth() === viewMonth && today.getFullYear() === viewYear;
  };

  // Helper to check if a day is the currently selected date
  const isSelected = (day: number) => {
    if (!value) return false;
    const d = new Date(value);
    return d.getDate() === day && d.getMonth() === viewMonth && d.getFullYear() === viewYear;
  };

  return (
    <div className="relative" ref={containerRef}>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-700 text-left flex items-center justify-between focus:outline-none focus:ring-2 focus:ring-slate-500 hover:bg-slate-50 transition-colors"
      >
        <span className="truncate">{getFormattedDate(value)}</span>
        <CalendarIcon className="w-4 h-4 text-slate-400 shrink-0 ml-1.5" />
      </button>

      {/* Dropdown Calendar */}
      {isOpen && (
        <div className="absolute z-50 mt-1.5 left-0 w-[290px] bg-white border border-slate-200 rounded-2xl shadow-xl p-3.5 space-y-3 animate-in fade-in duration-100">
          {/* Header */}
          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={handlePrevMonth}
              className="p-1.5 text-slate-500 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <div className="text-xs font-bold text-slate-700">
              {MONTH_NAMES[viewMonth]} {viewYear}
            </div>
            <button
              type="button"
              onClick={handleNextMonth}
              className="p-1.5 text-slate-500 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Days of Week */}
          <div className="grid grid-cols-7 gap-1 text-center">
            {DAY_NAMES.map(name => (
              <div key={name} className="text-[10px] font-bold text-slate-400 py-1">
                {name}
              </div>
            ))}
          </div>

          {/* Days Grid */}
          <div className="grid grid-cols-7 gap-1">
            {days.map(({ day, isCurrentMonth, key }) => {
              if (!isCurrentMonth) {
                return (
                  <div
                    key={key}
                    className="text-center py-1 text-slate-300 text-xs cursor-default select-none"
                  >
                    {day}
                  </div>
                );
              }

              const selected = isSelected(day);
              const today = isToday(day);

              return (
                <button
                  type="button"
                  key={key}
                  onClick={() => handleSelectDay(day)}
                  className={`
                    w-8 h-8 rounded-lg text-xs flex items-center justify-center transition-all cursor-pointer mx-auto
                    ${selected ? themeClasses.daySelected : today ? themeClasses.dayTodayBorder : 'text-slate-700 hover:bg-slate-100'}
                  `}
                >
                  {day}
                </button>
              );
            })}
          </div>

          {/* Footer Action */}
          <div className="flex justify-between items-center pt-2.5 border-t border-slate-100">
            <button
              type="button"
              onClick={handleToday}
              className={`text-xs font-semibold ${themeClasses.accentText} px-2 py-1 rounded-md hover:bg-slate-50 transition-colors cursor-pointer`}
            >
              Hari Ini
            </button>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="text-xs font-semibold text-slate-500 hover:bg-slate-50 px-2 py-1 rounded-md transition-colors cursor-pointer"
            >
              Tutup
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
