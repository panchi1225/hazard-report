import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { masterService } from '../services/masterService';
import { reportService } from '../services/reportService';
import { Site } from '../types';
import { Button } from '../components/Button';
import { ArrowLeft, CheckCircle } from 'lucide-react';
import { format } from 'date-fns';

export const ReportForm: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const isEditMode = !!id;
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [sites, setSites] = useState<Site[]>([]);
  
  const [incidentDate, setIncidentDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [siteId, setSiteId] = useState('');
  const [content, setContent] = useState('');
  
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(isEditMode);

  useEffect(() => {
    const loadData = async () => {
      const siteData = await masterService.getSites();
      setSites(siteData);

      if (isEditMode && id) {
        const report = await reportService.getReportById(id);
        if (report) {
          // 権限チェック: 管理者または作成者のみ編集可能
          if (user?.role !== 'admin' && report.createdByUserId !== user?.id) {
            navigate('/reports');
            return;
          }
          setIncidentDate(report.incidentDate);
          setSiteId(report.siteId);
          setContent(report.content);
        } else {
          navigate('/reports');
        }
      }
      setIsLoading(false);
    };
    loadData();
  }, [id, isEditMode, user, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!incidentDate) {
      setError('発生日を入れてください');
      return;
    }
    if (!siteId) {
      setError('現場を選んでください');
      return;
    }
    if (!content.trim()) {
      setError('内容を書いてください');
      return;
    }

    setIsSubmitting(true);

    try {
      const site = sites.find(s => s.id === siteId);

      if (isEditMode && id) {
        await reportService.updateReport(id, {
          incidentDate,
          siteId,
          siteName: site?.name || '',
          content,
        });
      } else {
        await reportService.addReport({
          incidentDate,
          siteId,
          siteName: site?.name || '',
          reporterId: user?.id || '',       // reporterとcreatorは同じ情報を入れる
          reporterName: user?.name || '',   
          content,
          createdByUserId: user?.id || '',
          createdByUserName: user?.name || '',
        });
      }

      setIsSuccess(true);
    } catch (err: any) {
      setError('保存に失敗しました');
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return <div className="p-8 text-center">読み込み中...</div>;
  }

  if (isSuccess) {
    return (
      <div className="text-center py-16 bg-white rounded-2xl shadow-sm border border-gray-100">
        <CheckCircle size={80} className="mx-auto text-green-500 mb-6" />
        <h2 className="text-2xl font-bold text-gray-800 mb-4">
          {isEditMode ? '更新ありがとうございました' : '報告ありがとうございました'}
        </h2>
        <p className="text-gray-600 mb-10 text-base">安全な職場づくりにご協力感謝します。</p>
        
        <div className="flex flex-col gap-4 max-w-xs mx-auto">
          <Button variant="primary" onClick={() => navigate('/')}>
            トップへ戻る
          </Button>
          <Button variant="outline" onClick={() => navigate('/reports')}>
            みんなの報告を見る
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="bg-yellow-500 p-4 flex items-center gap-4">
        <button onClick={() => navigate(-1)} className="p-2 bg-white/20 hover:bg-white/30 rounded-full transition-colors">
          <ArrowLeft size={24} className="text-gray-900" />
        </button>
        <h2 className="text-xl font-bold text-gray-900">
          {isEditMode ? 'ヒヤリ・ハットを編集する' : 'ヒヤリ・ハットを報告する'}
        </h2>
      </div>

      <form onSubmit={handleSubmit} className="p-6 space-y-8">
        <div className="bg-blue-50 p-4 rounded-lg border border-blue-100 flex justify-between items-center">
          <div className="text-blue-800 font-bold">登録者：</div>
          <div className="text-xl font-bold text-blue-900">{user?.name}</div>
        </div>

        <div>
          <label className="block text-gray-800 font-bold mb-2 text-lg">
            1. いつ起きましたか？ <span className="text-red-500 text-sm font-normal ml-2">必須</span>
          </label>
          <input
            type="date"
            className="w-full p-4 border-2 border-gray-300 rounded-lg text-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none"
            value={incidentDate}
            onChange={(e) => setIncidentDate(e.target.value)}
          />
        </div>

        <div>
          <label className="block text-gray-800 font-bold mb-2 text-lg">
            2. どこで起きましたか？ <span className="text-red-500 text-sm font-normal ml-2">必須</span>
          </label>
          <select
            className="w-full p-4 border-2 border-gray-300 rounded-lg text-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none bg-white"
            value={siteId}
            onChange={(e) => setSiteId(e.target.value)}
          >
            <option value="">-- 現場を選んでください --</option>
            {sites.map(site => (
              <option key={site.id} value={site.id}>{site.name}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-gray-800 font-bold mb-2 text-lg">
            3. どんな内容でしたか？ <span className="text-red-500 text-sm font-normal ml-2">必須</span>
          </label>
          <textarea
            className="w-full p-4 border-2 border-gray-300 rounded-lg text-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none min-h-[200px]"
            placeholder="例：通路に荷物が置かれており、台車で通り抜ける際につまずきそうになった。"
            value={content}
            onChange={(e) => setContent(e.target.value)}
          />
        </div>

        {error && (
          <div className="bg-red-50 text-red-600 p-4 rounded-lg font-medium border border-red-200">
            {error}
          </div>
        )}

        <div className="pt-4">
          <Button 
            type="submit" 
            variant="primary" 
            size="xl" 
            fullWidth 
            disabled={isSubmitting}
            className="text-xl font-bold shadow-md"
          >
            {isEditMode ? '更新する' : '報告する'}
          </Button>
        </div>
      </form>
    </div>
  );
};
