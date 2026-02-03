'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { DashboardLayout } from '@/components/DashboardLayout';
import { ArrowLeft, Edit, Trash2, FileText, DollarSign, Calendar, User, Building2 } from 'lucide-react';

interface Contract {
  id: string;
  contractNumber: string;
  title: string;
  clientId: string;
  projectId?: string;
  amount: number;
  status: 'DRAFT' | 'ACTIVE' | 'COMPLETED' | 'CANCELLED';
  contractType: 'PURCHASE' | 'SALES';
  startDate: string;
  endDate: string;
  client?: {
    id: string;
    name: string;
    contactName?: string;
    phone?: string;
    email?: string;
  };
  project?: {
    id: string;
    name: string;
  };
  invoices?: any[];
  payments?: any[];
}

export default function ContractDetailPage({ contractId, contractType }: { contractId: string; contractType: 'SALES' | 'PURCHASE' }) {
  const router = useRouter();
  const [contract, setContract] = useState<Contract | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchContract();
  }, [contractId]);

  const fetchContract = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/contracts/${contractId}`);
      const data = await res.json();
      if (data.success) {
        setContract(data.data);
      } else {
        alert(data.message || '获取合同详情失败');
        router.back();
      }
    } catch (error) {
      console.error('Failed to fetch contract:', error);
      alert('获取合同详情失败');
      router.back();
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = () => {
    router.push(`/${contractType === 'SALES' ? 'contracts/sales' : 'contracts/purchase'}?edit=${contractId}`);
  };

  const handleDelete = async () => {
    if (!confirm('确定要删除这个合同吗？')) return;
    try {
      const res = await fetch(`/api/contracts/${contractId}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        alert('删除成功');
        router.back();
      } else {
        alert(data.message || '删除失败');
      }
    } catch (error) {
      console.error('Failed to delete contract:', error);
      alert('删除失败，请重试');
    }
  };

  const getStatusText = (status: string) => {
    const statusMap: Record<string, string> = {
      'DRAFT': '草稿',
      'ACTIVE': '执行中',
      'COMPLETED': '已完成',
      'CANCELLED': '已取消',
    };
    return statusMap[status] || status;
  };

  const getStatusColor = (status: string) => {
    const colorMap: Record<string, string> = {
      'DRAFT': 'bg-gray-100 text-gray-800',
      'ACTIVE': 'bg-blue-100 text-blue-800',
      'COMPLETED': 'bg-green-100 text-green-800',
      'CANCELLED': 'bg-red-100 text-red-800',
    };
    return colorMap[status] || 'bg-gray-100 text-gray-800';
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="p-6 flex items-center justify-center">
          <div className="text-gray-500">加载中...</div>
        </div>
      </DashboardLayout>
    );
  }

  if (!contract) {
    return (
      <DashboardLayout>
        <div className="p-6">
          <div className="text-center text-gray-500">合同不存在</div>
        </div>
      </DashboardLayout>
    );
  }

  const title = contractType === 'SALES' ? '销售合同' : '采购合同';

  return (
    <DashboardLayout>
      <div className="p-4 md:p-6">
        <div className="mb-6">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4 min-h-[44px] touch-manipulation"
          >
            <ArrowLeft size={20} />
            <span>返回</span>
          </button>
          <h1 className="text-2xl md:text-3xl font-bold">{title}详情</h1>
        </div>

        <div className="bg-white rounded-lg shadow p-4 md:p-6 mb-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
            <div>
              <h2 className="text-xl md:text-2xl font-bold text-gray-900">{contract.title}</h2>
              <p className="text-gray-500 mt-1">{contract.contractNumber}</p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleEdit}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors min-h-[44px] touch-manipulation"
              >
                <Edit size={18} />
                <span>编辑</span>
              </button>
              <button
                onClick={handleDelete}
                className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors min-h-[44px] touch-manipulation"
              >
                <Trash2 size={18} />
                <span>删除</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <FileText size={20} />
                基本信息
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between py-2 border-b">
                  <span className="text-gray-500">合同编号</span>
                  <span className="font-medium">{contract.contractNumber}</span>
                </div>
                <div className="flex justify-between py-2 border-b">
                  <span className="text-gray-500">合同金额</span>
                  <span className="font-medium text-lg">¥{contract.amount.toLocaleString()}</span>
                </div>
                <div className="flex justify-between py-2 border-b">
                  <span className="text-gray-500">状态</span>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(contract.status)}`}>
                    {getStatusText(contract.status)}
                  </span>
                </div>
                <div className="flex justify-between py-2 border-b">
                  <span className="text-gray-500">开始日期</span>
                  <span className="font-medium">{new Date(contract.startDate).toLocaleDateString('zh-CN')}</span>
                </div>
                <div className="flex justify-between py-2">
                  <span className="text-gray-500">结束日期</span>
                  <span className="font-medium">{new Date(contract.endDate).toLocaleDateString('zh-CN')}</span>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Building2 size={20} />
                关联信息
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between py-2 border-b">
                  <span className="text-gray-500">{contractType === 'SALES' ? '客户' : '供应商'}</span>
                  <span className="font-medium">{contract.client?.name || '-'}</span>
                </div>
                {contract.client?.contactName && (
                  <div className="flex justify-between py-2 border-b">
                    <span className="text-gray-500">联系人</span>
                    <span className="font-medium">{contract.client.contactName}</span>
                  </div>
                )}
                {contract.client?.phone && (
                  <div className="flex justify-between py-2 border-b">
                    <span className="text-gray-500">电话</span>
                    <span className="font-medium">{contract.client.phone}</span>
                  </div>
                )}
                {contract.client?.email && (
                  <div className="flex justify-between py-2">
                    <span className="text-gray-500">邮箱</span>
                    <span className="font-medium">{contract.client.email}</span>
                  </div>
                )}
                <div className="flex justify-between py-2">
                  <span className="text-gray-500">项目</span>
                  <span className="font-medium">{contract.project?.name || '-'}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {contract.invoices && contract.invoices.length > 0 && (
          <div className="bg-white rounded-lg shadow p-4 md:p-6 mb-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <FileText size={20} />
              关联发票 ({contract.invoices.length})
            </h3>
            <div className="space-y-3">
              {contract.invoices.map((invoice: any) => (
                <div key={invoice.id} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <div className="font-medium">{invoice.invoiceNumber}</div>
                      <div className="text-sm text-gray-500">
                        {new Date(invoice.invoiceDate).toLocaleDateString('zh-CN')}
                      </div>
                    </div>
                    <div className="text-lg font-semibold text-blue-600">
                      ¥{invoice.totalAmount.toLocaleString()}
                    </div>
                  </div>
                  {invoice.description && (
                    <div className="text-sm text-gray-600 mt-2">{invoice.description}</div>
                  )}
                </div>
              ))}
              <div className="mt-4 pt-4 border-t">
                <div className="flex justify-between items-center">
                  <span className="font-medium">已开票总额</span>
                  <span className="text-lg font-semibold">
                    ¥{contract.invoices.reduce((sum: number, inv: any) => sum + inv.totalAmount, 0).toLocaleString()}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {contract.payments && contract.payments.length > 0 && (
          <div className="bg-white rounded-lg shadow p-4 md:p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <DollarSign size={20} />
              关联收付款 ({contract.payments.length})
            </h3>
            <div className="space-y-3">
              {contract.payments.map((payment: any) => (
                <div key={payment.id} className={`border rounded-lg p-4 hover:bg-gray-50 transition-colors ${
                  payment.paymentType === 'RECEIPT' ? 'border-l-4 border-green-500' : 'border-l-4 border-red-500'
                }`}>
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <div className="font-medium">{payment.paymentNumber}</div>
                      <div className="text-sm text-gray-500">
                        {new Date(payment.paymentDate).toLocaleDateString('zh-CN')}
                      </div>
                    </div>
                    <div className={`text-lg font-semibold ${
                      payment.paymentType === 'RECEIPT' ? 'text-green-600' : 'text-red-600'
                    }`}>
                      ¥{payment.amount.toLocaleString()}
                    </div>
                  </div>
                  <div className="text-sm text-gray-600">
                    {payment.paymentType === 'RECEIPT' ? '收款' : '付款'}
                  </div>
                  {payment.notes && (
                    <div className="text-sm text-gray-600 mt-2">{payment.notes}</div>
                  )}
                </div>
              ))}
              <div className="mt-4 pt-4 border-t">
                <div className="flex justify-between items-center">
                  <span className="font-medium">已结算总额</span>
                  <span className="text-lg font-semibold">
                    ¥{contract.payments.reduce((sum: number, pay: any) => sum + pay.amount, 0).toLocaleString()}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
