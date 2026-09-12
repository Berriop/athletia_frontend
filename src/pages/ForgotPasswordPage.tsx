import React, { useState } from 'react';
import { authService } from '../services/auth.service';
import { Mail } from 'lucide-react';
import { AuthPageShell } from '../components/AuthPageShell';
import { AuthErrorBanner } from '../components/AuthErrorBanner';
import { AuthIconInput } from '../components/AuthIconInput';
import { AuthSubmitButton } from '../components/AuthSubmitButton';
import { AuthSuccessPanel } from '../components/AuthSuccessPanel';
import { AuthBackLink } from '../components/AuthBackLink';

export const ForgotPasswordPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSent, setIsSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!email) return;

    setIsLoading(true);
    try {
      await authService.forgotPassword(email);
      setIsSent(true);
    } catch (err: any) {
      setError(
        err.response?.data?.error?.message ||
        err.response?.data?.message ||
        'Hubo un error al procesar tu solicitud'
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthPageShell>
      <h2 style={{ marginBottom: '0.5rem', textAlign: 'center' }}>Recuperar Contraseña</h2>
      <p
        style={{
          marginBottom: '1.5rem',
          textAlign: 'center',
          color: 'var(--text-secondary)',
          fontSize: '0.9rem',
          lineHeight: '1.4',
        }}
      >
        Ingresa tu correo registrado y te enviaremos las instrucciones para restablecer tu cuenta.
      </p>

      {error && <AuthErrorBanner message={error} />}

      {isSent ? (
        <AuthSuccessPanel title="¡Correo Enviado!">
          Si el correo <strong>{email}</strong> está registrado, recibirás un enlace con el token de recuperación pronto.
        </AuthSuccessPanel>
      ) : (
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
          />

          <AuthSubmitButton isLoading={isLoading} loadingText="Enviando...">
            Enviar Enlace de Recuperación
          </AuthSubmitButton>
        </form>
      )}

      <AuthBackLink to="/login">Volver al Inicio de Sesión</AuthBackLink>
    </AuthPageShell>
  );
};
