"use client";

import Image from "next/image";
import { useActionState, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { Photo } from "@/types/album";
import {
  deleteAlbumPhotosWithState,
  type PhotoActionState,
  updatePhotoOrderWithState
} from "@/app/admin/albums/[id]/actions";

type PhotoManagerProps = {
  albumId: string;
  albumSlug: string;
  photos: Photo[];
};

const initialState: PhotoActionState = {
  ok: false,
  message: ""
};

function movePhoto(photos: Photo[], draggedId: string, targetId: string) {
  const nextPhotos = [...photos];
  const draggedIndex = nextPhotos.findIndex((photo) => photo.id === draggedId);
  const targetIndex = nextPhotos.findIndex((photo) => photo.id === targetId);

  if (draggedIndex < 0 || targetIndex < 0 || draggedIndex === targetIndex) {
    return photos;
  }

  const [draggedPhoto] = nextPhotos.splice(draggedIndex, 1);
  nextPhotos.splice(targetIndex, 0, draggedPhoto);
  return nextPhotos;
}

function getAutoCode(index: number) {
  return (index + 1).toString().padStart(3, "0");
}

export function PhotoManager({ albumId, albumSlug, photos }: PhotoManagerProps) {
  const router = useRouter();
  const [orderedPhotos, setOrderedPhotos] = useState(photos);
  const [draggedId, setDraggedId] = useState("");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const deletedIdsRef = useRef<string[]>([]);
  const [sortState, sortAction, isSavingSort] = useActionState(
    updatePhotoOrderWithState,
    initialState
  );
  const [deleteState, deleteAction, isDeleting] = useActionState(
    deleteAlbumPhotosWithState,
    initialState
  );

  const selectedCount = selectedIds.length;
  const orderedPhotoIds = useMemo(
    () => orderedPhotos.map((photo) => photo.id),
    [orderedPhotos]
  );

  useEffect(() => {
    setOrderedPhotos(photos);
  }, [photos]);

  useEffect(() => {
    if (!deleteState.ok || deletedIdsRef.current.length === 0) {
      return;
    }

    const deletedIds = new Set(deletedIdsRef.current);
    setOrderedPhotos((current) => current.filter((photo) => !deletedIds.has(photo.id)));
    setSelectedIds([]);
    deletedIdsRef.current = [];
    router.refresh();
  }, [deleteState.ok, router]);

  function togglePhoto(photoId: string) {
    setSelectedIds((current) =>
      current.includes(photoId)
        ? current.filter((id) => id !== photoId)
        : [...current, photoId]
    );
  }

  function toggleAll() {
    setSelectedIds((current) =>
      current.length === orderedPhotos.length ? [] : orderedPhotos.map((photo) => photo.id)
    );
  }

  return (
    <section className="border border-line bg-white p-5">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-medium text-ink">已有图片</h2>
          <p className="mt-1 text-sm text-muted">
            拖拽图片调整顺序，保存后会自动更新 sort_order 和 image_code。
          </p>
        </div>
        <span className="text-sm text-muted">{orderedPhotos.length} photos</span>
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <button
          className="border border-line px-4 py-2 text-sm text-muted"
          onClick={toggleAll}
          type="button"
        >
          {selectedCount === orderedPhotos.length && orderedPhotos.length > 0
            ? "取消全选"
            : "全选"}
        </button>
        <form action={sortAction}>
          <input name="album_id" type="hidden" value={albumId} />
          <input name="album_slug" type="hidden" value={albumSlug} />
          <input name="ordered_photo_ids" type="hidden" value={JSON.stringify(orderedPhotoIds)} />
          <button
            className="border border-ink px-4 py-2 text-sm text-ink disabled:cursor-not-allowed disabled:opacity-70"
            disabled={isSavingSort}
            type="submit"
          >
            {isSavingSort ? "保存中..." : "保存排序并自动编号"}
          </button>
        </form>
        <form
          action={deleteAction}
          onSubmit={(event) => {
            if (selectedCount === 0) {
              event.preventDefault();
              return;
            }

            if (
              !window.confirm(
                `确定删除选中的 ${selectedCount} 张图片吗？R2 原图/缩略图和数据库记录都会被删除。`
              )
            ) {
              event.preventDefault();
              return;
            }

            deletedIdsRef.current = selectedIds;
          }}
        >
          <input name="album_id" type="hidden" value={albumId} />
          <input name="album_slug" type="hidden" value={albumSlug} />
          <input name="photo_ids" type="hidden" value={JSON.stringify(selectedIds)} />
          <button
            className="border border-line px-4 py-2 text-sm text-muted disabled:cursor-not-allowed disabled:opacity-70"
            disabled={isDeleting || selectedCount === 0}
            type="submit"
          >
            {isDeleting ? "删除中..." : `删除选中 (${selectedCount})`}
          </button>
        </form>
      </div>

      <div className="mb-4 space-y-1">
        {sortState.message ? (
          <p className={sortState.ok ? "text-sm text-moss" : "text-sm text-red-700"}>
            {sortState.message}
          </p>
        ) : null}
        {deleteState.message ? (
          <p className={deleteState.ok ? "text-sm text-moss" : "text-sm text-red-700"}>
            {deleteState.message}
          </p>
        ) : null}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {orderedPhotos.map((photo, index) => (
          <div
            className={`border border-line bg-white ${draggedId === photo.id ? "opacity-60" : ""}`}
            draggable
            key={photo.id}
            onDragEnd={() => setDraggedId("")}
            onDragOver={(event) => event.preventDefault()}
            onDragStart={() => setDraggedId(photo.id)}
            onDrop={() => {
              if (draggedId) {
                setOrderedPhotos((current) => movePhoto(current, draggedId, photo.id));
              }
            }}
          >
            <div className="relative aspect-[4/5] bg-line">
              <Image
                alt={photo.imageCode}
                className="object-cover"
                fill
                sizes="(min-width: 1024px) 25vw, 50vw"
                src={photo.thumbnailUrl}
              />
              <span className="absolute bottom-3 right-3 bg-white/90 px-2 py-1 text-xs font-medium text-ink">
                {getAutoCode(index)}
              </span>
              <label className="absolute left-3 top-3 bg-white/90 px-2 py-1 text-xs text-ink">
                <input
                  checked={selectedIds.includes(photo.id)}
                  className="mr-2"
                  onChange={() => togglePhoto(photo.id)}
                  type="checkbox"
                />
                Select
              </label>
            </div>
            <div className="space-y-1 p-3 text-sm text-muted">
              <p>sort_order: {index + 1}</p>
              <p>image_code: {getAutoCode(index)}</p>
              <p>{photo.mimeType}</p>
              <p>
                {photo.width} x {photo.height}
              </p>
              <p>{Math.round(photo.fileSize / 1024)} KB</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
