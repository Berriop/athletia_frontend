import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { authService } from '../services/auth.service';
import { Lock, Loader2, AlertCircle, ArrowLeft, CheckCircle2 } from 'lucide-react';
import { PasswordStrengthMeter, checkPasswordStrength } from '../components/PasswordStrengthMeter';

export const ResetPasswordPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const navigate = useNavigate();

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const { isStrong } = checkPasswordStrength(password);
  const passwordsMatch = password.length > 0 && password === confirmPassword;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!token) {
      setError('Enlace inválido o sin token de seguridad');
      return;
    }

    if (!isStrong) {
      setError('La nueva contraseña debe cumplir con los requisitos de seguridad');
      return;
    }

    if (!passwordsMatch) {
      setError('Las contraseñas no coinciden');
      return;
    }

    setIsLoading(true);
    try {
      await authService.resetPassword(token, password);
      setIsSuccess(true);
      setTimeout(() => {
        navigate('/login');
      }, 2500);
    } catch (err: any) {
      setError(
        err.response?.data?.error?.message ||
        err.response?.data?.message ||
        'El enlace de recuperación es inválido o ha expirado.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  if (!token) {
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
          <AlertCircle size={48} style={{ color: '#ef4444', margin: '0 auto 1rem auto', display: 'block' }} />
          <h2 style={{ marginBottom: '0.5rem', color: '#ef4444' }}>Enlace Inválido</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
            No se detectó un token de seguridad válido. Por favor, solicita un nuevo enlace de recuperación.
          </p>
          <Link
            to="/forgot-password"
            className="btn-primary"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', textDecoration: 'none' }}
          >
            Solicitar Nuevo Enlace
          </Link>
        </div>
      </div>
    );
  }

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

      <div className="card glass-panel" style={{ width: '100%', maxWidth: '440px' }}>
        <h2 style={{ marginBottom: '0.5rem', textAlign: 'center' }}>Nueva Contraseña</h2>
        <p
          style={{
            marginBottom: '1.5rem',
            textAlign: 'center',
            color: 'var(--text-secondary)',
            fontSize: '0.9rem',
          }}
        >
          Crea una nueva contraseña segura para volver a ingresar a tu cuenta.
        </p>

        {error && (
          <div
            style={{
              color: '#ef4444',
              backgroundColor: 'rgba(239, 68, 68, 0.1)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              padding: '0.75rem',
              borderRadius: '0.5rem',
              marginBottom: '1.25rem',
              textAlign: 'center',
              fontSize: '0.9rem',
            }}
          >
            {error}
          </div>
        )}

        {isSuccess ? (
          <div
            style={{
              textAlign: 'center',
              padding: '1.5rem 1rem',
              backgroundColor: 'rgba(16, 185, 129, 0.08)',
              borderRadius: '0.75rem',
              border: '1px solid rgba(16, 185, 129, 0.2)',
              marginBottom: '1rem',
            }}
          >
            <CheckCircle2
              size={48}
              style={{ color: '#10b981', margin: '0 auto 1rem auto', display: 'block' }}
            />
            <h3 style={{ fontSize: '1.1rem', marginBottom: '0.5rem', color: 'var(--text-primary)' }}>
              ¡Contraseña Restablecida!
            </h3>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', margin: 0 }}>
              Tu contraseña ha sido actualizada con éxito. Serás redirigido al inicio de sesión en unos segundos...
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
            {/* Nueva contraseña */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
              <label htmlFor="password" style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                Nueva Contraseña
              </label>
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                <Lock
                  size={18}
                  style={{
                    position: 'absolute',
                    left: '0.85rem',
                    color: 'var(--text-secondary)',
                    pointerEvents: 'none',
                  }}
                />
                <input
                  id="password"
                  type="password"
                  placeholder="••••••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  style={{
                    width: '100%',
                    padding: '0.75rem 0.75rem 0.75rem 2.6rem',
                    borderRadius: '0.5rem',
                    border: '1px solid var(--border)',
                    backgroundColor: 'var(--background)',
                    color: 'var(--text-primary)',
                    fontSize: '0.95rem',
                  }}
                />
              </div>
              <PasswordStrengthMeter password={password} />
            </div>

            {/* Confirmar contraseña */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', marginTop: '0.25rem' }}>
              <label htmlFor="confirmPassword" style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                Confirmar Nueva Contraseña
              </label>
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                <Lock
                  size={18}
                  style={{
                    position: 'absolute',
                    left: '0.85rem',
                    color: 'var(--text-secondary)',
                    pointerEvents: 'none',
                  }}
                />
                <input
                  id="confirmPassword"
                  type="password"
                  placeholder="••••••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  style={{
                    width: '100%',
                    padding: '0.75rem 0.75rem 0.75rem 2.6rem',
                    borderRadius: '0.5rem',
                    border: confirmPassword.length > 0
                      ? passwordsMatch
                        ? '1px solid #10b981'
                        : '1px solid #ef4444'
                      : '1px solid var(--border)',
                    backgroundColor: 'var(--background)',
                    color: 'var(--text-primary)',
                    fontSize: '0.95rem',
                  }}
                />
              </div>

              {confirmPassword.length > 0 && (
                <div
                  style={{
                    fontSize: '0.8rem',
                    marginTop: '0.2rem',
                    color: passwordsMatch ? '#10b981' : '#ef4444',
                    fontWeight: 500,
                  }}
                >
                  {passwordsMatch ? '✓ Las contraseñas coinciden' : '✗ Las contraseñas no coinciden'}
                </div>
              )}
            </div>

            <button
              type="submit"
              disabled={isLoading || !isStrong || !passwordsMatch}
              className="btn-primary"
              style={{
                marginTop: '0.75rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem',
                opacity: isLoading || !isStrong || !passwordsMatch ? 0.6 : 1,
                cursor: isLoading || !isStrong || !passwordsMatch ? 'not-allowed' : 'pointer',
              }}
            >
              {isLoading ? (
                <>
                  <Loader2 size={18} className="spinner" /> Guardando...
                </>
              ) : (
                'Guardar Nueva Contraseña'
              )}
            </button>
          </form>
        )}

        <div style={{ marginTop: '1.5rem', textAlign: 'center', borderTop: '1px solid var(--border)', paddingTop: '1.25rem' }}>
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
