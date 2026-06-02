import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { getAdminAlbums, getAdminCategories } from "@/lib/supabase/admin";
import { createAlbum, deleteAlbum, updateAlbum } from "@/app/admin/albums/actions";

export default async function AdminAlbumsPage() {
  const [albums, categories] = await Promise.all([
    getAdminAlbums(),
    getAdminCategories()
  ]);

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
            <h1 className="mt-3 text-4xl font-medium text-ink">相册管理</h1>
          </div>
          <Link
            href="/admin/categories"
            className="border border-ink px-4 py-2 text-sm text-ink"
          >
            分类管理
          </Link>
        </div>

        <section className="mb-8 border border-line bg-white p-5">
          <div className="mb-4">
            <h2 className="text-xl font-medium text-ink">创建新相册</h2>
            <p className="mt-1 text-sm text-muted">填写下面字段会创建一条新的相册记录。</p>
          </div>
          <form action={createAlbum} className="grid gap-4 lg:grid-cols-2">
            <label className="space-y-2">
              <span className="block text-sm text-muted">Title</span>
              <input
                className="w-full border border-line px-4 py-3 outline-none transition focus:border-ink"
                name="title"
                placeholder="例如：Bags Summer 2026"
                required
              />
            </label>
            <label className="space-y-2">
              <span className="block text-sm text-muted">Slug</span>
              <input
                className="w-full border border-line px-4 py-3 outline-none transition focus:border-ink"
                name="slug"
                placeholder="例如：bags-summer-2026"
                required
              />
            </label>
            <label className="space-y-2 lg:col-span-2">
              <span className="block text-sm text-muted">Description</span>
              <textarea
                className="min-h-24 w-full border border-line px-4 py-3 outline-none transition focus:border-ink"
                name="description"
                placeholder="例如：A curated product set for private client preview."
              />
            </label>
            <label className="space-y-2">
              <span className="block text-sm text-muted">Cover image URL</span>
              <input
                className="w-full border border-line px-4 py-3 outline-none transition focus:border-ink"
                name="cover_image"
                placeholder="可先留空，上传图片后再设为封面"
                type="url"
              />
            </label>
            <label className="space-y-2">
              <span className="block text-sm text-muted">Category</span>
              <select
                className="w-full border border-line bg-white px-4 py-3 outline-none transition focus:border-ink"
                name="category_id"
              >
                <option value="">Uncategorized</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="space-y-2">
              <span className="block text-sm text-muted">Password</span>
              <input
                className="w-full border border-line px-4 py-3 outline-none transition focus:border-ink"
                name="password"
                placeholder="留空表示不设密码"
                type="text"
              />
            </label>
            <label className="flex items-center gap-3 text-sm text-muted">
              <input className="h-4 w-4" name="is_public" type="checkbox" />
              Public
            </label>
            <button className="bg-ink px-5 py-3 text-paper lg:justify-self-end" type="submit">
              创建新相册
            </button>
          </form>
        </section>

        <section className="space-y-4">
          <div>
            <h2 className="text-xl font-medium text-ink">已有相册</h2>
            <p className="mt-1 text-sm text-muted">下面是数据库中已创建的相册，可在这里编辑或删除。</p>
          </div>
          {albums.map((album) => (
            <div key={album.id} className="border border-line bg-white p-5">
              <div className="mb-4 border-b border-line pb-4">
                <p className="text-xs uppercase tracking-[0.16em] text-muted">编辑相册</p>
                <h3 className="mt-1 text-2xl font-medium text-ink">{album.title}</h3>
              </div>
              <form action={updateAlbum} className="grid gap-4 lg:grid-cols-2">
                <input name="id" type="hidden" value={album.id} />
                <label className="space-y-2">
                  <span className="block text-sm text-muted">Title</span>
                  <input
                    className="w-full border border-line px-4 py-3 outline-none transition focus:border-ink"
                    name="title"
                    required
                    defaultValue={album.title}
                  />
                </label>
                <label className="space-y-2">
                  <span className="block text-sm text-muted">Slug</span>
                  <input
                    className="w-full border border-line px-4 py-3 outline-none transition focus:border-ink"
                    name="slug"
                    required
                    defaultValue={album.slug}
                  />
                </label>
                <label className="space-y-2 lg:col-span-2">
                  <span className="block text-sm text-muted">Description</span>
                  <textarea
                    className="min-h-24 w-full border border-line px-4 py-3 outline-none transition focus:border-ink"
                    name="description"
                    defaultValue={album.description}
                  />
                </label>
                <label className="space-y-2">
                  <span className="block text-sm text-muted">Cover image URL</span>
                  <input
                    className="w-full border border-line px-4 py-3 outline-none transition focus:border-ink"
                    name="cover_image"
                    type="url"
                    defaultValue={album.coverImage}
                  />
                </label>
                <label className="space-y-2">
                  <span className="block text-sm text-muted">Category</span>
                  <select
                    className="w-full border border-line bg-white px-4 py-3 outline-none transition focus:border-ink"
                    name="category_id"
                    defaultValue={album.categoryId}
                  >
                    <option value="">Uncategorized</option>
                    {categories.map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="space-y-2">
                  <span className="block text-sm text-muted">Password</span>
                  <input
                    className="w-full border border-line px-4 py-3 outline-none transition focus:border-ink"
                    name="password"
                    placeholder="留空表示不设密码"
                    type="text"
                    defaultValue={album.password ?? ""}
                  />
                </label>
                <div className="flex flex-wrap items-center justify-between gap-3 lg:col-span-2">
                  <label className="flex items-center gap-3 text-sm text-muted">
                    <input
                      className="h-4 w-4"
                      name="is_public"
                      type="checkbox"
                      defaultChecked={album.isPublic}
                    />
                    Public
                  </label>
                  <div className="flex items-center gap-3">
                    <Link
                      href={`/admin/albums/${album.id}`}
                      className="border border-line px-4 py-2 text-sm text-muted"
                    >
                      图片管理
                    </Link>
                    <Link
                      href={`/album/${album.slug}`}
                      className="border border-line px-4 py-2 text-sm text-muted"
                    >
                      Open
                    </Link>
                    <button className="border border-ink px-4 py-2 text-sm text-ink" type="submit">
                      保存修改
                    </button>
                  </div>
                </div>
              </form>
              <form action={deleteAlbum} className="mt-3">
                <input name="id" type="hidden" value={album.id} />
                <button className="border border-line px-4 py-2 text-sm text-muted" type="submit">
                  删除相册
                </button>
              </form>
            </div>
          ))}
        </section>
      </div>
    </main>
  );
}
