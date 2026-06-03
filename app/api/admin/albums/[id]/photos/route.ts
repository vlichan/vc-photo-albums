import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { uploadImageToR2 } from "@/lib/r2/upload";
import { getAdminAlbumById, getAdminPhotos } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type ImageMetadata = {
  name: string;
  width: number;
  height: number;
};

const SORT_ORDER_STEP = 1000;

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
  return error instanceof Error ? error.message : "Unknown upload error.";
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
    const formData = await request.formData();
    const submittedAlbumId = formData.get("album_id");

    if (typeof submittedAlbumId !== "string" || submittedAlbumId !== albumId) {
      return NextResponse.json(
        {
          ok: false,
          message: "album_id 不匹配，请刷新后台相册页面后重试。"
        },
        { status: 400 }
      );
    }

    const files = formData
      .getAll("photos")
      .filter((file): file is File => file instanceof File && file.size > 0);

    if (files.length === 0) {
      return NextResponse.json(
        {
          ok: false,
          message: "请先选择图片。"
        },
        { status: 400 }
      );
    }

    const album = await getAdminAlbumById(albumId);
    const existingPhotos = await getAdminPhotos(albumId);
    const metadata = parseMetadata(formData.get("image_metadata"));
    const firstSortOrder =
      existingPhotos.length > 0
        ? existingPhotos[0].sortOrder - files.length * SORT_ORDER_STEP
        : SORT_ORDER_STEP;
    const firstImageCode = getNextImageCodeStart(existingPhotos);

    const rows = await Promise.all(
      files.map(async (file, index) => {
        const imageUrl = await uploadImageToR2(file, album.slug);
        const imageMetadata = getMetadataForFile(metadata, file);

        return {
          album_id: album.id,
          image_url: imageUrl,
          thumbnail_url: imageUrl,
          sort_order: firstSortOrder + index * SORT_ORDER_STEP,
          image_code: getGeneratedImageCode(firstImageCode + index),
          mime_type: file.type || "application/octet-stream",
          file_size: file.size,
          width: imageMetadata?.width || 1200,
          height: imageMetadata?.height || 1200
        };
      })
    );

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
      message: `已上传 ${rows.length} 张图片。`
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
