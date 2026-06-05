"use server";

import { revalidatePath } from "next/cache";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { deleteImageFromR2 } from "@/lib/r2/upload";

type AlbumPhotoDeleteRow = {
  id: string;
  image_url: string;
  thumbnail_url: string;
};

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

function getAlbumPayload(formData: FormData) {
  return {
    title: getRequiredString(formData, "title"),
    slug: getRequiredString(formData, "slug"),
    description: getOptionalString(formData, "description") ?? "",
    cover_image: getOptionalString(formData, "cover_image"),
    category_id: getOptionalString(formData, "category_id"),
    password: getOptionalString(formData, "password"),
    is_public: formData.get("is_public") === "on"
  };
}

async function deleteR2Urls(urls: string[]) {
  const uniqueUrls = Array.from(new Set(urls.filter(Boolean)));

  for (const url of uniqueUrls) {
    await deleteImageFromR2(url);
  }
}

export async function createAlbum(formData: FormData) {
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from("albums").insert(getAlbumPayload(formData));

  if (error) {
    throw new Error(`相册创建失败：${error.message}`);
  }

  revalidatePath("/");
  revalidatePath("/admin");
  revalidatePath("/admin/albums");
}

export async function updateAlbum(formData: FormData) {
  const supabase = await createSupabaseServerClient();
  const id = getRequiredString(formData, "id");
  const { error } = await supabase
    .from("albums")
    .update(getAlbumPayload(formData))
    .eq("id", id);

  if (error) {
    throw new Error(`相册保存失败：${error.message}`);
  }

  revalidatePath("/");
  revalidatePath("/admin");
  revalidatePath("/admin/albums");
}

export async function deleteAlbum(formData: FormData) {
  const supabase = await createSupabaseServerClient();
  const id = getRequiredString(formData, "id");

  const { data: photosData, error: loadPhotosError } = await supabase
    .from("photos")
    .select("id, image_url, thumbnail_url")
    .eq("album_id", id);

  if (loadPhotosError) {
    throw new Error(`相册图片读取失败：${loadPhotosError.message}`);
  }

  const photos = (photosData ?? []) as AlbumPhotoDeleteRow[];

  try {
    await deleteR2Urls(photos.flatMap((photo) => [photo.image_url, photo.thumbnail_url]));
  } catch (error) {
    const message = error instanceof Error ? error.message : "未知 R2 删除错误。";
    throw new Error(`R2 文件删除失败，相册未删除：${message}`);
  }

  if (photos.length > 0) {
    const { error: deletePhotosError } = await supabase
      .from("photos")
      .delete()
      .eq("album_id", id);

    if (deletePhotosError) {
      throw new Error(`相册图片记录删除失败：${deletePhotosError.message}`);
    }
  }

  const { error } = await supabase.from("albums").delete().eq("id", id);

  if (error) {
    throw new Error(`相册删除失败：${error.message}`);
  }

  revalidatePath("/");
  revalidatePath("/admin");
  revalidatePath("/admin/albums");
}
