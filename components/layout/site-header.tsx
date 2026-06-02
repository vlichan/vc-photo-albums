import Link from "next/link";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-30 border-b border-line/80 bg-paper/92 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4 md:px-8">
        <Link href="/" className="text-sm font-semibold uppercase tracking-[0.2em] text-ink">
          Atelier Albums
        </Link>
        <nav className="flex items-center gap-5 text-sm text-muted">
          <Link href="/" className="hover:text-ink">
            Albums
          </Link>
          <Link href="/admin/login" className="hover:text-ink">
            Admin
          </Link>
        </nav>
      </div>
    </header>
  );
}
