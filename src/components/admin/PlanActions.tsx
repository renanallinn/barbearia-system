"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function PlanActions({ id, active }: { id: string; active: boolean }) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  async function toggle() {
    setLoading(true);
    await supabase.from("subscription_plans").update({ active: !active }).eq("id", id);
    setLoading(false);
    router.refresh();
  }

  return (
    <button
      onClick={toggle}
      disabled={loading}
      className={`text-xs px-2.5 py-1 rounded-lg border transition-colors ${
        active
          ? "border-red-200 text-red-600 hover:bg-red-50"
          : "border-green-200 text-green-600 hover:bg-green-50"
      }`}
    >
      {loading ? "..." : active ? "Desativar" : "Ativar"}
    </button>
  );
}
