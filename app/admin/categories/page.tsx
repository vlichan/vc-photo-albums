import Link from "next/link";
import { AdminShell } from "@/components/admin/admin-shell";
import { CategoryFormModal } from "@/components/admin/category-form-modal";
import { getAdminCategories } from "@/lib/supabase/admin";
import { DeleteCategoryForm } from "@/components/admin/delete-category-form";

export default async function AdminCategoriesPage() {
  const categories = await getAdminCategories();

  return (
    <AdminShell
      active="categories"
      actions={
        <>
          <CategoryFormModal
            trigger={
              <span className="inline-flex border border-ink bg-ink px-3.5 py-2 text-sm text-paper">
                新建分类
              </span>
            }
          />
          <Link
            href="/admin/albums"
            className="border border-line px-3.5 py-2 text-sm text-muted transition hover:border-ink hover:text-ink"
          >
            相册管理
          </Link>
        </>
      }
      description="创建和维护前台首页使用的相册分类。"
      title="分类管理"
    >
        <section className="border border-line bg-white">
          <div className="grid grid-cols-[1.2fr_1fr_0.8fr_0.9fr_0.9fr_1.4fr] gap-4 border-b border-line px-4 py-3 text-xs uppercase tracking-[0.16em] text-muted">
            <span>分类名称</span>
            <span>slug</span>
            <span>排序值</span>
            <span>相册数量</span>
            <span>创建时间</span>
            <span>操作</span>
          </div>
          {categories.length === 0 ? (
            <div className="px-4 py-8 text-sm text-muted">
              暂无分类。点击右上角“新建分类”开始创建。
            </div>
          ) : null}
          {categories.map((category) => (
            <div
              key={category.id}
              className="grid gap-4 border-b border-line px-4 py-4 text-sm last:border-b-0 lg:grid-cols-[1.2fr_1fr_0.8fr_0.9fr_0.9fr_1.4fr] lg:items-center"
            >
              <div>
                <p className="font-medium text-ink">{category.name}</p>
              </div>
              <p className="text-muted">/{category.slug}</p>
              <p className="text-muted">
                {typeof category.sortOrder === "number" ? category.sortOrder : "未启用"}
              </p>
              <p className="text-muted">{category.albumCount ?? 0}</p>
              <p className="text-muted">{category.createdAt}</p>
              <div className="flex flex-wrap items-center gap-2">
                <CategoryFormModal
                  category={category}
                  trigger={
                    <span className="inline-flex border border-line px-3 py-2 text-sm text-muted transition hover:border-ink hover:text-ink">
                      编辑
                    </span>
                  }
                />
                <Link
                  href={`/admin/albums?category=${category.slug}`}
                  className="border border-line px-3 py-2 text-sm text-muted transition hover:border-ink hover:text-ink"
                >
                  查看相册
                </Link>
                <DeleteCategoryForm
                  albumCount={category.albumCount ?? 0}
                  categoryId={category.id}
                  categoryName={category.name}
                />
              </div>
            </div>
          ))}
        </section>
    </AdminShell>
  );
}
