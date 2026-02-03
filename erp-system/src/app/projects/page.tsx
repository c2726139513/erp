'use client';

import { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/DashboardLayout';

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
  _count?: {
    contracts: number;
  };
  contracts?: Contract[];
}

interface ProjectFormData {
  name: string;
  description: string;
  status: 'PLANNING' | 'IN_PROGRESS' | 'PAUSED' | 'COMPLETED' | 'CANCELLED';
  startDate: string;
  endDate: string;
}

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [viewProject, setViewProject] = useState<Project | null>(null);
  const [showViewModal, setShowViewModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [formData, setFormData] = useState<ProjectFormData>({
    name: '',
    description: '',
    status: 'PLANNING',
    startDate: '',
    endDate: '',
  });

  useEffect(() => {
    fetchProjects();
  }, [searchQuery]);

  const fetchProjects = async () => {
    try {
      const searchParam = searchQuery ? `?search=${encodeURIComponent(searchQuery)}` : '';
      const res = await fetch(`/api/projects${searchParam}`);
      const data = await res.json();
      if (data.success) {
        setProjects(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch projects:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const url = editingProject ? `/api/projects/${editingProject.id}` : '/api/projects';
      const res = await fetch(url, {
        method: editingProject ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      const data = await res.json();
      if (data.success) {
        setShowModal(false);
        setEditingProject(null);
        setFormData({
          name: '',
          description: '',
          status: 'PLANNING',
          startDate: '',
          endDate: '',
        });
        fetchProjects();
      } else {
        alert(data.message || '操作失败');
      }
    } catch (error) {
      console.error('Failed to save project:', error);
      alert('操作失败，请重试');
    }
  };

  const handleEdit = (project: Project) => {
    setEditingProject(project);
    setFormData({
      name: project.name,
      description: project.description || '',
      status: project.status,
      startDate: project.startDate ? project.startDate.split('T')[0] : '',
      endDate: project.endDate ? project.endDate.split('T')[0] : '',
    });
    setShowModal(true);
  };

  const handleView = async (project: Project) => {
    try {
      const res = await fetch(`/api/projects/${project.id}`);
      const data = await res.json();
      if (data.success) {
        setViewProject(data.data);
        setShowViewModal(true);
      }
    } catch (error) {
      console.error('Failed to fetch project details:', error);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('确定要删除这个项目吗？')) return;
    try {
      const res = await fetch(`/api/projects/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        fetchProjects();
      } else {
        alert(data.message || '删除失败');
      }
    } catch (error) {
      console.error('Failed to delete project:', error);
      alert('删除失败，请重试');
    }
  };

  const openNewModal = () => {
    setEditingProject(null);
    setFormData({
      name: '',
      description: '',
      status: 'PLANNING',
      startDate: '',
      endDate: '',
    });
    setShowModal(true);
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

  return (
    <DashboardLayout>
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">项目管理</h1>
          <div className="flex gap-3">
            <input
              type="text"
              placeholder="搜索: 项目名称"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-72 px-4 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              onClick={openNewModal}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              新建项目
            </button>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">项目名称</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">状态</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">开始日期</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">结束日期</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">操作</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {projects.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-8 text-center text-gray-500">暂无数据</td>
                  </tr>
                ) : (
                  projects.map((project) => (
                    <tr key={project.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 font-medium">{project.name}</td>
                      <td className="px-6 py-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(project.status)}`}>
                          {getStatusText(project.status)}
                        </span>
                      </td>
                      <td className="px-6 py-4">{project.startDate ? project.startDate.split('T')[0] : '-'}</td>
                      <td className="px-6 py-4">{project.endDate ? project.endDate.split('T')[0] : '-'}</td>
                      <td className="px-6 py-4">
                        <button onClick={() => handleEdit(project)} className="text-blue-600 hover:text-blue-800 mr-3">编辑</button>
                        <button onClick={() => handleDelete(project.id)} className="text-red-600 hover:text-red-800">删除</button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* 创建/编辑模态框 */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="flex justify-between items-center p-6 border-b">
              <h2 className="text-xl font-semibold">
                {editingProject ? '编辑项目' : '新建项目'}
              </h2>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  项目名称 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  描述
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={3}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  状态
                </label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="PLANNING">筹划中</option>
                  <option value="IN_PROGRESS">进行中</option>
                  <option value="PAUSED">已暂停</option>
                  <option value="COMPLETED">已完成</option>
                  <option value="CANCELLED">已取消</option>
                </select>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    开始日期
                  </label>
                  <input
                    type="date"
                    value={formData.startDate}
                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    结束日期
                  </label>
                  <input
                    type="date"
                    value={formData.endDate}
                    onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  取消
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  {editingProject ? '更新' : '创建'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 查看详情模态框 */}
      {showViewModal && viewProject && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center p-6 border-b">
              <h2 className="text-xl font-semibold">项目详情</h2>
              <button
                onClick={() => setShowViewModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>
            <div className="p-6">
              <div className="mb-6">
                <h3 className="text-lg font-semibold mb-4">基本信息</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-sm text-gray-500">项目名称</div>
                    <div className="font-medium">{viewProject.name}</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-500">状态</div>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(viewProject.status)}`}>
                      {getStatusText(viewProject.status)}
                    </span>
                  </div>
                  <div>
                    <div className="text-sm text-gray-500">开始日期</div>
                    <div>{viewProject.startDate ? viewProject.startDate.split('T')[0] : '-'}</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-500">结束日期</div>
                    <div>{viewProject.endDate ? viewProject.endDate.split('T')[0] : '-'}</div>
                  </div>
                  {viewProject.description && (
                    <div className="col-span-2">
                      <div className="text-sm text-gray-500">描述</div>
                      <div className="mt-1">{viewProject.description}</div>
                    </div>
                  )}
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-4">关联合同</h3>
                {viewProject.contracts && viewProject.contracts.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    <div className="bg-green-50 rounded-lg p-4">
                      <h4 className="text-sm font-semibold text-green-700">销售合同</h4>
                      <p className="text-2xl font-bold text-green-600 mt-2">
                        {calculateContractStats(viewProject.contracts).salesCount}
                      </p>
                      <p className="text-sm text-green-600 mt-1">
                        ¥{calculateContractStats(viewProject.contracts).salesAmount.toLocaleString()}
                      </p>
                    </div>
                    <div className="bg-blue-50 rounded-lg p-4">
                      <h4 className="text-sm font-semibold text-blue-700">采购合同</h4>
                      <p className="text-2xl font-bold text-blue-600 mt-2">
                        {calculateContractStats(viewProject.contracts).purchaseCount}
                      </p>
                      <p className="text-sm text-blue-600 mt-1">
                        ¥{calculateContractStats(viewProject.contracts).purchaseAmount.toLocaleString()}
                      </p>
                    </div>
                    <div className="bg-yellow-50 rounded-lg p-4">
                      <h4 className="text-sm font-semibold text-yellow-700">项目毛利</h4>
                      <p className="text-2xl font-bold text-yellow-600 mt-2">
                        ¥{calculateContractStats(viewProject.contracts).grossProfit.toLocaleString()}
                      </p>
                      <p className="text-sm text-yellow-600 mt-1">
                        毛利率: {calculateContractStats(viewProject.contracts).profitRate.toFixed(1)}%
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="text-gray-500 text-center py-4">暂无关联合同</div>
                )}

                {viewProject.contracts && viewProject.contracts.length > 0 && (
                  <div className="mt-4 overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">合同编号</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">合同标题</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">类型</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">金额</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">状态</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {viewProject.contracts.map((contract) => (
                          <tr key={contract.id}>
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
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
