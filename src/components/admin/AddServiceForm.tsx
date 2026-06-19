"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";

export default function AddServiceForm() {
  const router = useRouter();
  const supabase = createClient();
  const [name, setName] = useState("");
  const [duration, setDuration] = useState("30");
  const [price, setPrice] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !price) return;
    setLoading(true);
    setError("");
    setSuccess(false);

    const { error: err } = await supabase.from("services").insert({
      name: name.trim(),
      duration_minutes: parseInt(duration),
      price: parseFloat(price.replace(",", ".")),
      active: true,
    });

    setLoading(false);
    if (err) {
      setError("Erro ao cadastrar serviço.");
      return;
    }
    setSuccess(true);
    setName("");
    setDuration("30");
    setPrice("");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Input
        id="service-name"
        label="Nome do serviço *"
        placeholder="Ex: Corte de cabelo"
        value={name}
        onChange={(e) => setName(e.target.value)}
        required
      />
      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-1">
          <label htmlFor="service-duration" className="text-sm font-medium text-zinc-700">
            Duração (minutos) *
          </label>
          <select
            id="service-duration"
            value={duration}
            onChange={(e) => setDuration(e.target.value)}
            className="border border-zinc-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
          >
            {[15, 20, 30, 45, 60, 75, 90, 120].map((d) => (
              <option key={d} value={d}>
                {d} minutos
              </option>
            ))}
          </select>
        </div>
        <Input
          id="service-price"
          label="Preço (R$) *"
          placeholder="0,00"
          value={price}
          onChange={(e) => setPrice(e.target.value)}
          required
        />
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
      {success && (
        <p className="text-sm text-green-600 bg-green-50 rounded-lg px-3 py-2">
          Serviço cadastrado com sucesso!
        </p>
      )}
      <Button type="submit" loading={loading} className="w-full">
        Cadastrar serviço
      </Button>
    </form>
  );
}
