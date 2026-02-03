'use client';
import { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/DashboardLayout';

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
interface Invoice { id: string; invoiceNumber: string; }

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
  const [formData, setFormData] = useState({
    paymentNumber: '', invoiceId: '', contractId: '', clientId: '', amount: '', paymentType, paymentMethod: 'BANK_TRANSFER' as const, paymentDate: new Date().toISOString().split('T')[0], bankAccount: '', referenceNumber: '', notes: '',
  });

  const title = paymentType === 'RECEIPT' ? '收款' : '付款';

  useEffect(() => {
    fetchPayments();
    fetchClients();
    fetchInvoices();
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

  const fetchInvoices = async () => {
    const res = await fetch('/api/invoices');
    const data = await res.json();
    if (data.success) setInvoices(data.data);
  };

  const handleClientChange = async (clientId: string) => {
    setFormData({ ...formData, clientId, contractId: '', invoiceId: '' });
    await fetchAvailableContracts(clientId);
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
        bankAccount: '',
        referenceNumber: '',
        notes: '',
      });
      fetchPayments();
    } else {
      alert(data.message || '失败');
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
              placeholder={`搜索: 单号、${paymentType === 'RECEIPT' ? '客户' : '供应商'}、合同、项目`}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-72 px-4 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button onClick={() => { setEditingPayment(null); setFormData({ paymentNumber: '', invoiceId: '', contractId: '', clientId: '', amount: '', paymentType, paymentMethod: 'BANK_TRANSFER', paymentDate: new Date().toISOString().split('T')[0], bankAccount: '', referenceNumber: '', notes: '' }); setShowModal(true); }} className="bg-blue-600 text-white px-4 py-2 rounded-lg">
              新建{title}
            </button>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr><th className="px-6 py-3 text-left">单号</th><th className="px-6 py-3 text-left">{paymentType === 'RECEIPT' ? '客户' : '供应商'}</th><th className="px-6 py-3 text-left">合同</th><th className="px-6 py-3 text-left">发票</th><th className="px-6 py-3 text-left">金额</th><th className="px-6 py-3 text-left">支付方式</th><th className="px-6 py-3 text-left">日期</th><th className="px-6 py-3 text-left">操作</th></tr>
            </thead>
            <tbody>
              {payments.map((pay) => (
                <tr key={pay.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">{pay.paymentNumber}</td>
                  <td className="px-6 py-4">{pay.client?.name}</td>
                  <td className="px-6 py-4">{pay.contract ? `${pay.contract.title}${pay.contract.project ? `(${pay.contract.project.name})` : ''}` : '-'}</td>
                  <td className="px-6 py-4">{pay.invoice?.invoiceNumber || '-'}</td>
                  <td className="px-6 py-4">¥{pay.amount.toLocaleString()}</td>
                  <td className="px-6 py-4">{pay.paymentMethod}</td>
                  <td className="px-6 py-4">{pay.paymentDate.split('T')[0]}</td>
                  <td className="px-6 py-4">
                    <button onClick={() => { setEditingPayment(pay); setFormData({ paymentNumber: pay.paymentNumber, invoiceId: pay.invoiceId || '', contractId: pay.contractId || '', clientId: pay.clientId, amount: pay.amount.toString(), paymentType: pay.paymentType, paymentMethod: pay.paymentMethod as any, paymentDate: pay.paymentDate.split('T')[0], bankAccount: pay.bankAccount || '', referenceNumber: pay.referenceNumber || '', notes: pay.notes || '' }); setShowModal(true); fetchAvailableContracts(pay.clientId); }} className="text-blue-600 mr-3">编辑</button>
                    <button onClick={async () => { if (confirm('确定删除?')) { await fetch(`/api/payments/${pay.id}`, { method: 'DELETE' }); fetchPayments(); } }} className="text-red-600">删除</button>
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
                <div className="grid grid-cols-2 gap-4">
                  <div><label className="block text-sm mb-1">单号 *</label><input type="text" required value={formData.paymentNumber} onChange={e => setFormData({ ...formData, paymentNumber: e.target.value })} className="w-full px-3 py-2 border rounded" /></div>
                  <div><label className="block text-sm mb-1">金额 *</label><input type="number" required value={formData.amount} onChange={e => setFormData({ ...formData, amount: e.target.value })} className="w-full px-3 py-2 border rounded" /></div>
                </div>
                <div><label htmlFor="client" className="block text-sm mb-1">{paymentType === 'RECEIPT' ? '客户' : '供应商'} *</label><select required id="client" value={formData.clientId} onChange={e => handleClientChange(e.target.value)} className="w-full px-3 py-2 border rounded"><option value="">选择{paymentType === 'RECEIPT' ? '客户' : '供应商'}</option>{clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select></div>
                <div className="grid grid-cols-2 gap-4">
                  <div><label className="block text-sm mb-1">关联合同</label><select value={formData.contractId} onChange={e => setFormData({ ...formData, contractId: e.target.value })} className="w-full px-3 py-2 border rounded"><option value="">无</option>{availableContracts.map(c => <option key={c.id} value={c.id}>{c.title}{c.project ? `(${c.project.name})` : ''} - 未结算金额：¥{c._remainingAmount?.toLocaleString()}</option>)}</select></div>
                  <div><label className="block text-sm mb-1">关联发票</label><select value={formData.invoiceId} onChange={e => setFormData({ ...formData, invoiceId: e.target.value })} className="w-full px-3 py-2 border rounded"><option value="">无</option>{invoices.map(i => <option key={i.id} value={i.id}>{i.invoiceNumber}</option>)}</select></div>
                </div>
                <div><label className="block text-sm mb-1">支付方式 *</label><select required value={formData.paymentMethod} onChange={e => setFormData({ ...formData, paymentMethod: e.target.value as any })} className="w-full px-3 py-2 border rounded"><option value="CASH">现金</option><option value="BANK_TRANSFER">银行</option><option value="CHECK">支票</option><option value="ALIPAY">支付宝</option><option value="WECHAT_PAY">微信</option><option value="OTHER">其他</option></select></div>
                <div className="grid grid-cols-2 gap-4">
                  <div><label className="block text-sm mb-1">日期 *</label><input type="date" required value={formData.paymentDate} onChange={e => setFormData({ ...formData, paymentDate: e.target.value })} className="w-full px-3 py-2 border rounded" /></div>
                  <div><label className="block text-sm mb-1">银行账号</label><input type="text" value={formData.bankAccount} onChange={e => setFormData({ ...formData, bankAccount: e.target.value })} className="w-full px-3 py-2 border rounded" /></div>
                </div>
                <div><label className="block text-sm mb-1">备注</label><textarea value={formData.notes} onChange={e => setFormData({ ...formData, notes: e.target.value })} className="w-full px-3 py-2 border rounded" rows={2} /></div>
                <div className="flex justify-end gap-3 pt-4">
                  <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 border rounded">取消</button>
                  <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded">{editingPayment ? '更新' : '创建'}</button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
