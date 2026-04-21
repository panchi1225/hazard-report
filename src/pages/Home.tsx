import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/Button';
import { AlertTriangle, Trophy, Settings, Megaphone } from 'lucide-react';

export const Home: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 text-center mb-8 text-ellipsis overflow-hidden">
        <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-800 mb-2 whitespace-nowrap tracking-tight">
          {user?.name}さん、お疲れ様です。
        </h2>
        <p className="text-gray-600 leading-relaxed">
          現場で『ヒヤッ』としたり<br className="sm:hidden" />
          『ハッ』とした出来事を教えてください。
        </p>
      </div>

      <div className="grid gap-6">
        <Button 
          variant="primary" 
          size="xl" 
          className="flex flex-col items-center justify-center gap-2 h-32 shadow-md border border-yellow-400"
          onClick={() => navigate('/report/new')}
        >
          <div className="flex items-center gap-3">
            <Megaphone size={32} />
            <span className="text-2xl font-bold">報告する</span>
          </div>
          <span className="text-sm font-normal text-yellow-900">新しいヒヤリ・ハットを登録</span>
        </Button>

        <Button 
          variant="secondary" 
          size="xl" 
          className="flex flex-col items-center justify-center gap-2 h-32 shadow-md"
          onClick={() => navigate('/reports')}
        >
          <div className="flex items-center gap-3">
            <AlertTriangle size={32} />
            <span className="text-2xl font-bold">確認する</span>
          </div>
          <span className="text-sm font-normal text-blue-100">みんなのヒヤリ・ハットを確認する</span>
        </Button>

        <Button 
          variant="outline" 
          size="xl" 
          className="flex flex-col items-center justify-center gap-2 h-24 bg-white shadow-sm"
          onClick={() => navigate('/ranking')}
        >
          <div className="flex items-center gap-3">
            <Trophy size={28} className="text-yellow-500" />
            <span className="text-xl font-bold">報告数ランキング</span>
          </div>
          <span className="text-xs sm:text-sm font-medium text-gray-500">あなたの報告数は何位かな？</span>
        </Button>

        {user?.role === 'admin' && (
          <Button 
            variant="outline" 
            size="lg" 
            className="flex items-center justify-center gap-3 mt-4 bg-gray-800 text-white hover:bg-gray-700 border-none"
            onClick={() => navigate('/admin')}
          >
            <Settings size={24} />
            <span className="text-lg font-bold">管理者メニュー</span>
          </Button>
        )}
      </div>

      <div className="text-center pt-8 pb-6 flex flex-col items-center justify-center space-y-1">
        <span className="text-sm font-medium text-gray-400">&copy; 2026 Matsuura Construction App</span>
        <span className="text-sm font-medium text-gray-400">Hazard Report Ver.1.1.1</span>
      </div>
    </div>
  );
};
