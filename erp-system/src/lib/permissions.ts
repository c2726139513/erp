// 权限常量定义
export const PERMISSIONS = {
  // 合同管理
  CONTRACTS_SALES: 'contracts.sales',
  CONTRACTS_PURCHASE: 'contracts.purchase',
  
  // 发票管理
  INVOICES_ISSUED: 'invoices.issued',
  INVOICES_RECEIVED: 'invoices.received',
  
  // 收付款管理
  PAYMENTS_RECEIPTS: 'payments.receipts',
  PAYMENTS_EXPENSES: 'payments.expenses',
  
  // 项目管理
  PROJECTS: 'projects',
  
  // 伙伴管理
  CLIENTS_CUSTOMERS: 'clients.customers',
  CLIENTS_SUPPLIERS: 'clients.suppliers',
  
  // 用户管理
  USERS: 'users',
} as const;

// 权限组定义（用于批量设置）
export const PERMISSION_GROUPS = {
  // 合同管理员
  CONTRACTS_ADMIN: [PERMISSIONS.CONTRACTS_SALES, PERMISSIONS.CONTRACTS_PURCHASE],
  
  // 发票管理员
  INVOICES_ADMIN: [PERMISSIONS.INVOICES_ISSUED, PERMISSIONS.INVOICES_RECEIVED],
  
  // 收付款管理员
  PAYMENTS_ADMIN: [PERMISSIONS.PAYMENTS_RECEIPTS, PERMISSIONS.PAYMENTS_EXPENSES],
  
  // 伙伴管理员
  CLIENTS_ADMIN: [PERMISSIONS.CLIENTS_CUSTOMERS, PERMISSIONS.CLIENTS_SUPPLIERS],
  
  // 管理员权限（所有权限）
  ADMIN: Object.values(PERMISSIONS) as string[],
};

export type Permission = typeof PERMISSIONS[keyof typeof PERMISSIONS];
