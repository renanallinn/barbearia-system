"use client";

import { useState } from "react";
import { WorkingHour } from "@/lib/types";

const MONTHS_PT = [
  "Janeiro","Fevereiro","Março","Abril","Maio","Junho",
  "Julho","Agosto","Setembro","Outubro","Novembro","Dezembro",
];
const DAYS_SHORT = ["Dom","Seg","Ter","Qua","Qui","Sex","Sáb"];

interface Props {
  selected: string;
  onSelect: (date: string) => void;
  workingHours: WorkingHour[];
}

export default function DatePicker({ selected, onSelect, workingHours }: Props) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());

  function prevMonth() {
    if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y - 1); }
    else setViewMonth(m => m - 1);
  }
  function nextMonth() {
    if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y + 1); }
    else setViewMonth(m => m + 1);
  }

  function isWorkingDay(date: Date) {
    if (!workingHours.length) return true;
    return workingHours.some((w) => w.day_of_week === date.getDay());
  }

  function isPast(date: Date) {
    return date < today;
  }

  function toDateStr(date: Date) {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
  }

  // Build calendar grid
  const firstDay = new Date(viewYear, viewMonth, 1);
  const lastDay = new Date(viewYear, viewMonth + 1, 0);
  const startPad = firstDay.getDay(); // 0=Sun
  const days: (Date | null)[] = [
    ...Array(startPad).fill(null),
    ...Array.from({ length: lastDay.getDate() }, (_, i) => new Date(viewYear, viewMonth, i + 1)),
  ];
  // Fill to complete last row
  while (days.length % 7 !== 0) days.push(null);

  const canGoPrev =
    viewYear > today.getFullYear() ||
    (viewYear === today.getFullYear() && viewMonth > today.getMonth());

  return (
    <div className="bg-white border border-zinc-200 rounded-xl p-4 select-none">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={prevMonth}
          disabled={!canGoPrev}
          className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-zinc-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors text-zinc-600"
        >
          ‹
        </button>
        <span className="font-semibold text-zinc-900 text-sm">
          {MONTHS_PT[viewMonth]} {viewYear}
        </span>
        <button
          onClick={nextMonth}
          className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-zinc-100 transition-colors text-zinc-600"
        >
          ›
        </button>
      </div>

      {/* Day headers */}
      <div className="grid grid-cols-7 mb-2">
        {DAYS_SHORT.map((d) => (
          <div key={d} className="text-center text-xs font-medium text-zinc-400 py-1">
            {d}
          </div>
        ))}
      </div>

      {/* Days grid */}
      <div className="grid grid-cols-7 gap-y-1">
        {days.map((date, i) => {
          if (!date) return <div key={i} />;
          const dateStr = toDateStr(date);
          const past = isPast(date);
          const working = isWorkingDay(date);
          const isSelected = selected === dateStr;
          const isToday = toDateStr(date) === toDateStr(today);
          const disabled = past || !working;

          return (
            <button
              key={dateStr}
              disabled={disabled}
              onClick={() => onSelect(dateStr)}
              className={`
                relative mx-auto w-9 h-9 rounded-full text-sm font-medium transition-all flex items-center justify-center
                ${isSelected
                  ? "bg-amber-500 text-black shadow-sm"
                  : disabled
                  ? "text-zinc-300 cursor-not-allowed"
                  : "text-zinc-700 hover:bg-amber-50 hover:text-amber-700 cursor-pointer"
                }
                ${isToday && !isSelected ? "ring-2 ring-amber-400 ring-offset-1" : ""}
              `}
            >
              {date.getDate()}
              {/* Working day dot */}
              {!disabled && !isSelected && (
                <span className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-amber-400" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
