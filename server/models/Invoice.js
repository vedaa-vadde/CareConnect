const mongoose = require('mongoose');

const invoiceSchema = new mongoose.Schema(
  {
    bookingId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Booking',
      required: true,
      unique: true,
    },
    invoiceNumber: {
      type: String,
      unique: true,
    },
    customerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    providerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    items: [
      {
        description: { type: String, required: true },
        quantity: { type: Number, default: 1 },
        unitPrice: { type: Number, required: true },
        total: { type: Number, required: true },
      },
    ],
    subtotal: { type: Number, required: true },
    discount: { type: Number, default: 0 },
    taxes: [
      {
        name: String,
        rate: Number, // percentage
        amount: Number,
      },
    ],
    totalTax: { type: Number, default: 0 },
    total: { type: Number, required: true },
    currency: { type: String, default: 'INR' },
    status: {
      type: String,
      enum: ['draft', 'generated', 'paid', 'refunded', 'cancelled'],
      default: 'generated',
    },
    paymentMethod: String,
    paymentReference: String,
    paidAt: Date,
    notes: String,
    generatedAt: {
      type: Date,
      default: Date.now,
    },
    dueDate: Date,
  },
  {
    timestamps: true,
  }
);

// Auto-generate invoice number
invoiceSchema.pre('save', async function () {
  if (this.isNew && !this.invoiceNumber) {
    const count = await mongoose.model('Invoice').countDocuments();
    this.invoiceNumber = `CC-INV-${new Date().getFullYear()}-${String(count + 1).padStart(5, '0')}`;
  }
});

module.exports = mongoose.model('Invoice', invoiceSchema);
