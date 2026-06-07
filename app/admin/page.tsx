import Link from "next/link";
import { FolderPlus, Images, Tags } from "lucide-react";
import { AdminShell } from "@/components/admin/admin-shell";
import {
  getAdminAlbums,
  getAdminCounts,
  getAdminStorageUsage
} from "@/lib/supabase/admin";

const BYTES_PER_GB = 1024 ** 3;

function formatGb(bytes: number) {
  const gb = bytes / BYTES_PER_GB;
  return `${gb.toFixed(gb >= 10 ? 1 : 2)} GB`;
}

function getStorageStatus(percent: number) {
  if (percent >= 90) {
    return {
      label: "空间紧张",
      colorClass: "bg-[#8a2d2d]"
    };
  }

  if (percent >= 70) {
    return {
      label: "接近上限",
      colorClass: "bg-[#a86f2a]"
    };
  }

  return {
    label: "正常",
    colorClass: "bg-ink"
  };
}

export default async function AdminPage() {
  const [counts, albums, storage] = await Promise.all([
    getAdminCounts(),
    getAdminAlbums(),
    getAdminStorageUsage()
  ]);
  const recentAlbums = albums.slice(0, 5);
  const usedPercent =
    storage.limitBytes > 0
      ? Math.min(100, Math.round((storage.totalUsedBytes / storage.limitBytes) * 100))
      : 0;
  const remainingBytes = Math.max(0, storage.limitBytes - storage.totalUsedBytes);
  const storageStatus = getStorageStatus(usedPercent);

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

      <section className="mt-6 border border-line bg-white p-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-sm text-muted">存储空间</p>
            <p className="mt-3 text-3xl font-medium text-ink">
              {storage.ok ? formatGb(storage.totalUsedBytes) : "暂无数据"}
            </p>
          </div>
          <span className="border border-line px-3 py-1.5 text-xs uppercase tracking-[0.14em] text-muted">
            {storage.ok ? storageStatus.label : "统计失败"}
          </span>
        </div>

        {storage.ok ? (
          <>
            <div className="mt-5 h-2 overflow-hidden bg-line">
              <div
                className={`h-full ${storageStatus.colorClass}`}
                style={{ width: `${usedPercent}%` }}
              />
            </div>
            <div className="mt-4 grid gap-3 text-sm text-muted sm:grid-cols-3">
              <p>
                已用空间 <span className="text-ink">{formatGb(storage.totalUsedBytes)}</span>
              </p>
              <p>
                免费额度 <span className="text-ink">{storage.limitGb} GB</span>
              </p>
              <p>
                剩余空间 <span className="text-ink">{formatGb(remainingBytes)}</span>
              </p>
            </div>
            <p className="mt-3 text-sm text-muted">使用占比 {usedPercent}%</p>
            <p className="mt-2 text-xs leading-5 text-muted">
              统计基于图片原图记录，实际 R2 使用量可能略高。
              {storage.missingFileSizeCount > 0
                ? ` 有 ${storage.missingFileSizeCount} 条图片记录缺少 file_size。`
                : ""}
            </p>
          </>
        ) : (
          <p className="mt-4 text-sm text-[#8a2d2d]">
            {storage.errorMessage ?? "暂无数据"}
          </p>
        )}
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
