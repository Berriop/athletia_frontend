import { describe, it } from 'vitest';
import { expect as chaiExpect } from 'chai';
import { renderHook, act } from '@testing-library/react';
import type { ReactNode } from 'react';
import { NotificationProvider, useNotification } from '../../contexts/NotificationContext';

/**
 * RF-26 — Gestionar notificaciones (Daniel Ortiz), en archivo aparte porque
 * necesita el NotificationProvider real (frontend.fluent.team.test.tsx lo
 * mockea globalmente para probar el resto de páginas).
 */
const wrapper = ({ children }: { children: ReactNode }) => <NotificationProvider>{children}</NotificationProvider>;

describe('RF-26 — NotificationContext (Fluent Assertions)', () => {
  it('eliminar una notificación individual la quita, las demás quedan intactas', () => {
    const { result } = renderHook(() => useNotification(), { wrapper });
    act(() => {
      result.current.addNotification('Primera', 'success');
      result.current.addNotification('Segunda', 'error');
    });
    const idToRemove = result.current.notifications[1].id;

    act(() => {
      result.current.removeNotification(idToRemove);
    });

    chaiExpect(result.current.notifications).to.have.lengthOf(1);
    chaiExpect(result.current.notifications[0].message).to.equal('Segunda');
  });

  it('limpiar todas las notificaciones deja el arreglo vacío', () => {
    const { result } = renderHook(() => useNotification(), { wrapper });
    act(() => {
      result.current.addNotification('A', 'success');
      result.current.addNotification('B', 'success');
    });

    act(() => {
      result.current.clearNotifications();
    });

    chaiExpect(result.current.notifications).to.be.an('array').that.is.empty;
  });
});
