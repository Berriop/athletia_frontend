import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import { AuthProvider, useAuth } from '../../contexts/AuthContext';
import { api } from '../../services/api';
import type { User } from '../../types';

// RF-03 — Cerrar sesión. Basado en el diagrama "RF-03 Front
// (AuthContext.logout)" (V(G)=1, 1 camino básico: función lineal).
// Además: initAuth (tokens previos en localStorage + /auth/me), updateUser
// y la guarda de useAuth.
vi.mock('../../services/api', () => ({
  api: { get: vi.fn() },
}));

const wrapper = ({ children }: { children: ReactNode }) => <AuthProvider>{children}</AuthProvider>;

const fakeUser = { id: 'user-1', email: 'test@example.com', role: 'USER' } as unknown as User;

beforeEach(() => {
  localStorage.clear();
});

describe('AuthContext.initAuth (token previo en localStorage)', () => {
  beforeEach(() => {
    vi.mocked(api.get).mockReset();
  });

  // Camino: hay token → /auth/me responde success → se restaura el usuario
  it('hay token en localStorage y el backend valida → recupera el usuario del /auth/me', async () => {
    // Arrange
    localStorage.setItem('token', 'stored-jwt');
    vi.mocked(api.get).mockResolvedValue({ data: { success: true, data: fakeUser } });

    // Act
    const { result } = renderHook(() => useAuth(), { wrapper });

    // Assert
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.isAuthenticated).toBe(true);
    expect(result.current.user).toEqual(fakeUser);
    expect(result.current.token).toBe('stored-jwt');
  });

  // Camino: hay token pero success=false → se invalida la sesión
  it('hay token pero el backend responde success=false → cierra sesión', async () => {
    // Arrange
    localStorage.setItem('token', 'stale-jwt');
    vi.mocked(api.get).mockResolvedValue({ data: { success: false } });

    // Act
    const { result } = renderHook(() => useAuth(), { wrapper });

    // Assert
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.isAuthenticated).toBe(false);
    expect(localStorage.getItem('token')).toBeNull();
  });

  // Camino: hay token pero la petición falla → se invalida la sesión
  it('hay token pero la petición falla → cierra sesión', async () => {
    // Arrange
    localStorage.setItem('token', 'expired-jwt');
    vi.mocked(api.get).mockRejectedValue(new Error('network down'));

    // Act
    const { result } = renderHook(() => useAuth(), { wrapper });

    // Assert
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.isAuthenticated).toBe(false);
    expect(localStorage.getItem('token')).toBeNull();
  });
});

describe('AuthContext.updateUser', () => {
  it('actualiza el usuario en el estado (sin tocar el token)', async () => {
    // Arrange
    const { result } = renderHook(() => useAuth(), { wrapper });
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    act(() => result.current.login('jwt', fakeUser));

    const updated = { ...fakeUser, email: 'nuevo@example.com' } as User;

    // Act
    act(() => result.current.updateUser(updated));

    // Assert
    expect(result.current.user).toEqual(updated);
  });
});

describe('AuthContext.logout', () => {
  // Camino único: INICIO,1,2,3,FIN
  it('Camino 1: al cerrar sesión, borra el token del localStorage y limpia el estado', async () => {
    // Arrange
    const { result } = renderHook(() => useAuth(), { wrapper });
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    act(() => {
      result.current.login('fake-jwt-token', fakeUser);
    });
    expect(localStorage.getItem('token')).toBe('fake-jwt-token');
    expect(result.current.isAuthenticated).toBe(true);

    // Act
    act(() => {
      result.current.logout();
    });

    // Assert
    expect(localStorage.getItem('token')).toBeNull();
    expect(result.current.token).toBeNull();
    expect(result.current.user).toBeNull();
    expect(result.current.isAuthenticated).toBe(false);
  });
});

describe('useAuth fuera del AuthProvider', () => {
  it('la guarda del hook lanza un error', () => {
    // Act & Assert
    expect(() => renderHook(() => useAuth())).toThrow('useAuth must be used within an AuthProvider');
  });
});
