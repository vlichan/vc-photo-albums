import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { PhotoUploadForm } from "@/components/admin/photo-upload-form";
import { PhotoManager } from "@/components/admin/photo-manager";
import { getAdminAlbumById, getAdminPhotos } from "@/lib/supabase/admin";

type AdminAlbumDetailPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function AdminAlbumDetailPage({
  params
}: AdminAlbumDetailPageProps) {
  const { id } = await params;
  const [album, photos] = await Promise.all([
    getAdminAlbumById(id),
    getAdminPhotos(id)
  ]);

  return (
    <main className="min-h-screen bg-paper px-5 py-8 md:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8 flex items-center justify-between gap-4">
          <div>
            <Link
              href="/admin/albums"
              className="inline-flex items-center gap-2 text-sm text-muted transition hover:text-ink"
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </Link>
            <h1 className="mt-3 text-4xl font-medium text-ink">{album.title}</h1>
            <p className="mt-2 text-sm text-muted">/{album.slug}</p>
          </div>
          <Link href={`/album/${album.slug}`} className="border border-ink px-4 py-2 text-sm text-ink">
            查看前台
          </Link>
        </div>

        <div className="grid gap-8 lg:grid-cols-[0.85fr_1.15fr]">
          <PhotoUploadForm albumId={album.id} />
          <PhotoManager albumId={album.id} albumSlug={album.slug} photos={photos} />
        </div>
      </div>
    </main>
  );
}
