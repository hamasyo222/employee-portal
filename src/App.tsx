import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './stores/authStore';
import Layout from './components/Layout';
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import LMSPage from './pages/lms/LMSPage';
import CoursePage from './pages/lms/CoursePage';
import MatchingPage from './pages/matching/MatchingPage';
import ProfilePage from './pages/profile/ProfilePage';
import AdminPage from './pages/admin/AdminPage';
import AnalyticsPage from './pages/analytics/AnalyticsPage';
import { SupportPage } from './pages/support/SupportPage';
import ProjectsPage from './pages/projects/ProjectsPage';
import PaymentPage from './pages/payment/PaymentPage';
import CheckoutPage from './pages/payment/CheckoutPage';
import CompanyDashboardPage from './pages/company/CompanyDashboardPage';
import InvitationPage from './pages/company/InvitationPage';
import CouponManagementPage from './pages/admin/CouponManagementPage';
import ChatPage from './pages/chat/ChatPage';
import ProtectedRoute from './components/ProtectedRoute';

function App() {
  const { isAuthenticated, user } = useAuthStore();

  if (!isAuthenticated) {
    return (
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    );
  }

  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/profile" element={<ProfilePage />} />
        
        {/* LMS Routes */}
        <Route path="/lms" element={<LMSPage />} />
        <Route path="/lms/course/:courseId" element={<CoursePage />} />
        
        {/* Matching Routes */}
        <Route 
          path="/matching" 
          element={
            <ProtectedRoute allowedUserTypes={['company_admin', 'company_employee']}>
              <MatchingPage />
            </ProtectedRoute>
          } 
        />
        
        {/* Projects Routes */}
        <Route 
          path="/projects" 
          element={
            <ProtectedRoute allowedUserTypes={['dx_talent']}>
              <ProjectsPage />
            </ProtectedRoute>
          } 
        />
        
        {/* Support Routes */}
        <Route 
          path="/support/*" 
          element={
            <ProtectedRoute allowedUserTypes={['foreign_talent']}>
              <SupportPage />
            </ProtectedRoute>
          } 
        />
        
        {/* Payment Routes */}
        <Route path="/payment" element={<PaymentPage />} />
        <Route path="/payment/checkout/:productId" element={<CheckoutPage />} />
        
        {/* Company Routes */}
        <Route 
          path="/company/*" 
          element={
            <ProtectedRoute allowedUserTypes={['company_admin']}>
              <CompanyDashboardPage />
            </ProtectedRoute>
          } 
        />
        
        {/* Admin Routes */}
        <Route 
          path="/admin/*" 
          element={
            <ProtectedRoute allowedUserTypes={['admin']}>
              <AdminPage />
            </ProtectedRoute>
          } 
        />
        
        {/* Analytics Routes */}
        <Route 
          path="/analytics" 
          element={
            <ProtectedRoute allowedUserTypes={['admin', 'company_admin']}>
              <AnalyticsPage />
            </ProtectedRoute>
          } 
        />
        
        {/* Chat Routes */}
        <Route path="/chat" element={<ChatPage />} />
        
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </Layout>
  );
}

export default App;