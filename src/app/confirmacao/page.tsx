export const dynamic = "force-dynamic";
import { Suspense } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { formatCurrency, formatDate, formatTime } from "@/lib/utils";

async function ConfirmacaoContent({ id }: { id: string }) {
  const supabase = await createClient();

  const { data: appt } = await supabase
    .from("appointments")
    .select("*, barbers(name), services(name, price, duration_minutes)")
    .eq("id", id)
    .single();

  if (!appt) {
    return (
      <div className="text-center py-20">
        <p className="text-zinc-500">Agendamento não encontrado.</p>
        <Link href="/agendamento" className="text-amber-600 underline mt-4 block">
          Fazer novo agendamento
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto text-center">
      <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
        <svg className="w-10 h-10 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
      </div>

      <h1 className="text-2xl font-bold text-zinc-900 mb-2">
        Agendamento confirmado!
      </h1>
      <p className="text-zinc-500 mb-8">
        Seu horário foi reservado com sucesso. Até lá!
      </p>

      <div className="bg-white border border-zinc-200 rounded-2xl p-6 text-left space-y-4 mb-8">
        <div className="flex justify-between py-2 border-b border-zinc-100">
          <span className="text-zinc-500 text-sm">Cliente</span>
          <span className="font-semibold text-sm">{appt.client_name}</span>
        </div>
        <div className="flex justify-between py-2 border-b border-zinc-100">
          <span className="text-zinc-500 text-sm">Barbeiro</span>
          <span className="font-semibold text-sm">{appt.barbers?.name}</span>
        </div>
        <div className="flex justify-between py-2 border-b border-zinc-100">
          <span className="text-zinc-500 text-sm">Serviço</span>
          <span className="font-semibold text-sm">{appt.services?.name}</span>
        </div>
        <div className="flex justify-between py-2 border-b border-zinc-100">
          <span className="text-zinc-500 text-sm">Data</span>
          <span className="font-semibold text-sm">{formatDate(appt.date)}</span>
        </div>
        <div className="flex justify-between py-2 border-b border-zinc-100">
          <span className="text-zinc-500 text-sm">Horário</span>
          <span className="font-semibold text-sm">{formatTime(appt.start_time)}</span>
        </div>
        <div className="flex justify-between py-2">
          <span className="text-zinc-500 text-sm">Valor</span>
          <span className="font-bold text-amber-600">
            {formatCurrency(appt.services?.price || 0)}
          </span>
        </div>
      </div>

      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-8">
        <p className="text-amber-800 text-sm">
          💡 <strong>Dica:</strong> Salve esta página ou anote o número do seu agendamento:{" "}
          <code className="font-mono text-xs bg-amber-100 px-1 rounded">{id.slice(0, 8).toUpperCase()}</code>
        </p>
      </div>

      <div className="flex flex-col gap-3">
        <Link
          href="/agendamento"
          className="block w-full bg-amber-500 hover:bg-amber-400 text-black font-semibold py-3 rounded-xl transition-colors"
        >
          Fazer outro agendamento
        </Link>
        <Link
          href="/"
          className="block w-full border border-zinc-300 hover:bg-zinc-50 text-zinc-700 font-medium py-3 rounded-xl transition-colors"
        >
          Voltar ao início
        </Link>
      </div>
    </div>
  );
}

export default async function ConfirmacaoPage({
  searchParams,
}: {
  searchParams: Promise<{ id?: string }>;
}) {
  const { id } = await searchParams;

  return (
    <div className="min-h-screen bg-zinc-50">
      <header className="bg-white border-b border-zinc-200">
        <div className="max-w-3xl mx-auto px-4 py-4">
          <Link href="/" className="flex items-center gap-2 w-fit">
            <div className="w-8 h-8 bg-amber-500 rounded-lg flex items-center justify-center text-black font-bold text-sm">
              ✂
            </div>
            <span className="font-bold text-zinc-900">BarberSystem</span>
          </Link>
        </div>
      </header>
      <main className="max-w-3xl mx-auto px-4 py-16">
        <Suspense fallback={<div className="text-center text-zinc-400">Carregando...</div>}>
          {id ? (
            <ConfirmacaoContent id={id} />
          ) : (
            <div className="text-center text-zinc-400 py-20">
              ID de agendamento não encontrado.
            </div>
          )}
        </Suspense>
      </main>
    </div>
  );
}
