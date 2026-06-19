import { Suspense } from "react";
import Link from "next/link";
import BookingFlow from "@/components/booking/BookingFlow";

export default function AgendamentoPage() {
  return (
    <div className="min-h-screen bg-zinc-50">
      <header className="bg-white border-b border-zinc-200 sticky top-0 z-50">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-amber-500 rounded-lg flex items-center justify-center text-black font-bold text-sm">
              ✂
            </div>
            <span className="font-bold text-zinc-900">BarberSystem</span>
          </Link>
          <span className="text-sm text-zinc-500">Novo Agendamento</span>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-10">
        <Suspense fallback={<div className="text-center text-zinc-400 py-20">Carregando...</div>}>
          <BookingFlow />
        </Suspense>
      </main>
    </div>
  );
}
