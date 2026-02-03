'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { DashboardLayout } from '@/components/DashboardLayout';
import { ArrowLeft, Edit, Trash2, DollarSign, Calendar, User, Building2, CreditCard } from 'lucide-react';

interface Client {
  id: string;
  name: string;
  contactName?: string;
  phone?: string;
  email?: string;
}

interface Contract {
  id: string;
  title: string;
  contractNumber: string;
  project?: {
    name: string;
  };
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
  paymentMethod: string;
  paymentDate: string;
  bankAccount?: string;
  referenceNumber?: string;
  notes?: string;
  client?: Client;
  contract?: Contract;
  invoice?: Invoice;
}

export default function PaymentDetailPage({ paymentId, paymentType }: { paymentId: string; paymentType: 'RECEIPT' | 'EXPENSE' }) {
  const router = useRouter();
  const [payment, setPayment] = useState<Payment | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPayment();
  }, [paymentId]);

  const fetchPayment = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/payments/${paymentId}`);
      const data = await res.json();
      if (data.success) {
        setPayment(data.data);
      } else {
        alert(data.message || '获取收付款详情失败');
        router.back();
      }
    } catch (error) {
      console.error('Failed to fetch payment:', error);
      alert('获取收付款详情失败');
      router.back();
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = () => {
    router.push(`/${paymentType === 'RECEIPT' ? 'payments/receipts' : 'payments/expenses'}?edit=${paymentId}`);
  };

  const handleDelete = async () => {
    if (!confirm('确定要删除这个收付款吗？')) return;
    try {
      const res = await fetch(`/api/payments/${paymentId}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        alert('删除成功');
        router.back();
      } else {
        alert(data.message || '删除失败');
      }
    } catch (error) {
      console.error('Failed to delete payment:', error);
      alert('删除失败，请重试');
    }
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

  if (loading) {
    return (
      <DashboardLayout>
        <div className="p-6 flex items-center justify-center">
          <div className="text-gray-500">加载中...</div>
        </div>
      </DashboardLayout>
    );
  }

  if (!payment) {
    return (
      <DashboardLayout>
        <div className="p-6">
          <div className="text-center text-gray-500">收付款不存在</div>
        </div>
      </DashboardLayout>
    );
  }

  const title = paymentType === 'RECEIPT' ? '收款' : '付款';

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
              <h2 className="text-xl md:text-2xl font-bold text-gray-900">{payment.paymentNumber}</h2>
              <p className="text-gray-500 mt-1">{new Date(payment.paymentDate).toLocaleDateString('zh-CN')}</p>
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
                <DollarSign size={20} />
                基本信息
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between py-2 border-b">
                  <span className="text-gray-500">单号</span>
                  <span className="font-medium">{payment.paymentNumber}</span>
                </div>
                <div className="flex justify-between py-2 border-b">
                  <span className="text-gray-500">金额</span>
                  <span className={`font-medium text-lg ${paymentType === 'RECEIPT' ? 'text-green-600' : 'text-red-600'}`}>
                    ¥{payment.amount.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between py-2 border-b">
                  <span className="text-gray-500">支付方式</span>
                  <span className="font-medium">{getPaymentMethodText(payment.paymentMethod)}</span>
                </div>
                <div className="flex justify-between py-2 border-b">
                  <span className="text-gray-500">支付日期</span>
                  <span className="font-medium">{new Date(payment.paymentDate).toLocaleDateString('zh-CN')}</span>
                </div>
                {payment.bankAccount && (
                  <div className="flex justify-between py-2 border-b">
                    <span className="text-gray-500">银行账号</span>
                    <span className="font-medium">{payment.bankAccount}</span>
                  </div>
                )}
                {payment.referenceNumber && (
                  <div className="flex justify-between py-2">
                    <span className="text-gray-500">参考号</span>
                    <span className="font-medium">{payment.referenceNumber}</span>
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
                  <span className="text-gray-500">{paymentType === 'RECEIPT' ? '客户' : '供应商'}</span>
                  <span className="font-medium">{payment.client?.name || '-'}</span>
                </div>
                {payment.client?.contactName && (
                  <div className="flex justify-between py-2 border-b">
                    <span className="text-gray-500">联系人</span>
                    <span className="font-medium">{payment.client.contactName}</span>
                  </div>
                )}
                {payment.client?.phone && (
                  <div className="flex justify-between py-2 border-b">
                    <span className="text-gray-500">电话</span>
                    <span className="font-medium">{payment.client.phone}</span>
                  </div>
                )}
                {payment.client?.email && (
                  <div className="flex justify-between py-2 border-b">
                    <span className="text-gray-500">邮箱</span>
                    <span className="font-medium">{payment.client.email}</span>
                  </div>
                )}
                {payment.contract && (
                  <div className="flex justify-between py-2 border-b">
                    <span className="text-gray-500">关联合同</span>
                    <span className="font-medium">{payment.contract.title}</span>
                  </div>
                )}
                {payment.invoice && (
                  <div className="flex justify-between py-2">
                    <span className="text-gray-500">关联发票</span>
                    <span className="font-medium">{payment.invoice.invoiceNumber}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {payment.notes && (
            <div className="mt-6 pt-6 border-t">
              <h3 className="text-lg font-semibold mb-3">备注</h3>
              <p className="text-gray-700">{payment.notes}</p>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
