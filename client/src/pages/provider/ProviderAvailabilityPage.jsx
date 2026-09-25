import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { availabilityApi, providerApi } from '../../api';
import { Calendar, Clock, CheckCircle2, AlertCircle, Save, Plus, X } from 'lucide-react';
import toast from 'react-hot-toast';

const DAYS_OF_WEEK = [
  { id: 'monday', label: 'Monday', defaultStart: '09:00', defaultEnd: '18:00' },
  { id: 'tuesday', label: 'Tuesday', defaultStart: '09:00', defaultEnd: '18:00' },
  { id: 'wednesday', label: 'Wednesday', defaultStart: '09:00', defaultEnd: '18:00' },
  { id: 'thursday', label: 'Thursday', defaultStart: '09:00', defaultEnd: '18:00' },
  { id: 'friday', label: 'Friday', defaultStart: '09:00', defaultEnd: '18:00' },
  { id: 'saturday', label: 'Saturday', defaultStart: '10:00', defaultEnd: '17:00' },
  { id: 'sunday', label: 'Sunday', defaultStart: '10:00', defaultEnd: '15:00' },
];

const ProviderAvailabilityPage = () => {
  const queryClient = useQueryClient();

  const [schedule, setSchedule] = useState(() =>
    DAYS_OF_WEEK.map((d) => ({
      ...d,
      enabled: d.id !== 'sunday',
      startTime: d.defaultStart,
      endTime: d.defaultEnd,
    }))
  );

  const [customDate, setCustomDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().split('T')[0];
  });
  const [customStart, setCustomStart] = useState('09:00');
  const [customEnd, setCustomEnd] = useState('17:00');

  // Fetch provider profile to see master availability
  const { data: profileData } = useQuery({
    queryKey: ['provider-me-profile'],
    queryFn: () => providerApi.getMe(),
  });

  const profile = profileData?.data?.data?.profile;
  const [isMasterAvailable, setIsMasterAvailable] = useState(true);

  // Set availability mutation
  const setAvailMutation = useMutation({
    mutationFn: (data) => availabilityApi.set(data),
    onSuccess: () => {
      toast.success('Availability schedule saved!');
      queryClient.invalidateQueries(['provider-me-profile']);
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Failed to save schedule');
    },
  });

  // Toggle master availability mutation
  const toggleMasterMutation = useMutation({
    mutationFn: (isAvailable) => providerApi.updateProfile({ isAvailable }),
    onSuccess: (_, isAvail) => {
      setIsMasterAvailable(isAvail);
      toast.success(isAvail ? 'You are now marked Available for bookings' : 'You are now marked Away/Unavailable');
      queryClient.invalidateQueries(['provider-me-profile']);
    },
  });

  const handleToggleDay = (index) => {
    const next = [...schedule];
    next[index].enabled = !next[index].enabled;
    setSchedule(next);
  };

  const handleTimeChange = (index, field, value) => {
    const next = [...schedule];
    next[index][field] = value;
    setSchedule(next);
  };

  const handleSaveWeek = async () => {
    try {
      // Loop next 7 days and set availability
      const today = new Date();
      for (let i = 0; i < 7; i++) {
        const d = new Date(today);
        d.setDate(today.getDate() + i);
        const dayName = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'][d.getDay()];
        const dayConfig = schedule.find((s) => s.id === dayName);

        if (dayConfig) {
          await availabilityApi.set({
            date: d.toISOString().split('T')[0],
            isAvailable: dayConfig.enabled,
            slots: dayConfig.enabled
              ? [{ startTime: dayConfig.startTime, endTime: dayConfig.endTime }]
              : [],
          });
        }
      }
      toast.success('Weekly availability schedule synced successfully!');
    } catch (err) {
      toast.error('Failed to sync weekly availability.');
    }
  };

  const handleAddCustomDate = () => {
    if (customStart >= customEnd) {
      toast.error('Start time must be before end time.');
      return;
    }
    setAvailMutation.mutate({
      date: customDate,
      isAvailable: true,
      slots: [{ startTime: customStart, endTime: customEnd }],
    });
  };

  return (
    <div style={{ maxWidth: 850, margin: '0 auto', paddingBottom: '3rem' }}>
      <div className="flex justify-between items-center flex-wrap gap-2 mb-4">
        <div>
          <h1 style={{ fontSize: '1.85rem', fontWeight: 800, margin: 0, fontFamily: 'Outfit, sans-serif' }}>
            Work Hours & Availability 📅
          </h1>
          <p style={{ color: 'var(--color-ash-600)', margin: '0.2rem 0 0', fontSize: '0.9rem' }}>
            Manage working shifts and prevent overlapping booking appointments.
          </p>
        </div>

        {/* Master Active Status Toggle */}
        <div
          style={{
            backgroundColor: '#ffffff',
            borderRadius: '12px',
            padding: '0.5rem 1rem',
            border: '1px solid var(--color-ash-200)',
            display: 'flex',
            alignItems: 'center',
            gap: 10,
          }}
        >
          <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>Accepting New Jobs:</span>
          <button
            onClick={() => toggleMasterMutation.mutate(!isMasterAvailable)}
            style={{
              padding: '0.35rem 0.85rem',
              borderRadius: '999px',
              border: 'none',
              backgroundColor: isMasterAvailable ? '#dcfce7' : '#fee2e2',
              color: isMasterAvailable ? '#166534' : '#991b1b',
              fontWeight: 700,
              fontSize: '0.8rem',
              cursor: 'pointer',
            }}
          >
            {isMasterAvailable ? '🟢 Online / Active' : '🔴 Paused / Offline'}
          </button>
        </div>
      </div>

      {/* Weekly Schedule Manager */}
      <div
        style={{
          backgroundColor: '#ffffff',
          borderRadius: '20px',
          padding: '2rem',
          border: '1px solid var(--color-ash-200)',
          boxShadow: '0 4px 15px rgba(0, 0, 0, 0.02)',
          marginBottom: '2rem',
        }}
      >
        <div className="flex justify-between items-center mb-4">
          <h2 style={{ fontSize: '1.2rem', fontWeight: 800, margin: 0 }}>
            Standard Weekly Schedule
          </h2>
          <button onClick={handleSaveWeek} className="btn btn-primary btn-sm flex items-center gap-1 font-bold">
            <Save size={15} /> Save Weekly Shifts
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
          {schedule.map((day, idx) => (
            <div
              key={day.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '0.85rem 1.25rem',
                borderRadius: '14px',
                backgroundColor: day.enabled ? 'var(--color-bg)' : '#f8fafc',
                border: '1px solid var(--color-ash-200)',
                flexWrap: 'wrap',
                gap: '1rem',
              }}
            >
              <div className="flex items-center gap-3" style={{ width: '150px' }}>
                <input
                  type="checkbox"
                  checked={day.enabled}
                  onChange={() => handleToggleDay(idx)}
                  style={{ accentColor: 'var(--color-primary)', width: 18, height: 18 }}
                />
                <span style={{ fontWeight: 700, fontSize: '0.95rem', color: day.enabled ? 'var(--color-text)' : 'var(--color-ash-400)' }}>
                  {day.label}
                </span>
              </div>

              {day.enabled ? (
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1">
                    <Clock size={15} className="text-ash-500" />
                    <input
                      type="time"
                      className="form-control"
                      value={day.startTime}
                      onChange={(e) => handleTimeChange(idx, 'startTime', e.target.value)}
                      style={{ padding: '0.35rem 0.5rem', fontSize: '0.85rem', width: '115px' }}
                    />
                  </div>
                  <span className="text-ash-400">to</span>
                  <input
                    type="time"
                    className="form-control"
                    value={day.endTime}
                    onChange={(e) => handleTimeChange(idx, 'endTime', e.target.value)}
                    style={{ padding: '0.35rem 0.5rem', fontSize: '0.85rem', width: '115px' }}
                  />
                </div>
              ) : (
                <span style={{ fontSize: '0.825rem', color: 'var(--color-ash-400)', fontStyle: 'italic' }}>
                  Off-duty / Closed
                </span>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Date-Specific Override (Prevent overlap) */}
      <div
        style={{
          backgroundColor: '#ffffff',
          borderRadius: '20px',
          padding: '2rem',
          border: '1px solid var(--color-ash-200)',
        }}
      >
        <h2 style={{ fontSize: '1.2rem', fontWeight: 800, margin: '0 0 0.5rem' }}>
          Add Date-Specific Custom Slot
        </h2>
        <p style={{ color: 'var(--color-ash-600)', fontSize: '0.85rem', margin: '0 0 1.25rem' }}>
          Need to add an extra shift or special working slot for an upcoming festival or weekend?
        </p>

        <div className="grid grid-3 gap-2 mb-3">
          <div className="form-group">
            <label className="form-label">Specific Date</label>
            <input
              type="date"
              className="form-control"
              value={customDate}
              min={new Date().toISOString().split('T')[0]}
              onChange={(e) => setCustomDate(e.target.value)}
            />
          </div>
          <div className="form-group">
            <label className="form-label">Start Time</label>
            <input
              type="time"
              className="form-control"
              value={customStart}
              onChange={(e) => setCustomStart(e.target.value)}
            />
          </div>
          <div className="form-group">
            <label className="form-label">End Time</label>
            <input
              type="time"
              className="form-control"
              value={customEnd}
              onChange={(e) => setCustomEnd(e.target.value)}
            />
          </div>
        </div>

        <button
          onClick={handleAddCustomDate}
          className="btn btn-secondary flex items-center gap-1 font-bold"
        >
          <Plus size={16} /> Save Custom Slot
        </button>
      </div>
    </div>
  );
};

export default ProviderAvailabilityPage;
