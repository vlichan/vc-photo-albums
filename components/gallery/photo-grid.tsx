"use client";

import Image from "next/image";
import { useState } from "react";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import type { Photo } from "@/types/album";

function getDisplayCode(photo: Photo, index: number, startIndex: number) {
  return photo.imageCode || String(photo.sortOrder || startIndex + index + 1).padStart(3, "0");
}

export function PhotoGrid({
  photos,
  startIndex = 0
}: {
  photos: Photo[];
  startIndex?: number;
}) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const [loadedPhotoIds, setLoadedPhotoIds] = useState<Set<string>>(new Set());
  const [touchStart, setTouchStart] = useState<{
    x: number;
    y: number;
    isMultiTouch: boolean;
  } | null>(null);
  const activePhoto = activeIndex === null ? null : photos[activeIndex];
  const activeDisplayIndex = activeIndex ?? 0;
  const activeDisplayCode = activePhoto
    ? getDisplayCode(activePhoto, activeDisplayIndex, startIndex)
    : "";

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
      <div className="grid grid-cols-2 gap-1.5 min-[430px]:grid-cols-3 sm:grid-cols-4 md:grid-cols-5 md:gap-2 lg:grid-cols-6 xl:grid-cols-7 2xl:grid-cols-8">
        {photos.map((photo, index) => (
          <button
            key={photo.id}
            className="group relative aspect-square w-full overflow-hidden border border-line/70 bg-white text-left"
            onClick={() => setActiveIndex(index)}
            type="button"
          >
            {!loadedPhotoIds.has(photo.id) ? (
              <span className="absolute inset-0 animate-pulse bg-line/55" />
            ) : null}
            <Image
              src={photo.thumbnailUrl}
              alt={getDisplayCode(photo, index, startIndex)}
              fill
              sizes="(min-width: 1536px) 12.5vw, (min-width: 1280px) 14vw, (min-width: 1024px) 16vw, (min-width: 768px) 20vw, (min-width: 430px) 33vw, 50vw"
              className={`object-cover object-center transition duration-500 group-hover:scale-[1.02] ${
                loadedPhotoIds.has(photo.id) ? "opacity-100" : "opacity-0"
              }`}
              onLoad={() => markLoaded(photo.id)}
            />
            <span className="absolute bottom-1.5 right-1.5 bg-white/88 px-1.5 py-0.5 text-[10px] font-medium leading-none text-ink shadow-sm md:bottom-2 md:right-2 md:px-2 md:py-1 md:text-[11px]">
              {getDisplayCode(photo, index, startIndex)}
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
              alt={activeDisplayCode}
              width={activePhoto.width}
              height={activePhoto.height}
              className="max-h-full w-auto object-contain"
              priority
            />
          </div>
          <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between gap-4 text-xs uppercase tracking-[0.16em] text-paper/75 md:bottom-5 md:left-5 md:right-5">
            <span>{activeDisplayCode}</span>
            <span>
              {(startIndex + activeDisplayIndex + 1).toString().padStart(2, "0")}
            </span>
          </div>
        </div>
      ) : null}
    </>
  );
}
