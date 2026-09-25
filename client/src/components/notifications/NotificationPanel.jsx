import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { notificationApi } from '../../api';
import { Bell, CheckCheck, X, ExternalLink } from 'lucide-react';
import toast from 'react-hot-toast';

const NotificationPanel = ({ onClose }) => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['notifications-list'],
    queryFn: () => notificationApi.getAll({ limit: 15 }),
    refetchInterval: 30000,
  });

  const markAsReadMutation = useMutation({
    mutationFn: (id) => notificationApi.markAsRead(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['notifications-count']);
      queryClient.invalidateQueries(['notifications-list']);
    },
  });

  const markAllMutation = useMutation({
    mutationFn: () => notificationApi.markAllAsRead(),
    onSuccess: () => {
      toast.success('All marked as read');
      queryClient.invalidateQueries(['notifications-count']);
      queryClient.invalidateQueries(['notifications-list']);
    },
  });

  const notifications = data?.data?.data?.notifications || [];
  const unreadCount = data?.data?.data?.unreadCount || 0;

  const handleNotificationClick = (notif) => {
    if (!notif.isRead) {
      markAsReadMutation.mutate(notif._id);
    }
    onClose();

    // Route based on related resource
    if (notif.relatedResource?.model === 'Booking') {
      navigate(`/customer/bookings/${notif.relatedResource.id}`);
    } else if (notif.relatedResource?.model === 'Dispute') {
      navigate('/customer/disputes');
    } else if (notif.relatedResource?.model === 'ServiceRequest') {
      navigate(`/customer/request/${notif.relatedResource.id}/quotes`);
    } else if (notif.relatedResource?.model === 'ProviderProfile') {
      navigate('/admin/providers');
    }
  };

  return (
    <div
      style={{
        position: 'absolute',
        top: '100%',
        right: 0,
        marginTop: '0.75rem',
        width: '380px',
        maxHeight: '500px',
        backgroundColor: '#ffffff',
        borderRadius: '16px',
        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
        border: '1px solid var(--color-ash-200)',
        display: 'flex',
        flexDirection: 'column',
        zIndex: 1000,
        overflow: 'hidden',
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: '1rem 1.25rem',
          borderBottom: '1px solid var(--color-ash-200)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: 'var(--color-bg)',
        }}
      >
        <div className="flex items-center gap-2">
          <Bell size={18} className="text-primary" />
          <span style={{ fontWeight: 700, fontSize: '0.95rem' }}>Notifications</span>
          {unreadCount > 0 && (
            <span
              style={{
                background: 'var(--color-primary)',
                color: '#fff',
                fontSize: '0.7rem',
                fontWeight: 700,
                padding: '1px 7px',
                borderRadius: '999px',
              }}
            >
              {unreadCount}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {unreadCount > 0 && (
            <button
              onClick={() => markAllMutation.mutate()}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--color-primary)',
                fontSize: '0.75rem',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 4,
              }}
              title="Mark all as read"
            >
              <CheckCheck size={14} /> Mark all
            </button>
          )}
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--color-ash-500)',
              cursor: 'pointer',
              padding: 2,
            }}
          >
            <X size={16} />
          </button>
        </div>
      </div>

      {/* Body */}
      <div style={{ overflowY: 'auto', flex: 1, maxHeight: '400px' }}>
        {isLoading ? (
          <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--color-ash-500)', fontSize: '0.85rem' }}>
            Loading alerts...
          </div>
        ) : notifications.length === 0 ? (
          <div style={{ padding: '2.5rem 1.5rem', textAlign: 'center', color: 'var(--color-ash-500)' }}>
            <Bell size={28} style={{ margin: '0 auto 0.5rem', opacity: 0.3 }} />
            <p style={{ margin: 0, fontSize: '0.85rem' }}>No notifications yet</p>
          </div>
        ) : (
          <div>
            {notifications.map((n) => (
              <div
                key={n._id}
                onClick={() => handleNotificationClick(n)}
                style={{
                  padding: '0.85rem 1.25rem',
                  borderBottom: '1px solid var(--color-ash-100)',
                  backgroundColor: n.isRead ? '#ffffff' : 'rgba(74, 124, 89, 0.05)',
                  cursor: 'pointer',
                  transition: 'background-color 0.15s ease',
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '0.75rem',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--color-ash-50)')}
                onMouseLeave={(e) =>
                  (e.currentTarget.style.backgroundColor = n.isRead ? '#ffffff' : 'rgba(74, 124, 89, 0.05)')
                }
              >
                {!n.isRead && (
                  <span
                    style={{
                      width: 8,
                      height: 8,
                      borderRadius: '50%',
                      backgroundColor: 'var(--color-primary)',
                      marginTop: 6,
                      flexShrink: 0,
                    }}
                  />
                )}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      fontSize: '0.85rem',
                      fontWeight: n.isRead ? 600 : 700,
                      color: 'var(--color-text)',
                      marginBottom: 2,
                    }}
                  >
                    {n.title}
                  </div>
                  <div
                    style={{
                      fontSize: '0.8rem',
                      color: 'var(--color-ash-600)',
                      lineHeight: 1.35,
                      marginBottom: 4,
                    }}
                  >
                    {n.message}
                  </div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--color-ash-600)' }}>
                    {new Date(n.createdAt).toLocaleDateString(undefined, {
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default NotificationPanel;
