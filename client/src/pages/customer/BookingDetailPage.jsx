import React, { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { bookingApi, invoiceApi, reviewApi, disputeApi } from '../../api';
import ServiceProgressTracker from '../../components/ui/ServiceProgressTracker';
import StatusBadge from '../../components/ui/StatusBadge';
import StarRating from '../../components/ui/StarRating';
import Modal from '../../components/ui/Modal';
import {
  Calendar, Clock, MapPin, Phone, ShieldCheck, ChevronLeft,
  AlertTriangle, CheckCircle2, FileText, Camera, Star, HelpCircle,
  XCircle, Receipt, ArrowRight
} from 'lucide-react';
import toast from 'react-hot-toast';

const BookingDetailPage = () => {
  const { id: bookingId } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // Modals state
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [showDisputeModal, setShowDisputeModal] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);

  // Review form
  const [rating, setRating] = useState(5);
  const [reviewText, setReviewText] = useState('');

  // Dispute form
  const [disputeReason, setDisputeReason] = useState('poor_quality');
  const [disputeDesc, setDisputeDesc] = useState('');

  // Cancellation form
  const [cancelReason, setCancelReason] = useState('');

  // Fetch booking details
  const { data: bookingData, isLoading: bookingLoading } = useQuery({
    queryKey: ['booking-detail', bookingId],
    queryFn: () => bookingApi.getById(bookingId),
    refetchInterval: 8000, // Live poll for provider status updates
  });

  // Fetch invoice if available
  const { data: invoiceData } = useQuery({
    queryKey: ['booking-invoice', bookingId],
    queryFn: () => invoiceApi.getByBooking(bookingId),
    retry: false,
  });

  // Fetch existing review if available
  const { data: reviewData } = useQuery({
    queryKey: ['booking-review', bookingId],
    queryFn: () => reviewApi.getByBooking(bookingId),
    retry: false,
  });

  const booking = bookingData?.data?.data?.booking;
  const invoice = invoiceData?.data?.data?.invoice;
  const existingReview = reviewData?.data?.data?.review;

  // Confirm Completion mutation
  const confirmMutation = useMutation({
    mutationFn: () => bookingApi.confirmCompletion(bookingId),
    onSuccess: () => {
      toast.success('Service completion confirmed! Please leave a review.');
      queryClient.invalidateQueries(['booking-detail', bookingId]);
      setShowReviewModal(true);
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Failed to confirm completion.');
    },
  });

  // Submit Review mutation
  const reviewMutation = useMutation({
    mutationFn: (data) => reviewApi.submit(data),
    onSuccess: () => {
      toast.success('Thank you! Review submitted.');
      setShowReviewModal(false);
      queryClient.invalidateQueries(['booking-review', bookingId]);
      queryClient.invalidateQueries(['booking-detail', bookingId]);
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || err.message || 'Failed to submit review.');
    },
  });

  // Submit Dispute mutation
  const disputeMutation = useMutation({
    mutationFn: (data) => disputeApi.create(data),
    onSuccess: () => {
      toast.success('Dispute raised. A support officer will contact you.');
      setShowDisputeModal(false);
      queryClient.invalidateQueries(['booking-detail', bookingId]);
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Failed to submit dispute.');
    },
  });

  // Cancel Request mutation
  const cancelMutation = useMutation({
    mutationFn: (reason) => bookingApi.requestCancellation(bookingId, reason),
    onSuccess: () => {
      toast.success('Cancellation request sent to operations team.');
      setShowCancelModal(false);
      queryClient.invalidateQueries(['booking-detail', bookingId]);
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Failed to request cancellation.');
    },
  });

  const handleReviewSubmit = (e) => {
    e.preventDefault();
    if (!reviewText.trim()) {
      toast.error('Please write a short review.');
      return;
    }
    reviewMutation.mutate({
      bookingId,
      rating,
      review: reviewText.trim(),
    });
  };

  const handleDisputeSubmit = (e) => {
    e.preventDefault();
    if (!disputeDesc.trim()) {
      toast.error('Please describe the problem.');
      return;
    }
    disputeMutation.mutate({
      bookingId,
      reason: disputeReason,
      description: disputeDesc.trim(),
    });
  };

  const handleCancelSubmit = (e) => {
    e.preventDefault();
    if (!cancelReason.trim()) {
      toast.error('Please give a reason for cancellation.');
      return;
    }
    cancelMutation.mutate(cancelReason.trim());
  };

  if (bookingLoading) {
    return (
      <div className="text-center py-12">
        <div className="spinner" style={{ margin: '0 auto' }} />
        <p className="mt-3 text-ash-500">Loading service tracking...</p>
      </div>
    );
  }

  if (!booking) {
    return (
      <div style={{ maxWidth: 600, margin: '3rem auto', textAlign: 'center' }}>
        <h2>Booking Not Found</h2>
        <Link to="/customer/bookings" className="btn btn-primary mt-3">
          Back to Bookings
        </Link>
      </div>
    );
  }

  const isCompleted = ['completed', 'completed_by_provider', 'confirmed_by_customer'].includes(booking.status);
  const isCancelled = booking.status === 'cancelled';
  const isDisputed = booking.status === 'disputed';

  return (
    <div style={{ maxWidth: 950, margin: '0 auto', paddingBottom: '3rem' }}>
      {/* Top Header */}
      <div style={{ marginBottom: '1.5rem' }}>
        <button
          onClick={() => navigate('/customer/bookings')}
          style={{
            background: 'none',
            border: 'none',
            color: 'var(--color-ash-600)',
            display: 'flex',
            alignItems: 'center',
            gap: 4,
            cursor: 'pointer',
            fontSize: '0.85rem',
            padding: 0,
            marginBottom: '0.5rem',
          }}
        >
          <ChevronLeft size={16} /> Back to My Bookings
        </button>

        <div className="flex justify-between items-center flex-wrap gap-2">
          <div>
            <div className="flex items-center gap-2">
              <h1 style={{ fontSize: '1.75rem', fontWeight: 800, margin: 0, fontFamily: 'Outfit, sans-serif' }}>
                Booking #{booking.bookingNumber || booking._id.slice(-6).toUpperCase()}
              </h1>
              <StatusBadge status={booking.status} size="md" />
            </div>
            <p style={{ color: 'var(--color-ash-600)', margin: '0.2rem 0 0', fontSize: '0.9rem' }}>
              Booked on {new Date(booking.createdAt).toLocaleDateString()}
            </p>
          </div>

          {/* Help & Support Button */}
          <button
            onClick={() => setShowDisputeModal(true)}
            className="btn btn-secondary"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              color: '#b91c1c',
              borderColor: '#fca5a5',
              backgroundColor: '#fef2f2',
            }}
          >
            <HelpCircle size={16} /> 🆘 Help & Support
          </button>
        </div>
      </div>

      {/* Visual Progress Tracker (Section 17) */}
      <div
        style={{
          backgroundColor: '#ffffff',
          borderRadius: '20px',
          padding: '1.75rem',
          marginBottom: '1.5rem',
          border: '1px solid var(--color-ash-200)',
          boxShadow: '0 4px 15px rgba(0, 0, 0, 0.03)',
        }}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 style={{ fontSize: '1.05rem', fontWeight: 700, margin: 0 }}>
            Live Service Progress Tracker
          </h3>
          <span style={{ fontSize: '0.75rem', color: 'var(--color-ash-500)' }}>
            Live status updates automatically
          </span>
        </div>

        <ServiceProgressTracker
          currentStatus={booking.status}
          hasReview={Boolean(existingReview)}
          isCancelled={isCancelled}
          isDisputed={isDisputed}
        />
      </div>

      {/* Service Completed Banner (Section 18) */}
      {isCompleted && (
        <div
          style={{
            backgroundColor: '#f0fdf4',
            borderRadius: '20px',
            padding: '1.5rem 2rem',
            marginBottom: '1.5rem',
            border: '2px solid #86efac',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '1rem',
          }}
        >
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span style={{ fontSize: '1.5rem' }}>🎉</span>
              <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, color: '#166534' }}>
                Service Completed!
              </h3>
            </div>
            <p style={{ margin: 0, fontSize: '0.875rem', color: '#15803d' }}>
              The technician has completed the repair work. Please review the invoice and confirm.
            </p>
          </div>

          <div className="flex items-center gap-3">
            {booking.status === 'completed_by_provider' && (
              <button
                onClick={() => confirmMutation.mutate()}
                disabled={confirmMutation.isPending}
                className="btn btn-primary"
                style={{ fontWeight: 700, padding: '0.65rem 1.25rem' }}
              >
                {confirmMutation.isPending ? 'Confirming...' : 'Confirm Completion ✓'}
              </button>
            )}

            {!existingReview && (
              <button
                onClick={() => setShowReviewModal(true)}
                className="btn btn-secondary"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  fontWeight: 700,
                  backgroundColor: '#ffffff',
                  borderColor: '#166534',
                  color: '#166534',
                }}
              >
                <Star size={16} fill="#f59e0b" color="#f59e0b" /> Rate & Review
              </button>
            )}
          </div>
        </div>
      )}

      {/* Two-Column Grid: Details & Provider */}
      <div className="grid grid-2 gap-3 mb-4">
        {/* Service Details Card */}
        <div
          style={{
            backgroundColor: '#ffffff',
            borderRadius: '20px',
            padding: '1.5rem',
            border: '1px solid var(--color-ash-200)',
          }}
        >
          <h3 style={{ fontSize: '1.05rem', fontWeight: 700, margin: '0 0 1rem' }}>
            Service Details
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem', fontSize: '0.875rem' }}>
            <div className="flex items-center gap-3">
              <div
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: '10px',
                  backgroundColor: 'var(--color-primary-50)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '1.25rem',
                }}
              >
                {booking.category?.icon || '🔧'}
              </div>
              <div>
                <div style={{ fontWeight: 700 }}>{booking.category?.name || 'Home Maintenance'}</div>
                <div style={{ fontSize: '0.8rem', color: 'var(--color-ash-600)' }}>
                  “{booking.serviceRequest?.problemDescription || 'Service requested'}”
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 pt-2 border-t border-ash-100">
              <Calendar size={16} className="text-primary" />
              <span><strong>Date:</strong> {new Date(booking.scheduledDate).toLocaleDateString()}</span>
            </div>

            <div className="flex items-center gap-2">
              <Clock size={16} className="text-primary" />
              <span><strong>Time Slot:</strong> {booking.scheduledTime}</span>
            </div>

            <div className="flex items-center gap-2">
              <MapPin size={16} className="text-primary" />
              <span>
                <strong>Location:</strong> {booking.serviceRequest?.location?.address || 'Customer residence'},{' '}
                {booking.serviceRequest?.location?.city}
              </span>
            </div>

            {/* Cancel booking option if still early */}
            {!isCompleted && !isCancelled && booking.cancellation?.status !== 'requested' && (
              <div className="pt-2 border-t border-ash-100">
                <button
                  type="button"
                  onClick={() => setShowCancelModal(true)}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#dc2626',
                    fontSize: '0.8rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    padding: 0,
                  }}
                >
                  Need to cancel this booking? Request cancellation
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Assigned Provider Card */}
        <div
          style={{
            backgroundColor: '#ffffff',
            borderRadius: '20px',
            padding: '1.5rem',
            border: '1px solid var(--color-ash-200)',
          }}
        >
          <h3 style={{ fontSize: '1.05rem', fontWeight: 700, margin: '0 0 1rem' }}>
            Assigned Technician
          </h3>

          <div className="flex items-center gap-3 mb-3">
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
                fontWeight: 800,
                fontSize: '1.25rem',
              }}
            >
              {booking.provider?.name?.slice(0, 2).toUpperCase() || 'CC'}
            </div>
            <div>
              <div className="flex items-center gap-1">
                <h4 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800 }}>
                  {booking.provider?.name || 'Verified Technician'}
                </h4>
                <ShieldCheck size={18} color="#166534" fill="#dcfce7" />
              </div>
              <div style={{ fontSize: '0.8rem', color: 'var(--color-ash-600)' }}>
                CareConnect Background Verified Partner
              </div>
            </div>
          </div>

          <div
            style={{
              backgroundColor: 'var(--color-bg)',
              borderRadius: '12px',
              padding: '0.85rem 1rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              fontSize: '0.85rem',
            }}
          >
            <div className="flex items-center gap-2">
              <Phone size={16} className="text-primary" />
              <span>Contact Number:</span>
            </div>
            <a
              href={`tel:${booking.provider?.mobile}`}
              style={{ fontWeight: 700, color: 'var(--color-primary)', textDecoration: 'none' }}
            >
              +91 {booking.provider?.mobile || '9855555555'}
            </a>
          </div>
        </div>
      </div>

      {/* Before / After Evidence Showcase */}
      {booking.evidence && (
        <div
          style={{
            backgroundColor: '#ffffff',
            borderRadius: '20px',
            padding: '1.5rem',
            marginBottom: '1.5rem',
            border: '1px solid var(--color-ash-200)',
          }}
        >
          <div className="flex items-center gap-2 mb-3">
            <Camera size={18} className="text-primary" />
            <h3 style={{ fontSize: '1.05rem', fontWeight: 700, margin: 0 }}>
              Job Verification Evidence
            </h3>
          </div>

          {booking.evidence.notes && (
            <p style={{ fontSize: '0.875rem', color: 'var(--color-ash-700)', marginBottom: '1rem' }}>
              Technician Notes: “{booking.evidence.notes}”
            </p>
          )}

          <div className="grid grid-2 gap-3">
            <div>
              <h4 style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--color-ash-600)', marginBottom: '0.5rem' }}>
                Before Service:
              </h4>
              <div
                style={{
                  height: 140,
                  backgroundColor: 'var(--color-bg)',
                  borderRadius: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--color-ash-500)',
                  fontSize: '0.8rem',
                  border: '1px dashed var(--color-ash-300)',
                }}
              >
                📸 Initial diagnosis inspected
              </div>
            </div>

            <div>
              <h4 style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--color-ash-600)', marginBottom: '0.5rem' }}>
                After Repair Completion:
              </h4>
              <div
                style={{
                  height: 140,
                  backgroundColor: 'var(--color-bg)',
                  borderRadius: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--color-ash-500)',
                  fontSize: '0.8rem',
                  border: '1px dashed var(--color-ash-300)',
                }}
              >
                📸 Tested & confirmed working
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Invoice Section */}
      <div
        style={{
          backgroundColor: '#ffffff',
          borderRadius: '20px',
          padding: '1.5rem',
          border: '1px solid var(--color-ash-200)',
          marginBottom: '1.5rem',
        }}
      >
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Receipt size={18} className="text-primary" />
            <h3 style={{ fontSize: '1.05rem', fontWeight: 700, margin: 0 }}>
              Payment & Invoice
            </h3>
          </div>
          <span
            style={{
              padding: '0.25rem 0.65rem',
              borderRadius: '999px',
              backgroundColor: invoice?.status === 'paid' ? '#dcfce7' : '#fef3c7',
              color: invoice?.status === 'paid' ? '#166534' : '#92400e',
              fontSize: '0.75rem',
              fontWeight: 700,
            }}
          >
            {invoice?.status ? invoice.status.toUpperCase() : isCompleted ? 'DUE AT COMPLETION' : 'ESTIMATED'}
          </span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', fontSize: '0.875rem' }}>
          <div className="flex justify-between text-ash-600">
            <span>Agreed Service Quote</span>
            <span>₹{booking.agreedAmount || booking.quote?.amount || 1200}</span>
          </div>
          <div className="flex justify-between text-ash-600">
            <span>Safety, Materials & Guarantee</span>
            <span className="text-primary font-bold">₹0 (Included)</span>
          </div>

          <div
            className="flex justify-between items-center pt-2 mt-2 border-t border-dashed border-ash-200 font-bold"
            style={{ fontSize: '1.15rem' }}
          >
            <span>Total Payable Amount</span>
            <span style={{ color: 'var(--color-primary-dark)' }}>
              ₹{invoice?.total || booking.agreedAmount || booking.quote?.amount || 1200}
            </span>
          </div>
        </div>
      </div>

      {/* Existing Customer Review Card if already submitted */}
      {existingReview && (
        <div
          style={{
            backgroundColor: '#ffffff',
            borderRadius: '20px',
            padding: '1.5rem',
            border: '1px solid var(--color-ash-200)',
          }}
        >
          <div className="flex items-center justify-between mb-2">
            <h3 style={{ fontSize: '1.05rem', fontWeight: 700, margin: 0 }}>Your Rating & Review</h3>
            <StarRating rating={existingReview.rating} size={16} showValue />
          </div>
          <p style={{ margin: 0, color: 'var(--color-ash-700)', fontSize: '0.875rem' }}>
            “{existingReview.review}”
          </p>
        </div>
      )}

      {/* Review Modal */}
      <Modal
        isOpen={showReviewModal}
        onClose={() => setShowReviewModal(false)}
        title="Rate Your Service Experience ⭐"
        subtitle="How satisfied were you with the technician's repair quality?"
      >
        <form onSubmit={handleReviewSubmit}>
          <div style={{ textAlign: 'center', margin: '1rem 0 1.5rem' }}>
            <div style={{ marginBottom: '0.5rem', fontSize: '0.85rem', color: 'var(--color-ash-600)' }}>
              Tap stars to rate:
            </div>
            <StarRating rating={rating} interactive onChange={(r) => setRating(r)} size={32} />
          </div>

          <div className="form-group mb-4">
            <label className="form-label">Review Comments</label>
            <textarea
              className="form-control"
              rows={3}
              placeholder="Was the technician punctual, polite, and thorough?"
              value={reviewText}
              onChange={(e) => setReviewText(e.target.value)}
              required
            />
          </div>

          <button type="submit" className="btn btn-primary btn-block" disabled={reviewMutation.isPending}>
            {reviewMutation.isPending ? 'Submitting...' : 'Submit Feedback'}
          </button>
        </form>
      </Modal>

      {/* Dispute Modal */}
      <Modal
        isOpen={showDisputeModal}
        onClose={() => setShowDisputeModal(false)}
        title="🆘 Raise a Support Dispute"
        subtitle="Our operations support officer will mediate and investigate this booking"
      >
        <form onSubmit={handleDisputeSubmit}>
          <div className="form-group mb-3">
            <label className="form-label">Reason for Dispute</label>
            <select
              className="form-control"
              value={disputeReason}
              onChange={(e) => setDisputeReason(e.target.value)}
            >
              <option value="poor_quality">Substandard repair or issue unresolved</option>
              <option value="overcharging">Overcharged beyond agreed quote</option>
              <option value="provider_no_show">Technician did not show up</option>
              <option value="property_damage">Accidental property damage</option>
              <option value="cancellation_refund">Refund request for cancelled job</option>
              <option value="other">Other issue</option>
            </select>
          </div>

          <div className="form-group mb-4">
            <label className="form-label">Describe What Happened</label>
            <textarea
              className="form-control"
              rows={4}
              placeholder="Please provide specifics to help support resolve your ticket..."
              value={disputeDesc}
              onChange={(e) => setDisputeDesc(e.target.value)}
              required
            />
          </div>

          <button
            type="submit"
            className="btn btn-danger btn-block"
            disabled={disputeMutation.isPending}
            style={{ backgroundColor: '#dc2626', color: '#fff', fontWeight: 700 }}
          >
            {disputeMutation.isPending ? 'Submitting Dispute...' : 'Submit Dispute to Support'}
          </button>
        </form>
      </Modal>

      {/* Cancel Modal */}
      <Modal
        isOpen={showCancelModal}
        onClose={() => setShowCancelModal(false)}
        title="Request Booking Cancellation"
        subtitle="Please let us know why you need to cancel this appointment"
      >
        <form onSubmit={handleCancelSubmit}>
          <div className="form-group mb-4">
            <label className="form-label">Reason for Cancellation</label>
            <textarea
              className="form-control"
              rows={3}
              placeholder="e.g. Issue resolved on own, need to reschedule, emergency"
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              required
            />
          </div>

          <button
            type="submit"
            className="btn btn-danger btn-block"
            disabled={cancelMutation.isPending}
            style={{ backgroundColor: '#dc2626', color: '#fff', fontWeight: 700 }}
          >
            {cancelMutation.isPending ? 'Submitting...' : 'Confirm Cancellation Request'}
          </button>
        </form>
      </Modal>
    </div>
  );
};

export default BookingDetailPage;
