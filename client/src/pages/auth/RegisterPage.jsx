import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { User, Phone, MapPin, Lock, ArrowRight, ShieldCheck, Mail } from 'lucide-react';
import toast from 'react-hot-toast';

const RegisterPage = () => {
  const navigate = useNavigate();
  const { register } = useAuth();

  const [formData, setFormData] = useState({
    name: '',
    username: '',
    email: '',
    mobile: '',
    password: '',
    city: 'New Delhi',
    state: 'Delhi',
    pincode: '110001',
    address: '',
  });

  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.name.trim() || !formData.username.trim() || !formData.mobile.trim() || !formData.password) {
      toast.error('Please fill in all required fields');
      return;
    }

    if (formData.mobile.replace(/\D/g, '').length !== 10) {
      toast.error('Please enter a valid 10-digit Indian mobile number');
      return;
    }

    if (formData.password.length < 6) {
      toast.error('Password must be at least 6 characters long');
      return;
    }

    try {
      setLoading(true);
      await register({
        name: formData.name.trim(),
        username: formData.username.trim().toLowerCase(),
        email: formData.email.trim() || undefined,
        mobile: formData.mobile.trim(),
        password: formData.password,
        location: {
          address: formData.address,
          city: formData.city,
          state: formData.state,
          pincode: formData.pincode,
        },
      });

      toast.success('Registration successful! Welcome to CareConnect.');
      navigate('/customer/dashboard');
    } catch (err) {
      const msg = err.response?.data?.message || 'Registration failed. Username or mobile may already exist.';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        backgroundColor: 'var(--color-bg)',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Top Navbar */}
      <div
        style={{
          padding: '1.25rem 2rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          borderBottom: '1px solid var(--color-ash-200)',
          backgroundColor: '#ffffff',
        }}
      >
        <Link to="/" className="flex items-center gap-2" style={{ textDecoration: 'none' }}>
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: '10px',
              backgroundColor: 'var(--color-primary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1.1rem',
            }}
          >
            🏠
          </div>
          <span style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 800, fontSize: '1.2rem', color: 'var(--color-text)' }}>
            CareConnect
          </span>
        </Link>
        <div style={{ fontSize: '0.875rem' }}>
          Already have an account?{' '}
          <Link to="/login" style={{ color: 'var(--color-primary)', fontWeight: 600, textDecoration: 'none' }}>
            Sign In
          </Link>
        </div>
      </div>

      <div
        style={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '3rem 1.5rem',
        }}
      >
        <div style={{ width: '100%', maxWidth: '580px' }}>
          <div
            style={{
              backgroundColor: '#ffffff',
              borderRadius: '20px',
              padding: '2.5rem',
              boxShadow: '0 20px 40px -15px rgba(0, 0, 0, 0.08)',
              border: '1px solid var(--color-ash-200)',
            }}
          >
            <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
              <h1 style={{ fontSize: '1.6rem', fontWeight: 800, margin: '0 0 0.5rem', fontFamily: 'Outfit, sans-serif' }}>
                Create Customer Account
              </h1>
              <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--color-ash-600)' }}>
                Sign up to book verified home services and track repairs
              </p>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="grid grid-2 gap-3" style={{ marginBottom: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">Full Name *</label>
                  <input
                    type="text"
                    name="name"
                    className="form-control"
                    placeholder="e.g. Pooja Sharma"
                    value={formData.name}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Username *</label>
                  <input
                    type="text"
                    name="username"
                    className="form-control"
                    placeholder="e.g. pooja_sharma"
                    value={formData.username}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-2 gap-3" style={{ marginBottom: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">Mobile Number *</label>
                  <input
                    type="tel"
                    name="mobile"
                    className="form-control"
                    placeholder="10-digit mobile"
                    value={formData.mobile}
                    onChange={handleChange}
                    maxLength={10}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Email (Optional)</label>
                  <input
                    type="email"
                    name="email"
                    className="form-control"
                    placeholder="name@example.com"
                    value={formData.email}
                    onChange={handleChange}
                  />
                </div>
              </div>

              <div className="form-group" style={{ marginBottom: '1rem' }}>
                <label className="form-label">Create Password *</label>
                <input
                  type="password"
                  name="password"
                  className="form-control"
                  placeholder="At least 6 characters"
                  value={formData.password}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="form-group" style={{ marginBottom: '1rem' }}>
                <label className="form-label">Street Address</label>
                <input
                  type="text"
                  name="address"
                  className="form-control"
                  placeholder="Flat/House number, Apartment, Landmark"
                  value={formData.address}
                  onChange={handleChange}
                />
              </div>

              <div className="grid grid-3 gap-2" style={{ marginBottom: '1.5rem' }}>
                <div className="form-group">
                  <label className="form-label">City</label>
                  <input
                    type="text"
                    name="city"
                    className="form-control"
                    value={formData.city}
                    onChange={handleChange}
                    required
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
                    required
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
                    maxLength={6}
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                className="btn btn-primary btn-block"
                disabled={loading}
                style={{ padding: '0.85rem', fontSize: '0.95rem', fontWeight: 700 }}
              >
                {loading ? 'Creating Account...' : 'Complete Registration'}
              </button>
            </form>

            <div style={{ marginTop: '1.5rem', textAlign: 'center' }}>
              <Link
                to="/provider-apply"
                style={{ fontSize: '0.825rem', color: 'var(--color-ash-600)', textDecoration: 'none' }}
              >
                Are you looking to provide services instead?{' '}
                <span style={{ color: 'var(--color-primary)', fontWeight: 600 }}>Apply as Provider</span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
