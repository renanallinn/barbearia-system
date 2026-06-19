"use client";

import { useRouter } from "next/navigation";

interface Barber {
  id: string;
  name: string;
}

export default function BarberSelector({
  barbers,
  selectedId,
}: {
  barbers: Barber[];
  selectedId: string;
}) {
  const router = useRouter();

  return (
    <select
      value={selectedId}
      onChange={(e) => router.push(`/admin/horarios?barbeiro=${e.target.value}`)}
      className="border border-zinc-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
    >
      {barbers.map((b) => (
        <option key={b.id} value={b.id}>
          {b.name}
        </option>
      ))}
    </select>
  );
}
