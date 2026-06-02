# Yupoo Style Album MVP

## 当前范围

这个项目按照 PRD 的第一阶段搭建基础骨架：

- Next.js 15 + TypeScript + Tailwind CSS
- 公开首页、相册详情页、后台登录页、后台概览页
- 极简黑白灰视觉方向，保留少量 moss 色用于状态和分类
- 相册分享链接复制、WhatsApp 浮动按钮
- Supabase / R2 环境变量和数据库脚本占位

当前页面使用 `lib/mock-data.ts` 的示例数据。接入 Supabase 后，把读取逻辑替换到 `lib/supabase` 即可。

## 本地运行

```bash
npm install
npm run dev
```

然后访问：

- `http://localhost:3000`
- `http://localhost:3000/album/bags-2026`
- `http://localhost:3000/admin/login`
- `http://localhost:3000/admin`

## 环境变量

复制 `.env.example` 为 `.env.local`，填入 Supabase、R2 和 WhatsApp 配置。

## 数据库

在 Supabase SQL Editor 执行 `docs/database.sql`。

第一阶段建议先保持简单：

- 管理员账号在 Supabase Auth 后台手动创建
- 不开放注册
- 相册密码先用简单字段实现，后续上线前再改成 hash 存储

## 下一步建议

1. 接入 Supabase Auth 登录。
2. 把首页和相册详情从 mock data 改为数据库读取。
3. 实现后台分类和相册 CRUD。
4. 接入 R2 上传、缩略图生成和图片元数据写入。
