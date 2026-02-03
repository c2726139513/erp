# 系统设置功能实现计划

## TL;DR

> **快速摘要**: 为ERP系统增加系统设置功能，包含公司名称、公司LOGO上传、动态页面标题，仅管理员可访问
> 
> **交付物**:
> - 数据库表 SystemSettings (单例模式)
> - API端点: GET/PUT /api/settings, POST /api/settings/upload
> - 前端页面: /settings
> - 动态metadata实现
> - 导航菜单"系统设置"入口
> 
> **预估工作量**: Short (3-5小时)
> **并行执行**: YES - 2 waves
> **关键路径**: 数据库迁移 → API路由 → 动态metadata → 前端页面

---

## Context

### 原始请求
用户希望增加系统设置功能：
1. 公司名称（文本字段）
2. 公司LOGO（图片上传）
3. 公司名称和网页标题挂钩（动态metadata）
4. 系统设置功能仅管理员有权限

### 访谈摘要

**关键技术发现**:
- 项目使用 Next.js 16.1.6 App Router + React 19.2.3
- JWT认证: payload包含 `isAdmin: boolean` 标志
- Prisma ORM: 当前schema只有generator和datasource定义
- 权限系统: 已有 `PERMISSIONS` 常量和 `hasPermission()` 函数
- AuthContext提供 `isAdmin` 状态供前端使用
- API响应模式: `successResponse()`, `errorResponse()`, `handleApiError()`
- 无测试框架，需手动验证

**代码库结构**:
- 主目录: `/root/erp/erp-system/`
- 源码目录: `erp-system/src/`
- 数据库schema: `/root/erp/prisma/schema.prisma`

**现有API模式示例**:
```typescript
// erp-system/src/app/api/clients/route.ts
export async function GET(request: NextRequest) {
  try {
    return NextResponse.json(successResponse(data));
  } catch (error) {
    return handleApiError(error);
  }
}
```

**导航菜单模式**:
```typescript
// erp-system/src/components/Navigation.tsx
const allNavItems: NavItem[] = [
  { name: '首页', icon: Home, path: '/' },
  { name: '用户管理', icon: UserIcon, path: '/users', permission: PERMISSIONS.USERS },
];
```

---

## Work Objectives

### 核心目标
实现系统设置功能，允许管理员配置公司名称和LOGO，并在整个应用中动态显示公司名称。

### 具体交付物
1. `prisma/schema.prisma` - 新增 SystemSettings 模型
2. `erp-system/src/app/api/settings/route.ts` - GET/PUT API端点
3. `erp-system/src/app/api/settings/upload/route.ts` - 图片上传端点
4. `erp-system/src/app/settings/page.tsx` - 系统设置页面
5. `erp-system/src/app/settings/layout.tsx` - 页面动态metadata
6. `erp-system/src/components/Navigation.tsx` - 添加"系统设置"菜单
7. `erp-system/src/lib/permissions.ts` - 添加 SYSTEM_SETTINGS 权限常量

### 定义完成
- [ ] SystemSettings表创建并包含默认记录
- [ ] GET /api/settings 返回当前设置
- [ ] PUT /api/settings 成功更新公司名称和LOGO（管理员）
- [ ] POST /api/settings/upload 成功上传图片（管理员）
- [ ] /settings 页面仅管理员可见
- [ ] 页面标题动态显示公司名称
- [ ] 导航菜单显示"系统设置"入口（仅管理员）

### 必须有
- 公司名称文本输入和保存
- 公司LOGO图片上传和预览
- 仅管理员可访问设置页面
- 动态页面标题显示公司名称

### 禁止有
- 非管理员可修改设置
- 图片上传无大小限制
- 任意路径可访问设置API

---

## 验证策略

> **重要**: 当前项目无测试框架，根据AGENTS.md说明，使用手动验证流程。

### 验证方式: curl + 浏览器访问

