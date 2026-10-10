"use client";

import { useState } from "react";
import Link from "next/link";
import Header from "../components/Header";

const CHUNK_SIZE = 10 * 1024 * 1024; // 10 MB

function guessType(name) {
  const ext = name.split(".").pop().toLowerCase();
  const types = {
    mp4: "video/mp4",
    mov: "video/quicktime",
    webm: "video/webm",
    mp3: "audio/mpeg",
    m4a: "audio/mp4",
    wav: "audio/wav",
    pdf: "application/pdf",
    txt: "text/plain",
    doc: "application/msword",
    docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  };
  return types[ext] || "application/octet-stream";
}

export default function UploadPage() {
  const [title, setTitle] = useState("");
  const [file, setFile] = useState(null);
  const [progress, setProgress] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [link, setLink] = useState("");
  const [copied, setCopied] = useState(false);

  async function post(url, body) {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Request failed");
    return data;
  }

  function putPart(url, blob, onProgress) {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open("PUT", url);
      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable) onProgress(e.loaded);
      };
      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          const etag = xhr.getResponseHeader("ETag");
          if (etag) resolve(etag);
          else reject(new Error("No ETag. Check CORS ExposeHeaders on R2."));
        } else {
          reject(new Error(`Chunk failed (status ${xhr.status})`));
        }
      };
      xhr.onerror = () => reject(new Error("Network error"));
      xhr.send(blob);
    });
  }

  async function withRetry(fn) {
    let lastError;
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        return await fn();
      } catch (err) {
        lastError = err;
        await new Promise((r) => setTimeout(r, attempt * 1000));
      }
    }
    throw lastError;
  }

  async function handleUpload() {
    setError("");
    setLink("");
    if (!file || !title) {
      setError("Please enter a title and choose a file.");
      return;
    }

    setUploading(true);
    setProgress(0);

    try {
      const contentType = file.type || guessType(file.name);

      const { uploadId, key } = await post("/api/upload/start", {
        filename: file.name,
        contentType,
      });

      const totalParts = Math.ceil(file.size / CHUNK_SIZE);
      const parts = [];
      let doneBytes = 0;

      for (let i = 0; i < totalParts; i++) {
        const partNumber = i + 1;
        const blob = file.slice(i * CHUNK_SIZE, (i + 1) * CHUNK_SIZE);

        const etag = await withRetry(async () => {
          const { url } = await post("/api/upload/sign-part", {
            key,
            uploadId,
            partNumber,
          });
          return putPart(url, blob, (loaded) => {
            setProgress(Math.round(((doneBytes + loaded) / file.size) * 100));
          });
        });

        doneBytes += blob.size;
        parts.push({ PartNumber: partNumber, ETag: etag });
        setProgress(Math.round((doneBytes / file.size) * 100));
      }

      const { id } = await post("/api/upload/complete", {
        key,
        uploadId,
        parts,
        title,
        size: file.size,
        contentType,
      });

      setLink(`${window.location.origin}/watch/${id}`);
      setTitle("");
      setFile(null);
    } catch (err) {
      setError(
        err.message === "Wrong password"
          ? "You're not logged in as admin. Log in first, then try again."
          : err.message,
      );
    } finally {
      setUploading(false);
    }
  }

  async function copyLink() {
    await navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <>
      <Header role="admin" />
      <main className="mx-auto max-w-xl px-4 py-8">
        <h1 className="text-2xl font-bold">Upload to the class library</h1>
        <p className="mt-1 text-sm text-gray-400">
          Videos, audio, PDFs, text and Word files. Large files upload in
          pieces, so keep this page open until it finishes.
        </p>

        <div className="mt-6 flex flex-col gap-4 rounded-2xl border border-white/10 bg-white/5 p-6">
          <label className="text-sm font-medium" htmlFor="title">
            Title
          </label>
          <input
            id="title"
            type="text"
            placeholder="e.g. Physics - Week 3 lecture"
            className="rounded-lg border border-gray-600 bg-gray-800 p-3 text-white placeholder-gray-500 outline-none focus:border-blue-500"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />

          <label className="text-sm font-medium" htmlFor="file">
            File
          </label>
          <input
            id="file"
            type="file"
            accept="video/*,audio/*,text/plain,.txt,.pdf,.doc,.docx"
            className="text-sm text-gray-300 file:mr-4 file:rounded-lg file:border-0 file:bg-gray-700 file:px-4 file:py-2 file:text-white"
            onChange={(e) => setFile(e.target.files[0])}
          />
          {file && (
            <p className="text-xs text-gray-400">
              {file.name} · {(file.size / (1024 * 1024)).toFixed(1)} MB
            </p>
          )}

          <button
            onClick={handleUpload}
            disabled={uploading}
            className="rounded-lg bg-blue-600 p-3 font-semibold text-white hover:bg-blue-500 disabled:opacity-50"
          >
            {uploading ? `Uploading... ${progress}%` : "Upload"}
          </button>

          {uploading && (
            <div className="h-3 w-full overflow-hidden rounded-full bg-gray-700">
              <div
                className="h-3 rounded-full bg-green-500 transition-all"
                style={{ width: `${progress}%` }}
              />
            </div>
          )}

          {error && (
            <p className="rounded-lg bg-red-900/40 p-3 text-sm text-red-300">
              {error}{" "}
              {error.includes("not logged in") && (
                <Link href="/login" className="underline">
                  Go to login
                </Link>
              )}
            </p>
          )}

          {link && (
            <div className="rounded-lg border border-green-600 bg-green-900/20 p-4">
              <p className="font-semibold text-green-300">
                ✅ Upload complete!
              </p>
              <p className="mt-1 break-all text-sm text-gray-300">{link}</p>
              <div className="mt-3 flex gap-3">
                <button
                  onClick={copyLink}
                  className="rounded-lg bg-gray-700 px-4 py-2 text-sm font-semibold text-white"
                >
                  {copied ? "Copied!" : "Copy link"}
                </button>
                <Link
                  href="/"
                  className="rounded-lg border border-gray-600 px-4 py-2 text-sm text-gray-300"
                >
                  View library
                </Link>
              </div>
            </div>
          )}
        </div>
      </main>
    </>
  );
}
