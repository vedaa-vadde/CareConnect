import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { operationsApi } from '../../api';
import EmptyState from '../../components/ui/EmptyState';
import Modal from '../../components/ui/Modal';
import {
  XCircle, CheckCircle2, AlertTriangle, Calendar, Phone,
  IndianRupee, ArrowRight
} from 'lucide-react';
import toast from 'react-hot-toast';

const OperationsCancellations = () => {
  const queryClient = useQueryClient();
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [decision, setDecision] = useState('approved');
  const [reason, setReason] = useState('');
  const [refundAmount, setRefundAmount] = useState('0');

  const { data, isLoading } = useQuery({
    queryKey: ['operations-cancellations'],
    queryFn: () => operationsApi.getCancellations(),
    refetchInterval: 12000,
  });

  const cancellations = data?.data?.data?.bookings || [];

  const handleMutation = useMutation({
    mutationFn: ({ id, data }) => operationsApi.handleCancellation(id, data),
    onSuccess: (_, vars) => {
      toast.success(`Cancellation request ${vars.data.decision}!`);
      setSelectedBooking(null);
      setReason('');
      setRefundAmount('0');
      queryClient.invalidateQueries(['operations-cancellations']);
      queryClient.invalidateQueries(['operations-active-bookings']);
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Failed to process cancellation request');
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    handleMutation.mutate({
      id: selectedBooking._id,
      data: {
        decision,
        reason: reason.trim() || `Cancellation ${decision} by operations manager.`,
        refundAmount: Number(refundAmount) || 0,
      },
    });
  };

  return (
    <div style={{ maxWidth: 1000, margin: '0 auto', paddingBottom: '3rem' }}>
      <div className="flex justify-between items-center mb-4 flex-wrap gap-2">
        <div>
          <h1 style={{ fontSize: '1.85rem', fontWeight: 800, margin: 0, fontFamily: 'Outfit, sans-serif' }}>
            Cancellation Requests Queue 🛑
          </h1>
          <p style={{ color: 'var(--color-ash-600)', margin: '0.2rem 0 0', fontSize: '0.9rem' }}>
            Review booking cancellation requests, release technician slots, and process refunds.
          </p>
        </div>
      </div>

      {isLoading ? (
        <div className="text-center py-12">
          <div className="spinner" style={{ margin: '0 auto' }} />
        </div>
      ) : cancellations.length === 0 ? (
        <EmptyState
          emoji="✅"
          title="No pending cancellation requests"
          message="There are no customers or technicians waiting for cancellation approval."
        />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {cancellations.map((b) => (
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
                    backgroundColor: '#fee2e2',
                    color: '#dc2626',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '1.25rem',
                    flexShrink: 0,
                  }}
                >
                  <XCircle size={24} />
                </div>

                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800 }}>
                      #{b.bookingNumber || b._id.slice(-6).toUpperCase()} — {b.category?.name || 'Service'}
                    </h3>
                    <span
                      style={{
                        padding: '0.2rem 0.6rem',
                        borderRadius: '999px',
                        backgroundColor: '#ffedd5',
                        color: '#9a3412',
                        fontSize: '0.75rem',
                        fontWeight: 700,
                      }}
                    >
                      Cancellation Requested
                    </span>
                  </div>

                  <p style={{ margin: '0 0 0.35rem', fontSize: '0.85rem', color: 'var(--color-ash-700)' }}>
                    Reason: <em>“{b.cancellation?.reason || 'User requested cancellation'}”</em>
                  </p>

                  <div className="flex items-center gap-3 text-ash-500" style={{ fontSize: '0.775rem' }}>
                    <span>Customer: <strong>{b.customerId?.name}</strong> (+91 {b.customerId?.mobile})</span>
                    <span>•</span>
                    <span>Provider: <strong>{b.providerId?.name}</strong></span>
                    <span>•</span>
                    <span>Slot: {new Date(b.scheduledDate).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>

              <button
                onClick={() => {
                  setSelectedBooking(b);
                  setRefundAmount(String(b.agreedAmount || '0'));
                }}
                className="btn btn-secondary font-bold flex items-center gap-1"
              >
                Review & Decide <ArrowRight size={15} />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Decision Modal */}
      {selectedBooking && (
        <Modal
          isOpen={Boolean(selectedBooking)}
          onClose={() => setSelectedBooking(null)}
          title={`Process Cancellation for Booking #${selectedBooking.bookingNumber || selectedBooking._id.slice(-6).toUpperCase()}`}
          subtitle={`Reason: "${selectedBooking.cancellation?.reason}"`}
        >
          <form onSubmit={handleSubmit}>
            <div className="form-group mb-3">
              <label className="form-label">Decision</label>
              <select
                className="form-control"
                value={decision}
                onChange={(e) => setDecision(e.target.value)}
              >
                <option value="approved">Approve Cancellation & Release Slot</option>
                <option value="rejected">Reject Cancellation (Keep Booking Active)</option>
              </select>
            </div>

            {decision === 'approved' && (
              <div className="form-group mb-3">
                <label className="form-label">Refund Amount (₹)</label>
                <input
                  type="number"
                  className="form-control"
                  value={refundAmount}
                  onChange={(e) => setRefundAmount(e.target.value)}
                  min={0}
                />
              </div>
            )}

            <div className="form-group mb-4">
              <label className="form-label">Operations Response Notes</label>
              <textarea
                className="form-control"
                rows={3}
                placeholder="Explanation sent to both customer and technician..."
                value={reason}
                onChange={(e) => setReason(e.target.value)}
              />
            </div>

            <button
              type="submit"
              className="btn btn-primary btn-block font-bold"
              disabled={handleMutation.isPending}
            >
              {handleMutation.isPending ? 'Processing...' : 'Confirm Decision'}
            </button>
          </form>
        </Modal>
      )}
    </div>
  );
};

export default OperationsCancellations;
