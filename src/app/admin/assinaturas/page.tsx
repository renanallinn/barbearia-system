export const dynamic = "force-dynamic";
import { createClient } from "@/lib/supabase/server";
import AddPlanForm from "@/components/admin/AddPlanForm";
import PlanServiceAssign from "@/components/admin/PlanServiceAssign";
import PlanActions from "@/components/admin/PlanActions";

function formatCurrency(value: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);
}

function statusBadge(status: string) {
  if (status === "active") return <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">Ativo</span>;
  if (status === "past_due") return <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full">Inadimplente</span>;
  if (status === "canceled") return <span className="text-xs bg-zinc-100 text-zinc-500 px-2 py-0.5 rounded-full">Cancelado</span>;
  return <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full">Pausado</span>;
}

export default async function AssinaturasPage() {
  const supabase = await createClient();

  const [{ data: plans }, { data: services }, { data: allSubs }] = await Promise.all([
    supabase
      .from("subscription_plans")
      .select("*, plan_services(service_id, services(name))")
      .order("price"),
    supabase.from("services").select("id, name, price").eq("active", true).order("name"),
    supabase
      .from("client_subscriptions")
      .select("*, clients(name), subscription_plans(name)")
      .order("created_at", { ascending: false }),
  ]);

  const { data: planAssignments } = await supabase
    .from("plan_services")
    .select("plan_id, service_id");

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-zinc-900">Assinaturas</h1>
        <p className="text-zinc-500 text-sm mt-1">Gerencie planos e assinantes</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Plans list */}
        <div className="bg-white border border-zinc-100 rounded-xl overflow-hidden">
          <div className="px-5 py-4 border-b border-zinc-100">
            <h2 className="font-semibold text-zinc-900">Planos ({plans?.length || 0})</h2>
          </div>
          <div className="divide-y divide-zinc-50">
            {plans && plans.length > 0 ? (
              plans.map((plan) => (
                <div key={plan.id} className="px-5 py-4">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <p className="font-semibold text-zinc-900 text-sm">{plan.name}</p>
                      {plan.description && (
                        <p className="text-zinc-400 text-xs mt-0.5">{plan.description}</p>
                      )}
                      <p className="text-amber-600 font-bold mt-1">{formatCurrency(plan.price)}/mês</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`text-xs px-2 py-0.5 rounded-full ${plan.active ? "bg-green-100 text-green-700" : "bg-zinc-100 text-zinc-500"}`}>
                        {plan.active ? "Ativo" : "Inativo"}
                      </span>
                      <PlanActions id={plan.id} active={plan.active} />
                    </div>
                  </div>
                  <PlanServiceAssign
                    planId={plan.id}
                    services={services || []}
                    currentAssignments={
                      (planAssignments || [])
                        .filter((a) => a.plan_id === plan.id)
                        .map((a) => a.service_id)
                    }
                  />
                </div>
              ))
            ) : (
              <p className="text-center text-zinc-400 text-sm py-8">Nenhum plano cadastrado.</p>
            )}
          </div>
        </div>

        {/* Add plan form */}
        <div className="bg-white border border-zinc-100 rounded-xl p-6">
          <h2 className="font-semibold text-zinc-900 mb-4">Criar novo plano</h2>
          <AddPlanForm />
        </div>
      </div>

      {/* Subscribers table */}
      <div className="bg-white border border-zinc-100 rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-zinc-100">
          <h2 className="font-semibold text-zinc-900">Assinantes ({allSubs?.length || 0})</h2>
        </div>
        {allSubs && allSubs.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-zinc-50 border-b border-zinc-100">
                <tr>
                  <th className="text-left px-4 py-3 font-medium text-zinc-600">Cliente</th>
                  <th className="text-left px-4 py-3 font-medium text-zinc-600">Plano</th>
                  <th className="text-left px-4 py-3 font-medium text-zinc-600">Status</th>
                  <th className="text-left px-4 py-3 font-medium text-zinc-600">Próx. cobrança</th>
                </tr>
              </thead>
              <tbody>
                {allSubs.map((sub) => (
                  <tr key={sub.id} className="border-b border-zinc-50 hover:bg-zinc-50 transition-colors">
                    <td className="px-4 py-3 font-medium text-zinc-900">{sub.clients?.name || "—"}</td>
                    <td className="px-4 py-3 text-zinc-700">{sub.subscription_plans?.name || "—"}</td>
                    <td className="px-4 py-3">{statusBadge(sub.status)}</td>
                    <td className="px-4 py-3 text-zinc-500 text-xs">
                      {sub.current_period_end
                        ? new Date(sub.current_period_end).toLocaleDateString("pt-BR")
                        : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-center text-zinc-400 text-sm py-8">Nenhum assinante ainda.</p>
        )}
      </div>
    </div>
  );
}
