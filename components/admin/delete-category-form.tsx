"use client";

import { deleteCategory } from "@/app/admin/categories/actions";

export function DeleteCategoryForm({
  categoryId,
  categoryName,
  albumCount = 0
}: {
  categoryId: string;
  categoryName: string;
  albumCount?: number;
}) {
  return (
    <form
      action={deleteCategory}
      onSubmit={(event) => {
        const message =
          albumCount > 0
            ? `确定删除分类「${categoryName}」吗？当前分类下有 ${albumCount} 个相册，删除后这些相册会变成未分类。`
            : `确定删除分类「${categoryName}」吗？`;

        if (!window.confirm(message)) {
          event.preventDefault();
        }
      }}
    >
      <input name="id" type="hidden" value={categoryId} />
      <button className="border border-line px-4 py-2 text-sm text-muted" type="submit">
        删除
      </button>
    </form>
  );
}
