"use client";

import { useState } from "react";

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
  const [password, setPassword] = useState("");
  const [title, setTitle] = useState("");
  const [file, setFile] = useState(null);
  const [progress, setProgress] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [link, setLink] = useState("");

  async function post(url, body) {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-upload-password": password,
      },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Request failed");
    return data;
  }

  // Sends one chunk to R2 and reports progress
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

  // Tries a chunk up to 3 times before giving up
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
    if (!file || !title || !password) {
      setError("Please fill in the password, title, and choose a video.");
      return;
    }

    setUploading(true);
    setProgress(0);

    try {
      const contentType = file.type || guessType(file.name);

      // 1. Start
      const { uploadId, key } = await post("/api/upload/start", {
        filename: file.name,
        contentType,
      });

      // 2. Upload chunks one by one
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

      // 3. Complete
      const { id } = await post("/api/upload/complete", {
        key,
        uploadId,
        parts,
        title,
        size: file.size,
        contentType,
      });

      setLink(`${window.location.origin}/watch/${id}`);
    } catch (err) {
      setError(err.message);
    } finally {
      setUploading(false);
    }
  }

  return (
    <main className="mx-auto max-w-xl p-8">
      <h1 className="text-3xl font-bold">Upload a video</h1>

      <div className="mt-6 flex flex-col gap-4">
        <input
          type="password"
          placeholder="Upload password"
          className="rounded border p-2 text-black"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <input
          type="text"
          placeholder="Title (e.g. Physics - Week 3)"
          className="rounded border p-2 text-black"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
        <input
          type="file"
          accept="video/*,audio/*,text/plain,.txt,.pdf,.doc,.docx"
          onChange={(e) => setFile(e.target.files[0])}
        />

        <button
          onClick={handleUpload}
          disabled={uploading}
          className="rounded bg-blue-600 p-2 font-semibold text-white disabled:opacity-50"
        >
          {uploading ? `Uploading... ${progress}%` : "Upload"}
        </button>

        {uploading && (
          <div className="h-3 w-full rounded bg-gray-300">
            <div
              className="h-3 rounded bg-green-500 transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
        )}

        {error && <p className="text-red-500">{error}</p>}

        {link && (
          <div className="rounded border border-green-500 p-3">
            <p className="font-semibold">Upload complete!</p>
            <p className="break-all text-sm">{link}</p>
          </div>
        )}
      </div>
    </main>
  );
}
