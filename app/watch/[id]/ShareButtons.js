"use client";

import { useState } from "react";

export default function ShareButtons({ title }) {
  const [copied, setCopied] = useState(false);

  async function copyLink() {
    await navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function shareWhatsApp() {
    const text = `${title}\n${window.location.href}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank");
  }

  return (
    <div className="mt-4 flex flex-wrap gap-3">
      <button
        onClick={copyLink}
        className="rounded bg-gray-700 px-4 py-2 font-semibold text-white"
      >
        {copied ? "Copied!" : "Copy link"}
      </button>
      <button
        onClick={shareWhatsApp}
        className="rounded bg-green-600 px-4 py-2 font-semibold text-white"
      >
        Share on WhatsApp
      </button>
    </div>
  );
}
