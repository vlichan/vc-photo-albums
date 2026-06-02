"use server";

import { cookies } from "next/headers";
import { getPublicAlbumBySlug } from "@/lib/supabase/public-albums";
import { getAlbumAccessCookieName } from "@/lib/utils/album-access";

export type AlbumPasswordState = {
  ok: boolean;
  message: string;
};

export async function verifyAlbumPasswordWithState(
  _state: AlbumPasswordState,
  formData: FormData
): Promise<AlbumPasswordState> {
  const slug = formData.get("slug");
  const password = formData.get("password");

  if (typeof slug !== "string" || typeof password !== "string") {
    return {
      ok: false,
      message: "请输入相册密码。"
    };
  }

  const album = await getPublicAlbumBySlug(slug);

  if (!album || !album.password) {
    return {
      ok: false,
      message: "相册不存在或未设置密码。"
    };
  }

  if (password !== album.password) {
    return {
      ok: false,
      message: "密码不正确。"
    };
  }

  const cookieStore = await cookies();
  cookieStore.set(getAlbumAccessCookieName(album.id), "granted", {
    httpOnly: true,
    maxAge: 60 * 60 * 24,
    path: `/album/${album.slug}`,
    sameSite: "lax"
  });

  return {
    ok: true,
    message: "密码正确。"
  };
}
