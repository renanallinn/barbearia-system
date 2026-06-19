import { createClient } from "@/lib/supabase/server";
import { formatDate, formatTime, formatCurrency } from "@/lib/utils";
import AppointmentActions from "@/components/admin/AppointmentActions";
import Badge from "@/components/ui/Badge";
import Link from "next/link";

const statusVariant = {
  pendente: "warning",
  confirmado: "success",
  cancelado: "danger",
  concluido: "default",
} as const;

const statusLabel = {
  pendente: "Pendente",
  confirmado: "Confirmado",
  cancelado: "Cancelado",
  concluido: "Concluído",
} as const;

export default async function AgendamentosPage({
  searchParams,
}: {
  searchParams: Promise<{ data?: string; barbeiro?: string; status?: string }>;
}) {
  const params = await searchParams;
  const supabase = await createClient();

  // Sem filtro de data padrão — mostra todos
  let query = supabase
    .from("appointments")
    .select("*, barbers(name), services(name, price, duration_minutes)")
    .order("date", { ascending: false })
    .order("start_time", { ascending: true });

  if (params.data) query = query.eq("date", params.data);
  if (params.barbeiro) query = query.eq("barber_id", params.barbeiro);
  if (params.status) query = query.eq("status", params.status);

  const { data: appointments, error } = await query;
  const { data: barbers } = await supabase
    .from("barbers")
    .select("id, name")
    .eq("active", true);

  const hasFilters = !!(params.data || params.barbeiro || params.status);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900">Agendamentos</h1>
          <p className="text-zinc-500 text-sm mt-1">
            {appointments?.length || 0} agendamento(s) encontrado(s)
          </p>
        </div>
        <Link
          href="/agendamento"
          target="_blank"
          className="bg-amber-500 hover:bg-amber-400 text-black font-semibold text-sm px-4 py-2 rounded-lg transition-colors"
        >
          + Novo agendamento
        </Link>
      </div>

      {/* Filters */}
      <form method="GET" className="bg-white border border-zinc-100 rounded-xl p-4 mb-6 flex flex-wrap gap-3 items-end">
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-zinc-500">Data</label>
          <input
            type="date"
            name="data"
            defaultValue={params.data || ""}
            className="border border-zinc-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-zinc-500">Barbeiro</label>
          <select
            name="barbeiro"
            defaultValue={params.barbeiro || ""}
            className="border border-zinc-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
          >
            <option value="">Todos</option>
            {barbers?.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name}
              </option>
            ))}
          </select>
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-zinc-500">Status</label>
          <select
            name="status"
            defaultValue={params.status || ""}
            className="border border-zinc-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
          >
            <option value="">Todos</option>
            <option value="pendente">Pendente</option>
            <option value="confirmado">Confirmado</option>
            <option value="concluido">Concluído</option>
            <option value="cancelado">Cancelado</option>
          </select>
        </div>
        <div className="flex gap-2">
          <button
            type="submit"
            className="bg-amber-500 hover:bg-amber-400 text-black font-medium text-sm px-4 py-1.5 rounded-lg transition-colors"
          >
            Filtrar
          </button>
          {hasFilters && (
            <Link
              href="/admin/agendamentos"
              className="border border-zinc-300 hover:bg-zinc-50 text-zinc-600 font-medium text-sm px-4 py-1.5 rounded-lg transition-colors"
            >
              Limpar
            </Link>
          )}
        </div>
      </form>

      {/* Table */}
      <div className="bg-white border border-zinc-100 rounded-xl overflow-hidden">
        {appointments && appointments.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-zinc-50 border-b border-zinc-100">
                <tr>
                  <th className="text-left px-4 py-3 font-medium text-zinc-600">Cliente</th>
                  <th className="text-left px-4 py-3 font-medium text-zinc-600">Data/Hora</th>
                  <th className="text-left px-4 py-3 font-medium text-zinc-600">Barbeiro</th>
                  <th className="text-left px-4 py-3 font-medium text-zinc-600">Serviço</th>
                  <th className="text-left px-4 py-3 font-medium text-zinc-600">Valor</th>
                  <th className="text-left px-4 py-3 font-medium text-zinc-600">Status</th>
                  <th className="text-left px-4 py-3 font-medium text-zinc-600">Ações</th>
                </tr>
              </thead>
              <tbody>
                {appointments.map((appt) => (
                  <tr key={appt.id} className="border-b border-zinc-50 hover:bg-zinc-50 transition-colors">
                    <td className="px-4 py-3">
                      <p className="font-medium text-zinc-900">{appt.client_name}</p>
                      <p className="text-zinc-400 text-xs">{appt.client_phone}</p>
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-medium">{formatDate(appt.date)}</p>
                      <p className="text-zinc-400 text-xs">{formatTime(appt.start_time)}</p>
                    </td>
                    <td className="px-4 py-3 text-zinc-700">{appt.barbers?.name}</td>
                    <td className="px-4 py-3 text-zinc-700">{appt.services?.name}</td>
                    <td className="px-4 py-3 font-semibold text-zinc-900">
                      {formatCurrency(appt.services?.price || 0)}
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={statusVariant[appt.status as keyof typeof statusVariant]}>
                        {statusLabel[appt.status as keyof typeof statusLabel] || appt.status}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      <AppointmentActions id={appt.id} status={appt.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-16">
            <p className="text-zinc-400 text-sm">
              {hasFilters
                ? "Nenhum agendamento encontrado com esses filtros."
                : "Nenhum agendamento ainda."}
            </p>
            {hasFilters && (
              <Link
                href="/admin/agendamentos"
                className="text-amber-600 text-sm hover:underline mt-2 inline-block"
              >
                Ver todos os agendamentos
              </Link>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
