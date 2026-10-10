import { Suspense } from "react";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { r2 } from "../../../lib/r2";
import { supabaseAdmin } from "../../../lib/supabaseAdmin";
import { getRole } from "../../../lib/session";
import Header from "../../components/Header";
import Footer from "../../components/Footer";
import ShareButtons from "./ShareButtons";

async function WatchContent({ params }) {
  const { id } = await params;
  const role = await getRole();
  if (!role) redirect(`/login?next=/watch/${id}`);

  const { data: file } = await supabaseAdmin
    .from("videos")
    .select("*")
    .eq("id", id)
    .single();

  if (!file) notFound();

  const type = file.content_type || "";
  const downloadName = file.file_key
    .split("/")
    .pop()
    .replace(/^[0-9a-f-]{36}-/, "");

  const viewUrl = await getSignedUrl(
    r2,
    new GetObjectCommand({
      Bucket: process.env.R2_BUCKET,
      Key: file.file_key,
      ResponseContentType: type || undefined,
    }),
    { expiresIn: 6 * 60 * 60 },
  );

  const downloadUrl = await getSignedUrl(
    r2,
    new GetObjectCommand({
      Bucket: process.env.R2_BUCKET,
      Key: file.file_key,
      ResponseContentDisposition: `attachment; filename="${downloadName}"`,
    }),
    { expiresIn: 6 * 60 * 60 },
  );

  const sizeMB = file.size_bytes
    ? (file.size_bytes / (1024 * 1024)).toFixed(1)
    : null;

  const isVideo = type.startsWith("video/");
  const isAudio = type.startsWith("audio/");
  const isEmbeddable = type === "application/pdf" || type === "text/plain";

  return (
    <>
      <Header role={role} />
      <main className="mx-auto max-w-3xl px-4 py-6">
        <Link href="/" className="text-sm text-blue-300 hover:underline">
          ← Back to library
        </Link>

        <h1 className="mt-4 text-2xl font-bold">{file.title}</h1>
        <p className="mt-1 text-sm text-gray-400">
          Added {new Date(file.created_at).toLocaleDateString()}
          {sizeMB && ` · ${sizeMB} MB`}
        </p>

        <div className="mt-6">
          {isVideo && (
            <video
              src={viewUrl}
              controls
              preload="metadata"
              className="w-full rounded-xl bg-black"
            />
          )}
          {isAudio && (
            <div className="rounded-xl border border-white/10 bg-white/5 p-6">
              <p className="mb-3 text-sm text-gray-400">
                🎧 Press play to listen
              </p>
              <audio src={viewUrl} controls className="w-full" />
            </div>
          )}
          {isEmbeddable && (
            <iframe
              src={viewUrl}
              className="h-[70vh] w-full rounded-xl border border-white/10 bg-white"
            />
          )}
          {!isVideo && !isAudio && !isEmbeddable && (
            <div className="rounded-xl border border-white/10 bg-white/5 p-6 text-center">
              <p className="text-4xl">📎</p>
              <p className="mt-2 text-gray-300">
                This file can't be previewed in the browser. Tap Download to
                open it on your device.
              </p>
            </div>
          )}
        </div>

        <div className="mt-6 flex flex-wrap items-center gap-3">
          <a
            href={downloadUrl}
            className="rounded-lg bg-blue-600 px-5 py-2 font-semibold text-white hover:bg-blue-500"
          >
            ⬇ Download
          </a>
        </div>
        <p className="mt-2 text-xs text-gray-500">
          Download links expire after a few hours. Reopen this page for a fresh
          one.
        </p>

        <ShareButtons title={file.title} />
      </main>
      <Footer />
    </>
  );
}

export default function WatchPage({ params }) {
  return (
    <Suspense fallback={<p className="p-6">Loading...</p>}>
      <WatchContent params={params} />
    </Suspense>
  );
}
