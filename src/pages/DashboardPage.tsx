import React, { useEffect, useState } from 'react';
import { Activity, Moon, Apple, Bandage, ChevronRight, HeartPulse } from 'lucide-react';
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
import './DashboardPage.css';

interface DashboardStats {
  totalWorkouts: number;
  mealsToday: number;
  lastSleep: SleepLog | null;
  activeInjuries: number;
  recentWorkouts: Workout[];
  recentMeals: Meal[];
  recoveryScore: RecoveryScoreResult | null;
}

export const DashboardPage: React.FC = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats>({
    totalWorkouts: 0,
    mealsToday: 0,
    lastSleep: null,
    activeInjuries: 0,
    recentWorkouts: [],
    recentMeals: [],
    recoveryScore: null,
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadStats = async () => {
      try {
        const [workoutsRes, mealsRes, sleepsRes, injuriesRes] = await Promise.all([
          workoutService.getAll(1, 50),
          mealService.getAll(1, 50),
          sleepService.getAll(1, 1),
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

        setStats({
          totalWorkouts: workoutsRes.meta?.total ?? workoutsRes.data.length,
          mealsToday,
          lastSleep,
          activeInjuries,
          recentWorkouts: workoutsRes.data.slice(0, 3),
          recentMeals: mealsRes.data.slice(0, 3),
          recoveryScore,
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
          {/* Recovery Score Card */}
          {stats.recoveryScore && (
            <div className="card glass-panel" style={{ 
              marginBottom: '2rem', 
              background: `linear-gradient(135deg, ${stats.recoveryScore.color}20 0%, transparent 100%)`,
              borderLeft: `4px solid ${stats.recoveryScore.color}`
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', margin: '0 0 0.5rem 0' }}>
                    <HeartPulse color={stats.recoveryScore.color} />
                    Recovery Score
                  </h3>
                  <p style={{ color: 'var(--text-secondary)', margin: 0 }}>
                    Tu estado de recuperación actual es <strong style={{ color: stats.recoveryScore.color }}>{stats.recoveryScore.status}</strong>
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

          {/* Stats Cards */}
          <div className="dashboard-grid">
            <div className="card glass-panel stat-card">
              <div className="stat-icon-wrapper" style={{ backgroundColor: 'rgba(16, 185, 129, 0.1)', color: '#10B981' }}>
                <Activity size={24} />
              </div>
              <div className="stat-info">
                <h3>Entrenamientos</h3>
                <p className="stat-value">{stats.recentWorkouts.length} recientes</p>
              </div>
            </div>
            
            <div className="card glass-panel stat-card">
              <div className="stat-icon-wrapper" style={{ backgroundColor: 'rgba(245, 158, 11, 0.1)', color: '#f59e0b' }}>
                <Apple size={24} />
              </div>
              <div className="stat-info">
                <h3>Comidas Hoy</h3>
                <p className="stat-value">{stats.mealsToday} registradas</p>
              </div>
            </div>

            <div className="card glass-panel stat-card">
              <div className="stat-icon-wrapper" style={{ backgroundColor: 'rgba(99, 102, 241, 0.1)', color: '#6366f1' }}>
                <Moon size={24} />
              </div>
              <div className="stat-info">
                <h3>Último Sueño</h3>
                <p className="stat-value">
                  {stats.lastSleep ? `${stats.lastSleep.hoursSlept}h — Calidad ${stats.lastSleep.sleepQuality}/10` : 'Sin registro'}
                </p>
              </div>
            </div>

            <div className="card glass-panel stat-card">
              <div className="stat-icon-wrapper" style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', color: '#ef4444' }}>
                <Bandage size={24} />
              </div>
              <div className="stat-info">
                <h3>Lesiones Activas</h3>
                <p className="stat-value">{stats.activeInjuries === 0 ? '¡Sin lesiones!' : `${stats.activeInjuries} activa(s)`}</p>
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

