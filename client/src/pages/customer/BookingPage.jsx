import React, { useState } from 'react';
import { useParams, useLocation, useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { bookingApi, quoteApi } from '../../api';
import {
  CheckCircle2, ShieldCheck, Calendar, Clock, MapPin,
  ArrowRight, ChevronLeft, CreditCard, AlertCircle
} from 'lucide-react';
import toast from 'react-hot-toast';

const BookingPage = () => {
  const { quoteId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [confirmedBooking, setConfirmedBooking] = useState(null);
  const [loading, setLoading] = useState(false);

  // If quote passed via location state
  const quoteFromState = location.state?.quote;
  const requestFromState = location.state?.request;

  // Mutation to book
  const bookMutation = useMutation({
    mutationFn: () => bookingApi.create({ quoteId }),
    onSuccess: (res) => {
      const b = res.data?.data?.booking;
      setConfirmedBooking(b);
      queryClient.invalidateQueries(['customer-bookings']);
      toast.success('Booking Confirmed! 🎉');
    },
    onError: (err) => {
      const msg = err.response?.data?.message || 'Failed to complete booking. Please try again.';
      toast.error(msg);
      setLoading(false);
    },
  });

  const handleConfirm = () => {
    setLoading(true);
    bookMutation.mutate();
  };

  const provider = quoteFromState?.providerId || {};
  const profile = quoteFromState?.providerProfile || {};
  const request = requestFromState || quoteFromState?.serviceRequestId || {};

  // Confirmed Celebration Screen
  if (confirmedBooking) {
    return (
      <div style={{ maxWidth: 640, margin: '2rem auto', padding: '0 1.5rem' }}>
        <div
          style={{
            backgroundColor: '#ffffff',
            borderRadius: '24px',
            padding: '3rem 2.5rem',
            textAlign: 'center',
            boxShadow: '0 20px 40px -15px rgba(0, 0, 0, 0.08)',
            border: '1px solid var(--color-ash-200)',
          }}
        >
          <div
            style={{
              width: 84,
              height: 84,
              borderRadius: '50%',
              backgroundColor: '#dcfce7',
              color: '#166534',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '2.75rem',
              margin: '0 auto 1.5rem',
              animation: 'bounce 0.8s ease',
            }}
          >
            🎉
          </div>

          <span
            style={{
              display: 'inline-block',
              padding: '0.35rem 0.85rem',
              borderRadius: '999px',
              backgroundColor: '#dcfce7',
              color: '#166534',
              fontSize: '0.85rem',
              fontWeight: 700,
              marginBottom: '0.75rem',
            }}
          >
            Confirmed & Scheduled
          </span>

          <h1 style={{ fontSize: '2rem', fontWeight: 800, margin: '0 0 0.5rem', fontFamily: 'Outfit, sans-serif' }}>
            Booking Confirmed 🎉
          </h1>
          <p style={{ color: 'var(--color-ash-600)', margin: '0 0 2rem', fontSize: '0.95rem' }}>
            Your home service has been scheduled. The provider has received your confirmation.
          </p>

          {/* Details Card */}
          <div
            style={{
              backgroundColor: 'var(--color-bg)',
              borderRadius: '16px',
              padding: '1.5rem',
              textAlign: 'left',
              marginBottom: '2rem',
              border: '1px solid var(--color-ash-200)',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.85rem',
              fontSize: '0.9rem',
            }}
          >
            <div className="flex justify-between items-center pb-2 border-b border-ash-200">
              <span className="text-ash-600">Booking ID</span>
              <span style={{ fontFamily: 'monospace', fontWeight: 700 }}>
                {confirmedBooking.bookingNumber || confirmedBooking._id}
              </span>
            </div>
            <div className="flex justify-between items-center pb-2 border-b border-ash-200">
              <span className="text-ash-600">Service</span>
              <span style={{ fontWeight: 600 }}>{request?.category?.name || 'Home Maintenance'}</span>
            </div>
            <div className="flex justify-between items-center pb-2 border-b border-ash-200">
              <span className="text-ash-600">Provider</span>
              <span style={{ fontWeight: 600 }}>{provider?.name || 'Assigned Technician'}</span>
            </div>
            <div className="flex justify-between items-center pb-2 border-b border-ash-200">
              <span className="text-ash-600">Date & Slot</span>
              <span style={{ fontWeight: 600 }}>
                {new Date(confirmedBooking.scheduledDate).toLocaleDateString()} ({confirmedBooking.scheduledTime})
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-ash-600">Agreed Price</span>
              <span style={{ fontWeight: 800, fontSize: '1.15rem', color: 'var(--color-primary-dark)' }}>
                ₹{confirmedBooking.agreedAmount || quoteFromState?.amount}
              </span>
            </div>
          </div>

          <div className="flex gap-3 justify-center">
            <Link to="/customer/bookings" className="btn btn-secondary">
              View All Bookings
            </Link>
            <Link
              to={`/customer/bookings/${confirmedBooking._id}`}
              className="btn btn-primary"
              style={{ fontWeight: 700 }}
            >
              Track Live Service →
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 750, margin: '0 auto', paddingBottom: '3rem' }}>
      <button
        onClick={() => navigate(-1)}
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
          marginBottom: '1rem',
        }}
      >
        <ChevronLeft size={16} /> Back to Quotes
      </button>

      <h1 style={{ fontSize: '1.75rem', fontWeight: 800, margin: '0 0 0.5rem', fontFamily: 'Outfit, sans-serif' }}>
        Confirm Your Service Booking 📋
      </h1>
      <p style={{ color: 'var(--color-ash-600)', margin: '0 0 2rem', fontSize: '0.925rem' }}>
        Please review the technician, schedule, and pricing details before locking in your appointment.
      </p>

      {/* Main Confirmation Box */}
      <div
        style={{
          backgroundColor: '#ffffff',
          borderRadius: '20px',
          padding: '2rem',
          border: '1px solid var(--color-ash-200)',
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.04)',
          marginBottom: '1.5rem',
        }}
      >
        {/* Provider Profile Summary */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingBottom: '1.5rem',
            borderBottom: '1px solid var(--color-ash-200)',
            marginBottom: '1.5rem',
          }}
        >
          <div className="flex items-center gap-3">
            <div
              style={{
                width: 56,
                height: 56,
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
              {provider.name?.slice(0, 2).toUpperCase() || 'CC'}
            </div>
            <div>
              <div className="flex items-center gap-1">
                <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800 }}>{provider.name}</h3>
                <ShieldCheck size={18} color="#166534" fill="#dcfce7" />
              </div>
              <p style={{ margin: '0.2rem 0 0', fontSize: '0.8rem', color: 'var(--color-ash-600)' }}>
                {profile.rating?.count > 0 ? (
                  `⭐ ${Number(profile.rating.average).toFixed(1)} rating • ${profile.totalCompletedJobs || 0} jobs`
                ) : (
                  `⭐ New Technician (No ratings yet) • ${profile.experience?.years ? `${profile.experience.years} yrs exp` : 'Verified'}`
                )}
              </p>
            </div>
          </div>
          <span
            style={{
              padding: '0.3rem 0.75rem',
              borderRadius: '999px',
              backgroundColor: '#dcfce7',
              color: '#166534',
              fontSize: '0.75rem',
              fontWeight: 700,
            }}
          >
            Verified Partner
          </span>
        </div>

        {/* Schedule & Location */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '1.25rem',
            paddingBottom: '1.5rem',
            borderBottom: '1px solid var(--color-ash-200)',
            marginBottom: '1.5rem',
          }}
        >
          <div>
            <div className="flex items-center gap-2 text-ash-500 mb-1" style={{ fontSize: '0.8rem' }}>
              <Calendar size={15} className="text-primary" /> Scheduled Date & Time
            </div>
            <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>
              {new Date(quoteFromState?.proposedDate || request?.preferredDate || new Date()).toLocaleDateString()}
            </div>
            <div style={{ fontSize: '0.85rem', color: 'var(--color-ash-600)' }}>
              {quoteFromState?.proposedTime || request?.preferredTime || 'Morning Slot'}
            </div>
          </div>

          <div>
            <div className="flex items-center gap-2 text-ash-500 mb-1" style={{ fontSize: '0.8rem' }}>
              <MapPin size={15} className="text-primary" /> Service Address
            </div>
            <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>
              {request.location?.address || 'Customer Residence'}
            </div>
            <div style={{ fontSize: '0.85rem', color: 'var(--color-ash-600)' }}>
              {request.location?.city || 'Delhi'}, {request.location?.pincode || '110001'}
            </div>
          </div>
        </div>

        {/* Price Breakdown */}
        <div>
          <h4 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '0.85rem' }}>
            Transparent Price Breakdown
          </h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.875rem' }}>
            <div className="flex justify-between text-ash-600">
              <span>Technician Inspection & Labor Fee</span>
              <span>₹{quoteFromState?.amount || 1200}</span>
            </div>
            <div className="flex justify-between text-ash-600">
              <span>CareConnect Platform & Safety Fee</span>
              <span className="text-primary font-bold">FREE (₹0)</span>
            </div>
            <div className="flex justify-between text-ash-600">
              <span>Service Warranty (30 Days)</span>
              <span className="text-primary font-bold">INCLUDED</span>
            </div>

            <div
              className="flex justify-between items-center"
              style={{
                marginTop: '0.75rem',
                paddingTop: '0.75rem',
                borderTop: '2px dashed var(--color-ash-200)',
                fontSize: '1.15rem',
                fontWeight: 800,
                color: 'var(--color-text)',
              }}
            >
              <span>Total Payable</span>
              <span style={{ color: 'var(--color-primary-dark)' }}>
                ₹{quoteFromState?.amount || 1200}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Safety notice */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem',
          padding: '1rem 1.25rem',
          borderRadius: '14px',
          backgroundColor: 'var(--color-primary-50)',
          border: '1px solid var(--color-primary-light)',
          color: 'var(--color-primary-dark)',
          fontSize: '0.825rem',
          marginBottom: '1.5rem',
        }}
      >
        <ShieldCheck size={20} />
        <div>
          <strong>Pay after service:</strong> You only pay the invoice once the technician finishes the job and uploads verification evidence.
        </div>
      </div>

      <button
        onClick={handleConfirm}
        disabled={loading}
        className="btn btn-primary btn-block btn-lg"
        style={{ fontWeight: 800, fontSize: '1.05rem', padding: '0.95rem' }}
      >
        {loading ? 'Confirming Appointment...' : 'Confirm Booking 🎉'}
      </button>
    </div>
  );
};

export default BookingPage;
