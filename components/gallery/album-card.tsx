import Image from "next/image";
import Link from "next/link";
import type { AlbumWithCategory } from "@/types/album";

export function AlbumCard({ album }: { album: AlbumWithCategory }) {
  return (
    <Link
      href={`/album/${album.slug}`}
      className="group block overflow-hidden border border-line bg-white"
    >
      <div className="relative aspect-[4/5] overflow-hidden bg-line">
        <Image
          src={album.coverImage}
          alt={album.title}
          fill
          sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
          className="object-cover transition duration-500 group-hover:scale-[1.03]"
        />
        {!album.isPublic ? (
          <span className="absolute right-3 top-3 bg-ink px-2.5 py-1 text-[11px] uppercase tracking-[0.16em] text-paper">
            Private
          </span>
        ) : null}
      </div>
      <div className="space-y-2 p-4">
        <div className="text-xs uppercase tracking-[0.18em] text-muted">
          {album.categoryName}
        </div>
        <div className="flex items-end justify-between gap-3">
          <h2 className="text-xl font-medium text-ink">{album.title}</h2>
          <span className="shrink-0 text-xs text-muted">{album.createdAt}</span>
        </div>
        <p className="line-clamp-2 text-sm leading-6 text-muted">{album.description}</p>
      </div>
    </Link>
  );
}
