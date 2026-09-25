import React, { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import {
  Home, Package, Calendar, Star, DollarSign, User, Bell,
  LogOut, Menu, X, ShieldCheck, Settings, Users, BarChart2,
  ClipboardList, AlertTriangle, BookOpen, Headphones, Briefcase,
  ChevronRight, MessageSquare
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { notificationApi } from '../../api';
import NotificationPanel from '../notifications/NotificationPanel';

const navConfigs = {
  customer: [
    { to: '/customer/dashboard', icon: Home, label: 'Dashboard' },
    { to: '/customer/bookings', icon: Calendar, label: 'My Bookings' },
    { to: '/customer/disputes', icon: AlertTriangle, label: 'Help & Disputes' },
    { to: '/customer/notifications', icon: Bell, label: 'Notifications' },
    { to: '/customer/profile', icon: User, label: 'Profile' },
  ],
  provider: [
    { to: '/provider/dashboard', icon: Home, label: 'Dashboard' },
    { to: '/provider/jobs', icon: Briefcase, label: 'Jobs' },
    { to: '/provider/availability', icon: Calendar, label: 'Availability' },
    { to: '/provider/earnings', icon: DollarSign, label: 'Earnings' },
    { to: '/provider/profile', icon: User, label: 'Profile' },
  ],
  admin: [
    { to: '/admin/dashboard', icon: BarChart2, label: 'Dashboard' },
    { to: '/admin/providers', icon: ShieldCheck, label: 'Provider Verification' },
    { to: '/admin/categories', icon: Package, label: 'Categories' },
    { to: '/admin/users', icon: Users, label: 'User Management' },
    { to: '/admin/disputes', icon: AlertTriangle, label: 'Disputes' },
    { to: '/admin/audit', icon: BookOpen, label: 'Audit Logs' },
  ],
  operations: [
    { to: '/operations/dashboard', icon: ClipboardList, label: 'Operations' },
    { to: '/operations/cancellations', icon: X, label: 'Cancellations' },
  ],
  support: [
    { to: '/support/dashboard', icon: Headphones, label: 'Support Center' },
  ],
};

const roleLabels = {
  customer: 'Customer',
  provider: 'Service Provider',
  admin: 'Platform Admin',
  operations: 'Operations Manager',
  support: 'Support Agent',
};

const roleColors = {
  customer: '#4a7c59',
  provider: '#2563eb',
  admin: '#7c3aed',
  operations: '#e8860a',
  support: '#0891b2',
};

const DashboardLayout = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);

  const { data: notifData } = useQuery({
    queryKey: ['notifications-count'],
    queryFn: () => notificationApi.getAll({ unreadOnly: 'true', limit: 1 }),
    refetchInterval: 30000,
    select: (res) => res.data.data?.unreadCount || 0,
  });

  const navItems = navConfigs[user?.role] || [];
  const roleColor = roleColors[user?.role] || '#4a7c59';

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const getInitials = (name) => {
    if (!name) return '?';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const Sidebar = () => (
    <aside className={`dashboard-sidebar ${sidebarOpen ? 'open' : ''}`}>
      {/* Brand */}
      <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--color-ash-200)' }}>
        <div className="flex items-center gap-3">
          <div style={{
            width: 40, height: 40, borderRadius: '50%',
            background: `linear-gradient(135deg, ${roleColor}, ${roleColor}cc)`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '1.2rem', flexShrink: 0
          }}>🏠</div>
          <div>
            <div style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 800, fontSize: '1.1rem', color: 'var(--color-text)', lineHeight: 1 }}>CareConnect</div>
            <div style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)', marginTop: 2 }}>{roleLabels[user?.role]}</div>
          </div>
        </div>
      </div>

      {/* User info */}
      <div style={{ padding: '1rem 1.25rem', background: 'var(--color-ash-50)', borderBottom: '1px solid var(--color-ash-200)' }}>
        <div className="flex items-center gap-3">
          <div className="avatar avatar-md" style={{ background: `${roleColor}20`, color: roleColor, fontSize: '0.85rem' }}>
            {getInitials(user?.name)}
          </div>
          <div className="flex-1 truncate">
            <div style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--color-text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user?.name}</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>@{user?.username}</div>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="sidebar-nav" style={{ padding: '0.75rem 0.5rem', flex: 1 }}>
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) => `sidebar-nav-item ${isActive ? 'active' : ''}`}
            style={({ isActive }) => ({ position: 'relative', color: isActive ? roleColor : undefined })}
            onClick={() => setSidebarOpen(false)}
          >
            <item.icon size={18} />
            {item.label}
          </NavLink>
        ))}

        {/* Customer quick action */}
        {user?.role === 'customer' && (
          <NavLink
            to="/customer/request"
            className="sidebar-nav-item"
            style={{ marginTop: '1rem', background: 'linear-gradient(135deg, #4a7c59, #6aaa7e)', color: 'white', borderRadius: 'var(--radius-md)' }}
            onClick={() => setSidebarOpen(false)}
          >
            <Package size={18} />
            Book a Service
          </NavLink>
        )}
      </nav>

      {/* Logout */}
      <div style={{ padding: '0.75rem', borderTop: '1px solid var(--color-ash-200)' }}>
        <button onClick={handleLogout} className="sidebar-nav-item w-full btn-ghost" style={{ color: 'var(--color-error)', width: '100%' }}>
          <LogOut size={18} />
          Sign Out
        </button>
      </div>
    </aside>
  );

  return (
    <div className="dashboard-layout">
      <Sidebar />

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 99 }}
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <div className="dashboard-main">
        {/* Topbar */}
        <header className="topbar">
          <button
            className="btn-ghost btn-icon"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            style={{ display: 'none' }}
            id="sidebar-toggle"
          >
            <Menu size={20} />
          </button>

          <div className="flex-1" />

          {/* Notifications */}
          <div style={{ position: 'relative' }}>
            <button
              className="btn-ghost btn-icon notif-badge"
              onClick={() => setShowNotifications(!showNotifications)}
              title="Notifications"
            >
              <Bell size={20} />
              {notifData > 0 && (
                <span className="notif-dot">{notifData > 9 ? '9+' : notifData}</span>
              )}
            </button>

            {/* Notification panel */}
            {showNotifications && (
              <NotificationPanel onClose={() => setShowNotifications(false)} />
            )}
          </div>

          {/* User avatar */}
          <div className="flex items-center gap-2" style={{ marginLeft: '0.5rem' }}>
            <div className="avatar avatar-sm" style={{ background: `${roleColor}20`, color: roleColor, fontSize: '0.7rem' }}>
              {getInitials(user?.name)}
            </div>
            <span style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--color-text)' }}>{user?.name?.split(' ')[0]}</span>
          </div>
        </header>

        {/* Page content */}
        <main className="dashboard-content">
          <Outlet />
        </main>
      </div>

      <style>{`
        #sidebar-toggle {
          display: flex !important;
        }
        @media (min-width: 1024px) {
          #sidebar-toggle { display: none !important; }
        }
      `}</style>
    </div>
  );
};

export default DashboardLayout;
