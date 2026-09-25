import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { operationsApi, providerApi } from '../../api';
import StatusBadge from '../../components/ui/StatusBadge';
import EmptyState from '../../components/ui/EmptyState';
import Modal from '../../components/ui/Modal';
import {
  ClipboardList, Users, Phone, MapPin, Calendar, Clock,
  UserCheck, AlertCircle, ArrowRight, ShieldAlert, CheckCircle2
} from 'lucide-react';
import toast from 'react-hot-toast';

const OperationsDashboard = () => {
  const queryClient = useQueryClient();
  const [selectedBookingForReassign, setSelectedBookingForReassign] = useState(null);
  const [newProviderId, setNewProviderId] = useState('');
  const [reassignNote, setReassignNote] = useState('');

  // Fetch active operational bookings
  const { data, isLoading } = useQuery({
    queryKey: ['operations-active-bookings'],
    queryFn: () => operationsApi.getBookings(),
    refetchInterval: 10000,
  });

  // Fetch available providers for reassign modal
  const { data: providersData } = useQuery({
    queryKey: ['approved-providers-list'],
    queryFn: () => providerApi.getAll({ status: 'approved' }),
  });

  const bookings = data?.data?.data?.items || data?.data?.data?.bookings || [];
  const providers = providersData?.data?.data?.items || providersData?.data?.data?.providers || [];

  const assignMutation = useMutation({
    mutationFn: ({ bookingId, providerId, note }) =>
      operationsApi.assignProvider(bookingId, { providerId, note }),
    onSuccess: () => {
      toast.success('Technician reassigned successfully!');
      setSelectedBookingForReassign(null);
      setNewProviderId('');
      setReassignNote('');
      queryClient.invalidateQueries(['operations-active-bookings']);
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Failed to reassign provider');
    },
  });

  const handleReassignSubmit = (e) => {
    e.preventDefault();
    if (!newProviderId) {
      toast.error('Please choose a technician.');
      return;
    }
    assignMutation.mutate({
      bookingId: selectedBookingForReassign._id,
      providerId: newProviderId,
      note: reassignNote.trim() || 'Reassigned by operations dispatch manager.',
    });
  };

  return (
    <div style={{ maxWidth: 1050, margin: '0 auto', paddingBottom: '3rem' }}>
      <div className="flex justify-between items-center mb-4 flex-wrap gap-2">
        <div>
          <h1 style={{ fontSize: '1.85rem', fontWeight: 800, margin: 0, fontFamily: 'Outfit, sans-serif' }}>
            Operations & Field Dispatch 📋
          </h1>
          <p style={{ color: 'var(--color-ash-600)', margin: '0.2rem 0 0', fontSize: '0.9rem' }}>
            Monitor in-progress household repairs, technician dispatch, and reassign emergency jobs.
          </p>
        </div>
      </div>

      {/* 3 Quick Status Cards */}
      <div className="grid grid-3 gap-3 mb-4">
        <div
          style={{
            backgroundColor: '#ffffff',
            borderRadius: '16px',
            padding: '1.25rem',
            border: '1px solid var(--color-ash-200)',
          }}
        >
          <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-ash-500)', textTransform: 'uppercase' }}>
            Active Dispatches
          </div>
          <div style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--color-primary-dark)', margin: '0.25rem 0' }}>
            {bookings.length}
          </div>
          <span style={{ fontSize: '0.75rem', color: '#166534', fontWeight: 600 }}>
            Live field technicians
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
            On The Way / En Route
          </div>
          <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#0284c7', margin: '0.25rem 0' }}>
            {bookings.filter((b) => b.status === 'on_the_way').length}
          </div>
          <span style={{ fontSize: '0.75rem', color: 'var(--color-ash-500)' }}>
            Traveling to residence
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
            In Progress Repair
          </div>
          <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#7c3aed', margin: '0.25rem 0' }}>
            {bookings.filter((b) => b.status === 'in_progress').length}
          </div>
          <span style={{ fontSize: '0.75rem', color: 'var(--color-ash-500)' }}>
            Work actively underway
          </span>
        </div>
      </div>

      {isLoading ? (
        <div className="text-center py-12">
          <div className="spinner" style={{ margin: '0 auto' }} />
        </div>
      ) : bookings.length === 0 ? (
        <EmptyState emoji="📋" title="No active jobs" message="All field bookings are currently completed." />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {bookings.map((b) => (
            <div
              key={b._id}
              style={{
                backgroundColor: '#ffffff',
                borderRadius: '18px',
                padding: '1.5rem',
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
                    flexShrink: 0,
                  }}
                >
                  {b.category?.icon || '🔧'}
                </div>

                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800 }}>
                      {b.category?.name || 'Home Service'} — #{b.bookingNumber || b._id.slice(-6).toUpperCase()}
                    </h3>
                    <StatusBadge status={b.status} />
                  </div>

                  <div className="flex items-center gap-4 text-ash-600 flex-wrap" style={{ fontSize: '0.825rem' }}>
                    <span>
                      Customer: <strong>{b.customerId?.name}</strong> (<a href={`tel:${b.customerId?.mobile}`} style={{ color: 'var(--color-primary)' }}>+91 {b.customerId?.mobile}</a>)
                    </span>
                    <span>•</span>
                    <span>
                      Technician: <strong>{b.providerId?.name || 'Unassigned'}</strong> (<a href={`tel:${b.providerId?.mobile}`} style={{ color: 'var(--color-primary)' }}>+91 {b.providerId?.mobile}</a>)
                    </span>
                    <span>•</span>
                    <span>Slot: {new Date(b.scheduledDate).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setSelectedBookingForReassign(b)}
                  className="btn btn-secondary btn-sm flex items-center gap-1 font-bold"
                >
                  <UserCheck size={15} /> Reassign Technician
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Reassign Modal */}
      {selectedBookingForReassign && (
        <Modal
          isOpen={Boolean(selectedBookingForReassign)}
          onClose={() => setSelectedBookingForReassign(null)}
          title={`Reassign Technician for Booking #${selectedBookingForReassign.bookingNumber || selectedBookingForReassign._id.slice(-6).toUpperCase()}`}
          subtitle={`Current Technician: ${selectedBookingForReassign.providerId?.name || 'Unassigned'}`}
        >
          <form onSubmit={handleReassignSubmit}>
            <div className="form-group mb-3">
              <label className="form-label">Select New Approved Technician *</label>
              <select
                className="form-control"
                value={newProviderId}
                onChange={(e) => setNewProviderId(e.target.value)}
                required
              >
                <option value="">-- Choose verified technician --</option>
                {providers.map((p) => {
                  const u = p.userId || p;
                  return (
                    <option key={u._id || p._id} value={u._id || p.userId}>
                      {u.name} ({u.location?.city || 'Delhi'}) — {p.rating?.count > 0 ? `⭐ ${Number(p.rating.average).toFixed(1)}` : '⭐ New (0.0)'}
                    </option>
                  );
                })}
              </select>
            </div>

            <div className="form-group mb-4">
              <label className="form-label">Reason for Reassignment</label>
              <textarea
                className="form-control"
                rows={2}
                placeholder="e.g. Previous technician had vehicle breakdown, emergency re-routing..."
                value={reassignNote}
                onChange={(e) => setReassignNote(e.target.value)}
              />
            </div>

            <button
              type="submit"
              className="btn btn-primary btn-block font-bold"
              disabled={assignMutation.isPending}
            >
              {assignMutation.isPending ? 'Reassigning...' : 'Confirm Field Reassignment'}
            </button>
          </form>
        </Modal>
      )}
    </div>
  );
};

export default OperationsDashboard;