**API验证** (使用 Bash):
```bash
# 1. 测试公开获取设置API
curl -s http://localhost:3000/api/settings | jq '.'
# 期望: {"success": true, "data": {"id": "...", "companyName": "...", "companyLogo": null}}

# 2. 测试管理员更新设置（需先登录获取token）
# curl -c cookies.txt -X POST http://localhost:3000/api/auth/login -H "Content-Type: application/json" -d '{"username":"admin","password":"..."}'
# curl -b cookies.txt -X PUT http://localhost:3000/api/settings -H "Content-Type: application/json" -d '{"companyName":"新公司名"}'

# 3. 测试非管理员无法更新
# curl -X PUT http://localhost:3000/api/settings -H "Content-Type: application/json" -d '{"companyName":"测试"}'
# 期望: 401 Unauthorized 或 403 Forbidden

# 4. 测试图片上传
# curl -b cookies.txt -X POST -F "file=@logo.png" http://localhost:3000/api/settings/upload
```

**前端验证** (浏览器):
1. 访问 http://localhost:3000/settings
   - 管理员: 应看到设置表单
   - 非管理员: 应重定向或显示403
2. 输入公司名称并保存，确认成功提示
3. 上传LOGO图片，确认预览显示
4. 刷新页面，确认设置已保存
5. 检查浏览器标签页标题是否显示公司名称

---

## Execution Strategy

### 并行执行 Waves

```
Wave 1 (可立即开始):
├── 任务1: 更新prisma schema并生成client
├── 任务2: 初始化数据库SystemSettings记录
├── 任务3: 更新PERMISSIONS常量
├── 任务4: 创建settings API路由（GET/PUT）
└── 任务5: 创建settings图片上传API

Wave 2 (Wave 1完成后):
├── 任务6: 创建动态metadata实现
├── 任务7: 创建settings页面（设置表单）
├── 任务8: 更新Navigation添加系统设置菜单
└── 任务9: 更新DashboardLayout面包屑（可选）
```

### 依赖矩阵

| 任务 | 依赖项 | 阻塞 | 可并行 |
|------|--------|------|--------|
| 1. 更新schema | 无 | 2 | - |
| 2. 初始化数据库 | 1 | 无 | 3,4,5 |
| 3. 更新PERMISSIONS | 无 | 7,8 | 1,2,4,5 |
| 4. 创建settings API | 1,3 | 6 | 2,5 |
| 5. 创建上传API | 1,3 | 6 | 2,4 |
| 6. 动态metadata | 4 | 无 | 7,8,9 |
| 7. 设置页面 | 4 | 无 | 6,8,9 |
| 8. 更新Navigation | 3 | 无 | 6,7,9 |
| 9. 更新面包屑 | 7 | 无 | 6,7,8 |

### Agent派发摘要

| Wave | 任务 | 推荐Agent |
|------|------|-----------|
| 1 | 1,2 | quick (数据库操作简单) |
| 1 | 3,4,5 | general (API路由，中等复杂度) |
| 2 | 6,7,8,9 | general (前端组件和配置) |

---

## TODOs

- [ ] 1. 更新 Prisma schema - 添加 SystemSettings 模型

  **做什么**:
  - 在 `prisma/schema.prisma` 中添加 SystemSettings 模型
  - 使用单例模式: `id String @id @default("system-settings")`
  - 字段: companyName (String), companyLogo (String?)

  **禁止做**:
  - 不要添加其他业务字段
  - 不要创建多个设置记录

  **推荐Agent Profile**:
  - Category: `quick`
    - 理由: 简单的schema定义任务
  - Skills: 无需特殊技能

  **并行化**:
  - 可并行: YES
  - 并行组: Wave 1 (与任务2,3,4,5)
  - 阻塞: 任务2
  - 被阻塞: 无（可开始）

  **引用**:
  - `prisma/schema.prisma:1-15` - 当前schema结构
  - 用户需求: 单例模式，一行记录

  **验收标准**:
  - [ ] SystemSettings模型定义包含id, companyName, companyLogo, createdAt, updatedAt
  - [ ] 执行 `npx prisma generate` 成功
  - [ ] 确认生成的Prisma Client包含SystemSettings模型

