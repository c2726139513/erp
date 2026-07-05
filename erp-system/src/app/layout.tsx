import type { Metadata, Viewport } from "next";
import { headers } from 'next/headers'
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { SidebarProvider } from "@/contexts/SidebarContext";
import { AuthProvider } from "@/contexts/AuthContext";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

async function getCompanyName(): Promise<string> {
  const { prisma } = await import('@/lib/prisma')
  try {
    const settings = await prisma.systemSettings.findFirst()
    return settings?.companyName || '我的公司'
  } catch {
    return '我的公司'
  }
}

/**
 * EdgeOne 等 serverless 平台的定期健康检查会触发 generateMetadata，
 * 如果每次健康检查都查询数据库，会产生不必要的数据库流量。
 *
 * 浏览器发出的真实请求会携带 sec-fetch-site 和 cookie 等头部，
 * 而平台健康检查 ping 不会设置这些头部。
 * 仅当检测到浏览器特征时才查询数据库，否则直接返回静态标题。
 */
export async function generateMetadata(): Promise<Metadata> {
  const h = await headers()
  const isRealBrowser = h.has('sec-fetch-site') || h.has('cookie')

  if (!isRealBrowser) {
    return {
      title: 'ERP系统',
      description: '企业合同、发票及收付款管理系统',
    }
  }

  const companyName = await getCompanyName()
  return {
    title: `${companyName} - ERP系统`,
    description: '企业合同、发票及收付款管理系统',
  };
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: '#000000',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <AuthProvider>
          <SidebarProvider>
            {children}
          </SidebarProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
