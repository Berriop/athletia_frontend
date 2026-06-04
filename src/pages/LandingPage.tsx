import React from 'react';
import { Link } from 'react-router-dom';
import { Activity, Apple, Moon, HeartPulse, ChevronRight, CheckCircle2 } from 'lucide-react';

export const LandingPage: React.FC = () => {
  return (
    <div className="landing-page">
      {/* Hero Section */}
      <section className="hero-section">
        <h1 className="hero-title">
          Athletia<br />
          Monitorea tu rendimiento.<br />
          Mejora tus resultados.
        </h1>
        <p className="hero-subtitle">
          Controla tus entrenamientos, nutrición, recuperación y lesiones en una sola plataforma diseñada para atletas que buscan alcanzar su máximo nivel.
        </p>
        <div className="hero-actions">
          <Link to="/register" className="btn-primary" style={{ padding: '1rem 2rem', fontSize: '1.1rem' }}>
            Comenzar <ChevronRight size={20} />
          </Link>
          <Link to="/login" className="btn-secondary" style={{ padding: '1rem 2rem', fontSize: '1.1rem', background: 'white' }}>
            Iniciar Sesión
          </Link>
        </div>
      </section>

      {/* Dashboard Preview Section */}
      <section className="section-padding bg-gray-50" style={{ background: '#f8fafc', borderBottom: '1px solid var(--border)' }}>
        <h2 className="section-title">Vista Previa</h2>
        <div className="preview-container">
          <div style={{ background: 'var(--surface)', padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1.5rem', height: '400px' }}>
            <div style={{ display: 'flex', gap: '1rem' }}>
               <div style={{ flex: 1, background: 'rgba(65, 53, 122, 0.05)', borderRadius: '1rem', padding: '1.5rem', border: '1px solid var(--border)' }}>
                 <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'var(--primary)', marginBottom: '1rem' }}></div>
                 <div style={{ height: '12px', width: '60%', background: 'var(--border)', borderRadius: '4px', marginBottom: '0.5rem' }}></div>
                 <div style={{ height: '24px', width: '40%', background: 'var(--primary)', borderRadius: '4px', opacity: 0.8 }}></div>
               </div>
               <div style={{ flex: 1, background: 'rgba(16, 185, 129, 0.05)', borderRadius: '1rem', padding: '1.5rem', border: '1px solid var(--border)' }}>
                 <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'var(--secondary)', marginBottom: '1rem' }}></div>
                 <div style={{ height: '12px', width: '50%', background: 'var(--border)', borderRadius: '4px', marginBottom: '0.5rem' }}></div>
                 <div style={{ height: '24px', width: '30%', background: 'var(--secondary)', borderRadius: '4px', opacity: 0.8 }}></div>
               </div>
               <div style={{ flex: 1, background: 'rgba(245, 158, 11, 0.05)', borderRadius: '1rem', padding: '1.5rem', border: '1px solid var(--border)' }}>
                 <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'var(--warning)', marginBottom: '1rem' }}></div>
                 <div style={{ height: '12px', width: '70%', background: 'var(--border)', borderRadius: '4px', marginBottom: '0.5rem' }}></div>
                 <div style={{ height: '24px', width: '50%', background: 'var(--warning)', borderRadius: '4px', opacity: 0.8 }}></div>
               </div>
            </div>
            <div style={{ display: 'flex', gap: '1rem', flex: 1 }}>
               <div style={{ flex: 2, background: 'var(--background)', borderRadius: '1rem', border: '1px solid var(--border)', padding: '1.5rem' }}>
                 <div style={{ height: '16px', width: '30%', background: 'var(--border)', borderRadius: '4px', marginBottom: '1.5rem' }}></div>
                 <div style={{ height: '60%', width: '100%', background: 'linear-gradient(to top, rgba(65, 53, 122, 0.1), transparent)', borderBottom: '2px solid var(--primary)' }}></div>
               </div>
               <div style={{ flex: 1, background: 'var(--background)', borderRadius: '1rem', border: '1px solid var(--border)', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                 <div style={{ height: '16px', width: '50%', background: 'var(--border)', borderRadius: '4px', marginBottom: '0.5rem' }}></div>
                 <div style={{ height: '40px', width: '100%', background: 'white', borderRadius: '8px', border: '1px solid var(--border)' }}></div>
                 <div style={{ height: '40px', width: '100%', background: 'white', borderRadius: '8px', border: '1px solid var(--border)' }}></div>
                 <div style={{ height: '40px', width: '100%', background: 'white', borderRadius: '8px', border: '1px solid var(--border)' }}></div>
               </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="section-padding">
        <h2 className="section-title">Todo lo que necesitas para destacar</h2>
        <div className="grid-4" style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <div className="feature-card card">
            <div className="feature-icon-wrapper"><Activity size={32} /></div>
            <h3 className="feature-title">Seguimiento de Entrenamientos</h3>
            <p className="feature-desc">Registra tus ejercicios, series, repeticiones y observa tu progreso a lo largo del tiempo.</p>
          </div>
          <div className="feature-card card">
            <div className="feature-icon-wrapper" style={{ background: 'var(--secondary)' }}><Apple size={32} /></div>
            <h3 className="feature-title">Control Nutricional</h3>
            <p className="feature-desc">Mantén un registro de tus comidas, macronutrientes e hidratación para nutrir tu cuerpo correctamente.</p>
          </div>
          <div className="feature-card card">
            <div className="feature-icon-wrapper" style={{ background: '#3b82f6' }}><Moon size={32} /></div>
            <h3 className="feature-title">Análisis de Sueño</h3>
            <p className="feature-desc">Monitorea tus patrones de sueño para asegurar una recuperación óptima y estar siempre listo.</p>
          </div>
          <div className="feature-card card">
            <div className="feature-icon-wrapper" style={{ background: 'var(--danger)' }}><HeartPulse size={32} /></div>
            <h3 className="feature-title">Gestión de Lesiones</h3>
            <p className="feature-desc">Registra molestias, sigue protocolos de recuperación y maneja lesiones de forma efectiva.</p>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="section-padding" style={{ background: 'var(--surface)', borderTop: '1px solid var(--border)' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '3rem' }}>
          <h2 className="section-title" style={{ marginBottom: '1rem' }}>¿Por qué elegir Athletia?</h2>
          <div className="grid-2">
            <div>
              <ul style={{ listStyle: 'none', padding: 0, display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                <li style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
                  <CheckCircle2 color="var(--secondary)" size={24} style={{ flexShrink: 0 }} />
                  <div>
                    <h4 style={{ fontSize: '1.2rem', fontWeight: 600, marginBottom: '0.25rem' }}>Mejores perspectivas de rendimiento</h4>
                    <p style={{ color: 'var(--text-secondary)' }}>Comprende cómo tus hábitos diarios afectan tu desempeño físico y ajusta en consecuencia.</p>
                  </div>
                </li>
                <li style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
                  <CheckCircle2 color="var(--secondary)" size={24} style={{ flexShrink: 0 }} />
                  <div>
                    <h4 style={{ fontSize: '1.2rem', fontWeight: 600, marginBottom: '0.25rem' }}>Control de la recuperación</h4>
                    <p style={{ color: 'var(--text-secondary)' }}>Equilibra el estrés y la recuperación para evitar el sobreentrenamiento y maximizar tus ganancias.</p>
                  </div>
                </li>
              </ul>
            </div>
            <div>
              <ul style={{ listStyle: 'none', padding: 0, display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                <li style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
                  <CheckCircle2 color="var(--secondary)" size={24} style={{ flexShrink: 0 }} />
                  <div>
                    <h4 style={{ fontSize: '1.2rem', fontWeight: 600, marginBottom: '0.25rem' }}>Seguimiento del progreso</h4>
                    <p style={{ color: 'var(--text-secondary)' }}>Visualiza tu mejora a lo largo de semanas, meses y años con gráficos detallados.</p>
                  </div>
                </li>
                <li style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
                  <CheckCircle2 color="var(--secondary)" size={24} style={{ flexShrink: 0 }} />
                  <div>
                    <h4 style={{ fontSize: '1.2rem', fontWeight: 600, marginBottom: '0.25rem' }}>Datos atléticos centralizados</h4>
                    <p style={{ color: 'var(--text-secondary)' }}>Se acabaron los días de usar 5 aplicaciones diferentes. Todo lo que necesitas está justo aquí.</p>
                  </div>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section style={{ padding: '0 2rem' }}>
        <div className="cta-section">
          <h2 style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>¿Listo para subir de nivel?</h2>
          <p style={{ fontSize: '1.25rem', opacity: 0.9, marginBottom: '2rem' }}>
            Empieza a mejorar tu rendimiento deportivo hoy mismo.
          </p>
          <Link to="/register" className="btn-primary">
            Crear una cuenta
          </Link>
        </div>
      </section>
    </div>
  );
};
