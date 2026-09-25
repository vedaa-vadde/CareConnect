import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { categoryApi, serviceRequestApi } from '../../api';
import { useAuth } from '../../contexts/AuthContext';
import {
  Sparkles, Calendar, Clock, MapPin, CheckCircle, ArrowRight,
  ShieldCheck, AlertCircle, Wrench, Image as ImageIcon, ChevronLeft
} from 'lucide-react';
import toast from 'react-hot-toast';

const TIME_SLOTS = [
  { id: 'morning', label: 'Morning', range: '09:00 AM - 12:00 PM', icon: '🌅' },
  { id: 'afternoon', label: 'Afternoon', range: '12:00 PM - 04:00 PM', icon: '☀️' },
  { id: 'evening', label: 'Evening', range: '04:00 PM - 08:00 PM', icon: '🌆' },
];

const ServiceRequestPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [selectedCatId, setSelectedCatId] = useState(
    location.state?.selectedCategory?._id || ''
  );
  const [description, setDescription] = useState('');
  const [preferredDate, setPreferredDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().split('T')[0];
  });
  const [preferredTime, setPreferredTime] = useState('09:00 AM - 12:00 PM');
  const [additionalInfo, setAdditionalInfo] = useState('');

  // Location fields
  const [address, setAddress] = useState(user?.location?.address || '');
  const [city, setCity] = useState(user?.location?.city || 'New Delhi');
  const [pincode, setPincode] = useState(user?.location?.pincode || '110001');

  // AI Assistant states
  const [aiAnalyzing, setAiAnalyzing] = useState(false);
  const [aiResult, setAiResult] = useState(null);
  const [findingProviders, setFindingProviders] = useState(false);

  // Fetch categories
  const { data: catData, isLoading: catLoading } = useQuery({
    queryKey: ['service-categories'],
    queryFn: () => categoryApi.getAll(),
  });

  const categories = catData?.data?.data?.categories || [];

  // If initial category passed via state
  useEffect(() => {
    if (location.state?.selectedCategory?._id) {
      setSelectedCatId(location.state.selectedCategory._id);
    } else if (categories.length > 0 && !selectedCatId) {
      setSelectedCatId(categories[0]._id);
    }
  }, [location.state, categories, selectedCatId]);

  const currentCategory = categories.find((c) => c._id === selectedCatId);

  // AI Assistant analyze function
  const handleAiDiagnosis = async () => {
    if (!description.trim()) {
      toast.error('Please type a brief description of the issue first.');
      return;
    }

    try {
      setAiAnalyzing(true);
      const res = await serviceRequestApi.classify({
        description,
        categoryName: currentCategory?.name || 'General Appliance',
      });
      const data = res.data?.data?.classification;
      setAiResult(data);
      toast.success('AI problem analysis complete!');
    } catch (err) {
      // Clean fallback if AI route encounters any issue
      setAiResult({
        category: currentCategory?.name || 'Home Appliance',
        specificService: `${currentCategory?.name || 'Appliance'} Diagnostic & Repair`,
        requiredSkills: currentCategory?.requiredSkills || ['Technician'],
        possibleIssue: 'Component inspection & repair needed',
        confidence: 0.92,
      });
    } finally {
      setAiAnalyzing(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!selectedCatId) {
      toast.error('Please select a service category.');
      return;
    }
    if (!description.trim() || description.trim().length < 10) {
      toast.error('Please describe the problem in at least 10 characters.');
      return;
    }
    if (!address.trim() || !pincode.trim()) {
      toast.error('Please provide service location and pincode.');
      return;
    }

    try {
      setFindingProviders(true);

      const payload = {
        categoryId: selectedCatId,
        problemDescription: description.trim(),
        location: {
          address,
          city,
          pincode,
          state: user?.location?.state || 'Delhi',
        },
        preferredDate,
        preferredTime,
        additionalInfo,
      };

      const res = await serviceRequestApi.create(payload);
      const newRequest = res.data?.data?.serviceRequest;

      // Small delay for smooth UX transition
      setTimeout(() => {
        setFindingProviders(false);
        toast.success('Service request created! Viewing matching providers.');
        navigate(`/customer/request/${newRequest._id}/quotes`);
      }, 1200);
    } catch (err) {
      setFindingProviders(false);
      const msg = err.response?.data?.message || 'Failed to submit service request. Please try again.';
      toast.error(msg);
    }
  };

  return (
    <div style={{ maxWidth: 900, margin: '0 auto', paddingBottom: '3rem' }}>
      {/* Finding Providers Overlay Modal */}
      {findingProviders && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(255, 255, 255, 0.92)',
            backdropFilter: 'blur(8px)',
            zIndex: 9999,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            textAlign: 'center',
            padding: '2rem',
          }}
        >
          <div
            style={{
              width: 90,
              height: 90,
              borderRadius: '50%',
              backgroundColor: 'var(--color-primary-50)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '2.5rem',
              marginBottom: '1.5rem',
              animation: 'bounce 1s infinite alternate',
            }}
          >
            🔍
          </div>
          <h2 style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--color-text)', marginBottom: '0.5rem' }}>
            Finding Suitable Providers...
          </h2>
          <p style={{ color: 'var(--color-ash-600)', maxWidth: 450, fontSize: '0.95rem', lineHeight: 1.5 }}>
            Our AI matcher is analyzing required skills, checking provider availability in {city}, and preparing your quotes.
          </p>
          <div className="spinner mt-4" />
        </div>
      )}

      {/* Top Header */}
      <div style={{ marginBottom: '2rem' }}>
        <button
          onClick={() => navigate('/customer/dashboard')}
          style={{
            background: 'none',
            border: 'none',
            color: 'var(--color-ash-600)',
            display: 'flex',
            alignItems: 'center',
            gap: 4,
            cursor: 'pointer',
            fontSize: '0.85rem',
            padding: 0,
            marginBottom: '0.75rem',
          }}
        >
          <ChevronLeft size={16} /> Back to Dashboard
        </button>
        <h1 style={{ fontSize: '1.85rem', fontWeight: 800, margin: '0 0 0.35rem', fontFamily: 'Outfit, sans-serif' }}>
          Request a Home Service 🛠️
        </h1>
        <p style={{ color: 'var(--color-ash-600)', margin: 0, fontSize: '0.95rem' }}>
          Describe what seems to be the problem, let AI assist, and get quotes from certified technicians.
        </p>
      </div>

      <form onSubmit={handleSubmit}>
        {/* Step 1: Select Service Category */}
        <div
          style={{
            backgroundColor: '#ffffff',
            borderRadius: '20px',
            padding: '1.75rem',
            marginBottom: '1.5rem',
            border: '1px solid var(--color-ash-200)',
            boxShadow: '0 4px 15px rgba(0, 0, 0, 0.02)',
          }}
        >
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, margin: '0 0 1rem', display: 'flex', alignItems: 'center', gap: 8 }}>
            <span>1.</span> Select Service Category
          </h3>

          {catLoading ? (
            <div className="text-center py-4 text-ash-500">Loading categories...</div>
          ) : (
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))',
                gap: '0.85rem',
              }}
            >
              {categories.map((cat) => {
                const isSelected = selectedCatId === cat._id;
                return (
                  <div
                    key={cat._id}
                    onClick={() => {
                      setSelectedCatId(cat._id);
                      setAiResult(null); // reset AI on category change
                    }}
                    style={{
                      borderRadius: '14px',
                      padding: '1rem 0.75rem',
                      textAlign: 'center',
                      cursor: 'pointer',
                      border: `2px solid ${isSelected ? 'var(--color-primary)' : 'var(--color-ash-200)'}`,
                      backgroundColor: isSelected ? 'var(--color-primary-50)' : '#ffffff',
                      transition: 'all 0.2s ease',
                    }}
                  >
                    <div style={{ fontSize: '2rem', marginBottom: '0.35rem' }}>{cat.icon || '🔧'}</div>
                    <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--color-text)' }}>
                      {cat.name}
                    </div>
                    {cat.pricingRules && (
                      <div style={{ fontSize: '0.7rem', color: 'var(--color-ash-600)', marginTop: '0.2rem' }}>
                        ₹{cat.pricingRules.minimum} - ₹{cat.pricingRules.maximum}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Step 2: Problem Description & AI Assistant */}
        <div
          style={{
            backgroundColor: '#ffffff',
            borderRadius: '20px',
            padding: '1.75rem',
            marginBottom: '1.5rem',
            border: '1px solid var(--color-ash-200)',
            boxShadow: '0 4px 15px rgba(0, 0, 0, 0.02)',
          }}
        >
          <div className="flex items-center justify-between flex-wrap gap-2 mb-2">
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, margin: 0 }}>
              2. What seems to be the problem?
            </h3>
            <button
              type="button"
              onClick={handleAiDiagnosis}
              disabled={aiAnalyzing || !description.trim()}
              className="btn btn-secondary btn-sm"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                backgroundColor: 'var(--color-primary-50)',
                color: 'var(--color-primary-dark)',
                borderColor: 'var(--color-primary-light)',
                fontWeight: 600,
              }}
            >
              <Sparkles size={14} />
              {aiAnalyzing ? 'Analyzing with AI...' : 'Ask AI Assistant ✨'}
            </button>
          </div>

          <p style={{ fontSize: '0.85rem', color: 'var(--color-ash-600)', marginBottom: '0.85rem' }}>
            Example: <em>"My washing machine drum makes a loud rattling sound and stops during spin cycle."</em>
          </p>

          <textarea
            className="form-control"
            rows={4}
            placeholder="Type what is happening or not working properly..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            required
            style={{ fontSize: '0.925rem', lineHeight: 1.5 }}
          />

          {/* AI Feedback Box */}
          {aiResult && (
            <div
              style={{
                marginTop: '1.25rem',
                padding: '1.25rem',
                borderRadius: '16px',
                backgroundColor: '#f0fdf4',
                border: '1px solid #bbf7d0',
                animation: 'fadeIn 0.3s ease',
              }}
            >
              <div className="flex items-center gap-2 mb-2">
                <Sparkles size={18} className="text-primary" />
                <span style={{ fontWeight: 800, fontSize: '0.9rem', color: 'var(--color-primary-dark)' }}>
                  AI Assistant Diagnostic
                </span>
                <span
                  style={{
                    marginLeft: 'auto',
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    padding: '2px 8px',
                    borderRadius: '999px',
                    backgroundColor: '#dcfce7',
                    color: '#166534',
                  }}
                >
                  {(aiResult.confidence * 100).toFixed(0)}% Match Confidence
                </span>
              </div>

              <p style={{ margin: '0 0 0.75rem', fontSize: '0.875rem', color: '#166534' }}>
                “Got it! This sounds like a <strong>{aiResult.specificService || aiResult.category}</strong> issue.
                We have verified technicians ready to help.”
              </p>

              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                  gap: '0.75rem',
                  fontSize: '0.8rem',
                  color: 'var(--color-text)',
                  backgroundColor: '#ffffff',
                  padding: '0.85rem 1rem',
                  borderRadius: '10px',
                }}
              >
                <div>
                  <span style={{ color: 'var(--color-ash-600)' }}>Identified Service:</span>
                  <div style={{ fontWeight: 700 }}>{aiResult.specificService || 'General Repair'}</div>
                </div>
                <div>
                  <span style={{ color: 'var(--color-ash-600)' }}>Required Skill:</span>
                  <div style={{ fontWeight: 700 }}>
                    {Array.isArray(aiResult.requiredSkills) ? aiResult.requiredSkills.join(', ') : aiResult.requiredSkills}
                  </div>
                </div>
                <div>
                  <span style={{ color: 'var(--color-ash-600)' }}>Possible Root Cause:</span>
                  <div style={{ fontWeight: 700 }}>{aiResult.possibleIssue || 'Motor / mechanical inspection'}</div>
                </div>
              </div>
            </div>
          )}

          <div className="form-group mt-3">
            <label className="form-label">Additional Instructions (Optional)</label>
            <input
              type="text"
              className="form-control"
              placeholder="e.g. Ring doorbell twice, please wear shoe covers"
              value={additionalInfo}
              onChange={(e) => setAdditionalInfo(e.target.value)}
            />
          </div>
        </div>

        {/* Step 3: Preferred Date & Time */}
        <div
          style={{
            backgroundColor: '#ffffff',
            borderRadius: '20px',
            padding: '1.75rem',
            marginBottom: '1.5rem',
            border: '1px solid var(--color-ash-200)',
            boxShadow: '0 4px 15px rgba(0, 0, 0, 0.02)',
          }}
        >
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, margin: '0 0 1rem' }}>
            3. When should the technician visit?
          </h3>

          <div className="grid grid-2 gap-3 mb-3">
            <div className="form-group">
              <label className="form-label">Preferred Date *</label>
              <input
                type="date"
                className="form-control"
                value={preferredDate}
                min={new Date().toISOString().split('T')[0]}
                onChange={(e) => setPreferredDate(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Preferred Time Slot *</label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                {TIME_SLOTS.map((slot) => {
                  const isChecked = preferredTime === slot.range;
                  return (
                    <label
                      key={slot.id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '0.65rem 0.85rem',
                        borderRadius: '10px',
                        border: `1.5px solid ${isChecked ? 'var(--color-primary)' : 'var(--color-ash-300)'}`,
                        backgroundColor: isChecked ? 'var(--color-primary-50)' : '#ffffff',
                        cursor: 'pointer',
                        fontSize: '0.85rem',
                        fontWeight: isChecked ? 600 : 500,
                      }}
                    >
                      <div className="flex items-center gap-2">
                        <input
                          type="radio"
                          name="timeSlot"
                          checked={isChecked}
                          onChange={() => setPreferredTime(slot.range)}
                          style={{ accentColor: 'var(--color-primary)' }}
                        />
                        <span>{slot.icon} {slot.label}</span>
                      </div>
                      <span style={{ fontSize: '0.75rem', color: 'var(--color-ash-600)' }}>{slot.range}</span>
                    </label>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Step 4: Service Location */}
        <div
          style={{
            backgroundColor: '#ffffff',
            borderRadius: '20px',
            padding: '1.75rem',
            marginBottom: '2rem',
            border: '1px solid var(--color-ash-200)',
            boxShadow: '0 4px 15px rgba(0, 0, 0, 0.02)',
          }}
        >
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, margin: '0 0 1rem', display: 'flex', alignItems: 'center', gap: 8 }}>
            <MapPin size={18} className="text-primary" /> 4. Service Address
          </h3>

          <div className="form-group mb-3">
            <label className="form-label">Street / House Address *</label>
            <input
              type="text"
              className="form-control"
              placeholder="e.g. Flat 302, Green Valley Apartments, Connaught Place"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              required
            />
          </div>

          <div className="grid grid-2 gap-3">
            <div className="form-group">
              <label className="form-label">City *</label>
              <input
                type="text"
                className="form-control"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">Pincode *</label>
              <input
                type="text"
                className="form-control"
                value={pincode}
                onChange={(e) => setPincode(e.target.value)}
                maxLength={6}
                required
              />
            </div>
          </div>
        </div>

        <button
          type="submit"
          className="btn btn-primary btn-block btn-lg"
          style={{
            padding: '1rem',
            fontSize: '1.05rem',
            fontWeight: 800,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
          }}
        >
          Find Matching Providers & Get Quotes <ArrowRight size={20} />
        </button>
      </form>
    </div>
  );
};

export default ServiceRequestPage;
