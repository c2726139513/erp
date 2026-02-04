'use client';

import { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/DashboardLayout';
import { Check, Edit, Trash2 } from 'lucide-react';

interface Client {
  id: string;
  name: string;
}

interface ContractDropdownItem {
  id: string;
  title: string;
  contractNumber: string;
  amount: number;
  _remainingAmount?: number;
  project?: {
    name: string;
  };
}

interface Invoice {
  id: string;
  invoiceNumber: string;
  contractId?: string;
  clientId: string;
  amount: number;
  taxAmount: number;
  status: 'UNISSUED' | 'ISSUED';
  invoiceType: 'RECEIVED' | 'ISSUED';
  invoiceDate: string;
  description?: string;
  notes?: string;
  client?: Client;
  contract?: {
    title: string;
    contractNumber: string;
    project?: {
      name: string;
    };
  };
}

export default function InvoiceListPage({ invoiceType }: { invoiceType: 'RECEIVED' | 'ISSUED' }) {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [availableContracts, setAvailableContracts] = useState<ContractDropdownItem[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editingInvoice, setEditingInvoice] = useState<Invoice | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [showConfirmIssueModal, setShowConfirmIssueModal] = useState(false);
  const [invoiceToIssue, setInvoiceToIssue] = useState<Invoice | null>(null);
  const [formData, setFormData] = useState({
    invoiceNumber: '',
    contractId: '',
    clientId: '',
    amount: '',
    taxAmount: '0',
    taxRate: '13',
    status: 'ISSUED' as 'UNISSUED' | 'ISSUED',
    invoiceType,
    invoiceDate: new Date().toISOString().split('T')[0],
    description: '',
    notes: '',
  });

  // 自动计算税额
  const calculateTaxAmount = (amount: string, rate: string) => {
    const amt = parseFloat(amount) || 0;
    const r = parseFloat(rate) || 0;
    return (amt - amt / (1 + r / 100)).toFixed(2);
  };

  const title = invoiceType === 'ISSUED' ? '开具发票' : '取得发票';

  useEffect(() => {
    fetchInvoices();
    fetchClients();
  }, [invoiceType, searchQuery, startDate, endDate]);

  const fetchInvoices = async () => {
    const searchParam = searchQuery ? `&search=${encodeURIComponent(searchQuery)}` : '';
    const startDateParam = startDate ? `&startDate=${startDate}` : '';
    const endDateParam = endDate ? `&endDate=${endDate}` : '';
    const res = await fetch(`/api/invoices?invoiceType=${invoiceType}${searchParam}${startDateParam}${endDateParam}`);
    const data = await res.json();
    if (data.success) setInvoices(data.data);
  };

  const fetchClients = async () => {
    // 根据发票类型过滤客户/供应商
    // 开具发票(ISSUED) -> 客户(CUSTOMER)
    // 取得发票(RECEIVED) -> 供应商(SUPPLIER)
    const clientType = invoiceType === 'ISSUED' ? 'CUSTOMER' : 'SUPPLIER';
    const res = await fetch(`/api/clients?clientType=${clientType}`);
    const data = await res.json();
    if (data.success) setClients(data.data);
  };

  const fetchAvailableContracts = async (clientId: string) => {
    if (!clientId) {
      setAvailableContracts([]);
      return;
    }
    // 根据发票类型确定合同类型
    // 开具发票(ISSUED) -> 销售合同(SALES)
    // 取得发票(RECEIVED) -> 采购合同(PURCHASE)
    const contractType = invoiceType === 'ISSUED' ? 'SALES' : 'PURCHASE';
    const res = await fetch(`/api/contracts?clientId=${clientId}&contractType=${contractType}&forInvoices=true`);
    const data = await res.json();
    if (data.success) {
      setAvailableContracts(data.data);
    }
  };
  
  const handleClientChange = async (clientId: string) => {
    setFormData({ ...formData, clientId, contractId: '' });
    await fetchAvailableContracts(clientId);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // 验证必填字段
    if (!formData.invoiceNumber || !formData.clientId || !formData.amount) {
      alert('请填写必填字段：发票号、客户、金额');
      return;
    }

    if (!formData.invoiceDate) {
      alert('请选择开票日期');
      return;
    }

    const amount = parseFloat(formData.amount);
    const taxAmount = parseFloat(formData.taxAmount) || 0;

    const url = editingInvoice ? `/api/invoices/${editingInvoice.id}` : '/api/invoices';
    const payload = {
      invoiceNumber: formData.invoiceNumber.trim(),
      contractId: formData.contractId || undefined,
      clientId: formData.clientId.trim(),
      amount,
      taxAmount,
      status: formData.status,
      invoiceType: formData.invoiceType,
      invoiceDate: new Date(formData.invoiceDate).toISOString(),
      description: formData.description,
      notes: formData.notes,
    };
    
    try {
      const res = await fetch(url, {
        method: editingInvoice ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (data.success) {
        setShowModal(false);
        setFormData({
          invoiceNumber: '',
          contractId: '',
          clientId: '',
          amount: '',
          taxAmount: '0',
          taxRate: '13',
          status: 'ISSUED',
          invoiceType,
          invoiceDate: new Date().toISOString().split('T')[0],
          description: '',
          notes: '',
        });
        fetchInvoices();
        alert(editingInvoice ? '发票更新成功' : '发票创建成功');
      } else {
        alert(data.message || '创建失败: ' + (typeof data.error === 'string' ? data.error.split(' ').slice(0, 50) + '...' : JSON.stringify(data.error).slice(0, 100)));
      }
    } catch (error) {
      console.error('创建发票失败:', error);
      alert('网络错误，请检查服务器连接');
    }
  };

  const getStatusText = (status: string) => {
    const map: Record<string, string> = {
      'UNISSUED': '未开具(预录)',
      'ISSUED': '已开具',
    };
    return map[status] || status;
  };

  const getStatusColor = (status: string) => {
    const map: Record<string, string> = {
      'UNISSUED': 'bg-gray-100 text-gray-800',
      'ISSUED': 'bg-green-100 text-green-800',
    };
    return map[status] || 'bg-gray-100 text-gray-800';
  };

  const handleEdit = async (invoice: Invoice) => {
    setEditingInvoice(invoice);
    setFormData({
      invoiceNumber: invoice.invoiceNumber,
      contractId: invoice.contractId || '',
      clientId: invoice.clientId,
      amount: invoice.amount.toString(),
      taxAmount: invoice.taxAmount.toString(),
      taxRate: '13',
      status: invoice.status as any,
      invoiceType: invoice.invoiceType,
      invoiceDate: invoice.invoiceDate.split('T')[0],
      description: invoice.description || '',
      notes: invoice.notes || '',
    });
    await fetchAvailableContracts(invoice.clientId);
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

  const handleConfirmIssue = (invoice: Invoice) => {
    setInvoiceToIssue(invoice);
    setShowConfirmIssueModal(true);
  };

  const handleIssueInvoice = async () => {
    if (!invoiceToIssue) return;
    try {
      const res = await fetch(`/api/invoices/${invoiceToIssue.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...invoiceToIssue, status: 'ISSUED', invoiceDate: new Date().toISOString() }),
      });
      const data = await res.json();
      if (data.success) {
        setShowConfirmIssueModal(false);
        setInvoiceToIssue(null);
        fetchInvoices();
        alert('发票已确认开具');
      } else {
        alert(data.message || '开具失败');
      }
    } catch (error) {
      console.error('Failed to issue invoice:', error);
      alert('开具失败，请重试');
    }
  };

  return (
    <DashboardLayout>
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <div className="flex gap-3 items-center">
            <h1 className="text-3xl font-bold">{title}</h1>
            <input
              type="date"
              placeholder="开始日期"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <input
              type="date"
              placeholder="结束日期"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="flex gap-3">
            <input
              type="text"
              placeholder={`搜索: 发票编号、${invoiceType === 'ISSUED' ? '客户' : '供应商'}、合同、项目`}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-72 px-4 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button onClick={() => { setEditingInvoice(null); setFormData({ invoiceNumber: '', contractId: '', clientId: '', amount: '', taxAmount: '0', taxRate: '13', status: 'ISSUED', invoiceType, invoiceDate: new Date().toISOString().split('T')[0], description: '', notes: '' }); setShowModal(true); }} className="bg-blue-600 text-white px-4 py-2 rounded-lg">
              新建{invoiceType === 'ISSUED' ? '开具' : '取得'}发票
            </button>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">发票编号</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">{invoiceType === 'ISSUED' ? '客户' : '供应商'}</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">合同</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">金额(含税)</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">状态</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">开票日期</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">操作</th>
                  </tr>
                </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {invoices.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-8 text-center text-gray-500">暂无数据</td>
                  </tr>
                ) : (
                  invoices.map((inv) => (
                    <tr key={inv.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 font-medium">{inv.invoiceNumber}</td>
                      <td className="px-6 py-4">{inv.client?.name || '-'}</td>
                      <td className="px-6 py-4">{inv.contract ? `${inv.contract.title}${inv.contract.project ? `(${inv.contract.project.name})` : ''}` : '-'}</td>
                      <td className="px-6 py-4 font-semibold text-blue-600">¥{inv.amount.toLocaleString()}</td>
                      <td className="px-6 py-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(inv.status)}`}>
                          {getStatusText(inv.status)}
                        </span>
                      </td>
                      <td className="px-6 py-4">{inv.invoiceDate.split('T')[0]}</td>
                      <td className="px-6 py-4">
                        {inv.status === 'UNISSUED' && (
                          <button 
                            onClick={() => handleConfirmIssue(inv)} 
                            className="text-green-600 hover:text-green-800 mr-3 p-1 hover:bg-green-50 rounded transition-colors"
                            title="确认开具"
                          >
                            <Check size={18} />
                          </button>
                        )}
                        <button 
                          onClick={() => handleEdit(inv)} 
                          className="text-blue-600 hover:text-blue-800 mr-3 p-1 hover:bg-blue-50 rounded transition-colors"
                          title="编辑"
                        >
                          <Edit size={18} />
                        </button>
                        <button 
                          onClick={() => handleDelete(inv.id)} 
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
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg max-w-xl w-full mx-4 max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b flex justify-between items-center">
                <h2 className="text-xl font-semibold">{editingInvoice ? '编辑' : '新建'}{title}</h2>
                <button onClick={() => setShowModal(false)}>✕</button>
              </div>
              <form onSubmit={handleSubmit} className="p-6 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="client" className="block text-sm mb-1">{invoiceType === 'ISSUED' ? '客户' : '供应商'} *</label>
                      <select required id="client" value={formData.clientId} onChange={(e) => handleClientChange(e.target.value)} className="w-full px-3 py-2 border rounded">
                        <option value="">选择{invoiceType === 'ISSUED' ? '客户' : '供应商'}</option>
                      {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm mb-1">关联合同</label>
                    <select value={formData.contractId} onChange={(e) => setFormData({ ...formData, contractId: e.target.value })} className="w-full px-3 py-2 border rounded">
                      <option value="">无关联</option>
                      {availableContracts.map(c => (
                        <option key={c.id} value={c.id}>
                          {c.title}{c.project ? `(${c.project.name})` : ''} - 未开票金额：¥{c._remainingAmount?.toLocaleString()}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm mb-1">发票编号 *</label>
                    <input type="text" required value={formData.invoiceNumber} onChange={e => setFormData({ ...formData, invoiceNumber: e.target.value })} className="w-full px-3 py-2 border rounded" />
                  </div>
                  <div>
                    <label className="block text-sm mb-1">金额(含税) *</label>
                    <input type="number" required value={formData.amount} onChange={e => {
                      const amount = e.target.value;
                      const taxAmount = calculateTaxAmount(amount, formData.taxRate);
                      setFormData({ ...formData, amount, taxAmount });
                    }} className="w-full px-3 py-2 border rounded" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                   <div>
                      <label className="block text-sm mb-1">税率(%)</label>
                      <input type="number" value={formData.taxRate} onChange={e => {
                        const taxRate = e.target.value;
                        const taxAmount = calculateTaxAmount(formData.amount, taxRate);
                        setFormData({ ...formData, taxRate, taxAmount });
                      }} className="w-full px-3 py-2 border rounded" />
                    </div>
                    <div>
                      <label className="block text-sm mb-1">税额</label>
                      <input type="number" readOnly value={formData.taxAmount} className="w-full px-3 py-2 border rounded bg-gray-50" />
                    </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm mb-1">状态</label>
                    <select value={formData.status} onChange={e => setFormData({ ...formData, status: e.target.value as any })} className="w-full px-3 py-2 border rounded">
                      <option value="ISSUED">已开具</option>
                      <option value="UNISSUED">未开具(预录)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm mb-1">开票日期 *</label>
                    <input type="date" required value={formData.invoiceDate} onChange={e => setFormData({ ...formData, invoiceDate: e.target.value })} className="w-full px-3 py-2 border rounded" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm mb-1">描述</label>
                  <textarea value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} className="w-full px-3 py-2 border rounded" rows={2} />
                </div>
                <div className="flex justify-end gap-3 pt-4">
                  <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 border rounded">取消</button>
                  <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded">{editingInvoice ? '更新' : '创建'}</button>
                </div>
              </form>
            </div>
          </div>
        )}

        {showConfirmIssueModal && invoiceToIssue && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg max-w-md w-full mx-4">
              <div className="p-6">
                <h2 className="text-xl font-semibold mb-4">确认开具发票</h2>
                <p className="text-gray-600 mb-4">
                  确定要将发票 <strong>{invoiceToIssue.invoiceNumber}</strong> 的状态从"未开具(预录)"改为"已开具"吗？
                </p>
                <div className="flex justify-end gap-3">
                  <button onClick={() => { setShowConfirmIssueModal(false); setInvoiceToIssue(null); }} className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">取消</button>
                  <button onClick={handleIssueInvoice} className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">确认开具</button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
