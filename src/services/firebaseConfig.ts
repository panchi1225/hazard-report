/**
 * Firebase 差し替えポイント
 * 
 * 将来的に Firebase に移行する場合は、ここに Firebase の初期化コードを記述します。
 * 
 * 例:
 * import { initializeApp } from 'firebase/app';
 * import { getFirestore } from 'firebase/firestore';
 * import { getAuth } from 'firebase/auth';
 * 
 * const firebaseConfig = {
 *   apiKey: "YOUR_API_KEY",
 *   authDomain: "YOUR_AUTH_DOMAIN",
 *   projectId: "YOUR_PROJECT_ID",
 *   storageBucket: "YOUR_STORAGE_BUCKET",
 *   messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
 *   appId: "YOUR_APP_ID"
 * };
 * 
 * const app = initializeApp(firebaseConfig);
 * export const db = getFirestore(app);
 * export const auth = getAuth(app);
 * 
 * 必要な Firestore コレクション:
 * - employees (社員マスタ)
 * - sites (現場マスタ)
 * - reports (報告データ)
 */

export const isFirebaseEnabled = false;
