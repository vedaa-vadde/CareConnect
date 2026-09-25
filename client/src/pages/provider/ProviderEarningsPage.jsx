import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { providerApi, bookingApi } from '../../api';
import {
  DollarSign, TrendingUp, Calendar, CreditCard, ArrowUpRight,
  CheckCircle2, Clock, ShieldCheck, Download
} from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid
} from 'recharts';

const dummyMonthlyData = [
  { name: 'Apr', amount: 14500 },
  { name: 'May', amount: 19800 },
  { name: 'Jun', amount: 22400 },
  { name: 'Jul', amount: 26000 },
  { name: 'Aug', amount: 31200 },
  { name: 'Sep', amount: 28500 },
];

const ProviderEarningsPage = () => {
  const { data: profileData } = useQuery({
    queryKey: ['provider-me-profile'],
    queryFn: () => providerApi.getMe(),
  });

  const { data: bookingsData } = useQuery({
    queryKey: ['provider-all-jobs'],
    queryFn: () => bookingApi.getAll({ limit: 50 }),
  });

  const profile = profileData?.data?.data?.profile;
  const bookings = bookingsData?.data?.data?.bookings || [];

  const completedBookings = bookings.filter(
    (b) => ['confirmed_by_customer', 'completed'].includes(b.status)
  );

  const earnings = {
    today: profile?.earnings?.today ?? 0,
    thisWeek: profile?.earnings?.thisWeek ?? 0,
    thisMonth: profile?.earnings?.thisMonth ?? 0,
    total: profile?.earnings?.total ?? 0,
    pending: profile?.earnings?.pending ?? 0,
  };

  return (
    <div style={{ maxWidth: 1050, margin: '0 auto', paddingBottom: '3rem' }}>
      <div className="flex justify-between items-center flex-wrap gap-2 mb-4">
        <div>
          <h1 style={{ fontSize: '1.85rem', fontWeight: 800, margin: 0, fontFamily: 'Outfit, sans-serif' }}>
            Earnings & Payouts 💰
          </h1>
          <p style={{ color: 'var(--color-ash-600)', margin: '0.2rem 0 0', fontSize: '0.9rem' }}>
            Track revenue, completed job remittances, and bank transfers.
          </p>
        </div>
      </div>

      {/* 4 Financial KPI Cards */}
      <div className="grid grid-4 gap-3 mb-4">
        <div
          style={{
            backgroundColor: '#ffffff',
            borderRadius: '16px',
            padding: '1.25rem',
            border: '1px solid var(--color-ash-200)',
          }}
        >
          <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-ash-500)', textTransform: 'uppercase' }}>
            Today's Earnings
          </div>
          <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--color-primary-dark)', margin: '0.25rem 0' }}>
            ₹{earnings.today}
          </div>
          <span style={{ fontSize: '0.75rem', color: 'var(--color-ash-500)' }}>
            Daily realized volume
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
          <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-ash-500)', textTransform: 'uppercase' }}>
            This Week
          </div>
          <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--color-text)', margin: '0.25rem 0' }}>
            ₹{earnings.thisWeek}
          </div>
          <span style={{ fontSize: '0.75rem', color: 'var(--color-ash-500)' }}>
            Weekly cycle
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
          <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-ash-500)', textTransform: 'uppercase' }}>
            This Month
          </div>
          <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--color-text)', margin: '0.25rem 0' }}>
            ₹{earnings.thisMonth}
          </div>
          <span style={{ fontSize: '0.75rem', color: 'var(--color-ash-500)' }}>
            Current month cycle
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
          <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-ash-500)', textTransform: 'uppercase' }}>
            Pending Clearance
          </div>
          <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#d97706', margin: '0.25rem 0' }}>
            ₹{earnings.pending}
          </div>
          <span style={{ fontSize: '0.75rem', color: 'var(--color-ash-500)' }}>
            Processing to bank
          </span>
        </div>
      </div>

      {/* Chart Section */}
      <div
        style={{
          backgroundColor: '#ffffff',
          borderRadius: '20px',
          padding: '2rem',
          border: '1px solid var(--color-ash-200)',
          boxShadow: '0 4px 15px rgba(0, 0, 0, 0.02)',
          marginBottom: '2rem',
        }}
      >
        <div className="flex justify-between items-center mb-4">
          <div>
            <h2 style={{ fontSize: '1.15rem', fontWeight: 800, margin: 0 }}>
              Monthly Revenue Performance
            </h2>
            <p style={{ margin: '0.2rem 0 0', fontSize: '0.825rem', color: 'var(--color-ash-500)' }}>
              Direct customer booking payouts in INR (₹)
            </p>
          </div>
          <div style={{ fontWeight: 800, fontSize: '1.1rem', color: 'var(--color-primary-dark)' }}>
            Lifetime: ₹{earnings.total}
          </div>
        </div>

        {completedBookings.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--color-ash-500)' }}>
            <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>📊</div>
            <p style={{ margin: 0, fontWeight: 600 }}>No completed payout records yet</p>
            <p style={{ margin: '0.25rem 0 0', fontSize: '0.825rem' }}>Complete assigned service bookings to generate monthly payout curves.</p>
          </div>
        ) : (
          <div style={{ width: '100%', height: 260 }}>
            <ResponsiveContainer>
              <AreaChart data={completedBookings.map((b, i) => ({ name: `Job #${i + 1}`, amount: b.agreedAmount || 0 }))}>
                <defs>
                  <linearGradient id="colorEarnings" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#4a7c59" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#4a7c59" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} />
                <YAxis stroke="#94a3b8" fontSize={12} tickFormatter={(v) => `₹${v}`} />
                <Tooltip formatter={(val) => [`₹${val}`, 'Payout']} />
                <Area type="monotone" dataKey="amount" stroke="#4a7c59" strokeWidth={2.5} fillOpacity={1} fill="url(#colorEarnings)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* Recent Remittances Table */}
      <div
        style={{
          backgroundColor: '#ffffff',
          borderRadius: '20px',
          padding: '2rem',
          border: '1px solid var(--color-ash-200)',
        }}
      >
        <h2 style={{ fontSize: '1.15rem', fontWeight: 800, margin: '0 0 1rem' }}>
          Completed Service Earnings History
        </h2>

        {completedBookings.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--color-ash-500)', fontSize: '0.875rem' }}>
            No completed jobs with settled invoices yet.
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="table" style={{ width: '100%', fontSize: '0.85rem' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid var(--color-ash-200)', textAlign: 'left' }}>
                  <th style={{ padding: '0.75rem 1rem' }}>Booking Ref</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Customer</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Service Category</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Date</th>
                  <th style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>Amount</th>
                  <th style={{ padding: '0.75rem 1rem', textAlign: 'center' }}>Settlement</th>
                </tr>
              </thead>
              <tbody>
                {completedBookings.map((b) => (
                  <tr key={b._id} style={{ borderBottom: '1px solid var(--color-ash-100)' }}>
                    <td style={{ padding: '0.85rem 1rem', fontFamily: 'monospace', fontWeight: 600 }}>
                      #{b.bookingNumber || b._id.slice(-6).toUpperCase()}
                    </td>
                    <td style={{ padding: '0.85rem 1rem', fontWeight: 600 }}>
                      {b.customerId?.name || 'Customer'}
                    </td>
                    <td style={{ padding: '0.85rem 1rem' }}>
                      {b.category?.name || 'Home Maintenance'}
                    </td>
                    <td style={{ padding: '0.85rem 1rem', color: 'var(--color-ash-600)' }}>
                      {new Date(b.scheduledDate).toLocaleDateString()}
                    </td>
                    <td style={{ padding: '0.85rem 1rem', textAlign: 'right', fontWeight: 800, color: 'var(--color-primary-dark)' }}>
                      ₹{b.agreedAmount}
                    </td>
                    <td style={{ padding: '0.85rem 1rem', textAlign: 'center' }}>
                      <span
                        style={{
                          backgroundColor: '#dcfce7',
                          color: '#166534',
                          padding: '0.2rem 0.6rem',
                          borderRadius: '999px',
                          fontSize: '0.75rem',
                          fontWeight: 700,
                        }}
                      >
                        ✓ Settled
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProviderEarningsPage;
