export const dynamic = "force-dynamic";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import ClientSignOut from "@/components/subscription/ClientSignOut";

function statusLabel(status: string) {
  if (status === "active") return { text: "Ativa", color: "bg-green-100 text-green-700" };
  if (status === "past_due") return { text: "Pagamento pendente", color: "bg-red-100 text-red-700" };
  if (status === "canceled") return { text: "Cancelada", color: "bg-zinc-100 text-zinc-500" };
  return { text: "Pausada", color: "bg-yellow-100 text-yellow-700" };
}

export default async function ContaPage({
  searchParams,
}: {
  searchParams: Promise<{ assinatura?: string; novo?: string }>;
}) {
  const params = await searchParams;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/conta/login");

  // Redirect admin to admin panel
  if (user.email === process.env.ADMIN_EMAIL) redirect("/admin");

  const [{ data: profile }, { data: subscriptions }] = await Promise.all([
    supabase.from("clients").select("*").eq("id", user.id).single(),
    supabase
      .from("client_subscriptions")
      .select("*, subscription_plans(*, plan_services(service_id, services(name)))")
      .eq("client_id", user.id)
      .order("created_at", { ascending: false }),
  ]);

  // If no profile, create one
  if (!profile) {
    await supabase.from("clients").insert({ id: user.id, name: user.email?.split("@")[0] || "Cliente" });
  }

  const activeSub = subscriptions?.find((s) => s.status === "active");
  const pastDueSub = subscriptions?.find((s) => s.status === "past_due");

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      {/* Header */}
      <header className="border-b border-zinc-800 px-6 py-4 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-7 h-7 bg-amber-500 rounded-lg flex items-center justify-center text-black font-bold text-xs">✂</div>
          <span className="font-bold text-sm">BarberSystem</span>
        </Link>
        <div className="flex items-center gap-4">
          <span className="text-zinc-400 text-sm">{user.email}</span>
          <ClientSignOut />
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-6 py-10">
        {params.assinatura === "sucesso" && (
          <div className="bg-green-900/40 border border-green-700 rounded-xl px-5 py-4 mb-6 text-green-300 text-sm">
            Assinatura ativada com sucesso! Seus serviços aparecerão com R$0,00 no agendamento.
          </div>
        )}
        {params.novo === "true" && (
          <div className="bg-amber-900/40 border border-amber-700 rounded-xl px-5 py-4 mb-6 text-amber-300 text-sm">
            Conta criada! Agora assine um plano para ter acesso à barbearia por assinatura.
          </div>
        )}

        {pastDueSub && (
          <div className="bg-red-900/40 border border-red-700 rounded-xl px-5 py-4 mb-6 text-red-300 text-sm">
            <strong>Pagamento recusado.</strong> Sua assinatura está bloqueada até que o pagamento seja regularizado.
            Acesse o portal de pagamento para atualizar seu cartão.
          </div>
        )}

        <h1 className="text-2xl font-bold mb-6">Minha Conta</h1>

        {/* Active subscription */}
        {activeSub ? (
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 mb-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <p className="text-xs text-zinc-500 uppercase font-semibold tracking-wide mb-1">Assinatura atual</p>
                <h2 className="text-xl font-bold text-amber-400">{activeSub.subscription_plans?.name}</h2>
              </div>
              <span className={`text-xs font-medium px-3 py-1 rounded-full ${statusLabel(activeSub.status).color}`}>
                {statusLabel(activeSub.status).text}
              </span>
            </div>
            <p className="text-zinc-400 text-sm mb-4">{activeSub.subscription_plans?.description}</p>

            <div className="mb-4">
              <p className="text-xs text-zinc-500 mb-2 uppercase font-semibold">Serviços inclusos</p>
              <div className="flex flex-wrap gap-2">
                {activeSub.subscription_plans?.plan_services?.map((ps: { service_id: string; services?: { name: string } }) => (
                  <span key={ps.service_id} className="bg-amber-500/10 text-amber-400 border border-amber-500/30 text-xs px-3 py-1 rounded-full">
                    {ps.services?.name}
                  </span>
                ))}
              </div>
            </div>

            {activeSub.current_period_end && (
              <p className="text-zinc-500 text-xs">
                Próxima cobrança: {new Date(activeSub.current_period_end).toLocaleDateString("pt-BR")}
              </p>
            )}

            <div className="mt-4 pt-4 border-t border-zinc-800">
              <Link
                href="/agendamento"
                className="inline-block bg-amber-500 hover:bg-amber-400 text-black font-semibold text-sm px-5 py-2.5 rounded-xl transition-colors"
              >
                Agendar horário →
              </Link>
            </div>
          </div>
        ) : (
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 mb-6 text-center">
            <p className="text-zinc-400 text-sm mb-4">Você não possui assinatura ativa.</p>
            <Link
              href="/planos"
              className="inline-block bg-amber-500 hover:bg-amber-400 text-black font-semibold text-sm px-5 py-2.5 rounded-xl transition-colors"
            >
              Ver planos disponíveis
            </Link>
          </div>
        )}

        {/* Subscription history */}
        {subscriptions && subscriptions.length > 1 && (
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
            <h3 className="font-semibold text-sm text-zinc-300 mb-3">Histórico de assinaturas</h3>
            <div className="space-y-2">
              {subscriptions.slice(1).map((sub) => {
                const st = statusLabel(sub.status);
                return (
                  <div key={sub.id} className="flex items-center justify-between text-sm">
                    <span className="text-zinc-400">{sub.subscription_plans?.name}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${st.color}`}>{st.text}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
