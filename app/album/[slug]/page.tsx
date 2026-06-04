import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import { ArrowLeft, MessageCircle } from "lucide-react";
import Link from "next/link";
import { CopyLinkButton } from "@/components/ui/copy-link-button";
import { AlbumPasswordForm } from "@/components/gallery/album-password-form";
import { PhotoGrid } from "@/components/gallery/photo-grid";
import { getAlbumAccessCookieName } from "@/lib/utils/album-access";
import {
  getPublicAlbumBySlug,
  getPublicAlbumPhotos
} from "@/lib/supabase/public-albums";

type AlbumPageProps = {
  params: Promise<{
    slug: string;
  }>;
  searchParams: Promise<{
    page?: string;
  }>;
};

const PHOTOS_PER_PAGE = 100;

function getPageNumber(value?: string) {
  const page = Number(value);
  return Number.isInteger(page) && page > 0 ? page : 1;
}

function getPageHref(slug: string, page: number) {
  return page > 1 ? `/album/${slug}?page=${page}` : `/album/${slug}`;
}

function Pagination({
  currentPage,
  totalPages,
  slug
}: {
  currentPage: number;
  totalPages: number;
  slug: string;
}) {
  if (totalPages <= 1) {
    return null;
  }

  const previousPage = Math.max(currentPage - 1, 1);
  const nextPage = Math.min(currentPage + 1, totalPages);

  return (
    <nav className="grid grid-cols-[1fr_auto_1fr] items-center gap-3 border-t border-line pt-5 text-sm text-muted">
      <Link
        aria-disabled={currentPage === 1}
        className={`justify-self-end border px-4 py-2.5 transition ${
          currentPage === 1
            ? "pointer-events-none border-line text-muted/45"
            : "border-line text-ink hover:border-ink"
        }`}
        href={getPageHref(slug, previousPage)}
      >
        Previous
      </Link>
      <div className="text-xs uppercase tracking-[0.18em]">
        Page {currentPage} / {totalPages}
      </div>
      <Link
        aria-disabled={currentPage === totalPages}
        className={`justify-self-start border px-4 py-2.5 transition ${
          currentPage === totalPages
            ? "pointer-events-none border-line text-muted/45"
            : "border-line text-ink hover:border-ink"
        }`}
        href={getPageHref(slug, nextPage)}
      >
        Next
      </Link>
    </nav>
  );
}

export default async function AlbumPage({ params, searchParams }: AlbumPageProps) {
  const { slug } = await params;
  const { page } = await searchParams;
  const album = await getPublicAlbumBySlug(slug);

  if (!album) {
    notFound();
  }

  const cookieStore = await cookies();
  const hasAlbumAccess =
    !album.password ||
    cookieStore.get(getAlbumAccessCookieName(album.id))?.value === "granted";
  const albumPhotos = hasAlbumAccess ? await getPublicAlbumPhotos(album.id) : [];
  const totalPages = Math.max(1, Math.ceil(albumPhotos.length / PHOTOS_PER_PAGE));
  const currentPage = Math.min(getPageNumber(page), totalPages);
  const pageStartIndex = (currentPage - 1) * PHOTOS_PER_PAGE;
  const visiblePhotos = albumPhotos.slice(pageStartIndex, pageStartIndex + PHOTOS_PER_PAGE);
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  const shareUrl = `${siteUrl}${getPageHref(album.slug, currentPage)}`;
  const whatsappPhone = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER;
  const whatsappHref = whatsappPhone
    ? `https://wa.me/${whatsappPhone}?text=${encodeURIComponent(
        `Hello, I would like to ask about ${album.title}: ${shareUrl}`
      )}`
    : null;

  return (
    <main className="min-h-screen bg-paper px-4 py-4 sm:px-6 md:px-8 md:py-5">
      <div className="mx-auto max-w-[1600px]">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
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

        <header className="mb-4 grid gap-3 border-b border-line pb-4 md:grid-cols-[1fr_auto] md:items-end">
          <div>
            <p className="mb-1.5 text-[11px] uppercase tracking-[0.22em] text-muted">
              {album.categoryName}
            </p>
            <h1 className="text-3xl font-medium leading-tight text-ink md:text-4xl">
              {album.title}
            </h1>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-muted">
              {album.description}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3 text-sm text-muted md:justify-end">
            <span>
              {hasAlbumAccess ? albumPhotos.length.toString().padStart(2, "0") : "--"} photos
            </span>
            {hasAlbumAccess && totalPages > 1 ? (
              <span>
                Page {currentPage}/{totalPages}
              </span>
            ) : null}
            {!album.isPublic ? <span>Private</span> : null}
          </div>
        </header>

        {hasAlbumAccess ? (
          <div className="space-y-5">
            <Pagination
              currentPage={currentPage}
              slug={album.slug}
              totalPages={totalPages}
            />
            <PhotoGrid photos={visiblePhotos} startIndex={pageStartIndex} />
            <Pagination
              currentPage={currentPage}
              slug={album.slug}
              totalPages={totalPages}
            />
          </div>
        ) : (
          <AlbumPasswordForm slug={album.slug} />
        )}
      </div>
    </main>
  );
}
