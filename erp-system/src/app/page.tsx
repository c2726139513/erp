'use client';

import { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/DashboardLayout';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { PERMISSIONS } from '@/lib/permissions';

export default function HomePage() {
  const { user, loading: authLoading } = useAuth();

  // 细粒度检查每个具体权限
  const hasSalesContract = user?.permissions.includes(PERMISSIONS.CONTRACTS_SALES);
  const hasPurchaseContract = user?.permissions.includes(PERMISSIONS.CONTRACTS_PURCHASE);
  const hasIssuedInvoices = user?.permissions.includes(PERMISSIONS.INVOICES_ISSUED);
  const hasReceivedInvoices = user?.permissions.includes(PERMISSIONS.INVOICES_RECEIVED);
  const hasReceiptPayments = user?.permissions.includes(PERMISSIONS.PAYMENTS_RECEIPTS);
  const hasExpensePayments = user?.permissions.includes(PERMISSIONS.PAYMENTS_EXPENSES);
  const hasCustomerClients = user?.permissions.includes(PERMISSIONS.CLIENTS_CUSTOMERS);
  const hasSupplierClients = user?.permissions.includes(PERMISSIONS.CLIENTS_SUPPLIERS);
  const hasProjects = user?.permissions.includes(PERMISSIONS.PROJECTS);
  const hasUsers = user?.permissions.includes(PERMISSIONS.USERS);

  const [stats, setStats] = useState({
    clients: { customers: 0, suppliers: 0 },
    contracts: { sales: 0, purchase: 0, salesAmount: 0, purchaseAmount: 0 },
    invoices: { issued: 0, received: 0, issuedAmount: 0, receivedAmount: 0 },
    payments: { receipts: 0, expenses: 0, receiptsAmount: 0, expensesAmount: 0 },
    projects: { total: 0, inProgress: 0 },
  });

  useEffect(() => {
    fetchStats();
  }, [hasSalesContract, hasPurchaseContract, hasIssuedInvoices, hasReceivedInvoices, hasReceiptPayments, hasExpensePayments, hasCustomerClients, hasSupplierClients, hasProjects]);

  const fetchStats = async () => {
    try {
      const fetchPromises: Array<Promise<{ success: boolean; data: any }>> = [];
      const fetchData = async (url: string) => {
        const res = await fetch(url);
        const data = await res.json();
        return data;
      };

      // 只获取有权限的具体数据
      if (hasSalesContract) {
        fetchPromises.push(fetchData('/api/contracts?contractType=SALES'));
      }
      if (hasPurchaseContract) {
        fetchPromises.push(fetchData('/api/contracts?contractType=PURCHASE'));
      }
      if (hasIssuedInvoices) {
        fetchPromises.push(fetchData('/api/invoices?invoiceType=ISSUED'));
      }
      if (hasReceivedInvoices) {
        fetchPromises.push(fetchData('/api/invoices?invoiceType=RECEIVED'));
      }
      if (hasReceiptPayments) {
        fetchPromises.push(fetchData('/api/payments?paymentType=RECEIPT'));
      }
      if (hasExpensePayments) {
        fetchPromises.push(fetchData('/api/payments?paymentType=EXPENSE'));
      }
      if (hasCustomerClients) {
        fetchPromises.push(fetchData('/api/clients?clientType=CUSTOMER'));
      }
      if (hasSupplierClients) {
        fetchPromises.push(fetchData('/api/clients?clientType=SUPPLIER'));
      }
      if (hasProjects) {
        fetchPromises.push(fetchData('/api/projects'));
      }

      if (fetchPromises.length === 0) {
        return;
      }

      const results = await Promise.all(fetchPromises);

      if (results.every(r => r.success)) {
        // results数组的顺序与fetchPromises的顺序一致
        let idx = 0;
        const salesContractsData = hasSalesContract && results[idx++]?.data || [];
        const purchaseContractsData = hasPurchaseContract && results[idx++]?.data || [];
        const issuedInvoicesData = hasIssuedInvoices && results[idx++]?.data || [];
        const receivedInvoicesData = hasReceivedInvoices && results[idx++]?.data || [];
        const receiptsPaymentsData = hasReceiptPayments && results[idx++]?.data || [];
        const expensesPaymentsData = hasExpensePayments && results[idx++]?.data || [];
        const customersData = hasCustomerClients && results[idx++]?.data || [];
        const suppliersData = hasSupplierClients && results[idx++]?.data || [];
        const allProjectsData = hasProjects && results[idx++]?.data || [];

        setStats({
          clients: {
            customers: customersData.length,
            suppliers: suppliersData.length,
          },
          contracts: {
            sales: salesContractsData.length,
            purchase: purchaseContractsData.length,
            salesAmount: salesContractsData.reduce((sum: number, c: any) => sum + c.amount, 0),
            purchaseAmount: purchaseContractsData.reduce((sum: number, c: any) => sum + c.amount, 0),
          },
          invoices: {
            issued: issuedInvoicesData.length,
            received: receivedInvoicesData.length,
            issuedAmount: issuedInvoicesData.reduce((sum: number, i: any) => sum + i.amount, 0),
            receivedAmount: receivedInvoicesData.reduce((sum: number, i: any) => sum + i.amount, 0),
          },
          payments: {
            receipts: receiptsPaymentsData.length,
            expenses: expensesPaymentsData.length,
            receiptsAmount: receiptsPaymentsData.reduce((sum: number, p: any) => sum + p.amount, 0),
            expensesAmount: expensesPaymentsData.reduce((sum: number, p: any) => sum + p.amount, 0),
          },
          projects: {
            total: allProjectsData.length,
            inProgress: allProjectsData.filter((p: any) => p.status === 'IN_PROGRESS').length,
          },
        });
      }
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    }
  };

  return (
    <DashboardLayout>
      <div>
          <h1 className="text-2xl md:text-3xl font-bold mb-6">欢迎使用 ERP 系统</h1>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-6 mb-8">
            {(hasCustomerClients || hasSupplierClients) && (
              <div className="bg-white rounded-lg shadow p-4 md:p-6">
                <h2 className="text-base md:text-lg font-semibold text-gray-600">伙伴管理</h2>
                <p className="text-2xl md:text-3xl font-bold text-blue-600 mt-2">{stats.clients.customers + stats.clients.suppliers}</p>
                <div className="mt-4 space-y-2 text-sm">
                  {hasCustomerClients && (
                    <div className="flex justify-between">
                      <span className="text-gray-500">客户</span>
                      <span className="font-medium">{stats.clients.customers}</span>
                    </div>
                  )}
                  {hasSupplierClients && (
                    <div className="flex justify-between">
                      <span className="text-gray-500">供应商</span>
                      <span className="font-medium">{stats.clients.suppliers}</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {(hasSalesContract || hasPurchaseContract) && (
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-lg font-semibold text-gray-600">合同管理</h2>
                <p className="text-3xl font-bold text-purple-600 mt-2">{stats.contracts.sales + stats.contracts.purchase}</p>
                <div className="mt-4 space-y-2 text-sm">
                  {hasSalesContract && stats.contracts.sales > 0 && (
                    <div className="flex justify-between">
                      <span className="text-gray-500">销售合同</span>
                      <span className="font-medium">{stats.contracts.sales} / ¥{stats.contracts.salesAmount.toLocaleString()}</span>
                    </div>
                  )}
                  {hasPurchaseContract && stats.contracts.purchase > 0 && (
                    <div className="flex justify-between">
                      <span className="text-gray-500">采购合同</span>
                      <span className="font-medium">{stats.contracts.purchase} / ¥{stats.contracts.purchaseAmount.toLocaleString()}</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {(hasIssuedInvoices || hasReceivedInvoices) && (
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-lg font-semibold text-gray-600">发票管理</h2>
                <p className="text-3xl font-bold text-green-600 mt-2">{stats.invoices.issued + stats.invoices.received}</p>
                <div className="mt-4 space-y-2 text-sm">
                  {hasIssuedInvoices && stats.invoices.issued > 0 && (
                    <div className="flex justify-between">
                      <span className="text-gray-500">开具发票</span>
                      <span className="font-medium">{stats.invoices.issued} / ¥{stats.invoices.issuedAmount.toLocaleString()}</span>
                    </div>
                  )}
                  {hasReceivedInvoices && stats.invoices.received > 0 && (
                    <div className="flex justify-between">
                      <span className="text-gray-500">取得发票</span>
                      <span className="font-medium">{stats.invoices.received} / ¥{stats.invoices.receivedAmount.toLocaleString()}</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {(hasReceiptPayments || hasExpensePayments) && (
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-lg font-semibold text-gray-600">收付款</h2>
                <p className="text-3xl font-bold text-orange-600 mt-2">{stats.payments.receipts + stats.payments.expenses}</p>
                <div className="mt-4 space-y-2 text-sm">
                  {hasReceiptPayments && stats.payments.receipts > 0 && (
                    <div className="flex justify-between">
                      <span className="text-gray-500">收款</span>
                      <span className="font-medium text-green-600">{stats.payments.receipts} / ¥{stats.payments.receiptsAmount.toLocaleString()}</span>
                    </div>
                  )}
                  {hasExpensePayments && stats.payments.expenses > 0 && (
                    <div className="flex justify-between">
                      <span className="text-gray-500">付款</span>
                      <span className="font-medium text-red-600">{stats.payments.expenses} / ¥{stats.payments.expensesAmount.toLocaleString()}</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {hasProjects && (
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-lg font-semibold text-gray-600">项目管理</h2>
                <p className="text-3xl font-bold text-cyan-600 mt-2">{stats.projects.total}</p>
                <div className="mt-4 space-y-2 text-sm">
                  {stats.projects.inProgress > 0 && (
                    <div className="flex justify-between">
                      <span className="text-gray-500">进行中</span>
                      <span className="font-medium text-blue-600">{stats.projects.inProgress}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-gray-500">总计</span>
                    <span className="font-medium">{stats.projects.total}</span>
                  </div>
                </div>
              </div>
            )}
        </div>

        {(hasSalesContract || hasPurchaseContract || hasIssuedInvoices || hasReceivedInvoices || hasReceiptPayments || hasExpensePayments || hasCustomerClients || hasSupplierClients || hasProjects) && (
          <div className="bg-white rounded-lg shadow p-4 md:p-6">
            <h2 className="text-lg md:text-xl font-semibold mb-4">快速导航</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
              {hasSalesContract && stats.contracts.sales > 0 && (
                <Link href="/contracts/sales" className="block p-4 border rounded-lg hover:bg-gray-50 transition-colors min-h-[88px] touch-manipulation">
                  <h3 className="font-semibold">销售合同</h3>
                  <p className="text-gray-600 text-sm mt-1">{stats.contracts.sales} 个合同，总额 ¥{stats.contracts.salesAmount.toLocaleString()}</p>
                </Link>
              )}
              {hasPurchaseContract && stats.contracts.purchase > 0 && (
                <Link href="/contracts/purchase" className="block p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                  <h3 className="font-semibold">采购合同</h3>
                  <p className="text-gray-600 text-sm mt-1">{stats.contracts.purchase} 个合同，总额 ¥{stats.contracts.purchaseAmount.toLocaleString()}</p>
                </Link>
              )}

              {hasIssuedInvoices && stats.invoices.issued > 0 && (
                <Link href="/invoices/issued" className="block p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                  <h3 className="font-semibold">开具发票</h3>
                  <p className="text-gray-600 text-sm mt-1">{stats.invoices.issued} 个发票，总额 ¥{stats.invoices.issuedAmount.toLocaleString()}</p>
                </Link>
              )}
              {hasReceivedInvoices && stats.invoices.received > 0 && (
                <Link href="/invoices/received" className="block p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                  <h3 className="font-semibold">取得发票</h3>
                  <p className="text-gray-600 text-sm mt-1">{stats.invoices.received} 个发票，总额 ¥{stats.invoices.receivedAmount.toLocaleString()}</p>
                </Link>
              )}

              {hasReceiptPayments && stats.payments.receipts > 0 && (
                <Link href="/payments/receipts" className="block p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                  <h3 className="font-semibold">收款记录</h3>
                  <p className="text-gray-600 text-sm mt-1">{stats.payments.receipts} 条记录，总额 ¥{stats.payments.receiptsAmount.toLocaleString()}</p>
                </Link>
              )}
              {hasExpensePayments && stats.payments.expenses > 0 && (
                <Link href="/payments/expenses" className="block p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                  <h3 className="font-semibold">付款记录</h3>
                  <p className="text-gray-600 text-sm mt-1">{stats.payments.expenses} 条记录，总额 ¥{stats.payments.expensesAmount.toLocaleString()}</p>
                </Link>
              )}

              {hasCustomerClients && stats.clients.customers > 0 && (
                <Link href="/clients/customers" className="block p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                  <h3 className="font-semibold">客户列表</h3>
                  <p className="text-gray-600 text-sm mt-1">{stats.clients.customers} 个客户</p>
                </Link>
              )}
              {hasSupplierClients && stats.clients.suppliers > 0 && (
                <Link href="/clients/suppliers" className="block p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                  <h3 className="font-semibold">供应商列表</h3>
                  <p className="text-gray-600 text-sm mt-1">{stats.clients.suppliers} 个供应商</p>
                </Link>
              )}

              {hasProjects && stats.projects.total > 0 && (
                <Link href="/projects" className="block p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                  <h3 className="font-semibold">项目管理</h3>
                  <p className="text-gray-600 text-sm mt-1">{stats.projects.total} 个项目，{stats.projects.inProgress} 个进行中</p>
                </Link>
              )}
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
