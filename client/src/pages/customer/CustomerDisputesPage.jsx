import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { disputeApi, bookingApi } from '../../api';
import StatusBadge from '../../components/ui/StatusBadge';
import EmptyState from '../../components/ui/EmptyState';
import Modal from '../../components/ui/Modal';
import {
  AlertTriangle, ShieldAlert, CheckCircle2, MessageSquare,
  HelpCircle, Calendar, Plus, ChevronRight
} from 'lucide-react';
import toast from 'react-hot-toast';

const CustomerDisputesPage = () => {
  const [selectedDispute, setSelectedDispute] = useState(null);

  const { data, isLoading } = useQuery({
    queryKey: ['customer-disputes'],
    queryFn: () => disputeApi.getAll(),
  });

  const disputes = data?.data?.data?.disputes || [];

  return (
    <div style={{ maxWidth: 900, margin: '0 auto', paddingBottom: '3rem' }}>
      <div className="flex justify-between items-center mb-4 flex-wrap gap-2">
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, margin: 0, fontFamily: 'Outfit, sans-serif' }}>
            Help, Support & Disputes 🆘
          </h1>
          <p style={{ color: 'var(--color-ash-600)', margin: '0.2rem 0 0', fontSize: '0.9rem' }}>
            Track open mediation tickets, compensation claims, and quality disputes.
          </p>
        </div>
      </div>

      {isLoading ? (
        <div className="text-center py-12">
          <div className="spinner" style={{ margin: '0 auto' }} />
          <p className="mt-3 text-ash-500">Loading support cases...</p>
        </div>
      ) : disputes.length === 0 ? (
        <EmptyState
          emoji="🛡️"
          title="No disputes or support tickets"
          message="Everything is running smoothly! If you ever experience issues with a service or provider, you can raise a ticket directly from your booking page."
        />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {disputes.map((d) => (
            <div
              key={d._id}
              onClick={() => setSelectedDispute(d)}
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
                transition: 'border-color 0.2s ease',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.borderColor = 'var(--color-primary)')}
              onMouseLeave={(e) => (e.currentTarget.style.borderColor = 'var(--color-ash-200)')}
            >
              <div className="flex items-center gap-3">
                <div
                  style={{
                    width: 46,
                    height: 46,
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
                  <AlertTriangle size={22} />
                </div>

                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 700 }}>
                      Ticket #{d.ticketNumber || d._id.slice(-6).toUpperCase()} — {d.reason?.replace(/_/g, ' ').toUpperCase()}
                    </h3>
                    <StatusBadge status={d.status} />
                  </div>

                  <p style={{ margin: 0, fontSize: '0.825rem', color: 'var(--color-ash-600)', lineHeight: 1.4 }}>
                    “{d.description?.slice(0, 100)}{d.description?.length > 100 ? '...' : ''}”
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <span style={{ fontSize: '0.8rem', color: 'var(--color-ash-500)' }}>
                  {new Date(d.createdAt).toLocaleDateString()}
                </span>
                <ChevronRight size={18} className="text-ash-400" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Dispute Details Modal */}
      {selectedDispute && (
        <Modal
          isOpen={Boolean(selectedDispute)}
          onClose={() => setSelectedDispute(null)}
          title={`Support Ticket #${selectedDispute.ticketNumber || selectedDispute._id.slice(-6).toUpperCase()}`}
          subtitle={`Raised on ${new Date(selectedDispute.createdAt).toLocaleDateString()}`}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', fontSize: '0.875rem' }}>
            <div className="flex justify-between items-center pb-2 border-b border-ash-200">
              <span className="text-ash-600">Status</span>
              <StatusBadge status={selectedDispute.status} />
            </div>

            <div className="flex justify-between items-center pb-2 border-b border-ash-200">
              <span className="text-ash-600">Category / Reason</span>
              <span style={{ fontWeight: 600 }}>{selectedDispute.reason?.replace(/_/g, ' ')}</span>
            </div>

            <div>
              <span className="text-ash-600 font-bold block mb-1">Customer Description:</span>
              <div
                style={{
                  backgroundColor: 'var(--color-bg)',
                  padding: '0.85rem 1rem',
                  borderRadius: '10px',
                  border: '1px solid var(--color-ash-200)',
                }}
              >
                {selectedDispute.description}
              </div>
            </div>

            {selectedDispute.resolution && (
              <div
                style={{
                  backgroundColor: '#f0fdf4',
                  borderRadius: '12px',
                  padding: '1rem',
                  border: '1px solid #bbf7d0',
                }}
              >
                <div className="flex items-center gap-2 mb-1 text-primary font-bold">
                  <CheckCircle2 size={16} /> Resolution Outcome
                </div>
                <p style={{ margin: 0, color: '#166534', fontSize: '0.85rem' }}>
                  {selectedDispute.resolution.notes || 'This ticket was investigated and closed.'}
                </p>
                {selectedDispute.resolution.refundAmount > 0 && (
                  <div style={{ marginTop: '0.5rem', fontWeight: 700, color: '#166534' }}>
                    Refund Approved: ₹{selectedDispute.resolution.refundAmount}
                  </div>
                )}
              </div>
            )}
          </div>
        </Modal>
      )}
    </div>
  );
};

export default CustomerDisputesPage;
