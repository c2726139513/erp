'use client';
import { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/DashboardLayout';
import { Check, Edit, Trash2 } from 'lucide-react';

interface Client { id: string; name: string; }
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
  amount: number;
  status: string;
}

interface Payment {
  id: string;
  paymentNumber: string;
  invoiceId?: string;
  contractId?: string;
  clientId: string;
  amount: number;
  paymentType: 'RECEIPT' | 'EXPENSE';
  paymentMethod: string;
  paymentDate: string;
  status: 'UNPAID' | 'PAID';
  bankAccount?: string;
  referenceNumber?: string;
  notes?: string;
  client?: Client;
  contract?: {
    title: string;
    project?: {
      name: string;
    };
  };
  invoice?: Invoice;
}

export default function PaymentListPage({ paymentType }: { paymentType: 'RECEIPT' | 'EXPENSE' }) {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [availableContracts, setAvailableContracts] = useState<ContractDropdownItem[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editingPayment, setEditingPayment] = useState<Payment | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [showConfirmPayModal, setShowConfirmPayModal] = useState(false);
  const [paymentToPay, setPaymentToPay] = useState<Payment | null>(null);
  const [formData, setFormData] = useState({
    paymentNumber: '', invoiceId: '', contractId: '', clientId: '', amount: '', paymentType, paymentMethod: 'BANK_TRANSFER' as const, paymentDate: new Date().toISOString().split('T')[0], status: 'PAID' as 'UNPAID' | 'PAID', bankAccount: '', referenceNumber: '', notes: '',
  });

  const title = paymentType === 'RECEIPT' ? '收款' : '付款';

  useEffect(() => {
    fetchPayments();
    fetchClients();
  }, [paymentType, searchQuery, startDate, endDate]);

  const fetchPayments = async () => {
    const searchParam = searchQuery ? `&search=${encodeURIComponent(searchQuery)}` : '';
    const startDateParam = startDate ? `&startDate=${startDate}` : '';
    const endDateParam = endDate ? `&endDate=${endDate}` : '';
    const res = await fetch(`/api/payments?paymentType=${paymentType}${searchParam}${startDateParam}${endDateParam}`);
    const data = await res.json();
    if (data.success) setPayments(data.data);
  };

  const fetchClients = async () => {
    // 根据收付款类型过滤客户/供应商
    // 收款(RECEIPT) -> 客户(CUSTOMER)
    // 付款(EXPENSE) -> 供应商(SUPPLIER)
    const clientType = paymentType === 'RECEIPT' ? 'CUSTOMER' : 'SUPPLIER';
    const res = await fetch(`/api/clients?clientType=${clientType}`);
    const data = await res.json();
    if (data.success) setClients(data.data);
  };

  const fetchAvailableContracts = async (clientId: string) => {
    if (!clientId) {
      setAvailableContracts([]);
      return;
    }
    // 根据收付款类型确定合同类型
    // 收款(RECEIPT) -> 销售合同(SALES)
    // 付款(EXPENSE) -> 采购合同(PURCHASE)
    const contractType = paymentType === 'RECEIPT' ? 'SALES' : 'PURCHASE';
    const res = await fetch(`/api/contracts?clientId=${clientId}&contractType=${contractType}&forPayments=true`);
    const data = await res.json();
    if (data.success) {
      setAvailableContracts(data.data);
    }
  };

  const fetchInvoices = async (clientId: string) => {
    if (!clientId) {
      setInvoices([]);
      return;
    }
    // 根据收付款类型确定发票类型
    // 收款(RECEIPT) -> 开具发票(ISSUED)
    // 付款(EXPENSE) -> 取得发票(RECEIVED)
    const invoiceType = paymentType === 'RECEIPT' ? 'ISSUED' : 'RECEIVED';
    const res = await fetch(`/api/invoices?clientId=${clientId}&invoiceType=${invoiceType}`);
    const data = await res.json();
    if (data.success) setInvoices(data.data);
  };

  const handleClientChange = async (clientId: string) => {
    setFormData({ ...formData, clientId, contractId: '', invoiceId: '' });
    await fetchAvailableContracts(clientId);
    await fetchInvoices(clientId);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const url = editingPayment ? `/api/payments/${editingPayment.id}` : '/api/payments';
    const payload = {
      paymentNumber: formData.paymentNumber,
      invoiceId: formData.invoiceId || undefined,
      contractId: formData.contractId || undefined,
      clientId: formData.clientId,
      amount: parseFloat(formData.amount),
      paymentType: formData.paymentType,
      paymentMethod: formData.paymentMethod,
      paymentDate: new Date(formData.paymentDate).toISOString(),
      status: formData.status,
      bankAccount: formData.bankAccount,
      referenceNumber: formData.referenceNumber,
      notes: formData.notes,
    };
    const res = await fetch(url, {
      method: editingPayment ? 'PUT' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (data.success) {
      setShowModal(false);
      setFormData({
        paymentNumber: '',
        invoiceId: '',
        contractId: '',
        clientId: '',
        amount: '',
        paymentType,
        paymentMethod: 'BANK_TRANSFER',
        paymentDate: new Date().toISOString().split('T')[0],
        status: 'PAID',
        bankAccount: '',
        referenceNumber: '',
        notes: '',
      });
      fetchPayments();
    } else {
      alert(data.message || '失败');
    }
  };

  const handleConfirmPay = (payment: Payment) => {
    setPaymentToPay(payment);
    setShowConfirmPayModal(true);
  };

  const handlePayPayment = async () => {
    if (!paymentToPay) return;
    try {
      const res = await fetch(`/api/payments/${paymentToPay.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...paymentToPay, status: 'PAID', paymentDate: new Date().toISOString() }),
      });
      const data = await res.json();
      if (data.success) {
        setShowConfirmPayModal(false);
        setPaymentToPay(null);
        fetchPayments();
        alert('收付款已确认支付');
      } else {
        alert(data.message || '支付失败');
      }
    } catch (error) {
      console.error('Failed to pay payment:', error);
      alert('支付失败，请重试');
    }
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
              placeholder={`搜索: 单号、${paymentType === 'RECEIPT' ? '客户' : '供应商'}、合同、项目`}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-72 px-4 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
             <button onClick={async () => {
               setEditingPayment(null);
               let nextPaymentNumber = '';
               try {
                 const res = await fetch('/api/payments/next-number');
                 const data = await res.json();
                 if (data.success) {
                   nextPaymentNumber = data.data.nextNumber;
                 }
               } catch (error) {
                 console.error('Failed to fetch next payment number:', error);
               }
               setFormData({
                 paymentNumber: nextPaymentNumber,
                 invoiceId: '',
                 contractId: '',
                 clientId: '',
                 amount: '',
                 paymentType,
                 paymentMethod: 'BANK_TRANSFER',
                 paymentDate: new Date().toISOString().split('T')[0],
                 status: 'PAID',
                 bankAccount: '',
                 referenceNumber: '',
                 notes: ''
               });
               setShowModal(true);
             }} className="bg-blue-600 text-white px-4 py-2 rounded-lg">
              新建{title}
            </button>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr><th className="px-6 py-3 text-left">单号</th><th className="px-6 py-3 text-left">{paymentType === 'RECEIPT' ? '客户' : '供应商'}</th><th className="px-6 py-3 text-left">合同</th><th className="px-6 py-3 text-left">发票</th><th className="px-6 py-3 text-left">金额</th><th className="px-6 py-3 text-left">状态</th><th className="px-6 py-3 text-left">日期</th><th className="px-6 py-3 text-left">操作</th></tr>
            </thead>
            <tbody>
              {payments.map((pay) => (
                <tr key={pay.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">{pay.paymentNumber}</td>
                  <td className="px-6 py-4">{pay.client?.name}</td>
                  <td className="px-6 py-4">{pay.contract ? `${pay.contract.title}${pay.contract.project ? `(${pay.contract.project.name})` : ''}` : '-'}</td>
                  <td className="px-6 py-4">{pay.invoice?.invoiceNumber || '-'}</td>
                  <td className="px-6 py-4">¥{pay.amount.toLocaleString()}</td>
                  <td className="px-6 py-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(pay.status)}`}>
                      {getStatusText(pay.status)}
                    </span>
                  </td>
                  <td className="px-6 py-4">{pay.paymentDate.split('T')[0]}</td>
                  <td className="px-6 py-4">
                    {pay.status === 'UNPAID' && (
                      <button 
                        onClick={() => handleConfirmPay(pay)} 
                        className="text-green-600 hover:text-green-800 mr-3 p-1 hover:bg-green-50 rounded transition-colors"
                        title="确认支付"
                      >
                        <Check size={18} />
                      </button>
                    )}
                    <button
                      onClick={() => { setEditingPayment(pay); setFormData({ paymentNumber: pay.paymentNumber, invoiceId: pay.invoiceId || '', contractId: pay.contractId || '', clientId: pay.clientId, amount: pay.amount.toString(), paymentType: pay.paymentType, paymentMethod: pay.paymentMethod as any, paymentDate: pay.paymentDate.split('T')[0], status: pay.status, bankAccount: pay.bankAccount || '', referenceNumber: pay.referenceNumber || '', notes: pay.notes || '' }); setShowModal(true); fetchAvailableContracts(pay.clientId); fetchInvoices(pay.clientId); }}
                      className="text-blue-600 hover:text-blue-800 mr-3 p-1 hover:bg-blue-50 rounded transition-colors"
                      title="编辑"
                    >
                      <Edit size={18} />
                    </button>
                    <button 
                      onClick={async () => { if (confirm('确定删除?')) { await fetch(`/api/payments/${pay.id}`, { method: 'DELETE' }); fetchPayments(); } }} 
                      className="text-red-600 hover:text-red-800 p-1 hover:bg-red-50 rounded transition-colors"
                      title="删除"
                    >
                      <Trash2 size={18} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {showModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b flex justify-between items-center">
                <h2 className="text-xl font-semibold">{editingPayment ? '编辑' : '新建'}{title}</h2>
                <button onClick={() => setShowModal(false)}>✕</button>
              </div>
              <form onSubmit={handleSubmit} className="p-6 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label htmlFor="client" className="block text-sm font-medium text-gray-700 mb-1">
                      {paymentType === 'RECEIPT' ? '客户' : '供应商'} <span className="text-red-500">*</span>
                    </label>
                    <select
                      required
                      id="client"
                      value={formData.clientId}
                      onChange={e => handleClientChange(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">选择{paymentType === 'RECEIPT' ? '客户' : '供应商'}</option>
                      {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      关联合同
                    </label>
                    <select
                      value={formData.contractId}
                      onChange={e => setFormData({ ...formData, contractId: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">无</option>
                      {availableContracts.map(c => <option key={c.id} value={c.id}>{c.title}{c.project ? `(${c.project.name})` : ''} - 未结算金额：¥{c._remainingAmount?.toLocaleString()}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      关联发票
                    </label>
                    <select
                      value={formData.invoiceId}
                      onChange={e => setFormData({ ...formData, invoiceId: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">无</option>
                      {invoices.map(i => <option key={i.id} value={i.id}>{i.invoiceNumber} - ¥{i.amount.toLocaleString()}</option>)}
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      单号 <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.paymentNumber}
                      onChange={e => setFormData({ ...formData, paymentNumber: e.target.value })}
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
                      onChange={e => setFormData({ ...formData, amount: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      支付方式 <span className="text-red-500">*</span>
                    </label>
                    <select
                      required
                      value={formData.paymentMethod}
                      onChange={e => setFormData({ ...formData, paymentMethod: e.target.value as any })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="CASH">现金</option>
                      <option value="BANK_TRANSFER">银行</option>
                      <option value="CHECK">支票</option>
                      <option value="ALIPAY">支付宝</option>
                      <option value="WECHAT_PAY">微信</option>
                      <option value="OTHER">其他</option>
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
                      onChange={e => setFormData({ ...formData, status: e.target.value as any })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="PAID">已支付</option>
                      <option value="UNPAID">未支付(预录)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      日期 <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="date"
                      required
                      value={formData.paymentDate}
                      onChange={e => setFormData({ ...formData, paymentDate: e.target.value })}
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
                      onChange={e => setFormData({ ...formData, bankAccount: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    备注
                  </label>
                  <textarea
                    value={formData.notes}
                    onChange={e => setFormData({ ...formData, notes: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    rows={2}
                  />
                </div>
                <div className="flex justify-end gap-3 pt-4">
                  <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 border rounded hover:bg-gray-50">取消</button>
                  <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">{editingPayment ? '更新' : '创建'}</button>
                </div>
              </form>
            </div>
          </div>
        )}

        {showConfirmPayModal && paymentToPay && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg max-w-md w-full mx-4">
              <div className="p-6">
                <h2 className="text-xl font-semibold mb-4">确认支付</h2>
                <p className="text-gray-600 mb-4">
                  确定要将收付款 <strong>{paymentToPay.paymentNumber}</strong> 的状态从"未支付(预录)"改为"已支付"吗？
                </p>
                <div className="flex justify-end gap-3">
                  <button onClick={() => { setShowConfirmPayModal(false); setPaymentToPay(null); }} className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">取消</button>
                  <button onClick={handlePayPayment} className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">确认支付</button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
