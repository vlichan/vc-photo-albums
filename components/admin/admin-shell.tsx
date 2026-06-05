import Link from "next/link";
import type { ReactNode } from "react";
import {
  FolderOpen,
  Gauge,
  LogOut,
  Plus,
  Tag
} from "lucide-react";
import { signOut } from "@/app/admin/actions";

type AdminSection = "dashboard" | "categories" | "albums";

type AdminShellProps = {
  active: AdminSection;
  title: string;
  description: string;
  actions?: ReactNode;
  children: ReactNode;
};

const navigation = [
  {
    id: "dashboard",
    label: "控制台",
    href: "/admin",
    icon: Gauge
  },
  {
    id: "categories",
    label: "分类",
    href: "/admin/categories",
    icon: Tag
  },
  {
    id: "albums",
    label: "相册管理",
    href: "/admin/albums",
    icon: FolderOpen
  }
] satisfies Array<{
  id: AdminSection;
  label: string;
  href: string;
  icon: typeof Gauge;
}>;

export function AdminShell({
  active,
  title,
  description,
  actions,
  children
}: AdminShellProps) {
  return (
    <main className="min-h-screen bg-paper text-ink">
      <div className="lg:grid lg:min-h-screen lg:grid-cols-[240px_1fr]">
        <aside className="border-b border-line bg-white/70 lg:sticky lg:top-0 lg:h-screen lg:border-b-0 lg:border-r">
          <div className="flex items-center justify-between px-4 py-4 lg:block lg:px-5 lg:py-6">
            <Link href="/admin" className="block">
              <p className="text-xs uppercase tracking-[0.22em] text-muted">后台</p>
              <p className="mt-1 text-lg font-medium text-ink">相册管理系统</p>
            </Link>
            <Link
              href="/"
              className="border border-line px-3 py-2 text-sm text-muted transition hover:border-ink hover:text-ink lg:hidden"
            >
              前台
            </Link>
          </div>

          <nav className="flex gap-1 overflow-x-auto px-4 pb-4 lg:block lg:space-y-1 lg:px-3 lg:pb-0">
            {navigation.map((item) => {
              const Icon = item.icon;
              const isActive = active === item.id;

              return (
                <Link
                  key={item.id}
                  href={item.href}
                  className={`flex shrink-0 items-center gap-3 px-3 py-2.5 text-sm transition lg:w-full ${
                    isActive
                      ? "bg-ink text-paper"
                      : "text-muted hover:bg-paper hover:text-ink"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <div className="mt-8 hidden px-3 lg:block">
            <div className="space-y-2 border-t border-line pt-4">
              <Link
                href="/admin/albums"
                className="flex items-center gap-3 px-3 py-2.5 text-sm text-muted transition hover:bg-paper hover:text-ink"
              >
                <Plus className="h-4 w-4" />
                新建相册
              </Link>
            </div>
          </div>
        </aside>

        <section className="min-w-0 px-4 py-5 sm:px-6 lg:px-8 lg:py-7">
          <div className="mx-auto max-w-7xl">
            <header className="mb-6 flex flex-col gap-4 border-b border-line pb-5 md:flex-row md:items-end md:justify-between">
              <div>
                <h1 className="text-3xl font-medium tracking-tight text-ink md:text-4xl">
                  {title}
                </h1>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-muted">
                  {description}
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                {actions}
                <Link
                  href="/"
                  className="hidden border border-line px-3.5 py-2 text-sm text-muted transition hover:border-ink hover:text-ink lg:inline-flex"
                >
                  查看前台
                </Link>
                <form action={signOut}>
                  <button
                    className="inline-flex items-center gap-2 border border-line px-3.5 py-2 text-sm text-muted transition hover:border-ink hover:text-ink"
                    type="submit"
                  >
                    <LogOut className="h-4 w-4" />
                    退出登录
                  </button>
                </form>
              </div>
            </header>
            {children}
          </div>
        </section>
      </div>
    </main>
  );
}
