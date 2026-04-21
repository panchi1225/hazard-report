import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { masterService } from '../services/masterService';
import { reportService } from '../services/reportService';
import { Employee, Site, Report, CompanyType } from '../types';
import { Button } from '../components/Button';
import { exportToCSV, exportToTSV, printReports } from '../utils/export';
import { ArrowLeft, Download, Printer, Users, Building, Database, FileText, CheckCircle, Clock, Trash2, Filter } from 'lucide-react';
import { formatDate } from '../utils/helpers';
import { format, parseISO } from 'date-fns';

export const Admin: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'export' | 'employees' | 'sites' | 'reports'>('reports');
  
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [sites, setSites] = useState<Site[]>([]);
  const [reports, setReports] = useState<Report[]>([]);
  
  const [newEmpName, setNewEmpName] = useState('');
  const [newEmpCompanyType, setNewEmpCompanyType] = useState<CompanyType>('matsuura');
  const [newSiteName, setNewSiteName] = useState('');
  
  // 社員一覧の表示切り替え用state
  const [displayCompanyType, setDisplayCompanyType] = useState<CompanyType>('matsuura');

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [targetDeleteId, setTargetDeleteId] = useState<string | null>(null);

  // マスタ削除用のstate
  const [showDeleteMasterConfirm, setShowDeleteMasterConfirm] = useState(false);
  const [targetDeleteMasterType, setTargetDeleteMasterType] = useState<'employee' | 'site' | null>(null);
  const [targetDeleteMasterId, setTargetDeleteMasterId] = useState<string | null>(null);

  // 絞り込み用ステート（出力タブ用）
  const [filterSite, setFilterSite] = useState('');
  const [filterMonth, setFilterMonth] = useState('');
  const [months, setMonths] = useState<string[]>([]);

  useEffect(() => {
    if (user?.role !== 'admin') {
      navigate('/');
      return;
    }
    loadData();
  }, [user, navigate]);

  const loadData = async () => {
    const [empData, siteData, reportData] = await Promise.all([
      masterService.getAllEmployees(),
      masterService.getAllSites(),
      reportService.getReports()
    ]);
    setEmployees(empData);
    setSites(siteData);
    setReports(reportData);

    const uniqueMonths = Array.from(new Set(reportData.map(r => {
      try {
        return format(parseISO(r.incidentDate), 'yyyy-MM');
      } catch {
        return '';
      }
    }))).filter(Boolean).sort().reverse();
    setMonths(uniqueMonths);
  };

  const handleAddEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEmpName.trim()) return;
    await masterService.addEmployee(newEmpName.trim(), newEmpCompanyType);
    setNewEmpName('');
    setNewEmpCompanyType('matsuura');
    loadData();
  };

  const confirmDeleteMaster = (type: 'employee' | 'site', id: string) => {
    setTargetDeleteMasterType(type);
    setTargetDeleteMasterId(id);
    setShowDeleteMasterConfirm(true);
  };

  const handleDeleteMasterExecute = async () => {
    if (targetDeleteMasterType === 'employee' && targetDeleteMasterId) {
      await masterService.deleteEmployee(targetDeleteMasterId);
    } else if (targetDeleteMasterType === 'site' && targetDeleteMasterId) {
      await masterService.deleteSite(targetDeleteMasterId);
    }
    setShowDeleteMasterConfirm(false);
    setTargetDeleteMasterType(null);
    setTargetDeleteMasterId(null);
    loadData();
  };

  const handleAddSite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSiteName.trim()) return;
    await masterService.addSite(newSiteName.trim());
    setNewSiteName('');
    loadData();
  };

  const handleConfirmDeleteReport = (id: string) => {
    setTargetDeleteId(id);
    setShowDeleteConfirm(true);
  };

  const handleDeleteReportExecute = async () => {
    if (targetDeleteId) {
      await reportService.deleteReport(targetDeleteId);
      await loadData();
    }
    setShowDeleteConfirm(false);
    setTargetDeleteId(null);
  };

  const handleToggleCheck = async (report: Report) => {
    if (!user) return;
    await reportService.checkReport(report.id, user.id, !report.checked);
    loadData();
  };

  // 絞り込まれたデータを生成
  const filteredReports = useMemo(() => {
    return reports.filter(r => {
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
  }, [reports, filterSite, filterMonth]);

  const handleExportCSV = () => {
    exportToCSV(filteredReports, sites);
  };

  const handleExportTSV = () => {
    exportToTSV(filteredReports, sites);
  };

  const handlePrint = () => {
    printReports(filteredReports, 'ヒヤリ・ハット報告一覧');
  };

  // 表示する会社のみ抽出
  const displayedEmployees = employees.filter(emp => emp.companyType === displayCompanyType);
  const companyStyles = {
    matsuura: {
      bg: 'bg-blue-50',
      text: 'text-blue-700',
      badgeBg: 'bg-blue-100',
      name: '松浦建設株式会社'
    },
    partner: {
      bg: 'bg-green-50',
      text: 'text-green-700',
      badgeBg: 'bg-green-100',
      name: '協力会社'
    }
  };
  const currentCompanyStyle = companyStyles[displayCompanyType];

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden relative">
      <div className="bg-gray-800 p-4 flex items-center gap-4">
        <button onClick={() => navigate('/')} className="p-2 bg-white/20 hover:bg-white/30 rounded-full transition-colors">
          <ArrowLeft size={24} className="text-white" />
        </button>
        <h2 className="text-xl font-bold text-white">管理者メニュー</h2>
      </div>

      <div className="flex border-b border-gray-200 overflow-x-auto">
        <button 
          className={`flex-1 min-w-[80px] py-4 font-bold flex justify-center items-center gap-2 ${activeTab === 'reports' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500'}`}
          onClick={() => setActiveTab('reports')}
        >
          <FileText size={20} /> <span className="hidden sm:inline">報告</span>
        </button>
        <button 
          className={`flex-1 min-w-[80px] py-4 font-bold flex justify-center items-center gap-2 ${activeTab === 'export' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500'}`}
          onClick={() => setActiveTab('export')}
        >
          <Database size={20} /> <span className="hidden sm:inline">出力</span>
        </button>
        <button 
          className={`flex-1 min-w-[80px] py-4 font-bold flex justify-center items-center gap-2 ${activeTab === 'employees' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500'}`}
          onClick={() => setActiveTab('employees')}
        >
          <Users size={20} /> <span className="hidden sm:inline">社員</span>
        </button>
        <button 
          className={`flex-1 min-w-[80px] py-4 font-bold flex justify-center items-center gap-2 ${activeTab === 'sites' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500'}`}
          onClick={() => setActiveTab('sites')}
        >
          <Building size={20} /> <span className="hidden sm:inline">現場</span>
        </button>
      </div>

      <div className="p-6">
        {activeTab === 'reports' && (
          <div>
            <h3 className="text-lg font-bold text-gray-800 mb-4">報告データ管理</h3>
            <div className="divide-y divide-gray-100 border border-gray-200 rounded-lg overflow-hidden">
              {reports.map(report => (
                <div key={report.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-gray-50">
                  <div className="flex-1 min-w-0" onClick={() => navigate(`/report/${report.id}`)} style={{ cursor: 'pointer' }}>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-bold text-gray-600">{formatDate(report.incidentDate)}</span>
                      <span className="text-xs px-2 py-1 bg-blue-100 text-blue-800 rounded-full font-medium">
                        {report.siteName}
                      </span>
                      <span className="text-xs text-gray-500">{report.reporterName}</span>
                    </div>
                    <p className="text-gray-800 text-sm line-clamp-1">{report.content}</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button 
                      onClick={() => handleToggleCheck(report)}
                      className={`px-3 py-1.5 rounded text-sm font-bold flex items-center gap-1 ${report.checked ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}
                    >
                      {report.checked ? <CheckCircle size={16} /> : <Clock size={16} />}
                      {report.checked ? '確認済' : '未確認'}
                    </button>
                    <button 
                      onClick={() => navigate(`/report/edit/${report.id}`)}
                      className="px-3 py-1.5 rounded text-sm font-bold bg-blue-100 text-blue-700"
                    >
                      編集
                    </button>
                    <button 
                      onClick={() => handleConfirmDeleteReport(report.id)}
                      className="px-3 py-1.5 rounded text-sm font-bold bg-red-100 text-red-700"
                    >
                      削除
                    </button>
                  </div>
                </div>
              ))}
              {reports.length === 0 && (
                <div className="p-8 text-center text-gray-500">報告がありません</div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'export' && (
          <div className="space-y-6">
            <h3 className="text-lg font-bold text-gray-800 mb-4">データ出力（絞り込み対応）</h3>
            
            <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 mb-6">
              <div className="flex items-center gap-2 mb-3 text-gray-700 font-medium">
                <Filter size={20} />
                <span>出力するデータを絞り込む</span>
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
              <div className="mt-3 text-sm font-bold text-blue-700 bg-blue-50 py-2 px-3 rounded inline-block">
                現在の出力対象: {filteredReports.length} 件
              </div>
            </div>

            <div className="grid gap-4">
              <Button variant="outline" size="lg" className="justify-start gap-4" onClick={handleExportCSV} disabled={filteredReports.length === 0}>
                <Download size={24} className="text-green-600" />
                <span>CSV形式でダウンロード</span>
              </Button>
              <Button variant="outline" size="lg" className="justify-start gap-4" onClick={handleExportTSV} disabled={filteredReports.length === 0}>
                <Download size={24} className="text-purple-600" />
                <span>TSV形式でダウンロード（Excel向け）</span>
              </Button>
              <Button variant="outline" size="lg" className="justify-start gap-4" onClick={handlePrint} disabled={filteredReports.length === 0}>
                <Printer size={24} className="text-blue-600" />
                <span>一覧を印刷 / PDF保存</span>
              </Button>
            </div>
          </div>
        )}

        {activeTab === 'employees' && (
          <div>
            <h3 className="text-lg font-bold text-gray-800 mb-4">社員マスタ管理</h3>
            
            <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 mb-8">
              <h4 className="text-sm font-bold text-gray-700 mb-3">新しい社員を追加</h4>
              <form onSubmit={handleAddEmployee} className="flex flex-col sm:flex-row gap-2">
                <input 
                  type="text" 
                  className="flex-1 p-3 border border-gray-300 rounded-lg"
                  placeholder="新しい社員名"
                  value={newEmpName}
                  onChange={(e) => setNewEmpName(e.target.value)}
                />
                <select
                  className="p-3 border border-gray-300 rounded-lg bg-white"
                  value={newEmpCompanyType}
                  onChange={(e) => setNewEmpCompanyType(e.target.value as CompanyType)}
                >
                  <option value="matsuura">松浦建設株式会社</option>
                  <option value="partner">協力会社</option>
                </select>
                <Button type="submit" variant="secondary" className="whitespace-nowrap">追加</Button>
              </form>
            </div>

            <div className="mb-4">
              <label className="block text-gray-700 font-bold mb-2">表示する会社を選択</label>
              <div className="relative max-w-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Building className="text-gray-400" size={20} />
                </div>
                <select
                  className="w-full pl-10 p-3 border-2 border-gray-300 rounded-lg bg-white font-medium focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none"
                  value={displayCompanyType}
                  onChange={(e) => setDisplayCompanyType(e.target.value as CompanyType)}
                >
                  <option value="matsuura">松浦建設株式会社 の社員を表示</option>
                  <option value="partner">協力会社 の社員を表示</option>
                </select>
              </div>
            </div>

            <div className="mb-6">
              <h4 className={`text-md font-bold text-gray-700 ${currentCompanyStyle.bg} p-3 rounded-t-lg border border-gray-200 border-b-0 flex items-center justify-between transition-colors`}>
                <span>{currentCompanyStyle.name}</span>
                <span className={`text-sm font-normal ${currentCompanyStyle.text} ${currentCompanyStyle.badgeBg} px-2 py-0.5 rounded-full transition-colors`}>{displayedEmployees.length}名</span>
              </h4>
              <div className="divide-y divide-gray-100 border border-gray-200 rounded-b-lg overflow-hidden bg-white">
                {displayedEmployees.map(emp => (
                  <div key={emp.id} className="flex items-center justify-between p-4">
                    <span className="font-medium text-gray-800">{emp.name}</span>
                    <button 
                      onClick={() => confirmDeleteMaster('employee', emp.id)}
                      className="px-3 py-1 rounded text-sm font-bold bg-red-100 text-red-700 hover:bg-red-200 transition-colors"
                    >
                      削除する
                    </button>
                  </div>
                ))}
                {displayedEmployees.length === 0 && (
                  <div className="p-8 text-center text-gray-500">社員が登録されていません</div>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'sites' && (
          <div>
            <h3 className="text-lg font-bold text-gray-800 mb-4">現場マスタ管理</h3>
            <form onSubmit={handleAddSite} className="flex gap-2 mb-6">
              <input 
                type="text" 
                className="flex-1 p-3 border border-gray-300 rounded-lg"
                placeholder="新しい現場名"
                value={newSiteName}
                onChange={(e) => setNewSiteName(e.target.value)}
              />
              <Button type="submit" variant="secondary">追加</Button>
            </form>
            <div className="divide-y divide-gray-100 border border-gray-200 rounded-lg">
              {sites.map(site => (
                <div key={site.id} className="flex items-center justify-between p-4">
                  <span className="font-medium text-gray-800">{site.name}</span>
                  <button 
                    onClick={() => confirmDeleteMaster('site', site.id)}
                    className="px-3 py-1 rounded text-sm font-bold bg-red-100 text-red-700 hover:bg-red-200"
                  >
                    削除する
                  </button>
                </div>
              ))}
            </div>
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
                  onClick={handleDeleteReportExecute}
                >
                  削除する
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showDeleteMasterConfirm && (
        <div className="absolute inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-sm overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-6 text-center">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Trash2 className="text-red-600" size={32} />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                この{targetDeleteMasterType === 'employee' ? '社員' : '現場'}を削除しますか？
              </h3>
              <p className="text-gray-500 mb-6">この操作は取り消せません。</p>
              
              <div className="flex gap-3">
                <Button 
                  variant="outline" 
                  className="flex-1"
                  onClick={() => setShowDeleteMasterConfirm(false)}
                >
                  キャンセル
                </Button>
                <Button 
                  variant="primary" 
                  className="flex-1 !bg-red-600 hover:!bg-red-700 !border-red-600"
                  onClick={handleDeleteMasterExecute}
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
