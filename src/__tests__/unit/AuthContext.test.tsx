import { describe, it, expect } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import { AuthProvider, useAuth } from '../../contexts/AuthContext';
import type { User } from '../../types';

// RF-03 — Cerrar sesión. Basado en el diagrama "RF-03 Front
// (AuthContext.logout)" (V(G)=1, 1 camino básico: función lineal).
const wrapper = ({ children }: { children: ReactNode }) => <AuthProvider>{children}</AuthProvider>;

const fakeUser = { id: 'user-1', email: 'test@example.com', role: 'USER' } as unknown as User;

describe('AuthContext.logout', () => {
  // Camino único: INICIO,1,2,3,FIN
  it('Camino 1: al cerrar sesión, borra el token del localStorage y limpia el estado', async () => {
    const { result } = renderHook(() => useAuth(), { wrapper });

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    act(() => {
      result.current.login('fake-jwt-token', fakeUser);
    });

    expect(localStorage.getItem('token')).toBe('fake-jwt-token');
    expect(result.current.isAuthenticated).toBe(true);

    act(() => {
      result.current.logout();
    });

    expect(localStorage.getItem('token')).toBeNull();
    expect(result.current.token).toBeNull();
    expect(result.current.user).toBeNull();
    expect(result.current.isAuthenticated).toBe(false);
  });
});
