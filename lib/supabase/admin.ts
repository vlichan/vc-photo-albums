import type { AlbumWithCategory, Category, Photo } from "@/types/album";
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
};

type PhotoRow = {
  id: string;
  album_id: string;
  image_url: string;
  thumbnail_url: string;
  sort_order: number;
  image_code: string;
  mime_type: string | null;
  file_size: number | null;
  width: number | null;
  height: number | null;
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

function mapAlbum(row: AlbumRow): AlbumWithCategory {
  const category = Array.isArray(row.categories) ? row.categories[0] : row.categories;

  return {
    id: row.id,
    title: row.title,
    slug: row.slug,
    description: row.description ?? "",
    coverImage: row.cover_image ?? "",
    categoryId: row.category_id ?? "",
    categoryName: category?.name ?? "Uncategorized",
    password: row.password ?? undefined,
    isPublic: row.is_public,
    createdAt: formatDate(row.created_at)
  };
}

function mapPhoto(row: PhotoRow): Photo {
  return {
    id: row.id,
    albumId: row.album_id,
    imageUrl: row.image_url,
    thumbnailUrl: row.thumbnail_url,
    sortOrder: row.sort_order,
    imageCode: row.image_code,
    mimeType: row.mime_type ?? "",
    fileSize: row.file_size ?? 0,
    width: row.width ?? 1200,
    height: row.height ?? 1200,
    createdAt: formatDate(row.created_at)
  };
}

export async function getAdminCategories() {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("categories")
    .select("id, name, slug, created_at")
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(`Failed to load categories: ${error.message}`);
  }

  return (data ?? []).map((row) => mapCategory(row as CategoryRow));
}

export async function getAdminAlbums() {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("albums")
    .select(
      "id, title, slug, description, cover_image, category_id, password, is_public, created_at, categories(name)"
    )
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(`Failed to load albums: ${error.message}`);
  }

  return (data ?? []).map((row) => mapAlbum(row as AlbumRow));
}

export async function getAdminAlbumById(id: string) {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("albums")
    .select(
      "id, title, slug, description, cover_image, category_id, password, is_public, created_at, categories(name)"
    )
    .eq("id", id)
    .single();

  if (error) {
    throw new Error(`Failed to load album: ${error.message}`);
  }

  return mapAlbum(data as AlbumRow);
}

export async function getAdminPhotos(albumId: string) {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("photos")
    .select(
      "id, album_id, image_url, thumbnail_url, sort_order, image_code, mime_type, file_size, width, height, created_at"
    )
    .eq("album_id", albumId)
    .order("sort_order", { ascending: true });

  if (error) {
    throw new Error(`Failed to load photos: ${error.message}`);
  }

  return (data ?? []).map((row) => mapPhoto(row as PhotoRow));
}

export async function getAdminCounts() {
  const supabase = await createSupabaseServerClient();
  const [albumsResult, categoriesResult, photosResult] = await Promise.all([
    supabase.from("albums").select("id", { count: "exact", head: true }),
    supabase.from("categories").select("id", { count: "exact", head: true }),
    supabase.from("photos").select("id", { count: "exact", head: true })
  ]);

  if (albumsResult.error) {
    throw new Error(`Failed to count albums: ${albumsResult.error.message}`);
  }

  if (categoriesResult.error) {
    throw new Error(`Failed to count categories: ${categoriesResult.error.message}`);
  }

  if (photosResult.error) {
    throw new Error(`Failed to count photos: ${photosResult.error.message}`);
  }

  return {
    albums: albumsResult.count ?? 0,
    categories: categoriesResult.count ?? 0,
    photos: photosResult.count ?? 0
  };
}
