import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { Lock, User, Eye, EyeOff } from 'lucide-react';
import toast from 'react-hot-toast';

const LoginPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const redirectPath = location.state?.redirect || '/dashboard';

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!username.trim() || !password) {
      toast.error('Please enter username and password');
      return;
    }

    try {
      setLoading(true);
      const user = await login({ username: username.trim(), password });
      toast.success(`Welcome back, ${user.name}!`);

      // Determine redirect based on role or passed redirect
      if (location.state?.redirect) {
        navigate(location.state.redirect, { state: location.state });
      } else {
        const roleRoutes = {
          customer: '/customer/dashboard',
          provider: user.accountStatus === 'pending' ? '/provider/application-status' : '/provider/dashboard',
          admin: '/admin/dashboard',
          operations: '/operations/dashboard',
          support: '/support/dashboard',
        };
        navigate(roleRoutes[user.role] || '/dashboard');
      }
    } catch (err) {
      const msg = err.response?.data?.message || 'Login failed. Please check your credentials.';
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
          Need an account?{' '}
          <Link to="/register" style={{ color: 'var(--color-primary)', fontWeight: 600, textDecoration: 'none' }}>
            Register as Customer
          </Link>
        </div>
      </div>

      {/* Main Content */}
      <div
        style={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '2.5rem 1.5rem',
        }}
      >
        <div style={{ width: '100%', maxWidth: '440px' }}>
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
                Sign In to CareConnect
              </h1>
              <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--color-ash-600)' }}>
                Access bookings, quotes, and service requests
              </p>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="form-group" style={{ marginBottom: '1.25rem' }}>
                <label className="form-label" style={{ fontWeight: 600 }}>Username or Mobile</label>
                <div style={{ position: 'relative' }}>
                  <User
                    size={18}
                    style={{
                      position: 'absolute',
                      left: '12px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      color: 'var(--color-ash-400)',
                    }}
                  />
                  <input
                    type="text"
                    className="form-control"
                    placeholder="e.g. anjali_gupta or 9811111111"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    style={{ paddingLeft: '2.5rem' }}
                    required
                  />
                </div>
              </div>

              <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                <div className="flex justify-between items-center mb-1">
                  <label className="form-label" style={{ fontWeight: 600, margin: 0 }}>Password</label>
                </div>
                <div style={{ position: 'relative' }}>
                  <Lock
                    size={18}
                    style={{
                      position: 'absolute',
                      left: '12px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      color: 'var(--color-ash-400)',
                    }}
                  />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    className="form-control"
                    placeholder="Enter password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    style={{ paddingLeft: '2.5rem', paddingRight: '2.5rem' }}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    style={{
                      position: 'absolute',
                      right: '10px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      color: 'var(--color-ash-500)',
                      padding: 4,
                    }}
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                className="btn btn-primary btn-block"
                disabled={loading}
                style={{ padding: '0.85rem', fontSize: '0.95rem', fontWeight: 700 }}
              >
                {loading ? 'Authenticating...' : 'Sign In'}
              </button>
            </form>

            <div style={{ marginTop: '1.5rem', textAlign: 'center' }}>
              <Link
                to="/provider-apply"
                style={{ fontSize: '0.825rem', color: 'var(--color-ash-600)', textDecoration: 'none' }}
              >
                Are you a skilled technician?{' '}
                <span style={{ color: 'var(--color-primary)', fontWeight: 600 }}>Apply as Provider</span>
              </Link>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
