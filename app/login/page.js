"use client";

import { useState } from "react";
import { site } from "../../lib/site";

export default function LoginPage() {
  const [code, setCode] = useState("");
  const [show, setShow] = useState(false);
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
      setError("That code isn't right. Please check it and try again.");
      setBusy(false);
      return;
    }

    const next = new URLSearchParams(window.location.search).get("next");
    const safe = next && next.startsWith("/") && !next.startsWith("//");
    window.location.href = safe ? next : data.role === "admin" ? "/files" : "/";
  }

  return (
    <main className="flex min-h-screen items-center justify-center p-4">
      <div className="w-full max-w-sm rounded-2xl border border-white/10 bg-white/5 p-8 shadow-xl">
        <div className="text-center">
          <div className="text-5xl">🎓</div>
          <h1 className="mt-3 text-2xl font-bold">{site.name}</h1>
          <p className="mt-1 text-sm text-gray-400">{site.tagline}</p>
        </div>

        <form onSubmit={handleLogin} className="mt-8 flex flex-col gap-4">
          <label className="text-sm font-medium" htmlFor="code">
            Class code
          </label>
          <div className="flex gap-2">
            <input
              id="code"
              type={show ? "text" : "password"}
              placeholder="Type your code here"
              className="w-full rounded-lg border border-gray-600 bg-gray-800 p-3 text-white placeholder-gray-500 outline-none focus:border-blue-500"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              autoFocus
              autoCapitalize="none"
              autoCorrect="off"
            />
            <button
              type="button"
              onClick={() => setShow(!show)}
              className="rounded-lg border border-gray-600 px-3 text-sm text-gray-300"
            >
              {show ? "Hide" : "Show"}
            </button>
          </div>
          <p className="-mt-2 text-xs text-gray-500">{site.loginHelp}</p>

          <button
            type="submit"
            disabled={busy || !code}
            className="rounded-lg bg-blue-600 p-3 font-semibold text-white hover:bg-blue-500 disabled:opacity-50"
          >
            {busy ? "Checking..." : "Enter"}
          </button>

          {error && (
            <p className="rounded-lg bg-red-900/40 p-3 text-sm text-red-300">
              {error}
            </p>
          )}
        </form>

        <p className="mt-6 text-center text-xs text-gray-500">{site.contact}</p>
      </div>
    </main>
  );
}
