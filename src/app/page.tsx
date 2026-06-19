export const dynamic = "force-dynamic";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Barber, Service } from "@/lib/types";
import { formatCurrency } from "@/lib/utils";

export default async function HomePage() {
  const supabase = await createClient();

  const { data: barbers } = await supabase
    .from("barbers")
    .select("*")
    .eq("active", true)
    .order("name");

  const { data: services } = await supabase
    .from("services")
    .select("*")
    .eq("active", true)
    .order("name");

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      {/* Header */}
      <header className="border-b border-zinc-800 bg-zinc-950/95 backdrop-blur sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-amber-500 rounded-lg flex items-center justify-center text-black font-bold text-sm">
              ✂
            </div>
            <span className="font-bold text-lg tracking-tight">BarberSystem</span>
          </div>
          <nav className="flex items-center gap-4">
            <a href="#servicos" className="text-sm text-zinc-400 hover:text-white transition-colors hidden sm:block">
              Serviços
            </a>
            <a href="#barbeiros" className="text-sm text-zinc-400 hover:text-white transition-colors hidden sm:block">
              Barbeiros
            </a>
            <Link
              href="/agendamento"
              className="bg-amber-500 hover:bg-amber-400 text-black font-semibold text-sm px-4 py-2 rounded-lg transition-colors"
            >
              Agendar agora
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero */}
      <section className="max-w-6xl mx-auto px-4 py-20 text-center">
        <div className="inline-flex items-center gap-2 bg-zinc-800 rounded-full px-4 py-1.5 text-sm text-zinc-300 mb-6">
          <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
          Agendamento online disponível
        </div>
        <h1 className="text-5xl md:text-6xl font-bold tracking-tight mb-6">
          O melhor corte,
          <br />
          <span className="text-amber-500">no seu horário</span>
        </h1>
        <p className="text-zinc-400 text-lg max-w-xl mx-auto mb-10">
          Escolha seu barbeiro, selecione o serviço e agende em menos de 2 minutos.
          Sem fila, sem espera.
        </p>
        <div className="flex items-center justify-center gap-4 flex-wrap">
          <Link
            href="/agendamento"
            className="bg-amber-500 hover:bg-amber-400 text-black font-bold px-8 py-3.5 rounded-xl text-base transition-colors"
          >
            Agendar horário →
          </Link>
          <a
            href="#servicos"
            className="border border-zinc-700 hover:border-zinc-500 text-zinc-300 font-medium px-8 py-3.5 rounded-xl text-base transition-colors"
          >
            Ver serviços
          </a>
        </div>
      </section>

      {/* Services */}
      <section id="servicos" className="max-w-6xl mx-auto px-4 py-16">
        <h2 className="text-2xl font-bold text-center mb-2">Nossos Serviços</h2>
        <p className="text-zinc-400 text-center mb-10">Qualidade e estilo em cada atendimento</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {services && services.length > 0 ? (
            (services as Service[]).map((service) => (
              <div
                key={service.id}
                className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 hover:border-amber-500/50 transition-colors"
              >
                <div className="flex items-start justify-between mb-2">
                  <h3 className="font-semibold">{service.name}</h3>
                  <span className="text-amber-400 font-bold">
                    {formatCurrency(service.price)}
                  </span>
                </div>
                <p className="text-zinc-500 text-sm">{service.duration_minutes} minutos</p>
              </div>
            ))
          ) : (
            <div className="col-span-3 text-center text-zinc-500 py-8">
              Os serviços serão exibidos após o cadastro pelo administrador.
            </div>
          )}
        </div>
      </section>

      {/* Barbers */}
      <section id="barbeiros" className="max-w-6xl mx-auto px-4 py-16">
        <h2 className="text-2xl font-bold text-center mb-2">Nossa Equipe</h2>
        <p className="text-zinc-400 text-center mb-10">Profissionais experientes e dedicados</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {barbers && barbers.length > 0 ? (
            (barbers as Barber[]).map((barber) => (
              <div
                key={barber.id}
                className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 flex flex-col items-center text-center hover:border-amber-500/50 transition-colors"
              >
                <div className="w-20 h-20 rounded-full bg-zinc-800 mb-4 overflow-hidden flex items-center justify-center">
                  {barber.photo_url ? (
                    <img
                      src={barber.photo_url}
                      alt={barber.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-3xl">✂️</span>
                  )}
                </div>
                <h3 className="font-semibold text-lg">{barber.name}</h3>
                {barber.bio && (
                  <p className="text-zinc-400 text-sm mt-2">{barber.bio}</p>
                )}
                <Link
                  href={`/agendamento?barbeiro=${barber.id}`}
                  className="mt-4 bg-amber-500/10 hover:bg-amber-500 text-amber-400 hover:text-black border border-amber-500/30 hover:border-amber-500 font-medium text-sm px-4 py-2 rounded-lg transition-all"
                >
                  Agendar com {barber.name.split(" ")[0]}
                </Link>
              </div>
            ))
          ) : (
            <div className="col-span-3 text-center text-zinc-500 py-8">
              A equipe será exibida após o cadastro pelo administrador.
            </div>
          )}
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-6xl mx-auto px-4 py-16">
        <div className="bg-amber-500 rounded-2xl p-10 text-center text-black">
          <h2 className="text-3xl font-bold mb-3">Pronto para um novo visual?</h2>
          <p className="mb-6 text-amber-900">Agende agora e garanta seu horário</p>
          <Link
            href="/agendamento"
            className="bg-black text-white font-bold px-8 py-3 rounded-xl hover:bg-zinc-800 transition-colors"
          >
            Agendar horário
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-zinc-800 text-zinc-500 text-center text-sm py-6">
        <div className="max-w-6xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>© 2025 BarberSystem. Todos os direitos reservados.</span>
          <Link href="/login" className="hover:text-zinc-300 transition-colors">
            Área administrativa
          </Link>
        </div>
      </footer>
    </div>
  );
}
