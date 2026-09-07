import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import type { ReactNode } from 'react';
import { NotificationProvider, useNotification } from '../../contexts/NotificationContext';

// RF-31 — Gestionar notificaciones. Basado en el diagrama "RF-31 Front
// (NotificationContext)" (V(G)=2, 2 caminos básicos: eliminar una notificación
// individual o limpiar todas).
const wrapper = ({ children }: { children: ReactNode }) => (
  <NotificationProvider>{children}</NotificationProvider>
);

describe('NotificationContext', () => {
  // Camino 1: INICIO,1,2a,FIN
  it('Camino 1: eliminar una notificación individual la quita, las demás quedan intactas', () => {
    // Arrange
    const { result } = renderHook(() => useNotification(), { wrapper });
    act(() => {
      result.current.addNotification('Primera', 'success');
      result.current.addNotification('Segunda', 'error');
    });
    expect(result.current.notifications).toHaveLength(2);
    const idToRemove = result.current.notifications[1].id; // la más antigua ('Primera')

    // Act
    act(() => {
      result.current.removeNotification(idToRemove);
    });

    // Assert
    expect(result.current.notifications).toHaveLength(1);
    expect(result.current.notifications[0].message).toBe('Segunda');
  });

  // Camino 2: INICIO,1,2b,FIN
  it('Camino 2: limpiar todas deja el arreglo de notificaciones vacío', () => {
    // Arrange
    const { result } = renderHook(() => useNotification(), { wrapper });
    act(() => {
      result.current.addNotification('Una', 'info');
      result.current.addNotification('Otra', 'success');
    });
    expect(result.current.notifications).toHaveLength(2);

    // Act
    act(() => {
      result.current.clearNotifications();
    });

    // Assert
    expect(result.current.notifications).toHaveLength(0);
  });
});
