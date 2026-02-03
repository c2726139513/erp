'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSidebar } from '@/contexts/SidebarContext';
import { useAuth } from '@/contexts/AuthContext';
import {
  Home,
  FileText,
  Receipt,
  DollarSign,
  Users,
  FolderKanban,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  User as UserIcon,
  Settings,
} from 'lucide-react';
import { useState, useEffect, useMemo } from 'react';
import { PERMISSIONS, PERMISSION_GROUPS } from '@/lib/permissions';

interface NavItem {
  name: string;
  icon: any;
  permission?: string | string[];
  path?: string;
  children?: Array<{
    name: string;
    path: string;
    permission: string;
  }>;
}

const allNavItems: NavItem[] = [
  { name: '首页', icon: Home, path: '/' },
  {
    name: '合同管理',
    icon: FileText,
    children: [
      { name: '销售合同', path: '/contracts/sales', permission: PERMISSIONS.CONTRACTS_SALES },
      { name: '采购合同', path: '/contracts/purchase', permission: PERMISSIONS.CONTRACTS_PURCHASE },
    ],
  },
  {
    name: '发票管理',
    icon: Receipt,
    children: [
      { name: '开具发票', path: '/invoices/issued', permission: PERMISSIONS.INVOICES_ISSUED },
      { name: '取得发票', path: '/invoices/received', permission: PERMISSIONS.INVOICES_RECEIVED },
    ],
  },
  {
    name: '收付款',
    icon: DollarSign,
    children: [
      { name: '收款', path: '/payments/receipts', permission: PERMISSIONS.PAYMENTS_RECEIPTS },
      { name: '付款', path: '/payments/expenses', permission: PERMISSIONS.PAYMENTS_EXPENSES },
    ],
  },
  {
    name: '伙伴管理',
    icon: Users,
    children: [
      { name: '客户列表', path: '/clients/customers', permission: PERMISSIONS.CLIENTS_CUSTOMERS },
      { name: '供应商列表', path: '/clients/suppliers', permission: PERMISSIONS.CLIENTS_SUPPLIERS },
    ],
  },
  { name: '项目管理', icon: FolderKanban, path: '/projects', permission: PERMISSIONS.PROJECTS },
  { name: '用户管理', icon: UserIcon, path: '/users', permission: PERMISSIONS.USERS },
  { name: '系统设置', icon: Settings, path: '/settings', permission: 'admin' },
];

// 权限对应的菜单键名映射（用于首页权限控制）
const MENU_PERMISSIONS: Record<string, string[]> = {
  contracts: [PERMISSIONS.CONTRACTS_SALES, PERMISSIONS.CONTRACTS_PURCHASE],
  invoices: [PERMISSIONS.INVOICES_ISSUED, PERMISSIONS.INVOICES_RECEIVED],
  payments: [PERMISSIONS.PAYMENTS_RECEIPTS, PERMISSIONS.PAYMENTS_EXPENSES],
  clients: [PERMISSIONS.CLIENTS_CUSTOMERS, PERMISSIONS.CLIENTS_SUPPLIERS],
  projects: [PERMISSIONS.PROJECTS],
  users: [PERMISSIONS.USERS],
};

interface SystemSettings {
  companyName: string;
  logoUrl?: string;
}

