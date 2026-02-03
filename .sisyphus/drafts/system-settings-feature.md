# Draft: 系统设置功能实现

## 需求概述

用户希望增加系统设置功能，包含：
1. 公司名称（文本字段）
2. 公司LOGO（图片上传）
3. 公司名称与网页标题挂钩（动态metadata）
4. 仅管理员可访问

## 技术栈确认
- Next.js 16.1.6 (App Router, React 19.2.3)
- Prisma ORM (PostgreSQL)
- JWT认证
- TypeScript Strict模式

## 调研发现

### 1. 项目结构
- 主目录: `/root/erp/erp-system/`
- 源码目录: `erp-system/src/`
- Prisma配置在 `/root/erp/prisma/schema.prisma` (minimal，目前只定义了generator和datasource)

### 2. 认证系统
- JWT payload: userId, username, permissions, isAdmin
- 认证中间件: 验证cookie中的token
- AuthContext提供isAdmin状态

### 3. 权限系统
```typescript
export const PERMISSIONS = {
  USERS: 'users',
  // ... 其他权限
} as const;
```
- 需要添加: SYSTEM_SETTINGS

### 4. API路由模式
```typescript
export async function GET(request: NextRequest) {
  try {
    return NextResponse.json(successResponse(data));
  } catch (error) {
    return handleApiError(error);
  }
}
```
- 使用successResponse, errorResponse, handleApiError

### 5. 导航系统
- Navigation组件使用hasPermission控制菜单显示
- 使用isAdmin检查管理员功能

### 6. 布局
- 静态metadata需要改为动态获取

## 技术决策

### 数据库设计 (单例模式)
```prisma
model SystemSettings {
  id          String   @id @default("system-settings")
  companyName String   @default("ERP 系统")
  companyLogo String?  // 图片URL
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}
```

### API端点设计
1. GET /api/settings - 获取设置（公开）
2. PUT /api/settings - 更新设置（仅管理员，需要验证JWT isAdmin）
3. POST /api/settings/upload - 图片上传（仅管理员）

### 前端页面
1. /settings - 系统设置页面（使用AuthContext.isAdmin保护）

### 动态Metadata
- 使用Next.js 16的动态metadata API
- 从API获取companyName设置title

### 图片存储策略
- 使用Next.js static文件夹存储上传的图片
- 上传路径: `public/uploads/logos/`

## 依赖分析

### 前置任务
1. 更新Prisma schema并生成client
2. 创建数据库迁移
3. 初始化SystemSettings默认记录

### 可并行任务
- API路由和前端UI可以并行开发
- Navigation更新和页面开发可以并行
- 动态metadata实现与前端页面开发可以部分并行

## 开放问题

1. 图片上传限制（大小、类型）？
2. 是否需要图片压缩或缩略图？
3. 是否需要支持SVG格式？
4. 是否需要默认设置初始化脚本？

## 测试策略
- 无测试框架（根据AGENTS.md说明）
- 使用手动验证流程
- 验证命令: curl测试API + 浏览器访问验证UI
