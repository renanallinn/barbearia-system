"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";

interface ClientSession {
  userId: string;
  name: string;
  email: string;
  subscriptionStatus: "active" | "past_due" | "none";
  coveredServiceIds: string[];
}

export default function ClientLoginInline({ onLogin }: { onLogin: (session: ClientSession) => void }) {
  const supabase = createClient();
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const { data: { user }, error: err } = await supabase.auth.signInWithPassword({ email, password });
    if (err || !user) {
      setError("E-mail ou senha incorretos.");
      setLoading(false);
      return;
    }

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

    if (!profile) {
      setError("Conta não encontrada como cliente. Use o cadastro.");
      await supabase.auth.signOut();
      setLoading(false);
      return;
    }

    const sub = subs?.[0];
    const status: "active" | "past_due" | "none" = sub?.status === "active"
      ? "active"
      : sub?.status === "past_due" ? "past_due" : "none";

    const coveredServiceIds: string[] = [];
    if (sub?.status === "active") {
      const planServices = (sub.subscription_plans as unknown as { plan_services: { service_id: string }[] })?.plan_services || [];
      planServices.forEach((ps: { service_id: string }) => coveredServiceIds.push(ps.service_id));
    }

    onLogin({ userId: user.id, name: profile.name, email: user.email || "", subscriptionStatus: status, coveredServiceIds });
    setOpen(false);
    setLoading(false);
  }

  if (!open) {
    return (
      <div className="bg-amber-50 border border-amber-200 rounded-xl px-5 py-3 flex items-center justify-between">
        <p className="text-sm text-amber-800">
          Tem assinatura? Faça login para ver seus benefícios.
        </p>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setOpen(true)}
            className="text-sm font-semibold text-amber-700 hover:text-amber-900 underline"
          >
            Login
          </button>
          <Link href="/conta/registro" className="text-xs text-amber-600 hover:text-amber-800">
            Criar conta
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white border border-zinc-200 rounded-xl p-5">
      <div className="flex items-center justify-between mb-4">
        <p className="font-semibold text-zinc-900 text-sm">Login de assinante</p>
        <button onClick={() => setOpen(false)} className="text-zinc-400 hover:text-zinc-600 text-lg leading-none">×</button>
      </div>
      <form onSubmit={handleLogin} className="space-y-3">
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="E-mail"
          className="w-full border border-zinc-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
        />
        <input
          type="password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Senha"
          className="w-full border border-zinc-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
        />
        {error && <p className="text-red-600 text-xs bg-red-50 rounded-lg px-3 py-2">{error}</p>}
        <div className="flex gap-2">
          <button
            type="submit"
            disabled={loading}
            className="flex-1 bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-black font-semibold text-sm py-2 rounded-lg transition-colors"
          >
            {loading ? "Entrando..." : "Entrar"}
          </button>
          <Link
            href="/conta/registro"
            className="flex-1 text-center border border-zinc-300 text-zinc-600 font-medium text-sm py-2 rounded-lg hover:bg-zinc-50 transition-colors"
          >
            Criar conta
          </Link>
        </div>
      </form>
    </div>
  );
}
