import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { Header } from '../../components/Header';

const logout = vi.fn();
const navigate = vi.fn();
let mockUser: { name?: string; email?: string } | null = { name: 'Ana' };
vi.mock('../../contexts/AuthContext', () => ({
  useAuth: () => ({ user: mockUser, logout }),
}));

let mockNotifications: { id: string; message: string; type: string; timestamp: Date }[] = [];
const removeNotification = vi.fn();
const clearNotifications = vi.fn();
vi.mock('../../contexts/NotificationContext', () => ({
  useNotification: () => ({
    notifications: mockNotifications,
    removeNotification,
    clearNotifications,
  }),
}));

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return { ...actual, useNavigate: () => navigate };
});

function renderHeader() {
  return render(
    <MemoryRouter>
      <Header />
    </MemoryRouter>,
  );
}

describe('Header', () => {
  beforeEach(() => {
    logout.mockClear();
    navigate.mockClear();
    removeNotification.mockClear();
    clearNotifications.mockClear();
    mockUser = { name: 'Ana' };
    mockNotifications = [];
  });

  // displayName: usa user.name cuando existe
  it('muestra el nombre del usuario cuando está disponible', () => {
    renderHeader();
    expect(screen.getByText('Ana')).toBeInTheDocument();
  });

  // displayName: cae al prefijo del email si no hay name
  it('sin nombre → usa la parte local del email como saludo', () => {
    mockUser = { email: 'atleta@correo.com' };
    renderHeader();
    expect(screen.getByText('atleta')).toBeInTheDocument();
  });

  // displayName: fallback final "Atleta" si no hay ni name ni email
  it('sin nombre ni email → usa "Atleta" como saludo por defecto', () => {
    mockUser = {};
    renderHeader();
    expect(screen.getByText('Atleta')).toBeInTheDocument();
  });

  it('handleLogout → cierra sesión y navega a /login', async () => {
    const user = userEvent.setup();
    renderHeader();
    await user.click(screen.getByTitle('Cerrar sesión'));
    expect(logout).toHaveBeenCalledTimes(1);
    expect(navigate).toHaveBeenCalledWith('/login', { replace: true });
  });

  it('sin notificaciones → no muestra el badge y el dropdown dice que no hay nuevas', async () => {
    const user = userEvent.setup();
    renderHeader();
    expect(screen.queryByText('9+')).not.toBeInTheDocument();
    await user.click(screen.getByTitle('Notificaciones'));
    expect(screen.getByText('No tienes notificaciones nuevas')).toBeInTheDocument();
    expect(screen.queryByText('Limpiar')).not.toBeInTheDocument();
  });

  it('con más de 9 notificaciones → el badge muestra "9+"', () => {
    mockNotifications = Array.from({ length: 12 }, (_, i) => ({
      id: `n${i}`,
      message: `msg ${i}`,
      type: 'info',
      timestamp: new Date(),
    }));
    renderHeader();
    expect(screen.getByText('9+')).toBeInTheDocument();
  });

  it('abre el dropdown y muestra cada notificación con su tipo de ícono (success/error/info)', async () => {
    mockNotifications = [
      { id: 'n1', message: 'Guardado con éxito', type: 'success', timestamp: new Date() },
      { id: 'n2', message: 'Algo falló', type: 'error', timestamp: new Date() },
      { id: 'n3', message: 'Aviso general', type: 'other', timestamp: new Date() },
    ];
    const user = userEvent.setup();
    renderHeader();
    await user.click(screen.getByTitle('Notificaciones'));
    expect(screen.getByText('Guardado con éxito')).toBeInTheDocument();
    expect(screen.getByText('Algo falló')).toBeInTheDocument();
    expect(screen.getByText('Aviso general')).toBeInTheDocument();
  });

  it('clic en "Limpiar" → llama a clearNotifications', async () => {
    mockNotifications = [{ id: 'n1', message: 'Hola', type: 'info', timestamp: new Date() }];
    const user = userEvent.setup();
    renderHeader();
    await user.click(screen.getByTitle('Notificaciones'));
    await user.click(screen.getByText('Limpiar'));
    expect(clearNotifications).toHaveBeenCalledTimes(1);
  });

  it('clic en el ícono de borrar una notificación → llama a removeNotification con su id', async () => {
    mockNotifications = [{ id: 'n1', message: 'Hola', type: 'info', timestamp: new Date() }];
    const user = userEvent.setup();
    renderHeader();
    await user.click(screen.getByTitle('Notificaciones'));
    const deleteButtons = document.querySelectorAll('.delete-notif-btn');
    await user.click(deleteButtons[0]);
    expect(removeNotification).toHaveBeenCalledWith('n1');
  });
});
