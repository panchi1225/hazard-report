/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { Layout } from './components/Layout';
import { AuthGuard } from './components/AuthGuard';
import { ScrollToTop } from './components/ScrollToTop';
import { Login } from './pages/Login';
import { Home } from './pages/Home';
import { ReportForm } from './pages/ReportForm';
import { ReportList } from './pages/ReportList';
import { ReportDetail } from './pages/ReportDetail';
import { Ranking } from './pages/Ranking';
import { Admin } from './pages/Admin';

export default function App() {
  return (
    <AuthProvider>
      <HashRouter>
        <div id="page-top-anchor" style={{ position: 'absolute', top: 0, left: 0, width: 0, height: 0, visibility: 'hidden', pointerEvents: 'none' }} />
        <ScrollToTop />
        <Routes>
          <Route path="/login" element={<Login />} />
          
          <Route path="/" element={<AuthGuard><Layout /></AuthGuard>}>
            <Route index element={<Home />} />
            <Route path="report/new" element={<ReportForm />} />
            <Route path="report/edit/:id" element={<ReportForm />} />
            <Route path="reports" element={<ReportList />} />
            <Route path="report/:id" element={<ReportDetail />} />
            <Route path="ranking" element={<Ranking />} />
            <Route path="admin" element={<Admin />} />
          </Route>
          
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </HashRouter>
    </AuthProvider>
  );
}
