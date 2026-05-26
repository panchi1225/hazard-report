import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { reportService } from '../services/reportService';
import { Report } from '../types';
import { formatDate, getFiscalYear, generateAnonymousMapForYear } from '../utils/helpers';
import { Button } from '../components/Button';
import { ArrowLeft, CheckCircle, Clock, Edit2, Trash2 } from 'lucide-react';

export const ReportDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [report, setReport] = useState<Report | null>(null);
  const [anonymousMap, setAnonymousMap] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    const loadReport = async () => {
      if (id) {
        const data = await reportService.getReportById(id);
        setReport(data || null);
        
        if (data && user?.role !== 'admin') {
          // 一般ユーザーの場合は、その報告が含まれる年度の全データからマップを生成
          const allReports = await reportService.getReports();
          const fiscalYear = getFiscalYear(data.incidentDate);
          const map = generateAnonymousMapForYear(allReports, fiscalYear);
          setAnonymousMap(map);
        }
      }
      setIsLoading(false);
    };
    loadReport();
  }, [id, user?.role]);

  const handleCheck = async () => {
    if (!report || !user || user.role !== 'admin') return;
    await reportService.checkReport(report.id, user.id, true);
    setReport({ ...report, checked: true });
  };

  const handleUncheck = async () => {
    if (!report || !user || user.role !== 'admin') return;
    await reportService.checkReport(report.id, user.id, false);
    setReport({ ...report, checked: false });
  };

  const handleDeleteExecute = async () => {
    if (!report) return;
    await reportService.deleteReport(report.id);
    navigate('/reports', { replace: true });
  };

  if (isLoading) return <div className="p-8 text-center">読み込み中...</div>;
  if (!report) return <div className="p-8 text-center">報告が見つかりません</div>;

  const isAdmin = user?.role === 'admin';
  const isCreator = user?.id === report.createdByUserId;
  const isReporter = user?.id === report.reporterId;
  const isMyReport = isCreator || isReporter;
  const canEditOrDelete = isAdmin || isCreator;
  
  const displayReporterName = (isAdmin || isMyReport)
    ? report.reporterName 
    : (anonymousMap[report.reporterId] || '報告者');
  const displayCreatorName = (isAdmin || isMyReport)
    ? report.createdByUserName
    : (anonymousMap[report.createdByUserId] || '登録者');

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden relative">
      <div className="bg-blue-600 p-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/reports')} className="p-2 bg-white/20 hover:bg-white/30 rounded-full transition-colors">
            <ArrowLeft size={24} className="text-white" />
          </button>
          <h2 className="text-xl font-bold text-white">報告の詳細</h2>
        </div>
        {canEditOrDelete && (
          <div className="flex items-center gap-2">
            <button 
              onClick={() => navigate(`/report/edit/${report.id}`)}
              className="p-2 bg-white/20 hover:bg-white/30 rounded-full transition-colors text-white"
              title="編集"
            >
              <Edit2 size={20} />
            </button>
            <button 
              onClick={() => setShowDeleteConfirm(true)}
              className="p-2 bg-red-500/80 hover:bg-red-500 rounded-full transition-colors text-white"
              title="削除"
            >
              <Trash2 size={20} />
            </button>
          </div>
        )}
      </div>

      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between border-b border-gray-100 pb-4">
          <div>
            <div className="text-sm text-gray-500 mb-1">発生日</div>
            <div className="text-xl font-bold text-gray-800">{formatDate(report.incidentDate)}</div>
          </div>
          <div className="text-right">
            <div className="text-sm text-gray-500 mb-1">状態</div>
            {report.checked ? (
              <div className="flex items-center gap-1 text-green-600 font-bold">
                <CheckCircle size={20} />
                <span>確認済み</span>
              </div>
            ) : (
              <div className="flex items-center gap-1 text-yellow-600 font-bold">
                <Clock size={20} />
                <span>未確認</span>
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 border-b border-gray-100 pb-4">
          <div>
            <div className="text-sm text-gray-500 mb-1">現場</div>
            <div className="font-medium text-gray-800">{report.siteName}</div>
          </div>
          <div>
            <div className="text-sm text-gray-500 mb-1">報告者</div>
            <div className="font-medium text-gray-800">{displayReporterName}</div>
          </div>
        </div>

        <div>
          <div className="text-sm text-gray-500 mb-2">内容</div>
          <div className="p-4 bg-gray-50 rounded-lg text-gray-800 whitespace-pre-wrap leading-relaxed">
            {report.content}
          </div>
        </div>

        {report.photoDataUrl && (
          <div>
            <div className="text-sm text-gray-500 mb-2">添付写真</div>
            <a href={report.photoDataUrl} target="_blank" rel="noopener noreferrer">
              <img
                src={report.photoDataUrl}
                alt="報告の添付写真"
                className="w-full max-h-[420px] object-contain rounded-lg border border-gray-200 bg-gray-50"
              />
            </a>
          </div>
        )}
        
        <div className="text-xs text-gray-400 text-right">
          登録者: {displayCreatorName}
        </div>

        {isAdmin && (
          <div className="pt-6 mt-6 border-t border-gray-100">
            {!report.checked ? (
              <Button 
                variant="primary" 
                size="lg" 
                fullWidth 
                onClick={handleCheck}
                className="flex items-center justify-center gap-2"
              >
                <CheckCircle size={24} />
                <span>確認済みにする</span>
              </Button>
            ) : (
              <Button 
                variant="outline" 
                size="lg" 
                fullWidth 
                onClick={handleUncheck}
                className="flex items-center justify-center gap-2"
              >
                <Clock size={24} />
                <span>未確認に戻す</span>
              </Button>
            )}
          </div>
        )}
      </div>

      {showDeleteConfirm && (
        <div className="absolute inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-sm overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-6 text-center">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Trash2 className="text-red-600" size={32} />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">この報告を削除しますか？</h3>
              <p className="text-gray-500 mb-6">この操作は取り消せません。</p>
              
              <div className="flex gap-3">
                <Button 
                  variant="outline" 
                  className="flex-1"
                  onClick={() => setShowDeleteConfirm(false)}
                >
                  キャンセル
                </Button>
                <Button 
                  variant="primary" 
                  className="flex-1 !bg-red-600 hover:!bg-red-700 !border-red-600"
                  onClick={handleDeleteExecute}
                >
                  削除する
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