- [ ] 2. 初始化数据库 SystemSettings 记录

  **做什么**:
  - 使用Prisma Client创建默认SystemSettings记录
  - companyName默认为"ERP 系统"
  - companyLogo默认为null

  **禁止做**:
  - 不要覆盖已存在的记录（使用upsert或createIfNotExists）

  **推荐Agent Profile**:
  - Category: `quick`
    - 理由: 单次数据库操作
  - Skills: 无需特殊技能

  **并行化**:
  - 可并行: YES
  - 并行组: Wave 1 (与任务1,3,4,5)
  - 阻塞: 任务1
  - 被阻塞: 无

  **引用**:
  - `erp-system/src/lib/prisma.ts` - Prisma client使用方式
  - 任务1的SystemSettings模型定义

  **验收标准**:
  - [ ] 数据库中存在SystemSettings记录
  - [ ] companyName = "ERP 系统"
  - [ ] companyLogo = null
  - [ ] 执行 `npx prisma studio` 可查看记录

  **验证命令**:
  ```bash
  # 在erp-system目录执行
  npx prisma studio
  # 或使用psql检查:
  # SELECT * FROM "SystemSettings";
  ```

- [ ] 3. 更新 PERMISSIONS 常量

  **做什么**:
  - 在 `erp-system/src/lib/permissions.ts` 中添加 SYSTEM_SETTINGS 常量
  - 将SYSTEM_SETTINGS添加到ADMIN权限组

  **禁止做**:
  - 不要修改现有权限常量

  **推荐Agent Profile**:
  - Category: `quick`
    - 理由: 简单的常量添加
  - Skills: 无

  **并行化**:
  - 可并行: YES
  - 并行组: Wave 1 (与任务1,2,4,5)
  - 阻塞: 无
  - 被阻塞: 任务7,8

  **引用**:
  - `erp-system/src/lib/permissions.ts:1-45` - 现有PERMISSIONS定义

  **验收标准**:
  - [ ] 添加 `SYSTEM_SETTINGS: 'system.settings'`
  - [ ] ADMIN权限组包含SYSTEM_SETTINGS
  - [ ] TypeScript编译无错误

- [ ] 4. 创建 settings API 路由 (GET/PUT)

  **做什么**:
  - 创建 `erp-system/src/app/api/settings/route.ts`
  - 实现GET: 返回SystemSettings记录（公开访问）
  - 实现PUT: 更新设置（仅管理员，需要JWT验证isAdmin）
  - 使用现有API响应模式

  **禁止做**:
  - 不要添加认证无关的复杂逻辑
  - 不要创建多个路由文件

  **推荐Agent Profile**:
  - Category: `general`
    - 理由: API路由需要理解JWT验证和权限检查
  - Skills: 无需额外技能

  **并行化**:
  - 可并行: YES
  - 并行组: Wave 1 (与任务1,2,3,5)
  - 阻塞: 任务1,3
  - 被阻塞: 任务6,7

  **引用**:
  - `erp-system/src/app/api/clients/route.ts:1-62` - API模式参考
  - `erp-system/src/lib/auth.ts:1-32` - JWT验证函数
  - `erp-system/src/lib/api-response.ts:1-48` - 响应模式
  - 任务1的SystemSettings模型

  **验收标准**:
  - [ ] GET请求返回当前设置: `{"success": true, "data": {...}}`
  - [ ] PUT请求管理员可更新companyName和companyLogo
  - [ ] PUT请求非管理员返回401/403
  - [ ] 正确的错误处理

  **验证命令**:
  ```bash
  # 测试GET公开访问
  curl -s http://localhost:3000/api/settings | jq '.'
  
  # 测试PUT需要认证（模拟）
  # curl -X PUT http://localhost:3000/api/settings \
  #   -H "Content-Type: application/json" \
  #   -d '{"companyName":"新公司"}'
  ```

- [ ] 5. 创建 settings 图片上传 API

  **做什么**:
  - 创建 `erp-system/src/app/api/settings/upload/route.ts`
  - 接收 multipart/form-data 图片上传
  - 保存图片到 `public/uploads/logos/` 目录
  - 返回图片URL
  - 验证管理员权限

  **禁止做**:
  - 不要接受非图片文件类型
  - 不要上传到外部存储（S3等）

  **推荐Agent Profile**:
  - Category: `general`
    - 理由: 需要处理文件上传和权限验证
  - Skills: 无需额外技能

  **并行化**:
  - 可并行: YES
  - 并行组: Wave 1 (与任务1,2,3,4)
  - 阻塞: 任务1,3
  - 被阻塞: 任务6,7

  **引用**:
  - `erp-system/src/lib/auth.ts` - JWT验证
  - `erp-system/src/app/api/settings/route.ts` - 任务4的权限验证模式
  - Next.js文档: 文件上传处理

  **验收标准**:
  - [ ] POST请求仅管理员可上传
  - [ ] 非管理员返回401/403
  - [ ] 图片保存到 `public/uploads/logos/[filename]`
  - [ ] 返回 `{success: true, data: {url: "/uploads/logos/filename"}}`
  - [ ] 上传目录不存在时自动创建

  **验证命令**:
  ```bash
  # 确保uploads目录存在
  mkdir -p public/uploads/logos
  
  # 测试上传（需要管理员cookie）
  # curl -b cookies.txt -X POST \
  #   -F "file=@test-logo.png" \
  #   http://localhost:3000/api/settings/upload
  
  # 验证文件存在
  ls -la public/uploads/logos/
  ```

