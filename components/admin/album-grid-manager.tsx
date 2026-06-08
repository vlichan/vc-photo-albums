"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import type { AlbumWithCategory, Category } from "@/types/album";
import { deleteAlbum } from "@/app/admin/albums/actions";
import { AlbumFormModal } from "@/components/admin/album-form-modal";
import { AlbumGridCard } from "@/components/admin/album-grid-card";

export function AlbumGridManager({
  albums,
  categories,
  activeCategorySlug
}: {
  albums: AlbumWithCategory[];
  categories: Category[];
  activeCategorySlug?: string;
}) {
  const router = useRouter();
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isPending, startTransition] = useTransition();
  const selectedAlbums = albums.filter((album) => selectedIds.includes(album.id));

  function toggleAlbum(albumId: string) {
    setSelectedIds((current) =>
      current.includes(albumId)
        ? current.filter((id) => id !== albumId)
        : [...current, albumId]
    );
  }

  function changeCategory(categorySlug: string) {
    setSelectedIds([]);
    router.push(categorySlug ? `/admin/albums?category=${categorySlug}` : "/admin/albums");
  }

  function deleteSelectedAlbums() {
    if (selectedAlbums.length === 0) {
      return;
    }

    const names = selectedAlbums.map((album) => `「${album.title}」`).join("、");
    const confirmed = window.confirm(
      `确定删除 ${selectedAlbums.length} 个相册吗？\n${names}\n\n将先删除该相册下所有 R2 图片文件，再删除 photos 记录和 albums 记录。此操作无法恢复。`
    );

    if (!confirmed) {
      return;
    }

    startTransition(async () => {
      try {
        for (const albumId of selectedIds) {
          const formData = new FormData();
          formData.append("id", albumId);
          await deleteAlbum(formData);
        }

        setSelectedIds([]);
        router.refresh();
      } catch (error) {
        window.alert(error instanceof Error ? error.message : "删除相册失败。");
      }
    });
  }

  return (
    <section>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted">
          {albums.length} 个相册
          {selectedIds.length > 0 ? ` · 已选择 ${selectedIds.length} 个` : ""}
        </p>
        <div className="flex flex-wrap items-center gap-2">
          <label className="flex items-center gap-2 text-sm text-muted">
            <span>筛选分类</span>
            <select
              className="border border-line bg-white px-3.5 py-2 text-sm text-ink outline-none transition focus:border-ink"
              onChange={(event) => changeCategory(event.target.value)}
              value={activeCategorySlug ?? ""}
            >
              <option value="">全部分类</option>
              {categories.map((category) => (
                <option key={category.id} value={category.slug}>
                  {category.name}
                </option>
              ))}
            </select>
          </label>
          <AlbumFormModal
            categories={categories}
            trigger={
              <span className="inline-flex border border-ink bg-ink px-3.5 py-2 text-sm text-paper">
                新建相册
              </span>
            }
          />
          <button
            className="border border-line px-3.5 py-2 text-sm text-muted transition hover:border-ink hover:text-ink disabled:cursor-not-allowed disabled:opacity-45"
            disabled={selectedIds.length === 0 || isPending}
            onClick={deleteSelectedAlbums}
            type="button"
          >
            {isPending ? "删除中..." : "删除相册"}
          </button>
          <Link
            href="/admin/categories"
            className="border border-line px-3.5 py-2 text-sm text-muted transition hover:border-ink hover:text-ink"
          >
            分类管理
          </Link>
        </div>
      </div>

      {albums.length === 0 ? (
        <div className="border border-line bg-white p-8 text-sm text-muted">
          暂无相册。先创建一个相册，再进入图片管理上传产品图片。
        </div>
      ) : null}

      <div className="grid grid-cols-2 gap-x-3 gap-y-6 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-7 2xl:grid-cols-8">
        {albums.map((album) => (
          <AlbumGridCard
            key={album.id}
            album={album}
            categories={categories}
            isSelected={selectedIds.includes(album.id)}
            onToggle={() => toggleAlbum(album.id)}
          />
        ))}
      </div>
    </section>
  );
}
