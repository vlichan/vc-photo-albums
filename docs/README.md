# Yupoo Style Album MVP

## 当前范围

项目当前已经完成 MVP 核心闭环：

- Next.js 15 + TypeScript + Tailwind CSS
- Supabase Auth 后台登录
- Supabase PostgreSQL 分类、相册、图片元数据
- Cloudflare R2 图片上传和删除
- 后台分类管理、相册管理、图片管理
- 前台首页、相册详情、相册密码、复制链接、WhatsApp 按钮

## 本地运行

```bash
npm install
npm.cmd run dev
```

访问：

- `http://localhost:3000`
- `http://localhost:3000/admin/login`
- `http://localhost:3000/admin`

如果改了 `.env.local`、`next.config.ts`、server action、middleware 或安装依赖，需要重启 dev server。

如果出现 `Cannot find module './xxx.js'` 这类 Next 缓存错误：

```bash
Ctrl + C
rmdir /s /q .next
npm.cmd run dev
```

## 环境变量

复制 `.env.example` 为 `.env.local`。

必须配置：

```env
NEXT_PUBLIC_SITE_URL=http://localhost:3000
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
R2_ACCOUNT_ID=
R2_ACCESS_KEY_ID=
R2_SECRET_ACCESS_KEY=
R2_BUCKET=
R2_PUBLIC_BASE_URL=
NEXT_PUBLIC_WHATSAPP_NUMBER=
```

说明：

- `NEXT_PUBLIC_SITE_URL`：用于生成复制分享链接。
- `NEXT_PUBLIC_WHATSAPP_NUMBER`：WhatsApp 号码，建议只写国家区号和号码，例如 `8613812345678`。
- `R2_PUBLIC_BASE_URL`：必须是浏览器可直接访问图片的公开域名，例如 R2 自定义域名或临时 `r2.dev` 域名。
- `SUPABASE_SERVICE_ROLE_KEY` 当前代码没有使用，生产环境不要暴露到浏览器。

## 数据库

在 Supabase SQL Editor 执行：

```txt
docs/database.sql
```

当前使用表：

- `categories`
- `albums`
- `photos`

不需要新增表结构。

## Supabase Auth

后台管理员账号由 Supabase 后台手动创建：

1. Supabase Dashboard -> Authentication -> Users
2. Add user
3. 填写邮箱和密码
4. 如果开启了邮箱确认，确认该用户邮箱

项目不开放注册页。

## Supabase RLS 建议

MVP 开发阶段如果页面能正常读取/写入，可以先保持当前策略。

正式上线前建议：

- 前台只允许读取公开需要的数据。
- 后台写入必须依赖已登录管理员。
- 不要把 service role key 放到前端环境变量。
- 如果开启 RLS，需要分别给 `categories`、`albums`、`photos` 配置 select/insert/update/delete 策略。

当前项目的后台写入使用 Supabase anon key + Auth session，因此 RLS 策略要允许已登录用户写入后台表。

## Cloudflare R2

R2 需要：

- 一个 bucket
- 一个具备对象读写权限的 R2 API Token
- 一个公开可访问的图片域名

上传写入字段：

- `image_url`
- `thumbnail_url`
- `image_code`
- `sort_order`
- `mime_type`
- `file_size`
- `width`
- `height`

当前缩略图字段暂时与原图 URL 相同，后续如要做真实缩略图生成，再单独扩展。

## 相册密码说明

当前相册密码使用 `albums.password` 字段，属于 MVP 简单实现。

- 密码以明文存储。
- 访客输入正确后，会写入同一浏览器/设备的 cookie。
- cookie 有效期是 24 小时。
- 当前不是按 IP 授权。

正式高安全要求时，建议改为 hash 存储密码。

## 上线检查

部署到 Vercel 前确认：

- Vercel 已配置所有环境变量。
- Supabase Auth 管理员账号已创建。
- Supabase 表已创建。
- R2 bucket 可上传。
- `R2_PUBLIC_BASE_URL` 可直接打开图片。
- WhatsApp 号码格式正确。
- 首页、相册详情、后台登录、图片上传、删除、排序都测试过。
