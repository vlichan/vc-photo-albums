"use client";

import { useRouter } from "next/navigation";
import { type FormEvent, type ReactNode, useState, useTransition } from "react";
import { X } from "lucide-react";
import type { AlbumWithCategory, Category } from "@/types/album";
import { createAlbum, updateAlbum } from "@/app/admin/albums/actions";

type AlbumFormModalProps = {
  album?: AlbumWithCategory;
  categories: Category[];
  trigger: ReactNode;
};

export function AlbumFormModal({ album, categories, trigger }: AlbumFormModalProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [isPending, startTransition] = useTransition();
  const isEditing = Boolean(album);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    setErrorMessage("");

    startTransition(async () => {
      try {
        const result = isEditing ? await updateAlbum(formData) : await createAlbum(formData);

        if (!result.ok) {
          setErrorMessage(result.message ?? "保存失败，请检查填写内容。");
          return;
        }

        setIsOpen(false);
        router.refresh();
      } catch (error) {
        setErrorMessage(error instanceof Error ? error.message : "保存失败。");
      }
    });
  }

  return (
    <>
      <button type="button" onClick={() => setIsOpen(true)}>
        {trigger}
      </button>

      {isOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/35 px-4 py-6">
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto border border-line bg-white shadow-soft">
            <div className="flex items-start justify-between gap-4 border-b border-line px-5 py-4">
              <div>
                <p className="text-xs uppercase tracking-[0.18em] text-muted">
                  {isEditing ? "编辑相册" : "新建相册"}
                </p>
                <h2 className="mt-1 text-2xl font-medium text-ink">
                  {isEditing ? album?.title : "创建新相册"}
                </h2>
              </div>
              <button
                aria-label="关闭"
                className="grid h-9 w-9 place-items-center border border-line text-muted transition hover:border-ink hover:text-ink"
                onClick={() => setIsOpen(false)}
                type="button"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="grid gap-4 p-5 md:grid-cols-2">
              {album ? <input name="id" type="hidden" value={album.id} /> : null}
              <label className="space-y-2">
                <span className="block text-sm text-muted">标题</span>
                <input
                  className="w-full border border-line px-4 py-3 outline-none transition focus:border-ink"
                  defaultValue={album?.title ?? ""}
                  name="title"
                  placeholder="例如：Bags Summer 2026"
                  required
                />
              </label>
              <label className="space-y-2">
                <span className="block text-sm text-muted">链接标识</span>
                <input
                  className="w-full border border-line px-4 py-3 outline-none transition focus:border-ink"
                  defaultValue={album?.slug ?? ""}
                  name="slug"
                  placeholder="例如：bags-summer-2026"
                  required
                />
              </label>
              <label className="space-y-2 md:col-span-2">
                <span className="block text-sm text-muted">描述</span>
                <textarea
                  className="min-h-24 w-full border border-line px-4 py-3 outline-none transition focus:border-ink"
                  defaultValue={album?.description ?? ""}
                  name="description"
                  placeholder="例如：A curated product set for private client preview."
                />
              </label>
              <label className="space-y-2">
                <span className="block text-sm text-muted">封面图片 URL</span>
                <input
                  className="w-full border border-line px-4 py-3 outline-none transition focus:border-ink"
                  defaultValue={album?.coverImage ?? ""}
                  name="cover_image"
                  placeholder="可先留空，上传图片后再设为封面"
                  type="url"
                />
              </label>
              <label className="space-y-2">
                <span className="block text-sm text-muted">分类</span>
                <select
                  className="w-full border border-line bg-white px-4 py-3 outline-none transition focus:border-ink"
                  defaultValue={album?.categoryId ?? ""}
                  name="category_id"
                >
                  <option value="">未分类</option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </label>
              <label className="space-y-2">
                <span className="block text-sm text-muted">密码</span>
                <input
                  className="w-full border border-line px-4 py-3 outline-none transition focus:border-ink"
                  defaultValue={album?.password ?? ""}
                  name="password"
                  placeholder="留空表示不设密码"
                  type="text"
                />
              </label>
              <label className="flex items-center gap-3 self-end py-3 text-sm text-muted">
                <input
                  className="h-4 w-4"
                  defaultChecked={album?.isPublic ?? false}
                  name="is_public"
                  type="checkbox"
                />
                公开
              </label>

              {errorMessage ? (
                <p className="text-sm text-red-700 md:col-span-2">{errorMessage}</p>
              ) : null}

              <div className="flex justify-end gap-3 border-t border-line pt-4 md:col-span-2">
                <button
                  className="border border-line px-4 py-2 text-sm text-muted transition hover:border-ink hover:text-ink"
                  disabled={isPending}
                  onClick={() => setIsOpen(false)}
                  type="button"
                >
                  取消
                </button>
                <button
                  className="bg-ink px-4 py-2 text-sm text-paper disabled:cursor-not-allowed disabled:opacity-60"
                  disabled={isPending}
                  type="submit"
                >
                  {isPending ? "保存中..." : isEditing ? "保存修改" : "创建相册"}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </>
  );
}
