'use client';

import { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/DashboardLayout';
import { useAuth } from '@/contexts/AuthContext';
import { PERMISSIONS, PERMISSION_GROUPS } from '@/lib/permissions';

interface User {
  id: string;
  username: string;
  permissions: string[];
  isAdmin: boolean;
  createdAt: string;
}

interface FormData {
  username: string;
  password: string;
  permissions: string[];
  isAdmin: boolean;
}

  const PERMISSION_OPTIONS = [
    { value: PERMISSIONS.CONTRACTS_SALES, label: '销售合同', group: '合同管理' },
    { value: PERMISSIONS.CONTRACTS_PURCHASE, label: '采购合同', group: '合同管理' },
    { value: PERMISSIONS.INVOICES_ISSUED, label: '开具发票', group: '发票管理' },
    { value: PERMISSIONS.INVOICES_RECEIVED, label: '取得发票', group: '发票管理' },
    { value: PERMISSIONS.PAYMENTS_RECEIPTS, label: '收款', group: '收付款' },
    { value: PERMISSIONS.PAYMENTS_EXPENSES, label: '付款', group: '收付款' },
    { value: PERMISSIONS.PROJECTS, label: '项目管理', group: '系统管理' },
    { value: PERMISSIONS.CLIENTS_CUSTOMERS, label: '客户列表', group: '伙伴管理' },
    { value: PERMISSIONS.CLIENTS_SUPPLIERS, label: '供应商列表', group: '伙伴管理' },
    { value: PERMISSIONS.USERS, label: '用户管理', group: '系统管理' },
  ];

export default function UsersPage() {
  const { isAdmin, loading: authLoading } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [formData, setFormData] = useState<FormData>({
    username: '',
    password: '',
    permissions: [],
    isAdmin: false,
  });

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const res = await fetch('/api/users');
      const data = await res.json();
      if (data.success) {
        setUsers(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch users:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.username || (!editingUser && !formData.password)) {
      alert('请填写完整信息');
      return;
    }

    if (formData.permissions.length === 0 && !formData.isAdmin) {
      alert('请至少选择一个权限');
      return;
    }

    try {
      const url = editingUser ? `/api/users/${editingUser.id}` : '/api/users';
      const res = await fetch(url, {
        method: editingUser ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (data.success) {
        setShowModal(false);
        setEditingUser(null);
        setFormData({
          username: '',
          password: '',
          permissions: [],
          isAdmin: false,
        });
        fetchUsers();
        alert(data.message || '操作成功');
      } else {
        alert(data.message || '操作失败');
      }
    } catch (error) {
      console.error('Failed to save user:', error);
      alert('操作失败，请重试');
    }
  };

  const handleEdit = (user: User) => {
    setEditingUser(user);
    setFormData({
      username: user.username,
      password: '',
      permissions: user.permissions,
      isAdmin: user.isAdmin,
    });
    setShowModal(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('确定要删除这个用户吗？')) return;

    try {
      const res = await fetch(`/api/users/${id}`, { method: 'DELETE' });
      const data = await res.json();

      if (data.success) {
        fetchUsers();
        alert('删除成功');
      } else {
        alert(data.message || '删除失败');
      }
    } catch (error) {
      console.error('Failed to delete user:', error);
      alert('删除失败，请重试');
    }
  };

  const openNewModal = () => {
    setEditingUser(null);
    setFormData({
      username: '',
      password: '',
      permissions: [],
      isAdmin: false,
    });
    setShowModal(true);
  };

  const togglePermission = (permission: string) => {
    setFormData((prev) => ({
      ...prev,
      permissions: prev.permissions.includes(permission)
        ? prev.permissions.filter((p) => p !== permission)
        : [...prev.permissions, permission],
    }));
  };

  const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('zh-CN');
};

  const getPermissionLabels = (permissions: string[]) => {
    if (!permissions || permissions.length === 0) return '无';

    const grouped = PERMISSION_OPTIONS
      .filter((opt) => permissions.includes(opt.value))
      .reduce((acc, opt) => {
        if (!acc[opt.group]) {
          acc[opt.group] = [];
        }
        acc[opt.group].push(opt.label);
        return acc;
      }, {} as Record<string, string[]>);

    return Object.entries(grouped)
      .map(([group, items]) => `${group}: ${items.join('、')}`)
      .join(' | ');
  };

  if (authLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-full">
          <div className="text-gray-500">加载中...</div>
        </div>
      </DashboardLayout>
    );
  }

  if (!isAdmin) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-full">
          <div className="text-red-600 text-lg">无权限访问此页面</div>
        </div>
      </DashboardLayout>
    );
}

  return (
    <DashboardLayout>
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">用户管理</h1>
          <button
            onClick={openNewModal}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            新建用户
          </button>
        </div>

        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    用户名
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    权限
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    角色
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    创建时间
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    操作
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {users.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                      暂无用户
                    </td>
                  </tr>
                ) : (
                  users.map((user) => (
                    <tr key={user.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap font-medium">
                        {user.username}
                      </td>
                      <td className="px-6 py-4 text-sm">
                        {getPermissionLabels(user.permissions)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {user.isAdmin ? (
                          <span className="px-3 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                            管理员
                          </span>
                        ) : (
                          <span className="px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            普通用户
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(user.createdAt)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <button
                          onClick={() => handleEdit(user)}
                          className="text-blue-600 hover:text-blue-800 mr-3"
                        >
                          编辑
                        </button>
                        <button
                          onClick={() => handleDelete(user.id)}
                          className="text-red-600 hover:text-red-800"
                        >
                          删除
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* 创建/编辑模态框 */}
        {showModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center p-6 border-b">
                <h2 className="text-xl font-semibold">
                  {editingUser ? '编辑用户' : '新建用户'}
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
                    用户名 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.username}
                    onChange={(e) =>
                      setFormData({ ...formData, username: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    密码 {!editingUser && <span className="text-red-500">*</span>}
                  </label>
                  <input
                    type="password"
                    required={!editingUser}
                    value={formData.password}
                    onChange={(e) =>
                      setFormData({ ...formData, password: e.target.value })
                    }
                    placeholder={editingUser ? '留空则不修改' : ''}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    角色
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="isAdmin"
                      checked={formData.isAdmin}
                      onChange={(e) =>
                        setFormData({ ...formData, isAdmin: e.target.checked })
                      }
                      className="w-4 h-4 text-blue-600"
                    />
                    <label htmlFor="isAdmin" className="text-sm text-gray-700">
                      管理员（拥有所有权限）
                    </label>
                  </div>
                </div>
                {!formData.isAdmin && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      选择权限
                    </label>
                    <div className="space-y-4">
                      {(
                        Object.entries(
                          PERMISSION_OPTIONS.reduce((groups: Record<string, typeof PERMISSION_OPTIONS>, option) => {
                            if (!groups[option.group]) {
                              groups[option.group] = [];
                            }
                            groups[option.group].push(option);
                            return groups;
                          }, {} as Record<string, typeof PERMISSION_OPTIONS>)
                        ).sort(([groupNameA], [groupNameB]) => {
                          const groupOrder = ['合同管理', '发票管理', '收付款', '伙伴管理', '项目管理', '系统管理'];
                          return groupOrder.indexOf(groupNameA) - groupOrder.indexOf(groupNameB);
                        })
                      ).map(([groupName, permissions]) => (
                        <div key={groupName} className="mb-4">
                          <div className="text-sm font-semibold text-gray-700 mb-2">{groupName}</div>
                          <div className="space-y-2 ml-2">
                            {permissions.map((option) => (
                              <div key={option.value} className="flex items-center gap-2">
                                <input
                                  type="checkbox"
                                  id={option.value}
                                  checked={formData.permissions.includes(option.value)}
                                  onChange={() => togglePermission(option.value)}
                                  className="w-4 h-4 text-blue-600"
                                />
                                <label htmlFor={option.value} className="text-sm text-gray-700">
                                  {option.label}
                                </label>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
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
                    {editingUser ? '更新' : '创建'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
