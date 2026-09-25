import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { categoryApi } from '../api';
import {
  ShieldCheck, Clock, Award, Sparkles, ArrowRight, CheckCircle,
  Star, Users, PhoneCall, ChevronRight, Play, Wrench, Search, Zap
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

// High quality photography curated for Indian home services
const categoryImageMap = {
  'washing-machine-repair': 'https://images.unsplash.com/photo-1626806787461-102c1bfaaea1?auto=format&fit=crop&w=600&q=80',
  'refrigerator-repair': 'https://images.unsplash.com/photo-1571175443880-49e1d25b2bc5?auto=format&fit=crop&w=600&q=80',
  'ac-repair': 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?auto=format&fit=crop&w=600&q=80',
  'electrical-work': 'https://images.unsplash.com/photo-1621905252507-b35492cc74b4?auto=format&fit=crop&w=600&q=80',
  'plumbing': 'https://images.unsplash.com/photo-1585704032915-c3400ca199e7?auto=format&fit=crop&w=600&q=80',
  'house-cleaning': 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&w=600&q=80',
  'appliance-repair': 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=600&q=80',
  'home-maintenance': 'https://images.unsplash.com/photo-1505798577917-a65157d3320a?auto=format&fit=crop&w=600&q=80',
};

const defaultCategoryImg = 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&w=600&q=80';

const LandingPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const { data: catData, isLoading: catLoading } = useQuery({
    queryKey: ['public-categories'],
    queryFn: () => categoryApi.getAll(),
  });

  const categories = catData?.data?.data?.categories || [];

  const handleCategoryClick = (category) => {
    if (user) {
      if (user.role === 'customer') {
        navigate('/customer/request', { state: { selectedCategory: category } });
      } else {
        navigate('/dashboard');
      }
    } else {
      navigate('/login', { state: { redirect: '/customer/request', selectedCategory: category } });
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: 'var(--color-bg)' }}>
      {/* Navigation Bar */}
      <nav
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 100,
          backgroundColor: 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(10px)',
          borderBottom: '1px solid var(--color-ash-200)',
          padding: '0.85rem 1.5rem',
        }}
      >
        <div className="container flex items-center justify-between" style={{ maxWidth: 1200 }}>
          <Link to="/" className="flex items-center gap-2" style={{ textDecoration: 'none' }}>
            <div
              style={{
                width: 40,
                height: 40,
                borderRadius: '12px',
                background: 'linear-gradient(135deg, #4a7c59, #365b41)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.25rem',
                color: '#fff',
                boxShadow: '0 4px 12px rgba(74, 124, 89, 0.25)',
              }}
            >
              🏠
            </div>
            <div>
              <span
                style={{
                  fontFamily: 'Outfit, sans-serif',
                  fontWeight: 800,
                  fontSize: '1.35rem',
                  color: 'var(--color-primary-dark)',
                  letterSpacing: '-0.02em',
                }}
              >
                CareConnect
              </span>
              <span
                style={{
                  display: 'block',
                  fontSize: '0.65rem',
                  fontWeight: 600,
                  color: 'var(--color-ash-500)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em',
                }}
              >
                Home Services
              </span>
            </div>
          </Link>

          <div className="flex items-center gap-4">
            <a
              href="#categories"
              style={{
                textDecoration: 'none',
                color: 'var(--color-ash-700)',
                fontWeight: 600,
                fontSize: '0.9rem',
              }}
            >
              Services
            </a>
            <a
              href="#how-it-works"
              style={{
                textDecoration: 'none',
                color: 'var(--color-ash-700)',
                fontWeight: 600,
                fontSize: '0.9rem',
              }}
            >
              How It Works
            </a>
            <Link
              to="/provider-apply"
              style={{
                textDecoration: 'none',
                color: 'var(--color-primary)',
                fontWeight: 600,
                fontSize: '0.9rem',
                padding: '0.4rem 0.8rem',
                borderRadius: '8px',
                backgroundColor: 'var(--color-primary-50)',
              }}
            >
              Join as Provider
            </Link>

            {user ? (
              <Link to="/dashboard" className="btn btn-primary" style={{ padding: '0.5rem 1.15rem' }}>
                Go to Dashboard
              </Link>
            ) : (
              <div className="flex items-center gap-2">
                <Link to="/login" className="btn btn-secondary" style={{ padding: '0.5rem 1.1rem' }}>
                  Sign In
                </Link>
                <Link to="/register" className="btn btn-primary" style={{ padding: '0.5rem 1.15rem' }}>
                  Register
                </Link>
              </div>
            )}
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section
        style={{
          padding: '4rem 1.5rem 3.5rem',
          background: 'linear-gradient(180deg, #f7f9f6 0%, #edf3ee 100%)',
          borderBottom: '1px solid var(--color-ash-200)',
        }}
      >
        <div className="container" style={{ maxWidth: 1200 }}>
          <div className="grid grid-2 items-center gap-4">
            <div>
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '0.35rem 0.85rem',
                  borderRadius: '999px',
                  backgroundColor: 'var(--color-primary-100)',
                  color: 'var(--color-primary-dark)',
                  fontSize: '0.825rem',
                  fontWeight: 700,
                  marginBottom: '1.25rem',
                }}
              >
                <Sparkles size={16} /> AI-Powered Home Services
              </div>
              <h1
                style={{
                  fontSize: '2.8rem',
                  fontWeight: 800,
                  lineHeight: 1.15,
                  color: 'var(--color-text)',
                  marginBottom: '1rem',
                  fontFamily: 'Outfit, sans-serif',
                }}
              >
                Trusted help, right at your doorstep. <span style={{ color: 'var(--color-primary)' }}>🏠✨</span>
              </h1>
              <p
                style={{
                  fontSize: '1.1rem',
                  color: 'var(--color-ash-600)',
                  lineHeight: 1.6,
                  marginBottom: '2rem',
                  maxWidth: 500,
                }}
              >
                Book background-verified electricians, plumbers, appliance technicians, and home cleaners.
                Describe your issue, let our AI match verified experts, and get upfront transparent quotes.
              </p>

              <div className="flex flex-wrap gap-3 items-center">
                <a href="#categories" className="btn btn-primary btn-lg flex items-center gap-2">
                  <Search size={18} /> Book a Service Now
                </a>
                <Link to="/provider-apply" className="btn btn-secondary btn-lg flex items-center gap-2">
                  <Wrench size={18} /> Apply as Technician
                </Link>
              </div>

              {/* Trust Badges */}
              <div
                className="flex items-center gap-4"
                style={{ marginTop: '2.5rem', paddingTop: '1.5rem', borderTop: '1px solid var(--color-ash-200)' }}
              >
                <div className="flex items-center gap-2">
                  <ShieldCheck size={20} className="text-primary" />
                  <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>100% Verified Experts</span>
                </div>
                <div className="flex items-center gap-2">
                  <Award size={20} className="text-primary" />
                  <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>Transparent Pricing</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock size={20} className="text-primary" />
                  <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>Real-Time Tracking</span>
                </div>
              </div>
            </div>

            {/* Hero Image Showcase */}
            <div style={{ position: 'relative' }}>
              <div
                style={{
                  borderRadius: '24px',
                  overflow: 'hidden',
                  boxShadow: '0 20px 40px -15px rgba(0, 0, 0, 0.15)',
                  border: '8px solid #ffffff',
                }}
              >
                <img
                  src="https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&w=900&q=80"
                  alt="CareConnect Professional Service"
                  style={{ width: '100%', height: '420px', objectFit: 'cover', display: 'block' }}
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section id="categories" style={{ padding: '4.5rem 1.5rem' }}>
        <div className="container" style={{ maxWidth: 1200 }}>
          <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
            <span
              style={{
                textTransform: 'uppercase',
                fontSize: '0.75rem',
                fontWeight: 700,
                letterSpacing: '0.1em',
                color: 'var(--color-primary)',
              }}
            >
              Explore Our Expertise
            </span>
            <h2
              style={{
                fontSize: '2.2rem',
                fontWeight: 800,
                marginTop: '0.35rem',
                fontFamily: 'Outfit, sans-serif',
              }}
            >
              Popular Home Services
            </h2>
            <p style={{ color: 'var(--color-ash-600)', maxWidth: 600, margin: '0.5rem auto 0', fontSize: '1rem' }}>
              Choose a category below to describe your problem and get matched with certified specialists in your neighborhood.
            </p>
          </div>

          {catLoading ? (
            <div className="text-center py-8">
              <div className="spinner" style={{ margin: '0 auto' }} />
              <p className="mt-3 text-ash-500">Loading service catalog...</p>
            </div>
          ) : (
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(270px, 1fr))',
                gap: '1.5rem',
              }}
            >
              {categories.map((cat) => {
                const imgUrl = categoryImageMap[cat.slug] || defaultCategoryImg;
                const minPrice = cat.pricingRules?.minimum || 300;
                const maxPrice = cat.pricingRules?.maximum || 5000;

                return (
                  <div
                    key={cat._id}
                    onClick={() => handleCategoryClick(cat)}
                    style={{
                      backgroundColor: '#ffffff',
                      borderRadius: '18px',
                      overflow: 'hidden',
                      border: '1px solid var(--color-ash-200)',
                      boxShadow: '0 4px 15px rgba(0, 0, 0, 0.04)',
                      transition: 'all 0.25s ease',
                      cursor: 'pointer',
                      display: 'flex',
                      flexDirection: 'column',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'translateY(-6px)';
                      e.currentTarget.style.boxShadow = '0 16px 30px rgba(0, 0, 0, 0.08)';
                      e.currentTarget.style.borderColor = 'var(--color-primary-light)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.boxShadow = '0 4px 15px rgba(0, 0, 0, 0.04)';
                      e.currentTarget.style.borderColor = 'var(--color-ash-200)';
                    }}
                  >
                    {/* Category Image */}
                    <div style={{ position: 'relative', height: '170px', overflow: 'hidden' }}>
                      <img
                        src={imgUrl}
                        alt={cat.name}
                        style={{
                          width: '100%',
                          height: '100%',
                          objectFit: 'cover',
                          transition: 'transform 0.4s ease',
                        }}
                      />
                      <div
                        style={{
                          position: 'absolute',
                          top: '12px',
                          left: '12px',
                          backgroundColor: 'rgba(255, 255, 255, 0.95)',
                          backdropFilter: 'blur(4px)',
                          padding: '0.3rem 0.65rem',
                          borderRadius: '8px',
                          fontSize: '1rem',
                          fontWeight: 700,
                          boxShadow: '0 2px 6px rgba(0,0,0,0.1)',
                        }}
                      >
                        {cat.icon || '🔧'}
                      </div>
                      <div
                        style={{
                          position: 'absolute',
                          bottom: '10px',
                          right: '12px',
                          backgroundColor: 'rgba(26, 35, 48, 0.85)',
                          color: '#ffffff',
                          padding: '0.25rem 0.6rem',
                          borderRadius: '6px',
                          fontSize: '0.75rem',
                          fontWeight: 600,
                        }}
                      >
                        ₹{minPrice} - ₹{maxPrice}
                      </div>
                    </div>

                    {/* Details */}
                    <div style={{ padding: '1.25rem', flex: 1, display: 'flex', flexDirection: 'column' }}>
                      <h3
                        style={{
                          fontSize: '1.1rem',
                          fontWeight: 700,
                          margin: '0 0 0.4rem',
                          color: 'var(--color-text)',
                        }}
                      >
                        {cat.name}
                      </h3>
                      <p
                        style={{
                          fontSize: '0.85rem',
                          color: 'var(--color-ash-600)',
                          margin: '0 0 1rem',
                          lineHeight: 1.45,
                          flex: 1,
                        }}
                      >
                        {cat.description}
                      </p>

                      <div
                        className="flex items-center justify-between"
                        style={{
                          paddingTop: '0.75rem',
                          borderTop: '1px solid var(--color-ash-100)',
                          fontSize: '0.85rem',
                          fontWeight: 700,
                          color: 'var(--color-primary)',
                        }}
                      >
                        <span>Book Service</span>
                        <ArrowRight size={16} />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* How It Works Section */}
      <section
        id="how-it-works"
        style={{
          padding: '4.5rem 1.5rem',
          backgroundColor: '#ffffff',
          borderTop: '1px solid var(--color-ash-200)',
          borderBottom: '1px solid var(--color-ash-200)',
        }}
      >
        <div className="container" style={{ maxWidth: 1100 }}>
          <div style={{ textAlign: 'center', marginBottom: '3.5rem' }}>
            <span
              style={{
                textTransform: 'uppercase',
                fontSize: '0.75rem',
                fontWeight: 700,
                letterSpacing: '0.1em',
                color: 'var(--color-primary)',
              }}
            >
              Simple & Transparent
            </span>
            <h2
              style={{
                fontSize: '2.2rem',
                fontWeight: 800,
                marginTop: '0.35rem',
                fontFamily: 'Outfit, sans-serif',
              }}
            >
              How CareConnect Works
            </h2>
            <p style={{ color: 'var(--color-ash-600)', maxWidth: 500, margin: '0.5rem auto 0' }}>
              Four easy steps to a well-maintained, stress-free home.
            </p>
          </div>

          <div className="grid grid-4 gap-3 text-center">
            {[
              {
                step: '01',
                title: 'Describe Problem',
                desc: 'Select your appliance or service. Our smart AI helps analyze the issue and needed skills.',
                emoji: '📝',
              },
              {
                step: '02',
                title: 'Compare Quotes',
                desc: 'Verified local technicians review and submit quotes with ratings and schedule options.',
                emoji: '🔍',
              },
              {
                step: '03',
                title: 'Track Live',
                desc: 'Watch the technician arrival status, work progress, and before/after verification photos.',
                emoji: '🚗',
              },
              {
                step: '04',
                title: 'Confirm & Review',
                desc: 'Review the invoice, approve work completion, and rate your experience seamlessly.',
                emoji: '✅',
              },
            ].map((item, i) => (
              <div
                key={i}
                style={{
                  padding: '2rem 1.25rem',
                  borderRadius: '16px',
                  backgroundColor: 'var(--color-bg)',
                  border: '1px solid var(--color-ash-200)',
                  position: 'relative',
                }}
              >
                <div
                  style={{
                    position: 'absolute',
                    top: '12px',
                    right: '16px',
                    fontSize: '0.75rem',
                    fontWeight: 800,
                    color: 'var(--color-primary)',
                    opacity: 0.7,
                  }}
                >
                  {item.step}
                </div>
                <div
                  style={{
                    fontSize: '2.25rem',
                    marginBottom: '1rem',
                  }}
                >
                  {item.emoji}
                </div>
                <h3 style={{ fontSize: '1.05rem', fontWeight: 700, margin: '0 0 0.5rem' }}>
                  {item.title}
                </h3>
                <p style={{ fontSize: '0.85rem', color: 'var(--color-ash-600)', margin: 0, lineHeight: 1.45 }}>
                  {item.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>



      {/* Footer */}
      <footer
        style={{
          marginTop: 'auto',
          backgroundColor: '#1a2330',
          color: '#e2e8f0',
          padding: '3rem 1.5rem 1.5rem',
        }}
      >
        <div className="container" style={{ maxWidth: 1200 }}>
          <div className="grid grid-4 gap-4 mb-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span style={{ fontSize: '1.3rem' }}>🏠</span>
                <span style={{ fontWeight: 800, fontSize: '1.2rem', color: '#ffffff' }}>CareConnect</span>
              </div>
              <p style={{ fontSize: '0.825rem', color: '#94a3b8', lineHeight: 1.5 }}>
                India's premier AI-assisted on-demand home service marketplace. Trusted by households across Delhi, Mumbai, Bengaluru & more.
              </p>
            </div>

            <div>
              <h4 style={{ fontSize: '0.9rem', color: '#ffffff', marginBottom: '0.75rem' }}>Popular Services</h4>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, fontSize: '0.825rem', color: '#94a3b8', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                <li>Washing Machine Repair</li>
                <li>Refrigerator Repair</li>
                <li>AC Maintenance & Gas Refill</li>
                <li>Electrician & Wiring</li>
                <li>Plumbing & Fixtures</li>
              </ul>
            </div>

            <div>
              <h4 style={{ fontSize: '0.9rem', color: '#ffffff', marginBottom: '0.75rem' }}>For Professionals</h4>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, fontSize: '0.825rem', color: '#94a3b8', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                <li><Link to="/provider-apply" style={{ color: '#94a3b8', textDecoration: 'none' }}>Apply as Service Partner</Link></li>
                <li>Partner Safety Code</li>
                <li>Zero Commission Guarantee</li>
                <li>Technician Support</li>
              </ul>
            </div>

            <div>
              <h4 style={{ fontSize: '0.9rem', color: '#ffffff', marginBottom: '0.75rem' }}>Support & Safety</h4>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, fontSize: '0.825rem', color: '#94a3b8', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                <li>Help Center</li>
                <li>Dispute Resolution Policy</li>
                <li>100% Background Check Guarantee</li>
                <li>support@careconnect.in</li>
              </ul>
            </div>
          </div>

          <div
            style={{
              paddingTop: '1.5rem',
              borderTop: '1px solid rgba(255, 255, 255, 0.1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              fontSize: '0.75rem',
              color: '#64748b',
            }}
          >
            <div>© {new Date().getFullYear()} CareConnect Technologies India Pvt Ltd. All rights reserved.</div>
            <div>Built for excellence in home care.</div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
