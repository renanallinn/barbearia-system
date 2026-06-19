"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";

export default function BlockedSlotForm({ barberId }: { barberId: string }) {
  const router = useRouter();
  const supabase = createClient();
  const [date, setDate] = useState("");
  const [start, setStart] = useState("08:00");
  const [end, setEnd] = useState("18:00");
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const today = new Date().toISOString().split("T")[0];

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!date) return;
    setLoading(true);
    setSuccess(false);

    await supabase.from("blocked_slots").insert({
      barber_id: barberId,
      date,
      start_time: start + ":00",
      end_time: end + ":00",
      reason: reason.trim() || null,
    });

    setLoading(false);
    setSuccess(true);
    setDate("");
    setReason("");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <Input
        id="block-date"
        label="Data do bloqueio *"
        type="date"
        min={today}
        value={date}
        onChange={(e) => setDate(e.target.value)}
        required
      />
      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-zinc-700">Início *</label>
          <input
            type="time"
            value={start}
            onChange={(e) => setStart(e.target.value)}
            className="border border-zinc-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
            required
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-zinc-700">Fim *</label>
          <input
            type="time"
            value={end}
            onChange={(e) => setEnd(e.target.value)}
            className="border border-zinc-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
            required
          />
        </div>
      </div>
      <Input
        id="block-reason"
        label="Motivo (opcional)"
        placeholder="Almoço, compromisso pessoal..."
        value={reason}
        onChange={(e) => setReason(e.target.value)}
      />
      {success && (
        <p className="text-sm text-green-600 bg-green-50 rounded-lg px-3 py-2">
          Bloqueio adicionado!
        </p>
      )}
      <Button type="submit" loading={loading} className="w-full">
        Bloquear horário
      </Button>
    </form>
  );
}
