import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { 
  Activity, 
  Apple, 
  Moon, 
  Bandage, 
  User as UserIcon, 
  LayoutDashboard,
  Menu,
  ChevronLeft
} from 'lucide-react';
import './Sidebar.css';

export const Sidebar: React.FC = () => {
  const [collapsed, setCollapsed] = useState(false);

  const toggleSidebar = () => {
    setCollapsed(!collapsed);
  };

  const navItems = [
    { path: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { path: '/workouts', icon: Activity, label: 'Workouts' },
    { path: '/meals', icon: Apple, label: 'Meals' },
    { path: '/sleep', icon: Moon, label: 'Sleep' },
    { path: '/injuries', icon: Bandage, label: 'Injuries' },
    { path: '/profile', icon: UserIcon, label: 'Profile' },
  ];

  return (
    <aside className={`sidebar glass-panel ${collapsed ? 'collapsed' : ''}`}>
      <div className="sidebar-header">
        {!collapsed && <h1 className="logo">Athletia</h1>}
        <button className="toggle-btn" onClick={toggleSidebar}>
          {collapsed ? <Menu size={24} /> : <ChevronLeft size={24} />}
        </button>
      </div>

      <nav className="sidebar-nav">
        {navItems.map((item) => (
          <NavLink 
            key={item.path} 
            to={item.path} 
            className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
            title={collapsed ? item.label : undefined}
          >
            <item.icon size={24} className="nav-icon" />
            {!collapsed && <span className="nav-label">{item.label}</span>}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
};
