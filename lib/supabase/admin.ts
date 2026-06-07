import type { AlbumWithCategory, Category, Photo } from "@/types/album";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type CategoryRow = {
  id: string;
  name: string;
  slug: string;
  created_at: string;
  albums?: { count: number } | { count: number }[] | null;
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
  photos?: { count: number } | { count: number }[] | null;
};

type AlbumFallbackPhotoRow = {
  album_id: string;
  image_url: string | null;
  thumbnail_url: string | null;
  sort_order: number | null;
  created_at: string;
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

type PhotoSizeRow = {
  file_size: number | null;
};

export type AdminStorageUsage = {
  ok: boolean;
  totalUsedBytes: number;
  limitBytes: number;
  limitGb: number;
  missingFileSizeCount: number;
  errorMessage?: string;
};

const STORAGE_PAGE_SIZE = 1000;
const BYTES_PER_GB = 1024 ** 3;

function formatDate(value: string) {
  return value.slice(0, 10);
}

function getStorageLimitGb() {
  const value = Number(process.env.R2_FREE_STORAGE_LIMIT_GB);
  return Number.isFinite(value) && value > 0 ? value : 10;
}

function mapCategory(row: CategoryRow): Category {
  const albumCount = Array.isArray(row.albums) ? row.albums[0] : row.albums;

  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    createdAt: formatDate(row.created_at),
    albumCount: albumCount?.count ?? 0,
    sortOrder: null
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
  const photoCount = Array.isArray(row.photos) ? row.photos[0] : row.photos;

  return {
    id: row.id,
    title: row.title,
    slug: row.slug,
    description: row.description ?? "",
    coverImage: row.cover_image || fallbackCoverImage,
    categoryId: row.category_id ?? "",
    categoryName: category?.name ?? "未分类",
    photoCount: photoCount?.count ?? 0,
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
    .select("id, name, slug, created_at, albums(count)")
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(`分类读取失败：${error.message}`);
  }

  return (data ?? []).map((row) => mapCategory(row as CategoryRow));
}

export async function getAdminAlbums(categorySlug?: string) {
  const supabase = await createSupabaseServerClient();
  const query = supabase
    .from("albums")
    .select(
      categorySlug
        ? "id, title, slug, description, cover_image, category_id, password, is_public, created_at, categories!inner(name, slug), photos(count)"
        : "id, title, slug, description, cover_image, category_id, password, is_public, created_at, categories(name), photos(count)"
    )
    .order("created_at", { ascending: false });

  if (categorySlug) {
    query.eq("categories.slug", categorySlug);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(`相册读取失败：${error.message}`);
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
    throw new Error(`相册兜底封面读取失败：${fallbackRows.error.message}`);
  }

  const fallbackCoverByAlbumId = getFallbackCoverByAlbumId(
    (fallbackRows.data ?? []) as AlbumFallbackPhotoRow[]
  );

  return rows.map((row) => mapAlbum(row, fallbackCoverByAlbumId.get(row.id) ?? ""));
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
    throw new Error(`相册读取失败：${error.message}`);
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
    throw new Error(`图片读取失败：${error.message}`);
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
    throw new Error(`相册数量读取失败：${albumsResult.error.message}`);
  }

  if (categoriesResult.error) {
    throw new Error(`分类数量读取失败：${categoriesResult.error.message}`);
  }

  if (photosResult.error) {
    throw new Error(`图片数量读取失败：${photosResult.error.message}`);
  }

  return {
    albums: albumsResult.count ?? 0,
    categories: categoriesResult.count ?? 0,
    photos: photosResult.count ?? 0
  };
}

export async function getAdminStorageUsage(): Promise<AdminStorageUsage> {
  const supabase = await createSupabaseServerClient();
  const limitGb = getStorageLimitGb();
  let totalUsedBytes = 0;
  let missingFileSizeCount = 0;
  let from = 0;

  try {
    while (true) {
      const { data, error } = await supabase
        .from("photos")
        .select("file_size")
        .range(from, from + STORAGE_PAGE_SIZE - 1);

      if (error) {
        return {
          ok: false,
          totalUsedBytes: 0,
          limitBytes: limitGb * BYTES_PER_GB,
          limitGb,
          missingFileSizeCount,
          errorMessage: `存储统计失败：${error.message}`
        };
      }

      const rows = (data ?? []) as PhotoSizeRow[];

      for (const row of rows) {
        if (typeof row.file_size === "number" && Number.isFinite(row.file_size)) {
          totalUsedBytes += row.file_size;
        } else {
          missingFileSizeCount += 1;
        }
      }

      if (rows.length < STORAGE_PAGE_SIZE) {
        break;
      }

      from += STORAGE_PAGE_SIZE;
    }

    return {
      ok: true,
      totalUsedBytes,
      limitBytes: limitGb * BYTES_PER_GB,
      limitGb,
      missingFileSizeCount
    };
  } catch (error) {
    return {
      ok: false,
      totalUsedBytes: 0,
      limitBytes: limitGb * BYTES_PER_GB,
      limitGb,
      missingFileSizeCount,
      errorMessage: error instanceof Error ? error.message : "存储统计失败：未知错误。"
    };
  }
}
