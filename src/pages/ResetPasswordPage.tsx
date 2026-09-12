import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { authService } from '../services/auth.service';
import { Lock, AlertCircle } from 'lucide-react';
import { PasswordStrengthMeter, checkPasswordStrength } from '../components/PasswordStrengthMeter';
import { AuthPageShell } from '../components/AuthPageShell';
import { AuthErrorBanner } from '../components/AuthErrorBanner';
import { AuthIconInput } from '../components/AuthIconInput';
import { AuthSubmitButton } from '../components/AuthSubmitButton';
import { AuthSuccessPanel } from '../components/AuthSuccessPanel';
import { AuthBackLink } from '../components/AuthBackLink';

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
      <AuthPageShell>
        <div style={{ textAlign: 'center' }}>
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
      </AuthPageShell>
    );
  }

  return (
    <AuthPageShell maxWidth="440px">
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

      {error && <AuthErrorBanner message={error} />}

      {isSuccess ? (
        <AuthSuccessPanel title="¡Contraseña Restablecida!">
          Tu contraseña ha sido actualizada con éxito. Serás redirigido al inicio de sesión en unos segundos...
        </AuthSuccessPanel>
      ) : (
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
          <div>
            <AuthIconInput
              id="password"
              label="Nueva Contraseña"
              icon={Lock}
              type="password"
              placeholder="••••••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <PasswordStrengthMeter password={password} />
          </div>

          <div style={{ marginTop: '0.25rem' }}>
            <AuthIconInput
              id="confirmPassword"
              label="Confirmar Nueva Contraseña"
              icon={Lock}
              type="password"
              placeholder="••••••••••••"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              borderColor={
                confirmPassword.length > 0 ? (passwordsMatch ? '#10b981' : '#ef4444') : undefined
              }
            />

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

          <AuthSubmitButton
            isLoading={isLoading}
            loadingText="Guardando..."
            disabled={!isStrong || !passwordsMatch}
            style={{
              marginTop: '0.75rem',
              opacity: isLoading || !isStrong || !passwordsMatch ? 0.6 : 1,
              cursor: isLoading || !isStrong || !passwordsMatch ? 'not-allowed' : 'pointer',
            }}
          >
            Guardar Nueva Contraseña
          </AuthSubmitButton>
        </form>
      )}

      <AuthBackLink to="/login">Volver al Inicio de Sesión</AuthBackLink>
    </AuthPageShell>
  );
};
