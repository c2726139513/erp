'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { DashboardLayout } from '@/components/DashboardLayout';
import { useAuth } from '@/contexts/AuthContext';
import { Trash2 } from 'lucide-react';

interface SystemSettings {
  id: string;
  companyName: string;
  logoUrl?: string;
}

export default function SettingsPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [settings, setSettings] = useState<SystemSettings | null>(null);
  const [formData, setFormData] = useState({
    companyName: '',
    logoUrl: '',
  });
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (user && !user.isAdmin) {
      router.push('/');
      return;
    }
    fetchSettings();
  }, [user, router]);

  const fetchSettings = async () => {
    try {
      const res = await fetch('/api/system-settings');
      const data = await res.json();
      if (data.success) {
        setSettings(data.data);
        setFormData({
          companyName: data.data.companyName,
          logoUrl: data.data.logoUrl || '',
        });
      }
    } catch (error) {
      console.error('Failed to fetch settings:', error);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const uploadFormData = new FormData();
      uploadFormData.append('file', file);

      const res = await fetch('/api/upload', {
        method: 'POST',
        body: uploadFormData,
      });

      const data = await res.json();
      if (data.success) {
        setFormData({ ...formData, logoUrl: data.data.url });
      } else {
        alert(data.message || '上传失败');
      }
    } catch (error) {
      console.error('Failed to upload file:', error);
      alert('上传失败，请重试');
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteLogo = async () => {
    if (!confirm('确定要删除公司LOGO吗？')) return;

    setDeleting(true);
    try {
      const res = await fetch('/api/system-settings', {
        method: 'DELETE',
      });

      const data = await res.json();
      if (data.success) {
        setFormData({ ...formData, logoUrl: '' });
        setSettings(data.data);
        alert('公司LOGO删除成功');
      } else {
        alert(data.message || '删除失败');
      }
    } catch (error) {
      console.error('Failed to delete logo:', error);
      alert('删除失败，请重试');
    } finally {
      setDeleting(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch('/api/system-settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      if (data.success) {
        alert('系统设置保存成功');
        setSettings(data.data);
      } else {
        alert(data.message || '保存失败');
      }
    } catch (error) {
      console.error('Failed to save settings:', error);
      alert('保存失败，请重试');
    } finally {
      setSaving(false);
    }
  };

  if (!user || !user.isAdmin) {
    return null;
  }

  return (
    <DashboardLayout>
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-6">系统设置</h1>

        <div className="bg-white rounded-lg shadow p-6">
          <form onSubmit={handleSubmit}>
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                公司名称
              </label>
              <input
                type="text"
                required
                value={formData.companyName}
                onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="请输入公司名称"
              />
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                公司LOGO
              </label>
              <div className="flex items-start gap-4">
                {formData.logoUrl && (
                  <div className="relative">
                    <div className="w-32 h-32 border border-gray-300 rounded-lg overflow-hidden flex-shrink-0">
                      <img
                        src={formData.logoUrl}
                        alt="公司LOGO"
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={handleDeleteLogo}
                      disabled={deleting}
                      className="absolute -top-2 -right-2 bg-red-500 text-white p-1 rounded-full hover:bg-red-600 disabled:bg-gray-400 disabled:cursor-not-allowed"
                      title="删除LOGO"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                )}
                <div className="flex-1">
                  <input
                    type="file"
                    accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
                    onChange={handleFileUpload}
                    disabled={uploading}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <p className="mt-2 text-sm text-gray-500">
                    支持 JPEG、PNG、GIF、WebP 格式，文件大小不超过 5MB
                  </p>
                  {uploading && (
                    <p className="mt-2 text-sm text-blue-600">上传中...</p>
                  )}
                  {deleting && (
                    <p className="mt-2 text-sm text-red-600">删除中...</p>
                  )}
                </div>
              </div>
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={saving || uploading || deleting}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                {saving ? '保存中...' : '保存设置'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </DashboardLayout>
  );
}
