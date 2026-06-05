"use client";

import Image from "next/image";
import { useActionState, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { GripVertical, Star, X } from "lucide-react";
import type { Photo } from "@/types/album";
import {
  deleteAlbumPhotosWithState,
  type PhotoActionState,
  setAlbumCoverWithState,
  updatePhotoOrderWithState
} from "@/app/admin/albums/[id]/actions";

type PhotoManagerProps = {
  albumId: string;
  albumSlug: string;
  coverImage: string;
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

type LastMove = {
  movedPhotoId: string;
  beforePhotoId: string;
  afterPhotoId: string;
};

export function PhotoManager({
  albumId,
  albumSlug,
  coverImage,
  photos
}: PhotoManagerProps) {
  const router = useRouter();
  const [orderedPhotos, setOrderedPhotos] = useState(photos);
  const [draggedId, setDraggedId] = useState("");
  const [lastMove, setLastMove] = useState<LastMove | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [previewPhoto, setPreviewPhoto] = useState<Photo | null>(null);
  const deletedIdsRef = useRef<string[]>([]);
  const [sortState, sortAction, isSavingSort] = useActionState(
    updatePhotoOrderWithState,
    initialState
  );
  const [deleteState, deleteAction, isDeleting] = useActionState(
    deleteAlbumPhotosWithState,
    initialState
  );
  const [coverState, coverAction, isSettingCover] = useActionState(
    setAlbumCoverWithState,
    initialState
  );

  const selectedCount = selectedIds.length;
  const selectedPhoto =
    selectedCount === 1
      ? orderedPhotos.find((photo) => photo.id === selectedIds[0]) ?? null
      : null;
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

  useEffect(() => {
    if (coverState.ok) {
      router.refresh();
    }
  }, [coverState.ok, router]);

  useEffect(() => {
    if (sortState.ok) {
      setLastMove(null);
      router.refresh();
    }
  }, [router, sortState.ok]);

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

  function clearSelection() {
    setSelectedIds([]);
  }

  return (
    <section className="border border-line bg-white p-4">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-medium text-ink">已有图片</h2>
          <p className="mt-1 text-sm text-muted">
            拖拽图片调整顺序，保存后只更新排序值，图片编号保持不变。
          </p>
        </div>
        <span className="text-sm text-muted">{orderedPhotos.length} 张图片</span>
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-2 border border-line bg-paper/60 p-3">
        <span className="mr-2 text-sm text-muted">已选择 {selectedCount} 张</span>
        <button
          className="border border-line bg-white px-3 py-2 text-sm text-muted transition hover:border-ink hover:text-ink"
          onClick={toggleAll}
          type="button"
        >
          全选
        </button>
        <button
          className="border border-line bg-white px-3 py-2 text-sm text-muted transition hover:border-ink hover:text-ink disabled:cursor-not-allowed disabled:opacity-50"
          disabled={selectedCount === 0}
          onClick={clearSelection}
          type="button"
        >
          取消选择
        </button>
        <form action={sortAction}>
          <input name="album_id" type="hidden" value={albumId} />
          <input name="album_slug" type="hidden" value={albumSlug} />
          <input name="ordered_photo_ids" type="hidden" value={JSON.stringify(orderedPhotoIds)} />
          <input name="moved_photo_id" type="hidden" value={lastMove?.movedPhotoId ?? ""} />
          <input name="before_photo_id" type="hidden" value={lastMove?.beforePhotoId ?? ""} />
          <input name="after_photo_id" type="hidden" value={lastMove?.afterPhotoId ?? ""} />
          <button
            className="border border-ink bg-white px-3 py-2 text-sm text-ink disabled:cursor-not-allowed disabled:opacity-70"
            disabled={isSavingSort || !lastMove}
            type="submit"
          >
            {isSavingSort ? "保存中..." : "保存排序"}
          </button>
        </form>
        <form action={coverAction}>
          <input name="album_id" type="hidden" value={albumId} />
          <input name="album_slug" type="hidden" value={albumSlug} />
          <input name="cover_image" type="hidden" value={selectedPhoto?.imageUrl ?? ""} />
          <button
            className="border border-line bg-white px-3 py-2 text-sm text-muted transition hover:border-ink hover:text-ink disabled:cursor-not-allowed disabled:opacity-50"
            disabled={isSettingCover || !selectedPhoto}
            type="submit"
          >
            {isSettingCover ? "设置中..." : "设为封面"}
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
            className="border border-line bg-white px-3 py-2 text-sm text-[#8a2d2d] disabled:cursor-not-allowed disabled:opacity-60"
            disabled={isDeleting || selectedCount === 0}
            type="submit"
          >
            {isDeleting ? "删除中..." : `批量删除 (${selectedCount})`}
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
        {coverState.message ? (
          <p className={coverState.ok ? "text-sm text-moss" : "text-sm text-red-700"}>
            {coverState.message}
          </p>
        ) : null}
      </div>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 2xl:grid-cols-10">
        {orderedPhotos.length === 0 ? (
          <div className="border border-line bg-paper/50 p-10 text-center text-sm text-muted sm:col-span-3 md:col-span-4 lg:col-span-6">
            当前相册暂无图片。请先在上传区域选择或拖拽图片。
          </div>
        ) : null}
        {orderedPhotos.map((photo) => (
          <div
            className={`group border bg-white transition ${
              draggedId === photo.id ? "border-ink opacity-60" : "border-line"
            }`}
            draggable
            key={photo.id}
            onDragEnd={() => setDraggedId("")}
            onDragOver={(event) => event.preventDefault()}
            onDragStart={() => setDraggedId(photo.id)}
            onDrop={() => {
              if (draggedId) {
                setOrderedPhotos((current) => {
                  const nextPhotos = movePhoto(current, draggedId, photo.id);
                  const movedIndex = nextPhotos.findIndex(
                    (nextPhoto) => nextPhoto.id === draggedId
                  );
                  const beforePhoto = movedIndex > 0 ? nextPhotos[movedIndex - 1] : null;
                  const afterPhoto =
                    movedIndex >= 0 && movedIndex < nextPhotos.length - 1
                      ? nextPhotos[movedIndex + 1]
                      : null;

                  setLastMove({
                    movedPhotoId: draggedId,
                    beforePhotoId: beforePhoto?.id ?? "",
                    afterPhotoId: afterPhoto?.id ?? ""
                  });

                  return nextPhotos;
                });
              }
            }}
          >
            <div className="relative aspect-square bg-line">
              <Image
                alt={photo.imageCode}
                className="object-cover"
                fill
                sizes="(min-width: 1536px) 10vw, (min-width: 1280px) 12.5vw, (min-width: 1024px) 16vw, (min-width: 768px) 25vw, 50vw"
                src={photo.thumbnailUrl}
              />
              <button
                aria-label="预览图片"
                className="absolute inset-0 cursor-zoom-in"
                onClick={() => setPreviewPhoto(photo)}
                type="button"
              />
              {photo.imageUrl === coverImage ? (
                <span className="absolute left-2 bottom-2 inline-flex items-center gap-1 bg-ink px-2 py-1 text-[11px] text-paper">
                  <Star className="h-3 w-3" />
                  封面
                </span>
              ) : null}
              <label
                className={`absolute left-2 top-2 grid h-7 w-7 place-items-center bg-white/90 text-ink transition ${
                  selectedIds.includes(photo.id) ? "opacity-100" : "opacity-0 group-hover:opacity-100"
                }`}
              >
                <input
                  checked={selectedIds.includes(photo.id)}
                  className="h-4 w-4"
                  onChange={() => togglePhoto(photo.id)}
                  type="checkbox"
                />
              </label>
              <span className="absolute right-2 top-2 cursor-move bg-white/90 p-1 text-muted opacity-0 transition group-hover:opacity-100">
                <GripVertical className="h-4 w-4" />
              </span>
            </div>
            <div className="space-y-2 p-2 text-xs text-muted">
              <div className="grid grid-cols-2 gap-1">
                <p className="font-medium text-ink">{photo.imageCode}</p>
                <p className="text-right">{Math.round(photo.fileSize / 1024)} KB</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {previewPhoto ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/45 p-4">
          <div className="relative max-h-[92vh] w-full max-w-5xl overflow-hidden border border-line bg-white shadow-soft">
            <button
              aria-label="关闭预览"
              className="absolute right-3 top-3 z-10 grid h-10 w-10 place-items-center border border-line bg-white text-muted transition hover:border-ink hover:text-ink"
              onClick={() => setPreviewPhoto(null)}
              type="button"
            >
              <X className="h-5 w-5" />
            </button>
            <div className="flex max-h-[82vh] items-center justify-center bg-paper px-6 py-12">
              <Image
                alt={previewPhoto.imageCode}
                className="max-h-full w-auto object-contain"
                height={previewPhoto.height}
                src={previewPhoto.imageUrl}
                width={previewPhoto.width}
              />
            </div>
            <div className="flex items-center justify-between border-t border-line px-4 py-3 text-sm text-muted">
              <span className="font-medium text-ink">{previewPhoto.imageCode}</span>
              <span>
                {previewPhoto.width} x {previewPhoto.height}
              </span>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}
