"use client";

import { deleteCategory } from "@/app/admin/categories/actions";

export function DeleteCategoryForm({
  categoryId,
  categoryName
}: {
  categoryId: string;
  categoryName: string;
}) {
  return (
    <form
      action={deleteCategory}
      onSubmit={(event) => {
        if (!window.confirm(`确定删除分类「${categoryName}」吗？相册会变成未分类。`)) {
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
