'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { DashboardLayout } from '@/components/DashboardLayout';
import { ArrowLeft, Edit, Trash2, FileText, DollarSign, Calendar, User, Building2 } from 'lucide-react';

interface Invoice {
  id: string;
  invoiceNumber: string;
  contractId?: string;
  clientId: string;
  amount: number;
  taxAmount: number;
  status: string;
  invoiceType: 'RECEIVED' | 'ISSUED';
  invoiceDate: string;
  dueDate?: string;
  description?: string;
  notes?: string;
  client?: {
    id: string;
    name: string;
    contactName?: string;
    phone?: string;
    email?: string;
  };
  contract?: {
    id: string;
    title: string;
    contractNumber: string;
    project?: {
      name: string;
    };
  };
  payments?: any[];
}

export default function InvoiceDetailPage({ invoiceId, invoiceType }: { invoiceId: string; invoiceType: 'RECEIVED' | 'ISSUED' }) {
  const router = useRouter();
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchInvoice();
  }, [invoiceId]);

  const fetchInvoice = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/invoices/${invoiceId}`);
      const data = await res.json();
      if (data.success) {
        setInvoice(data.data);
      } else {
        alert(data.message || '获取发票详情失败');
        router.back();
      }
    } catch (error) {
      console.error('Failed to fetch invoice:', error);
      alert('获取发票详情失败');
      router.back();
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = () => {
    router.push(`/${invoiceType === 'ISSUED' ? 'invoices/issued' : 'invoices/received'}?edit=${invoiceId}`);
  };

  const handleDelete = async () => {
    if (!confirm('确定要删除这个发票吗？')) return;
    try {
      const res = await fetch(`/api/invoices/${invoiceId}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        alert('删除成功');
        router.back();
      } else {
        alert(data.message || '删除失败');
      }
    } catch (error) {
      console.error('Failed to delete invoice:', error);
      alert('删除失败，请重试');
    }
  };

  const getStatusText = (status: string) => {
    const statusMap: Record<string, string> = {
      'DRAFT': '草稿',
      'PENDING': '待审核',
      'APPROVED': '已审核',
      'REJECTED': '已拒绝',
      'PAID': '已付款',
      'CANCELLED': '已取消',
    };
    return statusMap[status] || status;
  };

  const getStatusColor = (status: string) => {
    const colorMap: Record<string, string> = {
      'DRAFT': 'bg-gray-100 text-gray-800',
      'PENDING': 'bg-yellow-100 text-yellow-800',
      'APPROVED': 'bg-blue-100 text-blue-800',
      'REJECTED': 'bg-red-100 text-red-800',
      'PAID': 'bg-green-100 text-green-800',
      'CANCELLED': 'bg-gray-100 text-gray-800',
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

  if (!invoice) {
    return (
      <DashboardLayout>
        <div className="p-6">
          <div className="text-center text-gray-500">发票不存在</div>
        </div>
      </DashboardLayout>
    );
  }

  const title = invoiceType === 'ISSUED' ? '开具发票' : '取得发票';

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
              <h2 className="text-xl md:text-2xl font-bold text-gray-900">{invoice.invoiceNumber}</h2>
              <p className="text-gray-500 mt-1">{new Date(invoice.invoiceDate).toLocaleDateString('zh-CN')}</p>
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
                    <span className="text-gray-500">发票编号</span>
                    <span className="font-medium">{invoice.invoiceNumber}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b">
                    <span className="text-gray-500">金额(含税)</span>
                    <span className="font-medium text-lg text-blue-600">¥{invoice.amount.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b">
                    <span className="text-gray-500">税额</span>
                    <span className="font-medium">¥{invoice.taxAmount.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b">
                    <span className="text-gray-500">状态</span>
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(invoice.status)}`}>
                      {getStatusText(invoice.status)}
                    </span>
                  </div>
                  <div className="flex justify-between py-2 border-b">
                    <span className="text-gray-500">开票日期</span>
                    <span className="font-medium">{new Date(invoice.invoiceDate).toLocaleDateString('zh-CN')}</span>
                  </div>
                  {invoice.dueDate && (
                    <div className="flex justify-between py-2">
                      <span className="text-gray-500">到期日期</span>
                      <span className="font-medium">{new Date(invoice.dueDate).toLocaleDateString('zh-CN')}</span>
                    </div>
                  )}
                </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Building2 size={20} />
                关联信息
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between py-2 border-b">
                  <span className="text-gray-500">{invoiceType === 'ISSUED' ? '客户' : '供应商'}</span>
                  <span className="font-medium">{invoice.client?.name || '-'}</span>
                </div>
                {invoice.client?.contactName && (
                  <div className="flex justify-between py-2 border-b">
                    <span className="text-gray-500">联系人</span>
                    <span className="font-medium">{invoice.client.contactName}</span>
                  </div>
                )}
                {invoice.client?.phone && (
                  <div className="flex justify-between py-2 border-b">
                    <span className="text-gray-500">电话</span>
                    <span className="font-medium">{invoice.client.phone}</span>
                  </div>
                )}
                {invoice.client?.email && (
                  <div className="flex justify-between py-2 border-b">
                    <span className="text-gray-500">邮箱</span>
                    <span className="font-medium">{invoice.client.email}</span>
                  </div>
                )}
                {invoice.contract && (
                  <div className="flex justify-between py-2">
                    <span className="text-gray-500">关联合同</span>
                    <span className="font-medium">{invoice.contract.title}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {invoice.description && (
            <div className="mt-6 pt-6 border-t">
              <h3 className="text-lg font-semibold mb-3">描述</h3>
              <p className="text-gray-700">{invoice.description}</p>
            </div>
          )}

          {invoice.notes && (
            <div className="mt-6 pt-6 border-t">
              <h3 className="text-lg font-semibold mb-3">备注</h3>
              <p className="text-gray-700">{invoice.notes}</p>
            </div>
          )}

          {invoice.payments && invoice.payments.length > 0 && (
            <div className="mt-6 pt-6 border-t">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <DollarSign size={20} />
                关联收付款 ({invoice.payments.length})
              </h3>
              <div className="space-y-3">
                {invoice.payments.map((payment: any) => (
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
                      ¥{invoice.payments.reduce((sum: number, pay: any) => sum + pay.amount, 0).toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
