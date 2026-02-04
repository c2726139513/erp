#!/bin/bash

# ERP 系统本地部署脚本
# 使用 Docker Compose 启动 PostgreSQL 数据库

set -e

echo "=========================================="
echo "  ERP 系统本地部署脚本"
echo "=========================================="
echo ""

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 检查 Docker 是否安装
if ! command -v docker &> /dev/null; then
    echo -e "${RED}错误: Docker 未安装${NC}"
    echo "请先安装 Docker: https://docs.docker.com/get-docker/"
    exit 1
fi

# 检查 Docker Compose 是否安装
if ! command -v docker-compose &> /dev/null; then
    echo -e "${RED}错误: Docker Compose 未安装${NC}"
    echo "请先安装 Docker Compose: https://docs.docker.com/compose/install/"
    exit 1
fi

# 检查 Node.js 是否安装
if ! command -v node &> /dev/null; then
    echo -e "${RED}错误: Node.js 未安装${NC}"
    echo "请先安装 Node.js: https://nodejs.org/"
    exit 1
fi

# 进入项目目录
cd "$(dirname "$0")/erp-system"

# 检查 .env 文件是否存在
if [ ! -f .env ]; then
    echo -e "${YELLOW}未找到 .env 文件，正在创建...${NC}"
    if [ -f ../.env.example ]; then
        cp ../.env.example .env
        echo -e "${GREEN}已从 .env.example 创建 .env 文件${NC}"
    else
        echo -e "${RED}错误: 未找到 .env.example 文件${NC}"
        exit 1
    fi
fi

# 生成随机 JWT 密钥
if ! grep -q "JWT_SECRET" .env || grep -q "your-super-secret-jwt-key" .env; then
    echo -e "${YELLOW}生成安全的 JWT 密钥...${NC}"
    JWT_SECRET=$(openssl rand -base64 32 2>/dev/null || echo "change-this-to-a-random-secret-key-$(date +%s)")
    sed -i "s/JWT_SECRET=.*/JWT_SECRET=\"$JWT_SECRET\"/" .env
    echo -e "${GREEN}JWT 密钥已生成${NC}"
fi

# 启动 PostgreSQL 数据库
echo ""
echo "=========================================="
echo "  启动 PostgreSQL 数据库"
echo "=========================================="
cd ..
docker-compose up -d

# 等待数据库启动
echo -e "${YELLOW}等待数据库启动...${NC}"
sleep 5

# 检查数据库是否就绪
MAX_RETRIES=10
RETRY_COUNT=0
while [ $RETRY_COUNT -lt $MAX_RETRIES ]; do
    if docker-compose exec -T postgres pg_isready -U postgres &> /dev/null; then
        echo -e "${GREEN}数据库已就绪${NC}"
        break
    fi
    RETRY_COUNT=$((RETRY_COUNT + 1))
    echo "等待数据库... ($RETRY_COUNT/$MAX_RETRIES)"
    sleep 2
done

if [ $RETRY_COUNT -eq $MAX_RETRIES ]; then
    echo -e "${RED}错误: 数据库启动超时${NC}"
    exit 1
fi

# 安装依赖
echo ""
echo "=========================================="
echo "  安装项目依赖"
echo "=========================================="
cd erp-system
npm install

# 运行数据库迁移
echo ""
echo "=========================================="
echo "  运行数据库迁移"
echo "=========================================="
npx prisma generate
npx prisma db push

# 检查是否需要创建管理员用户
echo ""
echo "=========================================="
echo "  检查管理员用户"
echo "=========================================="
ADMIN_EXISTS=$(npx prisma db execute --stdin <<EOF
SELECT COUNT(*) FROM "User" WHERE "isAdmin" = true;
EOF
2>/dev/null | grep -o '[0-9]*' | head -1 || echo "0")

if [ "$ADMIN_EXISTS" = "0" ]; then
    echo -e "${YELLOW}未找到管理员用户${NC}"
    read -p "是否创建管理员用户? (y/n): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        read -p "请输入管理员用户名: " ADMIN_USERNAME
        read -sp "请输入管理员密码: " ADMIN_PASSWORD
        echo
        read -sp "请再次输入密码: " ADMIN_PASSWORD_CONFIRM
        echo

        if [ "$ADMIN_PASSWORD" != "$ADMIN_PASSWORD_CONFIRM" ]; then
            echo -e "${RED}错误: 两次输入的密码不一致${NC}"
            exit 1
        fi

        # 使用 Node.js 脚本创建管理员用户
        node -e "
const bcrypt = require('bcryptjs');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function createAdmin() {
    const hashedPassword = await bcrypt.hash('$ADMIN_PASSWORD', 10);
    await prisma.user.create({
        data: {
            username: '$ADMIN_USERNAME',
            password: hashedPassword,
            isAdmin: true,
            permissions: ['CONTRACTS', 'INVOICES', 'PAYMENTS', 'CLIENTS', 'PROJECTS', 'USERS']
        }
    });
    console.log('管理员用户创建成功');
}

createAdmin()
    .then(() => prisma.\$disconnect())
    .catch((e) => {
        console.error('创建管理员用户失败:', e);
        process.exit(1);
    });
"
    fi
else
    echo -e "${GREEN}已存在管理员用户${NC}"
fi

# 启动开发服务器
echo ""
echo "=========================================="
echo "  启动开发服务器"
echo "=========================================="
echo -e "${GREEN}部署完成！${NC}"
echo ""
echo "=========================================="
echo "  访问信息"
echo "=========================================="
echo -e "应用地址: ${GREEN}http://localhost:3000${NC}"
echo -e "数据库: ${GREEN}PostgreSQL (Docker)${NC}"
echo -e "Prisma Studio: ${GREEN}运行 'npx prisma studio'${NC}"
echo ""
echo "=========================================="
echo "  常用命令"
echo "=========================================="
echo "启动开发服务器: npm run dev"
echo "停止数据库: cd .. && docker-compose down"
echo "查看数据库日志: cd .. && docker-compose logs postgres"
echo "重启数据库: cd .. && docker-compose restart"
echo ""
echo -e "${YELLOW}按 Ctrl+C 停止开发服务器${NC}"
echo ""

npm run dev
