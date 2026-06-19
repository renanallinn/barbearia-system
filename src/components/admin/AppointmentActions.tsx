"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

const nextStatus: Record<string, string[]> = {
  pendente: ["confirmado", "cancelado"],
  confirmado: ["concluido", "cancelado"],
  concluido: [],
  cancelado: [],
};

const labels: Record<string, string> = {
  confirmado: "Confirmar",
  concluido: "Concluir",
  cancelado: "Cancelar",
};

export default function AppointmentActions({
  id,
  status,
}: {
  id: string;
  status: string;
}) {
  const router = useRouter();
  const supabase = createClient();
  const [loading, setLoading] = useState(false);

  const actions = nextStatus[status] || [];

  if (actions.length === 0) return <span className="text-zinc-300 text-xs">—</span>;

  async function updateStatus(newStatus: string) {
    setLoading(true);
    await supabase
      .from("appointments")
      .update({ status: newStatus })
      .eq("id", id);
    setLoading(false);
    router.refresh();
  }

  return (
    <div className="flex gap-2">
      {actions.map((action) => (
        <button
          key={action}
          disabled={loading}
          onClick={() => updateStatus(action)}
          className={`text-xs font-medium px-2.5 py-1 rounded-lg transition-colors disabled:opacity-50 ${
            action === "cancelado"
              ? "bg-red-50 text-red-600 hover:bg-red-100"
              : action === "confirmado"
              ? "bg-blue-50 text-blue-600 hover:bg-blue-100"
              : "bg-green-50 text-green-600 hover:bg-green-100"
          }`}
        >
          {labels[action]}
        </button>
      ))}
    </div>
  );
}
