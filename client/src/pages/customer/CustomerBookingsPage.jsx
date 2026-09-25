import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { bookingApi } from '../../api';
import StatusBadge from '../../components/ui/StatusBadge';
import EmptyState from '../../components/ui/EmptyState';
import {
  Calendar, Clock, MapPin, ChevronRight, Search, Filter,
  ShieldCheck, AlertTriangle, Star, Plus
} from 'lucide-react';

const CustomerBookingsPage = () => {
  const navigate = useNavigate();
  const [filterTab, setFilterTab] = useState('all'); // all, active, completed, cancelled
  const [searchTerm, setSearchTerm] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['customer-all-bookings'],
    queryFn: () => bookingApi.getAll({ limit: 50 }),
  });

  const bookings = data?.data?.data?.bookings || [];

  const filteredBookings = bookings.filter((b) => {
    // Tab filtering
    if (filterTab === 'active') {
      if (!['pending_acceptance', 'confirmed', 'assigned', 'on_the_way', 'in_progress', 'evidence_uploaded'].includes(b.status)) {
        return false;
      }
    } else if (filterTab === 'completed') {
      if (b.status !== 'completed') return false;
    } else if (filterTab === 'cancelled') {
      if (!['cancelled', 'cancellation_requested'].includes(b.status)) return false;
    }

    // Search term
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      const catName = b.serviceRequest?.category?.name?.toLowerCase() || '';
      const provName = b.provider?.name?.toLowerCase() || '';
      const bookNum = (b.bookingNumber || b._id).toLowerCase();
      return catName.includes(term) || provName.includes(term) || bookNum.includes(term);
    }

    return true;
  });

  return (
    <div style={{ maxWidth: 1000, margin: '0 auto', paddingBottom: '3rem' }}>
      {/* Header */}
      <div className="flex justify-between items-center flex-wrap gap-3 mb-4">
        <div>
          <h1 style={{ fontSize: '1.85rem', fontWeight: 800, margin: 0, fontFamily: 'Outfit, sans-serif' }}>
            My Service Bookings 📅
          </h1>
          <p style={{ color: 'var(--color-ash-600)', margin: '0.2rem 0 0', fontSize: '0.9rem' }}>
            Track active repair jobs, access invoices, and review past service history.
          </p>
        </div>

        <Link to="/customer/request" className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <Plus size={18} /> Book New Service
        </Link>
      </div>

      {/* Filter Tabs & Search Bar */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1rem',
          marginBottom: '1.5rem',
        }}
      >
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          {[
            { id: 'all', label: `All (${bookings.length})` },
            { id: 'active', label: 'Active Jobs' },
            { id: 'completed', label: 'Completed' },
            { id: 'cancelled', label: 'Cancelled' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFilterTab(tab.id)}
              style={{
                padding: '0.45rem 1rem',
                borderRadius: '10px',
                border: '1px solid',
                borderColor: filterTab === tab.id ? 'var(--color-primary)' : 'var(--color-ash-300)',
                backgroundColor: filterTab === tab.id ? 'var(--color-primary)' : '#ffffff',
                color: filterTab === tab.id ? '#ffffff' : 'var(--color-text)',
                fontWeight: 600,
                fontSize: '0.85rem',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div style={{ position: 'relative', width: '260px' }}>
          <Search
            size={16}
            style={{
              position: 'absolute',
              left: 12,
              top: '50%',
              transform: 'translateY(-50%)',
              color: 'var(--color-ash-400)',
            }}
          />
          <input
            type="text"
            className="form-control"
            placeholder="Search bookings or technician..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ paddingLeft: '2.25rem', fontSize: '0.85rem' }}
          />
        </div>
      </div>

      {/* Bookings List */}
      {isLoading ? (
        <div className="text-center py-12">
          <div className="spinner" style={{ margin: '0 auto' }} />
          <p className="mt-3 text-ash-500">Loading your bookings...</p>
        </div>
      ) : filteredBookings.length === 0 ? (
        <EmptyState
          emoji="📅"
          title="No bookings found"
          message={
            searchTerm
              ? 'No bookings match your search query.'
              : filterTab !== 'all'
              ? `No ${filterTab} bookings found.`
              : 'You have not booked any services yet. Start with a quick service request!'
          }
          actionText={filterTab === 'all' && !searchTerm ? 'Book a Service' : undefined}
          onAction={filterTab === 'all' && !searchTerm ? () => navigate('/customer/request') : undefined}
        />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {filteredBookings.map((b) => (
            <div
              key={b._id}
              onClick={() => navigate(`/customer/bookings/${b._id}`)}
              style={{
                backgroundColor: '#ffffff',
                borderRadius: '18px',
                padding: '1.25rem 1.5rem',
                border: '1px solid var(--color-ash-200)',
                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.02)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '1rem',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = 'var(--color-primary)';
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 8px 16px rgba(0, 0, 0, 0.05)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'var(--color-ash-200)';
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.02)';
              }}
            >
              <div className="flex items-center gap-3">
                <div
                  style={{
                    width: 52,
                    height: 52,
                    borderRadius: '14px',
                    backgroundColor: 'var(--color-primary-50)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '1.6rem',
                    flexShrink: 0,
                  }}
                >
                  {b.serviceRequest?.category?.icon || '🔧'}
                </div>

                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700 }}>
                      {b.serviceRequest?.category?.name || 'Home Service'}
                    </h3>
                    <StatusBadge status={b.status} />
                  </div>

                  <div className="flex items-center gap-3 text-ash-600 flex-wrap" style={{ fontSize: '0.825rem' }}>
                    <span>Technician: <strong>{b.provider?.name || 'Assigned Partner'}</strong></span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <Calendar size={14} className="text-primary" />
                      {new Date(b.scheduledDate).toLocaleDateString()} ({b.scheduledTime})
                    </span>
                    <span>•</span>
                    <span style={{ fontFamily: 'monospace', color: 'var(--color-ash-500)' }}>
                      #{b.bookingNumber || b._id.slice(-6).toUpperCase()}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontWeight: 800, fontSize: '1.15rem', color: 'var(--color-text)' }}>
                    ₹{b.agreedAmount || b.quote?.amount || '—'}
                  </div>
                  <span style={{ fontSize: '0.75rem', color: 'var(--color-ash-500)' }}>
                    {b.status === 'completed' ? 'Paid / Confirmed' : 'Pay after completion'}
                  </span>
                </div>

                <div
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: '50%',
                    backgroundColor: 'var(--color-bg)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <ChevronRight size={18} className="text-ash-500" />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default CustomerBookingsPage;
