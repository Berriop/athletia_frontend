import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { Sidebar } from '../../components/Sidebar';

const logout = vi.fn();
const navigate = vi.fn();
let mockUser: { role?: string } | null = { role: 'USER' };
vi.mock('../../contexts/AuthContext', () => ({
  useAuth: () => ({ logout, user: mockUser }),
}));

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return { ...actual, useNavigate: () => navigate };
});

function renderSidebar() {
  return render(
    <MemoryRouter>
      <Sidebar />
    </MemoryRouter>,
  );
}

describe('Sidebar', () => {
  beforeEach(() => {
    logout.mockClear();
    navigate.mockClear();
    mockUser = { role: 'USER' };
  });

  it('usuario normal → no muestra el ítem de navegación "Admin"', () => {
    renderSidebar();
    expect(screen.queryByText('Admin')).not.toBeInTheDocument();
  });

  it('usuario ADMIN → sí muestra el ítem de navegación "Admin"', () => {
    mockUser = { role: 'ADMIN' };
    renderSidebar();
    expect(screen.getByText('Admin')).toBeInTheDocument();
  });

  it('toggleSidebar → colapsa y expande la barra, ocultando/mostrando las etiquetas', async () => {
    const user = userEvent.setup();
    const { container } = renderSidebar();
    expect(screen.getByText('Athletia')).toBeInTheDocument();
    expect(screen.getByText('Dashboard')).toBeInTheDocument();

    // Act: colapsar
    const toggleBtn = container.querySelector('.toggle-btn') as HTMLElement;
    await user.click(toggleBtn);

    // Assert: el logo y las etiquetas de texto desaparecen en modo colapsado
    expect(screen.queryByText('Athletia')).not.toBeInTheDocument();
    expect(screen.queryByText('Dashboard')).not.toBeInTheDocument();

    // Act: volver a expandir
    await user.click(toggleBtn);
    expect(screen.getByText('Athletia')).toBeInTheDocument();
  });

  it('handleLogout → cierra sesión y navega a /login', async () => {
    const user = userEvent.setup();
    renderSidebar();
    await user.click(screen.getByText('Cerrar sesión'));
    expect(logout).toHaveBeenCalledTimes(1);
    expect(navigate).toHaveBeenCalledWith('/login', { replace: true });
  });
});
