"use client";

import { Copy } from "lucide-react";
import { useState } from "react";

export function AdminCopyLinkButton({ value }: { value: string }) {
  const [copied, setCopied] = useState(false);

  async function copyLink() {
    await navigator.clipboard.writeText(value);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1400);
  }

  return (
    <button
      className="inline-flex items-center gap-2 border border-line px-3.5 py-2 text-sm text-muted transition hover:border-ink hover:text-ink"
      onClick={copyLink}
      type="button"
    >
      <Copy className="h-4 w-4" />
      {copied ? "已复制" : "复制链接"}
    </button>
  );
}
