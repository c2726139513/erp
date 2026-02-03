'use client';

import { ReactNode, useEffect, useState } from 'react';
import { X } from 'lucide-react';

interface MobileModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  footer?: ReactNode;
}

export function MobileModal({ isOpen, onClose, title, children, footer }: MobileModalProps) {
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setIsAnimating(true);
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center md:items-center"
      onClick={onClose}
    >
      <div
        className={`fixed inset-0 bg-black/50 transition-opacity duration-300 ${
          isAnimating ? 'opacity-100' : 'opacity-0'
        }`}
      />
      <div
        className={`relative w-full max-w-2xl bg-white rounded-t-2xl md:rounded-2xl shadow-xl transform transition-transform duration-300 ${
          isAnimating ? 'translate-y-0' : 'translate-y-full'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 bg-white border-b px-4 md:px-6 py-4 flex items-center justify-between">
          <h2 className="text-lg md:text-xl font-semibold text-gray-900">{title}</h2>
          <button
            onClick={onClose}
            className="p-2 min-h-[44px] touch-manipulation text-gray-400 hover:text-gray-600 transition-colors"
            aria-label="关闭"
          >
            <X size={24} />
          </button>
        </div>

        <div className="px-4 md:px-6 py-4 md:py-6 max-h-[calc(100vh-140px)] md:max-h-[calc(100vh-200px)] overflow-y-auto">
          {children}
        </div>

        {footer && (
          <div className="sticky bottom-0 bg-white border-t px-4 md:px-6 py-4">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