export default function Navigation() {
  const { isCollapsed, toggleCollapse } = useSidebar();
  const { hasPermission, isAdmin } = useAuth();
  const pathname = usePathname();
  const [expandedMenus, setExpandedMenus] = useState<Set<string>>(new Set());
  const [systemSettings, setSystemSettings] = useState<SystemSettings>({ companyName: 'ERP 系统' });
  const [hoveredMenu, setHoveredMenu] = useState<string | null>(null);
  const [menuPosition, setMenuPosition] = useState<{ top: number; left: number } | null>(null);

  useEffect(() => {
    fetchSystemSettings();
  }, []);

  const fetchSystemSettings = async () => {
    try {
      const res = await fetch('/api/system-settings');
      const data = await res.json();
      if (data.success) {
        setSystemSettings(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch system settings:', error);
    }
  };

  const handleMenuClick = (menuName: string, event: React.MouseEvent) => {
    event.stopPropagation();
    if (isCollapsed) {
      const rect = (event.currentTarget as HTMLElement).getBoundingClientRect();
      setMenuPosition({ top: rect.top, left: rect.right + 8 });
      setHoveredMenu(menuName);
    } else {
      toggleMenu(menuName);
    }
  };

  const handleMouseLeave = () => {
    if (isCollapsed) {
      setHoveredMenu(null);
      setMenuPosition(null);
    }
  };

  const navItems = useMemo(() => {
    return allNavItems.map((item) => {
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
    }).filter((item): item is NavItem => item !== null);
  }, [hasPermission, isAdmin]);

  useEffect(() => {
    const autoExpandMenus = new Set<string>();
    navItems.forEach((item) => {
      if (item.children) {
        const hasActiveChild = item.children.some((child) => pathname === child.path);
        if (hasActiveChild) {
          autoExpandMenus.add(item.name);
        }
      }
    });
    setExpandedMenus(autoExpandMenus);
  }, [pathname]);

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

  const isActive = (item: NavItem): boolean => {
    if (item.path) {
      return pathname === item.path;
    }
    if (item.children) {
      return item.children.some((child) => pathname === child.path);
    }
    return false;
  };

  const isChildActive = (item: NavItem): boolean => {
    if (!item.children) return false;
    return item.children.some((child) => pathname === child.path);
  };

  return (
    <nav className={`hidden md:flex bg-gray-900 text-white min-h-screen transition-all duration-300 ${
      isCollapsed ? 'w-20' : 'w-64'
    }`}>
      <div className={`p-6 w-full ${isCollapsed ? 'px-2' : ''}`}>
        <button
          onClick={toggleCollapse}
          className="w-full flex justify-end mb-4 text-gray-400 hover:text-white transition-colors"
        >
          {isCollapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
        </button>
        <div className="mb-8">
          {!isCollapsed && (
            <div className="flex items-center gap-3">
              {systemSettings.logoUrl && (
                <img
                  src={systemSettings.logoUrl}
                  alt="公司LOGO"
                  className="w-10 h-10 rounded-lg object-cover"
                />
              )}
              <span className="text-2xl font-bold">{systemSettings.companyName}</span>
            </div>
          )}
        </div>
        <ul className="space-y-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const hasChildren = item.children && item.children.length > 0;
          const isExpanded = expandedMenus.has(item.name);
          const isMenuActive = isActive(item);

          if (isCollapsed && hasChildren) {
            return (
              <li key={item.name} className="relative">
                <button
                  onClick={(e) => handleMenuClick(item.name, e)}
                  className={`flex items-center justify-center w-full rounded-lg transition-colors ${
                    isMenuActive ? 'bg-blue-600 text-white' : 'hover:bg-gray-800'
                  } px-0 py-3`}
                  title={item.name}
                >
                  <Icon size={20} />
                </button>
                {hoveredMenu === item.name && menuPosition && (
                  <div
                    className="fixed bg-gray-800 rounded-lg shadow-xl py-2 min-w-48 z-50 animate-in fade-in slide-in-from-left-2 duration-200"
                    style={{
                      top: `${menuPosition.top}px`,
                      left: `${menuPosition.left}px`,
                    }}
                    onMouseLeave={handleMouseLeave}
                  >
                    {item.children?.map((child) => (
                      <Link
                        key={child.path}
                        href={child.path}
                        className={`block px-4 py-2 text-sm transition-all duration-150 ${
                          pathname === child.path
                            ? 'bg-blue-600 text-white'
                            : 'hover:bg-gray-700 hover:translate-x-1'
                        }`}
                        onClick={() => {
                          setHoveredMenu(null);
                          setMenuPosition(null);
                        }}
                      >
                        {child.name}
                      </Link>
                    ))}
                  </div>
                )}
              </li>
            );
          }

          if (isCollapsed && item.path) {
            return (
              <li key={item.path}>
                <Link
                  href={item.path}
                  className={`flex items-center justify-center rounded-lg transition-colors ${
                    pathname === item.path
                      ? 'bg-blue-600 text-white'
                      : 'hover:bg-gray-800'
                  } px-0 py-3`}
                  title={item.name}
                >
                  <Icon size={20} />
                </Link>
              </li>
            );
          }

          return (
            <li key={item.name}>
              {!hasChildren ? (
                <Link
                  href={item.path!}
                  className={`flex items-center rounded-lg transition-colors ${
                    pathname === item.path
                      ? 'bg-blue-600 text-white'
                      : 'hover:bg-gray-800'
                  } px-4 py-3`}
                >
                  <Icon size={20} className="mr-3" />
                  <span>{item.name}</span>
                </Link>
              ) : (
                <div>
                  <button
                    onClick={() => toggleMenu(item.name)}
                    className={`w-full flex items-center justify-between rounded-lg transition-colors ${
                      isMenuActive ? 'bg-blue-600 text-white' : 'hover:bg-gray-800'
                    } px-4 py-3`}
                  >
                    <div className="flex items-center">
                      <Icon size={20} className="mr-3" />
                      <span>{item.name}</span>
                    </div>
                    {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                  </button>
                  {isExpanded && item.children && (
                    <ul className="mt-1 ml-4 space-y-1 overflow-hidden animate-in slide-in-from-top-2 duration-200">
                      {item.children.map((child) => (
                        <li key={child.path}>
                          <Link
                            href={child.path}
                            className={`block rounded-lg transition-all duration-150 ${
                              pathname === child.path
                                ? 'bg-blue-700 text-white'
                                : 'hover:bg-gray-800 hover:translate-x-1'
                            } px-4 py-2 text-sm`}
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
      </div>
    </nav>
  );
}
