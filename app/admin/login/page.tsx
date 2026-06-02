import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { LoginForm } from "@/components/admin/login-form";

export default function AdminLoginPage() {
  return (
    <main className="grid min-h-screen bg-paper px-5 py-8 md:px-8 lg:grid-cols-2">
      <section className="flex flex-col justify-between border-b border-line pb-10 lg:border-b-0 lg:border-r lg:pr-12">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm text-muted transition hover:text-ink"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to albums
        </Link>
        <div className="mt-16 max-w-xl lg:mt-0">
          <p className="mb-4 text-xs font-semibold uppercase tracking-[0.28em] text-moss">
            Admin
          </p>
          <h1 className="text-4xl font-medium leading-tight text-ink md:text-6xl">
            后台登录
          </h1>
          <p className="mt-5 text-base leading-8 text-muted">
            第一阶段使用 Supabase Auth 邮箱登录，不开放注册。登录后进入相册、分类和图片管理。
          </p>
        </div>
      </section>
      <section className="flex items-center justify-center py-10 lg:py-0">
        <LoginForm />
      </section>
    </main>
  );
}
