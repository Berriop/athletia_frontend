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

function useResetPasswordForm(token: string | null) {
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const { isStrong } = checkPasswordStrength(password);
  const passwordsMatch = password.length > 0 && password === confirmPassword;
  let confirmBorderColor: string | undefined;
  if (confirmPassword.length > 0) {
    confirmBorderColor = passwordsMatch ? '#10b981' : '#ef4444';
  }

  const validationError = (): string | null => {
    if (!token) return 'Enlace inválido o sin token de seguridad';
    if (!isStrong) return 'La nueva contraseña debe cumplir con los requisitos de seguridad';
    if (!passwordsMatch) return 'Las contraseñas no coinciden';
    return null;
  };

  const handleSubmit = async (e: React.SubmitEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');

    const validation = validationError();
    if (validation) {
      setError(validation);
      return;
    }

    setIsLoading(true);
    try {
      await authService.resetPassword(token as string, password);
      setIsSuccess(true);
      setTimeout(() => navigate('/login'), 2500);
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

  return {
    password, setPassword, confirmPassword, setConfirmPassword,
    error, isLoading, isSuccess, isStrong, passwordsMatch, confirmBorderColor,
    handleSubmit,
  };
}

function InvalidLinkScreen() {
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

export const ResetPasswordPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const form = useResetPasswordForm(token);

  if (!token) {
    return <InvalidLinkScreen />;
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

      {form.error && <AuthErrorBanner message={form.error} />}

      {form.isSuccess ? (
        <AuthSuccessPanel title="¡Contraseña Restablecida!">
          Tu contraseña ha sido actualizada con éxito. Serás redirigido al inicio de sesión en unos segundos...
        </AuthSuccessPanel>
      ) : (
        <form onSubmit={form.handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
          <div>
            <AuthIconInput
              id="password"
              label="Nueva Contraseña"
              icon={Lock}
              type="password"
              placeholder="••••••••••••"
              value={form.password}
              onChange={(e) => form.setPassword(e.target.value)}
              required
            />
            <PasswordStrengthMeter password={form.password} />
          </div>

          <div style={{ marginTop: '0.25rem' }}>
            <AuthIconInput
              id="confirmPassword"
              label="Confirmar Nueva Contraseña"
              icon={Lock}
              type="password"
              placeholder="••••••••••••"
              value={form.confirmPassword}
              onChange={(e) => form.setConfirmPassword(e.target.value)}
              required
              borderColor={form.confirmBorderColor}
            />

            {form.confirmPassword.length > 0 && (
              <div
                style={{
                  fontSize: '0.8rem',
                  marginTop: '0.2rem',
                  color: form.passwordsMatch ? '#10b981' : '#ef4444',
                  fontWeight: 500,
                }}
              >
                {form.passwordsMatch ? '✓ Las contraseñas coinciden' : '✗ Las contraseñas no coinciden'}
              </div>
            )}
          </div>

          <AuthSubmitButton
            isLoading={form.isLoading}
            loadingText="Guardando..."
            disabled={!form.isStrong || !form.passwordsMatch}
            style={{
              marginTop: '0.75rem',
              opacity: form.isLoading || !form.isStrong || !form.passwordsMatch ? 0.6 : 1,
              cursor: form.isLoading || !form.isStrong || !form.passwordsMatch ? 'not-allowed' : 'pointer',
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
