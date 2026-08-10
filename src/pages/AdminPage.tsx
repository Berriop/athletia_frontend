import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { useNotification } from '../contexts/NotificationContext';
import { ShieldOff, ShieldCheck, Loader2, Users } from 'lucide-react';

interface AdminUser {
  id: string;
  email: string;
  name: string | null;
  role: string;
  isBlocked: boolean;
  isEmailVerified: boolean;
  createdAt: string;
}

export const AdminPage: React.FC = () => {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const { user: currentUser } = useAuth();
  const { addNotification } = useNotification();

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const res = await api.get<{ data: AdminUser[] }>('/admin/users');
        setUsers(res.data.data);
      } catch {
        addNotification('Error al cargar usuarios', 'error');
      } finally {
        setLoading(false);
      }
    };
    fetchUsers();
  }, []);

  const handleToggleBlock = async (userId: string) => {
    if (userId === currentUser?.id) {
      addNotification('No puedes bloquear tu propia cuenta de administrador', 'error');
      return;
    }
    setTogglingId(userId);
    try {
      const res = await api.patch<{ data: AdminUser }>(`/admin/users/${userId}/toggle-block`, {});
      const updated = res.data.data;
      setUsers(prev => prev.map(u => u.id === userId ? updated : u));
      addNotification(
        updated.isBlocked ? 'Usuario bloqueado' : 'Usuario desbloqueado',
        updated.isBlocked ? 'error' : 'success'
      );
    } catch (err: any) {
      addNotification(err.response?.data?.error?.message || 'Error al cambiar el estado del usuario', 'error');
    } finally {
      setTogglingId(null);
    }
  };

  return (
    <div className="page-container">
      <h1 className="page-title" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        <Users size={28} /> Panel de Administración
      </h1>
      <p className="page-subtitle">Gestiona los usuarios de la plataforma</p>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', marginTop: '4rem' }}>
          <Loader2 size={40} className="spinner" style={{ color: 'var(--primary)' }} />
        </div>
      ) : (
        <div className="card glass-panel" style={{ padding: 0, overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border)', background: 'rgba(255,255,255,0.03)' }}>
                <th style={thStyle}>Usuario</th>
                <th style={thStyle}>Email</th>
                <th style={thStyle}>Rol</th>
                <th style={thStyle}>Email verificado</th>
                <th style={thStyle}>Estado</th>
                <th style={thStyle}>Acción</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => {
                const isSelf = u.id === currentUser?.id;
                return (
                  <tr key={u.id} style={{ borderBottom: '1px solid var(--border)', opacity: u.isBlocked ? 0.6 : 1, transition: 'opacity 0.2s' }}>
                    <td style={tdStyle}>
                      {u.name || '—'} {isSelf && <span style={{ fontSize: '0.75rem', color: 'var(--primary)', fontWeight: 600 }}>(Tú)</span>}
                    </td>
                    <td style={tdStyle}>{u.email}</td>
                    <td style={tdStyle}>
                      <span style={{
                        padding: '0.2rem 0.6rem', borderRadius: '99px', fontSize: '0.78rem', fontWeight: 600,
                        backgroundColor: u.role === 'ADMIN' ? 'rgba(139,92,246,0.2)' : 'rgba(99,102,241,0.15)',
                        color: u.role === 'ADMIN' ? '#a78bfa' : '#818cf8',
                      }}>{u.role}</span>
                    </td>
                    <td style={tdStyle}>
                      <span style={{ color: u.isEmailVerified ? 'var(--success)' : 'var(--warning)', fontWeight: 600 }}>
                        {u.isEmailVerified ? '✓ Verificado' : '✗ Pendiente'}
                      </span>
                    </td>
                    <td style={tdStyle}>
                      <span style={{
                        padding: '0.2rem 0.6rem', borderRadius: '99px', fontSize: '0.78rem', fontWeight: 600,
                        backgroundColor: u.isBlocked ? 'rgba(239,68,68,0.2)' : 'rgba(34,197,94,0.2)',
                        color: u.isBlocked ? '#f87171' : '#4ade80',
                      }}>
                        {u.isBlocked ? 'Bloqueado' : 'Activo'}
                      </span>
                    </td>
                    <td style={tdStyle}>
                      <button
                        onClick={() => handleToggleBlock(u.id)}
                        disabled={isSelf || togglingId === u.id}
                        title={isSelf ? 'No puedes bloquearte a ti mismo' : (u.isBlocked ? 'Desbloquear' : 'Bloquear')}
                        style={{
                          display: 'inline-flex', alignItems: 'center', gap: '0.4rem',
                          padding: '0.4rem 0.8rem', borderRadius: '6px', cursor: isSelf ? 'not-allowed' : 'pointer',
                          border: 'none', fontWeight: 600, fontSize: '0.85rem', transition: 'all 0.2s',
                          opacity: isSelf ? 0.4 : 1,
                          backgroundColor: u.isBlocked ? 'rgba(34,197,94,0.15)' : 'rgba(239,68,68,0.15)',
                          color: u.isBlocked ? '#4ade80' : '#f87171',
                        }}
                      >
                        {togglingId === u.id
                          ? <Loader2 size={14} className="spinner" />
                          : u.isBlocked
                            ? <><ShieldCheck size={14} /> Desbloquear</>
                            : <><ShieldOff size={14} /> Bloquear</>
                        }
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {users.length === 0 && (
            <p style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)' }}>
              No hay usuarios registrados.
            </p>
          )}
        </div>
      )}
    </div>
  );
};

const thStyle: React.CSSProperties = {
  padding: '0.85rem 1.25rem',
  textAlign: 'left',
  fontSize: '0.8rem',
  fontWeight: 700,
  color: 'var(--text-secondary)',
  textTransform: 'uppercase',
  letterSpacing: '0.05em',
};

const tdStyle: React.CSSProperties = {
  padding: '0.9rem 1.25rem',
  fontSize: '0.9rem',
  color: 'var(--text-primary)',
};
