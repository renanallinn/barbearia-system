import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import BarberActions from "@/components/admin/BarberActions";
import AddBarberForm from "@/components/admin/AddBarberForm";

export default async function BarbeirosPage() {
  const supabase = await createClient();
  const { data: barbers } = await supabase
    .from("barbers")
    .select("*")
    .order("name");

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900">Barbeiros</h1>
          <p className="text-zinc-500 text-sm mt-1">Gerencie a equipe da barbearia</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* List */}
        <div className="bg-white border border-zinc-100 rounded-xl overflow-hidden">
          <div className="px-5 py-4 border-b border-zinc-100">
            <h2 className="font-semibold text-zinc-900">Equipe ({barbers?.length || 0})</h2>
          </div>
          <div className="divide-y divide-zinc-50">
            {barbers && barbers.length > 0 ? (
              barbers.map((barber) => (
                <div key={barber.id} className="flex items-center gap-4 px-5 py-4">
                  <div className="w-10 h-10 rounded-full bg-zinc-200 overflow-hidden flex-shrink-0 flex items-center justify-center">
                    {barber.photo_url ? (
                      <img src={barber.photo_url} alt={barber.name} className="w-full h-full object-cover" />
                    ) : (
                      <span>✂️</span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-zinc-900 text-sm">{barber.name}</p>
                    {barber.bio && (
                      <p className="text-zinc-400 text-xs truncate">{barber.bio}</p>
                    )}
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full ${
                        barber.active
                          ? "bg-green-100 text-green-700"
                          : "bg-zinc-100 text-zinc-500"
                      }`}
                    >
                      {barber.active ? "Ativo" : "Inativo"}
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <Link
                      href={`/admin/horarios?barbeiro=${barber.id}`}
                      className="text-xs text-blue-600 hover:underline"
                    >
                      Horários
                    </Link>
                    <BarberActions id={barber.id} active={barber.active} />
                  </div>
                </div>
              ))
            ) : (
              <p className="text-center text-zinc-400 text-sm py-8">
                Nenhum barbeiro cadastrado.
              </p>
            )}
          </div>
        </div>

        {/* Add form */}
        <div className="bg-white border border-zinc-100 rounded-xl p-6">
          <h2 className="font-semibold text-zinc-900 mb-4">Adicionar barbeiro</h2>
          <AddBarberForm />
        </div>
      </div>
    </div>
  );
}
