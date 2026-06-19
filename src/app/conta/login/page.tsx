import { Suspense } from "react";
import ClientLoginForm from "@/components/subscription/ClientLoginForm";

export default function ClientLoginPage() {
  return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center px-4">
      <Suspense>
        <ClientLoginForm />
      </Suspense>
    </div>
  );
}
