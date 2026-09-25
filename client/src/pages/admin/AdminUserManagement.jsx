import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { userApi } from '../../api';
import StatusBadge from '../../components/ui/StatusBadge';
import EmptyState from '../../components/ui/EmptyState';
import {
  Users, Search, Shield, UserX, UserCheck, Trash2, Mail, Phone, MapPin
} from 'lucide-react';
import toast from 'react-hot-toast';

const AdminUserManagement = () => {
  const queryClient = useQueryClient();
  const [roleFilter, setRoleFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['admin-users', roleFilter],
    queryFn: () => userApi.getAll({ role: roleFilter === 'all' ? undefined : roleFilter, limit: 50 }),
  });

  const users = data?.data?.data?.users || [];

  const statusMutation = useMutation({
    mutationFn: ({ id, status }) => userApi.updateStatus(id, status),
    onSuccess: (_, vars) => {
      toast.success(`User marked as ${vars.status}`);
      queryClient.invalidateQueries(['admin-users']);
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Failed to update user status');
    },
  });

  const filteredUsers = users.filter((u) => {
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      return (
        u.name?.toLowerCase().includes(term) ||
        u.username?.toLowerCase().includes(term) ||
        u.mobile?.includes(term) ||
        u.location?.city?.toLowerCase().includes(term)
      );
    }
    return true;
  });

  return (
    <div style={{ maxWidth: 1050, margin: '0 auto', paddingBottom: '3rem' }}>
      <div className="flex justify-between items-center mb-4 flex-wrap gap-2">
        <div>
          <h1 style={{ fontSize: '1.85rem', fontWeight: 800, margin: 0, fontFamily: 'Outfit, sans-serif' }}>
            User Account Management 👥
          </h1>
          <p style={{ color: 'var(--color-ash-600)', margin: '0.2rem 0 0', fontSize: '0.9rem' }}>
            Manage platform users, roles, active statuses, and account access.
          </p>
        </div>
      </div>

      {/* Filter Tabs & Search */}
      <div className="flex justify-between items-center flex-wrap gap-3 mb-4">
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          {[
            { id: 'all', label: 'All Accounts' },
            { id: 'customer', label: 'Customers' },
            { id: 'provider', label: 'Providers' },
            { id: 'operations', label: 'Operations' },
            { id: 'support', label: 'Support' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setRoleFilter(tab.id)}
              style={{
                padding: '0.45rem 1rem',
                borderRadius: '10px',
                border: '1px solid',
                borderColor: roleFilter === tab.id ? 'var(--color-primary)' : 'var(--color-ash-300)',
                backgroundColor: roleFilter === tab.id ? 'var(--color-primary)' : '#ffffff',
                color: roleFilter === tab.id ? '#ffffff' : 'var(--color-text)',
                fontWeight: 600,
                fontSize: '0.85rem',
                cursor: 'pointer',
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div style={{ position: 'relative', width: '260px' }}>
          <Search
            size={16}
            style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--color-ash-400)' }}
          />
          <input
            type="text"
            className="form-control"
            placeholder="Search by name, phone, city..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ paddingLeft: '2.25rem', fontSize: '0.85rem' }}
          />
        </div>
      </div>

      {isLoading ? (
        <div className="text-center py-12">
          <div className="spinner" style={{ margin: '0 auto' }} />
        </div>
      ) : filteredUsers.length === 0 ? (
        <EmptyState emoji="👥" title="No users found" message="No user accounts match your search filter." />
      ) : (
        <div
          style={{
            backgroundColor: '#ffffff',
            borderRadius: '20px',
            border: '1px solid var(--color-ash-200)',
            overflow: 'hidden',
          }}
        >
          <div style={{ overflowX: 'auto' }}>
            <table className="table" style={{ width: '100%', fontSize: '0.85rem' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid var(--color-ash-200)', textAlign: 'left', backgroundColor: 'var(--color-bg)' }}>
                  <th style={{ padding: '0.85rem 1rem' }}>User</th>
                  <th style={{ padding: '0.85rem 1rem' }}>Role</th>
                  <th style={{ padding: '0.85rem 1rem' }}>Mobile / Contact</th>
                  <th style={{ padding: '0.85rem 1rem' }}>Location</th>
                  <th style={{ padding: '0.85rem 1rem' }}>Status</th>
                  <th style={{ padding: '0.85rem 1rem', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((u) => (
                  <tr key={u._id} style={{ borderBottom: '1px solid var(--color-ash-100)' }}>
                    <td style={{ padding: '0.85rem 1rem' }}>
                      <div className="flex items-center gap-2">
                        <div
                          style={{
                            width: 34,
                            height: 34,
                            borderRadius: '50%',
                            backgroundColor: 'var(--color-primary-100)',
                            color: 'var(--color-primary-dark)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontWeight: 700,
                            fontSize: '0.85rem',
                          }}
                        >
                          {u.name?.slice(0, 2).toUpperCase() || 'U'}
                        </div>
                        <div>
                          <div style={{ fontWeight: 700 }}>{u.name}</div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--color-ash-500)' }}>@{u.username}</div>
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: '0.85rem 1rem' }}>
                      <span
                        style={{
                          textTransform: 'capitalize',
                          fontWeight: 700,
                          fontSize: '0.75rem',
                          padding: '2px 8px',
                          borderRadius: '6px',
                          backgroundColor: 'var(--color-bg)',
                          border: '1px solid var(--color-ash-200)',
                        }}
                      >
                        {u.role}
                      </span>
                    </td>
                    <td style={{ padding: '0.85rem 1rem' }}>
                      <div>+91 {u.mobile}</div>
                      {u.email && <div style={{ fontSize: '0.75rem', color: 'var(--color-ash-500)' }}>{u.email}</div>}
                    </td>
                    <td style={{ padding: '0.85rem 1rem' }}>
                      {u.location?.city || 'Delhi'}
                    </td>
                    <td style={{ padding: '0.85rem 1rem' }}>
                      <StatusBadge status={u.accountStatus} />
                    </td>
                    <td style={{ padding: '0.85rem 1rem', textAlign: 'right' }}>
                      {u.accountStatus === 'active' ? (
                        <button
                          onClick={() => statusMutation.mutate({ id: u._id, status: 'suspended' })}
                          className="btn btn-sm"
                          style={{ fontSize: '0.75rem', color: '#dc2626', border: '1px solid #fecaca' }}
                        >
                          Suspend
                        </button>
                      ) : (
                        <button
                          onClick={() => statusMutation.mutate({ id: u._id, status: 'active' })}
                          className="btn btn-sm"
                          style={{ fontSize: '0.75rem', color: '#166534', border: '1px solid #bbf7d0' }}
                        >
                          Activate
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminUserManagement;
