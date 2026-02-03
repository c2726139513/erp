'use client';

import { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/DashboardLayout';
import { Check, Edit, Trash2 } from 'lucide-react';

interface Client {
  id: string;
  name: string;
}

interface Contract {
  id: string;
  contractNumber: string;
  title: string;
}

interface Invoice {
  id: string;
  invoiceNumber: string;
}

interface Payment {
  id: string;
  paymentNumber: string;
  invoiceId?: string;
  contractId?: string;
  clientId: string;
  amount: number;
  paymentType: 'RECEIPT' | 'EXPENSE';
  paymentMethod: 'CASH' | 'BANK_TRANSFER' | 'CHECK' | 'ALIPAY' | 'WECHAT_PAY' | 'OTHER';
  paymentDate: string;
  status: 'UNPAID' | 'PAID';
  bankAccount?: string;
  referenceNumber?: string;
  notes?: string;
  client?: Client;
  contract?: Contract;
  invoice?: Invoice;
}

interface PaymentFormData {
  paymentNumber: string;
  invoiceId: string;
  contractId: string;
  clientId: string;
  amount: string;
  paymentType: 'RECEIPT' | 'EXPENSE';
  paymentMethod: 'CASH' | 'BANK_TRANSFER' | 'CHECK' | 'ALIPAY' | 'WECHAT_PAY' | 'OTHER';
  paymentDate: string;
  status: 'UNPAID' | 'PAID';
  bankAccount: string;
  referenceNumber: string;
  notes: string;
}

export default function PaymentsPage() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editingPayment, setEditingPayment] = useState<Payment | null>(null);
  const [filterType, setFilterType] = useState<string>('');
  const [formData, setFormData] = useState<PaymentFormData>({
    paymentNumber: '',
    invoiceId: '',
    contractId: '',
    clientId: '',
    amount: '',
    paymentType: 'RECEIPT',
    paymentMethod: 'BANK_TRANSFER',
    paymentDate: new Date().toISOString().split('T')[0],
    status: 'PAID',
    bankAccount: '',
    referenceNumber: '',
    notes: '',
  });

  useEffect(() => {
    fetchPayments();
    fetchClients();
    fetchContracts();
    fetchInvoices();
  }, []);

  const fetchPayments = async (type?: string) => {
    try {
      let url = '/api/payments';
      if (type) {
        url += `?paymentType=${type}`;
      }
      const res = await fetch(url);
      const data = await res.json();
      if (data.success) {
        setPayments(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch payments:', error);
    }
  };

  const fetchClients = async () => {
    try {
      const res = await fetch('/api/clients');
      const data = await res.json();
      if (data.success) {
        setClients(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch clients:', error);
    }
  };

  const fetchContracts = async () => {
    try {
      const res = await fetch('/api/contracts');
      const data = await res.json();
      if (data.success) {
        setContracts(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch contracts:', error);
    }
  };

  const fetchInvoices = async () => {
    try {
      const res = await fetch('/api/invoices');
      const data = await res.json();
      if (data.success) {
        setInvoices(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch invoices:', error);
    }
  };

  useEffect(() => {
    fetchPayments(filterType);
  }, [filterType]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const url = editingPayment ? `/api/payments/${editingPayment.id}` : '/api/payments';
      const payload = {
        ...formData,
        invoiceId: formData.invoiceId || undefined,
        contractId: formData.contractId || undefined,
        clientId: formData.clientId || undefined,
        amount: parseFloat(formData.amount) || 0,
        paymentType: formData.paymentType,
        paymentMethod: formData.paymentMethod,
        paymentDate: new Date(formData.paymentDate).toISOString(),
        status: formData.status,
      };
      const res = await fetch(url, {
        method: editingPayment ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (data.success) {
        setShowModal(false);
        setEditingPayment(null);
        setFormData({
          paymentNumber: '',
          invoiceId: '',
          contractId: '',
          clientId: '',
          amount: '',
          paymentType: 'RECEIPT' as const,
          paymentMethod: 'BANK_TRANSFER' as const,
          paymentDate: new Date().toISOString().split('T')[0],
          status: 'PAID',
          bankAccount: '',
          referenceNumber: '',
          notes: '',
        });
        fetchPayments(filterType);
      } else {
        alert(data.message || '操作失败');
      }
    } catch (error) {
      console.error('Failed to save payment:', error);
      alert('操作失败，请重试');
    }
  };

  const handleEdit = (payment: Payment) => {
    setEditingPayment(payment);
    setFormData({
      paymentNumber: payment.paymentNumber,
      invoiceId: payment.invoiceId || '',
      contractId: payment.contractId || '',
      clientId: payment.clientId,
      amount: payment.amount.toString(),
      paymentType: payment.paymentType,
      paymentMethod: payment.paymentMethod,
      paymentDate: payment.paymentDate.split('T')[0],
      status: payment.status,
      bankAccount: payment.bankAccount || '',
      referenceNumber: payment.referenceNumber || '',
      notes: payment.notes || '',
    });
    setShowModal(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('确定要删除这个收付款记录吗？')) return;
    try {
      const res = await fetch(`/api/payments/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        fetchPayments(filterType);
      } else {
        alert(data.message || '删除失败');
      }
    } catch (error) {
      console.error('Failed to delete payment:', error);
      alert('删除失败，请重试');
    }
  };

  const openNewModal = () => {
    setEditingPayment(null);
    setFormData({
      paymentNumber: '',
      invoiceId: '',
      contractId: '',
      clientId: '',
      amount: '',
      paymentType: filterType === 'EXPENSE' ? 'EXPENSE' : 'RECEIPT' as const,
      paymentMethod: 'BANK_TRANSFER' as const,
      paymentDate: new Date().toISOString().split('T')[0],
      status: 'PAID',
      bankAccount: '',
      referenceNumber: '',
      notes: '',
    });
    setShowModal(true);
  };

  const getPaymentTypeText = (type: string) => {
    const typeMap: Record<string, string> = {
      'RECEIPT': '收款',
      'EXPENSE': '付款',
    };
    return typeMap[type] || type;
  };

  const getPaymentMethodText = (method: string) => {
    const methodMap: Record<string, string> = {
      'CASH': '现金',
      'BANK_TRANSFER': '银行转账',
      'CHECK': '支票',
      'ALIPAY': '支付宝',
      'WECHAT_PAY': '微信支付',
      'OTHER': '其他',
    };
    return methodMap[method] || method;
  };

  const getTypeColor = (type: string) => {
    return type === 'RECEIPT' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800';
  };

  const getStatusText = (status: string) => {
    const statusMap: Record<string, string> = {
      'UNPAID': '未支付(预录)',
      'PAID': '已支付',
    };
    return statusMap[status] || status;
  };

  const getStatusColor = (status: string) => {
    const colorMap: Record<string, string> = {
      'UNPAID': 'bg-gray-100 text-gray-800',
      'PAID': 'bg-green-100 text-green-800',
    };
    return colorMap[status] || 'bg-gray-100 text-gray-800';
  };

  const filteredPayments = payments.filter((p) => {
    if (!filterType) return true;
    return p.paymentType === filterType;
  });

  const totalAmount = filteredPayments.reduce((sum, p) => {
    return p.paymentType === 'RECEIPT' ? sum + p.amount : sum - p.amount;
  }, 0);

  return (
    <DashboardLayout>
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">收付款管理</h1>
        <button
          onClick={openNewModal}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          新建{filterType === 'EXPENSE' ? '付款' : '收款'}
        </button>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-green-50 rounded-lg p-4">
          <h3 className="text-lg font-semibold text-green-700">收款总额</h3>
          <p className="text-3xl font-bold text-green-600 mt-2">
            ¥{payments.filter((p) => p.paymentType === 'RECEIPT').reduce((sum, p) => sum + p.amount, 0).toLocaleString()}
          </p>
        </div>
        <div className="bg-red-50 rounded-lg p-4">
          <h3 className="text-lg font-semibold text-red-700">付款总额</h3>
          <p className="text-3xl font-bold text-red-600 mt-2">
            ¥{payments.filter((p) => p.paymentType === 'EXPENSE').reduce((sum, p) => sum + p.amount, 0).toLocaleString()}
          </p>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="p-4 border-b flex flex-wrap gap-4">
          <input
            type="text"
            placeholder="搜索单号..."
            className="flex-1 min-w-[200px] px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">全部类型</option>
            <option value="RECEIPT">收款</option>
            <option value="EXPENSE">付款</option>
          </select>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">单号</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">客户</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">合同</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">发票</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">类型</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">金额</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">状态</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">支付方式</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">日期</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">操作</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredPayments.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-6 py-8 text-center text-gray-500">
                    暂无收付款数据
                  </td>
                </tr>
              ) : (
                 filteredPayments.map((payment) => (
                   <tr key={payment.id} className="hover:bg-gray-50">
                     <td className="px-6 py-4 whitespace-nowrap">{payment.paymentNumber}</td>
                     <td className="px-6 py-4 whitespace-nowrap">{payment.client?.name || '-'}</td>
                     <td className="px-6 py-4 whitespace-nowrap">{payment.contract?.title || '-'}</td>
                     <td className="px-6 py-4 whitespace-nowrap">{payment.invoice?.invoiceNumber || '-'}</td>
                     <td className="px-6 py-4 whitespace-nowrap">
                       <span className={`px-3 py-1 rounded-full text-xs font-medium ${getTypeColor(payment.paymentType)}`}>
                         {getPaymentTypeText(payment.paymentType)}
                       </span>
                     </td>
                     <td className="px-6 py-4 whitespace-nowrap">¥{payment.amount.toLocaleString()}</td>
                     <td className="px-6 py-4 whitespace-nowrap">
                       <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(payment.status)}`}>
                         {getStatusText(payment.status)}
                       </span>
                     </td>
                     <td className="px-6 py-4 whitespace-nowrap">{getPaymentMethodText(payment.paymentMethod)}</td>
                     <td className="px-6 py-4 whitespace-nowrap">{payment.paymentDate.split('T')[0]}</td>
                     <td className="px-6 py-4 whitespace-nowrap">
                        <button
                          onClick={() => handleEdit(payment)}
                          className="text-blue-600 hover:text-blue-800 mr-3 p-1 hover:bg-blue-50 rounded transition-colors"
                          title="编辑"
                        >
                          <Edit size={18} />
                        </button>
                        <button
                          onClick={() => handleDelete(payment.id)}
                          className="text-red-600 hover:text-red-800 p-1 hover:bg-red-50 rounded transition-colors"
                          title="删除"
                        >
                          <Trash2 size={18} />
                        </button>
                      </td>
                   </tr>
                 ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center p-6 border-b">
              <h2 className="text-xl font-semibold">
                {editingPayment ? '编辑' + getPaymentTypeText(formData.paymentType) : '新建' + getPaymentTypeText(formData.paymentType)}
              </h2>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    单号 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.paymentNumber}
                    onChange={(e) => setFormData({ ...formData, paymentNumber: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    金额 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    required
                    step="0.01"
                    min="0"
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      收付款类型 <span className="text-red-500">*</span>
                    </label>
                    <select
                      required
                      value={formData.paymentType}
                      onChange={(e) => setFormData({ ...formData, paymentType: e.target.value as any })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="RECEIPT">收款</option>
                      <option value="EXPENSE">付款</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      支付方式 <span className="text-red-500">*</span>
                    </label>
                    <select
                      required
                      value={formData.paymentMethod}
                      onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value as any })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="CASH">现金</option>
                      <option value="BANK_TRANSFER">银行转账</option>
                      <option value="CHECK">支票</option>
                      <option value="ALIPAY">支付宝</option>
                      <option value="WECHAT_PAY">微信支付</option>
                      <option value="OTHER">其他</option>
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      客户 <span className="text-red-500">*</span>
                    </label>
                    <select
                      required
                      value={formData.clientId}
                      onChange={(e) => setFormData({ ...formData, clientId: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">选择客户</option>
                      {clients.map((client) => (
                        <option key={client.id} value={client.id}>
                          {client.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      关联合同
                    </label>
                    <select
                      value={formData.contractId}
                      onChange={(e) => setFormData({ ...formData, contractId: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">无关联</option>
                      {contracts.map((contract) => (
                        <option key={contract.id} value={contract.id}>
                          {contract.contractNumber} - {contract.title}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      关联发票
                    </label>
                    <select
                      value={formData.invoiceId}
                      onChange={(e) => setFormData({ ...formData, invoiceId: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">无关联</option>
                      {invoices.map((invoice) => (
                        <option key={invoice.id} value={invoice.id}>
                          {invoice.invoiceNumber}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      状态
                    </label>
                    <select
                      value={formData.status}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="PAID">已支付</option>
                      <option value="UNPAID">未支付(预录)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      收付款日期 <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="date"
                      required
                      value={formData.paymentDate}
                      onChange={(e) => setFormData({ ...formData, paymentDate: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      银行账号
                    </label>
                    <input
                      type="text"
                      value={formData.bankAccount}
                      onChange={(e) => setFormData({ ...formData, bankAccount: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    参考号
                  </label>
                  <input
                    type="text"
                    value={formData.referenceNumber}
                    onChange={(e) => setFormData({ ...formData, referenceNumber: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div></div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  备注
                </label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={2}
                />
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 border rounded hover:bg-gray-50"
                >
                  取消
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  {editingPayment ? '更新' : '创建'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      </div>
    </DashboardLayout>
  );
}
