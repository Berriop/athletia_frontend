import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, LogOut, CheckCircle, XCircle, Info, Trash2 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useNotification } from '../contexts/NotificationContext';
import './Header.css';

export const Header: React.FC = () => {
  const { user, logout } = useAuth();
  const { notifications, removeNotification, clearNotifications } = useNotification();
  const navigate = useNavigate();
  const [showNotifications, setShowNotifications] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const displayName = user?.name || user?.email?.split('@')[0] || 'Atleta';
  const unreadCount = notifications.length;

  const getIconForType = (type: string) => {
    switch (type) {
      case 'success': return <CheckCircle size={16} color="green" />;
      case 'error': return <XCircle size={16} color="red" />;
      default: return <Info size={16} color="blue" />;
    }
  };

  return (
    <header className="header glass-panel">
      <div className="header-content">
        <div className="header-greeting">
          <span className="greeting-text">Bienvenido,</span>
          <h2 className="greeting-name">{displayName}</h2>
        </div>
        <div className="header-actions">
          <div className="notification-wrapper" ref={dropdownRef} style={{ position: 'relative' }}>
            <button 
              className="icon-btn" 
              title="Notificaciones"
              onClick={() => setShowNotifications(!showNotifications)}
              style={{ position: 'relative' }}
            >
              <Bell size={20} />
              {unreadCount > 0 && (
                <span className="notification-badge">{unreadCount > 9 ? '9+' : unreadCount}</span>
              )}
            </button>

            {showNotifications && (
              <div className="notification-dropdown">
                <div className="notification-header">
                  <h4>Notificaciones</h4>
                  {unreadCount > 0 && (
                    <button className="clear-btn" onClick={clearNotifications}>Limpiar</button>
                  )}
                </div>
                <div className="notification-list">
                  {notifications.length === 0 ? (
                    <div className="notification-empty">No tienes notificaciones nuevas</div>
                  ) : (
                    notifications.map(notif => (
                      <div key={notif.id} className={`notification-item ${notif.type}`}>
                        <div className="notification-icon">
                          {getIconForType(notif.type)}
                        </div>
                        <div className="notification-content">
                          <p>{notif.message}</p>
                          <span className="notification-time">
                            {notif.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        <button className="delete-notif-btn" onClick={() => removeNotification(notif.id)}>
                          <Trash2 size={14} />
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
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
