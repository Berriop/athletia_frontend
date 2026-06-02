import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { 
  Activity, 
  Apple, 
  Moon, 
  Bandage, 
  User as UserIcon, 
  LayoutDashboard,
  Menu,
  ChevronLeft,
  LogOut
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import './Sidebar.css';

export const Sidebar: React.FC = () => {
  const [collapsed, setCollapsed] = useState(false);
  const { logout } = useAuth();
  const navigate = useNavigate();

  const toggleSidebar = () => {
    setCollapsed(!collapsed);
  };

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  const navItems = [
    { path: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { path: '/workouts', icon: Activity, label: 'Entrenamientos' },
    { path: '/meals', icon: Apple, label: 'Alimentación' },
    { path: '/sleep', icon: Moon, label: 'Sueño' },
    { path: '/injuries', icon: Bandage, label: 'Lesiones' },
    { path: '/profile', icon: UserIcon, label: 'Perfil' },
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

      <div className="sidebar-footer">
        <button
          className="nav-item logout-btn"
          onClick={handleLogout}
          title={collapsed ? 'Cerrar sesión' : undefined}
        >
          <LogOut size={24} className="nav-icon" />
          {!collapsed && <span className="nav-label">Cerrar sesión</span>}
        </button>
      </div>
    </aside>
  );
};
