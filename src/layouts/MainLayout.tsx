import React from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from '../components/Sidebar';
import { Header } from '../components/Header';
import './MainLayout.css';

export const MainLayout: React.FC = () => {
  return (
    <div className="layout-container">
      <Sidebar />
      <main className="layout-main">
        <Header />
        <div className="layout-content">
          <Outlet />
        </div>
      </main>
    </div>
  );
};
