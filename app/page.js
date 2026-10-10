import { Suspense } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { supabaseAdmin } from "../lib/supabaseAdmin";
import { getRole } from "../lib/session";
import LogoutButton from "./files/LogoutButton";

function typeLabel(type = "") {
  if (type.startsWith("video/")) return "Video";
  if (type.startsWith("audio/")) return "Audio";
  if (type === "application/pdf") return "PDF";
  if (type === "text/plain") return "Text";
  return "Document";
}

async function Library() {
  const role = await getRole();
  if (!role) redirect("/login?next=/");

  const { data: files, error } = await supabaseAdmin
    .from("videos")
    .select("id, title, content_type, size_bytes, created_at")
    .order("created_at", { ascending: false });

  return (
    <main className="mx-auto max-w-3xl p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Class Library</h1>
        <div className="flex items-center gap-4">
          {role === "admin" && (
            <Link href="/files" className="text-sm text-blue-400 underline">
              Manage files
            </Link>
          )}
          <LogoutButton />
        </div>
      </div>

      {error && <p className="mt-4 text-red-500">{error.message}</p>}
      {files?.length === 0 && (
        <p className="mt-6 text-gray-400">Nothing has been shared yet.</p>
      )}

      <ul className="mt-6 flex flex-col gap-3">
        {files?.map((f) => (
          <li key={f.id}>
            <Link
              href={`/watch/${f.id}`}
              className="flex items-center justify-between gap-4 rounded border p-3 hover:bg-gray-800"
            >
              <span className="min-w-0 truncate font-semibold">{f.title}</span>
              <span className="shrink-0 text-sm text-gray-400">
                {typeLabel(f.content_type)} ·{" "}
                {new Date(f.created_at).toLocaleDateString()}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </main>
  );
}

export default function Home() {
  return (
    <Suspense fallback={<p className="p-6">Loading...</p>}>
      <Library />
    </Suspense>
  );
}
