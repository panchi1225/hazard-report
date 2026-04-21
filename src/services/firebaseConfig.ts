import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: 'AIzaSyDebtRNnwt3gxIQOxpCoBC1TBhDu_EaFmc',
  authDomain: 'matsuura-hazard-report.firebaseapp.com',
  projectId: 'matsuura-hazard-report',
  storageBucket: 'matsuura-hazard-report.firebasestorage.app',
  messagingSenderId: '228012777921',
  appId: '1:228012777921:web:461519397cd25177860f40',
};

export const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const isFirebaseEnabled = true;
