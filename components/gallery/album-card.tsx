import Image from "next/image";
import Link from "next/link";
import { LockKeyhole } from "lucide-react";
import type { AlbumWithCategory } from "@/types/album";

export function AlbumCard({ album }: { album: AlbumWithCategory }) {
  return (
    <Link
      href={`/album/${album.slug}`}
      className="group block"
    >
      <div className="relative aspect-[4/5] overflow-hidden border border-line bg-line">
        {album.coverImage ? (
          <Image
            src={album.coverImage}
            alt={album.title}
            fill
            unoptimized
            sizes="(min-width: 1280px) 25vw, (min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
            className="object-cover transition duration-500 group-hover:scale-[1.025]"
          />
        ) : (
          <div className="grid h-full place-items-center bg-white text-xs uppercase tracking-[0.18em] text-muted">
            No cover
          </div>
        )}
        {!album.isPublic ? (
          <span className="absolute right-3 top-3 inline-flex items-center gap-1.5 bg-white/92 px-2.5 py-1 text-[11px] uppercase tracking-[0.12em] text-ink">
            <LockKeyhole className="h-3 w-3" />
            Private
          </span>
        ) : null}
      </div>
      <div className="flex items-start justify-between gap-3 pt-3">
        <h2 className="text-lg font-medium leading-snug text-ink md:text-xl">
          {album.title}
        </h2>
        <span className="shrink-0 pt-1 text-xs uppercase tracking-[0.14em] text-muted">
          {album.photoCount ?? 0} photos
        </span>
      </div>
    </Link>
  );
}
