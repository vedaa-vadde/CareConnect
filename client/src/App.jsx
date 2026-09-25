import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider, useAuth } from './contexts/AuthContext';

// Pages - Public
import IntroAnimation from './pages/IntroAnimation';
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';
import ProviderApplyPage from './pages/auth/ProviderApplyPage';

// Pages - Customer
import CustomerDashboard from './pages/customer/CustomerDashboard';
import ServiceRequestPage from './pages/customer/ServiceRequestPage';
import QuoteComparisonPage from './pages/customer/QuoteComparisonPage';
import BookingPage from './pages/customer/BookingPage';
import BookingDetailPage from './pages/customer/BookingDetailPage';
import CustomerBookingsPage from './pages/customer/CustomerBookingsPage';
import CustomerNotificationsPage from './pages/customer/CustomerNotificationsPage';
import CustomerProfilePage from './pages/customer/CustomerProfilePage';
import CustomerDisputesPage from './pages/customer/CustomerDisputesPage';

// Pages - Provider
import ProviderDashboard from './pages/provider/ProviderDashboard';
import ProviderJobsPage from './pages/provider/ProviderJobsPage';
import ProviderAvailabilityPage from './pages/provider/ProviderAvailabilityPage';
import ProviderEarningsPage from './pages/provider/ProviderEarningsPage';
import ProviderProfilePage from './pages/provider/ProviderProfilePage';
import ProviderApplicationStatus from './pages/provider/ProviderApplicationStatus';

// Pages - Admin
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminProviderApplications from './pages/admin/AdminProviderApplications';
import AdminCategoryManagement from './pages/admin/AdminCategoryManagement';
import AdminUserManagement from './pages/admin/AdminUserManagement';
import AdminDisputeManagement from './pages/admin/AdminDisputeManagement';
import AdminAuditLogs from './pages/admin/AdminAuditLogs';

// Pages - Operations
import OperationsDashboard from './pages/operations/OperationsDashboard';
import OperationsCancellations from './pages/operations/OperationsCancellations';

// Pages - Support
import SupportDashboard from './pages/support/SupportDashboard';

// Layouts
import DashboardLayout from './components/layout/DashboardLayout';
import LoadingSpinner from './components/ui/LoadingSpinner';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 2,
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

// Route Guards
const PrivateRoute = ({ children, roles }) => {
  const { user, loading } = useAuth();
  if (loading) return <LoadingSpinner fullPage />;
  if (!user) return <Navigate to="/login" replace />;
  if (roles && !roles.includes(user.role)) return <Navigate to="/dashboard" replace />;
  return children;
};

const PublicRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <LoadingSpinner fullPage />;
  if (user) return <Navigate to="/dashboard" replace />;
  return children;
};

const DashboardRedirect = () => {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  const dashboardMap = {
    customer: '/customer/dashboard',
    provider: '/provider/dashboard',
    admin: '/admin/dashboard',
    operations: '/operations/dashboard',
    support: '/support/dashboard',
  };
  return <Navigate to={dashboardMap[user.role] || '/login'} replace />;
};

const AppContent = () => {
  const [showIntro, setShowIntro] = useState(() => {
    return !sessionStorage.getItem('cc_intro_seen');
  });

  const handleIntroComplete = () => {
    sessionStorage.setItem('cc_intro_seen', '1');
    setShowIntro(false);
  };

  if (showIntro) {
    return <IntroAnimation onComplete={handleIntroComplete} />;
  }

  return (
    <Router>
      <Routes>
        {/* Public */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<PublicRoute><LoginPage /></PublicRoute>} />
        <Route path="/register" element={<PublicRoute><RegisterPage /></PublicRoute>} />
        <Route path="/provider-apply" element={<PublicRoute><ProviderApplyPage /></PublicRoute>} />

        {/* Dashboard redirect */}
        <Route path="/dashboard" element={<PrivateRoute><DashboardRedirect /></PrivateRoute>} />

        {/* Customer Routes */}
        <Route path="/customer" element={<PrivateRoute roles={['customer']}><DashboardLayout /></PrivateRoute>}>
          <Route path="dashboard" element={<CustomerDashboard />} />
          <Route path="request" element={<ServiceRequestPage />} />
          <Route path="request/:id/quotes" element={<QuoteComparisonPage />} />
          <Route path="book/:quoteId" element={<BookingPage />} />
          <Route path="bookings" element={<CustomerBookingsPage />} />
          <Route path="bookings/:id" element={<BookingDetailPage />} />
          <Route path="notifications" element={<CustomerNotificationsPage />} />
          <Route path="profile" element={<CustomerProfilePage />} />
          <Route path="disputes" element={<CustomerDisputesPage />} />
        </Route>

        {/* Provider Routes */}
        <Route path="/provider" element={<PrivateRoute roles={['provider']}><DashboardLayout /></PrivateRoute>}>
          <Route path="application-status" element={<ProviderApplicationStatus />} />
          <Route path="dashboard" element={<ProviderDashboard />} />
          <Route path="jobs" element={<ProviderJobsPage />} />
          <Route path="availability" element={<ProviderAvailabilityPage />} />
          <Route path="earnings" element={<ProviderEarningsPage />} />
          <Route path="profile" element={<ProviderProfilePage />} />
        </Route>

        {/* Admin Routes */}
        <Route path="/admin" element={<PrivateRoute roles={['admin']}><DashboardLayout /></PrivateRoute>}>
          <Route path="dashboard" element={<AdminDashboard />} />
          <Route path="providers" element={<AdminProviderApplications />} />
          <Route path="categories" element={<AdminCategoryManagement />} />
          <Route path="users" element={<AdminUserManagement />} />
          <Route path="disputes" element={<AdminDisputeManagement />} />
          <Route path="audit" element={<AdminAuditLogs />} />
        </Route>

        {/* Operations Routes */}
        <Route path="/operations" element={<PrivateRoute roles={['operations', 'admin']}><DashboardLayout /></PrivateRoute>}>
          <Route path="dashboard" element={<OperationsDashboard />} />
          <Route path="cancellations" element={<OperationsCancellations />} />
        </Route>

        {/* Support Routes */}
        <Route path="/support" element={<PrivateRoute roles={['support', 'admin']}><DashboardLayout /></PrivateRoute>}>
          <Route path="dashboard" element={<SupportDashboard />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
};

const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <AppContent />
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: '#fff',
              color: '#1a2330',
              boxShadow: '0 10px 30px rgba(0,0,0,0.12)',
              borderRadius: '12px',
              padding: '12px 16px',
              fontSize: '0.875rem',
              fontFamily: "'Inter', sans-serif",
            },
            success: {
              iconTheme: { primary: '#4a7c59', secondary: '#fff' },
            },
            error: {
              iconTheme: { primary: '#d73a3a', secondary: '#fff' },
            },
          }}
        />
      </AuthProvider>
    </QueryClientProvider>
  );
};

export default App;
