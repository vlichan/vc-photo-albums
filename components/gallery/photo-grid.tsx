"use client";

import Image from "next/image";
import { useState } from "react";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import type { Photo } from "@/types/album";

export function PhotoGrid({ photos }: { photos: Photo[] }) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const [loadedPhotoIds, setLoadedPhotoIds] = useState<Set<string>>(new Set());
  const [touchStart, setTouchStart] = useState<{
    x: number;
    y: number;
    isMultiTouch: boolean;
  } | null>(null);
  const activePhoto = activeIndex === null ? null : photos[activeIndex];
  const activeDisplayIndex = activeIndex ?? 0;

  function markLoaded(photoId: string) {
    setLoadedPhotoIds((current) => {
      const next = new Set(current);
      next.add(photoId);
      return next;
    });
  }

  function showPrevious() {
    setActiveIndex((current) =>
      current === null ? null : (current - 1 + photos.length) % photos.length
    );
  }

  function showNext() {
    setActiveIndex((current) =>
      current === null ? null : (current + 1) % photos.length
    );
  }

  function handleTouchEnd(touchEndX: number, touchEndY: number) {
    if (!touchStart || touchStart.isMultiTouch) {
      return;
    }

    const horizontalDistance = touchStart.x - touchEndX;
    const verticalDistance = Math.abs(touchStart.y - touchEndY);
    const isIntentionalSwipe =
      Math.abs(horizontalDistance) > 80 &&
      Math.abs(horizontalDistance) > verticalDistance * 2;

    if (isIntentionalSwipe) {
      if (horizontalDistance > 0) {
        showNext();
      } else {
        showPrevious();
      }
    }

    setTouchStart(null);
  }

  return (
    <>
      {photos.length === 0 ? (
        <section className="border border-line bg-white/55 px-5 py-12 text-center text-sm text-muted">
          这个相册暂时还没有图片。
        </section>
      ) : null}
      <div className="masonry columns-2 md:columns-3 xl:columns-4">
        {photos.map((photo, index) => (
          <button
            key={photo.id}
            className="group relative w-full overflow-hidden border border-line/70 bg-white text-left"
            onClick={() => setActiveIndex(index)}
            type="button"
          >
            {!loadedPhotoIds.has(photo.id) ? (
              <span className="absolute inset-0 animate-pulse bg-line/55" />
            ) : null}
            <Image
              src={photo.thumbnailUrl}
              alt={photo.imageCode}
              width={photo.width}
              height={photo.height}
              sizes="(min-width: 1280px) 25vw, (min-width: 768px) 33vw, 50vw"
              className={`h-auto w-full object-cover transition duration-500 group-hover:scale-[1.015] ${
                loadedPhotoIds.has(photo.id) ? "opacity-100" : "opacity-0"
              }`}
              onLoad={() => markLoaded(photo.id)}
            />
            <span className="absolute bottom-2 right-2 bg-white/92 px-2 py-1 text-[11px] font-medium text-ink shadow-sm md:bottom-3 md:right-3 md:text-xs">
              {photo.imageCode}
            </span>
          </button>
        ))}
      </div>

      {activePhoto ? (
        <div
          className="fixed inset-0 z-50 bg-[#0d0d0d] text-paper"
          onTouchEnd={(event) =>
            handleTouchEnd(
              event.changedTouches[0].clientX,
              event.changedTouches[0].clientY
            )
          }
          onTouchStart={(event) =>
            setTouchStart({
              x: event.touches[0].clientX,
              y: event.touches[0].clientY,
              isMultiTouch: event.touches.length > 1
            })
          }
        >
          <button
            aria-label="Close image"
            className="absolute right-3 top-3 z-10 grid h-11 w-11 place-items-center border border-white/25 bg-black/20 text-paper transition hover:bg-white hover:text-ink md:right-5 md:top-5"
            onClick={() => setActiveIndex(null)}
            type="button"
          >
            <X className="h-5 w-5" />
          </button>
          <button
            aria-label="Previous image"
            className="absolute left-3 top-1/2 z-10 grid h-11 w-11 -translate-y-1/2 place-items-center border border-white/20 bg-black/25 text-paper transition hover:bg-white hover:text-ink md:left-5 md:h-12 md:w-12"
            onClick={showPrevious}
            type="button"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button
            aria-label="Next image"
            className="absolute right-3 top-1/2 z-10 grid h-11 w-11 -translate-y-1/2 place-items-center border border-white/20 bg-black/25 text-paper transition hover:bg-white hover:text-ink md:right-5 md:h-12 md:w-12"
            onClick={showNext}
            type="button"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
          <div className="flex h-full items-center justify-center px-12 py-16 md:px-20">
            <Image
              src={activePhoto.imageUrl}
              alt={activePhoto.imageCode}
              width={activePhoto.width}
              height={activePhoto.height}
              className="max-h-full w-auto object-contain"
              priority
            />
          </div>
          <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between gap-4 text-xs uppercase tracking-[0.16em] text-paper/75 md:bottom-5 md:left-5 md:right-5">
            <span>{activePhoto.imageCode}</span>
            <span>
              {(activeDisplayIndex + 1).toString().padStart(2, "0")} /{" "}
              {photos.length.toString().padStart(2, "0")}
            </span>
          </div>
        </div>
      ) : null}
    </>
  );
}
