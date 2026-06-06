import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { getAdminAlbumById, getAdminPhotos } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type UploadedPhoto = {
  imageUrl: string;
  thumbnailUrl?: string;
  fileName: string;
  mimeType: string;
  fileSize: number;
  width: number;
  height: number;
};

const SORT_ORDER_STEP = 1000;

function getNextImageCodeStart(photos: { imageCode: string }[]) {
  return photos.reduce((maxCode, photo) => {
    const match = photo.imageCode.match(/(\d+)$/);
    const codeNumber = match ? Number(match[1]) : 0;
    return Number.isFinite(codeNumber) ? Math.max(maxCode, codeNumber) : maxCode;
  }, 0) + 1;
}

function getGeneratedImageCode(codeNumber: number) {
  return codeNumber.toString().padStart(3, "0");
}

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Unknown complete error.";
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
    const body = (await request.json()) as { photos?: UploadedPhoto[] };
    const uploadedPhotos = body.photos ?? [];

    if (uploadedPhotos.length === 0) {
      return NextResponse.json(
        {
          ok: false,
          message: "没有可写入的图片记录。"
        },
        { status: 400 }
      );
    }

    const album = await getAdminAlbumById(albumId);
    const existingPhotos = await getAdminPhotos(albumId);
    const firstSortOrder =
      existingPhotos.length > 0
        ? existingPhotos[0].sortOrder - uploadedPhotos.length * SORT_ORDER_STEP
        : SORT_ORDER_STEP;
    const firstImageCode = getNextImageCodeStart(existingPhotos);
    const rows = uploadedPhotos.map((photo, index) => ({
      album_id: album.id,
      image_url: photo.imageUrl,
      thumbnail_url: photo.thumbnailUrl || photo.imageUrl,
      sort_order: firstSortOrder + index * SORT_ORDER_STEP,
      image_code: getGeneratedImageCode(firstImageCode + index),
      mime_type: photo.mimeType || "application/octet-stream",
      file_size: photo.fileSize,
      width: photo.width || 1200,
      height: photo.height || 1200
    }));
    const { error } = await supabase.from("photos").insert(rows);

    if (error) {
      return NextResponse.json(
        {
          ok: false,
          message: `写入 Supabase photos 表失败：${error.message}`
        },
        { status: 500 }
      );
    }

    revalidatePath(`/admin/albums/${album.id}`);
    revalidatePath(`/album/${album.slug}`);

    return NextResponse.json({
      ok: true,
      message: `已写入 ${rows.length} 张图片。`
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
