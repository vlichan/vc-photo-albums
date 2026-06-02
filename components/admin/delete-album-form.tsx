"use client";

import { deleteAlbum } from "@/app/admin/albums/actions";

export function DeleteAlbumForm({
  albumId,
  albumTitle
}: {
  albumId: string;
  albumTitle: string;
}) {
  return (
    <form
      action={deleteAlbum}
      className="mt-3"
      onSubmit={(event) => {
        if (
          !window.confirm(
            `确定删除相册「${albumTitle}」吗？关联的 photos 数据库记录会被删除，但 R2 文件不会自动删除。`
          )
        ) {
          event.preventDefault();
        }
      }}
    >
      <input name="id" type="hidden" value={albumId} />
      <button className="border border-line px-4 py-2 text-sm text-muted" type="submit">
        删除相册
      </button>
    </form>
  );
}
