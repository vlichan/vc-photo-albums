import { AdminShell } from "@/components/admin/admin-shell";
import { AlbumGridManager } from "@/components/admin/album-grid-manager";
import { getAdminAlbums, getAdminCategories } from "@/lib/supabase/admin";

type AdminAlbumsPageProps = {
  searchParams: Promise<{
    category?: string;
  }>;
};

export default async function AdminAlbumsPage({ searchParams }: AdminAlbumsPageProps) {
  const { category } = await searchParams;
  const [albums, categories] = await Promise.all([
    getAdminAlbums(category),
    getAdminCategories()
  ]);
  const activeCategory = categories.find((item) => item.slug === category);

  return (
    <AdminShell
      active="albums"
      description={
        activeCategory
          ? `当前筛选：${activeCategory.name}。创建相册、设置分类/封面/密码，并进入图片管理。`
          : "创建相册、设置分类/封面/密码，并进入图片管理。"
      }
      title="相册管理"
    >
      <AlbumGridManager
        activeCategorySlug={activeCategory?.slug}
        albums={albums}
        categories={categories}
      />
    </AdminShell>
  );
}
