import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { APP_NAME_JA, APP_NAME_EN } from '../utils/constants';
import { LogOut } from 'lucide-react';

export const Header: React.FC = () => {
  const { user, logout } = useAuth();

  return (
    <header className="bg-blue-800 text-white p-4 shadow-md sticky top-0 z-10">
      <div className="max-w-3xl mx-auto flex justify-between items-center">
        <div>
          <h1 className="text-xl font-bold">{APP_NAME_JA}</h1>
          <p className="text-xs text-blue-200">{APP_NAME_EN}</p>
        </div>
        {user && (
          <div className="flex items-center gap-4">
            <div className="text-sm text-right hidden sm:block">
              <span className="block text-blue-200 text-xs">ログイン中</span>
              <span className="font-medium">{user.name} {user.role === 'admin' && '(管理者)'}</span>
            </div>
            <button 
              onClick={logout}
              className="p-2 bg-blue-700 hover:bg-blue-600 rounded-full transition-colors"
              aria-label="ログアウト"
            >
              <LogOut size={20} />
            </button>
          </div>
        )}
      </div>
    </header>
  );
};
