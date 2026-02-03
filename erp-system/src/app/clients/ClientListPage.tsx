'use client';

import { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/DashboardLayout';
import { ResponsiveTable, Column, Action } from '@/components/ResponsiveTable';
import { MobileModal } from '@/components/MobileModal';

interface Client {
  id: string;
  name: string;
  contactName?: string;
  phone?: string;
  email?: string;
  address?: string;
  clientType?: 'CUSTOMER' | 'SUPPLIER';
}

interface FormData {
  name: string;
  contactName: string;
  phone: string;
  email: string;
  address: string;
  clientType: 'CUSTOMER' | 'SUPPLIER';
}

export default function ClientListPage({ clientType }: { clientType: 'CUSTOMER' | 'SUPPLIER' }) {
  const [clients, setClients] = useState<Client[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [formData, setFormData] = useState<FormData>({
    name: '',
    contactName: '',
    phone: '',
    email: '',
    address: '',
    clientType,
  });

  useEffect(() => {
    fetchClients();
  }, [clientType, searchQuery]);

  const fetchClients = async () => {
    try {
      const searchParam = searchQuery ? `&search=${encodeURIComponent(searchQuery)}` : '';
      const res = await fetch(`/api/clients?clientType=${clientType}${searchParam}`);
      const data = await res.json();
      if (data.success) {
        setClients(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch clients:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const url = editingClient ? `/api/clients/${editingClient.id}` : '/api/clients';
      const res = await fetch(url, {
        method: editingClient ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      const data = await res.json();
      if (data.success) {
        setShowModal(false);
        setEditingClient(null);
        setFormData({
          name: '',
          contactName: '',
          phone: '',
          email: '',
          address: '',
          clientType,
        });
        fetchClients();
      } else {
        alert(data.message || '操作失败');
      }
    } catch (error) {
      console.error('Failed to save client:', error);
      alert('操作失败，请重试');
    }
  };

  const handleEdit = (client: Client) => {
    setEditingClient(client);
    setFormData({
      name: client.name,
      contactName: client.contactName || '',
      phone: client.phone || '',
      email: client.email || '',
      address: client.address || '',
      clientType: client.clientType || 'CUSTOMER',
    });
    setShowModal(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('确定要删除这个客户吗？')) return;
    try {
      const res = await fetch(`/api/clients/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        fetchClients();
      } else {
        alert(data.message || '删除失败');
      }
    } catch (error) {
      console.error('Failed to delete client:', error);
      alert('删除失败，请重试');
    }
  };

  const openNewModal = () => {
    setEditingClient(null);
    setFormData({
      name: '',
      contactName: '',
      phone: '',
      email: '',
      address: '',
      clientType,
    });
    setShowModal(true);
  };

  const getClientTypeText = (type?: string) => {
    const typeMap: Record<string, string> = {
      'CUSTOMER': '客户',
      'SUPPLIER': '供应商',
    };
    return type ? typeMap[type] || type : '-';
  };

  const getClientTypeColor = (type?: string) => {
    return type === 'SUPPLIER' ? 'bg-orange-100 text-orange-800' : 'bg-green-100 text-green-800';
  };

  const title = clientType === 'CUSTOMER' ? '客户列表' : '供应商列表';
  const buttonText = clientType === 'CUSTOMER' ? '新建客户' : '新建供应商';
  const modalTitle = editingClient ? (clientType === 'CUSTOMER' ? '编辑客户' : '编辑供应商') : (clientType === 'CUSTOMER' ? '新建客户' : '新建供应商');

  const columns: Column<Client>[] = [
    {
      key: 'name',
      header: '名称',
      render: (client) => client.name,
    },
    {
      key: 'contactName',
      header: '联系人',
      render: (client) => client.contactName || '-',
    },
    {
      key: 'phone',
      header: '电话',
      render: (client) => client.phone || '-',
    },
    {
      key: 'email',
      header: '邮箱',
      render: (client) => client.email || '-',
    },
    {
      key: 'address',
      header: '地址',
      render: (client) => client.address || '-',
    },
    {
      key: 'clientType',
      header: '类型',
      render: (client) => (
        <span className={`px-3 py-1 rounded-full text-xs font-medium ${getClientTypeColor(client.clientType)}`}>
          {getClientTypeText(client.clientType)}
        </span>
      ),
    },
  ];

  const actions: Action<Client>[] = [
    {
      label: '编辑',
      onClick: handleEdit,
      className: 'bg-blue-50 text-blue-600 hover:bg-blue-100',
    },
    {
      label: '删除',
      onClick: (client) => handleDelete(client.id),
      className: 'bg-red-50 text-red-600 hover:bg-red-100',
    },
  ];

  return (
    <DashboardLayout>
      <div className="p-4 md:p-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
          <h1 className="text-2xl md:text-3xl font-bold">{title}</h1>
          <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
            <input
              type="text"
              placeholder="搜索: 名称、联系人、电话、邮箱"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full sm:w-72 px-4 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[44px] touch-manipulation"
            />
            <button
              onClick={openNewModal}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors min-h-[44px] touch-manipulation whitespace-nowrap"
            >
              {buttonText}
            </button>
          </div>
        </div>

        <ResponsiveTable
          data={clients}
          columns={columns}
          actions={actions}
          emptyMessage="暂无数据"
          getKey={(client) => client.id}
        />

        <MobileModal
          isOpen={showModal}
          onClose={() => setShowModal(false)}
          title={modalTitle}
          footer={
            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 min-h-[44px] touch-manipulation"
              >
                取消
              </button>
              <button
                type="submit"
                form="client-form"
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 min-h-[44px] touch-manipulation"
              >
                {editingClient ? '更新' : '创建'}
              </button>
            </div>
          }
        >
          <form id="client-form" onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                类型 <span className="text-red-500">*</span>
              </label>
              <select
                required
                value={formData.clientType}
                onChange={(e) => setFormData({ ...formData, clientType: e.target.value as any })}
                className="w-full px-3 py-2 min-h-[44px] border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 touch-manipulation"
              >
                <option value="CUSTOMER">客户</option>
                <option value="SUPPLIER">供应商</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                名称 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 min-h-[44px] border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 touch-manipulation"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                联系人
              </label>
              <input
                type="text"
                value={formData.contactName}
                onChange={(e) => setFormData({ ...formData, contactName: e.target.value })}
                className="w-full px-3 py-2 min-h-[44px] border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 touch-manipulation"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                电话
              </label>
              <input
                type="text"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full px-3 py-2 min-h-[44px] border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 touch-manipulation"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                邮箱
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-3 py-2 min-h-[44px] border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 touch-manipulation"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                地址
              </label>
              <textarea
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 touch-manipulation"
                rows={3}
              />
            </div>
          </form>
        </MobileModal>
      </div>
    </DashboardLayout>
  );
}
