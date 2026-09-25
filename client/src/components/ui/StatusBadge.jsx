import React from 'react';

const statusConfig = {
  // Booking & Request statuses
  pending: { label: 'Pending', className: 'badge-warning', bg: '#fef3c7', color: '#92400e' },
  active: { label: 'Active', className: 'badge-info', bg: '#e0f2fe', color: '#0369a1' },
  quotes_received: { label: 'Quotes Received', className: 'badge-info', bg: '#e0f2fe', color: '#0369a1' },
  accepted: { label: 'Accepted', className: 'badge-success', bg: '#dcfce7', color: '#166534' },
  confirmed: { label: 'Confirmed', className: 'badge-success', bg: '#dcfce7', color: '#166534' },
  assigned: { label: 'Assigned', className: 'badge-info', bg: '#e0f2fe', color: '#0369a1' },
  on_the_way: { label: 'On The Way', className: 'badge-warning', bg: '#fef3c7', color: '#b45309' },
  in_progress: { label: 'In Progress', className: 'badge-info', bg: '#ede9fe', color: '#6d28d9' },
  evidence_uploaded: { label: 'Evidence Uploaded', className: 'badge-info', bg: '#e0e7ff', color: '#3730a3' },
  completed: { label: 'Completed', className: 'badge-success', bg: '#dcfce7', color: '#166534' },
  cancelled: { label: 'Cancelled', className: 'badge-danger', bg: '#fee2e2', color: '#991b1b' },
  cancellation_requested: { label: 'Cancel Requested', className: 'badge-warning', bg: '#ffedd5', color: '#9a3412' },
  disputed: { label: 'Disputed', className: 'badge-danger', bg: '#fee2e2', color: '#991b1b' },

  // Provider application statuses
  under_review: { label: 'Under Review', className: 'badge-warning', bg: '#fef3c7', color: '#92400e' },
  approved: { label: 'Approved', className: 'badge-success', bg: '#dcfce7', color: '#166534' },
  rejected: { label: 'Rejected', className: 'badge-danger', bg: '#fee2e2', color: '#991b1b' },
  suspended: { label: 'Suspended', className: 'badge-danger', bg: '#fee2e2', color: '#991b1b' },

  // Invoice & Payment
  paid: { label: 'Paid', className: 'badge-success', bg: '#dcfce7', color: '#166534' },
  unpaid: { label: 'Unpaid', className: 'badge-warning', bg: '#fef3c7', color: '#92400e' },
  refunded: { label: 'Refunded', className: 'badge-info', bg: '#e0f2fe', color: '#0369a1' },

  // Disputes
  open: { label: 'Open', className: 'badge-warning', bg: '#fef3c7', color: '#92400e' },
  under_investigation: { label: 'Investigating', className: 'badge-info', bg: '#e0e7ff', color: '#3730a3' },
  resolved: { label: 'Resolved', className: 'badge-success', bg: '#dcfce7', color: '#166534' },
  closed: { label: 'Closed', className: 'badge-secondary', bg: '#f1f5f9', color: '#475569' },
};

export const StatusBadge = ({ status, customLabel, size = 'sm' }) => {
  const norm = (status || '').toLowerCase().replace(/-/g, '_');
  const conf = statusConfig[norm] || {
    label: customLabel || status || 'Unknown',
    bg: '#f1f5f9',
    color: '#475569',
  };

  const isSmall = size === 'sm';

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        padding: isSmall ? '0.2rem 0.6rem' : '0.35rem 0.85rem',
        borderRadius: '9999px',
        fontSize: isSmall ? '0.75rem' : '0.85rem',
        fontWeight: 600,
        backgroundColor: conf.bg,
        color: conf.color,
        letterSpacing: '0.01em',
        whiteSpace: 'nowrap',
      }}
    >
      <span
        style={{
          width: isSmall ? 6 : 8,
          height: isSmall ? 6 : 8,
          borderRadius: '50%',
          backgroundColor: conf.color,
          marginRight: '0.35rem',
          display: 'inline-block',
        }}
      />
      {customLabel || conf.label}
    </span>
  );
};

export default StatusBadge;
