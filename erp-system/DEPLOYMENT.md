# ERP 系统部署说明

本文档提供 ERP 系统的本地部署和 Vercel 部署的详细说明。

## 目录

- [环境要求](#环境要求)
- [本地部署](#本地部署)
- [Vercel 部署](#vercel-部署)
- [数据库配置](#数据库配置)
- [安全配置](#安全配置)
- [常见问题](#常见问题)

---

## 环境要求

### 本地部署

- **Node.js**: 18.x 或更高版本
- **npm**: 9.x 或更高版本
- **PostgreSQL**: 14.x 或更高版本
- **Git**: 用于克隆代码仓库

### Vercel 部署

- Vercel 账户（免费即可）
- PostgreSQL 数据库（推荐使用 Supabase、Neon 或 Railway）
- GitHub 账户（用于连接 Vercel）

---

## 本地部署

### 1. 克隆项目

```bash
git clone <your-repository-url>
cd erp-system
```

### 2. 安装依赖

```bash
npm install
```

### 3. 配置环境变量

创建 `.env` 文件：

```bash
cp .env.example .env
```

编辑 `.env` 文件，配置以下变量：

```env
# 数据库连接 URL
DATABASE_URL="postgresql://username:password@localhost:5432/database_name"

# JWT 密钥（用于用户认证）
JWT_SECRET="your-super-secret-jwt-key-change-this-in-production"
```

### 4. 配置数据库

#### 4.1 创建 PostgreSQL 数据库

```bash
# 使用 psql 创建数据库
createdb erp_system

# 或使用 PostgreSQL 命令行
psql -U postgres
CREATE DATABASE erp_system;
\q
```

#### 4.2 运行数据库迁移

```bash
# 生成 Prisma Client
npx prisma generate

# 推送 schema 到数据库
npx prisma db push

# 或使用迁移（推荐生产环境）
npx prisma migrate dev --name init
```

#### 4.3 可选：使用 Prisma Studio 管理数据

```bash
npx prisma studio
```

这将在浏览器中打开 Prisma Studio，可以可视化管理数据库。

### 5. 创建初始管理员账户

使用 Prisma Studio 或直接在数据库中创建管理员用户：

```sql
INSERT INTO "User" (id, username, password, "isAdmin", permissions, "createdAt", "updatedAt")
VALUES (
  'admin-id',
  'admin',
  '$2a$10$YourHashedPasswordHere',
  true,
  ARRAY['CONTRACTS', 'INVOICES', 'PAYMENTS', 'CLIENTS', 'PROJECTS', 'USERS'],
  NOW(),
  NOW()
);
```

**注意**：密码需要使用 bcrypt 加密。可以使用以下 Node.js 脚本生成：

```javascript
const bcrypt = require('bcryptjs');
const password = 'your-password';
const hashedPassword = bcrypt.hashSync(password, 10);
console.log(hashedPassword);
```

### 6. 启动开发服务器

```bash
npm run dev
```

访问 http://localhost:3000 查看应用。

### 7. 构建生产版本

```bash
# 构建项目
npm run build

# 启动生产服务器
npm start
```

---

## Vercel 部署

### 1. 准备工作

#### 1.1 推送代码到 GitHub

```bash
git add .
git commit -m "Initial commit"
git push origin master
```

#### 1.2 准备 PostgreSQL 数据库

推荐使用以下云数据库服务：

- **Supabase** (免费额度充足)
- **Neon** (Serverless PostgreSQL)
- **Railway** (简单易用)
- **PlanetScale** (兼容 MySQL，本项目使用 PostgreSQL)

以 Supabase 为例：

1. 访问 [supabase.com](https://supabase.com) 并注册
2. 创建新项目
3. 在项目设置中获取数据库连接字符串
4. 连接字符串格式：`postgresql://postgres:[YOUR-PASSWORD]@db.[YOUR-PROJECT-REF].supabase.co:5432/postgres`

### 2. 部署到 Vercel

#### 2.1 连接 Vercel 到 GitHub

1. 访问 [vercel.com](https://vercel.com) 并登录
2. 点击 "Add New Project"
3. 导入你的 GitHub 仓库
4. Vercel 会自动检测 Next.js 项目

#### 2.2 配置环境变量

在 Vercel 项目设置中添加以下环境变量：

| 变量名 | 说明 | 示例值 |
|--------|------|--------|
| `DATABASE_URL` | PostgreSQL 数据库连接字符串 | `postgresql://postgres:password@db.xxx.supabase.co:5432/postgres` |
| `JWT_SECRET` | JWT 签名密钥（必须强密码） | 使用 `openssl rand -base64 32` 生成 |

**生成安全的 JWT_SECRET**：

```bash
# Linux/Mac
openssl rand -base64 32

# Windows PowerShell
[Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Minimum 0 -Maximum 256 }))
```

#### 2.3 配置构建设置

Vercel 会自动检测 Next.js 配置，无需额外设置。

如果需要自定义，可以在项目根目录创建 `vercel.json`：

```json
{
  "buildCommand": "npm run build",
  "devCommand": "npm run dev",
  "installCommand": "npm install",
  "framework": "nextjs"
}
```

#### 2.4 配置数据库迁移

Vercel 部署时需要自动运行数据库迁移。有两种方式：

**方式一：使用 Vercel Postgres（推荐）**

1. 在 Vercel 项目中添加 Postgres 数据库
2. Vercel 会自动配置 `DATABASE_URL`
3. 在项目设置中添加构建命令：

```bash
npx prisma generate && npx prisma db push
```

**方式二：使用外部数据库 + 自定义脚本**

创建 `scripts/migrate.js`：

```javascript
const { execSync } = require('child_process');

try {
  console.log('Running Prisma migrations...');
  execSync('npx prisma generate', { stdio: 'inherit' });
  execSync('npx prisma db push', { stdio: 'inherit' });
  console.log('Migrations completed successfully!');
} catch (error) {
  console.error('Migration failed:', error);
  process.exit(1);
}
```

在 `package.json` 中添加：

```json
{
  "scripts": {
    "postinstall": "node scripts/migrate.js"
  }
}
```

#### 2.5 部署

点击 "Deploy" 按钮，Vercel 会自动构建和部署。

### 3. 配置自定义域名（可选）

1. 在 Vercel 项目设置中点击 "Domains"
2. 添加你的域名
3. 按照提示配置 DNS 记录

### 4. 监控和日志

- Vercel 提供实时日志和性能监控
- 可以在项目 Dashboard 中查看部署历史和错误日志

---

## 数据库配置

### 本地 PostgreSQL 安装

#### macOS

```bash
# 使用 Homebrew
brew install postgresql@14
brew services start postgresql@14

# 创建数据库
createdb erp_system
```

#### Ubuntu/Debian

```bash
sudo apt update
sudo apt install postgresql postgresql-contrib
sudo systemctl start postgresql
sudo systemctl enable postgresql

# 切换到 postgres 用户
sudo -u postgres psql

# 创建数据库和用户
CREATE DATABASE erp_system;
CREATE USER erp_user WITH PASSWORD 'your-password';
GRANT ALL PRIVILEGES ON DATABASE erp_system TO erp_user;
\q
```

#### Windows

1. 下载并安装 [PostgreSQL](https://www.postgresql.org/download/windows/)
2. 使用 pgAdmin 创建数据库
3. 或使用命令行工具 `psql`

### 数据库连接字符串格式

```
postgresql://[用户名]:[密码]@[主机]:[端口]/[数据库名]
```

示例：

```env
# 本地开发
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/erp_system"

# 生产环境（Supabase）
DATABASE_URL="postgresql://postgres:[YOUR-PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres"

# 生产环境（Neon）
DATABASE_URL="postgresql://[USER]:[PASSWORD]@[HOST].neon.tech/[DATABASE]?sslmode=require"
```

### 数据库备份和恢复

#### 备份

```bash
# 使用 pg_dump
pg_dump -U postgres -d erp_system > backup.sql

# 或使用 Prisma
npx prisma db pull
```

#### 恢复

```bash
# 使用 psql
psql -U postgres -d erp_system < backup.sql

# 或使用 Prisma
npx prisma db push
```

---

## 安全配置

### 1. JWT 密钥配置

JWT 密钥用于签名和验证用户令牌，必须使用强随机字符串。

**生成安全的 JWT_SECRET**：

```bash
# Linux/Mac
openssl rand -base64 32

# 输出示例
# Xy7z9A2bC4dE6fG8hI0jK2lM4nO6pQ8rS0tU2vW4xY6z8A0bC2dE4fG6hI8jK0lM=
```

**重要提示**：
- 永远不要在代码中硬编码 JWT_SECRET
- 生产环境必须使用强随机密钥
- 定期轮换 JWT_SECRET（需要重新登录所有用户）

### 2. 密码加密

项目使用 `bcryptjs` 进行密码加密：

```typescript
// 加密密码（注册时）
const hashedPassword = await bcrypt.hash(password, 10);

// 验证密码（登录时）
const isValid = await bcrypt.compare(password, hashedPassword);
```

**安全建议**：
- 使用至少 10 轮的 salt rounds（当前配置）
- 不要存储明文密码
- 强制用户使用强密码

### 3. 环境变量保护

**本地开发**：
- 将 `.env` 添加到 `.gitignore`
- 不要提交 `.env` 文件到版本控制

**生产环境**：
- 使用 Vercel 环境变量
- 或使用密钥管理服务（如 AWS Secrets Manager）

### 4. HTTPS 配置

**本地开发**：
- 使用 `http://localhost:3000` 即可

**生产环境**：
- Vercel 自动提供 HTTPS
- 自定义域名需要配置 SSL 证书（Vercel 自动处理）

### 5. 数据库安全

**本地开发**：
```env
# 使用强密码
DATABASE_URL="postgresql://postgres:StrongPassword123!@localhost:5432/erp_system"
```

**生产环境**：
- 使用云数据库的连接池
- 启用 SSL 连接
- 限制数据库访问 IP
- 定期备份数据

### 6. CORS 配置

如果需要配置 CORS，可以在 `next.config.ts` 中添加：

```typescript
const nextConfig = {
  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          { key: 'Access-Control-Allow-Origin', value: 'https://yourdomain.com' },
          { key: 'Access-Control-Allow-Methods', value: 'GET,OPTIONS,PATCH,DELETE,POST,PUT' },
          { key: 'Access-Control-Allow-Headers', value: 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version' },
        ],
      },
    ];
  },
};
```

---

## 常见问题

### 1. 数据库连接失败

**错误信息**：`Can't reach database server`

**解决方案**：
- 检查 PostgreSQL 服务是否运行
- 验证 `DATABASE_URL` 是否正确
- 检查防火墙设置
- 确认数据库用户权限

### 2. Prisma 迁移失败

**错误信息**：`P3006: Migration failed`

**解决方案**：
```bash
# 重置数据库（慎用！会删除所有数据）
npx prisma migrate reset

# 或手动推送 schema
npx prisma db push
```

### 3. Vercel 部署失败

**错误信息**：`Build failed`

**解决方案**：
- 检查环境变量是否正确配置
- 查看构建日志获取详细错误
- 确保所有依赖都在 `package.json` 中
- 检查 TypeScript 编译错误

### 4. JWT 验证失败

**错误信息**：`Invalid token`

**解决方案**：
- 确保 `JWT_SECRET` 在所有环境一致
- 检查 token 是否过期
- 清除浏览器 cookies 重新登录

### 5. 端口被占用

**错误信息**：`Port 3000 is already in use`

**解决方案**：
```bash
# 查找占用端口的进程
lsof -ti:3000

# 杀死进程
kill -9 $(lsof -ti:3000)

# 或使用其他端口
PORT=3001 npm run dev
```

---

## 维护和更新

### 更新依赖

```bash
# 检查过时的依赖
npm outdated

# 更新依赖
npm update

# 更新 Prisma Client
npx prisma generate
```

### 数据库迁移

```bash
# 创建新迁移
npx prisma migrate dev --name add_new_field

# 应用迁移到生产环境
npx prisma migrate deploy
```

### 日志和监控

- 本地开发：查看终端输出
- Vercel：使用 Dashboard 查看日志
- 数据库：使用 Prisma Studio 或 pgAdmin

---

## 技术支持

如有问题，请：
1. 查看本文档的常见问题部分
2. 检查 GitHub Issues
3. 查看相关技术文档：
   - [Next.js 文档](https://nextjs.org/docs)
   - [Prisma 文档](https://www.prisma.io/docs)
   - [Vercel 文档](https://vercel.com/docs)

---

## 许可证

请查看项目根目录的 LICENSE 文件。
