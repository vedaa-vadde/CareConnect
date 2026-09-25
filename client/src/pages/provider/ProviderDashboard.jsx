import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { bookingApi, providerApi, serviceRequestApi, quoteApi } from '../../api';
import { useAuth } from '../../contexts/AuthContext';
import StatusBadge from '../../components/ui/StatusBadge';
import EmptyState from '../../components/ui/EmptyState';
import StarRating from '../../components/ui/StarRating';
import Modal from '../../components/ui/Modal';
import {
  Briefcase, DollarSign, Star, CheckCircle, Clock, MapPin,
  Car, Wrench, Camera, CheckCheck, Send, AlertCircle, Phone, ArrowRight
} from 'lucide-react';
import toast from 'react-hot-toast';

const ProviderDashboard = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Quote submission modal
  const [selectedRequestForQuote, setSelectedRequestForQuote] = useState(null);
  const [quoteAmount, setQuoteAmount] = useState('');
  const [quoteDuration, setQuoteDuration] = useState('2');
  const [quoteMessage, setQuoteMessage] = useState('');

  // Evidence modal
  const [evidenceBooking, setEvidenceBooking] = useState(null);
  const [evidenceNotes, setEvidenceNotes] = useState('');

  // Fetch provider profile & earnings
  const { data: profileData } = useQuery({
    queryKey: ['provider-me-profile'],
    queryFn: () => providerApi.getMe(),
  });

  // Fetch provider's assigned bookings
  const { data: bookingsData, isLoading: bookingsLoading } = useQuery({
    queryKey: ['provider-bookings'],
    queryFn: () => bookingApi.getAll({ limit: 20 }),
    refetchInterval: 8000,
  });

  // Fetch open service requests in provider's categories to submit quotes
  const { data: openReqData } = useQuery({
    queryKey: ['provider-open-requests'],
    queryFn: () => serviceRequestApi.getAll({ status: 'pending,finding_providers,ai_classified' }),
    refetchInterval: 10000,
  });

  const profile = profileData?.data?.data?.profile;
  const rawBookings = bookingsData?.data?.data;
  const bookings = Array.isArray(rawBookings)
    ? rawBookings
    : (rawBookings?.bookings || rawBookings?.items || bookingsData?.data?.bookings || []);
  const rawReq = openReqData?.data?.data;
  const openRequests = Array.isArray(rawReq)
    ? rawReq
    : (rawReq?.serviceRequests || rawReq?.items || openReqData?.data?.serviceRequests || []);

  // Update booking status mutation
  const statusMutation = useMutation({
    mutationFn: ({ id, status, note }) => bookingApi.updateStatus(id, { status, note }),
    onSuccess: (_, vars) => {
      toast.success(`Job updated to: ${vars.status.replace(/_/g, ' ')}`);
      queryClient.invalidateQueries(['provider-bookings']);
      queryClient.invalidateQueries(['provider-me-profile']);
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Failed to update job status.');
    },
  });

  // Upload evidence mutation
  const evidenceMutation = useMutation({
    mutationFn: ({ id, notes }) =>
      bookingApi.uploadEvidence(id, { notes, workSummary: 'Work completed as per specifications' }),
    onSuccess: () => {
      toast.success('Evidence recorded! You can now mark the job complete.');
      setEvidenceBooking(null);
      queryClient.invalidateQueries(['provider-bookings']);
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Failed to submit evidence.');
    },
  });

  // Submit Quote mutation
  const submitQuoteMutation = useMutation({
    mutationFn: (data) => quoteApi.submit(data),
    onSuccess: () => {
      toast.success('Quote submitted to customer!');
      setSelectedRequestForQuote(null);
      setQuoteAmount('');
      setQuoteMessage('');
      queryClient.invalidateQueries(['provider-open-requests']);
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Failed to submit quote.');
    },
  });

  const handleStatusChange = (bookingId, newStatus, note = '') => {
    statusMutation.mutate({ id: bookingId, status: newStatus, note });
  };

  const handleQuoteSubmit = (e) => {
    e.preventDefault();
    if (!quoteAmount || Number(quoteAmount) <= 0) {
      toast.error('Please enter a valid quote price.');
      return;
    }
    submitQuoteMutation.mutate({
      serviceRequestId: selectedRequestForQuote._id,
      amount: Number(quoteAmount),
      estimatedDuration: { value: Number(quoteDuration), unit: 'hours' },
      message: quoteMessage.trim() || 'Experienced certified technician ready for appointment.',
      proposedDate: selectedRequestForQuote.preferredDate,
      proposedTime: selectedRequestForQuote.preferredTime || '10:00 AM',
    });
  };

  const handleEvidenceSubmit = (e) => {
    e.preventDefault();
    if (!evidenceNotes.trim()) {
      toast.error('Please provide brief work notes.');
      return;
    }
    evidenceMutation.mutate({
      id: evidenceBooking._id,
      notes: evidenceNotes.trim(),
    });
  };

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      {/* Top Welcome & KPI Metrics */}
      <div>
        <div style={{ marginBottom: '1.25rem' }}>
          <h1 style={{ fontSize: '1.85rem', fontWeight: 800, margin: '0 0 0.35rem', fontFamily: 'Outfit, sans-serif' }}>
            Technician Workspace 🛠️
          </h1>
          <p style={{ color: 'var(--color-ash-600)', margin: 0, fontSize: '0.9rem' }}>
            Welcome back, <strong>{user?.name}</strong>. Here is your service schedule and earnings overview.
          </p>
        </div>

        {/* 4 Metrics Cards */}
        <div className="grid grid-4 gap-3">
          <div
            style={{
              backgroundColor: '#ffffff',
              borderRadius: '16px',
              padding: '1.25rem',
              border: '1px solid var(--color-ash-200)',
              display: 'flex',
              alignItems: 'center',
              gap: '1rem',
            }}
          >
            <div
              style={{
                width: 46,
                height: 46,
                borderRadius: '12px',
                backgroundColor: 'var(--color-primary-50)',
                color: 'var(--color-primary-dark)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <DollarSign size={22} />
            </div>
            <div>
              <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-ash-500)', textTransform: 'uppercase' }}>
                Total Earnings
              </div>
              <div style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--color-text)' }}>
                ₹{profile?.earnings?.total ?? 0}
              </div>
            </div>
          </div>

          <div
            style={{
              backgroundColor: '#ffffff',
              borderRadius: '16px',
              padding: '1.25rem',
              border: '1px solid var(--color-ash-200)',
              display: 'flex',
              alignItems: 'center',
              gap: '1rem',
            }}
          >
            <div
              style={{
                width: 46,
                height: 46,
                borderRadius: '12px',
                backgroundColor: '#e0f2fe',
                color: '#0284c7',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <CheckCircle size={22} />
            </div>
            <div>
              <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-ash-500)', textTransform: 'uppercase' }}>
                Completed Jobs
              </div>
              <div style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--color-text)' }}>
                {profile?.totalCompletedJobs ?? bookings.filter((b) => b.status === 'confirmed_by_customer').length}
              </div>
            </div>
          </div>

          <div
            style={{
              backgroundColor: '#ffffff',
              borderRadius: '16px',
              padding: '1.25rem',
              border: '1px solid var(--color-ash-200)',
              display: 'flex',
              alignItems: 'center',
              gap: '1rem',
            }}
          >
            <div
              style={{
                width: 46,
                height: 46,
                borderRadius: '12px',
                backgroundColor: '#fef3c7',
                color: '#d97706',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Star size={22} />
            </div>
            <div>
              <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-ash-500)', textTransform: 'uppercase' }}>
                Rating
              </div>
              <div style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--color-text)' }}>
                {profile?.rating?.count > 0 ? `⭐ ${profile.rating.average.toFixed(1)} (${profile.rating.count})` : 'New (0.0)'}
              </div>
            </div>
          </div>

          <div
            style={{
              backgroundColor: '#ffffff',
              borderRadius: '16px',
              padding: '1.25rem',
              border: '1px solid var(--color-ash-200)',
              display: 'flex',
              alignItems: 'center',
              gap: '1rem',
            }}
          >
            <div
              style={{
                width: 46,
                height: 46,
                borderRadius: '12px',
                backgroundColor: '#ede9fe',
                color: '#7c3aed',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Briefcase size={22} />
            </div>
            <div>
              <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-ash-500)', textTransform: 'uppercase' }}>
                Active Jobs
              </div>
              <div style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--color-text)' }}>
                {bookings.filter((b) => !['confirmed_by_customer', 'cancelled'].includes(b.status)).length}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Today's Work Section (Section 21) */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0, fontFamily: 'Outfit, sans-serif' }}>
            Today's Assigned Jobs ({bookings.length})
          </h2>
          <span style={{ fontSize: '0.8rem', color: 'var(--color-ash-500)' }}>
            Follow live steps to dispatch and complete
          </span>
        </div>

        {bookingsLoading ? (
          <div className="text-center py-8">
            <div className="spinner" style={{ margin: '0 auto' }} />
          </div>
        ) : bookings.length === 0 ? (
          <EmptyState
            emoji="🛠️"
            title="No bookings assigned yet"
            message="Check the Open Service Requests below to submit quotes to customers in your area."
          />
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {bookings.map((b) => {
              const cust = b.customerId || {};
              const cat = b.category || {};
              const status = b.status;

              const sReq = b.serviceRequestId || b.serviceRequest || {};
              const loc = sReq.location || cust.location || {};
              const addressParts = [
                loc.address,
                loc.city,
                loc.state,
                loc.pincode ? `PIN: ${loc.pincode}` : '',
              ].filter(Boolean);
              const fullAddress = addressParts.length > 0 ? addressParts.join(', ') : 'Customer address on record';

              return (
                <div
                  key={b._id}
                  style={{
                    backgroundColor: '#ffffff',
                    borderRadius: '18px',
                    padding: '1.5rem',
                    border: '1px solid var(--color-ash-200)',
                    boxShadow: '0 4px 15px rgba(0, 0, 0, 0.02)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '1rem',
                  }}
                >
                  <div className="flex items-start justify-between flex-wrap gap-2">
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
                        {cat.icon || '🔧'}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800 }}>
                            {cat.name || 'Home Repair'}
                          </h3>
                          <StatusBadge status={status} />
                        </div>
                        <p style={{ margin: '0.2rem 0 0', fontSize: '0.85rem', color: 'var(--color-ash-600)' }}>
                          Customer: <strong>{cust.name}</strong> • Phone: <a href={`tel:${cust.mobile}`} style={{ color: 'var(--color-primary)' }}>+91 {cust.mobile}</a>
                        </p>
                      </div>
                    </div>

                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--color-primary-dark)' }}>
                        ₹{b.agreedAmount}
                      </div>
                      <span style={{ fontSize: '0.75rem', color: 'var(--color-ash-500)' }}>
                        Slot: {new Date(b.scheduledDate).toLocaleDateString()} ({b.scheduledTime})
                      </span>
                    </div>
                  </div>

                  <div
                    style={{
                      backgroundColor: '#f8fafc',
                      border: '1px solid var(--color-ash-200)',
                      padding: '0.75rem 1rem',
                      borderRadius: '10px',
                      fontSize: '0.85rem',
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: 10,
                    }}
                  >
                    <MapPin size={18} style={{ color: 'var(--color-primary)', marginTop: 2, flexShrink: 0 }} />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 700, color: 'var(--color-text)', display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span>Customer Service Address:</span>
                        <span style={{ fontSize: '0.72rem', fontWeight: 600, color: '#166534', backgroundColor: '#dcfce7', padding: '1px 6px', borderRadius: '4px' }}>
                          Verified
                        </span>
                      </div>
                      <div style={{ color: 'var(--color-ash-800)', fontWeight: 600, marginTop: 2 }}>
                        {fullAddress}
                      </div>
                      {sReq.problemDescription && (
                        <div style={{ fontSize: '0.8rem', color: 'var(--color-ash-600)', marginTop: 4 }}>
                          <strong>Service Task:</strong> “{sReq.problemDescription}”
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Dynamic Provider Actions according to Status */}
                  <div
                    style={{
                      paddingTop: '0.85rem',
                      borderTop: '1px solid var(--color-ash-100)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'flex-end',
                      gap: '0.65rem',
                      flexWrap: 'wrap',
                    }}
                  >
                    {status === 'pending_acceptance' && (
                      <>
                        <button
                          onClick={() => handleStatusChange(b._id, 'rejected_by_provider', 'Technician schedule busy')}
                          className="btn btn-secondary btn-sm"
                          style={{ color: '#dc2626', borderColor: '#fca5a5' }}
                        >
                          Decline Job
                        </button>
                        <button
                          onClick={() => handleStatusChange(b._id, 'accepted', 'Technician accepted job')}
                          className="btn btn-primary btn-sm"
                          style={{ fontWeight: 700 }}
                        >
                          Accept Booking ✓
                        </button>
                      </>
                    )}

                    {status === 'accepted' && (
                      <button
                        onClick={() => handleStatusChange(b._id, 'on_the_way', 'En route to customer location')}
                        className="btn btn-primary btn-sm flex items-center gap-1"
                        style={{ fontWeight: 700, backgroundColor: '#d97706', borderColor: '#d97706' }}
                      >
                        <Car size={16} /> Mark "On The Way"
                      </button>
                    )}

                    {status === 'on_the_way' && (
                      <button
                        onClick={() => handleStatusChange(b._id, 'in_progress', 'Started repair job at customer premise')}
                        className="btn btn-primary btn-sm flex items-center gap-1"
                        style={{ fontWeight: 700, backgroundColor: '#2563eb', borderColor: '#2563eb' }}
                      >
                        <Wrench size={16} /> Start Service Work
                      </button>
                    )}

                    {status === 'in_progress' && (
                      <button
                        onClick={() => {
                          setEvidenceBooking(b);
                          setEvidenceNotes('Inspected appliance components, replaced faulty valve/wiring, and tested working condition.');
                        }}
                        className="btn btn-primary btn-sm flex items-center gap-1"
                        style={{ fontWeight: 700, backgroundColor: '#7c3aed', borderColor: '#7c3aed' }}
                      >
                        <Camera size={16} /> Upload Job Evidence
                      </button>
                    )}

                    {status === 'evidence_uploaded' && (
                      <button
                        onClick={() => handleStatusChange(b._id, 'completed_by_provider', 'Job completed. Invoice generated.')}
                        className="btn btn-primary btn-sm flex items-center gap-1"
                        style={{ fontWeight: 700 }}
                      >
                        <CheckCheck size={16} /> Mark Service Completed ✅
                      </button>
                    )}

                    {status === 'completed_by_provider' && (
                      <span
                        style={{
                          fontSize: '0.825rem',
                          fontWeight: 600,
                          color: '#d97706',
                          backgroundColor: '#fef3c7',
                          padding: '0.35rem 0.75rem',
                          borderRadius: '8px',
                        }}
                      >
                        ⏳ Awaiting Customer Confirmation
                      </span>
                    )}

                    {status === 'confirmed_by_customer' && (
                      <span
                        style={{
                          fontSize: '0.825rem',
                          fontWeight: 700,
                          color: '#166534',
                          backgroundColor: '#dcfce7',
                          padding: '0.35rem 0.75rem',
                          borderRadius: '8px',
                        }}
                      >
                        ✓ Customer Confirmed & Paid
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Open Service Requests in Market (Submit Quotes) */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0, fontFamily: 'Outfit, sans-serif' }}>
            New Customer Requests Looking for Quotes ({openRequests.length})
          </h2>
          <span style={{ fontSize: '0.8rem', color: 'var(--color-ash-500)' }}>
            Submit your competitive quote to win new customers
          </span>
        </div>

        {openRequests.length === 0 ? (
          <div
            style={{
              padding: '2rem',
              backgroundColor: '#ffffff',
              borderRadius: '16px',
              textAlign: 'center',
              color: 'var(--color-ash-500)',
              border: '1px dashed var(--color-ash-300)',
            }}
          >
            No new open requests currently. You will receive notifications when customers request repairs in your area.
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1rem' }}>
            {openRequests.map((req) => (
              <div
                key={req._id}
                style={{
                  backgroundColor: '#ffffff',
                  borderRadius: '16px',
                  padding: '1.25rem',
                  border: '1px solid var(--color-ash-200)',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                }}
              >
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <span style={{ fontSize: '1.4rem' }}>{req.category?.icon || '🔧'}</span>
                    <div>
                      <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 700 }}>
                        {req.category?.name || 'Home Service'}
                      </h4>
                      <span style={{ fontSize: '0.75rem', color: 'var(--color-ash-500)' }}>
                        Pref Date: {new Date(req.preferredDate).toLocaleDateString()} ({req.preferredTime || 'Anytime'})
                      </span>
                    </div>
                  </div>

                  {/* Customer Service Location */}
                  <div
                    style={{
                      backgroundColor: '#f8fafc',
                      border: '1px solid var(--color-ash-200)',
                      borderRadius: '10px',
                      padding: '0.65rem 0.85rem',
                      marginBottom: '0.85rem',
                      fontSize: '0.825rem',
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: 8,
                    }}
                  >
                    <MapPin size={16} style={{ color: 'var(--color-primary)', marginTop: 2, flexShrink: 0 }} />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 700, color: 'var(--color-text)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap' }}>
                        <span>Service Address:</span>
                        {req.customerId?.name && (
                          <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-ash-600)' }}>
                            👤 {req.customerId.name}
                          </span>
                        )}
                      </div>
                      <div style={{ color: 'var(--color-ash-800)', fontWeight: 600, marginTop: 2 }}>
                        {req.location?.address || 'Address on record'}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--color-ash-500)', marginTop: 1 }}>
                        {[req.location?.city, req.location?.state, req.location?.pincode ? `PIN: ${req.location.pincode}` : ''].filter(Boolean).join(', ')}
                      </div>
                    </div>
                  </div>

                  <p style={{ fontSize: '0.825rem', color: 'var(--color-ash-700)', lineHeight: 1.45, margin: '0 0 1rem' }}>
                    “{req.problemDescription}”
                  </p>
                </div>

                <button
                  onClick={() => {
                    setSelectedRequestForQuote(req);
                    setQuoteAmount(req.category?.pricingRules?.minimum ? String(req.category.pricingRules.minimum + 300) : '1200');
                  }}
                  className="btn btn-primary btn-sm flex items-center justify-center gap-2"
                  style={{ fontWeight: 700 }}
                >
                  <Send size={15} /> Submit Quote
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Quote Submission Modal */}
      {selectedRequestForQuote && (
        <Modal
          isOpen={Boolean(selectedRequestForQuote)}
          onClose={() => setSelectedRequestForQuote(null)}
          title={`Submit Quote for ${selectedRequestForQuote.category?.name || 'Service'}`}
          subtitle={`Customer problem: "${selectedRequestForQuote.problemDescription?.slice(0, 60)}..."`}
        >
          <form onSubmit={handleQuoteSubmit}>
            {/* Customer Location Preview */}
            <div
              style={{
                backgroundColor: '#f8fafc',
                border: '1px solid var(--color-ash-200)',
                borderRadius: '12px',
                padding: '0.85rem 1rem',
                marginBottom: '1.25rem',
                fontSize: '0.85rem',
              }}
            >
              <div style={{ fontWeight: 700, color: 'var(--color-text)', display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                <MapPin size={16} color="var(--color-primary)" />
                Customer Service Address:
              </div>
              <div style={{ fontWeight: 600, color: 'var(--color-ash-800)' }}>
                {selectedRequestForQuote.location?.address || 'Address provided by customer'}
              </div>
              <div style={{ fontSize: '0.8rem', color: 'var(--color-ash-500)', marginTop: 2 }}>
                {[selectedRequestForQuote.location?.city, selectedRequestForQuote.location?.state, selectedRequestForQuote.location?.pincode ? `PIN: ${selectedRequestForQuote.location.pincode}` : ''].filter(Boolean).join(', ')}
              </div>
              {selectedRequestForQuote.customerId?.name && (
                <div style={{ fontSize: '0.8rem', color: 'var(--color-ash-600)', marginTop: 4 }}>
                  Customer Name: <strong>{selectedRequestForQuote.customerId.name}</strong>
                  {selectedRequestForQuote.customerId?.mobile ? ` • Phone: +91 ${selectedRequestForQuote.customerId.mobile}` : ''}
                </div>
              )}
            </div>

            <div className="form-group mb-3">
              <label className="form-label">Quote Amount (₹) *</label>
              <input
                type="number"
                className="form-control"
                placeholder="e.g. 1500"
                value={quoteAmount}
                onChange={(e) => setQuoteAmount(e.target.value)}
                required
              />
              {selectedRequestForQuote.category?.pricingRules && (
                <span style={{ fontSize: '0.75rem', color: 'var(--color-ash-500)', marginTop: 4, display: 'block' }}>
                  Allowed Category Range: ₹{selectedRequestForQuote.category.pricingRules.minimum} - ₹{selectedRequestForQuote.category.pricingRules.maximum}
                </span>
              )}
            </div>

            <div className="form-group mb-3">
              <label className="form-label">Estimated Service Duration (Hours)</label>
              <input
                type="number"
                className="form-control"
                value={quoteDuration}
                onChange={(e) => setQuoteDuration(e.target.value)}
                min={1}
                max={12}
                required
              />
            </div>

            <div className="form-group mb-4">
              <label className="form-label">Message to Customer</label>
              <textarea
                className="form-control"
                rows={3}
                placeholder="Include details about parts, inspection guarantee, or timing..."
                value={quoteMessage}
                onChange={(e) => setQuoteMessage(e.target.value)}
              />
            </div>

            <button
              type="submit"
              className="btn btn-primary btn-block"
              disabled={submitQuoteMutation.isPending}
              style={{ fontWeight: 700 }}
            >
              {submitQuoteMutation.isPending ? 'Submitting Quote...' : 'Send Quote to Customer'}
            </button>
          </form>
        </Modal>
      )}

      {/* Evidence Upload Modal */}
      {evidenceBooking && (
        <Modal
          isOpen={Boolean(evidenceBooking)}
          onClose={() => setEvidenceBooking(null)}
          title="Upload Job Evidence 📸"
          subtitle="Provide repair notes and completion verification for customer transparency"
        >
          <form onSubmit={handleEvidenceSubmit}>
            <div className="form-group mb-3">
              <label className="form-label">Technician Work Summary & Notes *</label>
              <textarea
                className="form-control"
                rows={4}
                placeholder="Describe repairs carried out, parts tested, and final working condition..."
                value={evidenceNotes}
                onChange={(e) => setEvidenceNotes(e.target.value)}
                required
              />
            </div>

            <div
              style={{
                backgroundColor: 'var(--color-bg)',
                borderRadius: '12px',
                padding: '1rem',
                border: '1px dashed var(--color-ash-300)',
                textAlign: 'center',
                marginBottom: '1.5rem',
                fontSize: '0.85rem',
                color: 'var(--color-ash-600)',
              }}
            >
              📸 Before & After photos are auto-logged to booking record for quality guarantee.
            </div>

            <button
              type="submit"
              className="btn btn-primary btn-block"
              disabled={evidenceMutation.isPending}
              style={{ fontWeight: 700 }}
            >
              {evidenceMutation.isPending ? 'Recording Evidence...' : 'Save Evidence & Proceed'}
            </button>
          </form>
        </Modal>
      )}
    </div>
  );
};

export default ProviderDashboard;
