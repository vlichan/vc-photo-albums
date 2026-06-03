"use server";

import { revalidatePath } from "next/cache";
import { deleteImageFromR2 } from "@/lib/r2/upload";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export type PhotoActionState = {
  ok: boolean;
  message: string;
};

type PhotoDeleteRow = {
  id: string;
  image_url: string;
  thumbnail_url: string;
};

const SORT_ORDER_STEP = 1000;

function getRequiredString(formData: FormData, key: string) {
  const value = formData.get(key);

  if (typeof value !== "string" || value.trim() === "") {
    throw new Error(`${key} is required.`);
  }

  return value.trim();
}

function getOptionalString(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" && value.trim() !== "" ? value.trim() : null;
}

function parseJsonStringArray(value: string, key: string) {
  try {
    const parsed = JSON.parse(value);

    if (!Array.isArray(parsed) || parsed.some((item) => typeof item !== "string")) {
      throw new Error();
    }

    return parsed as string[];
  } catch {
    throw new Error(`${key} must be a JSON string array.`);
  }
}

async function deleteR2Urls(urls: string[]) {
  const uniqueUrls = Array.from(new Set(urls));

  for (const url of uniqueUrls) {
    await deleteImageFromR2(url);
  }
}

export async function updatePhotoOrderWithState(
  _state: PhotoActionState,
  formData: FormData
): Promise<PhotoActionState> {
  const supabase = await createSupabaseServerClient();

  try {
    const albumId = getRequiredString(formData, "album_id");
    const albumSlug = getRequiredString(formData, "album_slug");
    const movedPhotoId = getRequiredString(formData, "moved_photo_id");
    const beforePhotoId = getOptionalString(formData, "before_photo_id");
    const afterPhotoId = getOptionalString(formData, "after_photo_id");
    const photoIds = parseJsonStringArray(
      getRequiredString(formData, "ordered_photo_ids"),
      "ordered_photo_ids"
    );

    const neighborIds = [movedPhotoId, beforePhotoId, afterPhotoId].filter(
      (id): id is string => Boolean(id)
    );
    const { data: neighborRows, error: loadError } = await supabase
      .from("photos")
      .select("id, sort_order")
      .eq("album_id", albumId)
      .in("id", neighborIds);

    if (loadError) {
      return {
        ok: false,
        message: `排序保存失败：${loadError.message}`
      };
    }

    const sortOrderById = new Map(
      (neighborRows ?? []).map((row) => [row.id as string, row.sort_order as number])
    );
    const beforeSortOrder = beforePhotoId ? sortOrderById.get(beforePhotoId) : null;
    const afterSortOrder = afterPhotoId ? sortOrderById.get(afterPhotoId) : null;

    let nextSortOrder: number | null = null;

    if (beforeSortOrder === null && afterSortOrder === null) {
      nextSortOrder = SORT_ORDER_STEP;
    } else if (beforeSortOrder === null && typeof afterSortOrder === "number") {
      nextSortOrder = afterSortOrder - SORT_ORDER_STEP;
    } else if (typeof beforeSortOrder === "number" && afterSortOrder === null) {
      nextSortOrder = beforeSortOrder + SORT_ORDER_STEP;
    } else if (typeof beforeSortOrder === "number" && typeof afterSortOrder === "number") {
      const gap = afterSortOrder - beforeSortOrder;

      if (gap > 1) {
        nextSortOrder = Math.floor((beforeSortOrder + afterSortOrder) / 2);
      }
    }

    if (nextSortOrder !== null) {
      const { error } = await supabase
        .from("photos")
        .update({
          sort_order: nextSortOrder
        })
        .eq("id", movedPhotoId)
        .eq("album_id", albumId);

      if (error) {
        return {
          ok: false,
          message: `排序保存失败：${error.message}`
        };
      }
    } else {
      const results = await Promise.all(
        photoIds.map((photoId, index) =>
          supabase
            .from("photos")
            .update({
              sort_order: (index + 1) * SORT_ORDER_STEP
            })
            .eq("id", photoId)
            .eq("album_id", albumId)
        )
      );

      const failedResult = results.find((result) => result.error);

      if (failedResult?.error) {
        return {
          ok: false,
          message: `排序保存失败：${failedResult.error.message}`
        };
      }
    }

    revalidatePath(`/admin/albums/${albumId}`);
    revalidatePath(`/album/${albumSlug}`);

    return {
      ok: true,
      message: "排序已保存，图片编号保持不变。"
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown sort error.";

    return {
      ok: false,
      message: `排序保存失败：${message}`
    };
  }
}

export async function deleteAlbumPhotosWithState(
  _state: PhotoActionState,
  formData: FormData
): Promise<PhotoActionState> {
  const supabase = await createSupabaseServerClient();

  try {
    const albumId = getRequiredString(formData, "album_id");
    const albumSlug = getRequiredString(formData, "album_slug");
    const photoIds = parseJsonStringArray(
      getRequiredString(formData, "photo_ids"),
      "photo_ids"
    );

    if (photoIds.length === 0) {
      return {
        ok: false,
        message: "请先选择要删除的图片。"
      };
    }

    const { data, error: loadError } = await supabase
      .from("photos")
      .select("id, image_url, thumbnail_url")
      .eq("album_id", albumId)
      .in("id", photoIds);

    if (loadError) {
      return {
        ok: false,
        message: `读取 photos 记录失败：${loadError.message}`
      };
    }

    const photos = (data ?? []) as PhotoDeleteRow[];

    if (photos.length !== photoIds.length) {
      return {
        ok: false,
        message: "部分图片记录不存在，未执行删除。"
      };
    }

    try {
      await deleteR2Urls(
        photos.flatMap((photo) => [photo.image_url, photo.thumbnail_url])
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown R2 delete error.";

      return {
        ok: false,
        message: `R2 删除失败，数据库记录未删除：${message}`
      };
    }

    const { error: deleteError } = await supabase
      .from("photos")
      .delete()
      .eq("album_id", albumId)
      .in("id", photoIds);

    if (deleteError) {
      return {
        ok: false,
        message: `Supabase photos 记录删除失败：${deleteError.message}`
      };
    }

    revalidatePath(`/admin/albums/${albumId}`);
    revalidatePath(`/album/${albumSlug}`);

    return {
      ok: true,
      message: `已删除 ${photoIds.length} 张图片。`
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown delete error.";

    return {
      ok: false,
      message
    };
  }
}

export async function setAlbumCoverWithState(
  _state: PhotoActionState,
  formData: FormData
): Promise<PhotoActionState> {
  const supabase = await createSupabaseServerClient();

  try {
    const albumId = getRequiredString(formData, "album_id");
    const albumSlug = getRequiredString(formData, "album_slug");
    const coverImage = getRequiredString(formData, "cover_image");

    const { error } = await supabase
      .from("albums")
      .update({
        cover_image: coverImage
      })
      .eq("id", albumId);

    if (error) {
      return {
        ok: false,
        message: `封面设置失败：${error.message}`
      };
    }

    revalidatePath("/");
    revalidatePath("/admin/albums");
    revalidatePath(`/admin/albums/${albumId}`);
    revalidatePath(`/album/${albumSlug}`);

    return {
      ok: true,
      message: "封面已更新。"
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown cover error.";

    return {
      ok: false,
      message
    };
  }
}
