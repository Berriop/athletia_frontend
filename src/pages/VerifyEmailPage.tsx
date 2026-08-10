import React, { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { authService } from '../services/auth.service';
import { CheckCircle2, AlertCircle, Loader2, ArrowLeft } from 'lucide-react';

export const VerifyEmailPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');

  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('Verificando tu cuenta...');

  useEffect(() => {
    if (!token) {
      setStatus('error');
      setMessage('Enlace de verificación inválido o ausente.');
      return;
    }

    const verify = async () => {
      try {
        await authService.verifyEmail(token);
        setStatus('success');
        setMessage('Tu correo electrónico ha sido verificado con éxito. ¡Ya puedes disfrutar de todas las funcionalidades!');
      } catch (err: any) {
        setStatus('error');
        setMessage(err.response?.data?.error?.message || 'No se pudo verificar el correo. Es posible que el token haya expirado.');
      }
    };

    verify();
  }, [token]);

  return (
    <div
      className="page-container"
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        padding: '2rem 1rem',
        flexDirection: 'column',
      }}
    >
      <h1 className="logo" style={{ fontSize: '3rem', marginBottom: '1.5rem' }}>
        <Link to="/" style={{ color: 'inherit', textDecoration: 'none' }}>
          Athletia
        </Link>
      </h1>

      <div className="card glass-panel" style={{ width: '100%', maxWidth: '420px', textAlign: 'center' }}>
        <h2 style={{ marginBottom: '1.5rem' }}>Verificación de Cuenta</h2>

        {status === 'loading' && (
          <div style={{ padding: '1rem 0' }}>
            <Loader2 size={48} className="spinner" style={{ color: 'var(--primary)', margin: '0 auto 1rem auto', display: 'block' }} />
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>{message}</p>
          </div>
        )}

        {status === 'success' && (
          <div
            style={{
              padding: '1.5rem 1rem',
              backgroundColor: 'rgba(16, 185, 129, 0.08)',
              borderRadius: '0.75rem',
              border: '1px solid rgba(16, 185, 129, 0.2)',
            }}
          >
            <CheckCircle2 size={48} style={{ color: '#10b981', margin: '0 auto 1rem auto', display: 'block' }} />
            <p style={{ color: 'var(--text-primary)', fontSize: '0.95rem', marginBottom: '1.5rem', lineHeight: '1.4' }}>
              {message}
            </p>
            <Link to="/login" className="btn-primary" style={{ display: 'inline-block', textDecoration: 'none', width: '100%' }}>
              Iniciar Sesión
            </Link>
          </div>
        )}

        {status === 'error' && (
          <div
            style={{
              padding: '1.5rem 1rem',
              backgroundColor: 'rgba(239, 68, 68, 0.08)',
              borderRadius: '0.75rem',
              border: '1px solid rgba(239, 68, 68, 0.2)',
            }}
          >
            <AlertCircle size={48} style={{ color: '#ef4444', margin: '0 auto 1rem auto', display: 'block' }} />
            <p style={{ color: 'var(--text-primary)', fontSize: '0.95rem', marginBottom: '1.5rem', lineHeight: '1.4' }}>
              {message}
            </p>
            <Link to="/login" className="btn-primary" style={{ display: 'inline-block', textDecoration: 'none', width: '100%' }}>
              Ir a Iniciar Sesión
            </Link>
          </div>
        )}

        <div style={{ marginTop: '1.5rem', borderTop: '1px solid var(--border)', paddingTop: '1.25rem' }}>
          <Link
            to="/login"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.4rem',
              color: 'var(--text-secondary)',
              fontSize: '0.9rem',
              textDecoration: 'none',
              fontWeight: 500,
            }}
          >
            <ArrowLeft size={16} /> Volver al Inicio de Sesión
          </Link>
        </div>
      </div>
    </div>
  );
};
