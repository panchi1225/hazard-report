import { Employee, Site, CompanyType } from '../types';
import { LS_KEY_EMPLOYEES, LS_KEY_SITES } from '../utils/constants';
import { initialEmployees, initialSites } from './mockData';
import { storage } from '../utils/storage';

// --- Firebase 差し替えポイント ---
// Firebase移行時は、これらの関数を Firestore の getDocs, addDoc, updateDoc, deleteDoc に書き換えます。
// コレクション名: 'employees', 'sites'

const getEmployeesFromLS = (): Employee[] => {
  const data = storage.getItem(LS_KEY_EMPLOYEES);
  if (data) {
    const arr = JSON.parse(data);
    return arr.map((e: any) => ({
      ...e,
      companyType: e.companyType || 'partner'
    }));
  }
  storage.setItem(LS_KEY_EMPLOYEES, JSON.stringify(initialEmployees));
  return initialEmployees;
};

const getSitesFromLS = (): Site[] => {
  const data = storage.getItem(LS_KEY_SITES);
  if (data) return JSON.parse(data);
  storage.setItem(LS_KEY_SITES, JSON.stringify(initialSites));
  return initialSites;
};

export const masterService = {
  getEmployees: async (): Promise<Employee[]> => {
    return getEmployeesFromLS().filter(e => e.active);
  },
  getAllEmployees: async (): Promise<Employee[]> => {
    return getEmployeesFromLS();
  },
  addEmployee: async (name: string, companyType: CompanyType): Promise<Employee[]> => {
    const employees = getEmployeesFromLS();
    const newEmployee: Employee = {
      id: `emp_${Date.now()}`,
      name,
      companyType,
      active: true,
    };
    const updated = [...employees, newEmployee];
    storage.setItem(LS_KEY_EMPLOYEES, JSON.stringify(updated));
    return updated;
  },
  updateEmployee: async (id: string, name: string, companyType: CompanyType, active: boolean): Promise<void> => {
    const employees = getEmployeesFromLS();
    const updated = employees.map(e => e.id === id ? { ...e, name, companyType, active } : e);
    storage.setItem(LS_KEY_EMPLOYEES, JSON.stringify(updated));
  },
  deleteEmployee: async (id: string): Promise<void> => {
    const employees = getEmployeesFromLS();
    const updated = employees.filter(e => e.id !== id);
    storage.setItem(LS_KEY_EMPLOYEES, JSON.stringify(updated));
  },

  getSites: async (): Promise<Site[]> => {
    return getSitesFromLS().filter(s => s.active);
  },
  getAllSites: async (): Promise<Site[]> => {
    return getSitesFromLS();
  },
  addSite: async (name: string): Promise<void> => {
    const sites = getSitesFromLS();
    const newSite: Site = {
      id: `site_${Date.now()}`,
      name,
      active: true,
    };
    storage.setItem(LS_KEY_SITES, JSON.stringify([...sites, newSite]));
  },
  updateSite: async (id: string, name: string, active: boolean): Promise<void> => {
    const sites = getSitesFromLS();
    const updated = sites.map(s => s.id === id ? { ...s, name, active } : s);
    storage.setItem(LS_KEY_SITES, JSON.stringify(updated));
  },
  deleteSite: async (id: string): Promise<void> => {
    const sites = getSitesFromLS();
    const updated = sites.filter(s => s.id !== id);
    storage.setItem(LS_KEY_SITES, JSON.stringify(updated));
  },
};
