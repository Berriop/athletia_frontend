import React from 'react';
import { Activity, Flame, TrendingUp, ChevronRight } from 'lucide-react';
import './DashboardPage.css';

export const DashboardPage: React.FC = () => {
  return (
    <div className="page-container dashboard">
      <h1 className="page-title">Tu Resumen Deportivo</h1>
      <p className="page-subtitle">Mira tu progreso y metas de hoy</p>
      
      <div className="dashboard-grid">
        <div className="card glass-panel stat-card">
          <div className="stat-icon-wrapper" style={{ backgroundColor: 'rgba(16, 185, 129, 0.1)', color: '#10B981' }}>
            <Activity size={24} />
          </div>
          <div className="stat-info">
            <h3>Entrenamientos</h3>
            <p className="stat-value">4 esta semana</p>
          </div>
        </div>
        
        <div className="card glass-panel stat-card">
          <div className="stat-icon-wrapper" style={{ backgroundColor: 'rgba(245, 158, 11, 0.1)', color: '#f59e0b' }}>
            <Flame size={24} />
          </div>
          <div className="stat-info">
            <h3>Racha Activa</h3>
            <p className="stat-value">12 Días</p>
          </div>
        </div>

        <div className="card glass-panel stat-card">
          <div className="stat-icon-wrapper" style={{ backgroundColor: 'rgba(65, 53, 122, 0.1)', color: 'var(--primary)' }}>
            <TrendingUp size={24} />
          </div>
          <div className="stat-info">
            <h3>Progreso de Peso</h3>
            <p className="stat-value">-2.5 kg</p>
          </div>
        </div>
      </div>

      <div className="dashboard-main-content">
        <div className="card glass-panel recent-activity">
          <div className="card-header">
            <h3>Actividad Reciente</h3>
            <button className="btn-link">Ver Todo <ChevronRight size={16} /></button>
          </div>
          <div className="activity-list">
            <div className="activity-item">
              <div className="activity-icon">🏋️‍♂️</div>
              <div className="activity-details">
                <h4>Día de Pierna</h4>
                <p>Hace 2 horas • 60 min</p>
              </div>
            </div>
            <div className="activity-item">
              <div className="activity-icon">🥗</div>
              <div className="activity-details">
                <h4>Almuerzo Saludable</h4>
                <p>Hace 5 horas • 450 kcal</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
