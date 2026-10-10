import { Suspense } from "react";
import { redirect } from "next/navigation";
import { supabaseAdmin } from "../lib/supabaseAdmin";
import { getRole } from "../lib/session";
import { site } from "../lib/site";
import Header from "./components/Header";
import Footer from "./components/Footer";
import LibraryList from "./LibraryList";

async function Library() {
  const role = await getRole();
  if (!role) redirect("/login?next=/");

  const { data: files, error } = await supabaseAdmin
    .from("videos")
    .select("id, title, content_type, created_at")
    .order("created_at", { ascending: false });

  return (
    <>
      <Header role={role} />
      <main className="mx-auto max-w-4xl px-4 py-8">
        <h1 className="text-3xl font-bold">Class Library</h1>
        <p className="mt-2 max-w-2xl text-gray-400">{site.welcome}</p>
        <p className="mt-1 text-sm text-gray-500">Shared by {site.teacher}</p>

        {error && <p className="mt-4 text-red-400">{error.message}</p>}

        <div className="mt-8">
          <LibraryList files={files || []} />
        </div>
      </main>
      <Footer />
    </>
  );
}

export default function Home() {
  return (
    <Suspense fallback={<p className="p-6">Loading...</p>}>
      <Library />
    </Suspense>
  );
}
