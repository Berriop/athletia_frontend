import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import type { ReactNode } from 'react';
import { NotificationProvider, useNotification } from '../../contexts/NotificationContext';

/**
 * [Regresión] RF-26 — Gestionar notificaciones, en archivo aparte (mismo
 * motivo que frontend.fluent.team.rf26.test.tsx).
 */
const wrapper = ({ children }: { children: ReactNode }) => <NotificationProvider>{children}</NotificationProvider>;

describe('[Regresión] RF-26 — clearNotifications sigue vaciando el arreglo completo', () => {
  it('tras agregar 2 y limpiar, el arreglo sigue quedando vacío', () => {
    const { result } = renderHook(() => useNotification(), { wrapper });
    act(() => {
      result.current.addNotification('A', 'success');
      result.current.addNotification('B', 'success');
    });

    act(() => {
      result.current.clearNotifications();
    });

    expect(result.current.notifications).toHaveLength(0);
  });
});
