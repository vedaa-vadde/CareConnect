import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { disputeApi } from '../../api';
import StatusBadge from '../../components/ui/StatusBadge';
import EmptyState from '../../components/ui/EmptyState';
import Modal from '../../components/ui/Modal';
import {
  AlertTriangle, ShieldCheck, CheckCircle2, MessageSquare,
  HelpCircle, DollarSign, ArrowRight, User
} from 'lucide-react';
import toast from 'react-hot-toast';

const AdminDisputeManagement = () => {
  const queryClient = useQueryClient();
  const [filterStatus, setFilterStatus] = useState('all');
  const [selectedDispute, setSelectedDispute] = useState(null);

  // Resolution form
  const [resolutionOutcome, setResolutionOutcome] = useState('resolved');
  const [resolutionNotes, setResolutionNotes] = useState('');
  const [refundAmount, setRefundAmount] = useState('0');

  const { data, isLoading } = useQuery({
    queryKey: ['admin-disputes', filterStatus],
    queryFn: () => disputeApi.getAll({ status: filterStatus === 'all' ? undefined : filterStatus }),
  });

  const disputes = data?.data?.data?.disputes || [];

  const resolveMutation = useMutation({
    mutationFn: ({ id, data }) => disputeApi.resolve(id, data),
    onSuccess: () => {
      toast.success('Dispute resolved and closed!');
      setSelectedDispute(null);
      setResolutionNotes('');
      setRefundAmount('0');
      queryClient.invalidateQueries(['admin-disputes']);
      queryClient.invalidateQueries(['admin-analytics']);
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Failed to resolve dispute');
    },
  });

  const handleResolveSubmit = (e) => {
    e.preventDefault();
    if (!resolutionNotes.trim()) {
      toast.error('Please add resolution notes for audit.');
      return;
    }
    resolveMutation.mutate({
      id: selectedDispute._id,
      data: {
        status: resolutionOutcome,
        resolution: {
          notes: resolutionNotes.trim(),
          refundAmount: Number(refundAmount) || 0,
        },
      },
    });
  };

  return (
    <div style={{ maxWidth: 1050, margin: '0 auto', paddingBottom: '3rem' }}>
      <div className="flex justify-between items-center mb-4 flex-wrap gap-2">
        <div>
          <h1 style={{ fontSize: '1.85rem', fontWeight: 800, margin: 0, fontFamily: 'Outfit, sans-serif' }}>
            Dispute & Mediation Management ⚖️
          </h1>
          <p style={{ color: 'var(--color-ash-600)', margin: '0.2rem 0 0', fontSize: '0.9rem' }}>
            Investigate customer complaints, mediate quality issues, and authorize refunds.
          </p>
        </div>
      </div>

      {/* Filter Tabs */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem' }}>
        {[
          { id: 'all', label: `All (${disputes.length})` },
          { id: 'open', label: 'Open Disputes' },
          { id: 'under_review', label: 'Investigating' },
          { id: 'resolved', label: 'Resolved' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setFilterStatus(tab.id)}
            style={{
              padding: '0.45rem 1rem',
              borderRadius: '10px',
              border: '1px solid',
              borderColor: filterStatus === tab.id ? 'var(--color-primary)' : 'var(--color-ash-300)',
              backgroundColor: filterStatus === tab.id ? 'var(--color-primary)' : '#ffffff',
              color: filterStatus === tab.id ? '#ffffff' : 'var(--color-text)',
              fontWeight: 600,
              fontSize: '0.85rem',
              cursor: 'pointer',
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="text-center py-12">
          <div className="spinner" style={{ margin: '0 auto' }} />
        </div>
      ) : disputes.length === 0 ? (
        <EmptyState emoji="⚖️" title="No disputes found" message="All disputes have been mediated and resolved." />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {disputes.map((d) => (
            <div
              key={d._id}
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
                    fontSize: '1.35rem',
                    flexShrink: 0,
                  }}
                >
                  <AlertTriangle size={24} />
                </div>

                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800 }}>
                      #{d.ticketNumber || d._id.slice(-6).toUpperCase()} — {d.reason?.replace(/_/g, ' ').toUpperCase()}
                    </h3>
                    <StatusBadge status={d.status} />
                  </div>

                  <p style={{ margin: '0 0 0.4rem', fontSize: '0.85rem', color: 'var(--color-ash-700)' }}>
                    “{d.description}”
                  </p>

                  <div className="flex items-center gap-3 text-ash-500" style={{ fontSize: '0.75rem' }}>
                    <span>Raised by: <strong>{d.raisedBy?.name || 'Customer'}</strong></span>
                    <span>•</span>
                    <span>Date: {new Date(d.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>

              <button
                onClick={() => {
                  setSelectedDispute(d);
                  setResolutionNotes(d.resolution?.notes || '');
                  setRefundAmount(String(d.resolution?.refundAmount || '0'));
                }}
                className="btn btn-secondary font-bold flex items-center gap-1"
              >
                Review & Resolve <ArrowRight size={15} />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Resolve Modal */}
      {selectedDispute && (
        <Modal
          isOpen={Boolean(selectedDispute)}
          onClose={() => setSelectedDispute(null)}
          title={`Resolve Dispute #${selectedDispute.ticketNumber || selectedDispute._id.slice(-6).toUpperCase()}`}
          subtitle={`Reason: ${selectedDispute.reason?.replace(/_/g, ' ')}`}
          maxWidth="640px"
        >
          <form onSubmit={handleResolveSubmit}>
            <div
              style={{
                backgroundColor: 'var(--color-bg)',
                padding: '1rem',
                borderRadius: '12px',
                marginBottom: '1.25rem',
                fontSize: '0.85rem',
              }}
            >
              <div className="font-bold mb-1">Customer Complaint:</div>
              <p style={{ margin: 0, color: 'var(--color-ash-700)' }}>{selectedDispute.description}</p>
            </div>

            <div className="form-group mb-3">
              <label className="form-label">Resolution Status</label>
              <select
                className="form-control"
                value={resolutionOutcome}
                onChange={(e) => setResolutionOutcome(e.target.value)}
              >
                <option value="resolved">Resolved (Issue addressed with customer)</option>
                <option value="closed">Closed without action</option>
                <option value="under_review">Escalate / Keep Under Review</option>
              </select>
            </div>

            <div className="form-group mb-3">
              <label className="form-label">Approved Refund Amount (₹, if applicable)</label>
              <input
                type="number"
                className="form-control"
                value={refundAmount}
                onChange={(e) => setRefundAmount(e.target.value)}
                min={0}
              />
            </div>

            <div className="form-group mb-4">
              <label className="form-label">Resolution Findings & Notes *</label>
              <textarea
                className="form-control"
                rows={3}
                placeholder="Document your findings, customer communication, and final settlement agreement..."
                value={resolutionNotes}
                onChange={(e) => setResolutionNotes(e.target.value)}
                required
              />
            </div>

            <button
              type="submit"
              className="btn btn-primary btn-block font-bold"
              disabled={resolveMutation.isPending}
            >
              {resolveMutation.isPending ? 'Saving...' : 'Finalize Dispute Resolution'}
            </button>
          </form>
        </Modal>
      )}
    </div>
  );
};

export default AdminDisputeManagement;
