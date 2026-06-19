export const dynamic = "force-dynamic";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import AdminSidebar from "@/components/admin/AdminSidebar";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Block clients from accessing admin panel
  const adminEmail = process.env.ADMIN_EMAIL || "renan.allinn@gmail.com";
  if (user.email !== adminEmail) {
    redirect("/conta");
  }

  return (
    <div className="min-h-screen bg-zinc-100 flex">
      <AdminSidebar />
      <main className="flex-1 overflow-auto">
        <div className="max-w-6xl mx-auto px-6 py-8">
          {children}
        </div>
      </main>
    </div>
  );
}
