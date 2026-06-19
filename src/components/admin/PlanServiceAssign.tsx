"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

interface Service { id: string; name: string; price: number }

export default function PlanServiceAssign({
  planId,
  services,
  currentAssignments,
}: {
  planId: string;
  services: Service[];
  currentAssignments: string[];
}) {
  const router = useRouter();
  const supabase = createClient();
  const [selected, setSelected] = useState<Set<string>>(new Set(currentAssignments));
  const [pending, startTransition] = useTransition();
  const [saving, setSaving] = useState(false);

  async function toggle(serviceId: string) {
    const next = new Set(selected);
    if (next.has(serviceId)) {
      next.delete(serviceId);
    } else {
      next.add(serviceId);
    }
    setSelected(next);
    setSaving(true);

    if (next.has(serviceId) || !selected.has(serviceId)) {
      // Just toggled on
      if (!selected.has(serviceId)) {
        await supabase.from("plan_services").insert({ plan_id: planId, service_id: serviceId });
      }
    }
    if (!next.has(serviceId) && selected.has(serviceId)) {
      await supabase.from("plan_services").delete().eq("plan_id", planId).eq("service_id", serviceId);
    }

    setSaving(false);
    startTransition(() => router.refresh());
  }

  return (
    <div>
      <p className="text-xs text-zinc-400 mb-2">Serviços inclusos{saving ? " · salvando..." : ""}:</p>
      <div className="flex flex-wrap gap-1.5">
        {services.map((s) => {
          const on = selected.has(s.id);
          return (
            <button
              key={s.id}
              onClick={() => toggle(s.id)}
              disabled={pending}
              className={`text-xs px-2.5 py-1 rounded-full border transition-colors ${
                on
                  ? "bg-amber-500 border-amber-500 text-black font-semibold"
                  : "border-zinc-200 text-zinc-500 hover:border-amber-400 hover:text-amber-700"
              }`}
            >
              {on ? "✓ " : ""}{s.name}
            </button>
          );
        })}
      </div>
    </div>
  );
}
