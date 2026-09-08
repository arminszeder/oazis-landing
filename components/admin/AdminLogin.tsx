"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function AdminLogin({ configured }: { configured: boolean }) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError(null);

    try {
      const response = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ name, password }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Nem sikerült a belépés.");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Nem sikerült a belépés.");
      setBusy(false);
    }
  }

  return (
    <main className="admin admin--login">
      <form className="login" onSubmit={submit}>
        <h1 className="login__title">Szervezői felület</h1>
        <p className="login__lead">Oázis Őszi Kupa 2026</p>

        {!configured && (
          <p className="login__warn">
            Nincs beállítva ADMIN_PASSWORD ezen a környezeten, így a belépés nem fog működni.
          </p>
        )}

        <label className="login__field">
          <span>A neved</span>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            autoComplete="name"
            placeholder="Pl. Gergő"
            required
          />
        </label>

        <label className="login__field">
          <span>Jelszó</span>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
            required
          />
        </label>

        <p className="login__hint">
          A neved csak azért kell, hogy lássátok, ki jelölt meg valakit fizetettként.
        </p>

        {error && <p className="login__error">{error}</p>}

        <button className="login__submit" type="submit" disabled={busy}>
          {busy ? "Belépés…" : "Belépés"}
        </button>
      </form>
    </main>
  );
}
