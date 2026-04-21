import { User } from '../types';
import { LS_KEY_AUTH, COMMON_USER_PASSWORD, ADMIN_PASSWORD } from '../utils/constants';
import { storage } from '../utils/storage';

// --- Firebase 差し替えポイント ---
// Firebase移行時は、Firebase Auth (signInWithEmailAndPassword など) を使用するように書き換えます。

export const authService = {
  loginAsUser: async (employeeId: string, employeeName: string, password: string): Promise<User> => {
    if (password !== COMMON_USER_PASSWORD) {
      throw new Error('パスワードが違います');
    }
    const user: User = { id: employeeId, name: employeeName, role: 'user' };
    storage.setItem(LS_KEY_AUTH, JSON.stringify(user));
    return user;
  },

  loginAsAdmin: async (password: string): Promise<User> => {
    if (password !== ADMIN_PASSWORD) {
      throw new Error('パスワードが違います');
    }
    const user: User = { id: 'admin', name: '管理者', role: 'admin' };
    storage.setItem(LS_KEY_AUTH, JSON.stringify(user));
    return user;
  },

  logout: async (): Promise<void> => {
    storage.removeItem(LS_KEY_AUTH);
  },

  getCurrentUser: (): User | null => {
    const data = storage.getItem(LS_KEY_AUTH);
    return data ? JSON.parse(data) : null;
  }
};
