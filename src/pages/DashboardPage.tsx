import React, { useEffect, useState } from 'react';
import { Activity, Moon, Apple, Bandage, ChevronRight, HeartPulse, Brain } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { workoutService } from '../services/workout.service';
import { mealService } from '../services/meal.service';
import { sleepService } from '../services/sleep.service';
import { injuryService } from '../services/injury.service';
import type { Workout, Meal, SleepLog } from '../types';
import type { ApiResponse } from '../types/api';
import { calculateRecoveryScore, type RecoveryScoreResult } from '../utils/recoveryScore';
import type { BodyPart } from '../types/Workout';
import type { MealType } from '../types/Meal';
import { getCoachRecommendation, type CoachRecommendation } from '../utils/smartCoach';
import './DashboardPage.css';

const BODY_PART_LABELS: Record<BodyPart, string> = {
  CHEST: 'Pecho', BACK: 'Espalda', SHOULDERS: 'Hombros', BICEPS: 'Bíceps',
  TRICEPS: 'Tríceps', LEGS: 'Piernas', CORE: 'Core', CARDIO: 'Cardio',
  FULL_BODY: 'Cuerpo completo', OTHER: 'Otro',
};

const MEAL_TYPE_LABELS: Record<MealType, string> = {
  BREAKFAST: 'Desayuno', LUNCH: 'Almuerzo', DINNER: 'Cena', SNACK: 'Snack',
};

function getCoachColor(type: CoachRecommendation['type']): string {
  if (type === 'danger') return '#ef4444';
  if (type === 'warning') return '#f59e0b';
  if (type === 'success') return '#10b981';
  return '#3b82f6';
}

function isToday(date: Date, reference: Date): boolean {
  return (
    date.getDate() === reference.getDate() &&
    date.getMonth() === reference.getMonth() &&
    date.getFullYear() === reference.getFullYear()
  );
}

function averageHoursSlept(sleepLogs: SleepLog[]): number {
  if (sleepLogs.length === 0) return 0;
  const totalHours = sleepLogs.reduce((sum, log) => sum + log.hoursSlept, 0);
  return totalHours / sleepLogs.length;
}

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

const EMPTY_STATS: DashboardStats = {
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
};

function computeDashboardStats(
  workoutsRes: ApiResponse<Workout[]>,
  mealsRes: ApiResponse<Meal[]>,
  sleepsRes: ApiResponse<SleepLog[]>,
  injuriesRes: ApiResponse<{ isActive: boolean }[]>,
): DashboardStats {
  const activeInjuries = injuriesRes.data.filter((i) => i.isActive).length;

  const today = new Date();
  const mealsToday = mealsRes.data.filter((m) => isToday(new Date(m.date), today)).length;

  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  const workoutsLast7Days = workoutsRes.data.filter((w) => new Date(w.date) >= sevenDaysAgo);

  const lastSleep = sleepsRes.data[0] ?? null;

  return {
    totalWorkouts: workoutsRes.meta?.total ?? workoutsRes.data.length,
    totalMeals: mealsRes.meta?.total ?? mealsRes.data.length,
    totalSleepLogs: sleepsRes.meta?.total ?? sleepsRes.data.length,
    totalInjuries: injuriesRes.meta?.total ?? injuriesRes.data.length,
    workoutsLast7DaysCount: workoutsLast7Days.length,
    activeInjuries,
    avgSleep: averageHoursSlept(sleepsRes.data),
    mealsToday,
    lastSleep,
    recentWorkouts: workoutsRes.data.slice(0, 3),
    recentMeals: mealsRes.data.slice(0, 3),
    recoveryScore: calculateRecoveryScore(lastSleep, activeInjuries, workoutsLast7Days),
    coachRecommendation: getCoachRecommendation(lastSleep, activeInjuries, workoutsLast7Days),
  };
}

