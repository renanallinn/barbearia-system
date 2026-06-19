"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

interface Barber {
  id: string;
  name: string;
}

export default function BarberServiceAssign({
  serviceId,
  barbers,
  currentAssignments,
}: {
  serviceId: string;
  barbers: Barber[];
  currentAssignments: string[];
}) {
  const router = useRouter();
  const supabase = createClient();
  const [loading, setLoading] = useState(false);

  async function toggleAssignment(barberId: string, assigned: boolean) {
    setLoading(true);
    if (assigned) {
      await supabase
        .from("barber_services")
        .delete()
        .eq("barber_id", barberId)
        .eq("service_id", serviceId);
    } else {
      await supabase
        .from("barber_services")
        .insert({ barber_id: barberId, service_id: serviceId });
    }
    setLoading(false);
    router.refresh();
  }

  if (barbers.length === 0) return null;

  return (
    <div>
      <p className="text-xs text-zinc-500 mb-1.5">Barbeiros que realizam este serviço:</p>
      <div className="flex flex-wrap gap-2">
        {barbers.map((barber) => {
          const assigned = currentAssignments.includes(barber.id);
          return (
            <button
              key={barber.id}
              disabled={loading}
              onClick={() => toggleAssignment(barber.id, assigned)}
              className={`text-xs px-2.5 py-1 rounded-full border transition-all disabled:opacity-50 ${
                assigned
                  ? "bg-amber-100 border-amber-300 text-amber-800 font-medium"
                  : "bg-zinc-50 border-zinc-200 text-zinc-500 hover:border-amber-300"
              }`}
            >
              {assigned ? "✓ " : ""}{barber.name}
            </button>
          );
        })}
      </div>
    </div>
  );
}
