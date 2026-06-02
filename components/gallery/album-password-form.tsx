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
    <section className="mb-8 border border-line bg-white p-5">
      <div className="max-w-md space-y-4">
        <div>
          <h2 className="text-xl font-medium text-ink">请输入相册密码</h2>
          <p className="mt-1 text-sm text-muted">输入正确密码后即可查看图片。</p>
        </div>
        <form action={formAction} className="space-y-4">
          <input name="slug" type="hidden" value={slug} />
          <label className="block space-y-2">
            <span className="text-sm text-muted">Password</span>
            <input
              className="w-full border border-line px-4 py-3 outline-none transition focus:border-ink"
              name="password"
              required
              type="password"
            />
          </label>
          <button
            className="bg-ink px-5 py-3 text-paper disabled:cursor-not-allowed disabled:opacity-70"
            disabled={isPending}
            type="submit"
          >
            {isPending ? "验证中..." : "进入相册"}
          </button>
        </form>
        {state.message ? (
          <p className={state.ok ? "text-sm text-moss" : "text-sm text-red-700"}>
            {state.message}
          </p>
        ) : null}
      </div>
    </section>
  );
}
