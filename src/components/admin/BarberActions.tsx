"use client";

import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useState } from "react";

export default function BarberActions({
  id,
  active,
}: {
  id: string;
  active: boolean;
}) {
  const router = useRouter();
  const supabase = createClient();
  const [loading, setLoading] = useState(false);

  async function toggleActive() {
    setLoading(true);
    await supabase.from("barbers").update({ active: !active }).eq("id", id);
    setLoading(false);
    router.refresh();
  }

  async function handleDelete() {
    if (!confirm("Tem certeza que deseja remover este barbeiro?")) return;
    setLoading(true);
    await supabase.from("barbers").delete().eq("id", id);
    setLoading(false);
    router.refresh();
  }

  return (
    <div className="flex gap-1">
      <button
        disabled={loading}
        onClick={toggleActive}
        className="text-xs text-amber-600 hover:underline disabled:opacity-50"
      >
        {active ? "Desativar" : "Ativar"}
      </button>
      <span className="text-zinc-300">·</span>
      <button
        disabled={loading}
        onClick={handleDelete}
        className="text-xs text-red-500 hover:underline disabled:opacity-50"
      >
        Excluir
      </button>
    </div>
  );
}
