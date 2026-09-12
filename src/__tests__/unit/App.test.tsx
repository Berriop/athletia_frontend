import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import App from '../../App';
import { AuthProvider } from '../../contexts/AuthContext';
import { NotificationProvider } from '../../contexts/NotificationContext';

describe('App', () => {
  beforeEach(() => {
    localStorage.clear();
    window.history.pushState({}, '', '/');
  });

  it('sin sesión iniciada, en la raíz → monta el árbol completo y muestra la Landing Page', async () => {
    render(
      <NotificationProvider>
        <AuthProvider>
          <App />
        </AuthProvider>
      </NotificationProvider>,
    );

    expect(await screen.findByRole('link', { name: /Comenzar/ })).toBeInTheDocument();
  });
});
