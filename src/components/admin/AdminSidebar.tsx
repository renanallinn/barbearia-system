"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/admin", label: "Dashboard", icon: "📊" },
  { href: "/admin/agendamentos", label: "Agendamentos", icon: "📅" },
  { href: "/admin/barbeiros", label: "Barbeiros", icon: "✂️" },
  { href: "/admin/servicos", label: "Serviços", icon: "💈" },
  { href: "/admin/horarios", label: "Horários de Trabalho", icon: "🕐" },
];

export default function AdminSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <aside className="w-60 bg-zinc-950 text-white flex flex-col shrink-0 min-h-screen">
      <div className="p-5 border-b border-zinc-800">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-7 h-7 bg-amber-500 rounded-lg flex items-center justify-center text-black font-bold text-xs">
            ✂
          </div>
          <span className="font-bold text-sm">BarberSystem</span>
        </Link>
        <p className="text-zinc-500 text-xs mt-1">Painel Administrativo</p>
      </div>

      <nav className="flex-1 p-3">
        {navItems.map((item) => {
          const active =
            item.href === "/admin"
              ? pathname === "/admin"
              : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium mb-1 transition-all",
                active
                  ? "bg-amber-500 text-black"
                  : "text-zinc-400 hover:text-white hover:bg-zinc-800"
              )}
            >
              <span>{item.icon}</span>
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="p-3 border-t border-zinc-800">
        <Link
          href="/"
          target="_blank"
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-zinc-400 hover:text-white hover:bg-zinc-800 transition-all mb-1"
        >
          <span>🌐</span>
          Ver site
        </Link>
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-zinc-400 hover:text-red-400 hover:bg-zinc-800 transition-all"
        >
          <span>🚪</span>
          Sair
        </button>
      </div>
    </aside>
  );
}
