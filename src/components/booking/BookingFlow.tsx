"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Barber, Service, WorkingHour, Appointment } from "@/lib/types";
import DatePicker from "@/components/booking/DatePicker";
import ClientLoginInline from "@/components/booking/ClientLoginInline";
import {
  formatCurrency,
  formatDate,
  formatTime,
  generateSlots,
  addMinutes,
} from "@/lib/utils";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";

type Step = 1 | 2 | 3 | 4;

interface BookingData {
  barberId: string;
  serviceId: string;
  date: string;
  time: string;
  clientName: string;
  clientPhone: string;
  clientEmail: string;
}

interface ClientSession {
  userId: string;
  name: string;
  email: string;
  subscriptionStatus: "active" | "past_due" | "none";
  coveredServiceIds: string[];
}

export default function BookingFlow() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();

  const [step, setStep] = useState<Step>(1);
  const [barbers, setBarbers] = useState<Barber[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [workingHours, setWorkingHours] = useState<WorkingHour[]>([]);
  const [availableSlots, setAvailableSlots] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [clientSession, setClientSession] = useState<ClientSession | null>(null);
  const [checkingAuth, setCheckingAuth] = useState(true);

  const [data, setData] = useState<BookingData>({
    barberId: searchParams.get("barbeiro") || "",
    serviceId: "",
    date: "",
    time: "",
    clientName: "",
    clientPhone: "",
    clientEmail: "",
  });

  const selectedBarber = barbers.find((b) => b.id === data.barberId);
  const selectedService = services.find((s) => s.id === data.serviceId);
  const isCovered = clientSession?.coveredServiceIds.includes(data.serviceId) ?? false;
  const isBlocked = clientSession?.subscriptionStatus === "past_due";

  // Check logged-in client on mount
  useEffect(() => {
    async function checkAuth() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setCheckingAuth(false); return; }

      // Fetch client profile and subscription
      const [{ data: profile }, { data: subs }] = await Promise.all([
        supabase.from("clients").select("name, phone").eq("id", user.id).single(),
        supabase
          .from("client_subscriptions")
          .select("status, plan_id, subscription_plans(plan_services(service_id))")
          .eq("client_id", user.id)
          .in("status", ["active", "past_due"])
          .order("created_at", { ascending: false })
          .limit(1),
      ]);

      if (!profile) { setCheckingAuth(false); return; }

      const sub = subs?.[0];
      const status: "active" | "past_due" | "none" = sub?.status === "active"
        ? "active"
        : sub?.status === "past_due" ? "past_due" : "none";

      const coveredServiceIds: string[] = [];
      if (sub?.status === "active") {
        const planServices = (sub.subscription_plans as unknown as { plan_services: { service_id: string }[] })?.plan_services || [];
        planServices.forEach((ps: { service_id: string }) => coveredServiceIds.push(ps.service_id));
      }

      setClientSession({
        userId: user.id,
        name: profile.name,
        email: user.email || "",
        subscriptionStatus: status,
        coveredServiceIds,
      });
      // Pre-fill client data
      setData((d) => ({
        ...d,
        clientName: profile.name,
        clientEmail: user.email || "",
        clientPhone: profile.phone || "",
      }));
      setCheckingAuth(false);
    }
    checkAuth();
  }, []);

  // Load barbers on mount
  useEffect(() => {
    supabase
      .from("barbers")
      .select("*")
      .eq("active", true)
      .order("name")
      .then(({ data }) => setBarbers(data || []));
  }, []);

  // Load services when barber is selected
  useEffect(() => {
    if (!data.barberId) return;
    setLoading(true);
    Promise.all([
      supabase
        .from("barber_services")
        .select("service_id")
        .eq("barber_id", data.barberId)
        .then(async ({ data: bs }) => {
          if (bs && bs.length > 0) {
            const ids = bs.map((b: { service_id: string }) => b.service_id);
            const { data: svcs } = await supabase
              .from("services").select("*").in("id", ids).eq("active", true).order("name");
            return svcs || [];
          } else {
            const { data: svcs } = await supabase
              .from("services").select("*").eq("active", true).order("name");
            return svcs || [];
          }
        }),
      supabase.from("working_hours").select("*").eq("barber_id", data.barberId),
    ]).then(([svcs, { data: wh }]) => {
      setServices(svcs || []);
      setWorkingHours(wh || []);
      setLoading(false);
    });
  }, [data.barberId]);

  // Load available slots when date or service changes
  useEffect(() => {
    if (!data.barberId || !data.date || !data.serviceId) return;
    const dateObj = new Date(data.date + "T12:00:00");
    const dayOfWeek = dateObj.getDay();
    const wh = workingHours.find((w) => w.day_of_week === dayOfWeek);
    const effectiveWh = wh || { start_time: "08:00", end_time: "18:00" };
    setLoading(true);
    Promise.all([
      supabase.from("appointments").select("start_time, end_time")
        .eq("barber_id", data.barberId).eq("date", data.date).neq("status", "cancelado"),
      supabase.from("blocked_slots").select("start_time, end_time")
        .eq("barber_id", data.barberId).eq("date", data.date),
    ]).then(([{ data: appts }, { data: blocked }]) => {
      const dur = selectedService?.duration_minutes || 30;
      const all = generateSlots(effectiveWh.start_time, effectiveWh.end_time, dur);
      const free = all.filter((slot) => {
        const slotStartMin = timeToMin(slot);
        const slotEndMin = timeToMin(addMinutes(slot, dur));
        const conflictsAppt = (appts || []).some((a) => {
          const aStart = timeToMin(a.start_time);
          const aEnd = timeToMin(a.end_time);
          return slotStartMin < aEnd && slotEndMin > aStart;
        });
        const conflictsBlocked = (blocked || []).some((b) => {
          const bStart = timeToMin(b.start_time);
          const bEnd = timeToMin(b.end_time);
          return slotStartMin < bEnd && slotEndMin > bStart;
        });
        return !conflictsAppt && !conflictsBlocked;
      });
      setAvailableSlots(free);
      setLoading(false);
    });
  }, [data.date, data.serviceId, data.barberId]);

  function timeToMin(t: string) {
    const [h, m] = t.split(":").map(Number);
    return h * 60 + m;
  }

  async function handleSubmit() {
    if (!selectedBarber || !selectedService) return;
    if (isBlocked) {
      setError("Sua assinatura está com pagamento pendente. Regularize para agendar.");
      return;
    }
    setSubmitting(true);
    setError("");
    const endTime = addMinutes(data.time, selectedService.duration_minutes);

    const { data: appt, error: err } = await supabase
      .from("appointments")
      .insert({
        barber_id: data.barberId,
        service_id: data.serviceId,
        date: data.date,
        start_time: data.time + ":00",
        end_time: endTime,
        client_name: data.clientName.trim(),
        client_phone: data.clientPhone.trim(),
        client_email: data.clientEmail.trim() || null,
        status: "pendente",
        subscription_covered: isCovered,
      })
      .select()
      .single();

    setSubmitting(false);
    if (err) {
      setError("Erro ao confirmar agendamento. Tente novamente.");
      return;
    }
    router.push(`/confirmacao?id=${appt.id}`);
  }

  const stepLabels = ["Barbeiro", "Serviço", "Horário", "Confirmação"];

  return (
    <div className="max-w-2xl mx-auto">
      {/* Client session banner */}
      {!checkingAuth && (
        <div className="mb-6">
          {clientSession ? (
            <div className={`rounded-xl px-5 py-3 flex items-center justify-between text-sm ${
              isBlocked
                ? "bg-red-50 border border-red-200"
                : clientSession.subscriptionStatus === "active"
                ? "bg-amber-50 border border-amber-200"
                : "bg-zinc-50 border border-zinc-200"
            }`}>
              <div>
                <p className={`font-semibold ${isBlocked ? "text-red-700" : "text-zinc-900"}`}>
                  Olá, {clientSession.name}!
                </p>
                {isBlocked ? (
                  <p className="text-red-600 text-xs mt-0.5">
                    Assinatura bloqueada por inadimplência.{" "}
                    <a href="/conta" className="underline">Regularizar →</a>
                  </p>
                ) : clientSession.subscriptionStatus === "active" ? (
                  <p className="text-amber-700 text-xs mt-0.5">
                    Assinatura ativa — serviços cobertos aparecem gratuitos abaixo.
                  </p>
                ) : (
                  <p className="text-zinc-500 text-xs mt-0.5">
                    Sem assinatura.{" "}
                    <a href="/planos" className="text-amber-600 hover:underline">Ver planos →</a>
                  </p>
                )}
              </div>
              <button
                onClick={async () => {
                  await supabase.auth.signOut();
                  setClientSession(null);
                  setData((d) => ({ ...d, clientName: "", clientEmail: "", clientPhone: "" }));
                }}
                className="text-xs text-zinc-400 hover:text-zinc-600 ml-4"
              >
                Sair
              </button>
            </div>
          ) : (
            <ClientLoginInline onLogin={(session) => {
              setClientSession(session);
              setData((d) => ({
                ...d,
                clientName: session.name,
                clientEmail: session.email,
              }));
            }} />
          )}
        </div>
      )}

      {/* Steps indicator */}
      <div className="flex items-center gap-2 mb-8">
        {stepLabels.map((label, i) => {
          const s = (i + 1) as Step;
          const active = step === s;
          const done = step > s;
          return (
            <div key={s} className="flex items-center gap-2 flex-1">
              <div className="flex items-center gap-2 flex-1">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 transition-all ${
                    done ? "bg-green-500 text-white" : active ? "bg-amber-500 text-black" : "bg-zinc-200 text-zinc-400"
                  }`}
                >
                  {done ? "✓" : s}
                </div>
                <span className={`text-sm font-medium hidden sm:block ${active ? "text-zinc-900" : "text-zinc-400"}`}>
                  {label}
                </span>
              </div>
              {i < stepLabels.length - 1 && (
                <div className={`h-0.5 flex-1 ${done ? "bg-green-500" : "bg-zinc-200"}`} />
              )}
            </div>
          );
        })}
      </div>

      {/* Step 1: Choose Barber */}
      {step === 1 && (
        <div>
          <h2 className="text-xl font-bold text-zinc-900 mb-1">Escolha o barbeiro</h2>
          <p className="text-zinc-500 text-sm mb-6">Selecione com quem deseja ser atendido</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {barbers.map((barber) => (
              <button
                key={barber.id}
                onClick={() => {
                  setData((d) => ({ ...d, barberId: barber.id, serviceId: "", date: "", time: "" }));
                  setStep(2);
                }}
                className={`flex items-center gap-4 p-4 rounded-xl border-2 text-left transition-all ${
                  data.barberId === barber.id
                    ? "border-amber-500 bg-amber-50"
                    : "border-zinc-200 hover:border-amber-300 bg-white"
                }`}
              >
                <div className="w-14 h-14 rounded-full bg-zinc-200 overflow-hidden flex-shrink-0 flex items-center justify-center">
                  {barber.photo_url ? (
                    <img src={barber.photo_url} alt={barber.name} className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-2xl">✂️</span>
                  )}
                </div>
                <div>
                  <p className="font-semibold text-zinc-900">{barber.name}</p>
                  {barber.bio && (
                    <p className="text-zinc-500 text-xs mt-0.5 line-clamp-2">{barber.bio}</p>
                  )}
                </div>
              </button>
            ))}
          </div>
          {barbers.length === 0 && (
            <p className="text-center text-zinc-400 py-8">Nenhum barbeiro disponível no momento.</p>
          )}
        </div>
      )}

      {/* Step 2: Choose Service */}
      {step === 2 && (
        <div>
          <button onClick={() => setStep(1)} className="text-sm text-zinc-500 hover:text-zinc-700 mb-4 flex items-center gap-1">
            ← Voltar
          </button>
          <h2 className="text-xl font-bold text-zinc-900 mb-1">Escolha o serviço</h2>
          <p className="text-zinc-500 text-sm mb-6">
            Atendimento com <strong>{selectedBarber?.name}</strong>
          </p>
          {loading ? (
            <div className="text-center py-8 text-zinc-400">Carregando serviços...</div>
          ) : (
            <div className="flex flex-col gap-3">
              {services.map((service) => {
                const covered = clientSession?.coveredServiceIds.includes(service.id) ?? false;
                return (
                  <button
                    key={service.id}
                    onClick={() => {
                      setData((d) => ({ ...d, serviceId: service.id, date: "", time: "" }));
                      setStep(3);
                    }}
                    className={`flex items-center justify-between p-4 rounded-xl border-2 text-left transition-all ${
                      data.serviceId === service.id
                        ? "border-amber-500 bg-amber-50"
                        : "border-zinc-200 hover:border-amber-300 bg-white"
                    }`}
                  >
                    <div>
                      <p className="font-semibold text-zinc-900">{service.name}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <p className="text-zinc-500 text-sm">{service.duration_minutes} minutos</p>
                        {covered && (
                          <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium">
                            Assinatura
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      {covered ? (
                        <div>
                          <span className="text-zinc-400 text-sm line-through">{formatCurrency(service.price)}</span>
                          <p className="text-green-600 font-bold text-lg">R$ 0,00</p>
                        </div>
                      ) : (
                        <span className="text-amber-600 font-bold text-lg">{formatCurrency(service.price)}</span>
                      )}
                    </div>
                  </button>
                );
              })}
              {services.length === 0 && (
                <p className="text-center text-zinc-400 py-8">Este barbeiro não possui serviços cadastrados.</p>
              )}
            </div>
          )}
        </div>
      )}

      {/* Step 3: Choose Date & Time */}
      {step === 3 && (
        <div>
          <button onClick={() => setStep(2)} className="text-sm text-zinc-500 hover:text-zinc-700 mb-4 flex items-center gap-1">
            ← Voltar
          </button>
          <h2 className="text-xl font-bold text-zinc-900 mb-1">Escolha a data e horário</h2>
          <p className="text-zinc-500 text-sm mb-6">
            <strong>{selectedService?.name}</strong> com <strong>{selectedBarber?.name}</strong>
          </p>
          <DatePicker
            selected={data.date}
            onSelect={(date) => { setData((d) => ({ ...d, date, time: "" })); setAvailableSlots([]); }}
            workingHours={workingHours}
          />
          {data.date && (
            <div className="mt-4 bg-white border border-zinc-200 rounded-xl p-5">
              <p className="text-sm font-medium text-zinc-700 mb-3">
                Horários disponíveis em <strong>{formatDate(data.date)}</strong>
              </p>
              {loading ? (
                <div className="flex items-center gap-2 text-zinc-400 text-sm py-2">
                  <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Buscando horários...
                </div>
              ) : availableSlots.length > 0 ? (
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                  {availableSlots.map((slot) => (
                    <button
                      key={slot}
                      onClick={() => setData((d) => ({ ...d, time: slot }))}
                      className={`py-2.5 rounded-xl text-sm font-semibold border-2 transition-all ${
                        data.time === slot
                          ? "border-amber-500 bg-amber-500 text-black shadow-sm"
                          : "border-zinc-200 hover:border-amber-400 hover:bg-amber-50 text-zinc-700"
                      }`}
                    >
                      {formatTime(slot)}
                    </button>
                  ))}
                </div>
              ) : (
                <div className="text-center py-4">
                  <p className="text-zinc-400 text-sm">Nenhum horário disponível neste dia.</p>
                  <p className="text-zinc-400 text-xs mt-1">Escolha outra data no calendário.</p>
                </div>
              )}
            </div>
          )}
          <div className="mt-6">
            <Button size="lg" className="w-full" disabled={!data.date || !data.time} onClick={() => setStep(4)}>
              Continuar →
            </Button>
          </div>
        </div>
      )}

      {/* Step 4: Client info & confirm */}
      {step === 4 && (
        <div>
          <button onClick={() => setStep(3)} className="text-sm text-zinc-500 hover:text-zinc-700 mb-4 flex items-center gap-1">
            ← Voltar
          </button>
          <h2 className="text-xl font-bold text-zinc-900 mb-1">Confirme seus dados</h2>
          <p className="text-zinc-500 text-sm mb-6">Quase lá! Preencha seus dados para confirmar.</p>

          {/* Summary */}
          <div className="bg-zinc-900 text-white rounded-xl p-5 mb-6 space-y-2">
            <p className="text-zinc-400 text-xs uppercase font-semibold tracking-wide mb-3">Resumo do agendamento</p>
            <div className="flex justify-between">
              <span className="text-zinc-400 text-sm">Barbeiro</span>
              <span className="font-medium text-sm">{selectedBarber?.name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-400 text-sm">Serviço</span>
              <span className="font-medium text-sm">{selectedService?.name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-400 text-sm">Data</span>
              <span className="font-medium text-sm">{formatDate(data.date)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-400 text-sm">Horário</span>
              <span className="font-medium text-sm">{formatTime(data.time)}</span>
            </div>
            <div className="border-t border-zinc-700 pt-2 mt-2 flex justify-between items-center">
              <span className="text-zinc-400 text-sm">Total</span>
              <div className="text-right">
                {isCovered ? (
                  <div>
                    <span className="text-zinc-500 text-sm line-through mr-2">{formatCurrency(selectedService?.price || 0)}</span>
                    <span className="font-bold text-green-400 text-base">R$ 0,00</span>
                    <p className="text-green-500 text-xs">Coberto pela assinatura</p>
                  </div>
                ) : (
                  <span className="font-bold text-amber-400 text-base">{formatCurrency(selectedService?.price || 0)}</span>
                )}
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <Input
              id="name"
              label="Nome completo *"
              placeholder="Seu nome"
              value={data.clientName}
              onChange={(e) => setData((d) => ({ ...d, clientName: e.target.value }))}
              required
            />
            <Input
              id="phone"
              label="Telefone / WhatsApp *"
              placeholder="(11) 99999-9999"
              type="tel"
              value={data.clientPhone}
              onChange={(e) => setData((d) => ({ ...d, clientPhone: e.target.value }))}
              required
            />
            <Input
              id="email"
              label="E-mail (opcional)"
              placeholder="seu@email.com"
              type="email"
              value={data.clientEmail}
              onChange={(e) => setData((d) => ({ ...d, clientEmail: e.target.value }))}
            />
          </div>

          {isBlocked && (
            <div className="mt-4 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-3">
              Sua assinatura está com pagamento pendente. <a href="/conta" className="underline font-medium">Regularize aqui</a> para agendar.
            </div>
          )}

          {error && (
            <p className="mt-4 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-3">{error}</p>
          )}

          <Button
            size="lg"
            className="w-full mt-6"
            loading={submitting}
            disabled={!data.clientName.trim() || !data.clientPhone.trim() || isBlocked}
            onClick={handleSubmit}
          >
            Confirmar agendamento
          </Button>
          <p className="text-xs text-zinc-400 text-center mt-3">
            Ao confirmar, você concorda com os termos de uso da barbearia.
          </p>
        </div>
      )}
    </div>
  );
}
