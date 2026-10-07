import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Home from '../pages/public/Home';
import Login from '../pages/admin/Login';
import Dashboard from '../pages/admin/Dashboard';
import SettingsPage from '../pages/admin/Settings';

import { authService } from '../services/authService';

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const isAuth = authService.isAuthenticated();
  return isAuth ? <>{children}</> : <Navigate to="/admin/login" replace />;
};

const AppRouter = () => {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<Home />} />
        
        {/* Admin Routes */}
        <Route path="/admin" element={<Navigate to="/admin/dashboard" replace />} />
        <Route path="/admin/login" element={<Login />} />
        <Route 
          path="/admin/*" 
          element={
            <ProtectedRoute>
              <Routes>
                <Route path="/" element={<Navigate to="/admin/dashboard" replace />} />
                <Route path="dashboard" element={<Dashboard />} />
                <Route path="settings" element={<SettingsPage />} />
                {/* Additional Admin routes */}
              </Routes>
            </ProtectedRoute>
          } 
        />
      </Routes>
    </BrowserRouter>
  );
};

export default AppRouter;
