import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { analyticsApi, bookingApi } from '../../api';
import StatusBadge from '../../components/ui/StatusBadge';
import {
  Users, ShieldCheck, Calendar, DollarSign, AlertTriangle,
  ArrowRight, BarChart2, Package, CheckCircle2, Clock
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid
} from 'recharts';

const AdminDashboard = () => {
  const navigate = useNavigate();

  const { data: analyticsData, isLoading: analyticsLoading } = useQuery({
    queryKey: ['admin-analytics'],
    queryFn: () => analyticsApi.get(),
  });

  const { data: bookingsData } = useQuery({
    queryKey: ['admin-recent-bookings'],
    queryFn: () => bookingApi.getAll({ limit: 8 }),
  });

  const rawData = analyticsData?.data?.data;
  const stats = {
    totalUsers: rawData?.users?.total ?? 0,
    totalCustomers: rawData?.users?.customers ?? 0,
    totalProviders: rawData?.users?.providers ?? 0,
    pendingApplications: rawData?.providers?.pending ?? 0,
    activeBookings: rawData?.bookings?.active ?? 0,
    completedBookings: rawData?.bookings?.completed ?? 0,
    openDisputes: rawData?.disputes?.open ?? 0,
    totalRevenue: rawData?.revenue?.total ?? 0,
  };

  const bookings = bookingsData?.data?.data?.bookings || [];

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      {/* Top Header */}
      <div className="flex justify-between items-center flex-wrap gap-3">
        <div>
          <h1 style={{ fontSize: '1.85rem', fontWeight: 800, margin: 0, fontFamily: 'Outfit, sans-serif' }}>
            Platform Administration 👑
          </h1>
          <p style={{ color: 'var(--color-ash-600)', margin: '0.2rem 0 0', fontSize: '0.9rem' }}>
            System health, provider verifications, category pricing rules, and platform metrics.
          </p>
        </div>

        <div className="flex gap-2">
          <Link to="/admin/providers" className="btn btn-secondary flex items-center gap-1 font-bold">
            <ShieldCheck size={16} /> Applications ({stats.pendingApplications || 0})
          </Link>
          <Link to="/admin/categories" className="btn btn-primary flex items-center gap-1 font-bold">
            <Package size={16} /> Categories & Pricing
          </Link>
        </div>
      </div>

      {/* 4 Primary KPI Cards */}
      <div className="grid grid-4 gap-3">
        <div
          style={{
            backgroundColor: '#ffffff',
            borderRadius: '16px',
            padding: '1.25rem',
            border: '1px solid var(--color-ash-200)',
          }}
        >
          <div className="flex justify-between items-center mb-1">
            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-ash-500)', textTransform: 'uppercase' }}>
              Total Platform Users
            </span>
            <Users size={18} className="text-ash-400" />
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--color-text)' }}>
            {stats.totalUsers}
          </div>
          <span style={{ fontSize: '0.75rem', color: 'var(--color-ash-500)' }}>
            Customers & Approved Providers
          </span>
        </div>

        <div
          style={{
            backgroundColor: '#ffffff',
            borderRadius: '16px',
            padding: '1.25rem',
            border: '1px solid var(--color-ash-200)',
          }}
        >
          <div className="flex justify-between items-center mb-1">
            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-ash-500)', textTransform: 'uppercase' }}>
              Pending Verifications
            </span>
            <ShieldCheck size={18} color="#d97706" />
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#d97706' }}>
            {stats.pendingApplications}
          </div>
          <Link
            to="/admin/providers"
            style={{ fontSize: '0.75rem', color: 'var(--color-primary)', fontWeight: 600, textDecoration: 'none' }}
          >
            Review Applications →
          </Link>
        </div>

        <div
          style={{
            backgroundColor: '#ffffff',
            borderRadius: '16px',
            padding: '1.25rem',
            border: '1px solid var(--color-ash-200)',
          }}
        >
          <div className="flex justify-between items-center mb-1">
            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-ash-500)', textTransform: 'uppercase' }}>
              Active Bookings
            </span>
            <Calendar size={18} className="text-primary" />
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--color-primary-dark)' }}>
            {stats.activeBookings}
          </div>
          <span style={{ fontSize: '0.75rem', color: '#166534', fontWeight: 600 }}>
            In-flight repair jobs
          </span>
        </div>

        <div
          style={{
            backgroundColor: '#ffffff',
            borderRadius: '16px',
            padding: '1.25rem',
            border: '1px solid var(--color-ash-200)',
          }}
        >
          <div className="flex justify-between items-center mb-1">
            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-ash-500)', textTransform: 'uppercase' }}>
              Gross Service Volume
            </span>
            <DollarSign size={18} color="#166534" />
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#166534' }}>
            ₹{stats.totalRevenue.toLocaleString('en-IN')}
          </div>
          <span style={{ fontSize: '0.75rem', color: 'var(--color-ash-500)' }}>
            Total processed turnover
          </span>
        </div>
      </div>

      {/* Analytics Chart */}
      <div
        style={{
          backgroundColor: '#ffffff',
          borderRadius: '20px',
          padding: '2rem',
          border: '1px solid var(--color-ash-200)',
          boxShadow: '0 4px 15px rgba(0, 0, 0, 0.02)',
        }}
      >
        <div className="flex justify-between items-center mb-4">
          <div>
            <h2 style={{ fontSize: '1.15rem', fontWeight: 800, margin: 0 }}>
              Weekly Booking & Revenue Run-Rate
            </h2>
            <p style={{ margin: '0.2rem 0 0', fontSize: '0.825rem', color: 'var(--color-ash-500)' }}>
              Completed household service volume
            </p>
          </div>
        </div>

        {bookings.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--color-ash-500)' }}>
            <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>📊</div>
            <p style={{ margin: 0, fontWeight: 600 }}>No bookings recorded yet</p>
            <p style={{ margin: '0.25rem 0 0', fontSize: '0.825rem' }}>As customers place service requests and book technicians, run-rates will appear here.</p>
          </div>
        ) : (
          <div style={{ width: '100%', height: 260 }}>
            <ResponsiveContainer>
              <BarChart data={bookings.map((b, i) => ({ name: `Job #${i + 1}`, bookings: 1, revenue: b.agreedAmount || 0 }))}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} />
                <YAxis stroke="#94a3b8" fontSize={12} />
                <Tooltip />
                <Bar dataKey="revenue" fill="#4a7c59" radius={[6, 6, 0, 0]} name="Revenue (₹)" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* Recent Bookings Across Platform */}
      <div
        style={{
          backgroundColor: '#ffffff',
          borderRadius: '20px',
          padding: '2rem',
          border: '1px solid var(--color-ash-200)',
        }}
      >
        <div className="flex justify-between items-center mb-4">
          <h2 style={{ fontSize: '1.15rem', fontWeight: 800, margin: 0 }}>
            Recent Platform Bookings
          </h2>
          <span style={{ fontSize: '0.825rem', color: 'var(--color-ash-500)' }}>Live audit monitor</span>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table className="table" style={{ width: '100%', fontSize: '0.85rem' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid var(--color-ash-200)', textAlign: 'left' }}>
                <th style={{ padding: '0.75rem 1rem' }}>Booking ID</th>
                <th style={{ padding: '0.75rem 1rem' }}>Customer</th>
                <th style={{ padding: '0.75rem 1rem' }}>Provider</th>
                <th style={{ padding: '0.75rem 1rem' }}>Category</th>
                <th style={{ padding: '0.75rem 1rem' }}>Status</th>
                <th style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>Amount</th>
              </tr>
            </thead>
            <tbody>
              {bookings.length === 0 ? (
                <tr>
                  <td colSpan="6" style={{ textAlign: 'center', padding: '2.5rem', color: 'var(--color-ash-500)' }}>
                    No bookings created yet. Live transactions will appear here.
                  </td>
                </tr>
              ) : (
                bookings.map((b) => (
                  <tr key={b._id} style={{ borderBottom: '1px solid var(--color-ash-100)' }}>
                    <td style={{ padding: '0.85rem 1rem', fontFamily: 'monospace', fontWeight: 600 }}>
                      #{b.bookingNumber || b._id.slice(-6).toUpperCase()}
                    </td>
                    <td style={{ padding: '0.85rem 1rem', fontWeight: 600 }}>
                      {b.customerId?.name || 'Customer'}
                    </td>
                    <td style={{ padding: '0.85rem 1rem' }}>
                      {b.providerId?.name || 'Unassigned'}
                    </td>
                    <td style={{ padding: '0.85rem 1rem' }}>
                      {b.category?.name || 'General Repair'}
                    </td>
                    <td style={{ padding: '0.85rem 1rem' }}>
                      <StatusBadge status={b.status} />
                    </td>
                    <td style={{ padding: '0.85rem 1rem', textAlign: 'right', fontWeight: 800 }}>
                      ₹{b.agreedAmount || '—'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
