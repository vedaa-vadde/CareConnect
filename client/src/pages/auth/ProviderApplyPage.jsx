import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { authApi, categoryApi } from '../../api';
import {
  Wrench, ShieldCheck, CheckCircle2, Clock, Upload, ArrowRight,
  User, Phone, MapPin, Briefcase, Plus, X
} from 'lucide-react';
import toast from 'react-hot-toast';

const ProviderApplyPage = () => {
  const navigate = useNavigate();
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

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
    bio: '',
    experienceYears: 5,
    experienceDesc: '',
    categories: [],
    serviceRadius: 20,
  });

  const [skills, setSkills] = useState(['Appliance Repair']);
  const [skillInput, setSkillInput] = useState('');

  // Fetch available categories from server
  const { data: catData } = useQuery({
    queryKey: ['categories-for-apply'],
    queryFn: () => categoryApi.getAll(),
  });

  const categories = catData?.data?.data?.categories || [];

  const handleTextChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleCategoryToggle = (catId) => {
    const exists = formData.categories.includes(catId);
    if (exists) {
      setFormData({ ...formData, categories: formData.categories.filter((c) => c !== catId) });
    } else {
      setFormData({ ...formData, categories: [...formData.categories, catId] });
    }
  };

  const handleAddSkill = () => {
    if (skillInput.trim() && !skills.includes(skillInput.trim())) {
      setSkills([...skills, skillInput.trim()]);
      setSkillInput('');
    }
  };

  const handleRemoveSkill = (skillToRemove) => {
    setSkills(skills.filter((s) => s !== skillToRemove));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.name.trim() || !formData.username.trim() || !formData.mobile.trim() || !formData.password) {
      toast.error('Please fill in all required personal information');
      return;
    }

    if (formData.categories.length === 0) {
      toast.error('Please select at least one service category');
      return;
    }

    const cleanMobile = formData.mobile.replace(/\D/g, '');
    if (!/^[6-9]\d{9}$/.test(cleanMobile)) {
      toast.error('Please enter a valid 10-digit mobile number starting with 6, 7, 8, or 9');
      return;
    }

    try {
      setLoading(true);

      const payload = {
        name: formData.name.trim(),
        username: formData.username.trim().toLowerCase(),
        email: formData.email.trim() || undefined,
        mobile: cleanMobile,
        password: formData.password,
        location: {
          address: formData.address,
          city: formData.city,
          state: formData.state,
          pincode: formData.pincode,
        },
        bio: formData.bio || `Certified technician with ${formData.experienceYears} years of hands-on experience.`,
        categories: formData.categories,
        skills: skills.map((name) => ({ name, yearsOfExperience: Number(formData.experienceYears) })),
        experience: {
          years: Number(formData.experienceYears),
          description: formData.experienceDesc || `${formData.experienceYears} years in residential service and maintenance.`,
        },
        serviceAreas: [
          {
            city: formData.city,
            state: formData.state,
            pincode: formData.pincode,
            radius: Number(formData.serviceRadius),
          },
        ],
      };

      await authApi.providerApply(payload);
      setSubmitted(true);
      toast.success('Application submitted for review!');
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to submit application. Please check all fields.';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div
        style={{
          minHeight: '100vh',
          backgroundColor: 'var(--color-bg)',
          display: 'flex',
          flexDirection: 'column',
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
              backgroundColor: '#fef3c7',
              color: '#d97706',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 1.5rem',
              fontSize: '2.5rem',
            }}
          >
            ⏳
          </div>

          <span
            style={{
              display: 'inline-block',
              padding: '0.35rem 0.85rem',
              borderRadius: '999px',
              backgroundColor: '#fef3c7',
              color: '#92400e',
              fontSize: '0.825rem',
              fontWeight: 700,
              marginBottom: '1rem',
            }}
          >
            🟡 Status: Under Review
          </span>

          <h2 style={{ fontSize: '1.75rem', fontWeight: 800, margin: '0 0 0.75rem', fontFamily: 'Outfit, sans-serif' }}>
            Application Submitted!
          </h2>

          <p style={{ color: 'var(--color-ash-600)', fontSize: '0.95rem', lineHeight: 1.6, marginBottom: '2rem' }}>
            Thank you, <strong>{formData.name}</strong>. Your provider profile has been submitted to CareConnect's
            verification committee. An operations administrator will review your background and credentials within
            <strong> 24-48 hours</strong>.
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
            <div className="flex items-center gap-2 mb-2 font-bold text-primary">
              <ShieldCheck size={18} /> What happens next?
            </div>
            <ul style={{ margin: 0, paddingLeft: '1.25rem', color: 'var(--color-ash-700)', lineHeight: 1.5 }}>
              <li>Verification team checks your provided skills & identity</li>
              <li>Once approved, your account will be activated instantly</li>
              <li>You can log in and start receiving service leads in your city</li>
            </ul>
          </div>

          <div className="flex gap-3 justify-center">
            <Link to="/" className="btn btn-secondary">
              Back to Home
            </Link>
            <Link to="/login" className="btn btn-primary">
              Go to Login Page
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--color-bg)', display: 'flex', flexDirection: 'column' }}>
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
          Already approved?{' '}
          <Link to="/login" style={{ color: 'var(--color-primary)', fontWeight: 600, textDecoration: 'none' }}>
            Sign In
          </Link>
        </div>
      </div>

      {/* Main Container */}
      <div style={{ maxWidth: 850, margin: '2.5rem auto', padding: '0 1.5rem', width: '100%' }}>
        <div
          style={{
            backgroundColor: '#ffffff',
            borderRadius: '24px',
            padding: '2.5rem',
            boxShadow: '0 20px 40px -15px rgba(0, 0, 0, 0.06)',
            border: '1px solid var(--color-ash-200)',
          }}
        >
          <div style={{ marginBottom: '2rem' }}>
            <span
              style={{
                textTransform: 'uppercase',
                fontSize: '0.75rem',
                fontWeight: 700,
                color: 'var(--color-primary)',
                letterSpacing: '0.08em',
              }}
            >
              Partner Onboarding
            </span>
            <h1 style={{ fontSize: '1.75rem', fontWeight: 800, margin: '0.35rem 0 0.5rem', fontFamily: 'Outfit, sans-serif' }}>
              Service Provider Application 🛠️
            </h1>
            <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--color-ash-600)' }}>
              Join CareConnect's certified technician network. Receive verified customer bookings directly.
            </p>
          </div>

          <form onSubmit={handleSubmit}>
            {/* Step 1: Personal Details */}
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, margin: '1.5rem 0 1rem', display: 'flex', alignItems: 'center', gap: 8 }}>
              <User size={18} className="text-primary" /> 1. Personal & Contact Information
            </h3>

            <div className="grid grid-2 gap-3 mb-3">
              <div className="form-group">
                <label className="form-label">Full Name *</label>
                <input
                  type="text"
                  name="name"
                  className="form-control"
                  placeholder="e.g. Ramesh Verma"
                  value={formData.name}
                  onChange={handleTextChange}
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">Username *</label>
                <input
                  type="text"
                  name="username"
                  className="form-control"
                  placeholder="e.g. ramesh_verma"
                  value={formData.username}
                  onChange={handleTextChange}
                  required
                />
              </div>
            </div>

            <div className="grid grid-2 gap-3 mb-3">
              <div className="form-group">
                <label className="form-label">Mobile Number *</label>
                <input
                  type="tel"
                  name="mobile"
                  className="form-control"
                  placeholder="e.g. 9876543210"
                  value={formData.mobile}
                  onChange={handleTextChange}
                  maxLength={10}
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">Email Address (Optional)</label>
                <input
                  type="email"
                  name="email"
                  className="form-control"
                  placeholder="name@example.com"
                  value={formData.email}
                  onChange={handleTextChange}
                />
              </div>
            </div>

            <div className="form-group mb-3">
              <label className="form-label">Create Login Password *</label>
              <input
                type="password"
                name="password"
                className="form-control"
                placeholder="At least 6 characters"
                value={formData.password}
                onChange={handleTextChange}
                required
              />
            </div>

            {/* Step 2: Location */}
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, margin: '2rem 0 1rem', display: 'flex', alignItems: 'center', gap: 8 }}>
              <MapPin size={18} className="text-primary" /> 2. Base Location & Service Radius
            </h3>

            <div className="form-group mb-3">
              <label className="form-label">Workshop / Residential Address</label>
              <input
                type="text"
                name="address"
                className="form-control"
                placeholder="Street address or workshop location"
                value={formData.address}
                onChange={handleTextChange}
              />
            </div>

            <div className="grid grid-4 gap-2 mb-3">
              <div className="form-group">
                <label className="form-label">City</label>
                <input
                  type="text"
                  name="city"
                  className="form-control"
                  value={formData.city}
                  onChange={handleTextChange}
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
                  onChange={handleTextChange}
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
                  onChange={handleTextChange}
                  maxLength={6}
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">Service Radius (km)</label>
                <input
                  type="number"
                  name="serviceRadius"
                  className="form-control"
                  value={formData.serviceRadius}
                  onChange={handleTextChange}
                  min={5}
                  max={50}
                  required
                />
              </div>
            </div>

            {/* Step 3: Categories & Skills */}
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, margin: '2rem 0 1rem', display: 'flex', alignItems: 'center', gap: 8 }}>
              <Briefcase size={18} className="text-primary" /> 3. Service Categories & Skills
            </h3>

            <div className="form-group mb-3">
              <label className="form-label">Select Service Categories you offer *</label>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
                  gap: '0.65rem',
                  marginTop: '0.5rem',
                }}
              >
                {categories.map((cat) => {
                  const isChecked = formData.categories.includes(cat._id);
                  return (
                    <label
                      key={cat._id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.6rem',
                        padding: '0.65rem 0.85rem',
                        borderRadius: '10px',
                        border: `1.5px solid ${isChecked ? 'var(--color-primary)' : 'var(--color-ash-300)'}`,
                        backgroundColor: isChecked ? 'var(--color-primary-50)' : '#ffffff',
                        cursor: 'pointer',
                        fontSize: '0.85rem',
                        fontWeight: isChecked ? 600 : 500,
                        transition: 'all 0.15s ease',
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => handleCategoryToggle(cat._id)}
                        style={{ accentColor: 'var(--color-primary)' }}
                      />
                      <span>{cat.icon} {cat.name}</span>
                    </label>
                  );
                })}
              </div>
            </div>

            <div className="grid grid-2 gap-3 mb-3">
              <div className="form-group">
                <label className="form-label">Total Years of Experience</label>
                <input
                  type="number"
                  name="experienceYears"
                  className="form-control"
                  value={formData.experienceYears}
                  onChange={handleTextChange}
                  min={1}
                  max={45}
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">Short Bio / Professional Intro</label>
                <input
                  type="text"
                  name="bio"
                  className="form-control"
                  placeholder="e.g. Certified technician for LG, Samsung, Whirlpool"
                  value={formData.bio}
                  onChange={handleTextChange}
                />
              </div>
            </div>

            <div className="form-group mb-4">
              <label className="form-label">Specific Skills / Specializations</label>
              <div className="flex gap-2 mb-2">
                <input
                  type="text"
                  className="form-control"
                  placeholder="Add skill (e.g. PCB Repair, Gas Charging, Motor Rewinding)"
                  value={skillInput}
                  onChange={(e) => setSkillInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddSkill();
                    }
                  }}
                />
                <button type="button" className="btn btn-secondary" onClick={handleAddSkill}>
                  <Plus size={16} /> Add
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {skills.map((skill, idx) => (
                  <span
                    key={idx}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 4,
                      padding: '0.3rem 0.65rem',
                      borderRadius: '8px',
                      backgroundColor: 'var(--color-ash-100)',
                      fontSize: '0.8rem',
                      fontWeight: 600,
                      color: 'var(--color-text)',
                    }}
                  >
                    {skill}
                    <button
                      type="button"
                      onClick={() => handleRemoveSkill(skill)}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex' }}
                    >
                      <X size={14} className="text-ash-500" />
                    </button>
                  </span>
                ))}
              </div>
            </div>

            <div
              style={{
                backgroundColor: 'var(--color-bg)',
                borderRadius: '12px',
                padding: '1rem',
                border: '1px solid var(--color-ash-200)',
                fontSize: '0.825rem',
                color: 'var(--color-ash-700)',
                marginBottom: '1.5rem',
              }}
            >
              🔒 <strong>Verification Guarantee:</strong> In accordance with platform security rules,
              all technician profiles undergo an administrative background review prior to accepting jobs.
            </div>

            <button
              type="submit"
              className="btn btn-primary btn-block btn-lg"
              disabled={loading}
              style={{ fontWeight: 700 }}
            >
              {loading ? 'Submitting Application...' : 'Submit Provider Application →'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ProviderApplyPage;
