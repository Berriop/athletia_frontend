import React from 'react';
import { Target, Eye, Code, User, Server, Database, Shield } from 'lucide-react';

export const AboutPage: React.FC = () => {
  return (
    <div className="page-container" style={{ paddingTop: '4rem', paddingBottom: '4rem' }}>
      <h1 className="page-title" style={{ textAlign: 'center', fontSize: '3rem', marginBottom: '1rem' }}>Sobre Nosotros</h1>
      <p className="page-subtitle" style={{ textAlign: 'center', fontSize: '1.25rem', maxWidth: '600px', margin: '0 auto 4rem' }}>
        Conoce más sobre la misión y la tecnología detrás de Athletia.
      </p>

      <div className="grid-2" style={{ marginBottom: '4rem' }}>
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem', color: 'var(--primary)' }}>
            <Target size={32} />
            <h2 style={{ fontSize: '1.75rem', margin: 0 }}>Nuestra Misión</h2>
          </div>
          <p style={{ color: 'var(--text-secondary)', lineHeight: 1.6 }}>
            Ayudar a deportistas y personas activas a mejorar su rendimiento mediante el seguimiento de:
          </p>
          <ul style={{ listStyle: 'disc', paddingLeft: '1.5rem', marginTop: '1rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
            <li>Entrenamientos</li>
            <li>Alimentación</li>
            <li>Sueño</li>
            <li>Lesiones</li>
          </ul>
        </div>

        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem', color: 'var(--secondary)' }}>
            <Eye size={32} />
            <h2 style={{ fontSize: '1.75rem', margin: 0 }}>Nuestra Visión</h2>
          </div>
          <p style={{ color: 'var(--text-secondary)', lineHeight: 1.6 }}>
            Convertir Athletia en una plataforma integral de seguimiento deportivo, proporcionando herramientas avanzadas para que cada atleta, desde principiantes hasta profesionales, pueda alcanzar su máximo potencial a través de decisiones basadas en datos.
          </p>
        </div>
      </div>

      <div style={{ marginBottom: '4rem' }}>
        <h2 className="section-title">Tecnologías</h2>
        <div className="grid-4" style={{ textAlign: 'center' }}>
          <div className="card">
            <Code size={40} color="var(--primary)" style={{ margin: '0 auto 1rem' }} />
            <h3 style={{ fontSize: '1.1rem' }}>React & TypeScript</h3>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginTop: '0.5rem' }}>Frontend robusto y tipado seguro.</p>
          </div>
          <div className="card">
            <Server size={40} color="#10b981" style={{ margin: '0 auto 1rem' }} />
            <h3 style={{ fontSize: '1.1rem' }}>Node.js & Express</h3>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginTop: '0.5rem' }}>Backend rápido y escalable.</p>
          </div>
          <div className="card">
            <Database size={40} color="#3b82f6" style={{ margin: '0 auto 1rem' }} />
            <h3 style={{ fontSize: '1.1rem' }}>PostgreSQL & Prisma</h3>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginTop: '0.5rem' }}>Base de datos relacional y ORM moderno.</p>
          </div>
          <div className="card">
            <Shield size={40} color="#f59e0b" style={{ margin: '0 auto 1rem' }} />
            <h3 style={{ fontSize: '1.1rem' }}>JWT & Supabase</h3>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginTop: '0.5rem' }}>Autenticación segura y almacenamiento.</p>
          </div>
        </div>
      </div>

      <div>
        <h2 className="section-title">Equipo</h2>
        <div className="card" style={{ maxWidth: '400px', margin: '0 auto', textAlign: 'center' }}>
          <div style={{ width: '96px', height: '96px', borderRadius: '50%', background: 'var(--border)', margin: '0 auto 1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <User size={48} color="var(--text-secondary)" />
          </div>
          <h3 style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>Juan Pablo Berrío</h3>
          <p style={{ color: 'var(--primary)', fontWeight: 500, marginBottom: '1rem' }}>Full Stack Developer</p>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
            Desarrollador apasionado por el deporte y la tecnología, creador de Athletia para solucionar las necesidades reales del seguimiento deportivo.
          </p>
        </div>
      </div>
    </div>
  );
};
