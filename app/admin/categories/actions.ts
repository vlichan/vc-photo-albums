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

export async function createCategory(formData: FormData) {
  const supabase = await createSupabaseServerClient();
  const name = getRequiredString(formData, "name");
  const slug = getRequiredString(formData, "slug");

  const { error } = await supabase.from("categories").insert({
    name,
    slug
  });

  if (error) {
    throw new Error(`分类创建失败：${error.message}`);
  }

  revalidatePath("/");
  revalidatePath("/admin");
  revalidatePath("/admin/categories");
  revalidatePath("/admin/albums");
}

export async function updateCategory(formData: FormData) {
  const supabase = await createSupabaseServerClient();
  const id = getRequiredString(formData, "id");
  const name = getRequiredString(formData, "name");
  const slug = getRequiredString(formData, "slug");

  const { error } = await supabase
    .from("categories")
    .update({
      name,
      slug
    })
    .eq("id", id);

  if (error) {
    throw new Error(`分类保存失败：${error.message}`);
  }

  revalidatePath("/");
  revalidatePath("/admin");
  revalidatePath("/admin/categories");
  revalidatePath("/admin/albums");
}

export async function deleteCategory(formData: FormData) {
  const supabase = await createSupabaseServerClient();
  const id = getRequiredString(formData, "id");

  const { error } = await supabase.from("categories").delete().eq("id", id);

  if (error) {
    throw new Error(`分类删除失败：${error.message}`);
  }

  revalidatePath("/");
  revalidatePath("/admin");
  revalidatePath("/admin/categories");
  revalidatePath("/admin/albums");
}
