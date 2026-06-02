import { useNavigate } from 'react-router-dom';
import { Bell, LogOut } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import './Header.css';

export const Header: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  const displayName = user?.name || user?.email?.split('@')[0] || 'Atleta';

  return (
    <header className="header glass-panel">
      <div className="header-content">
        <div className="header-greeting">
          <span className="greeting-text">Bienvenido,</span>
          <h2 className="greeting-name">{displayName}</h2>
        </div>
        <div className="header-actions">
          <button className="icon-btn" title="Notificaciones">
            <Bell size={20} />
          </button>
          <button
            className="icon-btn"
            onClick={handleLogout}
            title="Cerrar sesión"
            style={{ color: 'var(--text-secondary)' }}
          >
            <LogOut size={20} />
          </button>
        </div>
      </div>
    </header>
  );
};
