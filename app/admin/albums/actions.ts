"use server";

import { revalidatePath } from "next/cache";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { deleteImageFromR2 } from "@/lib/r2/upload";

type AlbumActionResult = {
  ok: boolean;
  message?: string;
};

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
  const slug = getRequiredString(formData, "slug");

  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) {
    throw new Error("链接标识只能使用小写英文、数字和短横线，例如 chanel-shoes-2026。");
  }

  return {
    title: getRequiredString(formData, "title"),
    slug,
    description: getOptionalString(formData, "description") ?? "",
    cover_image: getOptionalString(formData, "cover_image"),
    category_id: getOptionalString(formData, "category_id"),
    password: getOptionalString(formData, "password"),
    is_public: formData.get("is_public") === "on"
  };
}

function getAlbumErrorMessage(error: { code?: string; message?: string }) {
  if (error.code === "23505") {
    return "保存失败：这个链接标识已经存在，请换一个 slug，例如 chanel-shoes-2026。";
  }

  if (error.code === "23503") {
    return "保存失败：选择的分类不存在，请刷新页面后重新选择分类。";
  }

  if (error.message?.includes("invalid input syntax")) {
    return "保存失败：表单里有无效数据，请检查分类、链接标识或 URL。";
  }

  return `保存失败：${error.message ?? "未知数据库错误。"}`;
}

async function deleteR2Urls(urls: string[]) {
  const uniqueUrls = Array.from(new Set(urls.filter(Boolean)));

  for (const url of uniqueUrls) {
    await deleteImageFromR2(url);
  }
}

export async function createAlbum(formData: FormData): Promise<AlbumActionResult> {
  try {
    const supabase = await createSupabaseServerClient();
    const { error } = await supabase.from("albums").insert(getAlbumPayload(formData));

    if (error) {
      return { ok: false, message: getAlbumErrorMessage(error) };
    }

    revalidatePath("/");
    revalidatePath("/admin");
    revalidatePath("/admin/albums");
    return { ok: true };
  } catch (error) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : "创建失败：未知错误。"
    };
  }
}

export async function updateAlbum(formData: FormData): Promise<AlbumActionResult> {
  try {
    const supabase = await createSupabaseServerClient();
    const id = getRequiredString(formData, "id");
    const { error } = await supabase
      .from("albums")
      .update(getAlbumPayload(formData))
      .eq("id", id);

    if (error) {
      return { ok: false, message: getAlbumErrorMessage(error) };
    }

    revalidatePath("/");
    revalidatePath("/admin");
    revalidatePath("/admin/albums");
    return { ok: true };
  } catch (error) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : "保存失败：未知错误。"
    };
  }
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
