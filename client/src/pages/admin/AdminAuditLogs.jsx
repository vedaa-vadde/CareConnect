import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { analyticsApi } from '../../api';
import EmptyState from '../../components/ui/EmptyState';
import {
  BookOpen, ShieldCheck, Clock, User, Filter, Search, Tag, Activity
} from 'lucide-react';

const AdminAuditLogs = () => {
  const [resourceFilter, setResourceFilter] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['admin-audit-logs', resourceFilter],
    queryFn: () => analyticsApi.getAuditLogs({ resource: resourceFilter || undefined, limit: 100 }),
  });

  const logs = data?.data?.data?.items || data?.data?.data?.logs || [];

  const filteredLogs = logs.filter((log) => {
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      const action = (log.action || '').toLowerCase();
      const actorName = (log.actor?.name || '').toLowerCase();
      const res = (log.resource || '').toLowerCase();
      return action.includes(term) || actorName.includes(term) || res.includes(term);
    }
    return true;
  });

  return (
    <div style={{ maxWidth: 1050, margin: '0 auto', paddingBottom: '3rem' }}>
      <div className="flex justify-between items-center mb-4 flex-wrap gap-2">
        <div>
          <h1 style={{ fontSize: '1.85rem', fontWeight: 800, margin: 0, fontFamily: 'Outfit, sans-serif' }}>
            System Audit & Compliance Logs 📜
          </h1>
          <p style={{ color: 'var(--color-ash-600)', margin: '0.2rem 0 0', fontSize: '0.9rem' }}>
            Immutable security and administrative event ledger tracking state changes across CareConnect.
          </p>
        </div>
      </div>

      {/* Filter and Search */}
      <div className="flex justify-between items-center flex-wrap gap-3 mb-4">
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          {[
            { id: '', label: 'All Events' },
            { id: 'ProviderProfile', label: 'Provider Verifications' },
            { id: 'Booking', label: 'Bookings' },
            { id: 'ServiceCategory', label: 'Categories' },
            { id: 'Dispute', label: 'Disputes' },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setResourceFilter(item.id)}
              style={{
                padding: '0.45rem 1rem',
                borderRadius: '10px',
                border: '1px solid',
                borderColor: resourceFilter === item.id ? 'var(--color-primary)' : 'var(--color-ash-300)',
                backgroundColor: resourceFilter === item.id ? 'var(--color-primary)' : '#ffffff',
                color: resourceFilter === item.id ? '#ffffff' : 'var(--color-text)',
                fontWeight: 600,
                fontSize: '0.85rem',
                cursor: 'pointer',
              }}
            >
              {item.label}
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
            placeholder="Search action or actor..."
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
      ) : filteredLogs.length === 0 ? (
        <EmptyState emoji="📜" title="No audit logs found" message="No administrative events found for this filter." />
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
                  <th style={{ padding: '0.85rem 1rem' }}>Timestamp</th>
                  <th style={{ padding: '0.85rem 1rem' }}>Actor</th>
                  <th style={{ padding: '0.85rem 1rem' }}>Role</th>
                  <th style={{ padding: '0.85rem 1rem' }}>Action Event</th>
                  <th style={{ padding: '0.85rem 1rem' }}>Target Resource</th>
                </tr>
              </thead>
              <tbody>
                {filteredLogs.map((log) => (
                  <tr key={log._id} style={{ borderBottom: '1px solid var(--color-ash-100)' }}>
                    <td style={{ padding: '0.85rem 1rem', color: 'var(--color-ash-600)', whiteSpace: 'nowrap' }}>
                      {new Date(log.timestamp || log.createdAt).toLocaleString(undefined, {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                        second: '2-digit',
                      })}
                    </td>
                    <td style={{ padding: '0.85rem 1rem', fontWeight: 600 }}>
                      {log.actor?.name || log.actorName || 'System'}
                    </td>
                    <td style={{ padding: '0.85rem 1rem' }}>
                      <span
                        style={{
                          textTransform: 'uppercase',
                          fontWeight: 700,
                          fontSize: '0.7rem',
                          padding: '2px 7px',
                          borderRadius: '6px',
                          backgroundColor: 'var(--color-bg)',
                          border: '1px solid var(--color-ash-200)',
                        }}
                      >
                        {log.actorRole || log.actor?.role || 'system'}
                      </span>
                    </td>
                    <td style={{ padding: '0.85rem 1rem' }}>
                      <span
                        style={{
                          fontFamily: 'monospace',
                          fontWeight: 700,
                          fontSize: '0.8rem',
                          color: 'var(--color-primary-dark)',
                        }}
                      >
                        {log.action}
                      </span>
                    </td>
                    <td style={{ padding: '0.85rem 1rem', color: 'var(--color-ash-700)' }}>
                      {log.resource} {log.resourceId ? `(#${String(log.resourceId).slice(-6)})` : ''}
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

export default AdminAuditLogs;
