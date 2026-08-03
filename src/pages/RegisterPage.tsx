import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { authService } from '../services/auth.service';
import { PasswordStrengthMeter, checkPasswordStrength } from '../components/PasswordStrengthMeter';

export const RegisterPage: React.FC = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const { isStrong } = checkPasswordStrength(password);
  const passwordsMatch = password.length > 0 && password === confirmPassword;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!isStrong) {
      setError('La contraseña debe cumplir con todos los requisitos de seguridad');
      return;
    }

    if (!passwordsMatch) {
      setError('Las contraseñas no coinciden');
      return;
    }

    setIsLoading(true);

    try {
      const response = await authService.register(email, password, confirmPassword, name);
      login(response.token, response.user);
      navigate('/dashboard', { replace: true });
    } catch (err: any) {
      const backendError =
        err.response?.data?.error?.message ||
        err.response?.data?.message ||
        'Error al registrarse';
      setError(backendError);
    } finally {
      setIsLoading(false);
    }
  };

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
        <h2 style={{ marginBottom: '1.5rem', textAlign: 'center' }}>Crear Cuenta</h2>

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

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {/* Nombre completo */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
            <label htmlFor="name" style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
              Nombre completo
            </label>
            <input
              id="name"
              type="text"
              placeholder="Ej. Jane Doe"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              style={{ padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid var(--border)' }}
            />
          </div>

          {/* Email */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
            <label htmlFor="email" style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
              Correo electrónico
            </label>
            <input
              id="email"
              type="email"
              placeholder="tu@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              style={{ padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid var(--border)' }}
            />
          </div>

          {/* Contraseña */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
            <label htmlFor="password" style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
              Contraseña segura
            </label>
            <input
              id="password"
              type="password"
              placeholder="••••••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              style={{ padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid var(--border)' }}
            />

            {/* Medidor visual de fuerza de contraseña */}
            <PasswordStrengthMeter password={password} />
          </div>

          {/* Doble Confirmación de Contraseña */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', marginTop: '0.5rem' }}>
            <label htmlFor="confirmPassword" style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
              Confirmar contraseña
            </label>
            <input
              id="confirmPassword"
              type="password"
              placeholder="••••••••••••"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              style={{
                padding: '0.75rem',
                borderRadius: '0.5rem',
                border: confirmPassword.length > 0
                  ? passwordsMatch
                    ? '1px solid #10b981'
                    : '1px solid #ef4444'
                  : '1px solid var(--border)',
              }}
            />

            {confirmPassword.length > 0 && (
              <div
                style={{
                  fontSize: '0.8rem',
                  marginTop: '0.25rem',
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
              marginTop: '1rem',
              opacity: isLoading || !isStrong || !passwordsMatch ? 0.6 : 1,
              cursor: isLoading || !isStrong || !passwordsMatch ? 'not-allowed' : 'pointer',
            }}
          >
            {isLoading ? 'Registrando...' : 'Crear Cuenta'}
          </button>
        </form>

        <p style={{ marginTop: '1.25rem', textAlign: 'center', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
          ¿Ya tienes cuenta?{' '}
          <Link to="/login" style={{ color: 'var(--accent)', fontWeight: 500 }}>
            Inicia sesión
          </Link>
        </p>
      </div>
    </div>
  );
};
