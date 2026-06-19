import { createClient } from "@/lib/supabase/server";
import { formatDate, formatTime, formatCurrency } from "@/lib/utils";
import Link from "next/link";
import Badge from "@/components/ui/Badge";

const statusVariant = {
  pendente: "warning",
  confirmado: "success",
  cancelado: "danger",
  concluido: "default",
} as const;

export default async function AdminDashboard() {
  const supabase = await createClient();
  const today = new Date().toISOString().split("T")[0];

  const [
    { count: totalBarbers },
    { count: totalServices },
    { data: todayAppts },
    { data: recentAppts },
  ] = await Promise.all([
    supabase.from("barbers").select("*", { count: "exact", head: true }).eq("active", true),
    supabase.from("services").select("*", { count: "exact", head: true }).eq("active", true),
    supabase
      .from("appointments")
      .select("*, barbers(name), services(name, price)")
      .eq("date", today)
      .neq("status", "cancelado")
      .order("start_time"),
    supabase
      .from("appointments")
      .select("*, barbers(name), services(name, price)")
      .order("created_at", { ascending: false })
      .limit(5),
  ]);

  const todayRevenue = (todayAppts || [])
    .filter((a) => a.status !== "cancelado")
    .reduce((sum, a) => sum + (a.services?.price || 0), 0);

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900">Dashboard</h1>
          <p className="text-zinc-500 text-sm mt-1">Visão geral da barbearia</p>
        </div>
        <Link
          href="/agendamento"
          target="_blank"
          className="bg-amber-500 hover:bg-amber-400 text-black font-semibold text-sm px-4 py-2 rounded-lg transition-colors"
        >
          + Novo agendamento
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          {
            label: "Atendimentos hoje",
            value: todayAppts?.length || 0,
            icon: "📅",
            color: "bg-blue-50 text-blue-600",
          },
          {
            label: "Receita hoje",
            value: formatCurrency(todayRevenue),
            icon: "💰",
            color: "bg-green-50 text-green-600",
          },
          {
            label: "Barbeiros ativos",
            value: totalBarbers || 0,
            icon: "✂️",
            color: "bg-amber-50 text-amber-600",
          },
          {
            label: "Serviços ativos",
            value: totalServices || 0,
            icon: "💈",
            color: "bg-purple-50 text-purple-600",
          },
        ].map((stat) => (
          <div
            key={stat.label}
            className="bg-white rounded-xl border border-zinc-100 p-5"
          >
            <div
              className={`w-10 h-10 rounded-lg flex items-center justify-center text-lg mb-3 ${stat.color}`}
            >
              {stat.icon}
            </div>
            <p className="text-2xl font-bold text-zinc-900">{stat.value}</p>
            <p className="text-zinc-500 text-sm mt-0.5">{stat.label}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Today's appointments */}
        <div className="bg-white rounded-xl border border-zinc-100 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-zinc-900">Agenda de Hoje</h2>
            <Link
              href="/admin/agendamentos"
              className="text-sm text-amber-600 hover:underline"
            >
              Ver todos →
            </Link>
          </div>
          {todayAppts && todayAppts.length > 0 ? (
            <div className="space-y-3">
              {todayAppts.map((appt) => (
                <div
                  key={appt.id}
                  className="flex items-center gap-3 p-3 bg-zinc-50 rounded-lg"
                >
                  <div className="text-center min-w-[48px]">
                    <p className="font-bold text-zinc-900 text-sm">
                      {formatTime(appt.start_time)}
                    </p>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm text-zinc-900 truncate">
                      {appt.client_name}
                    </p>
                    <p className="text-xs text-zinc-500 truncate">
                      {appt.services?.name} · {appt.barbers?.name}
                    </p>
                  </div>
                  <Badge variant={statusVariant[appt.status as keyof typeof statusVariant]}>
                    {appt.status}
                  </Badge>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-zinc-400 text-sm text-center py-6">
              Nenhum agendamento para hoje.
            </p>
          )}
        </div>

        {/* Recent appointments */}
        <div className="bg-white rounded-xl border border-zinc-100 p-6">
          <h2 className="font-bold text-zinc-900 mb-4">Agendamentos Recentes</h2>
          {recentAppts && recentAppts.length > 0 ? (
            <div className="space-y-3">
              {recentAppts.map((appt) => (
                <div
                  key={appt.id}
                  className="flex items-center gap-3 p-3 bg-zinc-50 rounded-lg"
                >
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm text-zinc-900 truncate">
                      {appt.client_name}
                    </p>
                    <p className="text-xs text-zinc-500">
                      {formatDate(appt.date)} às {formatTime(appt.start_time)} ·{" "}
                      {appt.barbers?.name}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-zinc-700">
                      {formatCurrency(appt.services?.price || 0)}
                    </p>
                    <Badge variant={statusVariant[appt.status as keyof typeof statusVariant]}>
                      {appt.status}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-zinc-400 text-sm text-center py-6">
              Nenhum agendamento ainda.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
