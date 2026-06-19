"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";

export default function ClientRegistroPage() {
  const router = useRouter();
  const supabase = createClient();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const { data, error: err } = await supabase.auth.signUp({ email, password });
    if (err || !data.user) {
      setError(err?.message || "Erro ao criar conta.");
      setLoading(false);
      return;
    }

    // Create client profile
    const { error: profileErr } = await supabase.from("clients").insert({
      id: data.user.id,
      name: name.trim(),
      phone: phone.trim() || null,
    });

    if (profileErr) {
      setError("Conta criada, mas erro ao salvar perfil. Tente fazer login.");
      setLoading(false);
      return;
    }

    router.push("/conta?novo=true");
    router.refresh();
  }

  return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="w-12 h-12 bg-amber-500 rounded-2xl flex items-center justify-center text-black font-bold text-xl mx-auto mb-4">
            ✂
          </div>
          <h1 className="text-2xl font-bold text-white">Criar conta</h1>
          <p className="text-zinc-400 text-sm mt-1">Cadastre-se para assinar um plano</p>
        </div>

        <form onSubmit={handleRegister} className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 space-y-4">
          <div>
            <label className="block text-xs font-medium text-zinc-400 mb-1.5">Nome completo</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Seu nome"
              className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 placeholder:text-zinc-600"
            />
          </div>
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
            <label className="block text-xs font-medium text-zinc-400 mb-1.5">Telefone / WhatsApp</label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="(11) 99999-9999"
              className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 placeholder:text-zinc-600"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-zinc-400 mb-1.5">Senha</label>
            <input
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Mínimo 6 caracteres"
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
            {loading ? "Criando conta..." : "Criar conta"}
          </button>
        </form>

        <p className="text-center text-zinc-500 text-sm mt-4">
          Já tem conta?{" "}
          <Link href="/conta/login" className="text-amber-400 hover:text-amber-300">
            Fazer login
          </Link>
        </p>
      </div>
    </div>
  );
}
