"use client";
export const dynamic = "force-dynamic";

export default function DiagnosticoPage() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  return (
    <div style={{ padding: 32, fontFamily: "monospace" }}>
      <h2>Diagnóstico de variáveis</h2>
      <p><strong>SUPABASE_URL:</strong> {url || "NÃO DEFINIDA"}</p>
      <p><strong>ANON_KEY (primeiros 30 chars):</strong> {key ? key.slice(0, 30) + "..." : "NÃO DEFINIDA"}</p>
    </div>
  );
}
