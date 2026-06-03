import { AlbumCard } from "@/components/gallery/album-card";
import { SiteHeader } from "@/components/layout/site-header";
import { WhatsappButton } from "@/components/layout/whatsapp-button";
import { getHomeAlbums, getHomeCategories } from "@/lib/supabase/home";

export const dynamic = "force-dynamic";

type HomePageProps = {
  searchParams: Promise<{
    category?: string;
  }>;
};

export default async function HomePage({ searchParams }: HomePageProps) {
  const { category } = await searchParams;
  const [categories, albums] = await Promise.all([
    getHomeCategories(),
    getHomeAlbums(category)
  ]);
  const activeCategory = category ?? "all";
  const activeCategoryName =
    activeCategory === "all"
      ? "All albums"
      : categories.find((item) => item.slug === activeCategory)?.name ?? "Albums";

  return (
    <main className="min-h-screen bg-paper">
      <SiteHeader />
      <section className="mx-auto max-w-7xl px-4 pb-6 pt-7 md:px-8 md:pb-8 md:pt-10">
        <div className="grid gap-6 border-b border-line pb-6 md:grid-cols-[1fr_auto] md:items-end">
          <div className="space-y-3">
            <p className="text-[11px] font-medium uppercase tracking-[0.24em] text-muted">
              Private Product Albums
            </p>
            <h1 className="max-w-2xl text-3xl font-medium leading-tight text-ink md:text-5xl">
              Product Catalog
            </h1>
            <p className="max-w-xl text-sm leading-7 text-muted md:text-base">
              安静、清晰、图片优先的产品图册，适合客户快速浏览、收藏编号和转发相册链接。
            </p>
          </div>
          <div className="text-left md:text-right">
            <p className="text-2xl font-medium text-ink">{albums.length}</p>
            <p className="text-xs uppercase tracking-[0.18em] text-muted">
              {activeCategoryName}
            </p>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 md:px-8">
        <div className="-mx-4 flex gap-2 overflow-x-auto border-b border-line px-4 pb-4 text-sm md:mx-0 md:flex-wrap md:overflow-visible md:px-0">
          <a
            href="/"
            className={`shrink-0 border px-4 py-2.5 transition ${
              activeCategory === "all"
                ? "border-ink bg-ink text-paper"
                : "border-line bg-transparent text-muted hover:border-ink hover:text-ink"
            }`}
          >
            All
          </a>
          {categories.map((category) => (
            <a
              key={category.id}
              href={`/?category=${category.slug}`}
              className={`shrink-0 border px-4 py-2.5 transition ${
                activeCategory === category.slug
                  ? "border-ink bg-ink text-paper"
                  : "border-line bg-transparent text-muted hover:border-ink hover:text-ink"
              }`}
            >
              {category.name}
            </a>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 pb-24 pt-6 md:px-8 md:pt-8">
        <div className="grid gap-x-5 gap-y-8 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {albums.length === 0 ? (
            <div className="border border-line bg-white/55 p-8 text-sm text-muted sm:col-span-2 lg:col-span-3 xl:col-span-4">
              当前分类暂无相册。
            </div>
          ) : null}
          {albums.map((album) => (
            <AlbumCard key={album.id} album={album} />
          ))}
        </div>
      </section>
      <WhatsappButton />
    </main>
  );
}
