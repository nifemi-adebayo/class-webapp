import { Suspense } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { supabaseAdmin } from "../../lib/supabaseAdmin";
import { getRole } from "../../lib/session";
import DeleteButton from "./DeleteButton";
import Header from "../components/Header";

async function FileList() {
  const role = await getRole();
  if (role !== "admin") redirect("/login?next=/files");

  const { data: files, error } = await supabaseAdmin
    .from("videos")
    .select("id, title, content_type, size_bytes, created_at")
    .order("created_at", { ascending: false });

  return (
    <>
      <Header role="admin" />
      <main className="mx-auto max-w-3xl p-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Your files</h1>
        </div>

        {error && <p className="mt-4 text-red-500">{error.message}</p>}
        {files?.length === 0 && (
          <p className="mt-6 text-gray-400">Nothing uploaded yet.</p>
        )}

        <ul className="mt-6 flex flex-col gap-3">
          {files?.map((f) => (
            <li
              key={f.id}
              className="flex items-center justify-between gap-4 rounded border p-3"
            >
              <div className="min-w-0">
                <Link
                  href={`/watch/${f.id}`}
                  className="block truncate font-semibold text-blue-400 underline"
                >
                  {f.title}
                </Link>
                <p className="text-sm text-gray-400">
                  {new Date(f.created_at).toLocaleDateString()} ·{" "}
                  {f.content_type || "unknown"} ·{" "}
                  {f.size_bytes
                    ? (f.size_bytes / (1024 * 1024)).toFixed(1)
                    : "0"}{" "}
                  MB
                </p>
              </div>
              <DeleteButton id={f.id} title={f.title} />
            </li>
          ))}
        </ul>
      </main>
    </>
  );
}

export default function FilesPage() {
  return (
    <Suspense fallback={<p className="p-6">Loading...</p>}>
      <FileList />
    </Suspense>
  );
}
