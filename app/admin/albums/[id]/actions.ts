"use server";

import { revalidatePath } from "next/cache";
import { getAdminAlbumById, getAdminPhotos } from "@/lib/supabase/admin";
import { deleteImageFromR2, uploadImageToR2 } from "@/lib/r2/upload";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type ImageMetadata = {
  name: string;
  width: number;
  height: number;
};

export type PhotoActionState = {
  ok: boolean;
  message: string;
};

type PhotoDeleteRow = {
  id: string;
  image_url: string;
  thumbnail_url: string;
};

function parseMetadata(value: FormDataEntryValue | null) {
  if (typeof value !== "string" || value.trim() === "") {
    return [] as ImageMetadata[];
  }

  try {
    return JSON.parse(value) as ImageMetadata[];
  } catch {
    return [] as ImageMetadata[];
  }
}

function getMetadataForFile(metadata: ImageMetadata[], file: File) {
  return metadata.find((item) => item.name === file.name);
}

function getRequiredString(formData: FormData, key: string) {
  const value = formData.get(key);

  if (typeof value !== "string" || value.trim() === "") {
    throw new Error(`${key} is required.`);
  }

  return value.trim();
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

function getGeneratedImageCode(sortOrder: number) {
  return sortOrder.toString().padStart(3, "0");
}

async function deleteR2Urls(urls: string[]) {
  const uniqueUrls = Array.from(new Set(urls));

  for (const url of uniqueUrls) {
    await deleteImageFromR2(url);
  }
}

export async function uploadAlbumPhotos(formData: FormData) {
  const albumId = formData.get("album_id");

  if (typeof albumId !== "string" || albumId.trim() === "") {
    throw new Error("album_id is required.");
  }

  const files = formData
    .getAll("photos")
    .filter((file): file is File => file instanceof File && file.size > 0);

  if (files.length === 0) {
    throw new Error("Please choose at least one image.");
  }

  const album = await getAdminAlbumById(albumId);
  const existingPhotos = await getAdminPhotos(albumId);
  const metadata = parseMetadata(formData.get("image_metadata"));
  const supabase = await createSupabaseServerClient();
  const startOrder = existingPhotos.length;

  const rows = await Promise.all(
    files.map(async (file, index) => {
      const imageUrl = await uploadImageToR2(file, album.slug);
      const imageMetadata = getMetadataForFile(metadata, file);
      const sortOrder = startOrder + index + 1;

      return {
        album_id: album.id,
        image_url: imageUrl,
        thumbnail_url: imageUrl,
        sort_order: sortOrder,
        image_code: getGeneratedImageCode(sortOrder),
        mime_type: file.type || "application/octet-stream",
        file_size: file.size,
        width: imageMetadata?.width || 1200,
        height: imageMetadata?.height || 1200
      };
    })
  );

  const { error } = await supabase.from("photos").insert(rows);

  if (error) {
    throw new Error(`Failed to save photos: ${error.message}`);
  }

  revalidatePath(`/admin/albums/${album.id}`);
  revalidatePath(`/album/${album.slug}`);
}

export async function updatePhotoOrderWithState(
  _state: PhotoActionState,
  formData: FormData
): Promise<PhotoActionState> {
  const supabase = await createSupabaseServerClient();

  try {
    const albumId = getRequiredString(formData, "album_id");
    const albumSlug = getRequiredString(formData, "album_slug");
    const photoIds = parseJsonStringArray(
      getRequiredString(formData, "ordered_photo_ids"),
      "ordered_photo_ids"
    );

    const results = await Promise.all(
      photoIds.map((photoId, index) => {
        const sortOrder = index + 1;

        return supabase
          .from("photos")
          .update({
            sort_order: sortOrder,
            image_code: getGeneratedImageCode(sortOrder)
          })
          .eq("id", photoId)
          .eq("album_id", albumId);
      })
    );

    const failedResult = results.find((result) => result.error);

    if (failedResult?.error) {
      return {
        ok: false,
        message: `排序保存失败：${failedResult.error.message}`
      };
    }

    revalidatePath(`/admin/albums/${albumId}`);
    revalidatePath(`/album/${albumSlug}`);

    return {
      ok: true,
      message: "排序已保存，图片编号已自动更新。"
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
