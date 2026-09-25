import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { authApi } from '../../api';
import { User, Phone, MapPin, Mail, ShieldCheck, Check, Save } from 'lucide-react';
import toast from 'react-hot-toast';

const CustomerProfilePage = () => {
  const { user, refreshUser } = useAuth();

  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    mobile: user?.mobile || '',
    address: user?.location?.address || '',
    city: user?.location?.city || '',
    state: user?.location?.state || '',
    pincode: user?.location?.pincode || '',
  });

  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      await authApi.updateProfile({
        name: formData.name,
        email: formData.email || undefined,
        location: {
          address: formData.address,
          city: formData.city,
          state: formData.state,
          pincode: formData.pincode,
        },
      });

      if (refreshUser) await refreshUser();
      toast.success('Profile updated successfully!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update profile.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: 750, margin: '0 auto', paddingBottom: '3rem' }}>
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 800, margin: 0, fontFamily: 'Outfit, sans-serif' }}>
          Customer Profile 👤
        </h1>
        <p style={{ color: 'var(--color-ash-600)', margin: '0.2rem 0 0', fontSize: '0.9rem' }}>
          Manage your contact information and default service address.
        </p>
      </div>

      <div
        style={{
          backgroundColor: '#ffffff',
          borderRadius: '20px',
          padding: '2rem',
          border: '1px solid var(--color-ash-200)',
          boxShadow: '0 4px 15px rgba(0, 0, 0, 0.02)',
        }}
      >
        {/* Header Avatar */}
        <div className="flex items-center gap-4 pb-4 mb-4 border-b border-ash-200">
          <div
            style={{
              width: 64,
              height: 64,
              borderRadius: '50%',
              backgroundColor: 'var(--color-primary-100)',
              color: 'var(--color-primary-dark)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1.5rem',
              fontWeight: 800,
            }}
          >
            {user?.name?.slice(0, 2).toUpperCase() || 'CU'}
          </div>
          <div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0 }}>{user?.name}</h2>
            <div style={{ fontSize: '0.85rem', color: 'var(--color-ash-600)', marginTop: 2 }}>
              @{user?.username} • Customer Account
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="grid grid-2 gap-3 mb-3">
            <div className="form-group">
              <label className="form-label">Full Name</label>
              <input
                type="text"
                name="name"
                className="form-control"
                value={formData.name}
                onChange={handleChange}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">Email Address</label>
              <input
                type="email"
                name="email"
                className="form-control"
                value={formData.email}
                onChange={handleChange}
              />
            </div>
          </div>

          <div className="form-group mb-3">
            <label className="form-label">Mobile Number</label>
            <input
              type="text"
              name="mobile"
              className="form-control"
              value={formData.mobile}
              disabled
              style={{ backgroundColor: 'var(--color-bg)', cursor: 'not-allowed' }}
            />
            <span style={{ fontSize: '0.75rem', color: 'var(--color-ash-500)', marginTop: 4, display: 'block' }}>
              Mobile is verified and used for SMS service updates.
            </span>
          </div>

          <h3 style={{ fontSize: '1rem', fontWeight: 700, margin: '1.5rem 0 1rem' }}>
            Default Home Address
          </h3>

          <div className="form-group mb-3">
            <label className="form-label">Street Address</label>
            <input
              type="text"
              name="address"
              className="form-control"
              value={formData.address}
              onChange={handleChange}
              placeholder="Flat/House number, Apartment, Landmark"
            />
          </div>

          <div className="grid grid-3 gap-2 mb-4">
            <div className="form-group">
              <label className="form-label">City</label>
              <input
                type="text"
                name="city"
                className="form-control"
                value={formData.city}
                onChange={handleChange}
              />
            </div>
            <div className="form-group">
              <label className="form-label">State</label>
              <input
                type="text"
                name="state"
                className="form-control"
                value={formData.state}
                onChange={handleChange}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Pincode</label>
              <input
                type="text"
                name="pincode"
                className="form-control"
                value={formData.pincode}
                onChange={handleChange}
              />
            </div>
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            disabled={loading}
            style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 700 }}
          >
            <Save size={16} /> {loading ? 'Saving Changes...' : 'Save Profile Changes'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default CustomerProfilePage;
