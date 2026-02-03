'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { DashboardLayout } from '@/components/DashboardLayout';
import { ArrowLeft, Edit, Trash2, Calendar, FileText, TrendingUp, TrendingDown, DollarSign } from 'lucide-react';

interface Contract {
  id: string;
  contractNumber: string;
  title: string;
  amount: number;
  contractType: 'PURCHASE' | 'SALES';
  status: string;
}

interface Project {
  id: string;
  name: string;
  description?: string;
  status: 'PLANNING' | 'IN_PROGRESS' | 'PAUSED' | 'COMPLETED' | 'CANCELLED';
  startDate?: string;
  endDate?: string;
  contracts?: Contract[];
}

export default function ProjectDetailPage({ projectId }: { projectId: string }) {
  const router = useRouter();
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProject();
  }, [projectId]);

  const fetchProject = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/projects/${projectId}`);
      const data = await res.json();
      if (data.success) {
        setProject(data.data);
      } else {
        alert(data.message || '获取项目详情失败');
        router.back();
      }
    } catch (error) {
      console.error('Failed to fetch project:', error);
      alert('获取项目详情失败');
      router.back();
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = () => {
    router.push(`/projects?edit=${projectId}`);
  };

  const handleDelete = async () => {
    if (!confirm('确定要删除这个项目吗？')) return;
    try {
      const res = await fetch(`/api/projects/${projectId}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        alert('删除成功');
        router.back();
      } else {
        alert(data.message || '删除失败');
      }
    } catch (error) {
      console.error('Failed to delete project:', error);
      alert('删除失败，请重试');
    }
  };

  const getStatusText = (status: string) => {
    const statusMap: Record<string, string> = {
      'PLANNING': '筹划中',
      'IN_PROGRESS': '进行中',
      'PAUSED': '已暂停',
      'COMPLETED': '已完成',
      'CANCELLED': '已取消',
    };
    return statusMap[status] || status;
  };

  const getStatusColor = (status: string) => {
    const colorMap: Record<string, string> = {
      'PLANNING': 'bg-gray-100 text-gray-800',
      'IN_PROGRESS': 'bg-blue-100 text-blue-800',
      'PAUSED': 'bg-yellow-100 text-yellow-800',
      'COMPLETED': 'bg-green-100 text-green-800',
      'CANCELLED': 'bg-red-100 text-red-800',
    };
    return colorMap[status] || 'bg-gray-100 text-gray-800';
  };

  const getContractTypeText = (type: string) => {
    return type === 'SALES' ? '销售合同' : '采购合同';
  };

  const calculateContractStats = (contracts: Contract[]) => {
    const salesContracts = contracts.filter(c => c.contractType === 'SALES');
    const purchaseContracts = contracts.filter(c => c.contractType === 'PURCHASE');
    const salesAmount = salesContracts.reduce((sum, c) => sum + c.amount, 0);
    const purchaseAmount = purchaseContracts.reduce((sum, c) => sum + c.amount, 0);
    const grossProfit = salesAmount - purchaseAmount;
    const profitRate = salesAmount > 0 ? (grossProfit / salesAmount) * 100 : 0;
    return {
      salesCount: salesContracts.length,
      purchaseCount: purchaseContracts.length,
      salesAmount,
      purchaseAmount,
      grossProfit,
      profitRate,
    };
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

  if (!project) {
    return (
      <DashboardLayout>
        <div className="p-6">
          <div className="text-center text-gray-500">项目不存在</div>
        </div>
      </DashboardLayout>
    );
  }

  const contractStats = project.contracts ? calculateContractStats(project.contracts) : null;

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
          <h1 className="text-2xl md:text-3xl font-bold">项目详情</h1>
        </div>

        <div className="bg-white rounded-lg shadow p-4 md:p-6 mb-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
            <div>
              <h2 className="text-xl md:text-2xl font-bold text-gray-900">{project.name}</h2>
              <div className="flex items-center gap-2 mt-2">
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(project.status)}`}>
                  {getStatusText(project.status)}
                </span>
              </div>
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
                <Calendar size={20} />
                基本信息
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between py-2 border-b">
                  <span className="text-gray-500">项目名称</span>
                  <span className="font-medium">{project.name}</span>
                </div>
                <div className="flex justify-between py-2 border-b">
                  <span className="text-gray-500">状态</span>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(project.status)}`}>
                    {getStatusText(project.status)}
                  </span>
                </div>
                <div className="flex justify-between py-2 border-b">
                  <span className="text-gray-500">开始日期</span>
                  <span className="font-medium">{project.startDate ? new Date(project.startDate).toLocaleDateString('zh-CN') : '-'}</span>
                </div>
                <div className="flex justify-between py-2">
                  <span className="text-gray-500">结束日期</span>
                  <span className="font-medium">{project.endDate ? new Date(project.endDate).toLocaleDateString('zh-CN') : '-'}</span>
                </div>
              </div>
            </div>

            {project.description && (
              <div>
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <FileText size={20} />
                  描述
                </h3>
                <p className="text-gray-700">{project.description}</p>
              </div>
            )}
          </div>
        </div>

        {project.contracts && project.contracts.length > 0 && (
          <div className="bg-white rounded-lg shadow p-4 md:p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <FileText size={20} />
              关联合同 ({project.contracts.length})
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="bg-green-50 rounded-lg p-4">
                <h4 className="text-sm font-semibold text-green-700 flex items-center gap-2">
                  <TrendingUp size={16} />
                  销售合同
                </h4>
                <p className="text-2xl font-bold text-green-600 mt-2">
                  {contractStats?.salesCount || 0}
                </p>
                <p className="text-sm text-green-600 mt-1">
                  ¥{contractStats?.salesAmount.toLocaleString() || 0}
                </p>
              </div>
              <div className="bg-blue-50 rounded-lg p-4">
                <h4 className="text-sm font-semibold text-blue-700 flex items-center gap-2">
                  <TrendingDown size={16} />
                  采购合同
                </h4>
                <p className="text-2xl font-bold text-blue-600 mt-2">
                  {contractStats?.purchaseCount || 0}
                </p>
                <p className="text-sm text-blue-600 mt-1">
                  ¥{contractStats?.purchaseAmount.toLocaleString() || 0}
                </p>
              </div>
              <div className="bg-yellow-50 rounded-lg p-4">
                <h4 className="text-sm font-semibold text-yellow-700 flex items-center gap-2">
                  <DollarSign size={16} />
                  项目毛利
                </h4>
                <p className="text-2xl font-bold text-yellow-600 mt-2">
                  ¥{contractStats?.grossProfit.toLocaleString() || 0}
                </p>
                <p className="text-sm text-yellow-600 mt-1">
                  毛利率: {contractStats?.profitRate.toFixed(1) || 0}%
                </p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">合同编号</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">合同标题</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">类型</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">金额</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">状态</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {project.contracts.map((contract) => (
                    <tr key={contract.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3">{contract.contractNumber}</td>
                      <td className="px-4 py-3">{contract.title}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 rounded-full text-xs ${
                          contract.contractType === 'SALES' ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'
                        }`}>
                          {getContractTypeText(contract.contractType)}
                        </span>
                      </td>
                      <td className="px-4 py-3">¥{contract.amount.toLocaleString()}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 rounded-full text-xs bg-gray-100 text-gray-800`}>
                          {contract.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
