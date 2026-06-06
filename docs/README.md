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

新上传图片会在浏览器端生成真实缩略图，原图和缩略图都会直传 R2：

- 原图：`albums/{albumSlug}/{uuid}.{ext}`
- 缩略图：`albums/{albumSlug}/thumbs/{uuid}.webp`

前台列表读取 `thumbnail_url`，点击放大预览读取 `image_url`。

## 旧图片批量生成真实缩略图

如果旧数据里存在 `photos.thumbnail_url = photos.image_url`，可以使用一次性脚本为旧图片生成 WebP 缩略图，并只更新 `photos.thumbnail_url`。

脚本不会修改数据库结构，不会修改 `image_url`，不会删除任何 R2 原图，也不会修改前后台 UI。

需要的环境变量：

```env
NEXT_PUBLIC_SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
R2_ACCOUNT_ID=
R2_ACCESS_KEY_ID=
R2_SECRET_ACCESS_KEY=
R2_BUCKET_NAME=
R2_PUBLIC_URL=https://img.maggieshop.vip
```

兼容已有变量：

- `R2_BUCKET_NAME` 如果未设置，脚本会尝试使用 `R2_BUCKET`。
- `R2_PUBLIC_URL` 如果未设置，脚本会尝试使用 `R2_PUBLIC_BASE_URL`，再 fallback 到 `https://img.maggieshop.vip`。

注意：

- `SUPABASE_SERVICE_ROLE_KEY` 只能用于本地脚本或服务端环境。
- 不要把 `SUPABASE_SERVICE_ROLE_KEY` 暴露到浏览器端。
- 不要把真实 key 提交到 GitHub。

dry-run 预览，不下载原图、不上传 R2、不更新数据库：

```bash
npm run generate:thumbnails -- --dry-run
```

小批量测试，例如先处理 20 张：

```bash
npm run generate:thumbnails -- --apply --confirm --limit 20
```

从 offset 继续：

```bash
npm run generate:thumbnails -- --apply --confirm --offset 20 --limit 20
```

从某个 photo id 之后继续：

```bash
npm run generate:thumbnails -- --apply --confirm --cursor photo-id-here --limit 20
```

全量执行：

```bash
npm run generate:thumbnails -- --apply --confirm
```

回滚建议：

1. 执行全量 apply 前，在 Supabase 里导出或备份 `photos` 表。
2. 脚本只更新 `thumbnail_url`，所以回滚时可以把备份里的旧 `thumbnail_url` 写回。
3. 脚本不会删除任何 R2 文件；如果需要清理已生成缩略图，确认数据库已回滚后，再按 `albums/**/thumbs/*.webp` 单独清理。

## R2 图片公开域名迁移

如果 R2 从临时公开域名切换到自定义域名，可以使用一次性脚本只更新 Supabase `photos` 表里的 `image_url` 和 `thumbnail_url`。

脚本不会修改数据库结构，不会删除任何 R2 文件，也不会修改上传、删除、排序、编号逻辑。它只保留原 URL 的路径部分，把旧域名替换成新域名。

需要的环境变量：

```env
NEXT_PUBLIC_SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
OLD_R2_PUBLIC_URL=https://old-r2-domain.example.com
NEW_R2_PUBLIC_URL=https://img.maggieshop.vip
```

注意：

- `SUPABASE_SERVICE_ROLE_KEY` 只能放在本地脚本环境或服务端环境中。
- 不要把 `SUPABASE_SERVICE_ROLE_KEY` 暴露到浏览器端。
- 不要提交真实 key 到 GitHub。
- `NEW_R2_PUBLIC_URL` 默认是 `https://img.maggieshop.vip`，但建议显式配置。

先预览，不写入数据库：

```bash
npm run migrate:r2-url -- --dry-run
```

确认 dry-run 输出无误后，再执行：

```bash
npm run migrate:r2-url -- --apply --confirm
```

dry-run 会输出：

- photos 总记录数
- `image_url` 将替换的数量
- `thumbnail_url` 将替换的数量
- 至少 5 条替换前后示例
- 空 URL、已经是新域名、其他域名的跳过数量

apply 会再次打印确认信息，并输出成功更新数量和失败记录。

回滚建议：

1. 执行 apply 前，在 Supabase 里导出或备份 `photos` 表。
2. 如果需要回滚，把 `OLD_R2_PUBLIC_URL` 和 `NEW_R2_PUBLIC_URL` 对调，再先运行 dry-run。
3. dry-run 确认无误后，再运行 apply。

## 相册密码说明

当前相册密码使用 `albums.password` 字段，属于 MVP 简单实现。

- 密码以明文存储。
- 访客输入正确后，会写入同一浏览器/设备的 cookie。
- cookie 有效期是 24 小时。
- 当前不是按 IP 授权。

正式高安全要求时，建议改为 hash 存储密码。

## 图片排序和编号规则

- `image_code` 是对客户展示的稳定图片编号，上传生成后不随排序变化。
- 新上传图片的 `image_code` 使用当前相册历史最大编号 + 1，例如已有 `050`，新图从 `051` 开始。
- 删除图片后不补号，避免客户引用旧编号时产生业务误会。
- `sort_order` 只表示展示顺序。
- 新上传图片默认插入最前面。
- 后台拖拽排序保存时通常只更新被拖动图片的 `sort_order`。
- 如果排序间隔不足，系统会按当前列表做一次重新分配 `sort_order`，但仍不会修改 `image_code`。

首页分类标签使用 `?category=slug` 做真实筛选，`All` 显示全部相册。

## 上线检查

部署到 Vercel 前确认：

- Vercel 已配置所有环境变量。
- Supabase Auth 管理员账号已创建。
- Supabase 表已创建。
- R2 bucket 可上传。
- `R2_PUBLIC_BASE_URL` 可直接打开图片。
- WhatsApp 号码格式正确。
- 首页、相册详情、后台登录、图片上传、删除、排序都测试过。
