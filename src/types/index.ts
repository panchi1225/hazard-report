export type Role = 'user' | 'admin';

export interface User {
  id: string;
  name: string;
  role: Role;
}

export type CompanyType = 'matsuura' | 'partner';

export interface Employee {
  id: string;
  name: string;
  companyType: CompanyType;
  active: boolean;
}

export interface Site {
  id: string;
  name: string;
  active: boolean;
}

export interface Report {
  id: string;
  incidentDate: string; // YYYY-MM-DD
  siteId: string;
  siteName: string;
  reporterId: string;
  reporterName: string;
  content: string;
  createdByUserId: string;
  createdByUserName: string;
  createdAt: string; // ISO string
  updatedAt: string; // ISO string
  checked: boolean;
  checkedAt?: string;
  checkedBy?: string;
  deletedFlag: boolean;
}
