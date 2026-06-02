"use client";

import { type ChangeEvent, type FormEvent, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Upload } from "lucide-react";
import { uploadAlbumPhotos } from "@/app/admin/albums/[id]/actions";

type ImageMetadata = {
  name: string;
  width: number;
  height: number;
};

const MAX_BATCH_FILES = 8;
const MAX_BATCH_BYTES = 12 * 1024 * 1024;

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

export function PhotoUploadForm({ albumId }: { albumId: string }) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [metadata, setMetadata] = useState<ImageMetadata[]>([]);
  const [fileCount, setFileCount] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [status, setStatus] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  async function handleFilesChange(event: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? []);
    setFileCount(files.length);
    setStatus("");
    setErrorMessage("");
    setMetadata(await Promise.all(files.map(readImageSize)));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const files = Array.from(inputRef.current?.files ?? []);

    if (files.length === 0) {
      setErrorMessage("请先选择图片。");
      return;
    }

    const batches = createFileBatches(files);
    setIsUploading(true);
    setErrorMessage("");

    try {
      for (let index = 0; index < batches.length; index += 1) {
        const batch = batches[index];
        const formData = new FormData();
        formData.append("album_id", albumId);
        formData.append("image_metadata", JSON.stringify(metadata));
        batch.forEach((file) => formData.append("photos", file));

        setStatus(`正在上传第 ${index + 1} / ${batches.length} 批，共 ${files.length} 张图片。`);
        await uploadAlbumPhotos(formData);
      }

      setStatus(`上传完成，共 ${files.length} 张图片。`);
      setFileCount(0);
      setMetadata([]);

      if (inputRef.current) {
        inputRef.current.value = "";
      }

      router.refresh();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown upload error.";
      setErrorMessage(`上传失败：${message}`);
    } finally {
      setIsUploading(false);
    }
  }

  return (
    <form
      className="space-y-4 border border-line bg-white p-5"
      onSubmit={handleSubmit}
    >
      <div>
        <h2 className="text-xl font-medium text-ink">上传图片</h2>
        <p className="mt-1 text-sm text-muted">
          选择图片后会分批上传到 Cloudflare R2，并写入 photos 表。
        </p>
      </div>
      <label className="block space-y-2">
        <span className="text-sm text-muted">Images</span>
        <input
          accept="image/*"
          className="w-full border border-line px-4 py-3 outline-none transition focus:border-ink"
          disabled={isUploading}
          multiple
          name="photos"
          onChange={handleFilesChange}
          ref={inputRef}
          required
          type="file"
        />
      </label>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="space-y-1">
          <p className="text-sm text-muted">
            {fileCount > 0 ? `${fileCount} images selected` : "No images selected"}
          </p>
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
