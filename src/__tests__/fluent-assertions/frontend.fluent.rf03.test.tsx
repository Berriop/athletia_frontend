import { describe, it, vi, beforeEach } from 'vitest';
import { expect as chaiExpect } from 'chai';
import { renderHook, act, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import { AuthProvider, useAuth } from '../../contexts/AuthContext';
import { api } from '../../services/api';

/**
 * RF-03 — Cerrar sesión, en archivo aparte porque necesita el AuthProvider
 * REAL (no se puede mezclar en el mismo archivo que mockea useAuth para
 * probar páginas — ver frontend.fluent.test.tsx).
 */
vi.mock('../../services/api', () => ({
  api: { get: vi.fn() },
}));

const wrapper = ({ children }: { children: ReactNode }) => <AuthProvider>{children}</AuthProvider>;

describe('RF-03 — AuthContext.logout (Fluent Assertions)', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.mocked(api.get).mockReset();
  });

  it('al cerrar sesión, el token y el usuario quedan nulos', async () => {
    const { result } = renderHook(() => useAuth(), { wrapper });
    await waitFor(() => chaiExpect(result.current.isLoading).to.equal(false));

    act(() => {
      result.current.login('fake-jwt', { id: 'user-1', email: 'user@test.com', role: 'USER' } as any);
    });
    chaiExpect(localStorage.getItem('token')).to.equal('fake-jwt');
    chaiExpect(result.current.isAuthenticated).to.be.true;

    act(() => {
      result.current.logout();
    });

    chaiExpect(localStorage.getItem('token')).to.be.null;
    chaiExpect(result.current.user).to.be.null;
    chaiExpect(result.current.isAuthenticated).to.be.false;
  });
});
