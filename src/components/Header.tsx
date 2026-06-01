import React from 'react';
import { Bell, User } from 'lucide-react';
import './Header.css';

export const Header: React.FC = () => {
  return (
    <header className="header glass-panel">
      <div className="header-content">
        <div className="header-greeting">
          <span className="greeting-text">Welcome back,</span>
          <h2 className="greeting-name">Atleta</h2>
        </div>
        <div className="header-actions">
          <button className="icon-btn">
            <Bell size={20} />
          </button>
          <div className="user-avatar">
            <User size={20} />
          </div>
        </div>
      </div>
    </header>
  );
};