function RecoveryScoreCard({ recoveryScore }: { readonly recoveryScore: RecoveryScoreResult }) {
  const statusText = recoveryScore.status === 'Sin registros'
    ? 'Aún no tienes registros de sueño ni entrenamientos'
    : <>Tu estado actual es <strong style={{ color: recoveryScore.color }}>{recoveryScore.status}</strong></>;

  return (
    <div className="card glass-panel" style={{
      margin: 0,
      background: `linear-gradient(135deg, ${recoveryScore.color}20 0%, transparent 100%)`,
      borderLeft: `4px solid ${recoveryScore.color}`,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: '100%' }}>
        <div>
          <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', margin: '0 0 0.5rem 0' }}>
            <HeartPulse color={recoveryScore.color} />
            Recovery Score
          </h3>
          <p style={{ color: 'var(--text-secondary)', margin: 0 }}>{statusText}</p>
        </div>
        <div style={{
          fontSize: '2.5rem',
          fontWeight: 800,
          color: recoveryScore.color,
          backgroundColor: `${recoveryScore.color}15`,
          padding: '1rem 1.5rem',
          borderRadius: '1rem',
        }}>
          {recoveryScore.score}
          <span style={{ fontSize: '1rem', color: 'var(--text-secondary)', fontWeight: 500 }}>/100</span>
        </div>
      </div>
    </div>
  );
}

function CoachRecommendationCard({ coachRecommendation }: { readonly coachRecommendation: CoachRecommendation }) {
  const color = getCoachColor(coachRecommendation.type);

  return (
    <div className="card glass-panel" style={{ margin: 0, borderLeft: `4px solid ${color}` }}>
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%', justifyContent: 'center' }}>
        <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', margin: '0 0 0.5rem 0', color: 'var(--primary)' }}>
          <Brain size={20} />
          Coach Inteligente
        </h3>
        <strong style={{ display: 'block', marginBottom: '0.25rem', color }}>
          {coachRecommendation.message}
        </strong>
        <p style={{ color: 'var(--text-secondary)', margin: 0, fontSize: '0.9rem', lineHeight: '1.4' }}>
          {coachRecommendation.advice}
        </p>
      </div>
    </div>
  );
}

function RecentWorkoutsCard({ workouts }: { readonly workouts: Workout[] }) {
  return (
    <div className="card glass-panel recent-activity">
      <div className="card-header">
        <h3>Últimos Entrenamientos</h3>
        <Link to="/workouts" className="btn-link">Ver Todo <ChevronRight size={16} /></Link>
      </div>
      <div className="activity-list">
        {workouts.length === 0 ? (
          <p style={{ color: 'var(--text-secondary)', padding: '1rem 0' }}>Sin entrenamientos registrados aún.</p>
        ) : (
          workouts.map((w) => (
            <div key={w.id} className="activity-item">
              <div className="activity-icon">🏋️‍♂️</div>
              <div className="activity-details">
                <h4>{w.title}</h4>
                <p>{BODY_PART_LABELS[w.bodyPart as BodyPart] ?? w.bodyPart} · {w.durationMinutes} min · Energía {w.energyLevel}/10</p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

function RecentMealsCard({ meals }: { readonly meals: Meal[] }) {
  return (
    <div className="card glass-panel recent-activity">
      <div className="card-header">
        <h3>Últimas Comidas</h3>
        <Link to="/meals" className="btn-link">Ver Todo <ChevronRight size={16} /></Link>
      </div>
      <div className="activity-list">
        {meals.length === 0 ? (
          <p style={{ color: 'var(--text-secondary)', padding: '1rem 0' }}>Sin comidas registradas aún.</p>
        ) : (
          meals.map((m) => (
            <div key={m.id} className="activity-item">
              <div className="activity-icon">🥗</div>
              <div className="activity-details">
                <h4>{m.name}</h4>
                <p>{MEAL_TYPE_LABELS[m.mealType as MealType] ?? m.mealType} · {m.calories} kcal · P:{m.proteinG}g C:{m.carbsG}g G:{m.fatG}g</p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export const DashboardPage: React.FC = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats>(EMPTY_STATS);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadStats = async () => {
      try {
        const [workoutsRes, mealsRes, sleepsRes, injuriesRes] = await Promise.all([
          workoutService.getAll(1, 50),
          mealService.getAll(1, 50),
          sleepService.getAll(1, 50), // 50 para poder calcular el promedio con más muestra
          injuryService.getAll(1, 50),
        ]);
        setStats(computeDashboardStats(workoutsRes, mealsRes, sleepsRes, injuriesRes));
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
            {stats.recoveryScore && <RecoveryScoreCard recoveryScore={stats.recoveryScore} />}
            {stats.coachRecommendation && <CoachRecommendationCard coachRecommendation={stats.coachRecommendation} />}
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
            <RecentWorkoutsCard workouts={stats.recentWorkouts} />
            <RecentMealsCard meals={stats.recentMeals} />
          </div>
        </>
      )}
    </div>
  );
};
