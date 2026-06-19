"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";

export default function ClientLoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get("redirect") || "/conta";
  const supabase = createClient();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const { error: err } = await supabase.auth.signInWithPassword({ email, password });
    if (err) {
      setError("E-mail ou senha incorretos.");
      setLoading(false);
      return;
    }
    router.push(redirect);
    router.refresh();
  }

  return (
    <div className="w-full max-w-sm">
      <div className="text-center mb-8">
        <div className="w-12 h-12 bg-amber-500 rounded-2xl flex items-center justify-center text-black font-bold text-xl mx-auto mb-4">
          ✂
        </div>
        <h1 className="text-2xl font-bold text-white">Área do Cliente</h1>
        <p className="text-zinc-400 text-sm mt-1">Entre para gerenciar sua assinatura</p>
      </div>

      <form onSubmit={handleLogin} className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 space-y-4">
        <div>
          <label className="block text-xs font-medium text-zinc-400 mb-1.5">E-mail</label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="seu@email.com"
            className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 placeholder:text-zinc-600"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-zinc-400 mb-1.5">Senha</label>
          <input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 placeholder:text-zinc-600"
          />
        </div>

        {error && (
          <p className="text-red-400 text-sm bg-red-950 border border-red-900 rounded-xl px-4 py-3">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-black font-semibold py-2.5 rounded-xl transition-colors text-sm"
        >
          {loading ? "Entrando..." : "Entrar"}
        </button>
      </form>

      <p className="text-center text-zinc-500 text-sm mt-4">
        Não tem conta?{" "}
        <Link href="/conta/registro" className="text-amber-400 hover:text-amber-300">
          Criar conta gratuita
        </Link>
      </p>
      <p className="text-center mt-3">
        <Link href="/agendamento" className="text-zinc-600 text-sm hover:text-zinc-400">
          ← Voltar ao agendamento
        </Link>
      </p>
    </div>
  );
}
