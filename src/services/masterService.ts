import { Employee, Site, CompanyType } from '../types';
import { db, isFirebaseEnabled } from './firebaseConfig';
import {
  collection,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
} from 'firebase/firestore';

const EMPLOYEES_COLLECTION = 'employees';
const SITES_COLLECTION = 'sites';

const mapEmployee = (id: string, data: any): Employee => ({
  id,
  name: data.name ?? '',
  companyType: (data.companyType as CompanyType) || 'partner',
  active: data.active ?? true,
});

const mapSite = (id: string, data: any): Site => ({
  id,
  name: data.name ?? '',
  active: data.active ?? true,
});

export const masterService = {
  getEmployees: async (): Promise<Employee[]> => {
    if (!isFirebaseEnabled) return [];
    const snapshot = await getDocs(collection(db, EMPLOYEES_COLLECTION));
    return snapshot.docs
      .map((d) => mapEmployee(d.id, d.data()))
      .filter((e) => e.active);
  },

  getAllEmployees: async (): Promise<Employee[]> => {
    if (!isFirebaseEnabled) return [];
    const snapshot = await getDocs(collection(db, EMPLOYEES_COLLECTION));
    return snapshot.docs.map((d) => mapEmployee(d.id, d.data()));
  },

  addEmployee: async (name: string, companyType: CompanyType): Promise<Employee[]> => {
    if (!isFirebaseEnabled) return [];
    await addDoc(collection(db, EMPLOYEES_COLLECTION), {
      name,
      companyType,
      active: true,
    });
    return await masterService.getAllEmployees();
  },

  updateEmployee: async (
    id: string,
    name: string,
    companyType: CompanyType,
    active: boolean
  ): Promise<void> => {
    if (!isFirebaseEnabled) return;
    await updateDoc(doc(db, EMPLOYEES_COLLECTION, id), {
      name,
      companyType,
      active,
    });
  },

  deleteEmployee: async (id: string): Promise<void> => {
    if (!isFirebaseEnabled) return;
    await deleteDoc(doc(db, EMPLOYEES_COLLECTION, id));
  },

  getSites: async (): Promise<Site[]> => {
    if (!isFirebaseEnabled) return [];
    const snapshot = await getDocs(collection(db, SITES_COLLECTION));
    return snapshot.docs
      .map((d) => mapSite(d.id, d.data()))
      .filter((s) => s.active);
  },

  getAllSites: async (): Promise<Site[]> => {
    if (!isFirebaseEnabled) return [];
    const snapshot = await getDocs(collection(db, SITES_COLLECTION));
    return snapshot.docs.map((d) => mapSite(d.id, d.data()));
  },

  addSite: async (name: string): Promise<void> => {
    if (!isFirebaseEnabled) return;
    await addDoc(collection(db, SITES_COLLECTION), {
      name,
      active: true,
    });
  },

  updateSite: async (id: string, name: string, active: boolean): Promise<void> => {
    if (!isFirebaseEnabled) return;
    await updateDoc(doc(db, SITES_COLLECTION, id), {
      name,
      active,
    });
  },

  deleteSite: async (id: string): Promise<void> => {
    if (!isFirebaseEnabled) return;
    await deleteDoc(doc(db, SITES_COLLECTION, id));
  },
};
