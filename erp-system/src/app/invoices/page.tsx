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
  contractId?: string;
  clientId: string;
  amount: number;
  taxAmount: number;
  totalAmount: number;
  status: 'UNISSUED' | 'ISSUED';
  invoiceType: 'RECEIVED' | 'ISSUED';
  invoiceDate: string;
  dueDate?: string;
  description?: string;
  notes?: string;
  client?: Client;
  contract?: Contract;
}

interface InvoiceFormData {
  invoiceNumber: string;
  contractId: string;
  clientId: string;
  amount: string;
  taxAmount: string;
  totalAmount: string;
  status: 'UNISSUED' | 'ISSUED';
  invoiceType: 'RECEIVED' | 'ISSUED';
  invoiceDate: string;
  dueDate: string;
  description: string;
  notes: string;
}

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editingInvoice, setEditingInvoice] = useState<Invoice | null>(null);
  const [formData, setFormData] = useState<InvoiceFormData>({
    invoiceNumber: '',
    contractId: '',
    clientId: '',
    amount: '',
    taxAmount: '0',
    totalAmount: '',
    status: 'ISSUED',
    invoiceType: 'RECEIVED',
    invoiceDate: new Date().toISOString().split('T')[0],
    dueDate: '',
    description: '',
    notes: '',
  });

  useEffect(() => {
    fetchInvoices();
    fetchClients();
    fetchContracts();
  }, []);

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

  const calculateTotalAmount = () => {
    const amount = parseFloat(formData.amount) || 0;
    const taxAmount = parseFloat(formData.taxAmount) || 0;
    return (amount + taxAmount).toString();
  };

  useEffect(() => {
    setFormData((prev) => ({
      ...prev,
      totalAmount: calculateTotalAmount(),
    }));
  }, [formData.amount, formData.taxAmount]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const url = editingInvoice ? `/api/invoices/${editingInvoice.id}` : '/api/invoices';
      const payload = {
        ...formData,
        contractId: formData.contractId || undefined,
        clientId: formData.clientId || undefined,
        amount: parseFloat(formData.amount) || 0,
        taxAmount: parseFloat(formData.taxAmount) || 0,
        totalAmount: parseFloat(formData.totalAmount) || 0,
        status: formData.status,
        invoiceDate: new Date(formData.invoiceDate).toISOString(),
        dueDate: formData.dueDate ? new Date(formData.dueDate).toISOString() : null,
      };
      const res = await fetch(url, {
        method: editingInvoice ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (data.success) {
        setShowModal(false);
        setEditingInvoice(null);
        setFormData({
          invoiceNumber: '',
          contractId: '',
          clientId: '',
          amount: '',
          taxAmount: '0',
          totalAmount: '',
          status: 'ISSUED' as const,
          invoiceType: 'RECEIVED' as const,
          invoiceDate: new Date().toISOString().split('T')[0],
          dueDate: '',
          description: '',
          notes: '',
        });
        fetchInvoices();
      } else {
        alert(data.message || '操作失败');
      }
    } catch (error) {
      console.error('Failed to save invoice:', error);
      alert('操作失败，请重试');
    }
  };

  const handleEdit = (invoice: Invoice) => {
    setEditingInvoice(invoice);
    setFormData({
      invoiceNumber: invoice.invoiceNumber,
      contractId: invoice.contractId || '',
      clientId: invoice.clientId,
      amount: invoice.amount.toString(),
      taxAmount: invoice.taxAmount.toString(),
      totalAmount: invoice.totalAmount.toString(),
      status: invoice.status,
      invoiceType: invoice.invoiceType,
      invoiceDate: invoice.invoiceDate.split('T')[0],
      dueDate: invoice.dueDate ? invoice.dueDate.split('T')[0] : '',
      description: invoice.description || '',
      notes: invoice.notes || '',
    });
    setShowModal(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('确定要删除这个发票吗？')) return;
    try {
      const res = await fetch(`/api/invoices/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        fetchInvoices();
      } else {
        alert(data.message || '删除失败');
      }
    } catch (error) {
      console.error('Failed to delete invoice:', error);
      alert('删除失败，请重试');
    }
  };

  const openNewModal = () => {
    setEditingInvoice(null);
    setFormData({
      invoiceNumber: '',
      contractId: '',
      clientId: '',
      amount: '',
      taxAmount: '0',
      totalAmount: '',
      status: 'ISSUED' as const,
      invoiceType: 'RECEIVED' as const,
      invoiceDate: new Date().toISOString().split('T')[0],
      dueDate: '',
      description: '',
      notes: '',
    });
    setShowModal(true);
  };

  const getStatusText = (status: string) => {
    const statusMap: Record<string, string> = {
      'UNISSUED': '未开具(预录)',
      'ISSUED': '已开具',
    };
    return statusMap[status] || status;
  };

  const getStatusColor = (status: string) => {
    const colorMap: Record<string, string> = {
      'UNISSUED': 'bg-gray-100 text-gray-800',
      'ISSUED': 'bg-green-100 text-green-800',
    };
    return colorMap[status] || 'bg-gray-100 text-gray-800';
  };

  const getInvoiceTypeText = (type: string) => {
    const typeMap: Record<string, string> = {
      'RECEIVED': '取得发票',
      'ISSUED': '开具发票',
    };
    return typeMap[type] || type;
  };

  const getInvoiceTypeColor = (type: string) => {
    return type === 'RECEIVED' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800';
  };

  return (
    <DashboardLayout>
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">发票管理</h1>
        <button
          onClick={openNewModal}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          新建发票
        </button>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">发票编号</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">类型</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">客户</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">合同</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">金额</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">税额</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">总金额</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">状态</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">开票日期</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">操作</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {invoices.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-8 text-center text-gray-500">
                    暂无发票数据
                  </td>
                </tr>
              ) : (
                invoices.map((invoice) => (
                  <tr key={invoice.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">{invoice.invoiceNumber}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${getInvoiceTypeColor(invoice.invoiceType)}`}>
                        {getInvoiceTypeText(invoice.invoiceType)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">{invoice.client?.name || '-'}</td>
                    <td className="px-6 py-4 whitespace-nowrap">{invoice.contract?.title || '-'}</td>
                    <td className="px-6 py-4 whitespace-nowrap">¥{invoice.amount.toLocaleString()}</td>
                    <td className="px-6 py-4 whitespace-nowrap">¥{invoice.taxAmount.toLocaleString()}</td>
                    <td className="px-6 py-4 whitespace-nowrap">¥{invoice.totalAmount.toLocaleString()}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(invoice.status)}`}>
                        {getStatusText(invoice.status)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">{invoice.invoiceDate.split('T')[0]}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <button
                        onClick={() => handleEdit(invoice)}
                        className="text-blue-600 hover:text-blue-800 mr-3 p-1 hover:bg-blue-50 rounded transition-colors"
                        title="编辑"
                      >
                        <Edit size={18} />
                      </button>
                      <button
                        onClick={() => handleDelete(invoice.id)}
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
                {editingInvoice ? '编辑发票' : '新建发票'}
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
                    发票编号 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.invoiceNumber}
                    onChange={(e) => setFormData({ ...formData, invoiceNumber: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    发票类型 <span className="text-red-500">*</span>
                  </label>
                  <select
                    required
                    value={formData.invoiceType}
                    onChange={(e) => setFormData({ ...formData, invoiceType: e.target.value as any })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="RECEIVED">取得发票</option>
                    <option value="ISSUED">开具发票</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    税额
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.taxAmount}
                    onChange={(e) => setFormData({ ...formData, taxAmount: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    总金额
                  </label>
                  <input
                    type="number"
                    required
                    step="0.01"
                    min="0"
                    value={formData.totalAmount}
                    onChange={(e) => setFormData({ ...formData, totalAmount: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50"
                    readOnly
                  />
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
                    <option value="ISSUED">已开具</option>
                    <option value="UNISSUED">未开具(预录)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    开票日期 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.invoiceDate}
                    onChange={(e) => setFormData({ ...formData, invoiceDate: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    到期日期
                  </label>
                  <input
                    type="date"
                    value={formData.dueDate}
                    onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  描述
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={2}
                />
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
                  {editingInvoice ? '更新' : '创建'}
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
