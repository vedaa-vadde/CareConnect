import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { bookingApi, serviceRequestApi, categoryApi } from '../../api';
import { useAuth } from '../../contexts/AuthContext';
import StatusBadge from '../../components/ui/StatusBadge';
import EmptyState from '../../components/ui/EmptyState';
import {
  Calendar, Plus, Clock, ArrowRight, ShieldCheck, MapPin,
  ChevronRight, Sparkles, AlertCircle, Wrench, CheckCircle2
} from 'lucide-react';

const CustomerDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  // Fetch customer's bookings
  const { data: bookingsData, isLoading: bookingsLoading } = useQuery({
    queryKey: ['customer-bookings'],
    queryFn: () => bookingApi.getAll({ limit: 5 }),
  });

  // Fetch pending service requests waiting for quotes
  const { data: requestsData, isLoading: requestsLoading } = useQuery({
    queryKey: ['customer-requests'],
    queryFn: () => serviceRequestApi.getAll({ status: 'pending,quotes_received' }),
  });

  // Fetch categories for 1-click booking
  const { data: catData } = useQuery({
    queryKey: ['service-categories'],
    queryFn: () => categoryApi.getAll(),
  });

  const rawBookings = bookingsData?.data?.data;
  const bookings = Array.isArray(rawBookings)
    ? rawBookings
    : (rawBookings?.bookings || rawBookings?.items || bookingsData?.data?.bookings || []);

  const rawReq = requestsData?.data?.data;
  const pendingRequests = Array.isArray(rawReq)
    ? rawReq
    : (rawReq?.serviceRequests || rawReq?.items || requestsData?.data?.serviceRequests || []);

  const rawCat = catData?.data?.data;
  const categories = Array.isArray(rawCat)
    ? rawCat
    : (rawCat?.categories || rawCat?.items || catData?.data?.categories || []);

  // Find active booking (in progress, on the way, confirmed, evidence uploaded)
  const activeBooking = bookings.find((b) =>
    ['confirmed', 'assigned', 'on_the_way', 'in_progress', 'evidence_uploaded'].includes(b.status)
  );

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      {/* Welcome Banner */}
      <div
        style={{
          background: 'linear-gradient(135deg, #4a7c59 0%, #365b41 100%)',
          borderRadius: '24px',
          padding: '2rem 2.5rem',
          color: '#ffffff',
          boxShadow: '0 10px 25px -5px rgba(74, 124, 89, 0.3)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1.5rem',
        }}
      >
        <div>
          <span
            style={{
              display: 'inline-block',
              backgroundColor: 'rgba(255, 255, 255, 0.2)',
              padding: '0.25rem 0.75rem',
              borderRadius: '999px',
              fontSize: '0.8rem',
              fontWeight: 600,
              marginBottom: '0.75rem',
            }}
          >
            👋 Welcome back
          </span>
          <h1 style={{ fontSize: '1.85rem', fontWeight: 800, margin: '0 0 0.5rem', fontFamily: 'Outfit, sans-serif' }}>
            Hello, {user?.name}!
          </h1>
          <p style={{ margin: 0, opacity: 0.9, fontSize: '0.95rem', maxWidth: 460 }}>
            What can we help repair or maintain around your home today?
          </p>
        </div>

        <Link
          to="/customer/request"
          className="btn"
          style={{
            backgroundColor: '#ffffff',
            color: 'var(--color-primary-dark)',
            fontWeight: 700,
            padding: '0.85rem 1.5rem',
            borderRadius: '12px',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
          }}
        >
          <Plus size={18} /> Request New Service
        </Link>
      </div>

      {/* Active Service Alert / Tracker Banner */}
      {activeBooking && (
        <div
          style={{
            backgroundColor: '#ffffff',
            borderRadius: '20px',
            padding: '1.5rem 1.75rem',
            border: '2px solid var(--color-primary-light)',
            boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.05)',
          }}
        >
          <div className="flex items-center justify-between flex-wrap gap-2 mb-3">
            <div className="flex items-center gap-2">
              <span
                style={{
                  width: 10,
                  height: 10,
                  borderRadius: '50%',
                  backgroundColor: '#22c55e',
                  display: 'inline-block',
                  animation: 'pulse 1.5s infinite',
                }}
              />
              <span style={{ fontWeight: 800, fontSize: '0.95rem', color: 'var(--color-primary-dark)' }}>
                ACTIVE SERVICE IN PROGRESS
              </span>
            </div>
            <StatusBadge status={activeBooking.status} />
          </div>

          <div className="flex justify-between items-center flex-wrap gap-4">
            <div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 700, margin: '0 0 0.4rem' }}>
                {activeBooking.serviceRequest?.category?.name || 'Home Service'}
              </h3>
              <div className="flex items-center gap-4 text-ash-600" style={{ fontSize: '0.85rem' }}>
                <span>Provider: <strong>{activeBooking.provider?.name || 'Assigned Technician'}</strong></span>
                <span>•</span>
                <span>Date: <strong>{new Date(activeBooking.scheduledDate).toLocaleDateString()}</strong> ({activeBooking.scheduledTime})</span>
              </div>
            </div>

            <Link
              to={`/customer/bookings/${activeBooking._id}`}
              className="btn btn-primary"
              style={{ padding: '0.65rem 1.25rem' }}
            >
              Track Live Progress →
            </Link>
          </div>
        </div>
      )}

      {/* Pending Quotes Alert */}
      {pendingRequests.length > 0 && (
        <div
          style={{
            backgroundColor: '#fef3c7',
            borderRadius: '16px',
            padding: '1.25rem 1.5rem',
            border: '1px solid #fde68a',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '1rem',
          }}
        >
          <div className="flex items-center gap-3">
            <Sparkles size={24} color="#d97706" />
            <div>
              <h4 style={{ margin: 0, fontWeight: 700, color: '#92400e', fontSize: '0.95rem' }}>
                You have {pendingRequests.length} service request(s) awaiting your review!
              </h4>
              <p style={{ margin: '0.15rem 0 0', color: '#b45309', fontSize: '0.825rem' }}>
                Technicians have submitted quotes. Compare pricing and choose the best provider.
              </p>
            </div>
          </div>
          <Link
            to={`/customer/request/${pendingRequests[0]._id}/quotes`}
            className="btn btn-secondary"
            style={{ backgroundColor: '#ffffff', borderColor: '#d97706', color: '#92400e', padding: '0.5rem 1rem' }}
          >
            Review Quotes ({pendingRequests[0].quotesCount || 1})
          </Link>
        </div>
      )}

      {/* Quick Services Grid */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0, fontFamily: 'Outfit, sans-serif' }}>
            Book a Home Service
          </h2>
          <span style={{ fontSize: '0.85rem', color: 'var(--color-ash-600)' }}>1-click booking</span>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))',
            gap: '1rem',
          }}
        >
          {categories.slice(0, 8).map((cat) => (
            <div
              key={cat._id}
              onClick={() => navigate('/customer/request', { state: { selectedCategory: cat } })}
              style={{
                backgroundColor: '#ffffff',
                borderRadius: '16px',
                padding: '1.25rem 0.75rem',
                textAlign: 'center',
                cursor: 'pointer',
                border: '1px solid var(--color-ash-200)',
                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.03)',
                transition: 'all 0.2s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-4px)';
                e.currentTarget.style.borderColor = 'var(--color-primary)';
                e.currentTarget.style.boxShadow = '0 8px 16px rgba(0, 0, 0, 0.06)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.borderColor = 'var(--color-ash-200)';
                e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.03)';
              }}
            >
              <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>{cat.icon || '🔧'}</div>
              <div style={{ fontSize: '0.825rem', fontWeight: 700, color: 'var(--color-text)', lineHeight: 1.2 }}>
                {cat.name}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Bookings Section */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0, fontFamily: 'Outfit, sans-serif' }}>
            Recent Bookings
          </h2>
          <Link
            to="/customer/bookings"
            style={{
              fontSize: '0.85rem',
              color: 'var(--color-primary)',
              fontWeight: 600,
              textDecoration: 'none',
              display: 'flex',
              alignItems: 'center',
              gap: 4,
            }}
          >
            View all ({bookings.length}) <ChevronRight size={16} />
          </Link>
        </div>

        {bookingsLoading ? (
          <div className="text-center py-6">
            <div className="spinner" style={{ margin: '0 auto' }} />
          </div>
        ) : bookings.length === 0 ? (
          <EmptyState
            emoji="📅"
            title="No bookings yet"
            message="Ready to get something fixed? Choose a service category above to get started!"
            actionText="Request a Service"
            onAction={() => navigate('/customer/request')}
          />
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
            {bookings.map((booking) => (
              <div
                key={booking._id}
                onClick={() => navigate(`/customer/bookings/${booking._id}`)}
                style={{
                  backgroundColor: '#ffffff',
                  borderRadius: '16px',
                  padding: '1.25rem 1.5rem',
                  border: '1px solid var(--color-ash-200)',
                  boxShadow: '0 2px 6px rgba(0, 0, 0, 0.02)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: '1rem',
                  cursor: 'pointer',
                  transition: 'border-color 0.2s ease',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.borderColor = 'var(--color-primary)')}
                onMouseLeave={(e) => (e.currentTarget.style.borderColor = 'var(--color-ash-200)')}
              >
                <div className="flex items-center gap-3">
                  <div
                    style={{
                      width: 44,
                      height: 44,
                      borderRadius: '12px',
                      backgroundColor: 'var(--color-primary-50)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '1.3rem',
                    }}
                  >
                    {booking.serviceRequest?.category?.icon || '🔧'}
                  </div>
                  <div>
                    <h4 style={{ margin: '0 0 0.25rem', fontSize: '0.95rem', fontWeight: 700 }}>
                      {booking.serviceRequest?.category?.name || 'Home Service'}
                    </h4>
                    <div style={{ fontSize: '0.8rem', color: 'var(--color-ash-600)' }}>
                      Technician: {booking.provider?.name || 'Assigned Expert'} • Scheduled:{' '}
                      {new Date(booking.scheduledDate).toLocaleDateString()}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontWeight: 800, fontSize: '1rem', color: 'var(--color-text)' }}>
                      ₹{booking.quote?.amount || booking.finalAmount || '—'}
                    </div>
                    <StatusBadge status={booking.status} />
                  </div>
                  <ChevronRight size={18} className="text-ash-400" />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default CustomerDashboard;
