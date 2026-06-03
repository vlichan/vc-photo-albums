import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import { ArrowLeft, MessageCircle } from "lucide-react";
import Link from "next/link";
import { CopyLinkButton } from "@/components/ui/copy-link-button";
import { AlbumPasswordForm } from "@/components/gallery/album-password-form";
import { PhotoGrid } from "@/components/gallery/photo-grid";
import { WhatsappButton } from "@/components/layout/whatsapp-button";
import { getAlbumAccessCookieName } from "@/lib/utils/album-access";
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

  const cookieStore = await cookies();
  const hasAlbumAccess =
    !album.password ||
    cookieStore.get(getAlbumAccessCookieName(album.id))?.value === "granted";
  const albumPhotos = hasAlbumAccess ? await getPublicAlbumPhotos(album.id) : [];
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  const shareUrl = `${siteUrl}/album/${album.slug}`;
  const whatsappPhone = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER;
  const whatsappHref = whatsappPhone
    ? `https://wa.me/${whatsappPhone}?text=${encodeURIComponent(
        `Hello, I would like to ask about ${album.title}: ${shareUrl}`
      )}`
    : null;

  return (
    <main className="min-h-screen bg-paper px-4 py-5 md:px-8 md:py-7">
      <div className="mx-auto max-w-7xl">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm text-muted transition hover:text-ink"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Link>
          <div className="flex flex-wrap items-center gap-2">
            <CopyLinkButton value={shareUrl} />
            {whatsappHref ? (
              <a
                className="inline-flex items-center gap-2 border border-line px-3.5 py-2 text-sm text-ink transition hover:border-ink"
                href={whatsappHref}
                rel="noreferrer"
                target="_blank"
              >
                <MessageCircle className="h-4 w-4" />
                WhatsApp
              </a>
            ) : null}
          </div>
        </div>

        <header className="mb-5 grid gap-4 border-b border-line pb-5 md:mb-7 md:grid-cols-[1fr_auto] md:items-end">
          <div>
            <p className="mb-2 text-[11px] uppercase tracking-[0.22em] text-muted">
              {album.categoryName}
            </p>
            <h1 className="text-3xl font-medium leading-tight text-ink md:text-5xl">
              {album.title}
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-muted md:text-base">
              {album.description}
            </p>
          </div>
          <div className="flex items-center gap-4 text-sm text-muted md:justify-end">
            <span>
              {hasAlbumAccess ? albumPhotos.length.toString().padStart(2, "0") : "--"} photos
            </span>
            {!album.isPublic ? <span>Private</span> : null}
          </div>
        </header>

        {hasAlbumAccess ? (
          <PhotoGrid photos={albumPhotos} />
        ) : (
          <AlbumPasswordForm slug={album.slug} />
        )}
      </div>
      <WhatsappButton />
    </main>
  );
}
