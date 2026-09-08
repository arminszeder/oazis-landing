import type { Metadata } from "next";
import { currentSession } from "@/lib/admin";
import { configProblem, serverClient } from "@/lib/supabase";
import type { Registration } from "@/lib/registrations";
import { AdminLogin } from "@/components/admin/AdminLogin";
import { Dashboard } from "@/components/admin/Dashboard";
import "./admin.css";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Szervezői felület — Oázis Őszi Kupa",
  robots: { index: false, follow: false },
};

async function registrations(): Promise<Registration[]> {
  const { data, error } = await serverClient()
    .from("registrations")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(5000);

  if (error) throw new Error(`${error.code ?? "?"}: ${error.message}`);
  return (data ?? []) as Registration[];
}

export default async function AdminPage() {
  const session = await currentSession();
  if (!session) return <AdminLogin configured={!!process.env.ADMIN_PASSWORD?.trim()} />;

  if (configProblem()) {
    return (
      <main className="admin admin--message">
        <p>Az adatbázis nincs beállítva ezen a környezeten.</p>
      </main>
    );
  }

  let rows: Registration[];
  try {
    rows = await registrations();
  } catch (err) {
    console.error("admin load failed", err);
    return (
      <main className="admin admin--message">
        <p>Nem sikerült betölteni a nevezéseket. Frissíts rá, vagy nézd meg a logokat.</p>
      </main>
    );
  }

  return <Dashboard rows={rows} organiser={session.name} />;
}
