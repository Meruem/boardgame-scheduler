'use client';

import React, { useState } from 'react';
import { useAuth } from '@/lib/auth';
import { t } from '@/lib/i18n';
import type { Locale } from '@/lib/i18n';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (userName?: string) => void;
  locale: Locale;
  title?: string;
}

export default function LoginModal({ isOpen, onClose, onSuccess, locale, title }: LoginModalProps) {
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const { login } = useAuth();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedName = name.trim();
    
    if (!trimmedName) {
      setError(t(locale, 'nameRequired'));
      return;
    }

    if (trimmedName.length < 2) {
      setError(t(locale, 'nameTooShort'));
      return;
    }

    login(trimmedName);
    setError('');
    setName('');
    onSuccess(trimmedName);
  };

  const handleCancel = () => {
    setError('');
    setName('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-blue-100/80 via-indigo-100/80 to-purple-100/80 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
        <div className="relative z-10">
          <h3 className="text-lg font-semibold mb-4 text-gray-900">
            {title || t(locale, 'loginRequired')}
          </h3>
          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t(locale, 'yourName')}
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
                placeholder={t(locale, 'enterYourName')}
                autoFocus
                required
              />
              {error && (
                <p className="text-red-600 text-sm mt-1">{error}</p>
              )}
            </div>
            <div className="flex gap-2">
              <button
                type="submit"
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg font-medium transition-colors"
              >
                {t(locale, 'continue')}
              </button>
              <button
                type="button"
                onClick={handleCancel}
                className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-800 py-2 rounded-lg font-medium transition-colors"
              >
                {t(locale, 'cancel')}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
