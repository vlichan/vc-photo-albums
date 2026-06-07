"use client";

import { type ChangeEvent, type DragEvent, type FormEvent, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Upload } from "lucide-react";

type ImageMetadata = {
  name: string;
  width: number;
  height: number;
};

type UploadedPhoto = {
  imageUrl: string;
  thumbnailUrl: string;
  fileName: string;
  mimeType: string;
  fileSize: number;
  width: number;
  height: number;
};

type ThumbnailFile = {
  blob: Blob;
  fileName: string;
  mimeType: string;
  width: number;
  height: number;
};

const MAX_BATCH_FILES = 5;
const MAX_BATCH_BYTES = 8 * 1024 * 1024;
const THUMBNAIL_MAX_EDGE = 500;
const THUMBNAIL_QUALITY = 0.78;
const MAX_UPLOAD_RETRIES = 3;
const RETRY_DELAY_MS = 900;

function readImageSize(file: File) {
  return new Promise<ImageMetadata>((resolve) => {
    const image = new Image();
    const objectUrl = URL.createObjectURL(file);

    image.onload = () => {
      resolve({
        name: file.name,
        width: image.naturalWidth,
        height: image.naturalHeight
      });
      URL.revokeObjectURL(objectUrl);
    };

    image.onerror = () => {
      resolve({
        name: file.name,
        width: 0,
        height: 0
      });
      URL.revokeObjectURL(objectUrl);
    };

    image.src = objectUrl;
  });
}

function createFileBatches(files: File[]) {
  const batches: File[][] = [];
  let currentBatch: File[] = [];
  let currentSize = 0;

  files.forEach((file) => {
    const shouldStartNewBatch =
      currentBatch.length >= MAX_BATCH_FILES ||
      (currentBatch.length > 0 && currentSize + file.size > MAX_BATCH_BYTES);

    if (shouldStartNewBatch) {
      batches.push(currentBatch);
      currentBatch = [];
      currentSize = 0;
    }

    currentBatch.push(file);
    currentSize += file.size;
  });

  if (currentBatch.length > 0) {
    batches.push(currentBatch);
  }

  return batches;
}

function canvasToBlob(canvas: HTMLCanvasElement, mimeType: string, quality: number) {
  return new Promise<Blob | null>((resolve) => {
    canvas.toBlob(resolve, mimeType, quality);
  });
}

async function createThumbnail(file: File): Promise<ThumbnailFile> {
  const image = new Image();
  const objectUrl = URL.createObjectURL(file);

  try {
    await new Promise<void>((resolve, reject) => {
      image.onload = () => resolve();
      image.onerror = () => reject(new Error(`缩略图生成失败：无法读取图片 ${file.name}`));
      image.src = objectUrl;
    });

    const originalWidth = image.naturalWidth || THUMBNAIL_MAX_EDGE;
    const originalHeight = image.naturalHeight || THUMBNAIL_MAX_EDGE;
    const scale = Math.min(1, THUMBNAIL_MAX_EDGE / Math.max(originalWidth, originalHeight));
    const width = Math.max(1, Math.round(originalWidth * scale));
    const height = Math.max(1, Math.round(originalHeight * scale));
    const canvas = document.createElement("canvas");
    const context = canvas.getContext("2d");

    if (!context) {
      throw new Error("缩略图生成失败：当前浏览器不支持 Canvas。");
    }

    canvas.width = width;
    canvas.height = height;
    context.drawImage(image, 0, 0, width, height);

    const webpBlob = await canvasToBlob(canvas, "image/webp", THUMBNAIL_QUALITY);

    if (webpBlob?.type === "image/webp" && webpBlob.size > 0) {
      return {
        blob: webpBlob,
        fileName: `${file.name.replace(/\.[^.]+$/, "")}-thumb.webp`,
        mimeType: "image/webp",
        width: originalWidth,
        height: originalHeight
      };
    }

    const jpegBlob = await canvasToBlob(canvas, "image/jpeg", THUMBNAIL_QUALITY);

    if (!jpegBlob || jpegBlob.size === 0) {
      throw new Error("缩略图生成失败：无法导出 WebP 或 JPEG。");
    }

    return {
      blob: jpegBlob,
      fileName: `${file.name.replace(/\.[^.]+$/, "")}-thumb.jpg`,
      mimeType: "image/jpeg",
      width: originalWidth,
      height: originalHeight
    };
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

function sleep(ms: number) {
  return new Promise((resolve) => {
    window.setTimeout(resolve, ms);
  });
}

async function withRetry<T>(operation: () => Promise<T>, label: string) {
  let lastError: unknown;

  for (let attempt = 1; attempt <= MAX_UPLOAD_RETRIES; attempt += 1) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;

      if (attempt < MAX_UPLOAD_RETRIES) {
        await sleep(RETRY_DELAY_MS * attempt);
      }
    }
  }

  const message = lastError instanceof Error ? lastError.message : "未知错误";
  throw new Error(`${label}，已重试 ${MAX_UPLOAD_RETRIES} 次：${message}`);
}

