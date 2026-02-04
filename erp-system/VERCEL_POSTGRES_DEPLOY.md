# Vercel Postgres 部署指南

本分支使用 Vercel Postgres 进行部署，这是最简单和推荐的部署方式。

## 部署步骤

### 1. 准备工作

确保你已经：
- 将代码推送到 GitHub
- 拥有 Vercel 账户

### 2. 连接 Vercel 到 GitHub

1. 访问 [vercel.com](https://vercel.com) 并登录
2. 点击 "Add New Project"
3. 导入你的 GitHub 仓库
4. 选择 `vercel-postgres` 分支

### 3. 添加 Vercel Postgres 数据库

1. 在 Vercel 项目 Dashboard 中，点击 "Storage" 标签
2. 点击 "Create Database"
3. 选择 "Postgres"
4. Vercel 会自动创建并配置数据库

### 4. 配置环境变量

Vercel Postgres 会自动添加以下环境变量：
- `POSTGRES_URL`
- `POSTGRES_PRISMA_URL`
- `POSTGRES_USER`
- `POSTGRES_PASSWORD`
- `POSTGRES_DATABASE`

你还需要手动添加：
- `JWT_SECRET`: 使用 `openssl rand -base64 32` 生成

### 5. 部署

点击 "Deploy" 按钮，Vercel 会：
1. 安装依赖
2. 运行 `postinstall` 脚本（自动执行数据库迁移）
3. 构建应用
4. 部署到生产环境

## 环境变量

| 变量名 | 说明 | 来源 |
|--------|------|------|
| `POSTGRES_URL` | 数据库连接 URL | Vercel Postgres 自动添加 |
| `POSTGRES_PRISMA_URL` | Prisma 专用连接 URL | Vercel Postgres 自动添加 |
| `POSTGRES_USER` | 数据库用户名 | Vercel Postgres 自动添加 |
| `POSTGRES_PASSWORD` | 数据库密码 | Vercel Postgres 自动添加 |
| `POSTGRES_DATABASE` | 数据库名称 | Vercel Postgres 自动添加 |
| `JWT_SECRET` | JWT 签名密钥 | 手动添加 |

## 数据库迁移

本分支使用 `postinstall` 脚本自动运行数据库迁移：

```javascript
// scripts/migrate.js
const { execSync } = require('child_process');

console.log('Running Prisma migrations for Vercel Postgres...');

try {
  console.log('Generating Prisma Client...');
  execSync('npx prisma generate', { stdio: 'inherit' });

  console.log('Pushing schema to database...');
  execSync('npx prisma db push', { stdio: 'inherit' });

  console.log('✅ Migrations completed successfully!');
} catch (error) {
  console.error('❌ Migration failed:', error.message);
  process.exit(1);
}
```

## 优势

- ✅ 最简单的部署方式
- ✅ 自动数据库配置
- ✅ 自动 SSL 加密
- ✅ 自动备份
- ✅ 无需手动管理数据库
- ✅ 与 Vercel 无缝集成

## 注意事项

1. Vercel Postgres 有免费额度限制
2. 数据库连接数有限制（免费版 60 个连接）
3. 建议生产环境使用付费计划

## 本地开发

要在本地使用 Vercel Postgres，需要：

1. 安装 Vercel CLI:
   ```bash
   npm i -g vercel
   ```

2. 拉取环境变量:
   ```bash
   vercel env pull .env.local
   ```

3. 运行开发服务器:
   ```bash
   npm run dev
   ```

## 创建管理员用户

部署后，使用 Prisma Studio 创建管理员用户：

```bash
npx prisma studio
```

或使用 API 创建：

```bash
curl -X POST https://your-app.vercel.app/api/users \
  -H "Content-Type: application/json" \
  -d '{
    "username": "admin",
    "password": "your-password",
    "isAdmin": true
  }'
```

## 故障排除

### 迁移失败

如果迁移失败，检查：
1. 环境变量是否正确配置
2. 数据库是否可访问
3. Prisma schema 是否有效

### 连接错误

如果出现连接错误：
1. 检查 Vercel Postgres 状态
2. 验证环境变量
3. 查看部署日志

## 相关文档

- [Vercel Postgres 文档](https://vercel.com/docs/storage/vercel-postgres)
- [Prisma 文档](https://www.prisma.io/docs)
- [Next.js 部署文档](https://nextjs.org/docs/deployment)
