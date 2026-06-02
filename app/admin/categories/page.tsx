import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { getAdminCategories } from "@/lib/supabase/admin";
import {
  createCategory,
  deleteCategory,
  updateCategory
} from "@/app/admin/categories/actions";

export default async function AdminCategoriesPage() {
  const categories = await getAdminCategories();

  return (
    <main className="min-h-screen bg-paper px-5 py-8 md:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8 flex items-center justify-between gap-4">
          <div>
            <Link
              href="/admin"
              className="inline-flex items-center gap-2 text-sm text-muted transition hover:text-ink"
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </Link>
            <h1 className="mt-3 text-4xl font-medium text-ink">分类管理</h1>
          </div>
          <Link href="/admin/albums" className="border border-ink px-4 py-2 text-sm text-ink">
            相册管理
          </Link>
        </div>

        <section className="mb-8 border border-line bg-white p-5">
          <h2 className="mb-4 text-xl font-medium text-ink">创建分类</h2>
          <form action={createCategory} className="grid gap-4 md:grid-cols-[1fr_1fr_auto]">
            <label className="space-y-2">
              <span className="block text-sm text-muted">Name</span>
              <input
                className="w-full border border-line px-4 py-3 outline-none transition focus:border-ink"
                name="name"
                placeholder="Bags"
                required
              />
            </label>
            <label className="space-y-2">
              <span className="block text-sm text-muted">Slug</span>
              <input
                className="w-full border border-line px-4 py-3 outline-none transition focus:border-ink"
                name="slug"
                placeholder="bags"
                required
              />
            </label>
            <button className="self-end bg-ink px-5 py-3 text-paper" type="submit">
              创建
            </button>
          </form>
        </section>

        <section className="border border-line bg-white">
          <div className="grid grid-cols-[1fr_1fr_auto_auto] gap-4 border-b border-line px-4 py-3 text-xs uppercase tracking-[0.16em] text-muted">
            <span>Name</span>
            <span>Slug</span>
            <span>Save</span>
            <span>Delete</span>
          </div>
          {categories.map((category) => (
            <div
              key={category.id}
              className="grid gap-3 border-b border-line px-4 py-4 last:border-b-0 lg:grid-cols-[1fr_1fr_auto_auto]"
            >
              <form action={updateCategory} className="contents">
                <input name="id" type="hidden" value={category.id} />
                <input
                  className="w-full border border-line px-3 py-2 outline-none transition focus:border-ink"
                  name="name"
                  required
                  defaultValue={category.name}
                />
                <input
                  className="w-full border border-line px-3 py-2 outline-none transition focus:border-ink"
                  name="slug"
                  required
                  defaultValue={category.slug}
                />
                <button className="border border-ink px-4 py-2 text-sm text-ink" type="submit">
                  保存
                </button>
              </form>
              <form action={deleteCategory}>
                <input name="id" type="hidden" value={category.id} />
                <button className="border border-line px-4 py-2 text-sm text-muted" type="submit">
                  删除
                </button>
              </form>
            </div>
          ))}
        </section>
      </div>
    </main>
  );
}
