"use client";

import { useState } from "react";
import Link from "next/link";

const FILTERS = ["All", "Video", "Audio", "PDF", "Text", "Document"];
const ICONS = {
  Video: "🎬",
  Audio: "🎧",
  PDF: "📄",
  Text: "📝",
  Document: "📎",
};

function typeLabel(type = "") {
  if (type.startsWith("video/")) return "Video";
  if (type.startsWith("audio/")) return "Audio";
  if (type === "application/pdf") return "PDF";
  if (type === "text/plain") return "Text";
  return "Document";
}

export default function LibraryList({ files }) {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("All");

  const shown = files.filter((f) => {
    const label = typeLabel(f.content_type);
    const matchesType = filter === "All" || label === filter;
    const matchesText = f.title.toLowerCase().includes(query.toLowerCase());
    return matchesType && matchesText;
  });

  return (
    <div>
      <input
        type="search"
        placeholder="Search by title..."
        className="w-full rounded-lg border border-gray-600 bg-gray-800 p-3 text-white placeholder-gray-500 outline-none focus:border-blue-500"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />

      <div className="mt-3 flex flex-wrap gap-2">
        {FILTERS.map((name) => (
          <button
            key={name}
            onClick={() => setFilter(name)}
            className={`rounded-full px-4 py-1 text-sm ${
              filter === name
                ? "bg-blue-600 text-white"
                : "border border-gray-600 text-gray-300"
            }`}
          >
            {name}
          </button>
        ))}
      </div>

      {shown.length === 0 && (
        <p className="mt-8 text-center text-gray-400">
          {files.length === 0
            ? "Nothing has been shared yet. Check back soon."
            : "No files match your search."}
        </p>
      )}

      <ul className="mt-6 flex flex-col gap-3">
        {shown.map((f) => {
          const label = typeLabel(f.content_type);
          return (
            <li key={f.id}>
              <Link
                href={`/watch/${f.id}`}
                className="flex items-center gap-4 rounded-xl border border-white/10 bg-white/5 p-4 hover:border-blue-500 hover:bg-white/10"
              >
                <span className="text-3xl">{ICONS[label]}</span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-semibold">
                    {f.title}
                  </span>
                  <span className="text-sm text-gray-400">
                    {label} · {new Date(f.created_at).toLocaleDateString()}
                  </span>
                </span>
                <span className="text-gray-500">›</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
