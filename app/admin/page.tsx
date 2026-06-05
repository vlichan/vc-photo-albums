import Link from "next/link";
import { FolderPlus, Images, Tags } from "lucide-react";
import { AdminShell } from "@/components/admin/admin-shell";
import { getAdminAlbums, getAdminCounts } from "@/lib/supabase/admin";

export default async function AdminPage() {
  const [counts, albums] = await Promise.all([getAdminCounts(), getAdminAlbums()]);
  const recentAlbums = albums.slice(0, 5);

  return (
    <AdminShell
      active="dashboard"
      description="快速查看相册系统状态，并进入常用管理任务。"
      title="控制台"
    >
      <section className="grid gap-4 sm:grid-cols-3">
        {[
          ["分类", counts.categories],
          ["相册", counts.albums],
          ["图片", counts.photos]
        ].map(([label, value]) => (
          <div key={label} className="border border-line bg-white p-5">
            <p className="text-sm text-muted">{label}</p>
            <p className="mt-3 text-4xl font-medium text-ink">{value}</p>
          </div>
        ))}
      </section>

      <section className="mt-6 grid gap-4 md:grid-cols-3">
        <Link
          href="/admin/albums"
          className="border border-line bg-white p-5 transition hover:border-ink"
        >
          <FolderPlus className="h-5 w-5 text-muted" />
          <p className="mt-4 font-medium text-ink">新建相册</p>
          <p className="mt-1 text-sm leading-6 text-muted">创建新相册并设置分类、封面和密码。</p>
        </Link>
        <Link
          href="/admin/categories"
          className="border border-line bg-white p-5 transition hover:border-ink"
        >
          <Tags className="h-5 w-5 text-muted" />
          <p className="mt-4 font-medium text-ink">管理分类</p>
          <p className="mt-1 text-sm leading-6 text-muted">维护首页分类入口和相册归类。</p>
        </Link>
        <Link
          href="/admin/albums"
          className="border border-line bg-white p-5 transition hover:border-ink"
        >
          <Images className="h-5 w-5 text-muted" />
          <p className="mt-4 font-medium text-ink">上传图片</p>
          <p className="mt-1 text-sm leading-6 text-muted">进入相册后上传和管理产品图片。</p>
        </Link>
      </section>

      <section className="mt-6 border border-line bg-white">
        <div className="grid grid-cols-[1fr_auto_auto] border-b border-line px-4 py-3 text-xs uppercase tracking-[0.16em] text-muted">
          <span>最近相册</span>
          <span>状态</span>
          <span>打开</span>
        </div>
        {recentAlbums.length === 0 ? (
          <div className="px-4 py-8 text-sm text-muted">
            暂无相册。先创建一个相册，再上传产品图片。
          </div>
        ) : null}
        {recentAlbums.map((album) => (
          <div
            key={album.id}
            className="grid grid-cols-[1fr_auto_auto] items-center gap-4 border-b border-line px-4 py-4 last:border-b-0"
          >
            <div>
              <p className="font-medium text-ink">{album.title}</p>
              <p className="text-sm text-muted">/{album.slug}</p>
            </div>
            <span className="text-sm text-muted">
              {album.isPublic ? "公开" : "私密"}
            </span>
            <Link
              href={`/admin/albums/${album.id}`}
              className="border border-line px-3 py-2 text-sm text-muted transition hover:border-ink hover:text-ink"
            >
              管理
            </Link>
          </div>
        ))}
      </section>
    </AdminShell>
  );
}
