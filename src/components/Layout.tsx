import React from 'react';
import { Outlet } from 'react-router-dom';
import { Header } from './Header';

export const Layout: React.FC = () => {
  return (
    <div className="min-h-[100dvh] bg-gray-50 flex flex-col font-sans text-gray-800 relative">
      <Header />
      <main className="flex-1 w-full max-w-3xl mx-auto p-4 sm:p-6 pb-20">
        <Outlet />
      </main>
    </div>
  );
};
