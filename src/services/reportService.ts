import { Report } from '../types';
import { db, isFirebaseEnabled } from './firebaseConfig';
import {
  collection,
  getDocs,
  getDoc,
  addDoc,
  updateDoc,
  doc,
} from 'firebase/firestore';

const REPORTS_COLLECTION = 'reports';

const mapReport = (id: string, data: any): Report => ({
  id,
  incidentDate: data.incidentDate ?? '',
  siteId: data.siteId ?? '',
  siteName: data.siteName ?? '',
  reporterId: data.reporterId ?? '',
  reporterName: data.reporterName ?? '',
  content: data.content ?? '',
  createdByUserId: data.createdByUserId ?? '',
  createdByUserName: data.createdByUserName ?? '',
  createdAt: data.createdAt ?? '',
  updatedAt: data.updatedAt ?? '',
  checked: data.checked ?? false,
  checkedAt: data.checkedAt,
  checkedBy: data.checkedBy,
  deletedFlag: data.deletedFlag ?? false,
});

export const reportService = {
  getReports: async (): Promise<Report[]> => {
    if (!isFirebaseEnabled) return [];
    const snapshot = await getDocs(collection(db, REPORTS_COLLECTION));
    return snapshot.docs
      .map((d) => mapReport(d.id, d.data()))
      .filter((r) => !r.deletedFlag)
      .sort((a, b) => {
        if (a.siteId !== b.siteId) {
          return a.siteName.localeCompare(b.siteName);
        }
        return new Date(b.incidentDate).getTime() - new Date(a.incidentDate).getTime();
      });
  },

  getReportById: async (id: string): Promise<Report | undefined> => {
    if (!isFirebaseEnabled) return undefined;
    const snapshot = await getDoc(doc(db, REPORTS_COLLECTION, id));
    if (!snapshot.exists()) return undefined;
    const report = mapReport(snapshot.id, snapshot.data());
    if (report.deletedFlag) return undefined;
    return report;
  },

  addReport: async (
    report: Omit<Report, 'id' | 'createdAt' | 'updatedAt' | 'checked' | 'deletedFlag'>
  ): Promise<void> => {
    if (!isFirebaseEnabled) return;
    const now = new Date().toISOString();
    await addDoc(collection(db, REPORTS_COLLECTION), {
      ...report,
      createdAt: now,
      updatedAt: now,
      checked: false,
      deletedFlag: false,
    });
  },

  updateReport: async (id: string, updates: Partial<Report>): Promise<void> => {
    if (!isFirebaseEnabled) return;
    await updateDoc(doc(db, REPORTS_COLLECTION, id), {
      ...updates,
      updatedAt: new Date().toISOString(),
    });
  },

  deleteReport: async (id: string): Promise<void> => {
    if (!isFirebaseEnabled) return;
    await updateDoc(doc(db, REPORTS_COLLECTION, id), {
      deletedFlag: true,
      updatedAt: new Date().toISOString(),
    });
  },

  checkReport: async (id: string, adminId: string, checked: boolean): Promise<void> => {
    if (!isFirebaseEnabled) return;
    await updateDoc(doc(db, REPORTS_COLLECTION, id), {
      checked,
      checkedAt: checked ? new Date().toISOString() : undefined,
      checkedBy: checked ? adminId : undefined,
      updatedAt: new Date().toISOString(),
    });
  },
};
