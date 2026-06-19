"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { DAYS_PT } from "@/lib/utils";
import Button from "@/components/ui/Button";
import { WorkingHour } from "@/lib/types";

const TIME_OPTIONS = Array.from({ length: 28 }, (_, i) => {
  const h = Math.floor(i / 2) + 7;
  const m = i % 2 === 0 ? "00" : "30";
  return `${String(h).padStart(2, "0")}:${m}`;
});

export default function WorkingHoursForm({
  barberId,
  existing,
}: {
  barberId: string;
  existing: WorkingHour[];
}) {
  const router = useRouter();
  const supabase = createClient();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const [hours, setHours] = useState<
    Record<number, { active: boolean; start: string; end: string }>
  >(
    Object.fromEntries(
      [0, 1, 2, 3, 4, 5, 6].map((day) => {
        const existing_day = existing.find((w) => w.day_of_week === day);
        return [
          day,
          {
            active: !!existing_day,
            start: existing_day?.start_time?.slice(0, 5) || "08:00",
            end: existing_day?.end_time?.slice(0, 5) || "18:00",
          },
        ];
      })
    )
  );

  async function handleSave() {
    setLoading(true);
    setSuccess(false);

    // Delete existing
    await supabase.from("working_hours").delete().eq("barber_id", barberId);

    // Insert active days
    const rows = Object.entries(hours)
      .filter(([, v]) => v.active)
      .map(([day, v]) => ({
        barber_id: barberId,
        day_of_week: parseInt(day),
        start_time: v.start + ":00",
        end_time: v.end + ":00",
      }));

    if (rows.length > 0) {
      await supabase.from("working_hours").insert(rows);
    }

    setLoading(false);
    setSuccess(true);
    router.refresh();
  }

  return (
    <div>
      <p className="text-sm font-medium text-zinc-700 mb-3">Configurar dias de trabalho:</p>
      <div className="space-y-2 mb-4">
        {[0, 1, 2, 3, 4, 5, 6].map((day) => (
          <div key={day} className="flex items-center gap-3">
            <input
              type="checkbox"
              id={`day-${day}`}
              checked={hours[day].active}
              onChange={(e) =>
                setHours((h) => ({
                  ...h,
                  [day]: { ...h[day], active: e.target.checked },
                }))
              }
              className="w-4 h-4 accent-amber-500"
            />
            <label
              htmlFor={`day-${day}`}
              className="text-sm text-zinc-700 w-28"
            >
              {DAYS_PT[day]}
            </label>
            {hours[day].active && (
              <>
                <select
                  value={hours[day].start}
                  onChange={(e) =>
                    setHours((h) => ({
                      ...h,
                      [day]: { ...h[day], start: e.target.value },
                    }))
                  }
                  className="border border-zinc-300 rounded px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-amber-500"
                >
                  {TIME_OPTIONS.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
                <span className="text-zinc-400 text-xs">até</span>
                <select
                  value={hours[day].end}
                  onChange={(e) =>
                    setHours((h) => ({
                      ...h,
                      [day]: { ...h[day], end: e.target.value },
                    }))
                  }
                  className="border border-zinc-300 rounded px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-amber-500"
                >
                  {TIME_OPTIONS.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </>
            )}
          </div>
        ))}
      </div>
      {success && (
        <p className="text-sm text-green-600 bg-green-50 rounded-lg px-3 py-2 mb-3">
          Horários salvos com sucesso!
        </p>
      )}
      <Button onClick={handleSave} loading={loading} className="w-full">
        Salvar horários
      </Button>
    </div>
  );
}
