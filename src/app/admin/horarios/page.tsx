import { createClient } from "@/lib/supabase/server";
import { DAYS_PT, formatTime } from "@/lib/utils";
import WorkingHoursForm from "@/components/admin/WorkingHoursForm";
import BlockedSlotForm from "@/components/admin/BlockedSlotForm";
import BarberSelector from "@/components/admin/BarberSelector";
import DeleteBlockedSlot from "@/components/admin/DeleteBlockedSlot";

export default async function HorariosPage({
  searchParams,
}: {
  searchParams: Promise<{ barbeiro?: string }>;
}) {
  const params = await searchParams;
  const supabase = await createClient();

  const { data: barbers } = await supabase
    .from("barbers")
    .select("id, name")
    .eq("active", true)
    .order("name");

  const selectedBarberId = params.barbeiro || barbers?.[0]?.id || "";

  const [{ data: workingHours }, { data: blockedSlots }] = await Promise.all([
    supabase
      .from("working_hours")
      .select("*")
      .eq("barber_id", selectedBarberId)
      .order("day_of_week"),
    supabase
      .from("blocked_slots")
      .select("*")
      .eq("barber_id", selectedBarberId)
      .gte("date", new Date().toISOString().split("T")[0])
      .order("date")
      .order("start_time"),
  ]);

  const selectedBarber = barbers?.find((b) => b.id === selectedBarberId);

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-zinc-900">Horários de Trabalho</h1>
        <p className="text-zinc-500 text-sm mt-1">
          Configure disponibilidade e bloqueios por barbeiro
        </p>
      </div>

      {/* Barber selector */}
      <div className="bg-white border border-zinc-100 rounded-xl p-4 mb-6">
        <div className="flex items-center gap-4">
          <label className="text-sm font-medium text-zinc-700">Barbeiro:</label>
          <BarberSelector barbers={barbers || []} selectedId={selectedBarberId} />
        </div>
      </div>

      {selectedBarberId && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Working hours */}
          <div className="bg-white border border-zinc-100 rounded-xl p-6">
            <h2 className="font-semibold text-zinc-900 mb-4">
              Horário de trabalho — {selectedBarber?.name}
            </h2>
            <div className="space-y-2 mb-6">
              {[0, 1, 2, 3, 4, 5, 6].map((day) => {
                const wh = workingHours?.find((w) => w.day_of_week === day);
                return (
                  <div key={day} className="flex items-center gap-3 py-2 border-b border-zinc-50">
                    <span className="text-sm font-medium text-zinc-700 w-32">
                      {DAYS_PT[day]}
                    </span>
                    {wh ? (
                      <span className="text-sm text-zinc-600">
                        {formatTime(wh.start_time)} – {formatTime(wh.end_time)}
                      </span>
                    ) : (
                      <span className="text-sm text-zinc-400 italic">Folga</span>
                    )}
                  </div>
                );
              })}
            </div>
            <WorkingHoursForm
              barberId={selectedBarberId}
              existing={workingHours || []}
            />
          </div>

          {/* Blocked slots */}
          <div className="bg-white border border-zinc-100 rounded-xl p-6">
            <h2 className="font-semibold text-zinc-900 mb-4">
              Bloqueios de horário
            </h2>
            <div className="space-y-2 mb-6">
              {blockedSlots && blockedSlots.length > 0 ? (
                blockedSlots.map((slot) => (
                  <div
                    key={slot.id}
                    className="flex items-center justify-between bg-red-50 border border-red-100 rounded-lg px-4 py-3"
                  >
                    <div>
                      <p className="text-sm font-medium text-red-900">
                        {new Date(slot.date + "T12:00:00").toLocaleDateString("pt-BR")}
                      </p>
                      <p className="text-xs text-red-700">
                        {formatTime(slot.start_time)} – {formatTime(slot.end_time)}
                        {slot.reason && ` · ${slot.reason}`}
                      </p>
                    </div>
                    <DeleteBlockedSlot id={slot.id} />
                  </div>
                ))
              ) : (
                <p className="text-sm text-zinc-400 text-center py-4">
                  Nenhum bloqueio futuro.
                </p>
              )}
            </div>
            <BlockedSlotForm barberId={selectedBarberId} />
          </div>
        </div>
      )}
    </div>
  );
}
