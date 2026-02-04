# Vercel 外部数据库部署指南

本分支使用外部 PostgreSQL 数据库（如 Supabase、Neon、Railway 等）进行部署。

## 部署步骤

### 1. 准备工作

确保你已经：
- 将代码推送到 GitHub
- 拥有 Vercel 账户
- 拥有外部 PostgreSQL 数据库

### 2. 创建外部数据库

推荐使用以下云数据库服务：

#### Supabase
1. 访问 [supabase.com](https://supabase.com) 并注册
2. 创建新项目
3. 在项目设置中获取数据库连接字符串
4. 连接字符串格式：`postgresql://postgres:[YOUR-PASSWORD]@db.[YOUR-PROJECT-REF].supabase.co:5432/postgres`

#### Neon
1. 访问 [neon.tech](https://neon.tech) 并注册
2. 创建新项目
3. 获取连接字符串
4. 连接字符串格式：`postgresql://[USER]:[PASSWORD]@[HOST].neon.tech/[DATABASE]?sslmode=require`

#### Railway
1. 访问 [railway.app](https://railway.app) 并注册
2. 创建 PostgreSQL 数据库
3. 获取连接字符串

### 3. 连接 Vercel 到 GitHub

1. 访问 [vercel.com](https://vercel.com) 并登录
2. 点击 "Add New Project"
3. 导入你的 GitHub 仓库
4. 选择 `vercel-external-db` 分支

### 4. 配置环境变量

在 Vercel 项目设置中添加以下环境变量：

| 变量名 | 说明 | 示例值 |
|--------|------|--------|
| `DATABASE_URL` | PostgreSQL 数据库连接字符串 | `postgresql://postgres:password@db.xxx.supabase.co:5432/postgres` |
| `JWT_SECRET` | JWT 签名密钥 | 使用 `openssl rand -base64 32` 生成 |

**生成安全的 JWT_SECRET**：

```bash
# Linux/Mac
openssl rand -base64 32

# Windows PowerShell
[Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Minimum 0 -Maximum 256 }))
```

### 5. 部署

点击 "Deploy" 按钮，Vercel 会：
1. 安装依赖
2. 运行 `postinstall` 脚本（自动执行数据库迁移）
3. 构建应用
4. 部署到生产环境

## 数据库迁移

本分支使用 `postinstall` 脚本自动运行数据库迁移：

```javascript
// scripts/migrate.js
const { execSync } = require('child_process');

console.log('Running Prisma migrations for external database...');

try {
  console.log('Generating Prisma Client...');
  execSync('npx prisma generate', { stdio: 'inherit' });

  console.log('Pushing schema to external database...');
  execSync('npx prisma db push', { stdio: 'inherit' });

  console.log('✅ Migrations completed successfully!');
} catch (error) {
  console.error('❌ Migration failed:', error.message);
  process.exit(1);
}
```

## 环境变量

| 变量名 | 说明 | 来源 |
|--------|------|------|
| `DATABASE_URL` | 数据库连接 URL | 手动添加（从外部数据库获取） |
| `JWT_SECRET` | JWT 签名密钥 | 手动添加 |

## 数据库连接字符串格式

### Supabase
```
postgresql://postgres:[PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres
```

### Neon
```
postgresql://[USER]:[PASSWORD]@[HOST].neon.tech/[DATABASE]?sslmode=require
```

### Railway
```
postgresql://[USER]:[PASSWORD]@[HOST].railway.app:[PORT]/[DATABASE]
```

## 优势

- ✅ 使用外部数据库，数据独立于 Vercel
- ✅ 可以选择不同的数据库提供商
- ✅ 更灵活的数据库配置
- ✅ 可以在不同环境间共享数据库

## 注意事项

1. 确保数据库允许 Vercel 的 IP 地址访问
2. 使用 SSL 连接（大多数云数据库默认启用）
3. 定期备份数据库
4. 监控数据库连接数和性能

## 本地开发

要在本地使用外部数据库，需要：

1. 复制环境变量：
   ```bash
   cp .env.example .env
   ```

2. 编辑 `.env` 文件，添加外部数据库的连接字符串：
   ```env
   DATABASE_URL="postgresql://postgres:password@db.xxx.supabase.co:5432/postgres"
   JWT_SECRET="your-jwt-secret"
   ```

3. 运行开发服务器：
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
1. `DATABASE_URL` 环境变量是否正确
2. 数据库是否可访问
3. 数据库用户是否有足够权限
4. 网络连接是否正常

### 连接错误

如果出现连接错误：
1. 验证数据库连接字符串
2. 检查数据库是否允许外部连接
3. 确认 SSL 配置
4. 查看部署日志

### 权限错误

如果出现权限错误：
1. 确保数据库用户有 CREATE TABLE 权限
2. 检查数据库用户角色
3. 联系数据库提供商支持

## 数据库备份

### Supabase
```bash
# 使用 pg_dump
pg_dump $DATABASE_URL > backup.sql

# 恢复
psql $DATABASE_URL < backup.sql
```

### Neon
```bash
# Neon 提供自动备份
# 也可以使用 pg_dump 手动备份
```

### Railway
```bash
# Railway 提供自动备份
# 也可以使用 pg_dump 手动备份
```

## 性能优化

1. **连接池**：Prisma 默认使用连接池，无需额外配置
2. **查询优化**：使用 Prisma 的 `select` 和 `include` 优化查询
3. **索引**：在 Prisma schema 中定义索引
4. **缓存**：考虑使用 Redis 缓存频繁查询的数据

## 监控

- Vercel Dashboard：查看应用性能和错误
- 数据提供商 Dashboard：监控数据库性能
- Prisma Studio：可视化管理数据

## 相关文档

- [Vercel 部署文档](https://vercel.com/docs/deployments/overview)
- [Prisma 文档](https://www.prisma.io/docs)
- [Supabase 文档](https://supabase.com/docs)
- [Neon 文档](https://neon.tech/docs)
- [Next.js 部署文档](https://nextjs.org/docs/deployment)

## 与 Vercel Postgres 分支的区别

| 特性 | Vercel Postgres | 外部数据库 |
|------|----------------|-----------|
| 数据库管理 | Vercel 自动管理 | 手动管理 |
| 配置复杂度 | 简单 | 中等 |
| 数据独立性 | 依赖 Vercel | 完全独立 |
| 成本 | 有免费额度 | 取决于提供商 |
| 迁移难度 | 困难 | 容易 |
| 灵活性 | 低 | 高 |

选择建议：
- **Vercel Postgres**：快速部署，不想管理数据库
- **外部数据库**：需要更多控制，可能迁移到其他平台
