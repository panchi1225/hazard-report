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
  const MAX_PHOTO_BYTES = 450 * 1024; // Firestore 1MiB制限を考慮し、他フィールド分を十分確保
  const MAX_WIDTH = 1600;
  const MAX_HEIGHT = 1600;
  const MIN_WIDTH = 720;
  const MIN_HEIGHT = 720;
  const { id } = useParams<{ id: string }>();
  const isEditMode = !!id;
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [sites, setSites] = useState<Site[]>([]);
  
  const [incidentDate, setIncidentDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [siteId, setSiteId] = useState('');
  const [content, setContent] = useState('');
  const [photoDataUrl, setPhotoDataUrl] = useState('');
  
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
          setPhotoDataUrl(report.photoDataUrl || '');
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
          photoDataUrl,
        });
      } else {
        await reportService.addReport({
          incidentDate,
          siteId,
          siteName: site?.name || '',
          reporterId: user?.id || '',       // reporterとcreatorは同じ情報を入れる
          reporterName: user?.name || '',   
          content,
          photoDataUrl,
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

  const loadImage = (file: File): Promise<HTMLImageElement> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      const objectUrl = URL.createObjectURL(file);
      img.onload = () => {
        URL.revokeObjectURL(objectUrl);
        resolve(img);
      };
      img.onerror = () => {
        URL.revokeObjectURL(objectUrl);
        reject(new Error('画像の読み込みに失敗しました'));
      };
      img.src = objectUrl;
    });
  };

  const canvasToDataUrl = (canvas: HTMLCanvasElement, quality: number): string => {
    return canvas.toDataURL('image/jpeg', quality);
  };

  const getUtf8Bytes = (value: string): number => {
    return new Blob([value]).size;
  };

  const compressImage = async (file: File): Promise<string> => {
    const img = await loadImage(file);
    const initialScale = Math.min(1, MAX_WIDTH / img.width, MAX_HEIGHT / img.height);
    let width = Math.max(1, Math.floor(img.width * initialScale));
    let height = Math.max(1, Math.floor(img.height * initialScale));
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('画像処理に失敗しました');

    let dataUrl = '';
    let pass = 0;

    while (pass < 6) {
      canvas.width = width;
      canvas.height = height;
      ctx.clearRect(0, 0, width, height);
      ctx.drawImage(img, 0, 0, width, height);

      for (const quality of [0.82, 0.72, 0.62, 0.52, 0.42, 0.32, 0.25]) {
        dataUrl = canvasToDataUrl(canvas, quality);
        if (getUtf8Bytes(dataUrl) <= MAX_PHOTO_BYTES) {
          return dataUrl;
        }
      }

      const nextWidth = Math.floor(width * 0.8);
      const nextHeight = Math.floor(height * 0.8);
      if (nextWidth < MIN_WIDTH || nextHeight < MIN_HEIGHT) {
        break;
      }
      width = nextWidth;
      height = nextHeight;
      pass += 1;
    }

    return dataUrl;
  };

  const handlePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) {
      setPhotoDataUrl('');
      return;
    }
    if (!file.type.startsWith('image/')) {
      setError('画像ファイルを選択してください');
      e.target.value = '';
      return;
    }
    setError('');
    try {
      const compressedDataUrl = await compressImage(file);
      if (getUtf8Bytes(compressedDataUrl) > MAX_PHOTO_BYTES) {
        setError('写真サイズが大きいため添付できませんでした。別の写真を選択してください。');
        setPhotoDataUrl('');
        e.target.value = '';
        return;
      }
      setPhotoDataUrl(compressedDataUrl);
    } catch (error) {
      setError('画像の処理に失敗しました。別の写真でお試しください。');
      setPhotoDataUrl('');
      e.target.value = '';
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
        <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200 text-sm text-yellow-900">
          必須項目（発生日・現場・内容）は必ず入力してください。状況がわかる写真を添付できる場合は、できるだけ添付をお願いします。
        </div>

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

        <div>
          <label className="block text-gray-800 font-bold mb-2 text-lg">
            4. 写真添付（任意）
          </label>
          <input
            type="file"
            accept="image/*"
            onChange={handlePhotoChange}
            className="w-full p-3 border-2 border-gray-300 rounded-lg text-base focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none bg-white"
          />
          <p className="text-sm text-gray-500 mt-2">
            危険箇所や状況が伝わる写真があれば添付してください。
          </p>
          {photoDataUrl && (
            <div className="mt-4">
              <img src={photoDataUrl} alt="添付予定の写真" className="max-h-64 rounded-lg border border-gray-200 object-contain bg-gray-50" />
            </div>
          )}
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