async function readJsonResponse<T>(response: Response) {
  const result = (await response.json().catch(() => null)) as
    | (T & { ok?: boolean; message?: string })
    | null;

  if (!response.ok || !result?.ok) {
    throw new Error(result?.message || `请求失败：${response.status}`);
  }

  return result;
}

async function getUploadUrl(
  albumId: string,
  fileName: string,
  contentType: string,
  uploadType: "image" | "thumbnail"
) {
  return withRetry(async () => {
    const response = await fetch(`/api/admin/albums/${albumId}/photos/sign`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        fileName,
        contentType,
        uploadType
      })
    });

    return readJsonResponse<{
      uploadUrl: string;
      imageUrl: string;
    }>(response);
  }, `获取${uploadType === "thumbnail" ? "缩略图" : "原图"}上传地址失败`);
}

async function uploadToR2(uploadUrl: string, body: Blob, contentType: string) {
  await withRetry(async () => {
    const uploadResponse = await fetch(uploadUrl, {
      method: "PUT",
      headers: {
        "Content-Type": contentType
      },
      body
    });

    if (!uploadResponse.ok) {
      throw new Error(`R2 上传失败：${uploadResponse.status}`);
    }
  }, "R2 上传失败");
}

async function saveUploadedPhotos(albumId: string, photos: UploadedPhoto[]) {
  return withRetry(async () => {
    const response = await fetch(`/api/admin/albums/${albumId}/photos/complete`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        photos
      })
    });

    return readJsonResponse<{ message?: string }>(response);
  }, "写入 photos 表失败");
}

