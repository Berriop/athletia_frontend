import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Activity } from 'lucide-react';

export const PublicNavbar: React.FC = () => {
  const location = useLocation();

  const isActive = (path: string) => location.pathname === path ? 'active' : '';

  return (
    <nav className="public-navbar">
      <Link to="/" className="nav-brand">
        <Activity size={28} />
        <span>Athletia</span>
      </Link>
      
      <div className="nav-links">
        <Link to="/" className={`nav-link ${isActive('/')}`}>Inicio</Link>
        <Link to="/about" className={`nav-link ${isActive('/about')}`}>Nosotros</Link>
        <Link to="/faq" className={`nav-link ${isActive('/faq')}`}>FAQ</Link>
        <Link to="/contact" className={`nav-link ${isActive('/contact')}`}>Contacto</Link>
      </div>

      <div className="nav-actions">
        <Link to="/login" className="btn-secondary">Iniciar Sesión</Link>
        <Link to="/register" className="btn-primary">Registrarse</Link>
      </div>
    </nav>
  );
};
