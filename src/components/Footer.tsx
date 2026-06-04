import React from 'react';
import { Link } from 'react-router-dom';
import { Activity } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="public-footer">
      <div className="footer-content">
        <div className="footer-top">
          <div>
            <div className="footer-brand" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Activity size={24} /> Athletia
            </div>
            <p className="footer-tagline">Monitorea tu rendimiento. Mejora tus resultados.</p>
          </div>
          <div className="footer-links">
            <Link to="/about" className="footer-link">Nosotros</Link>
            <Link to="/faq" className="footer-link">FAQ</Link>
            <Link to="/contact" className="footer-link">Contacto</Link>
          </div>
        </div>
        <div className="footer-bottom">
          <p>Athletia &copy; 2026</p>
        </div>
      </div>
    </footer>
  );
};
