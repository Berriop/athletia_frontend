import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import { AuthProvider, useAuth } from '../../contexts/AuthContext';
import { api } from '../../services/api';

/**
 * [Regresión] RF-03 — Cerrar sesión sigue limpiando token y usuario.
 * Archivo aparte por la misma razón que frontend.fluent.rf03.test.tsx:
 * necesita el AuthProvider real.
 */
vi.mock('../../services/api', () => ({
  api: { get: vi.fn() },
}));

const wrapper = ({ children }: { children: ReactNode }) => <AuthProvider>{children}</AuthProvider>;

describe('[Regresión] RF-03 — logout sigue limpiando la sesión por completo', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.mocked(api.get).mockReset();
  });

  it('tras logout, el token deja de estar en localStorage y el usuario queda nulo', async () => {
    const { result } = renderHook(() => useAuth(), { wrapper });
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    act(() => {
      result.current.login('fake-jwt', { id: 'user-1', email: 'user@test.com', role: 'USER' } as any);
    });

    act(() => {
      result.current.logout();
    });

    expect(localStorage.getItem('token')).toBeNull();
    expect(result.current.user).toBeNull();
    expect(result.current.isAuthenticated).toBe(false);
  });
});