- [ ] 6. 实现动态 Metadata

  **做什么**:
  - 创建 `erp-system/src/app/settings/layout.tsx` 或修改现有layout
  - 实现动态metadata函数，从API获取companyName
  - 标题格式: "{companyName} - ERP 系统"

  **禁止做**:
  - 不要修改全局layout.tsx的静态部分
  - 不要在动态metadata中进行复杂计算

  **推荐Agent Profile**:
  - Category: `general`
    - 理由: 需要理解Next.js 16动态metadata API
  - Skills: 无需额外技能

  **并行化**:
  - 可并行: YES
  - 并行组: Wave 2 (与任务7,8,9)
  - 阻塞: 任务4,5
  - 被阻塞: 无

  **引用**:
  - `erp-system/src/app/layout.tsx:17-20` - 当前静态metadata
  - Next.js 16文档: 动态metadata API
  - `erp-system/src/app/api/settings/route.ts` - 任务4的GET API

  **验收标准**:
  - [ ] 访问/settings页面时，API请求companyName
  - [ ] 浏览器标签页标题显示: "{公司名称} - ERP 系统"
  - [ ] 更新公司名称后刷新页面，标题变化
  - [ ] metadata函数类型正确

  **验证命令**:
  ```bash
  # 访问设置页面，检查页面标题
  # 在浏览器DevTools中查看 <title>
  
  # 或使用curl获取HTML并grep标题
  curl -s http://localhost:3000/settings | grep -o '<title>[^<]*</title>'
  ```

- [ ] 7. 创建设置页面 (设置表单)

  **做什么**:
  - 创建 `erp-system/src/app/settings/page.tsx`
  - 页面使用AuthContext.isAdmin进行访问控制
  - 公司名称输入框（支持编辑）
  - 公司LOGO上传组件（支持预览）
  - 保存按钮调用PUT API
  - 上传LOGO调用upload API

  **禁止做**:
  - 不要添加与设置无关的功能
  - 不要硬编码任何值（使用API数据）

  **推荐Agent Profile**:
  - Category: `general`
    - 理由: 需要创建React组件和处理API调用
  - Skills: 无需额外技能

  **并行化**:
  - 可并行: YES
  - 并行组: Wave 2 (与任务6,8,9)
  - 阻塞: 任务4
  - 被阻塞: 无

  **引用**:
  - `erp-system/src/app/users/page.tsx` - 现有页面模式参考
  - `erp-system/src/contexts/AuthContext.tsx` - isAdmin使用方式
  - `erp-system/src/components/Navigation.tsx` - 权限保护模式
  - Tailwind CSS: 表单样式参考

  **验收标准**:
  - [ ] 页面可访问
  - [ ] 管理员可看到完整表单
  - [ ] 非管理员访问重定向或显示403
  - [ ] 公司名称输入框显示当前值
  - [ ] LOGO预览显示当前图片（或占位符）
  - [ ] 保存后显示成功提示
  - [ ] 上传LOGO后立即预览

  **验证命令**:
  ```bash
  # 浏览器访问测试
  # 1. 管理员登录后访问 http://localhost:3000/settings
  # 2. 确认看到设置表单
  # 3. 输入新公司名称并保存
  # 4. 上传LOGO图片，确认预览
  # 5. 刷新页面，数据保持
  ```

