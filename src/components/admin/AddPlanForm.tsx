"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function AddPlanForm() {
  const router = useRouter();
  const supabase = createClient();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const { error: err } = await supabase.from("subscription_plans").insert({
      name: name.trim(),
      description: description.trim() || null,
      price: parseFloat(price.replace(",", ".")),
    });

    setLoading(false);
    if (err) {
      setError("Erro ao criar plano: " + err.message);
      return;
    }
    setName("");
    setDescription("");
    setPrice("");
    router.refresh();
  }

  const inputCls = "w-full border border-zinc-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500";

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-xs font-medium text-zinc-500 mb-1.5">Nome do plano *</label>
        <input required value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex: Plano Corte Mensal" className={inputCls} />
      </div>
      <div>
        <label className="block text-xs font-medium text-zinc-500 mb-1.5">Descrição</label>
        <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Descrição breve do plano" rows={2} className={inputCls} />
      </div>
      <div>
        <label className="block text-xs font-medium text-zinc-500 mb-1.5">Preço mensal (R$) *</label>
        <input required type="text" inputMode="decimal" value={price} onChange={(e) => setPrice(e.target.value)} placeholder="59,90" className={inputCls} />
      </div>
      {error && <p className="text-red-600 text-sm bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</p>}
      <button
        type="submit"
        disabled={loading}
        className="w-full bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-black font-semibold text-sm px-4 py-2.5 rounded-lg transition-colors"
      >
        {loading ? "Criando..." : "Criar plano"}
      </button>
    </form>
  );
}
