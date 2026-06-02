import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { CopyLinkButton } from "@/components/ui/copy-link-button";
import { PhotoGrid } from "@/components/gallery/photo-grid";
import { WhatsappButton } from "@/components/layout/whatsapp-button";
import {
  getPublicAlbumBySlug,
  getPublicAlbumPhotos
} from "@/lib/supabase/public-albums";

type AlbumPageProps = {
  params: Promise<{
    slug: string;
  }>;
};

export default async function AlbumPage({ params }: AlbumPageProps) {
  const { slug } = await params;
  const album = await getPublicAlbumBySlug(slug);

  if (!album) {
    notFound();
  }

  const albumPhotos = await getPublicAlbumPhotos(album.id);
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  const shareUrl = `${siteUrl}/album/${album.slug}`;

  return (
    <main className="min-h-screen bg-paper px-5 py-6 md:px-8 md:py-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm text-muted transition hover:text-ink"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Link>
          <CopyLinkButton value={shareUrl} />
        </div>

        <header className="mb-10 grid gap-6 border-b border-line pb-8 md:grid-cols-[1fr_auto] md:items-end">
          <div>
            <p className="mb-3 text-xs uppercase tracking-[0.24em] text-moss">
              {album.categoryName}
            </p>
            <h1 className="text-4xl font-medium leading-tight text-ink md:text-6xl">
              {album.title}
            </h1>
            <p className="mt-4 max-w-2xl text-base leading-8 text-muted">
              {album.description}
            </p>
          </div>
          <div className="text-sm text-muted">
            {albumPhotos.length.toString().padStart(2, "0")} photos
          </div>
        </header>

        {album.password ? (
          <section className="mb-8 border border-line bg-white p-5">
            <p className="text-sm text-muted">
              这个相册已设置访问密码。当前阶段先展示图片数据，后续会接入密码校验。
            </p>
          </section>
        ) : null}

        <PhotoGrid photos={albumPhotos} />
      </div>
      <WhatsappButton />
    </main>
  );
}
