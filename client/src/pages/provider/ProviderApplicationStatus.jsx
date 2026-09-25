import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { ShieldAlert, Clock, CheckCircle2, Phone, LogOut, RefreshCw } from 'lucide-react';

const ProviderApplicationStatus = () => {
  const { user, logout, refreshUser } = useAuth();
  const navigate = useNavigate();

  const isPending = user?.accountStatus === 'pending';
  const isRejected = user?.accountStatus === 'rejected';

  const handleRefresh = async () => {
    if (refreshUser) {
      const updated = await refreshUser();
      if (updated?.accountStatus === 'active') {
        navigate('/provider/dashboard');
      }
    } else {
      window.location.reload();
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        backgroundColor: 'var(--color-bg)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '2rem 1.5rem',
      }}
    >
      <div
        style={{
          backgroundColor: '#ffffff',
          borderRadius: '24px',
          padding: '3rem 2.5rem',
          maxWidth: '560px',
          width: '100%',
          textAlign: 'center',
          boxShadow: '0 20px 40px -15px rgba(0, 0, 0, 0.08)',
          border: '1px solid var(--color-ash-200)',
        }}
      >
        <div
          style={{
            width: 80,
            height: 80,
            borderRadius: '50%',
            backgroundColor: isPending ? '#fef3c7' : '#fee2e2',
            color: isPending ? '#d97706' : '#dc2626',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 1.5rem',
            fontSize: '2.5rem',
          }}
        >
          {isPending ? '🟡' : '❌'}
        </div>

        <span
          style={{
            display: 'inline-block',
            padding: '0.35rem 0.85rem',
            borderRadius: '999px',
            backgroundColor: isPending ? '#fef3c7' : '#fee2e2',
            color: isPending ? '#92400e' : '#991b1b',
            fontSize: '0.825rem',
            fontWeight: 700,
            marginBottom: '1rem',
          }}
        >
          {isPending ? 'Verification In Progress' : 'Application Not Approved'}
        </span>

        <h2 style={{ fontSize: '1.75rem', fontWeight: 800, margin: '0 0 0.75rem', fontFamily: 'Outfit, sans-serif' }}>
          {isPending ? 'Your Application Is Under Review' : 'Application Needs Attention'}
        </h2>

        <p style={{ color: 'var(--color-ash-600)', fontSize: '0.95rem', lineHeight: 1.6, marginBottom: '2rem' }}>
          Hello <strong>{user?.name}</strong>. CareConnect ensures home safety by validating all partner profiles.
          {isPending
            ? ' Our administrative team is currently verifying your trade skills and identity. This typically takes 24 hours.'
            : ' Unfortunately, your application could not be approved at this time. Please contact support for more details.'}
        </p>

        <div
          style={{
            backgroundColor: 'var(--color-bg)',
            borderRadius: '16px',
            padding: '1.25rem',
            textAlign: 'left',
            fontSize: '0.85rem',
            marginBottom: '2rem',
            border: '1px solid var(--color-ash-200)',
          }}
        >
          <div className="flex justify-between items-center mb-2">
            <span style={{ color: 'var(--color-ash-600)' }}>Applicant Username:</span>
            <span style={{ fontWeight: 600 }}>{user?.username}</span>
          </div>
          <div className="flex justify-between items-center mb-2">
            <span style={{ color: 'var(--color-ash-600)' }}>Registered Mobile:</span>
            <span style={{ fontWeight: 600 }}>{user?.mobile}</span>
          </div>
          <div className="flex justify-between items-center">
            <span style={{ color: 'var(--color-ash-600)' }}>Account Status:</span>
            <span style={{ fontWeight: 700, color: isPending ? '#d97706' : '#dc2626', textTransform: 'capitalize' }}>
              {user?.accountStatus || 'Pending'}
            </span>
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <button onClick={handleRefresh} className="btn btn-primary flex items-center justify-center gap-2">
            <RefreshCw size={16} /> Check Verification Status
          </button>
          <button onClick={handleLogout} className="btn btn-secondary flex items-center justify-center gap-2">
            <LogOut size={16} /> Sign Out
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProviderApplicationStatus;
