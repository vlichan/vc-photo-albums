import type { AlbumWithCategory, Category } from "@/types/album";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type CategoryRow = {
  id: string;
  name: string;
  slug: string;
  created_at: string;
};

type AlbumRow = {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  cover_image: string;
  category_id: string | null;
  password: string | null;
  is_public: boolean;
  created_at: string;
  categories: { name: string } | { name: string }[] | null;
};

function formatDate(value: string) {
  return value.slice(0, 10);
}

function mapCategory(row: CategoryRow): Category {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    createdAt: formatDate(row.created_at)
  };
}

function mapAlbum(row: AlbumRow): AlbumWithCategory {
  const category = Array.isArray(row.categories) ? row.categories[0] : row.categories;

  return {
    id: row.id,
    title: row.title,
    slug: row.slug,
    description: row.description ?? "",
    coverImage: row.cover_image,
    categoryId: row.category_id ?? "",
    categoryName: category?.name ?? "Uncategorized",
    password: row.password ?? undefined,
    isPublic: row.is_public,
    createdAt: formatDate(row.created_at)
  };
}

export async function getHomeCategories() {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("categories")
    .select("id, name, slug, created_at")
    .order("created_at", { ascending: true });

  if (error) {
    throw new Error(`Failed to load categories: ${error.message}`);
  }

  return (data ?? []).map(mapCategory);
}

export async function getHomeAlbums(categorySlug?: string) {
  const supabase = await createSupabaseServerClient();
  const query = supabase
    .from("albums")
    .select(
      categorySlug
        ? "id, title, slug, description, cover_image, category_id, password, is_public, created_at, categories!inner(name, slug)"
        : "id, title, slug, description, cover_image, category_id, password, is_public, created_at, categories(name)"
    )
    .not("cover_image", "is", null)
    .order("created_at", { ascending: false });

  if (categorySlug) {
    query.eq("categories.slug", categorySlug);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(`Failed to load albums: ${error.message}`);
  }

  return (data ?? []).map((row) => mapAlbum(row as AlbumRow));
}
