"use client";

import { useState } from "react";

export default function LoginPage() {
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function handleLogin(e) {
    e.preventDefault();
    setBusy(true);
    setError("");

    const res = await fetch("/api/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code }),
    });
    const data = await res.json();

    if (!res.ok) {
      setError(data.error || "Login failed");
      setBusy(false);
      return;
    }

    // Go back to the page they came from, if it's a safe local address
    const next = new URLSearchParams(window.location.search).get("next");
    const safe = next && next.startsWith("/") && !next.startsWith("//");
    window.location.href = safe ? next : data.role === "admin" ? "/files" : "/";
  }

  return (
    <main className="mx-auto max-w-sm p-8">
      <h1 className="text-2xl font-bold">Enter class code</h1>
      <form onSubmit={handleLogin} className="mt-6 flex flex-col gap-4">
        <input
          type="password"
          placeholder="Class code"
          className="rounded border p-2 text-black"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          autoFocus
        />
        <button
          type="submit"
          disabled={busy || !code}
          className="rounded bg-blue-600 p-2 font-semibold text-white disabled:opacity-50"
        >
          {busy ? "Checking..." : "Continue"}
        </button>
        {error && <p className="text-red-500">{error}</p>}
      </form>
    </main>
  );
}