export function PhotoUploadForm({ albumId }: { albumId: string }) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [fileCount, setFileCount] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [status, setStatus] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [successCount, setSuccessCount] = useState(0);
  const [failedCount, setFailedCount] = useState(0);

  async function setFiles(files: File[]) {
    const imageFiles = files.filter((file) => file.type.startsWith("image/"));
    setSelectedFiles(imageFiles);
    setSuccessCount(0);
    setFailedCount(0);
    setFileCount(imageFiles.length);
    setStatus("");
    setErrorMessage("");
  }

  async function handleFilesChange(event: ChangeEvent<HTMLInputElement>) {
    await setFiles(Array.from(event.target.files ?? []));
  }

  async function handleDrop(event: DragEvent<HTMLLabelElement>) {
    event.preventDefault();

    if (isUploading) {
      return;
    }

    await setFiles(Array.from(event.dataTransfer.files));
  }

  function handleDragOver(event: DragEvent<HTMLLabelElement>) {
    event.preventDefault();
  }

  function resetUploadState({
    keepStatus = false,
    keepStats = false
  }: {
    keepStatus?: boolean;
    keepStats?: boolean;
  } = {}) {
    setSelectedFiles([]);
    setFileCount(0);
    if (!keepStatus) {
      setStatus("");
    }
    setErrorMessage("");
    if (!keepStats) {
      setSuccessCount(0);
      setFailedCount(0);
    }

    if (inputRef.current) {
      inputRef.current.value = "";
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const files = selectedFiles;

    if (files.length === 0) {
      setErrorMessage("请先选择图片。");
      return;
    }

    const batches = createFileBatches(files);
    setIsUploading(true);
    setErrorMessage("");
    setSuccessCount(0);
    setFailedCount(0);

    try {
      const uploadedPhotos: UploadedPhoto[] = [];
      const thumbnailWarnings: string[] = [];
      const failedFiles: string[] = [];
      let uploadedCount = 0;

      for (let index = 0; index < batches.length; index += 1) {
        const batch = batches[index];
        setStatus(`正在上传第 ${index + 1} / ${batches.length} 批，共 ${files.length} 张图片。`);

        for (const file of batch) {
          uploadedCount += 1;
          setStatus(`正在上传第 ${uploadedCount} / ${files.length} 张图片。`);

          try {
            const originalMimeType = file.type || "application/octet-stream";
            const { uploadUrl, imageUrl } = await getUploadUrl(
              albumId,
              file.name,
              originalMimeType,
              "image"
            );
            await uploadToR2(uploadUrl, file, originalMimeType);
            let imageMetadata: ImageMetadata | null = null;
            let thumbnailUrl = imageUrl;

            try {
              const thumbnail = await createThumbnail(file);
              imageMetadata = {
                name: file.name,
                width: thumbnail.width,
                height: thumbnail.height
              };
              const thumbnailUpload = await getUploadUrl(
                albumId,
                thumbnail.fileName,
                thumbnail.mimeType,
                "thumbnail"
              );

              await uploadToR2(
                thumbnailUpload.uploadUrl,
                thumbnail.blob,
                thumbnail.mimeType
              );
              thumbnailUrl = thumbnailUpload.imageUrl;
            } catch (error) {
              imageMetadata = await readImageSize(file);
              const message = error instanceof Error ? error.message : "未知缩略图错误。";
              thumbnailWarnings.push(`${file.name}: ${message}`);
            }

            uploadedPhotos.push({
              imageUrl,
              thumbnailUrl,
              fileName: file.name,
              mimeType: originalMimeType,
              fileSize: file.size,
              width: imageMetadata?.width || 1200,
              height: imageMetadata?.height || 1200
            });
            setSuccessCount((current) => current + 1);
          } catch (error) {
            const message = error instanceof Error ? error.message : "未知上传错误。";
            failedFiles.push(`${file.name}: ${message}`);
            setFailedCount((current) => current + 1);
          }
        }
      }

      if (uploadedPhotos.length === 0) {
        throw new Error(
          `没有图片上传成功。${failedFiles.slice(0, 3).join("；")}`
        );
      }

      setStatus("正在写入 photos 表。");
      const saveResult = await saveUploadedPhotos(albumId, uploadedPhotos);
      setStatus(saveResult.message || `上传完成，共 ${files.length} 张图片。`);
      resetUploadState({ keepStatus: true, keepStats: true });

      if (thumbnailWarnings.length > 0) {
        setErrorMessage(
          `部分缩略图生成失败，已临时使用原图作为缩略图：${thumbnailWarnings
            .slice(0, 3)
            .join("；")}`
        );
      }

      if (failedFiles.length > 0) {
        setErrorMessage(
          `部分图片上传失败，已跳过 ${failedFiles.length} 张，成功 ${uploadedPhotos.length} 张：${failedFiles
            .slice(0, 3)
            .join("；")}`
        );
      }

      router.refresh();
    } catch (error) {
      const message = error instanceof Error ? error.message : "未知上传错误。";
      setFailedCount((current) => current + 1);
      setErrorMessage(`上传失败：${message}`);
    } finally {
      setIsUploading(false);
    }
  }

  return (
    <form
      className="space-y-4 border border-line bg-white p-4"
      onSubmit={handleSubmit}
    >
      <div>
        <h2 className="text-xl font-medium text-ink">上传图片</h2>
        <p className="mt-1 text-sm text-muted">
          拖拽图片到这里，或选择多张图片上传。
        </p>
      </div>
      <label
        className="block cursor-pointer border border-dashed border-line bg-paper/70 px-4 py-6 text-center transition hover:border-ink"
        onDragOver={handleDragOver}
        onDrop={handleDrop}
      >
        <span className="block text-sm font-medium text-ink">拖拽图片到这里</span>
        <span className="mt-1 block text-sm text-muted">支持多选，上传时自动分批直传 R2</span>
        <input
          accept="image/*"
          className="mt-4 w-full border border-line bg-white px-4 py-3 outline-none transition focus:border-ink"
          disabled={isUploading}
          multiple
          name="photos"
          onChange={handleFilesChange}
          ref={inputRef}
          required
          type="file"
        />
        <span className="mt-3 block truncate text-sm text-muted">
          {selectedFiles.length > 0
            ? selectedFiles.map((file) => file.name).join("、")
            : "尚未选择文件"}
        </span>
      </label>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="space-y-1">
          <p className="text-sm text-muted">
            {fileCount > 0 ? `已选择 ${fileCount} 张图片` : "未选择图片"}
          </p>
          {isUploading || successCount > 0 || failedCount > 0 ? (
            <p className="text-sm text-muted">
              成功 {successCount} / 失败 {failedCount} / 进度{" "}
              {fileCount > 0 ? Math.round(((successCount + failedCount) / fileCount) * 100) : 0}%
            </p>
          ) : null}
          {status ? <p className="text-sm text-moss">{status}</p> : null}
          {errorMessage ? <p className="text-sm text-red-700">{errorMessage}</p> : null}
        </div>
        <button
          className="inline-flex items-center gap-2 bg-ink px-5 py-3 text-paper disabled:cursor-not-allowed disabled:opacity-70"
          disabled={isUploading}
          type="submit"
        >
          <Upload className="h-4 w-4" />
          {isUploading ? "上传中..." : "上传图片"}
        </button>
      </div>
    </form>
  );
}
