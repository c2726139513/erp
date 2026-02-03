'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Menu, X } from 'lucide-react';
import { PERMISSIONS } from '@/lib/permissions';

interface NavItem {
  name: string;
  icon?: any;
  permission?: string | string[];
  path?: string;
  children?: Array<{
    name: string;
    path: string;
    permission: string;
  }>;
}

const allNavItems: NavItem[] = [
  { name: '首页', path: '/' },
  {
    name: '合同管理',
    children: [
      { name: '销售合同', path: '/contracts/sales', permission: PERMISSIONS.CONTRACTS_SALES },
      { name: '采购合同', path: '/contracts/purchase', permission: PERMISSIONS.CONTRACTS_PURCHASE },
    ],
  },
  {
    name: '发票管理',
    children: [
      { name: '开具发票', path: '/invoices/issued', permission: PERMISSIONS.INVOICES_ISSUED },
      { name: '取得发票', path: '/invoices/received', permission: PERMISSIONS.INVOICES_RECEIVED },
    ],
  },
  {
    name: '收付款',
    children: [
      { name: '收款', path: '/payments/receipts', permission: PERMISSIONS.PAYMENTS_RECEIPTS },
      { name: '付款', path: '/payments/expenses', permission: PERMISSIONS.PAYMENTS_EXPENSES },
    ],
  },
  {
    name: '伙伴管理',
    children: [
      { name: '客户列表', path: '/clients/customers', permission: PERMISSIONS.CLIENTS_CUSTOMERS },
      { name: '供应商列表', path: '/clients/suppliers', permission: PERMISSIONS.CLIENTS_SUPPLIERS },
    ],
  },
  { name: '项目管理', path: '/projects', permission: PERMISSIONS.PROJECTS },
  { name: '用户管理', path: '/users', permission: PERMISSIONS.USERS },
  { name: '系统设置', path: '/settings', permission: 'admin' },
];

export function MobileNavigation() {
  const [isOpen, setIsOpen] = useState(false);
  const [expandedMenus, setExpandedMenus] = useState<Set<string>>(new Set());
  const { hasPermission, isAdmin } = useAuth();
  const pathname = usePathname();

  // 阻止背景滚动
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  // 自动展开当前激活的菜单
  useEffect(() => {
    const autoExpandMenus = new Set<string>();
    allNavItems.forEach((item) => {
      if (item.children) {
        const hasActiveChild = item.children.some((child) => pathname === child.path);
        if (hasActiveChild) {
          autoExpandMenus.add(item.name);
        }
      }
    });
    setExpandedMenus(autoExpandMenus);
  }, [pathname]);

  const navItems = allNavItems
    .map((item) => {
      if (!item.children) {
        if (item.name === '首页') {
          return item;
        }
        if (item.permission === 'admin') {
          return isAdmin ? item : null;
        }
        return hasPermission(item.permission || []) ? item : null;
      }

      const filteredChildren = item.children.filter((child) => {
        return hasPermission(child.permission);
      });

      if (filteredChildren.length > 0) {
        return {
          ...item,
          children: filteredChildren,
        };
      }

      return null;
    })
    .filter((item): item is NavItem => item !== null);

  const toggleMenu = (menuName: string) => {
    setExpandedMenus((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(menuName)) {
        newSet.delete(menuName);
      } else {
        newSet.add(menuName);
      }
      return newSet;
    });
  };

  const handleLinkClick = () => {
    setIsOpen(false);
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="md:hidden p-2 min-h-[44px] touch-manipulation text-gray-600 hover:text-gray-900 transition-colors"
        aria-label="打开菜单"
      >
        <Menu size={24} />
      </button>

      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-50 md:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      <div
        className={`fixed top-0 left-0 h-full w-72 bg-white shadow-2xl z-50 transform transition-transform duration-300 ease-in-out md:hidden ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-semibold">菜单</h2>
          <button
            onClick={() => setIsOpen(false)}
            className="p-2 min-h-[44px] touch-manipulation text-gray-600 hover:text-gray-900 transition-colors"
            aria-label="关闭菜单"
          >
            <X size={24} />
          </button>
        </div>

        <nav className="p-4 overflow-y-auto h-[calc(100%-64px)]">
          <ul className="space-y-1">
            {navItems.map((item) => {
              const hasChildren = item.children && item.children.length > 0;
              const isExpanded = expandedMenus.has(item.name);
              const isActive = item.path ? pathname === item.path : false;
              const isChildActive = item.children
                ? item.children.some((child) => pathname === child.path)
                : false;

              return (
                <li key={item.name}>
                  {!hasChildren ? (
                    <Link
                      href={item.path!}
                      onClick={handleLinkClick}
                      className={`flex items-center px-4 py-3 rounded-lg transition-colors min-h-[44px] touch-manipulation ${
                        isActive
                          ? 'bg-blue-600 text-white'
                          : 'text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      <span>{item.name}</span>
                    </Link>
                  ) : (
                    <div>
                      <button
                        onClick={() => toggleMenu(item.name)}
                        className={`w-full flex items-center justify-between px-4 py-3 rounded-lg transition-colors min-h-[44px] touch-manipulation ${
                          isChildActive
                            ? 'bg-blue-600 text-white'
                            : 'text-gray-700 hover:bg-gray-100'
                        }`}
                      >
                        <span>{item.name}</span>
                        <span className={`transform transition-transform ${isExpanded ? 'rotate-180' : ''}`}>
                          ▼
                        </span>
                      </button>
                      {isExpanded && item.children && (
                        <ul className="mt-1 ml-4 space-y-1 animate-in slide-in-from-top-2 duration-200">
                          {item.children.map((child) => (
                            <li key={child.path}>
                              <Link
                                href={child.path}
                                onClick={handleLinkClick}
                                className={`block px-4 py-3 rounded-lg transition-colors min-h-[44px] touch-manipulation ${
                                  pathname === child.path
                                    ? 'bg-blue-700 text-white'
                                    : 'text-gray-600 hover:bg-gray-100'
                                }`}
                              >
                                {child.name}
                              </Link>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        </nav>
      </div>
    </>
  );
}
