"use client";

import Image from "next/image";
import Link from "next/link";
import { Check } from "lucide-react";
import { AlbumFormModal } from "@/components/admin/album-form-modal";
import type { AlbumWithCategory, Category } from "@/types/album";

export function AlbumGridCard({
  album,
  categories,
  isSelected,
  onToggle
}: {
  album: AlbumWithCategory;
  categories: Category[];
  isSelected: boolean;
  onToggle: () => void;
}) {
  const statusText = album.isPublic
    ? album.password
      ? "公开 · 密码"
      : "公开"
    : "私密";

  return (
    <div className="group relative">
      <button
        aria-label={`选择 ${album.title}`}
        className={`absolute left-2 top-2 z-10 grid h-6 w-6 place-items-center border text-xs transition ${
          isSelected
            ? "border-ink bg-ink text-paper opacity-100"
            : "border-line bg-white/90 text-transparent opacity-0 group-hover:text-muted group-hover:opacity-100"
        }`}
        onClick={onToggle}
        type="button"
      >
        <Check className="h-3.5 w-3.5" />
      </button>
      <Link href={`/admin/albums/${album.id}`} className="block">
        <div
          className={`relative aspect-square overflow-hidden border bg-line transition ${
            isSelected ? "border-ink" : "border-line"
          }`}
        >
          {album.coverImage ? (
            <Image
              alt={album.title}
              className="object-cover transition duration-500 group-hover:scale-[1.025]"
              fill
              sizes="(min-width: 1280px) 14vw, (min-width: 1024px) 16vw, (min-width: 768px) 20vw, 50vw"
              src={album.coverImage}
            />
          ) : (
            <div className="grid h-full place-items-center text-xs uppercase tracking-[0.16em] text-muted">
              暂无封面
            </div>
          )}
          <span className="absolute bottom-2 right-2 bg-white/90 px-2 py-1 text-xs font-medium text-ink">
            {album.photoCount ?? 0}
          </span>
        </div>
        <div className="pt-1.5">
          <h2 className="truncate whitespace-nowrap text-sm font-medium text-ink">
            {album.title}
          </h2>
        </div>
      </Link>
      <div className="mt-1 flex items-center justify-between gap-2 text-xs text-muted">
        <span className="truncate">{statusText}</span>
        <div className="flex shrink-0 items-center gap-2">
        <AlbumFormModal
          album={album}
          categories={categories}
          trigger={
            <span
              className="text-muted transition hover:text-ink"
              onClick={(event) => event.stopPropagation()}
            >
              编辑
            </span>
          }
        />
        <Link
          href={`/album/${album.slug}`}
          className="text-muted transition hover:text-ink"
          onClick={(event) => event.stopPropagation()}
          target="_blank"
        >
          预览
        </Link>
        </div>
      </div>
    </div>
  );
}
