import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { categoryApi } from '../../api';
import Modal from '../../components/ui/Modal';
import {
  Package, Plus, Edit, Trash2, IndianRupee, Wrench,
  CheckCircle2, XCircle, Sliders
} from 'lucide-react';
import toast from 'react-hot-toast';

const AdminCategoryManagement = () => {
  const queryClient = useQueryClient();
  const [editingCategory, setEditingCategory] = useState(null);
  const [isCreating, setIsCreating] = useState(false);

  // Form states
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [icon, setIcon] = useState('🔧');
  const [minPrice, setMinPrice] = useState(500);
  const [maxPrice, setMaxPrice] = useState(4000);
  const [skillsStr, setSkillsStr] = useState('Technician, Repair Specialist');

  const { data, isLoading } = useQuery({
    queryKey: ['admin-categories'],
    queryFn: () => categoryApi.getAll(),
  });

  const categories = data?.data?.data?.categories || [];

  const createMutation = useMutation({
    mutationFn: (data) => categoryApi.create(data),
    onSuccess: () => {
      toast.success('Category created successfully!');
      setIsCreating(false);
      queryClient.invalidateQueries(['admin-categories']);
      queryClient.invalidateQueries(['public-categories']);
      queryClient.invalidateQueries(['service-categories']);
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Failed to create category');
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => categoryApi.update(id, data),
    onSuccess: () => {
      toast.success('Category & pricing rules updated!');
      setEditingCategory(null);
      queryClient.invalidateQueries(['admin-categories']);
      queryClient.invalidateQueries(['public-categories']);
      queryClient.invalidateQueries(['service-categories']);
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Failed to update category');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => categoryApi.delete(id),
    onSuccess: () => {
      toast.success('Category deleted.');
      queryClient.invalidateQueries(['admin-categories']);
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Cannot delete category with active bookings.');
    },
  });

  const handleOpenEdit = (cat) => {
    setEditingCategory(cat);
    setName(cat.name);
    setDescription(cat.description || '');
    setIcon(cat.icon || '🔧');
    setMinPrice(cat.pricingRules?.minimum || 500);
    setMaxPrice(cat.pricingRules?.maximum || 5000);
    setSkillsStr(cat.requiredSkills ? cat.requiredSkills.join(', ') : '');
  };

  const handleOpenCreate = () => {
    setIsCreating(true);
    setName('');
    setDescription('');
    setIcon('🔧');
    setMinPrice(500);
    setMaxPrice(4000);
    setSkillsStr('Technician, Repair Specialist');
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (minPrice >= maxPrice) {
      toast.error('Minimum price must be less than maximum price');
      return;
    }

    const payload = {
      name,
      description,
      icon,
      requiredSkills: skillsStr.split(',').map((s) => s.trim()).filter(Boolean),
      pricingRules: {
        minimum: Number(minPrice),
        maximum: Number(maxPrice),
        unit: 'per_job',
      },
    };

    if (isCreating) {
      createMutation.mutate(payload);
    } else if (editingCategory) {
      updateMutation.mutate({ id: editingCategory._id, data: payload });
    }
  };

  return (
    <div style={{ maxWidth: 1050, margin: '0 auto', paddingBottom: '3rem' }}>
      <div className="flex justify-between items-center mb-4 flex-wrap gap-2">
        <div>
          <h1 style={{ fontSize: '1.85rem', fontWeight: 800, margin: 0, fontFamily: 'Outfit, sans-serif' }}>
            Service Categories & Pricing Rules 📦
          </h1>
          <p style={{ color: 'var(--color-ash-600)', margin: '0.2rem 0 0', fontSize: '0.9rem' }}>
            Manage catalog offerings and configure dynamic price controls stored in MongoDB.
          </p>
        </div>

        <button onClick={handleOpenCreate} className="btn btn-primary flex items-center gap-1 font-bold">
          <Plus size={18} /> Add New Category
        </button>
      </div>

      {isLoading ? (
        <div className="text-center py-12">
          <div className="spinner" style={{ margin: '0 auto' }} />
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.25rem' }}>
          {categories.map((cat) => (
            <div
              key={cat._id}
              style={{
                backgroundColor: '#ffffff',
                borderRadius: '18px',
                padding: '1.5rem',
                border: '1px solid var(--color-ash-200)',
                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.02)',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
              }}
            >
              <div>
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span style={{ fontSize: '2rem' }}>{cat.icon}</span>
                    <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800 }}>{cat.name}</h3>
                  </div>
                  <span
                    style={{
                      fontSize: '0.725rem',
                      fontWeight: 700,
                      padding: '2px 8px',
                      borderRadius: '999px',
                      backgroundColor: cat.isActive !== false ? '#dcfce7' : '#fee2e2',
                      color: cat.isActive !== false ? '#166534' : '#991b1b',
                    }}
                  >
                    {cat.isActive !== false ? 'Active' : 'Disabled'}
                  </span>
                </div>

                <p style={{ fontSize: '0.85rem', color: 'var(--color-ash-600)', lineHeight: 1.45, margin: '0 0 1rem' }}>
                  {cat.description}
                </p>

                {/* Configured Pricing Rule Box (Section 28) */}
                <div
                  style={{
                    backgroundColor: 'var(--color-bg)',
                    borderRadius: '12px',
                    padding: '0.75rem 1rem',
                    marginBottom: '1rem',
                    border: '1px solid var(--color-ash-200)',
                  }}
                >
                  <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-ash-500)', textTransform: 'uppercase', marginBottom: 2 }}>
                    Configured Pricing Bounds
                  </div>
                  <div className="flex justify-between items-center">
                    <span style={{ fontWeight: 800, fontSize: '1.05rem', color: 'var(--color-primary-dark)' }}>
                      ₹{cat.pricingRules?.minimum || 300} - ₹{cat.pricingRules?.maximum || 5000}
                    </span>
                    <span style={{ fontSize: '0.75rem', color: 'var(--color-ash-500)' }}>
                      {cat.pricingRules?.unit || 'per job'}
                    </span>
                  </div>
                </div>

                {/* Required Skills */}
                <div style={{ fontSize: '0.8rem', color: 'var(--color-ash-600)', marginBottom: '1rem' }}>
                  <strong>Required Skills:</strong> {cat.requiredSkills?.join(', ') || 'Technician'}
                </div>
              </div>

              {/* Actions */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'flex-end',
                  gap: '0.5rem',
                  paddingTop: '0.85rem',
                  borderTop: '1px solid var(--color-ash-100)',
                }}
              >
                <button
                  onClick={() => handleOpenEdit(cat)}
                  className="btn btn-secondary btn-sm flex items-center gap-1"
                >
                  <Edit size={14} /> Edit & Pricing
                </button>
                <button
                  onClick={() => {
                    if (window.confirm(`Delete category "${cat.name}"?`)) {
                      deleteMutation.mutate(cat._id);
                    }
                  }}
                  className="btn btn-sm"
                  style={{
                    backgroundColor: 'transparent',
                    border: '1px solid #fecaca',
                    color: '#dc2626',
                  }}
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Edit / Create Category Modal */}
      {(isCreating || editingCategory) && (
        <Modal
          isOpen={Boolean(isCreating || editingCategory)}
          onClose={() => {
            setIsCreating(false);
            setEditingCategory(null);
          }}
          title={isCreating ? 'Add Service Category' : `Edit Category: ${editingCategory?.name}`}
          subtitle="Configure description, skills matching, and price boundaries"
        >
          <form onSubmit={handleSubmit}>
            <div className="grid grid-2 gap-3 mb-3">
              <div className="form-group">
                <label className="form-label">Category Name *</label>
                <input
                  type="text"
                  className="form-control"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Microwave Oven Repair"
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">Category Emoji / Icon *</label>
                <input
                  type="text"
                  className="form-control"
                  value={icon}
                  onChange={(e) => setIcon(e.target.value)}
                  placeholder="e.g. ⚡, 🚰, 🧺, ❄️, 🧹"
                  required
                />
              </div>
            </div>

            <div className="form-group mb-3">
              <label className="form-label">Short Description</label>
              <textarea
                className="form-control"
                rows={2}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Explain the services offered in this category..."
              />
            </div>

            <div className="form-group mb-3">
              <label className="form-label">Required Skills (Comma separated)</label>
              <input
                type="text"
                className="form-control"
                value={skillsStr}
                onChange={(e) => setSkillsStr(e.target.value)}
                placeholder="e.g. Appliance Technician, Certified Electrician"
              />
            </div>

            <h4 style={{ fontSize: '0.95rem', fontWeight: 700, margin: '1rem 0 0.5rem' }}>
              Pricing Rule Configuration (INR ₹)
            </h4>

            <div className="grid grid-2 gap-3 mb-4">
              <div className="form-group">
                <label className="form-label">Minimum Price (₹) *</label>
                <input
                  type="number"
                  className="form-control"
                  value={minPrice}
                  onChange={(e) => setMinPrice(e.target.value)}
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">Maximum Price (₹) *</label>
                <input
                  type="number"
                  className="form-control"
                  value={maxPrice}
                  onChange={(e) => setMaxPrice(e.target.value)}
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              className="btn btn-primary btn-block"
              disabled={createMutation.isPending || updateMutation.isPending}
              style={{ fontWeight: 700 }}
            >
              {createMutation.isPending || updateMutation.isPending ? 'Saving...' : 'Save Category & Pricing'}
            </button>
          </form>
        </Modal>
      )}
    </div>
  );
};

export default AdminCategoryManagement;
