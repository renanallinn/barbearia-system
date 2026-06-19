export const dynamic = "force-dynamic";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import CheckoutButton from "@/components/subscription/CheckoutButton";

function formatCurrency(value: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);
}

export default async function PlanosPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: plans } = await supabase
    .from("subscription_plans")
    .select("*, plan_services(service_id, services(name, price))")
    .eq("active", true)
    .order("price");

  // Check if logged in user has active subscription
  let activePlanIds: string[] = [];
  if (user) {
    const { data: subs } = await supabase
      .from("client_subscriptions")
      .select("plan_id, status")
      .eq("client_id", user.id)
      .eq("status", "active");
    activePlanIds = (subs || []).map((s) => s.plan_id);
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      <header className="border-b border-zinc-800 px-6 py-4 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-7 h-7 bg-amber-500 rounded-lg flex items-center justify-center text-black font-bold text-xs">✂</div>
          <span className="font-bold text-sm">BarberSystem</span>
        </Link>
        <div className="flex items-center gap-3">
          {user ? (
            <Link href="/conta" className="text-amber-400 text-sm hover:text-amber-300">Minha conta</Link>
          ) : (
            <>
              <Link href="/conta/login" className="text-zinc-400 text-sm hover:text-white">Login</Link>
              <Link href="/conta/registro" className="bg-amber-500 hover:bg-amber-400 text-black font-semibold text-sm px-4 py-2 rounded-lg">Criar conta</Link>
            </>
          )}
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-16">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-3">Planos de Assinatura</h1>
          <p className="text-zinc-400 max-w-md mx-auto">
            Assine um plano e tenha acesso ilimitado aos serviços inclusos por um preço fixo mensal.
          </p>
        </div>

        {plans && plans.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {plans.map((plan) => {
              const isActive = activePlanIds.includes(plan.id);
              const services = plan.plan_services || [];
              return (
                <div
                  key={plan.id}
                  className={`bg-zinc-900 border rounded-2xl p-6 flex flex-col ${
                    isActive ? "border-amber-500" : "border-zinc-800"
                  }`}
                >
                  {isActive && (
                    <span className="text-xs bg-amber-500 text-black font-bold px-3 py-1 rounded-full self-start mb-3">
                      PLANO ATUAL
                    </span>
                  )}
                  <h2 className="text-xl font-bold text-white mb-1">{plan.name}</h2>
                  {plan.description && (
                    <p className="text-zinc-400 text-sm mb-4">{plan.description}</p>
                  )}

                  <div className="mb-4">
                    <span className="text-3xl font-bold text-amber-400">{formatCurrency(plan.price)}</span>
                    <span className="text-zinc-500 text-sm">/mês</span>
                  </div>

                  <div className="flex-1 mb-6">
                    <p className="text-xs text-zinc-500 uppercase font-semibold mb-2">Incluso:</p>
                    <ul className="space-y-1.5">
                      {services.map((ps: { service_id: string; services?: { name: string; price: number } }) => (
                        <li key={ps.service_id} className="flex items-center gap-2 text-sm text-zinc-300">
                          <span className="text-amber-500">✓</span>
                          {ps.services?.name}
                          <span className="text-zinc-600 text-xs ml-auto line-through">
                            {ps.services ? formatCurrency(ps.services.price) : ""}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {isActive ? (
                    <Link
                      href="/agendamento"
                      className="block text-center bg-amber-500 hover:bg-amber-400 text-black font-semibold text-sm px-5 py-2.5 rounded-xl transition-colors"
                    >
                      Agendar horário →
                    </Link>
                  ) : user ? (
                    <CheckoutButton planId={plan.id} />
                  ) : (
                    <Link
                      href={`/conta/registro`}
                      className="block text-center border border-amber-500 text-amber-400 hover:bg-amber-500 hover:text-black font-semibold text-sm px-5 py-2.5 rounded-xl transition-colors"
                    >
                      Criar conta e assinar
                    </Link>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center text-zinc-500 py-16">
            <p>Nenhum plano disponível no momento.</p>
            <Link href="/agendamento" className="text-amber-400 hover:text-amber-300 text-sm mt-2 inline-block">
              Agendar sem assinatura →
            </Link>
          </div>
        )}
      </main>
    </div>
  );
}
