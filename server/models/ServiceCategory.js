const mongoose = require('mongoose');

const serviceCategorySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Category name is required'],
      unique: true,
      trim: true,
    },
    slug: {
      type: String,
      unique: true,
      lowercase: true,
      sparse: true,
    },
    description: {
      type: String,
      required: [true, 'Description is required'],
    },
    image: {
      type: String,
      default: null,
    },
    icon: {
      type: String,
      default: '🔧',
    },
    requiredSkills: [
      {
        type: String,
        trim: true,
      },
    ],
    pricingRules: {
      minimum: { type: Number, default: 0 },
      maximum: { type: Number, default: 0 },
      currency: { type: String, default: 'INR' },
      unit: { type: String, default: 'per_job', enum: ['per_job', 'per_hour', 'per_sqft'] },
      notes: String,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    sortOrder: {
      type: Number,
      default: 0,
    },
    subCategories: [
      {
        name: String,
        description: String,
        requiredSkills: [String],
      },
    ],
  },
  {
    timestamps: true,
  }
);

// Auto-generate slug
serviceCategorySchema.pre('save', function () {
  if (this.isModified('name') || this.isNew) {
    this.slug = this.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  }
});

module.exports = mongoose.model('ServiceCategory', serviceCategorySchema);
