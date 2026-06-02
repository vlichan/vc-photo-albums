# Deployment Checklist

## Vercel

- 设置项目根目录为当前 Next.js 项目目录。
- Build command 使用默认 `next build`。
- 添加 `.env.local` 中对应的生产环境变量。
- `NEXT_PUBLIC_SITE_URL` 改为正式域名。

## Supabase

- 执行 `docs/database.sql`。
- 创建管理员账号。
- 检查 Auth email provider。
- 检查 RLS 策略是否符合上线要求。

## Cloudflare R2

- Bucket 已创建。
- API Token 具备对象读写权限。
- 公开域名或 `r2.dev` URL 可访问图片。
- Vercel 中配置 R2 环境变量。

## Manual Smoke Test

- 打开首页，确认分类和相册列表正常。
- 打开公开相册，确认图片显示。
- 设置相册密码，确认未输入密码时不显示图片。
- 输入密码后，确认 24 小时内同浏览器免输。
- 后台登录，确认未登录无法访问 `/admin`。
- 上传图片，确认 R2 和 photos 表都有记录。
- 删除图片，确认 R2 对象和 photos 表记录都删除。
- 拖拽排序，确认前台顺序和编号同步。
- 手机访问相册，确认大图左右切换和 WhatsApp 按钮可用。
