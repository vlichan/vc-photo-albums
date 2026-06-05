import Link from "next/link";
import { AdminShell } from "@/components/admin/admin-shell";
import { AdminCopyLinkButton } from "@/components/admin/admin-copy-link-button";
import { AlbumFormModal } from "@/components/admin/album-form-modal";
import { PhotoUploadForm } from "@/components/admin/photo-upload-form";
import { PhotoManager } from "@/components/admin/photo-manager";
import {
  getAdminAlbumById,
  getAdminCategories,
  getAdminPhotos
} from "@/lib/supabase/admin";

type AdminAlbumDetailPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function AdminAlbumDetailPage({
  params
}: AdminAlbumDetailPageProps) {
  const { id } = await params;
  const [album, photos, categories] = await Promise.all([
    getAdminAlbumById(id),
    getAdminPhotos(id),
    getAdminCategories()
  ]);
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  const publicUrl = `${siteUrl}/album/${album.slug}`;

  return (
    <AdminShell
      active="albums"
      actions={
        <>
          <AlbumFormModal
            album={album}
            categories={categories}
            trigger={
              <span className="inline-flex border border-ink px-3.5 py-2 text-sm text-ink">
                编辑相册
              </span>
            }
          />
          <Link
            href="/admin/albums"
            className="border border-line px-3.5 py-2 text-sm text-muted transition hover:border-ink hover:text-ink"
          >
            返回相册管理
          </Link>
          <AdminCopyLinkButton value={publicUrl} />
          <Link
            href={`/album/${album.slug}`}
            className="border border-ink px-3.5 py-2 text-sm text-ink"
          >
            查看前台
          </Link>
        </>
      }
      description={`/${album.slug} · ${album.categoryName} · ${photos.length} 张图片 · ${
        album.isPublic ? "公开" : "私密"
      }${album.password ? " · 已设置密码" : ""}`}
      title={album.title}
    >
        <section className="mb-4 flex flex-wrap items-center gap-2 text-xs uppercase tracking-[0.14em] text-muted">
          <span className="border border-line bg-white px-3 py-1.5">
            {album.categoryName}
          </span>
          <span className="border border-line bg-white px-3 py-1.5">
            {photos.length} 张图片
          </span>
          <span className="border border-line bg-white px-3 py-1.5">
            {album.isPublic ? "公开" : "私密"}
          </span>
          {album.password ? (
            <span className="border border-line bg-white px-3 py-1.5">已设置密码</span>
          ) : null}
        </section>
        <div className="space-y-5">
          <PhotoUploadForm albumId={album.id} />
          <PhotoManager
            albumId={album.id}
            albumSlug={album.slug}
            coverImage={album.coverImage}
            photos={photos}
          />
        </div>
    </AdminShell>
  );
}
