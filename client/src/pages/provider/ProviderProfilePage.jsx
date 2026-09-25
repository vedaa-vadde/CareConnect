import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { providerApi } from '../../api';
import { useAuth } from '../../contexts/AuthContext';
import {
  User, ShieldCheck, Briefcase, MapPin, Award, Plus, X,
  Save, Building, CheckCircle2
} from 'lucide-react';
import toast from 'react-hot-toast';

const ProviderProfilePage = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: profileData, isLoading } = useQuery({
    queryKey: ['provider-me-profile'],
    queryFn: () => providerApi.getMe(),
  });

  const profile = profileData?.data?.data?.profile;

  const [bio, setBio] = useState('');
  const [experienceYears, setExperienceYears] = useState(5);
  const [skills, setSkills] = useState([]);
  const [skillInput, setSkillInput] = useState('');

  // Bank details
  const [accountNumber, setAccountNumber] = useState('');
  const [ifsc, setIfsc] = useState('');
  const [bankName, setBankName] = useState('');

  // Sync state once fetched
  React.useEffect(() => {
    if (profile) {
      setBio(profile.bio || '');
      setExperienceYears(profile.experience?.years || 5);
      setSkills(profile.skills?.map((s) => (typeof s === 'string' ? s : s.name)) || []);
      if (profile.bankDetails) {
        setAccountNumber(profile.bankDetails.accountNumber || '');
        setIfsc(profile.bankDetails.ifsc || '');
        setBankName(profile.bankDetails.bankName || '');
      }
    }
  }, [profile]);

  const updateMutation = useMutation({
    mutationFn: (data) => providerApi.updateProfile(data),
    onSuccess: () => {
      toast.success('Technician profile updated successfully!');
      queryClient.invalidateQueries(['provider-me-profile']);
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Failed to update profile');
    },
  });

  const handleAddSkill = () => {
    if (skillInput.trim() && !skills.includes(skillInput.trim())) {
      setSkills([...skills, skillInput.trim()]);
      setSkillInput('');
    }
  };

  const handleRemoveSkill = (skill) => {
    setSkills(skills.filter((s) => s !== skill));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    updateMutation.mutate({
      bio,
      experience: { years: Number(experienceYears), description: `${experienceYears} years in home service` },
      skills: skills.map((name) => ({ name, yearsOfExperience: Number(experienceYears) })),
      bankDetails: {
        accountNumber,
        ifsc,
        bankName,
      },
    });
  };

  if (isLoading) {
    return (
      <div className="text-center py-12">
        <div className="spinner" style={{ margin: '0 auto' }} />
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 850, margin: '0 auto', paddingBottom: '3rem' }}>
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '1.85rem', fontWeight: 800, margin: 0, fontFamily: 'Outfit, sans-serif' }}>
          Technician Profile & Verification 🛠️
        </h1>
        <p style={{ color: 'var(--color-ash-600)', margin: '0.2rem 0 0', fontSize: '0.9rem' }}>
          Manage your trade qualifications, skills, and direct settlement bank account.
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
        {/* Verification Status Header */}
        <div className="flex items-center justify-between pb-4 mb-4 border-b border-ash-200 flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <div
              style={{
                width: 60,
                height: 60,
                borderRadius: '50%',
                backgroundColor: 'var(--color-primary-100)',
                color: 'var(--color-primary-dark)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 800,
                fontSize: '1.35rem',
              }}
            >
              {user?.name?.slice(0, 2).toUpperCase() || 'TP'}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0 }}>{user?.name}</h2>
                <ShieldCheck size={18} color="#166534" fill="#dcfce7" />
              </div>
              <div style={{ fontSize: '0.85rem', color: 'var(--color-ash-600)' }}>
                {profile?.rating?.count > 0 ? (
                  `⭐ ${Number(profile.rating.average).toFixed(1)} Rating • ${profile?.totalCompletedJobs || 0} Jobs Completed`
                ) : (
                  `⭐ New Technician (No reviews yet) • ${profile?.totalCompletedJobs || 0} Jobs Completed`
                )}
              </div>
            </div>
          </div>

          <span
            style={{
              padding: '0.35rem 0.85rem',
              borderRadius: '999px',
              backgroundColor: '#dcfce7',
              color: '#166534',
              fontSize: '0.8rem',
              fontWeight: 700,
            }}
          >
            ✓ Approved & Active Partner
          </span>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group mb-3">
            <label className="form-label">Professional Bio / Introduction</label>
            <textarea
              className="form-control"
              rows={3}
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Tell customers about your experience and quality guarantee..."
            />
          </div>

          <div className="form-group mb-3">
            <label className="form-label">Total Years in Industry</label>
            <input
              type="number"
              className="form-control"
              value={experienceYears}
              onChange={(e) => setExperienceYears(e.target.value)}
              min={1}
              max={40}
            />
          </div>

          {/* Skills Builder */}
          <div className="form-group mb-4">
            <label className="form-label">Trade Skills & Certifications</label>
            <div className="flex gap-2 mb-2">
              <input
                type="text"
                className="form-control"
                placeholder="Add special skill (e.g. PCB Repair, Compressor Replacement)"
                value={skillInput}
                onChange={(e) => setSkillInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddSkill();
                  }
                }}
              />
              <button type="button" onClick={handleAddSkill} className="btn btn-secondary">
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
                    backgroundColor: 'var(--color-primary-50)',
                    color: 'var(--color-primary-dark)',
                    fontSize: '0.8rem',
                    fontWeight: 700,
                  }}
                >
                  {skill}
                  <button
                    type="button"
                    onClick={() => handleRemoveSkill(skill)}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                  >
                    <X size={14} />
                  </button>
                </span>
              ))}
            </div>
          </div>

          {/* Bank Details Section */}
          <h3 style={{ fontSize: '1.05rem', fontWeight: 700, margin: '1.5rem 0 1rem', display: 'flex', alignItems: 'center', gap: 6 }}>
            <Building size={18} className="text-primary" /> Direct Settlement Bank Account
          </h3>

          <div className="grid grid-3 gap-2 mb-4">
            <div className="form-group">
              <label className="form-label">Bank Name</label>
              <input
                type="text"
                className="form-control"
                placeholder="e.g. HDFC Bank, SBI"
                value={bankName}
                onChange={(e) => setBankName(e.target.value)}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Account Number</label>
              <input
                type="text"
                className="form-control"
                placeholder="Enter A/C Number"
                value={accountNumber}
                onChange={(e) => setAccountNumber(e.target.value)}
              />
            </div>
            <div className="form-group">
              <label className="form-label">IFSC Code</label>
              <input
                type="text"
                className="form-control"
                placeholder="e.g. HDFC0001234"
                value={ifsc}
                onChange={(e) => setIfsc(e.target.value)}
              />
            </div>
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            disabled={updateMutation.isPending}
            style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 700 }}
          >
            <Save size={16} /> {updateMutation.isPending ? 'Saving...' : 'Save Profile Changes'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ProviderProfilePage;
