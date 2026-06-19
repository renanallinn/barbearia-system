"use client";

import { useState } from "react";

export default function CheckoutButton({ planId }: { planId: string }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleCheckout() {
    setLoading(true);
    setError("");
    const res = await fetch("/api/stripe/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ planId }),
    });
    const data = await res.json();
    if (data.url) {
      window.location.href = data.url;
    } else {
      setError(data.error || "Erro ao iniciar pagamento.");
      setLoading(false);
    }
  }

  return (
    <div>
      <button
        onClick={handleCheckout}
        disabled={loading}
        className="w-full bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-black font-semibold text-sm px-5 py-2.5 rounded-xl transition-colors"
      >
        {loading ? "Aguarde..." : "Assinar agora"}
      </button>
      {error && <p className="text-red-400 text-xs mt-2 text-center">{error}</p>}
    </div>
  );
}
