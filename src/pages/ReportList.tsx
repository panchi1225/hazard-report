import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { reportService } from '../services/reportService';
import { masterService } from '../services/masterService';
import { Report, Site } from '../types';
import { formatDate } from '../utils/helpers';
import { exportToCSV, exportToTSV, printReports } from '../utils/export';
import { ArrowLeft, CheckCircle, Circle, Filter, Download, Printer } from 'lucide-react';
import { format, parseISO } from 'date-fns';

export const ReportList: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [reports, setReports] = useState<Report[]>([]);
  const [sites, setSites] = useState<Site[]>([]);
  
  const [filterSite, setFilterSite] = useState('');
  const [filterMonth, setFilterMonth] = useState('');
  
  const [months, setMonths] = useState<string[]>([]);
  
  const isAdmin = user?.role === 'admin';

  useEffect(() => {
    const loadData = async () => {
      const [reportData, siteData] = await Promise.all([
        reportService.getReports(),
        masterService.getSites()
      ]);
      setReports(reportData);
      setSites(siteData);

      // 存在する月を抽出
      const uniqueMonths = Array.from(new Set(reportData.map(r => {
        try {
          return format(parseISO(r.incidentDate), 'yyyy-MM');
        } catch {
          return '';
        }
      }))).filter(Boolean).sort().reverse();
      setMonths(uniqueMonths);
    };
    loadData();
  }, []);

  const filteredReports = reports.filter(r => {
    if (filterSite && r.siteId !== filterSite) return false;
    if (filterMonth) {
      try {
        const rMonth = format(parseISO(r.incidentDate), 'yyyy-MM');
        if (rMonth !== filterMonth) return false;
      } catch {
        return false;
      }
    }
    return true;
  });

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="bg-blue-600 p-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/')} className="p-2 bg-white/20 hover:bg-white/30 rounded-full transition-colors">
            <ArrowLeft size={24} className="text-white" />
          </button>
          <h2 className="text-xl font-bold text-white">みんなの報告</h2>
        </div>
      </div>

      <div className="p-4 bg-gray-50 border-b border-gray-200">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2 text-gray-700 font-medium">
            <Filter size={20} />
            <span>絞り込み</span>
          </div>
          <span className="text-sm font-bold text-blue-700 bg-blue-100 py-1 px-2 rounded-full">
            {filteredReports.length} 件
          </span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <select
            className="w-full p-3 border border-gray-300 rounded-lg bg-white"
            value={filterSite}
            onChange={(e) => setFilterSite(e.target.value)}
          >
            <option value="">すべての現場</option>
            {sites.map(site => (
              <option key={site.id} value={site.id}>{site.name}</option>
            ))}
          </select>
          <select
            className="w-full p-3 border border-gray-300 rounded-lg bg-white"
            value={filterMonth}
            onChange={(e) => setFilterMonth(e.target.value)}
          >
            <option value="">すべての月</option>
            {months.map(month => (
              <option key={month} value={month}>{month.replace('-', '年')}月</option>
            ))}
          </select>
        </div>
        
        {isAdmin && (
          <div className="mt-4 pt-4 border-t border-gray-200 flex flex-wrap gap-2">
            <button 
              onClick={() => exportToCSV(filteredReports, sites)}
              disabled={filteredReports.length === 0}
              className="px-3 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg text-sm font-medium flex items-center gap-2 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Download size={16} className="text-green-600" />
              CSV
            </button>
            <button 
              onClick={() => exportToTSV(filteredReports, sites)}
              disabled={filteredReports.length === 0}
              className="px-3 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg text-sm font-medium flex items-center gap-2 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Download size={16} className="text-purple-600" />
              TSV
            </button>
            <button 
              onClick={() => printReports(filteredReports, 'ヒヤリ・ハット報告一覧')}
              disabled={filteredReports.length === 0}
              className="px-3 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg text-sm font-medium flex items-center gap-2 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Printer size={16} className="text-blue-600" />
              一覧PDF
            </button>
          </div>
        )}
      </div>

      <div className="divide-y divide-gray-100">
        {filteredReports.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            報告が見つかりませんでした
          </div>
        ) : (
          filteredReports.map(report => {
            const isMyReport = user && (report.createdByUserId === user.id || report.reporterId === user.id);

            return (
            <div 
              key={report.id} 
              className={`p-4 cursor-pointer transition-colors flex items-start gap-4 relative border-l-4 ${
                isMyReport 
                  ? 'bg-yellow-50/40 hover:bg-yellow-100 border-l-yellow-400' 
                  : 'border-l-transparent hover:bg-blue-50'
              }`}
              onClick={() => navigate(`/report/${report.id}`)}
            >
              {isMyReport && (
                <div className="absolute top-3 right-3 bg-yellow-100 text-yellow-800 text-xs font-bold px-2 py-0.5 rounded border border-yellow-300 shadow-sm">
                  自分
                </div>
              )}
              <div className="mt-1">
                {report.checked ? (
                  <CheckCircle size={24} className="text-green-500" />
                ) : (
                  <Circle size={24} className="text-gray-300" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2 mb-1 pr-10">
                  <span className="text-sm font-bold text-gray-600">{formatDate(report.incidentDate)}</span>
                  <span className="text-xs px-2 py-1 bg-blue-100 text-blue-800 rounded-full font-medium">
                    {report.siteName}
                  </span>
                </div>
                <p className="text-gray-800 line-clamp-2 leading-relaxed">
                  {report.content}
                </p>
              </div>
            </div>
          )})
        )}
      </div>
    </div>
  );
};
