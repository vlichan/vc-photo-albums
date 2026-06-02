"use client";

import type { FormEvent } from "react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { LogIn } from "lucide-react";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";

export function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage("");
    setIsSubmitting(true);

    const supabase = createSupabaseBrowserClient();
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    setIsSubmitting(false);

    if (error) {
      setErrorMessage(error.message);
      return;
    }

    router.replace("/admin");
    router.refresh();
  }

  return (
    <form
      className="w-full max-w-md space-y-5 border border-line bg-white p-6 shadow-soft"
      onSubmit={handleSubmit}
    >
      <label className="block space-y-2">
        <span className="text-sm text-muted">Email</span>
        <input
          className="w-full border border-line px-4 py-3 outline-none transition focus:border-ink"
          onChange={(event) => setEmail(event.target.value)}
          placeholder="admin@example.com"
          required
          type="email"
          value={email}
        />
      </label>
      <label className="block space-y-2">
        <span className="text-sm text-muted">Password</span>
        <input
          className="w-full border border-line px-4 py-3 outline-none transition focus:border-ink"
          onChange={(event) => setPassword(event.target.value)}
          placeholder="••••••••"
          required
          type="password"
          value={password}
        />
      </label>
      <button
        className="inline-flex w-full items-center justify-center gap-2 bg-ink px-4 py-3 text-paper transition hover:bg-moss disabled:cursor-not-allowed disabled:opacity-70"
        disabled={isSubmitting}
        type="submit"
      >
        <LogIn className="h-4 w-4" />
        {isSubmitting ? "登录中..." : "登录后台"}
      </button>
      <p className="text-sm leading-6 text-muted">
        {errorMessage || "管理员账号由 Supabase Auth 后台手动创建，不开放注册。"}
      </p>
    </form>
  );
}