- [ ] 8. 更新 Navigation 菜单

  **做什么**:
  - 在 `erp-system/src/components/Navigation.tsx` 的 allNavItems 中添加"系统设置"菜单项
  - 添加图标: Settings (从lucide-react导入)
  - 权限: isAdmin检查

  **禁止做**:
  - 不要移除现有菜单项
  - 不要改变现有菜单结构

  **推荐Agent Profile**:
  - Category: `quick`
    - 理由: 简单的菜单配置
  - Skills: 无

  **并行化**:
  - 可并行: YES
  - 并行组: Wave 2 (与任务6,7,9)
  - 阻塞: 任务3
  - 被阻塞: 无

  **引用**:
  - `erp-system/src/components/Navigation.tsx:35-71` - 现有菜单配置
  - `erp-system/src/lib/permissions.ts` - 任务3的SYSTEM_SETTINGS

  **验收标准**:
  - [ ] 添加菜单项: `{ name: '系统设置', icon: Settings, path: '/settings', permission: PERMISSIONS.SYSTEM_SETTINGS }`
  - [ ] 仅管理员可见该菜单项
  - [ ] 点击跳转到/settings页面
  - [ ] 菜单项样式与其他项一致

  **验证命令**:
  ```bash
  # 浏览器登录管理员账户
  # 确认导航菜单显示"系统设置"
  
  # 浏览器登录非管理员账户
  # 确认导航菜单不显示"系统设置"
  ```

- [ ] 9. (可选) 更新 DashboardLayout 面包屑

  **做什么**:
  - 检查 `erp-system/src/components/DashboardLayout.tsx` 是否需要面包屑更新
  - 为/settings页面添加面包屑路径

  **禁止做**:
  - 不要强制添加，保持与现有页面一致

  **推荐Agent Profile**:
  - Category: `quick`
    - 理由: 简单的面包屑配置
  - Skills: 无

  **并行化**:
  - 可并行: YES
  - 并行组: Wave 2 (与任务6,7,8)
  - 阻塞: 任务7
  - 被阻塞: 无

  **引用**:
  - `erp-system/src/components/DashboardLayout.tsx` - 面包屑配置

  **验收标准**:
  - [ ] /settings页面面包屑显示: 首页 > 系统设置
  - [ ] 面包屑链接可点击跳转
  - [ ] 样式与其他页面一致

---

## 提交策略

| 任务后 | 消息 | 文件 | 验证 |
|--------|------|------|------|
| 1 | `feat(db): 添加 SystemSettings 模型` | prisma/schema.prisma | `npx prisma generate` |
| 2 | `feat(db): 初始化系统设置记录` | - | 数据库记录检查 |
| 3 | `feat(permissions): 添加系统设置权限` | erp-system/src/lib/permissions.ts | TypeScript编译 |
| 4 | `feat(api): 创建设置管理 API` | erp-system/src/app/api/settings/route.ts | API测试 |
| 5 | `feat(api): 添加图片上传 API` | erp-system/src/app/api/settings/upload/route.ts | 上传测试 |
| 6 | `feat(settings): 实现动态 metadata` | erp-system/src/app/settings/layout.tsx | 标题检查 |
| 7 | `feat(settings): 创建设置页面` | erp-system/src/app/settings/page.tsx | 页面测试 |
| 8 | `feat(nav): 添加系统设置菜单` | erp-system/src/components/Navigation.tsx | 菜单显示测试 |

---

## 成功标准

### 验证命令
```bash
# API 测试
curl -s http://localhost:3000/api/settings | jq '.success'
# 期望: true

curl -s http://localhost:3000/api/settings | jq '.data.companyName'
# 期望: "ERP 系统" (或更新后的值)

# 前端测试
# 浏览器访问 http://localhost:3000/settings
# 1. 确认页面可访问
# 2. 确认显示设置表单
# 3. 确认显示当前公司名称
# 4. 确认页面标题包含公司名称

# 导航菜单测试
# 1. 管理员登录确认看到"系统设置"菜单
# 2. 非管理员登录确认不显示"系统设置"菜单
```

### 最终检查清单
- [ ] 所有"必须有"功能已实现
- [ ] 所有"禁止有"问题已避免
- [ ] API权限验证正常工作
- [ ] 前端访问控制正常工作
- [ ] 动态metadata正常显示
- [ ] 图片上传功能正常
- [ ] 菜单入口正确显示
- [ ] TypeScript编译无错误
- [ ] ESLint检查通过
