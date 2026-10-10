import { Suspense } from "react";
import { notFound } from "next/navigation";
import { GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { r2 } from "../../../lib/r2";
import { supabaseAdmin } from "../../../lib/supabaseAdmin";
import ShareButtons from "./ShareButtons";

async function WatchContent({ params }) {
  const { id } = await params;

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

  return (
    <main className="mx-auto max-w-3xl p-6">
      <h1 className="text-2xl font-bold">{file.title}</h1>
      <p className="mt-1 text-sm text-gray-400">
        {new Date(file.created_at).toLocaleDateString()}
        {sizeMB && ` · ${sizeMB} MB`}
      </p>

      <div className="mt-6">
        {type.startsWith("video/") && (
          <video
            src={viewUrl}
            controls
            preload="metadata"
            className="w-full rounded bg-black"
          />
        )}

        {type.startsWith("audio/") && (
          <audio src={viewUrl} controls className="w-full" />
        )}

        {(type === "application/pdf" || type === "text/plain") && (
          <iframe
            src={viewUrl}
            className="h-[70vh] w-full rounded border bg-white"
          />
        )}

        {!type.startsWith("video/") &&
          !type.startsWith("audio/") &&
          type !== "application/pdf" &&
          type !== "text/plain" && (
            <p className="rounded border p-4">
              This file type can't be previewed in the browser. Use the download
              button below.
            </p>
          )}
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <a
          href={downloadUrl}
          className="rounded bg-blue-600 px-4 py-2 font-semibold text-white"
        >
          Download
        </a>
      </div>

      <ShareButtons title={file.title} />
    </main>
  );
}

export default function WatchPage({ params }) {
  return (
    <Suspense fallback={<p className="p-6">Loading...</p>}>
      <WatchContent params={params} />
    </Suspense>
  );
}
