import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { providerApi } from '../../api';
import StatusBadge from '../../components/ui/StatusBadge';
import EmptyState from '../../components/ui/EmptyState';
import Modal from '../../components/ui/Modal';
import {
  ShieldCheck, CheckCircle2, XCircle, User, Phone, MapPin,
  Briefcase, FileText, Calendar, AlertCircle, ArrowRight
} from 'lucide-react';
import toast from 'react-hot-toast';

const AdminProviderApplications = () => {
  const queryClient = useQueryClient();
  const [filterStatus, setFilterStatus] = useState('pending');
  const [selectedApp, setSelectedApp] = useState(null);
  const [adminNotes, setAdminNotes] = useState('');
  const [rejectReason, setRejectReason] = useState('');
  const [isRejecting, setIsRejecting] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['admin-provider-apps', filterStatus],
    queryFn: () => providerApi.getApplications({ status: filterStatus }),
  });

  const rawData = data?.data?.data;
  const applications = Array.isArray(rawData) ? rawData : rawData?.applications || [];

  const verifyMutation = useMutation({
    mutationFn: ({ id, status, notes, rejectionReason }) =>
      providerApi.verify(id, { status, notes, rejectionReason }),
    onSuccess: (_, vars) => {
      toast.success(`Application marked as ${vars.status}!`);
      setSelectedApp(null);
      setIsRejecting(false);
      setAdminNotes('');
      setRejectReason('');
      queryClient.invalidateQueries(['admin-provider-apps']);
      queryClient.invalidateQueries(['admin-analytics']);
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Failed to update verification status.');
    },
  });

  const handleApprove = () => {
    verifyMutation.mutate({
      id: selectedApp._id,
      status: 'approved',
      notes: adminNotes.trim() || 'Background and skill verification approved by admin.',
    });
  };

  const handleReject = () => {
    if (!rejectReason.trim()) {
      toast.error('Please specify a rejection reason.');
      return;
    }
    verifyMutation.mutate({
      id: selectedApp._id,
      status: 'rejected',
      notes: adminNotes.trim(),
      rejectionReason: rejectReason.trim(),
    });
  };

  return (
    <div style={{ maxWidth: 1050, margin: '0 auto', paddingBottom: '3rem' }}>
      <div className="flex justify-between items-center mb-4 flex-wrap gap-2">
        <div>
          <h1 style={{ fontSize: '1.85rem', fontWeight: 800, margin: 0, fontFamily: 'Outfit, sans-serif' }}>
            Provider Application Verification 🛡️
          </h1>
          <p style={{ color: 'var(--color-ash-600)', margin: '0.2rem 0 0', fontSize: '0.9rem' }}>
            Verify technician background, certificates, trade experience, and service categories.
          </p>
        </div>
      </div>

      {/* Filter Tabs */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem' }}>
        {[
          { id: 'pending', label: 'Pending Review' },
          { id: 'approved', label: 'Approved Partners' },
          { id: 'rejected', label: 'Rejected' },
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
      ) : applications.length === 0 ? (
        <EmptyState
          emoji="🛡️"
          title={`No ${filterStatus} applications`}
          message="All technician registrations have been processed."
        />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {applications.map((app) => {
            const u = app.userId || {};
            const cats = app.categories || [];

            return (
              <div
                key={app._id}
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
                      width: 52,
                      height: 52,
                      borderRadius: '50%',
                      backgroundColor: 'var(--color-primary-100)',
                      color: 'var(--color-primary-dark)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '1.25rem',
                      fontWeight: 800,
                    }}
                  >
                    {u.name?.slice(0, 2).toUpperCase() || 'AP'}
                  </div>

                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800 }}>{u.name}</h3>
                      <StatusBadge status={app.verificationStatus} />
                    </div>

                    <div className="flex items-center gap-3 text-ash-600 flex-wrap" style={{ fontSize: '0.825rem' }}>
                      <span>@{u.username}</span>
                      <span>•</span>
                      <span>+91 {u.mobile}</span>
                      <span>•</span>
                      <span>{u.location?.city || 'Delhi'}</span>
                      <span>•</span>
                      <span>{app.experience?.years ?? 0} yrs experience</span>
                    </div>

                    <div className="flex flex-wrap gap-1 mt-2">
                      {cats.map((c, i) => (
                        <span
                          key={i}
                          style={{
                            fontSize: '0.725rem',
                            fontWeight: 600,
                            padding: '2px 8px',
                            borderRadius: '6px',
                            backgroundColor: 'var(--color-bg)',
                            color: 'var(--color-ash-700)',
                            border: '1px solid var(--color-ash-200)',
                          }}
                        >
                          {c.icon} {c.name}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => {
                    setSelectedApp(app);
                    setIsRejecting(false);
                  }}
                  className="btn btn-secondary font-bold flex items-center gap-1"
                >
                  Review Application <ArrowRight size={16} />
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* Review Modal */}
      {selectedApp && (
        <Modal
          isOpen={Boolean(selectedApp)}
          onClose={() => setSelectedApp(null)}
          title={`Review Application: ${selectedApp.userId?.name}`}
          subtitle={`Applied on ${new Date(selectedApp.createdAt).toLocaleDateString()}`}
          maxWidth="680px"
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', fontSize: '0.875rem' }}>
            <div className="grid grid-2 gap-3 pb-3 border-b border-ash-200">
              <div>
                <span className="text-ash-500 block text-xs">Mobile Number</span>
                <span className="font-bold">+91 {selectedApp.userId?.mobile}</span>
              </div>
              <div>
                <span className="text-ash-500 block text-xs">Registered City / Area</span>
                <span className="font-bold">{selectedApp.userId?.location?.city || 'New Delhi'}</span>
              </div>
            </div>

            <div>
              <span className="text-ash-500 block text-xs mb-1">Professional Bio</span>
              <div style={{ backgroundColor: 'var(--color-bg)', padding: '0.75rem', borderRadius: '10px' }}>
                {selectedApp.bio || 'Experienced technician in appliance repair and installations.'}
              </div>
            </div>

            <div>
              <span className="text-ash-500 block text-xs mb-1">Declared Skills & Experience</span>
              <div className="flex flex-wrap gap-1">
                {selectedApp.skills?.map((s, idx) => (
                  <span
                    key={idx}
                    style={{
                      padding: '0.25rem 0.6rem',
                      borderRadius: '8px',
                      backgroundColor: 'var(--color-primary-50)',
                      color: 'var(--color-primary-dark)',
                      fontWeight: 600,
                      fontSize: '0.75rem',
                    }}
                  >
                    ✓ {typeof s === 'string' ? s : s.name}
                  </span>
                ))}
              </div>
            </div>

            {/* Admin Notes */}
            <div className="form-group">
              <label className="form-label">Internal Admin Verification Notes</label>
              <textarea
                className="form-control"
                rows={2}
                placeholder="Optional notes on ID verification, call logs..."
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
              />
            </div>

            {/* Rejection Reason Form */}
            {isRejecting ? (
              <div
                style={{
                  backgroundColor: '#fee2e2',
                  padding: '1rem',
                  borderRadius: '12px',
                  border: '1px solid #fecaca',
                }}
              >
                <label className="form-label text-danger font-bold">Reason for Rejection *</label>
                <textarea
                  className="form-control"
                  rows={2}
                  placeholder="Explain why this profile cannot be verified (e.g. invalid certificate, unreachable mobile)..."
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  required
                />
                <div className="flex justify-end gap-2 mt-2">
                  <button onClick={() => setIsRejecting(false)} className="btn btn-secondary btn-sm">
                    Cancel
                  </button>
                  <button
                    onClick={handleReject}
                    disabled={verifyMutation.isPending}
                    className="btn btn-danger btn-sm"
                    style={{ backgroundColor: '#dc2626', color: '#fff' }}
                  >
                    Confirm Rejection
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex justify-end gap-3 pt-3 border-t border-ash-200">
                <button
                  type="button"
                  onClick={() => setIsRejecting(true)}
                  className="btn btn-secondary"
                  style={{ color: '#dc2626', borderColor: '#fca5a5' }}
                >
                  Reject Application
                </button>
                <button
                  type="button"
                  onClick={handleApprove}
                  disabled={verifyMutation.isPending}
                  className="btn btn-primary font-bold"
                >
                  {verifyMutation.isPending ? 'Processing...' : 'Approve & Activate Technician ✓'}
                </button>
              </div>
            )}
          </div>
        </Modal>
      )}
    </div>
  );
};

export default AdminProviderApplications;
