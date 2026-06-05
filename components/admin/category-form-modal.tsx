"use client";

import { useRouter } from "next/navigation";
import { type FormEvent, type ReactNode, useState, useTransition } from "react";
import { X } from "lucide-react";
import type { Category } from "@/types/album";
import {
  createCategory,
  updateCategory
} from "@/app/admin/categories/actions";

type CategoryFormModalProps = {
  category?: Category;
  trigger: ReactNode;
};

export function CategoryFormModal({ category, trigger }: CategoryFormModalProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [isPending, startTransition] = useTransition();
  const isEditing = Boolean(category);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    setErrorMessage("");

    startTransition(async () => {
      try {
        if (isEditing) {
          await updateCategory(formData);
        } else {
          await createCategory(formData);
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
          <div className="w-full max-w-xl border border-line bg-white shadow-soft">
            <div className="flex items-start justify-between gap-4 border-b border-line px-5 py-4">
              <div>
                <p className="text-xs uppercase tracking-[0.18em] text-muted">
                  {isEditing ? "编辑分类" : "新建分类"}
                </p>
                <h2 className="mt-1 text-2xl font-medium text-ink">
                  {isEditing ? category?.name : "创建分类"}
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

            <form onSubmit={handleSubmit} className="grid gap-4 p-5">
              {category ? <input name="id" type="hidden" value={category.id} /> : null}
              <label className="space-y-2">
                <span className="block text-sm text-muted">分类名称</span>
                <input
                  className="w-full border border-line px-4 py-3 outline-none transition focus:border-ink"
                  defaultValue={category?.name ?? ""}
                  name="name"
                  placeholder="例如：Bags"
                  required
                />
              </label>
              <label className="space-y-2">
                <span className="block text-sm text-muted">slug</span>
                <input
                  className="w-full border border-line px-4 py-3 outline-none transition focus:border-ink"
                  defaultValue={category?.slug ?? ""}
                  name="slug"
                  placeholder="例如：bags"
                  required
                />
              </label>
              <label className="space-y-2">
                <span className="block text-sm text-muted">排序值 sort_order</span>
                <input
                  className="w-full border border-line bg-paper px-4 py-3 text-muted outline-none"
                  disabled
                  value="当前数据库未启用"
                />
              </label>

              {errorMessage ? <p className="text-sm text-red-700">{errorMessage}</p> : null}

              <div className="flex justify-end gap-3 border-t border-line pt-4">
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
                  {isPending ? "保存中..." : isEditing ? "保存" : "创建"}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </>
  );
}
