import { createClient } from "@/lib/supabase/server";
import { formatDate, formatTime, formatCurrency } from "@/lib/utils";
import AppointmentActions from "@/components/admin/AppointmentActions";
import Badge from "@/components/ui/Badge";

const statusVariant = {
  pendente: "warning",
  confirmado: "success",
  cancelado: "danger",
  concluido: "default",
} as const;

export default async function AgendamentosPage({
  searchParams,
}: {
  searchParams: Promise<{ data?: string; barbeiro?: string; status?: string }>;
}) {
  const params = await searchParams;
  const supabase = await createClient();
  const today = new Date().toISOString().split("T")[0];

  const dateFilter = params.data || today;

  let query = supabase
    .from("appointments")
    .select("*, barbers(name), services(name, price, duration_minutes)")
    .order("date", { ascending: true })
    .order("start_time", { ascending: true });

  if (dateFilter) query = query.eq("date", dateFilter);
  if (params.barbeiro) query = query.eq("barber_id", params.barbeiro);
  if (params.status) query = query.eq("status", params.status);

  const { data: appointments } = await query;
  const { data: barbers } = await supabase
    .from("barbers")
    .select("id, name")
    .eq("active", true);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900">Agendamentos</h1>
          <p className="text-zinc-500 text-sm mt-1">
            {appointments?.length || 0} resultado(s)
          </p>
        </div>
      </div>

      {/* Filters */}
      <form className="bg-white border border-zinc-100 rounded-xl p-4 mb-6 flex flex-wrap gap-3">
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-zinc-500">Data</label>
          <input
            type="date"
            name="data"
            defaultValue={dateFilter}
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
        <div className="flex items-end">
          <button
            type="submit"
            className="bg-amber-500 hover:bg-amber-400 text-black font-medium text-sm px-4 py-1.5 rounded-lg transition-colors"
          >
            Filtrar
          </button>
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
                        {appt.status}
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
          <p className="text-center text-zinc-400 py-12">
            Nenhum agendamento encontrado para os filtros selecionados.
          </p>
        )}
      </div>
    </div>
  );
}
