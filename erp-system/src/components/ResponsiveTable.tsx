'use client';

import { ReactNode } from 'react';

export interface Column<T> {
  key: string;
  header: string;
  render?: (item: T) => ReactNode;
  className?: string;
}

export interface Action<T> {
  label: string;
  onClick: (item: T) => void;
  className?: string;
  disabled?: (item: T) => boolean;
}

interface ResponsiveTableProps<T> {
  data: T[];
  columns: Column<T>[];
  actions?: Action<T>[];
  emptyMessage?: string;
  getKey: (item: T) => string;
}

export function ResponsiveTable<T>({
  data,
  columns,
  actions,
  emptyMessage = '暂无数据',
  getKey,
}: ResponsiveTableProps<T>) {
  if (data.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-8 text-center text-gray-500">
        {emptyMessage}
      </div>
    );
  }

  return (
    <>
      <div className="hidden md:block bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                {columns.map((column) => (
                  <th
                    key={column.key}
                    className={`px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider ${column.className || ''}`}
                  >
                    {column.header}
                  </th>
                ))}
                {actions && actions.length > 0 && (
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    操作
                  </th>
                )}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {data.map((item) => (
                <tr key={getKey(item)} className="hover:bg-gray-50">
                  {columns.map((column) => (
                    <td
                      key={column.key}
                      className={`px-6 py-4 whitespace-nowrap ${column.className || ''}`}
                    >
                      {column.render ? column.render(item) : (item as any)[column.key]}
                    </td>
                  ))}
                  {actions && actions.length > 0 && (
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex gap-2">
                        {actions.map((action, index) => {
                          const isDisabled = action.disabled ? action.disabled(item) : false;
                          return (
                            <button
                              key={index}
                              onClick={() => !isDisabled && action.onClick(item)}
                              disabled={isDisabled}
                              className={`px-3 py-1.5 text-sm rounded-lg transition-colors min-h-[36px] touch-manipulation ${
                                isDisabled
                                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                  : action.className || 'bg-blue-50 text-blue-600 hover:bg-blue-100'
                              }`}
                            >
                              {action.label}
                            </button>
                          );
                        })}
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="md:hidden space-y-4">
        {data.map((item) => (
          <div key={getKey(item)} className="bg-white rounded-lg shadow p-4">
            {columns.map((column) => (
              <div key={column.key} className="mb-3 last:mb-0">
                <div className="text-xs font-medium text-gray-500 uppercase mb-1">
                  {column.header}
                </div>
                <div className={`text-gray-900 ${column.className || ''}`}>
                  {column.render ? column.render(item) : (item as any)[column.key]}
                </div>
              </div>
            ))}
            {actions && actions.length > 0 && (
              <div className="mt-4 pt-4 border-t flex gap-2 flex-wrap">
                {actions.map((action, index) => {
                  const isDisabled = action.disabled ? action.disabled(item) : false;
                  return (
                    <button
                      key={index}
                      onClick={() => !isDisabled && action.onClick(item)}
                      disabled={isDisabled}
                      className={`flex-1 min-w-[100px] px-4 py-2 text-sm rounded-lg transition-colors min-h-[44px] touch-manipulation ${
                        isDisabled
                          ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                          : action.className || 'bg-blue-600 text-white hover:bg-blue-700'
                      }`}
                    >
                      {action.label}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        ))}
      </div>
    </>
  );
}
