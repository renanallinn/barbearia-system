"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";

export default function AddBarberForm() {
  const router = useRouter();
  const supabase = createClient();
  const [name, setName] = useState("");
  const [bio, setBio] = useState("");
  const [photoUrl, setPhotoUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setLoading(true);
    setError("");
    setSuccess(false);

    const { error: err } = await supabase.from("barbers").insert({
      name: name.trim(),
      bio: bio.trim() || null,
      photo_url: photoUrl.trim() || null,
      active: true,
    });

    setLoading(false);
    if (err) {
      setError("Erro ao cadastrar barbeiro.");
      return;
    }
    setSuccess(true);
    setName("");
    setBio("");
    setPhotoUrl("");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Input
        id="barber-name"
        label="Nome *"
        placeholder="Nome do barbeiro"
        value={name}
        onChange={(e) => setName(e.target.value)}
        required
      />
      <div className="flex flex-col gap-1">
        <label htmlFor="barber-bio" className="text-sm font-medium text-zinc-700">
          Bio (opcional)
        </label>
        <textarea
          id="barber-bio"
          placeholder="Especialidades, experiência..."
          value={bio}
          onChange={(e) => setBio(e.target.value)}
          rows={3}
          className="rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 resize-none"
        />
      </div>
      <Input
        id="barber-photo"
        label="URL da foto (opcional)"
        placeholder="https://..."
        type="url"
        value={photoUrl}
        onChange={(e) => setPhotoUrl(e.target.value)}
      />
      {error && <p className="text-sm text-red-600">{error}</p>}
      {success && (
        <p className="text-sm text-green-600 bg-green-50 rounded-lg px-3 py-2">
          Barbeiro cadastrado com sucesso!
        </p>
      )}
      <Button type="submit" loading={loading} className="w-full">
        Cadastrar barbeiro
      </Button>
    </form>
  );
}
