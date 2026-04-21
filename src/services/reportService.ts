import { Report } from '../types';
import { LS_KEY_REPORTS } from '../utils/constants';
import { initialReports } from './mockData';
import { storage } from '../utils/storage';

// --- Firebase 差し替えポイント ---
// Firebase移行時は、これらの関数を Firestore の getDocs, addDoc, updateDoc に書き換えます。
// コレクション名: 'reports'

const getReportsFromLS = (): Report[] => {
  const data = storage.getItem(LS_KEY_REPORTS);
  if (data) return JSON.parse(data);
  storage.setItem(LS_KEY_REPORTS, JSON.stringify(initialReports));
  return initialReports;
};

export const reportService = {
  getReports: async (): Promise<Report[]> => {
    return getReportsFromLS().filter(r => !r.deletedFlag).sort((a, b) => {
      // 現場別優先、その中で新しい順
      if (a.siteId !== b.siteId) {
        return a.siteName.localeCompare(b.siteName);
      }
      return new Date(b.incidentDate).getTime() - new Date(a.incidentDate).getTime();
    });
  },
  
  getReportById: async (id: string): Promise<Report | undefined> => {
    return getReportsFromLS().find(r => r.id === id && !r.deletedFlag);
  },

  addReport: async (report: Omit<Report, 'id' | 'createdAt' | 'updatedAt' | 'checked' | 'deletedFlag'>): Promise<void> => {
    const reports = getReportsFromLS();
    const now = new Date().toISOString();
    const newReport: Report = {
      ...report,
      id: `rep_${Date.now()}`,
      createdAt: now,
      updatedAt: now,
      checked: false,
      deletedFlag: false,
    };
    storage.setItem(LS_KEY_REPORTS, JSON.stringify([...reports, newReport]));
  },

  updateReport: async (id: string, updates: Partial<Report>): Promise<void> => {
    const reports = getReportsFromLS();
    const updated = reports.map(r => r.id === id ? { ...r, ...updates, updatedAt: new Date().toISOString() } : r);
    storage.setItem(LS_KEY_REPORTS, JSON.stringify(updated));
  },

  deleteReport: async (id: string): Promise<void> => {
    const reports = getReportsFromLS();
    const updated = reports.map(r => r.id === id ? { ...r, deletedFlag: true, updatedAt: new Date().toISOString() } : r);
    storage.setItem(LS_KEY_REPORTS, JSON.stringify(updated));
  },

  checkReport: async (id: string, adminId: string, checked: boolean): Promise<void> => {
    const reports = getReportsFromLS();
    const updated = reports.map(r => r.id === id ? { 
      ...r, 
      checked, 
      checkedAt: checked ? new Date().toISOString() : undefined,
      checkedBy: checked ? adminId : undefined,
      updatedAt: new Date().toISOString() 
    } : r);
    storage.setItem(LS_KEY_REPORTS, JSON.stringify(updated));
  }
};
