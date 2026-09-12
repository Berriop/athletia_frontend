import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { authService } from '../services/auth.service';
import { Mail, Lock } from 'lucide-react';
import { AuthPageShell } from '../components/AuthPageShell';
import { AuthErrorBanner } from '../components/AuthErrorBanner';
import { AuthIconInput } from '../components/AuthIconInput';
import { AuthSubmitButton } from '../components/AuthSubmitButton';

export const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const response = await authService.login(email, password);
      login(response.token, response.user);
      navigate('/dashboard', { replace: true });
    } catch (err: any) {
      const backendMessage =
        err.response?.data?.error?.message ||
        err.response?.data?.message;

      if (backendMessage === 'Invalid credentials') {
        setError('Correo o contraseña incorrectos. Por favor, verifica tus datos.');
      } else if (backendMessage) {
        setError(backendMessage);
      } else {
        setError('Error al iniciar sesión. Comprueba tu conexión.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthPageShell>
      <h2 style={{ marginBottom: '0.5rem', textAlign: 'center' }}>Iniciar Sesión</h2>
      <p
        style={{
          marginBottom: '1.5rem',
          textAlign: 'center',
          color: 'var(--text-secondary)',
          fontSize: '0.9rem',
        }}
      >
        Ingresa tus credenciales para acceder a tu panel
      </p>

      {error && <AuthErrorBanner message={error} />}

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        <AuthIconInput
          id="email"
          label="Correo electrónico"
          icon={Mail}
          type="email"
          placeholder="tu@email.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          borderColor={error ? '#ef4444' : undefined}
        />

        <AuthIconInput
          id="password"
          label="Contraseña"
          labelRight={
            <Link
              to="/forgot-password"
              style={{ fontSize: '0.85rem', color: 'var(--accent)', textDecoration: 'none' }}
            >
              ¿Olvidaste tu contraseña?
            </Link>
          }
          icon={Lock}
          type="password"
          placeholder="••••••••••••"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          borderColor={error ? '#ef4444' : undefined}
        />

        <AuthSubmitButton isLoading={isLoading} loadingText="Entrando...">
          Iniciar Sesión
        </AuthSubmitButton>
      </form>

      <p
        style={{
          marginTop: '1.5rem',
          textAlign: 'center',
          color: 'var(--text-secondary)',
          fontSize: '0.9rem',
          borderTop: '1px solid var(--border)',
          paddingTop: '1.25rem',
        }}
      >
        ¿No tienes cuenta?{' '}
        <Link to="/register" style={{ color: 'var(--accent)', fontWeight: 600, textDecoration: 'none' }}>
          Regístrate aquí
        </Link>
      </p>
    </AuthPageShell>
  );
};
