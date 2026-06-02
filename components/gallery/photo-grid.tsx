"use client";

import Image from "next/image";
import { useState } from "react";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import type { Photo } from "@/types/album";

export function PhotoGrid({ photos }: { photos: Photo[] }) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const activePhoto = activeIndex === null ? null : photos[activeIndex];

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

  return (
    <>
      <div className="masonry columns-1 sm:columns-2 lg:columns-3">
        {photos.map((photo, index) => (
          <button
            key={photo.id}
            className="group relative w-full overflow-hidden bg-white text-left"
            onClick={() => setActiveIndex(index)}
            type="button"
          >
            <Image
              src={photo.thumbnailUrl}
              alt={photo.imageCode}
              width={photo.width}
              height={photo.height}
              sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
              className="h-auto w-full object-cover transition duration-500 group-hover:scale-[1.02]"
            />
            <span className="absolute bottom-3 right-3 bg-white/90 px-2 py-1 text-xs font-medium text-ink">
              {photo.imageCode}
            </span>
          </button>
        ))}
      </div>

      {activePhoto ? (
        <div className="fixed inset-0 z-50 bg-ink/95 text-paper">
          <button
            aria-label="Close image"
            className="absolute right-4 top-4 grid h-11 w-11 place-items-center border border-white/20"
            onClick={() => setActiveIndex(null)}
            type="button"
          >
            <X className="h-5 w-5" />
          </button>
          <button
            aria-label="Previous image"
            className="absolute left-4 top-1/2 hidden h-12 w-12 -translate-y-1/2 place-items-center border border-white/20 md:grid"
            onClick={showPrevious}
            type="button"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button
            aria-label="Next image"
            className="absolute right-4 top-1/2 hidden h-12 w-12 -translate-y-1/2 place-items-center border border-white/20 md:grid"
            onClick={showNext}
            type="button"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
          <div className="flex h-full items-center justify-center px-4 py-16">
            <Image
              src={activePhoto.imageUrl}
              alt={activePhoto.imageCode}
              width={activePhoto.width}
              height={activePhoto.height}
              className="max-h-full w-auto object-contain"
              priority
            />
          </div>
          <div className="absolute bottom-4 left-4 text-sm text-paper/80">
            {activePhoto.imageCode}
          </div>
        </div>
      ) : null}
    </>
  );
}
