import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { MainLayout } from '../../layouts/MainLayout';

vi.mock('../../contexts/AuthContext', () => ({
  useAuth: () => ({ user: { name: 'Ana', role: 'USER' }, logout: vi.fn() }),
}));
vi.mock('../../contexts/NotificationContext', () => ({
  useNotification: () => ({ notifications: [], removeNotification: vi.fn(), clearNotifications: vi.fn() }),
}));

describe('MainLayout', () => {
  it('renderiza el Sidebar, el Header y el contenido de la ruta hija (Outlet)', () => {
    render(
      <MemoryRouter initialEntries={['/dashboard']}>
        <Routes>
          <Route element={<MainLayout />}>
            <Route path="/dashboard" element={<div>Contenido del Dashboard</div>} />
          </Route>
        </Routes>
      </MemoryRouter>,
    );

    expect(screen.getByText('Athletia')).toBeInTheDocument(); // Sidebar
    expect(screen.getByText('Ana')).toBeInTheDocument(); // Header (saludo)
    expect(screen.getByText('Contenido del Dashboard')).toBeInTheDocument(); // Outlet
  });
});
