import Link from "next/link";
import { getAdminAlbums, getAdminCounts } from "@/lib/supabase/admin";
import { signOut } from "@/app/admin/actions";

export default async function AdminPage() {
  const [counts, albums] = await Promise.all([getAdminCounts(), getAdminAlbums()]);

  return (
    <main className="min-h-screen bg-paper px-5 py-8 md:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8 flex items-center justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.24em] text-moss">Dashboard</p>
            <h1 className="mt-2 text-4xl font-medium text-ink">后台管理</h1>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/" className="border border-ink px-4 py-2 text-sm text-ink">
              查看前台
            </Link>
            <form action={signOut}>
              <button className="border border-line px-4 py-2 text-sm text-muted" type="submit">
                退出登录
              </button>
            </form>
          </div>
        </div>

        <section className="mb-6 grid gap-4 sm:grid-cols-2">
          <Link href="/admin/categories" className="border border-line bg-white p-5">
            <p className="text-sm text-muted">Manage</p>
            <p className="mt-2 text-2xl font-medium text-ink">分类管理</p>
          </Link>
          <Link href="/admin/albums" className="border border-line bg-white p-5">
            <p className="text-sm text-muted">Manage</p>
            <p className="mt-2 text-2xl font-medium text-ink">相册管理</p>
          </Link>
        </section>

        <section className="grid gap-4 sm:grid-cols-3">
          {[
            ["Albums", counts.albums],
            ["Categories", counts.categories],
            ["Photos", counts.photos]
          ].map(([label, value]) => (
            <div key={label} className="border border-line bg-white p-5">
              <p className="text-sm text-muted">{label}</p>
              <p className="mt-2 text-3xl font-medium text-ink">{value}</p>
            </div>
          ))}
        </section>

        <section className="mt-8 border border-line bg-white">
          <div className="grid grid-cols-[1fr_auto_auto] border-b border-line px-4 py-3 text-xs uppercase tracking-[0.16em] text-muted">
            <span>Album</span>
            <span>Status</span>
            <span>Share</span>
          </div>
          {albums.map((album) => (
            <div
              key={album.id}
              className="grid grid-cols-[1fr_auto_auto] items-center gap-4 border-b border-line px-4 py-4 last:border-b-0"
            >
              <div>
                <p className="font-medium text-ink">{album.title}</p>
                <p className="text-sm text-muted">/{album.slug}</p>
              </div>
              <span className="text-sm text-muted">
                {album.isPublic ? "Public" : "Private"}
              </span>
              <Link
                href={`/album/${album.slug}`}
                className="border border-line px-3 py-2 text-sm text-muted transition hover:border-ink hover:text-ink"
              >
                Open
              </Link>
            </div>
          ))}
        </section>
      </div>
    </main>
  );
}
