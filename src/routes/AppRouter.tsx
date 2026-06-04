import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { MainLayout } from '../layouts/MainLayout';
import { ProtectedRoute } from './ProtectedRoute';
import { PublicRoute } from './PublicRoute';
import { LoginPage } from '../pages/LoginPage';
import { RegisterPage } from '../pages/RegisterPage';
import { DashboardPage } from '../pages/DashboardPage';
import { WorkoutsPage } from '../pages/WorkoutsPage';
import { MealsPage } from '../pages/MealsPage';
import { SleepPage } from '../pages/SleepPage';
import { InjuriesPage } from '../pages/InjuriesPage';
import { ProfilePage } from '../pages/ProfilePage';
import { GymFinderPage } from '../pages/GymFinderPage';
import { NotFoundPage } from '../pages/NotFoundPage';

export const AppRouter: React.FC = () => {
  return (
    <Routes>
      {/* Public Routes */}
      <Route element={<PublicRoute />}>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
      </Route>
      
      {/* Protected Routes Wrapper */}
      <Route element={<ProtectedRoute />}>
        <Route path="/" element={<MainLayout />}>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<DashboardPage />} />
          <Route path="workouts" element={<WorkoutsPage />} />
          <Route path="meals" element={<MealsPage />} />
          <Route path="sleep" element={<SleepPage />} />
          <Route path="injuries" element={<InjuriesPage />} />
          <Route path="gyms" element={<GymFinderPage />} />
          <Route path="profile" element={<ProfilePage />} />
        </Route>
      </Route>

      {/* 404 Not Found */}
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
};
