import React, { useEffect, useState } from 'react';
import { Activity, Moon, Apple, Bandage, ChevronRight, HeartPulse, Brain } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { workoutService } from '../services/workout.service';
import { mealService } from '../services/meal.service';
import { sleepService } from '../services/sleep.service';
import { injuryService } from '../services/injury.service';
import type { Workout } from '../types';
import type { Meal } from '../types';
import type { SleepLog } from '../types';
import { calculateRecoveryScore, type RecoveryScoreResult } from '../utils/recoveryScore';
import { getCoachRecommendation, type CoachRecommendation } from '../utils/smartCoach';
import './DashboardPage.css';

interface DashboardStats {
  totalWorkouts: number;
  totalMeals: number;
  totalSleepLogs: number;
  totalInjuries: number;
  workoutsLast7DaysCount: number;
  activeInjuries: number;
  avgSleep: number;
  mealsToday: number;
  lastSleep: SleepLog | null;
  recentWorkouts: Workout[];
  recentMeals: Meal[];
  recoveryScore: RecoveryScoreResult | null;
  coachRecommendation: CoachRecommendation | null;
}

export const DashboardPage: React.FC = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats>({
    totalWorkouts: 0,
    totalMeals: 0,
    totalSleepLogs: 0,
    totalInjuries: 0,
    workoutsLast7DaysCount: 0,
    activeInjuries: 0,
    avgSleep: 0,
    mealsToday: 0,
    lastSleep: null,
    recentWorkouts: [],
    recentMeals: [],
    recoveryScore: null,
    coachRecommendation: null,
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadStats = async () => {
      try {
        const [workoutsRes, mealsRes, sleepsRes, injuriesRes] = await Promise.all([
          workoutService.getAll(1, 50),
          mealService.getAll(1, 50),
          sleepService.getAll(1, 50), // Changed to 50 to calculate averages properly
          injuryService.getAll(1, 50),
        ]);

        const activeInjuries = injuriesRes.data.filter(i => i.isActive).length;
        
        const today = new Date();
        const mealsToday = mealsRes.data.filter(m => {
          const d = new Date(m.date);
          return d.getDate() === today.getDate() &&
                 d.getMonth() === today.getMonth() &&
                 d.getFullYear() === today.getFullYear();
        }).length;

        // Get workouts from the last 7 days for the recovery score
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        const workoutsLast7Days = workoutsRes.data.filter(w => new Date(w.date) >= sevenDaysAgo);

        const lastSleep = sleepsRes.data[0] ?? null;
        
        const recoveryScore = calculateRecoveryScore(lastSleep, activeInjuries, workoutsLast7Days);
        const coachRecommendation = getCoachRecommendation(lastSleep, activeInjuries, workoutsLast7Days);

        const totalWorkouts = workoutsRes.meta?.total ?? workoutsRes.data.length;
        const totalMeals = mealsRes.meta?.total ?? mealsRes.data.length;
        const totalSleepLogs = sleepsRes.meta?.total ?? sleepsRes.data.length;
        const totalInjuries = injuriesRes.meta?.total ?? injuriesRes.data.length;

        let avgSleep = 0;
        if (sleepsRes.data.length > 0) {
          const totalHours = sleepsRes.data.reduce((sum, log) => sum + log.hoursSlept, 0);
          avgSleep = totalHours / sleepsRes.data.length;
        }

        setStats({
          totalWorkouts,
          totalMeals,
          totalSleepLogs,
          totalInjuries,
          workoutsLast7DaysCount: workoutsLast7Days.length,
          activeInjuries,
          avgSleep,
          mealsToday,
          lastSleep,
          recentWorkouts: workoutsRes.data.slice(0, 3),
          recentMeals: mealsRes.data.slice(0, 3),
          recoveryScore,
          coachRecommendation,
        });
      } catch (err) {
        console.error('Error loading dashboard stats', err);
      } finally {
        setIsLoading(false);
      }
    };

    loadStats();
  }, []);

  const displayName = user?.name || user?.email?.split('@')[0] || 'Atleta';

  return (
    <div className="page-container dashboard">
      <h1 className="page-title">Hola, {displayName} 👋</h1>
      <p className="page-subtitle">Aquí está tu resumen de hoy</p>
      
      {isLoading ? (
        <p style={{ color: 'var(--text-secondary)' }}>Cargando datos...</p>
      ) : (
        <>
          {/* Top Highlight Cards: Recovery Score & Smart Coach */}
          <div className="top-dashboard-cards">
            {stats.recoveryScore && (
              <div className="card glass-panel" style={{ 
                margin: 0,
                background: `linear-gradient(135deg, ${stats.recoveryScore.color}20 0%, transparent 100%)`,
                borderLeft: `4px solid ${stats.recoveryScore.color}`
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: '100%' }}>
                  <div>
                    <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', margin: '0 0 0.5rem 0' }}>
                      <HeartPulse color={stats.recoveryScore.color} />
                      Recovery Score
                    </h3>
                    <p style={{ color: 'var(--text-secondary)', margin: 0 }}>
                      Tu estado actual es <strong style={{ color: stats.recoveryScore.color }}>{stats.recoveryScore.status}</strong>
                    </p>
                  </div>
                  <div style={{ 
                    fontSize: '2.5rem', 
                    fontWeight: 800, 
                    color: stats.recoveryScore.color,
                    backgroundColor: `${stats.recoveryScore.color}15`,
                    padding: '1rem 1.5rem',
                    borderRadius: '1rem'
                  }}>
                    {stats.recoveryScore.score}
                    <span style={{ fontSize: '1rem', color: 'var(--text-secondary)', fontWeight: 500 }}>/100</span>
                  </div>
                </div>
              </div>
            )}

            {stats.coachRecommendation && (
              <div className="card glass-panel" style={{ 
                margin: 0,
                borderLeft: `4px solid ${
                  stats.coachRecommendation.type === 'danger' ? '#ef4444' :
                  stats.coachRecommendation.type === 'warning' ? '#f59e0b' :
                  stats.coachRecommendation.type === 'success' ? '#10b981' : '#3b82f6'
                }`
              }}>
                <div style={{ display: 'flex', flexDirection: 'column', height: '100%', justifyContent: 'center' }}>
                  <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', margin: '0 0 0.5rem 0', color: 'var(--primary)' }}>
                    <Brain size={20} />
                    Coach Inteligente
                  </h3>
                  <strong style={{ 
                    display: 'block', 
                    marginBottom: '0.25rem',
                    color: stats.coachRecommendation.type === 'danger' ? '#ef4444' :
                           stats.coachRecommendation.type === 'warning' ? '#f59e0b' :
                           stats.coachRecommendation.type === 'success' ? '#10b981' : '#3b82f6'
                  }}>
                    {stats.coachRecommendation.message}
                  </strong>
                  <p style={{ color: 'var(--text-secondary)', margin: 0, fontSize: '0.9rem', lineHeight: '1.4' }}>
                    {stats.coachRecommendation.advice}
                  </p>
                </div>
              </div>
            )}
          </div>

          <div className="section-header" style={{ marginBottom: '1rem', marginTop: '2rem' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 600 }}>Métricas y Tendencias</h2>
          </div>

          {/* Stats Cards */}
          <div className="dashboard-grid">
            <div className="card glass-panel stat-card">
              <div className="stat-icon-wrapper" style={{ backgroundColor: 'rgba(16, 185, 129, 0.1)', color: '#10B981' }}>
                <Activity size={24} />
              </div>
              <div className="stat-info">
                <h3>Entrenamientos</h3>
                <p className="stat-value">{stats.totalWorkouts} total</p>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>{stats.workoutsLast7DaysCount} en la última semana</p>
              </div>
            </div>
            
            <div className="card glass-panel stat-card">
              <div className="stat-icon-wrapper" style={{ backgroundColor: 'rgba(245, 158, 11, 0.1)', color: '#f59e0b' }}>
                <Apple size={24} />
              </div>
              <div className="stat-info">
                <h3>Comidas</h3>
                <p className="stat-value">{stats.totalMeals} total</p>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>{stats.mealsToday} registradas hoy</p>
              </div>
            </div>

            <div className="card glass-panel stat-card">
              <div className="stat-icon-wrapper" style={{ backgroundColor: 'rgba(99, 102, 241, 0.1)', color: '#6366f1' }}>
                <Moon size={24} />
              </div>
              <div className="stat-info">
                <h3>Sueño</h3>
                <p className="stat-value">{stats.totalSleepLogs} registros</p>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
                  {stats.avgSleep > 0 ? `Promedio: ${stats.avgSleep.toFixed(1)}h/noche` : 'Sin promedio'}
                </p>
              </div>
            </div>

            <div className="card glass-panel stat-card">
              <div className="stat-icon-wrapper" style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', color: '#ef4444' }}>
                <Bandage size={24} />
              </div>
              <div className="stat-info">
                <h3>Lesiones</h3>
                <p className="stat-value">{stats.totalInjuries} historial</p>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>{stats.activeInjuries === 0 ? 'Ninguna activa' : `${stats.activeInjuries} activas actualmente`}</p>
              </div>
            </div>
          </div>

          {/* Recent Activity */}
          <div className="dashboard-main-content">
            <div className="card glass-panel recent-activity">
              <div className="card-header">
                <h3>Últimos Entrenamientos</h3>
                <Link to="/workouts" className="btn-link">Ver Todo <ChevronRight size={16} /></Link>
              </div>
              <div className="activity-list">
                {stats.recentWorkouts.length === 0 ? (
                  <p style={{ color: 'var(--text-secondary)', padding: '1rem 0' }}>Sin entrenamientos registrados aún.</p>
                ) : (
                  stats.recentWorkouts.map(w => (
                    <div key={w.id} className="activity-item">
                      <div className="activity-icon">🏋️‍♂️</div>
                      <div className="activity-details">
                        <h4>{w.title}</h4>
                        <p>{w.bodyPart} · {w.durationMinutes} min · Energía {w.energyLevel}/10</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="card glass-panel recent-activity">
              <div className="card-header">
                <h3>Últimas Comidas</h3>
                <Link to="/meals" className="btn-link">Ver Todo <ChevronRight size={16} /></Link>
              </div>
              <div className="activity-list">
                {stats.recentMeals.length === 0 ? (
                  <p style={{ color: 'var(--text-secondary)', padding: '1rem 0' }}>Sin comidas registradas aún.</p>
                ) : (
                  stats.recentMeals.map(m => (
                    <div key={m.id} className="activity-item">
                      <div className="activity-icon">🥗</div>
                      <div className="activity-details">
                        <h4>{m.name}</h4>
                        <p>{m.mealType} · {m.calories} kcal · P:{m.proteinG}g C:{m.carbsG}g G:{m.fatG}g</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};


