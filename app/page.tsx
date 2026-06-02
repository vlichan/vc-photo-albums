import { AlbumCard } from "@/components/gallery/album-card";
import { SiteHeader } from "@/components/layout/site-header";
import { WhatsappButton } from "@/components/layout/whatsapp-button";
import { getHomeAlbums, getHomeCategories } from "@/lib/supabase/home";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const [categories, albums] = await Promise.all([
    getHomeCategories(),
    getHomeAlbums()
  ]);

  return (
    <main className="min-h-screen bg-paper">
      <SiteHeader />
      <section className="mx-auto grid max-w-7xl gap-10 px-5 py-12 md:px-8 md:py-16 lg:grid-cols-[0.8fr_1.2fr] lg:items-end">
        <div className="space-y-6">
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-moss">
            Private Product Albums
          </p>
          <h1 className="max-w-2xl text-4xl font-medium leading-tight text-ink md:text-6xl">
            高级极简图片相册
          </h1>
          <p className="max-w-xl text-base leading-8 text-muted">
            用清晰、安静、图片优先的方式向客户展示产品系列。每个相册都有独立链接，适合手机快速浏览和转发。
          </p>
        </div>
        <div className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
          {categories.map((category) => (
            <a
              key={category.id}
              href={`#${category.slug}`}
              className="border border-line bg-white px-4 py-3 text-center text-muted transition hover:border-ink hover:text-ink"
            >
              {category.name}
            </a>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 pb-24 md:px-8">
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {albums.map((album) => (
            <AlbumCard key={album.id} album={album} />
          ))}
        </div>
      </section>
      <WhatsappButton />
    </main>
  );
}
