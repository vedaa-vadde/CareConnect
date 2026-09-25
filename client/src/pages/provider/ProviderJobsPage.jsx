import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { bookingApi } from '../../api';
import StatusBadge from '../../components/ui/StatusBadge';
import EmptyState from '../../components/ui/EmptyState';
import {
  Briefcase, Calendar, Clock, MapPin, Phone, Search,
  CheckCircle, Car, Wrench, Camera, CheckCheck, ChevronRight
} from 'lucide-react';
import toast from 'react-hot-toast';

const ProviderJobsPage = () => {
  const queryClient = useQueryClient();
  const [filterTab, setFilterTab] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['provider-all-jobs'],
    queryFn: () => bookingApi.getAll({ limit: 50 }),
  });

  const bookings = data?.data?.data?.bookings || [];

  const statusMutation = useMutation({
    mutationFn: ({ id, status, note }) => bookingApi.updateStatus(id, { status, note }),
    onSuccess: () => {
      toast.success('Status updated successfully');
      queryClient.invalidateQueries(['provider-all-jobs']);
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Failed to update status');
    },
  });

  const filteredJobs = bookings.filter((b) => {
    if (filterTab === 'active') {
      if (['confirmed_by_customer', 'completed', 'cancelled', 'rejected_by_provider'].includes(b.status)) {
        return false;
      }
    } else if (filterTab === 'completed') {
      if (!['completed', 'completed_by_provider', 'confirmed_by_customer'].includes(b.status)) return false;
    }

    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      const cust = b.customerId?.name?.toLowerCase() || '';
      const cat = b.category?.name?.toLowerCase() || '';
      const num = (b.bookingNumber || b._id).toLowerCase();
      return cust.includes(term) || cat.includes(term) || num.includes(term);
    }
    return true;
  });

  return (
    <div style={{ maxWidth: 1050, margin: '0 auto', paddingBottom: '3rem' }}>
      <div className="flex justify-between items-center flex-wrap gap-2 mb-4">
        <div>
          <h1 style={{ fontSize: '1.85rem', fontWeight: 800, margin: 0, fontFamily: 'Outfit, sans-serif' }}>
            Job History & Assignments 📋
          </h1>
          <p style={{ color: 'var(--color-ash-600)', margin: '0.2rem 0 0', fontSize: '0.9rem' }}>
            Manage your service queue, customer dispatches, and completed work.
          </p>
        </div>
      </div>

      {/* Filter Tabs & Search */}
      <div className="flex justify-between items-center flex-wrap gap-3 mb-4">
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          {[
            { id: 'all', label: `All Jobs (${bookings.length})` },
            { id: 'active', label: 'Active Queue' },
            { id: 'completed', label: 'Completed' },
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
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div style={{ position: 'relative', width: '260px' }}>
          <Search
            size={16}
            style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--color-ash-400)' }}
          />
          <input
            type="text"
            className="form-control"
            placeholder="Search by customer or ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ paddingLeft: '2.25rem', fontSize: '0.85rem' }}
          />
        </div>
      </div>

      {isLoading ? (
        <div className="text-center py-12">
          <div className="spinner" style={{ margin: '0 auto' }} />
        </div>
      ) : filteredJobs.length === 0 ? (
        <EmptyState
          emoji="💼"
          title="No jobs found"
          message={searchTerm ? 'No jobs match your search.' : 'You have no assigned jobs in this filter.'}
        />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {filteredJobs.map((b) => {
            const sReq = b.serviceRequestId || b.serviceRequest || {};
            const loc = sReq.location || b.customerId?.location || {};
            const fullAddress = [
              loc.address,
              loc.city,
              loc.state,
              loc.pincode ? `PIN: ${loc.pincode}` : '',
            ].filter(Boolean).join(', ');

            return (
              <div
                key={b._id}
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
                }}
              >
                <div className="flex items-center gap-3">
                  <div
                    style={{
                      width: 48,
                      height: 48,
                      borderRadius: '12px',
                      backgroundColor: 'var(--color-primary-50)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '1.5rem',
                    }}
                  >
                    {b.category?.icon || '🔧'}
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 800 }}>
                        {b.category?.name || 'Home Service'} — {b.customerId?.name || 'Customer'}
                      </h3>
                      <StatusBadge status={b.status} />
                    </div>
                    <div className="flex items-center gap-3 text-ash-600 flex-wrap" style={{ fontSize: '0.8rem' }}>
                      <span>📅 Slot: {new Date(b.scheduledDate).toLocaleDateString()} ({b.scheduledTime})</span>
                      <span>•</span>
                      <span>📞 Phone: +91 {b.customerId?.mobile || 'N/A'}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.825rem', color: 'var(--color-ash-800)', marginTop: '0.35rem' }}>
                      <MapPin size={14} style={{ color: 'var(--color-primary)', flexShrink: 0 }} />
                      <span style={{ fontWeight: 600 }}>Service Address:</span>
                      <span>{fullAddress || 'Customer address on record'}</span>
                    </div>
                  </div>
                </div>

              <div className="flex items-center gap-3">
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontWeight: 800, fontSize: '1.15rem', color: 'var(--color-primary-dark)' }}>
                    ₹{b.agreedAmount}
                  </div>
                  <span style={{ fontSize: '0.75rem', color: 'var(--color-ash-500)' }}>
                    {b.status === 'confirmed_by_customer' ? 'Paid to account' : 'Pending payment'}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
        </div>
      )}
    </div>
  );
};

export default ProviderJobsPage;
