import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { notificationApi } from '../../api';
import { Bell, CheckCheck, Trash2, Calendar, AlertCircle } from 'lucide-react';
import EmptyState from '../../components/ui/EmptyState';
import toast from 'react-hot-toast';

const CustomerNotificationsPage = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['all-notifications'],
    queryFn: () => notificationApi.getAll({ limit: 50 }),
  });

  const markAllMutation = useMutation({
    mutationFn: () => notificationApi.markAllAsRead(),
    onSuccess: () => {
      toast.success('All marked as read');
      queryClient.invalidateQueries(['all-notifications']);
      queryClient.invalidateQueries(['notifications-count']);
    },
  });

  const notifications = data?.data?.data?.notifications || [];
  const unreadCount = data?.data?.data?.unreadCount || 0;

  const handleClick = async (n) => {
    if (!n.isRead) {
      await notificationApi.markAsRead(n._id);
      queryClient.invalidateQueries(['all-notifications']);
      queryClient.invalidateQueries(['notifications-count']);
    }

    if (n.relatedResource?.model === 'Booking') {
      navigate(`/customer/bookings/${n.relatedResource.id}`);
    } else if (n.relatedResource?.model === 'ServiceRequest') {
      navigate(`/customer/request/${n.relatedResource.id}/quotes`);
    } else if (n.relatedResource?.model === 'Dispute') {
      navigate('/customer/disputes');
    }
  };

  return (
    <div style={{ maxWidth: 800, margin: '0 auto', paddingBottom: '3rem' }}>
      <div className="flex justify-between items-center mb-4 flex-wrap gap-2">
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, margin: 0, fontFamily: 'Outfit, sans-serif' }}>
            Notifications & Alerts 🔔
          </h1>
          <p style={{ color: 'var(--color-ash-600)', margin: '0.2rem 0 0', fontSize: '0.9rem' }}>
            Live updates on quotes, bookings, arrival status, and invoices.
          </p>
        </div>

        {unreadCount > 0 && (
          <button
            onClick={() => markAllMutation.mutate()}
            className="btn btn-secondary"
            style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.85rem' }}
          >
            <CheckCheck size={16} /> Mark all as read
          </button>
        )}
      </div>

      {isLoading ? (
        <div className="text-center py-12">
          <div className="spinner" style={{ margin: '0 auto' }} />
        </div>
      ) : notifications.length === 0 ? (
        <EmptyState
          emoji="🔔"
          title="No notifications"
          message="You are all caught up! Updates regarding your service requests will appear here."
        />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {notifications.map((n) => (
            <div
              key={n._id}
              onClick={() => handleClick(n)}
              style={{
                backgroundColor: n.isRead ? '#ffffff' : '#f0fdf4',
                borderRadius: '16px',
                padding: '1.25rem 1.5rem',
                border: `1px solid ${n.isRead ? 'var(--color-ash-200)' : 'var(--color-primary-light)'}`,
                boxShadow: '0 2px 6px rgba(0, 0, 0, 0.02)',
                display: 'flex',
                alignItems: 'flex-start',
                gap: '1rem',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--color-ash-50)')}
              onMouseLeave={(e) =>
                (e.currentTarget.style.backgroundColor = n.isRead ? '#ffffff' : '#f0fdf4')
              }
            >
              <div
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: '50%',
                  backgroundColor: n.isRead ? 'var(--color-ash-100)' : 'var(--color-primary-100)',
                  color: n.isRead ? 'var(--color-ash-600)' : 'var(--color-primary-dark)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                <Bell size={18} />
              </div>

              <div style={{ flex: 1 }}>
                <div className="flex justify-between items-center mb-1">
                  <h3
                    style={{
                      margin: 0,
                      fontSize: '0.95rem',
                      fontWeight: n.isRead ? 600 : 800,
                      color: 'var(--color-text)',
                    }}
                  >
                    {n.title}
                  </h3>
                  <span style={{ fontSize: '0.75rem', color: 'var(--color-ash-500)' }}>
                    {new Date(n.createdAt).toLocaleDateString(undefined, {
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </div>

                <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--color-ash-700)', lineHeight: 1.45 }}>
                  {n.message}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default CustomerNotificationsPage;
