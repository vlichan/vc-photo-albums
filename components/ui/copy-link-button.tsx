"use client";

import { Copy } from "lucide-react";
import { useState } from "react";

export function CopyLinkButton({ value }: { value: string }) {
  const [copied, setCopied] = useState(false);
  const [failed, setFailed] = useState(false);

  async function copy() {
    setFailed(false);

    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      setFailed(true);
    }
  }

  return (
    <button
      className="inline-flex items-center gap-2 border border-line px-3.5 py-2 text-sm text-ink transition hover:border-ink"
      onClick={copy}
      title={failed ? value : undefined}
      type="button"
    >
      <Copy className="h-4 w-4" />
      {failed ? "复制失败" : copied ? "已复制" : "复制链接"}
    </button>
  );
}
