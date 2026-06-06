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
  cover_image: string | null;
  category_id: string | null;
  password: string | null;
  is_public: boolean;
  created_at: string;
  categories: { name: string } | { name: string }[] | null;
  photos: { count: number } | { count: number }[] | null;
};

type AlbumFallbackPhotoRow = {
  album_id: string;
  image_url: string | null;
  thumbnail_url: string | null;
  sort_order: number | null;
  created_at: string;
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

function getFallbackCoverByAlbumId(rows: AlbumFallbackPhotoRow[]) {
  const fallbackByAlbumId = new Map<string, string>();

  for (const row of rows) {
    if (fallbackByAlbumId.has(row.album_id)) {
      continue;
    }

    const coverUrl = row.thumbnail_url || row.image_url || "";

    if (coverUrl) {
      fallbackByAlbumId.set(row.album_id, coverUrl);
    }
  }

  return fallbackByAlbumId;
}

function mapAlbum(row: AlbumRow, fallbackCoverImage = ""): AlbumWithCategory {
  const category = Array.isArray(row.categories) ? row.categories[0] : row.categories;
  const photoCountRow = Array.isArray(row.photos) ? row.photos[0] : row.photos;

  return {
    id: row.id,
    title: row.title,
    slug: row.slug,
    description: row.description ?? "",
    coverImage: row.cover_image || fallbackCoverImage,
    categoryId: row.category_id ?? "",
    categoryName: category?.name ?? "Uncategorized",
    photoCount: photoCountRow?.count ?? 0,
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
        ? "id, title, slug, description, cover_image, category_id, password, is_public, created_at, categories!inner(name, slug), photos(count)"
        : "id, title, slug, description, cover_image, category_id, password, is_public, created_at, categories(name), photos(count)"
    )
    .eq("is_public", true)
    .order("created_at", { ascending: false });

  if (categorySlug) {
    query.eq("categories.slug", categorySlug);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(`Failed to load albums: ${error.message}`);
  }

  const rows = (data ?? []) as AlbumRow[];
  const albumIds = rows.map((row) => row.id);
  const fallbackRows =
    albumIds.length > 0
      ? await supabase
          .from("photos")
          .select("album_id, image_url, thumbnail_url, sort_order, created_at")
          .in("album_id", albumIds)
          .order("sort_order", { ascending: true })
          .order("created_at", { ascending: true })
          .limit(10000)
      : { data: [], error: null };

  if (fallbackRows.error) {
    throw new Error(`Failed to load album fallback covers: ${fallbackRows.error.message}`);
  }

  const fallbackCoverByAlbumId = getFallbackCoverByAlbumId(
    (fallbackRows.data ?? []) as AlbumFallbackPhotoRow[]
  );

  return rows.map((row) => mapAlbum(row, fallbackCoverByAlbumId.get(row.id) ?? ""));
}
