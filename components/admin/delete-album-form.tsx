"use client";

import { deleteAlbum } from "@/app/admin/albums/actions";

export function DeleteAlbumForm({
  albumId,
  albumTitle,
  compact = false
}: {
  albumId: string;
  albumTitle: string;
  compact?: boolean;
}) {
  return (
    <form
      action={deleteAlbum}
      className={compact ? "" : "mt-3"}
      onSubmit={(event) => {
        if (
          !window.confirm(
            `确定删除相册「${albumTitle}」吗？将先删除该相册下所有 R2 图片文件，再删除 photos 记录和 albums 记录。此操作无法恢复。`
          )
        ) {
          event.preventDefault();
        }
      }}
    >
      <input name="id" type="hidden" value={albumId} />
      <button
        className={
          compact
            ? "border border-line bg-white/90 px-2.5 py-1.5 text-xs text-muted transition hover:border-ink hover:text-ink"
            : "border border-line px-4 py-2 text-sm text-muted"
        }
        type="submit"
      >
        删除相册
      </button>
    </form>
  );
}
