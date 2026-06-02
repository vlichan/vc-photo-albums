"use server";

import { revalidatePath } from "next/cache";
import { createSupabaseServerClient } from "@/lib/supabase/server";

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

export async function createAlbum(formData: FormData) {
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from("albums").insert(getAlbumPayload(formData));

  if (error) {
    throw new Error(`Failed to create album: ${error.message}`);
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
    throw new Error(`Failed to update album: ${error.message}`);
  }

  revalidatePath("/");
  revalidatePath("/admin");
  revalidatePath("/admin/albums");
}

export async function deleteAlbum(formData: FormData) {
  const supabase = await createSupabaseServerClient();
  const id = getRequiredString(formData, "id");

  const { error } = await supabase.from("albums").delete().eq("id", id);

  if (error) {
    throw new Error(`Failed to delete album: ${error.message}`);
  }

  revalidatePath("/");
  revalidatePath("/admin");
  revalidatePath("/admin/albums");
}
