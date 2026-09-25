import React, { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { quoteApi, serviceRequestApi, aiApi } from '../../api';
import {
  Sparkles, Star, Award, ShieldCheck, CheckCircle2, Clock,
  ArrowRight, ChevronLeft, Calendar, MapPin, IndianRupee, Layers, Check
} from 'lucide-react';
import StarRating from '../../components/ui/StarRating';
import Modal from '../../components/ui/Modal';
import toast from 'react-hot-toast';

const QuoteComparisonPage = () => {
  const { id: requestId } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [compareList, setCompareList] = useState([]);
  const [showCompareModal, setShowCompareModal] = useState(false);

  // Fetch service request details
  const { data: reqData, isLoading: reqLoading } = useQuery({
    queryKey: ['service-request', requestId],
    queryFn: () => serviceRequestApi.getById(requestId),
  });

  // Fetch quotes for this request
  const { data: quotesData, isLoading: quotesLoading } = useQuery({
    queryKey: ['quotes-for-request', requestId],
    queryFn: () => quoteApi.getForRequest(requestId),
    refetchInterval: 10000, // Poll every 10s for new provider quotes
  });

  // Fetch AI recommended providers if quotes are few or none
  const { data: matchData } = useQuery({
    queryKey: ['ai-matched-providers', requestId],
    queryFn: () => aiApi.matchProviders(requestId),
    enabled: Boolean(requestId),
  });

  const request = reqData?.data?.data?.serviceRequest || reqData?.data?.data?.request;
  const quotes = quotesData?.data?.data?.quotes || [];
  const matchedProviders = matchData?.data?.data?.providers || [];

  // Toggle compare selection
  const handleToggleCompare = (quote) => {
    if (compareList.find((q) => q._id === quote._id)) {
      setCompareList(compareList.filter((q) => q._id !== quote._id));
    } else {
      if (compareList.length >= 2) {
        toast('Comparing top 2 selected providers', { icon: 'ℹ️' });
        setCompareList([compareList[1], quote]);
      } else {
        setCompareList([...compareList, quote]);
      }
    }
  };

  // Helper to create instant quote from top provider if waiting
  const handleInstantQuoteFromMatched = async (providerMatch) => {
    try {
      await quoteApi.generateInstant({
        serviceRequestId: requestId,
        providerId: providerMatch.providerId,
      });

      toast.success(`Quote generated from ${providerMatch.providerName || 'Technician'}!`);
      queryClient.invalidateQueries(['quotes-for-request', requestId]);
      queryClient.invalidateQueries(['service-request', requestId]);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not generate quote.');
    }
  };

  if (reqLoading) {
    return (
      <div className="text-center py-12">
        <div className="spinner" style={{ margin: '0 auto' }} />
        <p className="mt-3 text-ash-500">Loading service details and quotes...</p>
      </div>
    );
  }

  if (!request) {
    return (
      <div style={{ maxWidth: 600, margin: '3rem auto', textAlign: 'center' }}>
        <h2>Service Request Not Found</h2>
        <Link to="/customer/dashboard" className="btn btn-primary mt-3">
          Back to Dashboard
        </Link>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 1050, margin: '0 auto', paddingBottom: '3rem' }}>
      {/* Top Header */}
      <div style={{ marginBottom: '1.5rem' }}>
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
            marginBottom: '0.5rem',
          }}
        >
          <ChevronLeft size={16} /> Back to Dashboard
        </button>
        <div className="flex justify-between items-center flex-wrap gap-2">
          <div>
            <h1 style={{ fontSize: '1.75rem', fontWeight: 800, margin: 0, fontFamily: 'Outfit, sans-serif' }}>
              Compare Quotes & Select Provider 🔍
            </h1>
            <p style={{ color: 'var(--color-ash-600)', margin: '0.2rem 0 0', fontSize: '0.9rem' }}>
              Review transparent pricing, experience, and verified ratings from qualified experts.
            </p>
          </div>

          {compareList.length > 0 && (
            <button
              onClick={() => setShowCompareModal(true)}
              className="btn btn-secondary"
              style={{ display: 'flex', alignItems: 'center', gap: 6 }}
            >
              <Layers size={16} /> Compare Selected ({compareList.length})
            </button>
          )}
        </div>
      </div>

      {/* Service Request Summary Card */}
      <div
        style={{
          backgroundColor: '#ffffff',
          borderRadius: '18px',
          padding: '1.25rem 1.5rem',
          marginBottom: '2rem',
          border: '1px solid var(--color-ash-200)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1rem',
        }}
      >
        <div className="flex items-center gap-3">
          <div
            style={{
              width: 48,
              height: 48,
              borderRadius: '12px',
              backgroundColor: 'var(--color-primary-50)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1.5rem',
            }}
          >
            {request.category?.icon || '🔧'}
          </div>
          <div>
            <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700 }}>
              {request.category?.name || 'Home Service'}
            </h3>
            <p style={{ margin: '0.2rem 0 0', fontSize: '0.85rem', color: 'var(--color-ash-600)' }}>
              “{request.problemDescription}”
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4 text-ash-700" style={{ fontSize: '0.825rem' }}>
          <div className="flex items-center gap-1">
            <Calendar size={15} className="text-primary" />
            <span>{new Date(request.preferredDate).toLocaleDateString()}</span>
          </div>
          <div className="flex items-center gap-1">
            <Clock size={15} className="text-primary" />
            <span>{request.preferredTime}</span>
          </div>
          <div className="flex items-center gap-1">
            <MapPin size={15} className="text-primary" />
            <span>{request.location?.city}</span>
          </div>
        </div>
      </div>

      {/* Quotes Grid */}
      <div style={{ marginBottom: '2.5rem' }}>
        <div className="flex items-center justify-between mb-3">
          <h2 style={{ fontSize: '1.2rem', fontWeight: 800, margin: 0 }}>
            Received Quotes ({quotes.length})
          </h2>
          <span style={{ fontSize: '0.825rem', color: 'var(--color-ash-500)' }}>
            Ranked by AI match & best value
          </span>
        </div>

        {quotesLoading ? (
          <div className="text-center py-8">
            <div className="spinner" style={{ margin: '0 auto' }} />
          </div>
        ) : quotes.length === 0 ? (
          <div
            style={{
              backgroundColor: '#ffffff',
              borderRadius: '20px',
              padding: '2.5rem 1.5rem',
              textAlign: 'center',
              border: '1px dashed var(--color-ash-300)',
              marginBottom: '2rem',
            }}
          >
            <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>⏳</div>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 700, margin: '0 0 0.5rem' }}>
              Waiting for Technicians to Submit Quotes...
            </h3>
            <p style={{ color: 'var(--color-ash-600)', fontSize: '0.875rem', maxWidth: 450, margin: '0 auto 1.5rem' }}>
              Your request was broadcasted to certified specialists in {request.location?.city || 'your area'}.
              Below are top matched providers who specialize in this repair.
            </p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.25rem' }}>
            {quotes.map((quote) => {
              const provider = quote.providerId || {};
              const profile = quote.providerProfile || {};
              const isComparing = compareList.some((q) => q._id === quote._id);

              return (
                <div
                  key={quote._id}
                  style={{
                    backgroundColor: '#ffffff',
                    borderRadius: '20px',
                    border: `2px solid ${isComparing ? 'var(--color-primary)' : 'var(--color-ash-200)'}`,
                    boxShadow: '0 4px 15px rgba(0, 0, 0, 0.04)',
                    overflow: 'hidden',
                    display: 'flex',
                    flexDirection: 'column',
                    transition: 'all 0.2s ease',
                  }}
                >
                  {/* Top Quote Header */}
                  <div style={{ padding: '1.25rem', borderBottom: '1px solid var(--color-ash-100)' }}>
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="flex items-center gap-3">
                        <div
                          style={{
                            width: 50,
                            height: 50,
                            borderRadius: '50%',
                            backgroundColor: 'var(--color-primary-100)',
                            color: 'var(--color-primary-dark)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontWeight: 800,
                            fontSize: '1.15rem',
                          }}
                        >
                          {provider.name?.slice(0, 2).toUpperCase() || 'CC'}
                        </div>
                        <div>
                          <div className="flex items-center gap-1">
                            <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: 700 }}>
                              {provider.name}
                            </h4>
                            <span title="Verified Technician">
                              <ShieldCheck size={16} color="#166534" fill="#dcfce7" />
                            </span>
                          </div>
                          <div className="flex items-center gap-1 mt-1">
                            {profile.rating?.count > 0 ? (
                              <>
                                <StarRating rating={profile.rating.average} size={14} showValue />
                                <span style={{ fontSize: '0.75rem', color: 'var(--color-ash-500)' }}>
                                  ({profile.totalCompletedJobs || 0} jobs)
                                </span>
                              </>
                            ) : (
                              <span
                                style={{
                                  fontSize: '0.72rem',
                                  fontWeight: 600,
                                  color: '#0369a1',
                                  backgroundColor: '#e0f2fe',
                                  padding: '2px 8px',
                                  borderRadius: '999px',
                                }}
                              >
                                ⭐ New Provider (0 reviews)
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Quoted Price */}
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--color-primary-dark)' }}>
                          ₹{quote.amount}
                        </div>
                        <span style={{ fontSize: '0.7rem', color: 'var(--color-ash-500)' }}>
                          Est. {quote.estimatedDuration?.value || 2} {quote.estimatedDuration?.unit || 'hrs'}
                        </span>
                      </div>
                    </div>

                    {/* Experience & Bio */}
                    <div style={{ fontSize: '0.8rem', color: 'var(--color-ash-600)', margin: '0.5rem 0' }}>
                      <strong>{profile.experience?.years ? `${profile.experience.years} yrs experience` : 'Verified Provider'}</strong>
                      {profile.bio ? ` • ${profile.bio}` : ''}
                    </div>

                    {/* AI Match Reasons */}
                    {quote.aiMatchReasons && quote.aiMatchReasons.length > 0 && (
                      <div
                        style={{
                          backgroundColor: '#f0fdf4',
                          borderRadius: '10px',
                          padding: '0.5rem 0.75rem',
                          marginTop: '0.5rem',
                          fontSize: '0.75rem',
                          color: '#166534',
                        }}
                      >
                        <div style={{ fontWeight: 700, marginBottom: '2px', display: 'flex', alignItems: 'center', gap: 4 }}>
                          <Sparkles size={12} /> Recommended because:
                        </div>
                        {quote.aiMatchReasons.map((r, idx) => (
                          <div key={idx} style={{ lineHeight: 1.35 }}>{r}</div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Provider Message */}
                  {quote.message && (
                    <div style={{ padding: '0.85rem 1.25rem', backgroundColor: 'var(--color-bg)', fontSize: '0.8rem', color: 'var(--color-ash-700)' }}>
                      💬 <em>“{quote.message}”</em>
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div
                    style={{
                      padding: '1rem 1.25rem',
                      marginTop: 'auto',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                    }}
                  >
                    <button
                      type="button"
                      onClick={() => handleToggleCompare(quote)}
                      className="btn btn-secondary btn-sm"
                      style={{
                        flex: 1,
                        fontSize: '0.8rem',
                        backgroundColor: isComparing ? 'var(--color-primary-50)' : undefined,
                        borderColor: isComparing ? 'var(--color-primary)' : undefined,
                      }}
                    >
                      {isComparing ? '✓ Selected' : 'Compare'}
                    </button>

                    <button
                      type="button"
                      onClick={() => navigate(`/customer/book/${quote._id}`, { state: { quote, request } })}
                      className="btn btn-primary btn-sm"
                      style={{ flex: 1.5, fontSize: '0.85rem', fontWeight: 700 }}
                    >
                      Book Provider →
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* AI Matched Providers Section (Section 8 recommendation engine) */}
      {matchedProviders.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Sparkles size={20} className="text-primary" />
            <h2 style={{ fontSize: '1.2rem', fontWeight: 800, margin: 0 }}>
              AI Ranked Qualified Providers in {request.location?.city}
            </h2>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(310px, 1fr))', gap: '1rem' }}>
            {matchedProviders.map((mp, i) => {
              const u = mp.user || {};
              const p = mp.profile || {};

              return (
                <div
                  key={i}
                  style={{
                    backgroundColor: '#ffffff',
                    borderRadius: '16px',
                    padding: '1.25rem',
                    border: '1px solid var(--color-ash-200)',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                  }}
                >
                  <div>
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div
                          style={{
                            width: 42,
                            height: 42,
                            borderRadius: '50%',
                            backgroundColor: 'var(--color-primary-50)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontWeight: 700,
                            color: 'var(--color-primary-dark)',
                          }}
                        >
                          {u.name?.slice(0, 2) || 'CC'}
                        </div>
                        <div>
                          <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 700 }}>{u.name}</h4>
                          <span style={{ fontSize: '0.75rem', color: 'var(--color-ash-500)' }}>
                            {p.experience?.years ? `${p.experience.years} yrs exp • ` : ''}
                            {p.totalCompletedJobs > 0 ? `${p.totalCompletedJobs} jobs` : 'New Provider'}
                          </span>
                        </div>
                      </div>
                      {p.rating?.count > 0 ? (
                        <StarRating rating={p.rating.average} size={14} showValue />
                      ) : (
                        <span
                          style={{
                            fontSize: '0.72rem',
                            fontWeight: 600,
                            color: '#0369a1',
                            backgroundColor: '#e0f2fe',
                            padding: '2px 6px',
                            borderRadius: '999px',
                          }}
                        >
                          New (0.0)
                        </span>
                      )}
                    </div>

                    {/* Reasons */}
                    <div
                      style={{
                        backgroundColor: '#f0fdf4',
                        borderRadius: '8px',
                        padding: '0.45rem 0.65rem',
                        fontSize: '0.75rem',
                        color: '#166534',
                        marginBottom: '0.75rem',
                      }}
                    >
                      {mp.reasons?.slice(0, 3).map((r, idx) => (
                        <div key={idx}>{r}</div>
                      ))}
                    </div>
                  </div>

                  <button
                    onClick={() => handleInstantQuoteFromMatched(mp)}
                    className="btn btn-secondary btn-sm"
                    style={{ fontSize: '0.8rem', fontWeight: 600, width: '100%' }}
                  >
                    Request Instant Quote
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Compare Modal */}
      <Modal
        isOpen={showCompareModal}
        onClose={() => setShowCompareModal(false)}
        title="Compare Provider Quotes"
        subtitle="Side-by-side comparison to help you choose the best technician"
        maxWidth="750px"
      >
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
          {compareList.map((q) => {
            const provider = q.providerId || {};
            const profile = q.providerProfile || {};

            return (
              <div
                key={q._id}
                style={{
                  border: '1px solid var(--color-ash-200)',
                  borderRadius: '16px',
                  padding: '1.25rem',
                  backgroundColor: 'var(--color-bg)',
                }}
              >
                <h3 style={{ fontSize: '1.1rem', fontWeight: 800, margin: '0 0 0.5rem' }}>
                  {provider.name}
                </h3>
                <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--color-primary-dark)', marginBottom: '1rem' }}>
                  ₹{q.amount}
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', fontSize: '0.85rem' }}>
                  <div>
                    <strong>Rating:</strong>{' '}
                    {profile.rating?.count > 0
                      ? `⭐ ${Number(profile.rating.average).toFixed(1)} / 5.0 (${profile.rating.count} reviews)`
                      : '⭐ New Provider (No reviews yet)'}
                  </div>
                  <div>
                    <strong>Completed Jobs:</strong>{' '}
                    {profile.totalCompletedJobs > 0 ? `${profile.totalCompletedJobs} jobs` : 'New on CareConnect'}
                  </div>
                  <div>
                    <strong>Experience:</strong>{' '}
                    {profile.experience?.years ? `${profile.experience.years} years` : 'Verified Provider'}
                  </div>
                  <div>
                    <strong>Estimated Duration:</strong> {q.estimatedDuration?.value || 2} hours
                  </div>
                  <div>
                    <strong>Verification:</strong> 100% Background Checked
                  </div>
                </div>

                <button
                  onClick={() => {
                    setShowCompareModal(false);
                    navigate(`/customer/book/${q._id}`, { state: { quote: q, request } });
                  }}
                  className="btn btn-primary btn-block mt-4"
                >
                  Select & Book This Provider
                </button>
              </div>
            );
          })}
        </div>
      </Modal>
    </div>
  );
};

export default QuoteComparisonPage;
