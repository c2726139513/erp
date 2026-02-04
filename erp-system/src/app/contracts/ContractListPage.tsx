'use client';

import { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/DashboardLayout';
import { Check, Edit, Trash2 } from 'lucide-react';

interface Client {
  id: string;
  name: string;
}

interface Project {
  id: string;
  name: string;
}

interface Contract {
  id: string;
  contractNumber: string;
  title: string;
  clientId: string;
  projectId?: string;
  amount: number;
  status: 'UNSIGNED' | 'SIGNED';
  contractType: 'PURCHASE' | 'SALES';
  startDate: string;
  endDate: string;
  client?: Client;
  project?: Project;
  _remainingPayment?: number;
  _remainingInvoice?: number;
}

interface ContractFormData {
  contractNumber: string;
  title: string;
  clientId: string;
  projectId: string;
  amount: string;
  status: 'UNSIGNED' | 'SIGNED';
  contractType: 'PURCHASE' | 'SALES';
  startDate: string;
  endDate: string;
}

export default function ContractListPage({ contractType }: { contractType: 'SALES' | 'PURCHASE' }) {
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editingContract, setEditingContract] = useState<Contract | null>(null);
  const [selectedContract, setSelectedContract] = useState<Contract | null>(null);
  const [showDetailPanel, setShowDetailPanel] = useState(false);
  const [contractDetails, setContractDetails] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [showConfirmSignModal, setShowConfirmSignModal] = useState(false);
  const [contractToSign, setContractToSign] = useState<Contract | null>(null);

  const [formData, setFormData] = useState<ContractFormData>({
    contractNumber: '',
    title: '',
    clientId: '',
    projectId: '',
    amount: '',
    status: 'SIGNED',
    contractType,
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date(Date.now() + 30*24*60*60*1000).toISOString().split('T')[0],
  });

  const title = contractType === 'SALES' ? '销售合同' : '采购合同';
  const buttonText = contractType === 'SALES' ? '新建销售合同' : '新建采购合同';

  useEffect(() => {
    fetchContracts();
    fetchClients();
    fetchProjects();
  }, [contractType, searchQuery, startDate, endDate]);

  const fetchContracts = async () => {
    try {
      const searchParam = searchQuery ? `&search=${encodeURIComponent(searchQuery)}` : '';
      const startDateParam = startDate ? `&startDate=${startDate}` : '';
      const endDateParam = endDate ? `&endDate=${endDate}` : '';
      const res = await fetch(`/api/contracts?contractType=${contractType}${searchParam}${startDateParam}${endDateParam}`);
      const data = await res.json();
      if (data.success) {
        const contractsWithCalculations = await Promise.all(
          data.data.map(async (contract: any) => {
            const invoicesRes = await fetch(`/api/invoices?contractId=${contract.id}`);
            const paymentsRes = await fetch(`/api/payments?contractId=${contract.id}`);
            const invoicesData = await invoicesRes.json();
            const paymentsData = await paymentsRes.json();
            
            const invoicedAmount = invoicesData.success && invoicesData.data
              ? invoicesData.data.filter((i: any) => i.status === 'ISSUED').reduce((sum: number, i: any) => sum + i.totalAmount, 0)
              : 0;
            const paidAmount = paymentsData.success && paymentsData.data
              ? paymentsData.data.filter((p: any) => p.status === 'PAID').reduce((sum: number, p: any) => sum + p.amount, 0)
              : 0;
            
            return {
              ...contract,
              _remainingPayment: contract.amount - paidAmount,
              _remainingInvoice: contract.amount - invoicedAmount,
            };
          })
        );
        setContracts(contractsWithCalculations);
      }
    } catch (error) {
      console.error('Failed to fetch contracts:', error);
    }
  };

  const fetchClients = async () => {
    const clientType = contractType === 'SALES' ? 'CUSTOMER' : 'SUPPLIER';
    const res = await fetch(`/api/clients?clientType=${clientType}`);
    const data = await res.json();
    if (data.success) setClients(data.data);
  };

  const fetchProjects = async () => {
    try {
      const res = await fetch('/api/projects');
      const data = await res.json();
      if (data.success) {
        setProjects(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch projects:', error);
    }
  };

  const fetchContractDetails = async (contractId: string) => {
    try {
      const res = await fetch(`/api/contracts/${contractId}`);
      const data = await res.json();
      if (data.success) {
        setContractDetails(data.data);
        setShowDetailPanel(true);
      }
    } catch (error) {
      console.error('Failed to fetch contract details:', error);
    }
  };

  const handleView = (contract: Contract) => {
    setSelectedContract(contract);
    fetchContractDetails(contract.id);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const url = editingContract ? `/api/contracts/${editingContract.id}` : '/api/contracts';
      const payload = {
        ...formData,
        amount: parseFloat(formData.amount),
        clientId: formData.clientId || undefined,
        projectId: formData.projectId || undefined,
        startDate: new Date(formData.startDate).toISOString(),
        endDate: new Date(formData.endDate).toISOString(),
      };
      const res = await fetch(url, {
        method: editingContract ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (data.success) {
        setShowModal(false);
        setEditingContract(null);
        setFormData({
          contractNumber: '',
          title: '',
          clientId: '',
          projectId: '',
          amount: '',
          status: 'SIGNED',
          contractType,
          startDate: new Date().toISOString().split('T')[0],
          endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        });
        fetchContracts();
      } else {
        alert(data.message || '操作失败');
      }
    } catch (error) {
      console.error('Failed to save contract:', error);
      alert('操作失败，请重试');
    }
  };

  const handleEdit = (contract: Contract) => {
    setEditingContract(contract);
    setFormData({
      contractNumber: contract.contractNumber,
      title: contract.title,
      clientId: contract.clientId,
      projectId: contract.projectId || '',
      amount: contract.amount.toString(),
      status: contract.status,
      contractType: contract.contractType,
      startDate: contract.startDate.split('T')[0],
      endDate: contract.endDate.split('T')[0],
    });
    setShowModal(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('确定要删除这个合同吗？')) return;
    try {
      const res = await fetch(`/api/contracts/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        fetchContracts();
      } else {
        alert(data.message || '删除失败');
      }
    } catch (error) {
      console.error('Failed to delete contract:', error);
      alert('删除失败，请重试');
    }
  };

  const handleConfirmSign = (contract: Contract) => {
    setContractToSign(contract);
    setShowConfirmSignModal(true);
  };

  const handleSignContract = async () => {
    if (!contractToSign) return;
    try {
      const res = await fetch(`/api/contracts/${contractToSign.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...contractToSign, status: 'SIGNED' }),
      });
      const data = await res.json();
      if (data.success) {
        setShowConfirmSignModal(false);
        setContractToSign(null);
        fetchContracts();
        alert('合同已确认签署');
      } else {
        alert(data.message || '签署失败');
      }
    } catch (error) {
      console.error('Failed to sign contract:', error);
      alert('签署失败，请重试');
    }
  };

  const openNewModal = () => {
    setEditingContract(null);
    setFormData({
      contractNumber: '',
      title: '',
      clientId: '',
      projectId: '',
      amount: '',
      status: 'SIGNED',
      contractType,
      startDate: new Date().toISOString().split('T')[0],
      endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    });
    setShowModal(true);
  };

  const getStatusText = (status: string) => {
    const statusMap: Record<string, string> = {
      'UNSIGNED': '未签署(预录)',
      'SIGNED': '已签署',
    };
    return statusMap[status] || status;
  };

  const getStatusColor = (status: string) => {
    const colorMap: Record<string, string> = {
      'UNSIGNED': 'bg-gray-100 text-gray-800',
      'SIGNED': 'bg-green-100 text-green-800',
    };
    return colorMap[status] || 'bg-gray-100 text-gray-800';
  };

  return (
    <DashboardLayout>
      <div className="flex">
        <div className="flex-1 p-6">
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
                placeholder={`搜索: 合同编号、合同标题、${contractType === 'SALES' ? '客户' : '供应商'}、项目`}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-72 px-4 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button onClick={openNewModal} className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
                {buttonText}
              </button>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">项目</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">合同标题</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">{contractType === 'SALES' ? '客户' : '供应商'}</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">合同金额</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">未结算金额</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">未结算发票</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">操作</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {contracts.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="px-6 py-8 text-center text-gray-500">暂无数据</td>
                    </tr>
                  ) : (
                    contracts.map((contract) => (
                      <tr key={contract.id} className="hover:bg-gray-50 cursor-pointer" onClick={() => handleView(contract)}>
                        <td className="px-6 py-4">{contract.project?.name || '-'}</td>
                        <td className="px-6 py-4 font-medium">{contract.title}</td>
                        <td className="px-6 py-4">{contract.client?.name || '-'}</td>
                        <td className="px-6 py-4">¥{contract.amount.toLocaleString()}</td>
                        <td className="px-6 py-4 text-red-600">
                          {contract._remainingPayment !== undefined ? `¥${contract._remainingPayment.toLocaleString()}` : '-'}
                        </td>
                        <td className="px-6 py-4 text-orange-600">
                          {contract._remainingInvoice !== undefined ? `¥${contract._remainingInvoice.toLocaleString()}` : '-'}
                        </td>
                        <td className="px-6 py-4">
                          {contract.status === 'UNSIGNED' && (
                            <button 
                              onClick={(e) => {e.stopPropagation(); handleConfirmSign(contract);}} 
                              className="text-green-600 hover:text-green-800 mr-3 p-1 hover:bg-green-50 rounded transition-colors"
                              title="确认签署"
                            >
                              <Check size={18} />
                            </button>
                          )}
                          <button 
                            onClick={(e) => {e.stopPropagation(); handleEdit(contract);}} 
                            className="text-blue-600 hover:text-blue-800 mr-3 p-1 hover:bg-blue-50 rounded transition-colors"
                            title="编辑"
                          >
                            <Edit size={18} />
                          </button>
                          <button 
                            onClick={(e) => {e.stopPropagation(); handleDelete(contract.id);}} 
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
                  <h2 className="text-xl font-semibold">{editingContract ? '编辑' + title : '新建' + title}</h2>
                  <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600">✕</button>
                </div>
                  <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">合同编号 *</label>
                        <input type="text" required value={formData.contractNumber} onChange={(e) => setFormData({ ...formData, contractNumber: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">项目</label>
                        <select value={formData.projectId} onChange={(e) => setFormData({ ...formData, projectId: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg">
                          <option value="">选择项目</option>
                          {projects.map((project) => <option key={project.id} value={project.id}>{project.name}</option>)}
                        </select>
                      </div>
                      <div></div>
                      <div></div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">合同标题 *</label>
                        <input type="text" required value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
                      </div>
                      <div>
                        <label htmlFor="client">{contractType === 'SALES' ? '客户' : '供应商'} *</label>
                        <select required id="client" value={formData.clientId} onChange={(e) => setFormData({ ...formData, clientId: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg">
                          <option value="">选择{contractType === 'SALES' ? '客户' : '供应商'}</option>
                          {clients.map((client) => <option key={client.id} value={client.id}>{client.name}</option>)}
                        </select>
                      </div>
                    </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">金额 *</label>
                      <input type="number" required step="0.01" min="0" value={formData.amount} onChange={(e) => setFormData({ ...formData, amount: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">状态</label>
                      <select value={formData.status} onChange={(e) => setFormData({ ...formData, status: e.target.value as any })} className="w-full px-3 py-2 border border-gray-300 rounded-lg">
                        <option value="SIGNED">已签署</option>
                        <option value="UNSIGNED">未签署(预录)</option>
                      </select>
                    </div>
                    <div></div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">开始日期 *</label>
                      <input type="date" required value={formData.startDate} onChange={(e) => setFormData({ ...formData, startDate: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">结束日期 *</label>
                      <input type="date" required value={formData.endDate} onChange={(e) => setFormData({ ...formData, endDate: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
                    </div>
                  </div>
                  <div className="flex justify-end gap-3 pt-4">
                    <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">取消</button>
                    <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">{editingContract ? '更新' : '创建'}</button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {showConfirmSignModal && contractToSign && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
                <div className="p-6">
                  <h2 className="text-xl font-semibold mb-4">确认签署合同</h2>
                  <p className="text-gray-600 mb-4">
                    确定要将合同 <strong>{contractToSign.title}</strong> ({contractToSign.contractNumber}) 的状态从"未签署(预录)"改为"已签署"吗？
                  </p>
                  <div className="flex justify-end gap-3">
                    <button onClick={() => { setShowConfirmSignModal(false); setContractToSign(null); }} className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">取消</button>
                    <button onClick={handleSignContract} className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">确认签署</button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {showDetailPanel && contractDetails && (
          <>
            {/* 遮罩层 */}
            <div 
              className="fixed inset-0 bg-black bg-opacity-50 z-40"
              onClick={() => setShowDetailPanel(false)}
            />
            {/* 右侧抽屉 */}
            <div className="fixed right-0 top-0 h-full w-96 bg-white shadow-2xl z-50 transform transition-transform duration-300 ease-in-out overflow-y-auto">
              <div className="p-6">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-bold">合同详情</h2>
                  <button 
                    onClick={() => setShowDetailPanel(false)} 
                    className="text-gray-400 hover:text-gray-600 p-1 hover:bg-gray-100 rounded transition-colors"
                    title="关闭"
                  >
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="18" y1="6" x2="6" y2="18"></line>
                      <line x1="6" y1="6" x2="18" y2="18"></line>
                    </svg>
                  </button>
                </div>
                <div className="space-y-4">
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="text-sm text-gray-500 mb-1">合同编号</div>
                    <div className="font-medium">{contractDetails.contractNumber}</div>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="text-sm text-gray-500 mb-1">合同标题</div>
                    <div className="font-medium">{contractDetails.title}</div>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="text-sm text-gray-500 mb-1">合同金额</div>
                    <div className="font-medium text-lg text-blue-600">¥{contractDetails.amount.toLocaleString()}</div>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="text-sm text-gray-500 mb-1">项目</div>
                    <div className="font-medium">{contractDetails.project?.name || '-'}</div>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="text-sm text-gray-500 mb-1">{contractType === 'SALES' ? '客户' : '供应商'}</div>
                    <div className="font-medium">{contractDetails.client?.name || '-'}</div>
                  </div>
                  
                  <div className="border-t pt-4">
                    <h3 className="font-bold mb-3 flex items-center gap-2">
                      <span>关联发票</span>
                      <span className="text-sm font-normal text-gray-500">({contractDetails.invoices?.length || 0})</span>
                    </h3>
                    {contractDetails.invoices && contractDetails.invoices.length > 0 ? (
                      <div className="space-y-2">
                        {contractDetails.invoices.map((invoice: any) => (
                          <div key={invoice.id} className={`bg-white p-3 rounded-lg border-l-4 ${invoice.status === 'ISSUED' ? 'border-blue-500' : 'border-gray-400'} shadow-sm`}>
                            <div className="flex justify-between items-start mb-1">
                              <div className="font-medium">{invoice.invoiceNumber}</div>
                              <div className="text-lg font-semibold text-blue-600">¥{invoice.totalAmount.toLocaleString()}</div>
                            </div>
                            <div className="text-sm text-gray-500">
                              {new Date(invoice.invoiceDate).toLocaleDateString('zh-CN')}
                              {invoice.status === 'UNISSUED' && <span className="ml-2 text-gray-400">(未开具)</span>}
                            </div>
                          </div>
                        ))}
                        <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                          <div className="flex justify-between items-center">
                            <span className="font-medium">已开票</span>
                            <span className="font-semibold text-green-600">¥{contractDetails.invoices.filter((inv: any) => inv.status === 'ISSUED').reduce((sum: number, inv: any) => sum + inv.totalAmount, 0).toLocaleString()}</span>
                          </div>
                          <div className="flex justify-between items-center mt-2">
                            <span className="font-medium">未开票</span>
                            <span className={`font-semibold ${contractDetails.amount > contractDetails.invoices.filter((inv: any) => inv.status === 'ISSUED').reduce((sum: number, inv: any) => sum + inv.totalAmount, 0) ? 'text-red-600' : 'text-green-600'}`}>
                              ¥{(contractDetails.amount - contractDetails.invoices.filter((inv: any) => inv.status === 'ISSUED').reduce((sum: number, inv: any) => sum + inv.totalAmount, 0)).toLocaleString()}
                            </span>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="text-gray-500 text-center py-4 bg-gray-50 rounded-lg">暂无发票</div>
                    )}
                  </div>

                  <div className="border-t pt-4">
                    <h3 className="font-bold mb-3 flex items-center gap-2">
                      <span>关联收付款</span>
                      <span className="text-sm font-normal text-gray-500">({contractDetails.payments?.length || 0})</span>
                    </h3>
                    {contractDetails.payments && contractDetails.payments.length > 0 ? (
                      <div className="space-y-2">
                        {contractDetails.payments.map((payment: any) => (
                          <div key={payment.id} className={`bg-white p-3 rounded-lg border-l-4 shadow-sm ${
                            payment.status === 'PAID' 
                              ? (payment.paymentType === 'RECEIPT' ? 'border-green-500' : 'border-red-500') 
                              : 'border-gray-400'
                          }`}>
                            <div className="flex justify-between items-start mb-1">
                              <div className="font-medium">{payment.paymentNumber}</div>
                              <div className={`text-lg font-semibold ${
                                payment.paymentType === 'RECEIPT' ? 'text-green-600' : 'text-red-600'
                              }`}>
                                ¥{payment.amount.toLocaleString()}
                              </div>
                            </div>
                            <div className="text-sm text-gray-500">
                              {new Date(payment.paymentDate).toLocaleDateString('zh-CN')}
                              {payment.status === 'UNPAID' && <span className="ml-2 text-gray-400">(未支付)</span>}
                            </div>
                            <div className="text-sm">
                              <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                                payment.paymentType === 'RECEIPT' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                              }`}>
                                {payment.paymentType === 'RECEIPT' ? '收款' : '付款'}
                              </span>
                            </div>
                          </div>
                        ))}
                        <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                          <div className="flex justify-between items-center">
                            <span className="font-medium">已结算</span>
                            <span className="font-semibold text-green-600">¥{contractDetails.payments.filter((pay: any) => pay.status === 'PAID').reduce((sum: number, pay: any) => sum + pay.amount, 0).toLocaleString()}</span>
                          </div>
                          <div className="flex justify-between items-center mt-2">
                            <span className="font-medium">未结算</span>
                            <span className={`font-semibold ${contractDetails.amount > contractDetails.payments.filter((pay: any) => pay.status === 'PAID').reduce((sum: number, pay: any) => sum + pay.amount, 0) ? 'text-red-600' : 'text-green-600'}`}>
                              ¥{(contractDetails.amount - contractDetails.payments.filter((pay: any) => pay.status === 'PAID').reduce((sum: number, pay: any) => sum + pay.amount, 0)).toLocaleString()}
                            </span>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="text-gray-500 text-center py-4 bg-gray-50 rounded-lg">暂无收付款</div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </DashboardLayout>
  );
}
