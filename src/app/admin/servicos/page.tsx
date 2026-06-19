import { createClient } from "@/lib/supabase/server";
import { formatCurrency } from "@/lib/utils";
import AddServiceForm from "@/components/admin/AddServiceForm";
import ServiceActions from "@/components/admin/ServiceActions";
import BarberServiceAssign from "@/components/admin/BarberServiceAssign";

export default async function ServicosPage() {
  const supabase = await createClient();

  const [{ data: services }, { data: barbers }] = await Promise.all([
    supabase.from("services").select("*").order("name"),
    supabase.from("barbers").select("id, name").eq("active", true).order("name"),
  ]);

  const { data: assignments } = await supabase
    .from("barber_services")
    .select("barber_id, service_id");

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-zinc-900">Serviços</h1>
        <p className="text-zinc-500 text-sm mt-1">
          Gerencie os serviços e associe a barbeiros
        </p>
      </div>

      <div className="bg-amber-50 border border-amber-200 rounded-xl px-5 py-3 mb-6 text-sm text-amber-800">
        💡 <strong>Dica:</strong> Clique nos nomes dos barbeiros abaixo de cada serviço para associá-los.
        Se nenhum barbeiro for associado, todos os serviços aparecem disponíveis para todos os barbeiros no agendamento.
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Services list */}
        <div className="bg-white border border-zinc-100 rounded-xl overflow-hidden">
          <div className="px-5 py-4 border-b border-zinc-100">
            <h2 className="font-semibold text-zinc-900">Serviços ({services?.length || 0})</h2>
          </div>
          <div className="divide-y divide-zinc-50">
            {services && services.length > 0 ? (
              services.map((service) => (
                <div key={service.id} className="px-5 py-4">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <p className="font-medium text-zinc-900 text-sm">{service.name}</p>
                      <p className="text-zinc-400 text-xs">
                        {service.duration_minutes} min · {formatCurrency(service.price)}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full ${
                          service.active
                            ? "bg-green-100 text-green-700"
                            : "bg-zinc-100 text-zinc-500"
                        }`}
                      >
                        {service.active ? "Ativo" : "Inativo"}
                      </span>
                      <ServiceActions id={service.id} active={service.active} />
                    </div>
                  </div>
                  {/* Barber assignment */}
                  <BarberServiceAssign
                    serviceId={service.id}
                    barbers={barbers || []}
                    currentAssignments={
                      (assignments || [])
                        .filter((a) => a.service_id === service.id)
                        .map((a) => a.barber_id)
                    }
                  />
                </div>
              ))
            ) : (
              <p className="text-center text-zinc-400 text-sm py-8">
                Nenhum serviço cadastrado.
              </p>
            )}
          </div>
        </div>

        {/* Add form */}
        <div className="bg-white border border-zinc-100 rounded-xl p-6">
          <h2 className="font-semibold text-zinc-900 mb-4">Adicionar serviço</h2>
          <AddServiceForm />
        </div>
      </div>
    </div>
  );
}
