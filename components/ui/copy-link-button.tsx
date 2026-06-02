"use client";

import { Copy } from "lucide-react";
import { useState } from "react";

export function CopyLinkButton({ value }: { value: string }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    await navigator.clipboard.writeText(value);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
  }

  return (
    <button
      className="inline-flex items-center gap-2 border border-ink px-4 py-2 text-sm text-ink transition hover:bg-ink hover:text-paper"
      onClick={copy}
      type="button"
    >
      <Copy className="h-4 w-4" />
      {copied ? "已复制" : "复制链接"}
    </button>
  );
}
