import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { disputeApi, operationsApi } from '../../api';
import StatusBadge from '../../components/ui/StatusBadge';
import EmptyState from '../../components/ui/EmptyState';
import Modal from '../../components/ui/Modal';
import {
  Headphones, AlertTriangle, CheckCircle2, MessageSquare, Phone,
  ArrowRight, ShieldCheck, HelpCircle, XCircle
} from 'lucide-react';
import toast from 'react-hot-toast';

const SupportDashboard = () => {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('disputes'); // disputes or cancellations
  const [selectedDispute, setSelectedDispute] = useState(null);
  const [supportNote, setSupportNote] = useState('');
  const [disputeStatus, setDisputeStatus] = useState('under_review');

  // Fetch disputes
  const { data: disputeData, isLoading: disputeLoading } = useQuery({
    queryKey: ['support-disputes'],
    queryFn: () => disputeApi.getAll(),
    refetchInterval: 10000,
  });

  // Fetch cancellations
  const { data: cancelData } = useQuery({
    queryKey: ['support-cancellations'],
    queryFn: () => operationsApi.getCancellations(),
    refetchInterval: 12000,
  });

  const disputes = disputeData?.data?.data?.disputes || [];
  const cancellations = cancelData?.data?.data?.bookings || [];

  const updateDisputeMutation = useMutation({
    mutationFn: ({ id, status, notes }) =>
      disputeApi.resolve(id, { status, resolution: { notes, refundAmount: 0 } }),
    onSuccess: () => {
      toast.success('Ticket updated by support agent.');
      setSelectedDispute(null);
      setSupportNote('');
      queryClient.invalidateQueries(['support-disputes']);
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Failed to update ticket');
    },
  });

  const handleSupportSubmit = (e) => {
    e.preventDefault();
    updateDisputeMutation.mutate({
      id: selectedDispute._id,
      status: disputeStatus,
      notes: supportNote.trim() || 'Mediation notes recorded by support agent.',
    });
  };

  return (
    <div style={{ maxWidth: 1050, margin: '0 auto', paddingBottom: '3rem' }}>
      <div className="flex justify-between items-center mb-4 flex-wrap gap-2">
        <div>
          <h1 style={{ fontSize: '1.85rem', fontWeight: 800, margin: 0, fontFamily: 'Outfit, sans-serif' }}>
            Customer Support Center 🎧
          </h1>
          <p style={{ color: 'var(--color-ash-600)', margin: '0.2rem 0 0', fontSize: '0.9rem' }}>
            Handle customer complaints, disputes, mediate technician communications, and resolve issues.
          </p>
        </div>
      </div>

      {/* KPI Cards */}
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
            Open Dispute Tickets
          </div>
          <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#dc2626', margin: '0.25rem 0' }}>
            {disputes.filter((d) => d.status === 'open' || d.status === 'under_review').length}
          </div>
          <span style={{ fontSize: '0.75rem', color: 'var(--color-ash-500)' }}>
            Requires resolution
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
            Cancellation Inquiries
          </div>
          <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#d97706', margin: '0.25rem 0' }}>
            {cancellations.length}
          </div>
          <span style={{ fontSize: '0.75rem', color: 'var(--color-ash-500)' }}>
            Awaiting operations clearance
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
            Resolved Tickets
          </div>
          <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#166534', margin: '0.25rem 0' }}>
            {disputes.filter((d) => d.status === 'resolved' || d.status === 'closed').length}
          </div>
          <span style={{ fontSize: '0.75rem', color: '#166534', fontWeight: 600 }}>
            Successfully closed
          </span>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem' }}>
        <button
          onClick={() => setActiveTab('disputes')}
          style={{
            padding: '0.45rem 1rem',
            borderRadius: '10px',
            border: '1px solid',
            borderColor: activeTab === 'disputes' ? 'var(--color-primary)' : 'var(--color-ash-300)',
            backgroundColor: activeTab === 'disputes' ? 'var(--color-primary)' : '#ffffff',
            color: activeTab === 'disputes' ? '#ffffff' : 'var(--color-text)',
            fontWeight: 600,
            fontSize: '0.85rem',
            cursor: 'pointer',
          }}
        >
          Dispute Tickets ({disputes.length})
        </button>
        <button
          onClick={() => setActiveTab('cancellations')}
          style={{
            padding: '0.45rem 1rem',
            borderRadius: '10px',
            border: '1px solid',
            borderColor: activeTab === 'cancellations' ? 'var(--color-primary)' : 'var(--color-ash-300)',
            backgroundColor: activeTab === 'cancellations' ? 'var(--color-primary)' : '#ffffff',
            color: activeTab === 'cancellations' ? '#ffffff' : 'var(--color-text)',
            fontWeight: 600,
            fontSize: '0.85rem',
            cursor: 'pointer',
          }}
        >
          Cancellations ({cancellations.length})
        </button>
      </div>

      {/* Disputes Tab Content */}
      {activeTab === 'disputes' && (
        <div>
          {disputeLoading ? (
            <div className="text-center py-12">
              <div className="spinner" style={{ margin: '0 auto' }} />
            </div>
          ) : disputes.length === 0 ? (
            <EmptyState emoji="🎧" title="No open dispute tickets" message="There are currently no active customer disputes." />
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
                        fontSize: '1.25rem',
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

                      <p style={{ margin: '0 0 0.35rem', fontSize: '0.85rem', color: 'var(--color-ash-700)' }}>
                        “{d.description}”
                      </p>

                      <div className="flex items-center gap-3 text-ash-500" style={{ fontSize: '0.775rem' }}>
                        <span>Customer: <strong>{d.raisedBy?.name}</strong> (<a href={`tel:${d.raisedBy?.mobile}`} style={{ color: 'var(--color-primary)' }}>+91 {d.raisedBy?.mobile}</a>)</span>
                        <span>•</span>
                        <span>Date: {new Date(d.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      setSelectedDispute(d);
                      setDisputeStatus(d.status || 'under_review');
                      setSupportNote(d.resolution?.notes || '');
                    }}
                    className="btn btn-secondary font-bold flex items-center gap-1"
                  >
                    Open Ticket <ArrowRight size={15} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Cancellations Tab Content */}
      {activeTab === 'cancellations' && (
        <div>
          {cancellations.length === 0 ? (
            <EmptyState emoji="✅" title="No cancellation tickets" message="No cancellation requests requiring mediation." />
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
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                    gap: '1rem',
                  }}
                >
                  <div>
                    <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800 }}>
                      Booking #{b.bookingNumber || b._id.slice(-6).toUpperCase()}
                    </h3>
                    <p style={{ margin: '0.2rem 0', fontSize: '0.85rem', color: 'var(--color-ash-700)' }}>
                      Cancellation reason: “{b.cancellation?.reason || 'Reason not provided'}”
                    </p>
                    <div className="text-ash-500" style={{ fontSize: '0.775rem' }}>
                      Customer: {b.customerId?.name} (+91 {b.customerId?.mobile}) • Provider: {b.providerId?.name}
                    </div>
                  </div>

                  <span
                    style={{
                      padding: '0.3rem 0.75rem',
                      borderRadius: '999px',
                      backgroundColor: '#ffedd5',
                      color: '#9a3412',
                      fontSize: '0.8rem',
                      fontWeight: 700,
                    }}
                  >
                    Operations Reviewing
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Support Ticket Modal */}
      {selectedDispute && (
        <Modal
          isOpen={Boolean(selectedDispute)}
          onClose={() => setSelectedDispute(null)}
          title={`Support Ticket #${selectedDispute.ticketNumber || selectedDispute._id.slice(-6).toUpperCase()}`}
          subtitle={`Customer: ${selectedDispute.raisedBy?.name || 'Customer'}`}
        >
          <form onSubmit={handleSupportSubmit}>
            <div
              style={{
                backgroundColor: 'var(--color-bg)',
                padding: '1rem',
                borderRadius: '12px',
                marginBottom: '1rem',
                fontSize: '0.85rem',
              }}
            >
              <div className="font-bold mb-1">Customer Issue Description:</div>
              <p style={{ margin: 0, color: 'var(--color-ash-700)' }}>{selectedDispute.description}</p>
            </div>

            <div className="form-group mb-3">
              <label className="form-label">Support Ticket Status</label>
              <select
                className="form-control"
                value={disputeStatus}
                onChange={(e) => setDisputeStatus(e.target.value)}
              >
                <option value="under_review">Under Investigation (Active mediation)</option>
                <option value="resolved">Resolved (Issue resolved with customer)</option>
                <option value="closed">Closed</option>
              </select>
            </div>

            <div className="form-group mb-4">
              <label className="form-label">Support Agent Investigation Notes</label>
              <textarea
                className="form-control"
                rows={3}
                placeholder="Log details of telephone calls with customer or technician..."
                value={supportNote}
                onChange={(e) => setSupportNote(e.target.value)}
              />
            </div>

            <button
              type="submit"
              className="btn btn-primary btn-block font-bold"
              disabled={updateDisputeMutation.isPending}
            >
              {updateDisputeMutation.isPending ? 'Saving...' : 'Update Support Record'}
            </button>
          </form>
        </Modal>
      )}
    </div>
  );
};

export default SupportDashboard;
