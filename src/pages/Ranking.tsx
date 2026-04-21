import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { reportService } from '../services/reportService';
import { getFiscalYear, generateAnonymousMapForYear } from '../utils/helpers';
import { ArrowLeft, Trophy, Medal } from 'lucide-react';

interface RankingItem {
  reporterId: string;
  reporterName: string;
  count: number;
  rank: number;
}

export const Ranking: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [ranking, setRanking] = useState<RankingItem[]>([]);
  const [currentFiscalYear, setCurrentFiscalYear] = useState<number>(new Date().getFullYear());
  const [anonymousMap, setAnonymousMap] = useState<Record<string, string>>({});

  useEffect(() => {
    const loadRanking = async () => {
      const reports = await reportService.getReports();
      
      // 今年度を計算
      const today = new Date().toISOString();
      const fiscalYear = getFiscalYear(today);
      setCurrentFiscalYear(fiscalYear);

      // 今年度の匿名化マップを生成
      const annMap = generateAnonymousMapForYear(reports, fiscalYear);
      setAnonymousMap(annMap);

      // 今年度の報告のみ抽出
      const thisYearReports = reports.filter(r => getFiscalYear(r.incidentDate) === fiscalYear);

      // 報告者ごとに集計
      const counts: Record<string, { name: string, count: number }> = {};
      thisYearReports.forEach(r => {
        if (!counts[r.reporterId]) {
          counts[r.reporterId] = { name: r.reporterName, count: 0 };
        }
        counts[r.reporterId].count++;
      });

      // 配列にしてソート
      const sorted = Object.entries(counts)
        .map(([id, data]) => ({ reporterId: id, reporterName: data.name, count: data.count }))
        .sort((a, b) => b.count - a.count);

      // 順位付け（同率は同じ順位）
      let currentRank = 1;
      let previousCount = -1;
      
      const ranked = sorted.map((item, index) => {
        if (item.count !== previousCount) {
          currentRank = index + 1;
        }
        previousCount = item.count;
        return { ...item, rank: currentRank };
      }).slice(0, 10); // 上位10件

      setRanking(ranked);
    };
    loadRanking();
  }, []);

  const isAdmin = user?.role === 'admin';

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="bg-yellow-500 p-4 flex items-center gap-4">
        <button onClick={() => navigate('/')} className="p-2 bg-white/20 hover:bg-white/30 rounded-full transition-colors">
          <ArrowLeft size={24} className="text-gray-900" />
        </button>
        <h2 className="text-xl font-bold text-gray-900">報告数ランキング</h2>
      </div>

      <div className="p-6">
        <div className="flex justify-between items-end mb-6">
          <div>
            <h3 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
              <Trophy className="text-yellow-500" />
              {currentFiscalYear}年度
            </h3>
            <p className="text-gray-500 text-sm mt-1">（{currentFiscalYear}年4月〜{currentFiscalYear + 1}年3月）</p>
          </div>
        </div>

        <div className="space-y-3">
          {ranking.length === 0 ? (
            <div className="text-center p-8 text-gray-500 bg-gray-50 rounded-xl">
              まだ報告がありません
            </div>
          ) : (
            ranking.map((item) => {
              const isMyReport = item.reporterId === user?.id; // 自分の行かどうか
              const shouldHighlight = !isAdmin && isMyReport;  // 一般ユーザーが自分の行を見た時だけ強調

              // 管理者、もしくは「自分自身のデータ」の場合は実名を表示。それ以外は匿名名。
              const displayName = (isAdmin || isMyReport)
                ? item.reporterName 
                : (anonymousMap[item.reporterId] || '報告者');
                
              let rowClass = "bg-gray-50 border border-gray-100";
              if (item.rank === 1) rowClass = "bg-yellow-100 text-yellow-700 border border-yellow-300";
              else if (item.rank === 2) rowClass = "bg-gray-200 text-gray-700 border border-gray-300";
              else if (item.rank === 3) rowClass = "bg-orange-100 text-orange-800 border border-orange-300";

              if (shouldHighlight) {
                 if (item.rank > 3) {
                   rowClass = "bg-yellow-50/50 border-2 border-yellow-400 shadow-sm"; // 4位以下の背景と枠線を強調
                 } else {
                   rowClass += " shadow-md ring-2 ring-yellow-400 border-transparent"; // 1-3位は元の色を活かしつつリングで強調
                 }
              }

              return (
                <div 
                  key={item.reporterId} 
                  className={`flex items-center justify-between p-4 rounded-xl relative transition-all ${rowClass}`}
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 text-center font-bold text-xl">
                      {item.rank <= 3 ? (
                        <Medal size={28} className="mx-auto" />
                      ) : (
                        `${item.rank}位`
                      )}
                    </div>
                    <div className={`font-bold text-lg flex items-center gap-2 ${shouldHighlight ? "text-gray-900" : ""}`}>
                      {displayName}
                      {shouldHighlight && (
                        <span className="bg-yellow-100 text-yellow-800 text-xs font-bold px-2 py-0.5 rounded border border-yellow-300 shadow-sm">
                          自分
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="text-xl font-bold">
                    {item.count} <span className="text-sm font-normal">件</span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
