import { NextResponse } from "next/server";
import {
  createR2ObjectKey,
  createR2ThumbnailObjectKey,
  createR2PresignedPutUrl,
  getR2PublicUrl
} from "@/lib/r2/upload";
import { getAdminAlbumById } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Unknown sign error.";
}

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
    error: authError
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json(
      {
        ok: false,
        message: "请先登录后台后再上传图片。"
      },
      { status: 401 }
    );
  }

  try {
    const { id: albumId } = await context.params;
    const body = (await request.json()) as {
      fileName?: string;
      contentType?: string;
      uploadType?: "image" | "thumbnail";
    };

    if (!body.fileName) {
      return NextResponse.json(
        {
          ok: false,
          message: "fileName is required."
        },
        { status: 400 }
      );
    }

    const album = await getAdminAlbumById(albumId);
    const contentType = body.contentType || "application/octet-stream";
    const key =
      body.uploadType === "thumbnail"
        ? createR2ThumbnailObjectKey(body.fileName, album.slug, contentType)
        : createR2ObjectKey(body.fileName, album.slug);

    return NextResponse.json({
      ok: true,
      uploadUrl: await createR2PresignedPutUrl(key, contentType),
      imageUrl: getR2PublicUrl(key)
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        message: getErrorMessage(error)
      },
      { status: 500 }
    );
  }
}
