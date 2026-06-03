"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  type AlbumPasswordState,
  verifyAlbumPasswordWithState
} from "@/app/album/[slug]/actions";

const initialState: AlbumPasswordState = {
  ok: false,
  message: ""
};

export function AlbumPasswordForm({ slug }: { slug: string }) {
  const router = useRouter();
  const [state, formAction, isPending] = useActionState(
    verifyAlbumPasswordWithState,
    initialState
  );

  useEffect(() => {
    if (state.ok) {
      router.refresh();
    }
  }, [router, state.ok]);

  return (
    <section className="mx-auto mb-8 max-w-xl border border-line bg-white/60 px-5 py-10 md:px-10 md:py-12">
      <div className="mx-auto max-w-sm space-y-6 text-center">
        <div className="space-y-2">
          <p className="text-[11px] uppercase tracking-[0.22em] text-muted">
            Private Album
          </p>
          <h2 className="text-2xl font-medium text-ink">请输入相册密码</h2>
          <p className="text-sm leading-6 text-muted">
            这是一个私密相册。输入密码后，当前设备 24 小时内可免重复输入。
          </p>
        </div>
        <form action={formAction} className="space-y-4">
          <input name="slug" type="hidden" value={slug} />
          <label className="block space-y-2 text-left">
            <span className="text-xs uppercase tracking-[0.16em] text-muted">
              Password
            </span>
            <input
              className="w-full border border-line bg-paper/50 px-4 py-3 text-center outline-none transition focus:border-ink"
              name="password"
              required
              type="password"
            />
          </label>
          <button
            className="w-full bg-ink px-5 py-3 text-paper transition hover:bg-black disabled:cursor-not-allowed disabled:opacity-70"
            disabled={isPending}
            type="submit"
          >
            {isPending ? "验证中..." : "进入相册"}
          </button>
        </form>
        {state.message ? (
          <p className={state.ok ? "text-sm text-moss" : "text-sm text-[#9f2a2a]"}>
            {state.message}
          </p>
        ) : null}
      </div>
    </section>
  );
}
