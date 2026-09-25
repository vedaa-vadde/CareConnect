import React from 'react';
import {
  FileText, Search, CalendarCheck, Car, Wrench, Camera, CheckCircle2, Star, AlertCircle
} from 'lucide-react';

const TRACKING_STEPS = [
  { key: 'request_created', label: 'Request Created', icon: FileText, desc: 'Problem submitted' },
  { key: 'provider_selected', label: 'Provider Selected', icon: Search, desc: 'Quote accepted' },
  { key: 'booking_confirmed', label: 'Confirmed', icon: CalendarCheck, desc: 'Time slot locked' },
  { key: 'on_the_way', label: 'On The Way', icon: Car, desc: 'Technician en route' },
  { key: 'in_progress', label: 'In Progress', icon: Wrench, desc: 'Repair started' },
  { key: 'evidence_uploaded', label: 'Evidence Added', icon: Camera, desc: 'Work photos verified' },
  { key: 'completed', label: 'Completed', icon: CheckCircle2, desc: 'Job finished' },
  { key: 'reviewed', label: 'Review & Rated', icon: Star, desc: 'Feedback submitted' },
];

export const ServiceProgressTracker = ({ currentStatus, hasReview = false, isCancelled = false, isDisputed = false }) => {
  // Map booking status to step index
  const getStepIndex = (status) => {
    switch (status) {
      case 'pending':
        return 0; // request created
      case 'quotes_received':
        return 0;
      case 'accepted':
      case 'assigned':
        return 1; // provider selected
      case 'confirmed':
        return 2; // confirmed
      case 'on_the_way':
        return 3; // on the way
      case 'in_progress':
        return 4; // in progress
      case 'evidence_uploaded':
        return 5; // evidence
      case 'completed':
        return hasReview ? 7 : 6;
      default:
        return 2;
    }
  };

  if (isCancelled) {
    return (
      <div style={{
        padding: '1rem',
        borderRadius: '12px',
        backgroundColor: '#fee2e2',
        border: '1px solid #fecaca',
        display: 'flex',
        alignItems: 'center',
        gap: '0.75rem',
        color: '#991b1b',
        fontWeight: 600
      }}>
        <AlertCircle size={22} />
        <div>
          <div>This booking has been cancelled</div>
          <div style={{ fontSize: '0.8rem', fontWeight: 400, color: '#b91c1c' }}>
            If you need further help or a refund, check Help & Support.
          </div>
        </div>
      </div>
    );
  }

  const currentIdx = getStepIndex(currentStatus);

  return (
    <div style={{ width: '100%', overflowX: 'auto', padding: '0.5rem 0' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', minWidth: '650px', position: 'relative' }}>
        {TRACKING_STEPS.map((step, idx) => {
          const isDone = idx < currentIdx;
          const isCurrent = idx === currentIdx;
          const isPending = idx > currentIdx;
          const Icon = step.icon;

          return (
            <React.Fragment key={step.key}>
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  flex: 1,
                  textAlign: 'center',
                  position: 'relative',
                  zIndex: 2,
                }}
              >
                {/* Step Circle */}
                <div
                  style={{
                    width: 42,
                    height: 42,
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: isDone
                      ? 'var(--color-primary)'
                      : isCurrent
                      ? '#3b82f6'
                      : 'var(--color-ash-200)',
                    color: isDone || isCurrent ? '#ffffff' : 'var(--color-ash-600)',
                    boxShadow: isCurrent ? '0 0 0 4px rgba(59, 130, 246, 0.25)' : 'none',
                    transition: 'all 0.3s ease',
                  }}
                >
                  <Icon size={20} />
                </div>

                {/* Label */}
                <div
                  style={{
                    marginTop: '0.5rem',
                    fontSize: '0.8rem',
                    fontWeight: isCurrent ? 700 : isDone ? 600 : 500,
                    color: isCurrent ? '#1d4ed8' : isDone ? 'var(--color-text)' : 'var(--color-ash-500)',
                  }}
                >
                  {step.label}
                </div>

                {/* Micro description */}
                <div style={{ fontSize: '0.7rem', color: 'var(--color-ash-600)', marginTop: '2px' }}>
                  {step.desc}
                </div>
              </div>

              {/* Connecting Line between steps */}
              {idx < TRACKING_STEPS.length - 1 && (
                <div
                  style={{
                    flex: 1,
                    height: 3,
                    marginTop: 20,
                    backgroundColor: idx < currentIdx ? 'var(--color-primary)' : 'var(--color-ash-200)',
                    transition: 'background-color 0.3s ease',
                  }}
                />
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
};

export default ServiceProgressTracker;
