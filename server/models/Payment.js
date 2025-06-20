// server/models/Payment.js
const mongoose = require('mongoose');

const PaymentMethodSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  type: {
    type: String,
    enum: ['credit_card', 'debit_card', 'paypal', 'upi', 'green_wallet', 'eco_credits'],
    required: true
  },
  cardNumber: {
    type: String,
    // Only store last 4 digits for security
    validate: {
      validator: function(v) {
        return this.type.includes('card') ? v && v.length === 4 : true;
      },
      message: 'Card number should be last 4 digits only'
    }
  },
  cardHolderName: {
    type: String,
    required: function() {
      return this.type.includes('card');
    }
  },
  expiryMonth: {
    type: Number,
    min: 1,
    max: 12,
    required: function() {
      return this.type.includes('card');
    }
  },
  expiryYear: {
    type: Number,
    required: function() {
      return this.type.includes('card');
    }
  },
  email: {
    type: String,
    required: function() {
      return this.type === 'paypal';
    }
  },
  upiId: {
    type: String,
    required: function() {
      return this.type === 'upi';
    }
  },
  greenWalletBalance: {
    type: Number,
    default: 0,
    required: function() {
      return this.type === 'green_wallet';
    }
  },
  ecoCredits: {
    type: Number,
    default: 0,
    required: function() {
      return this.type === 'eco_credits';
    }
  },
  isDefault: {
    type: Boolean,
    default: false
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Ensure only one default payment method per user
PaymentMethodSchema.pre('save', async function(next) {
  if (this.isDefault) {
    await this.constructor.updateMany(
      { user: this.user, _id: { $ne: this._id } },
      { isDefault: false }
    );
  }
  next();
});

const TransactionSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  ride: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Ride',
    required: true
  },
  paymentMethod: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'PaymentMethod',
    required: true
  },
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  type: {
    type: String,
    enum: ['ride_payment', 'green_reward', 'eco_bonus', 'carbon_offset'],
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'completed', 'failed', 'refunded'],
    default: 'pending'
  },
  description: {
    type: String,
    required: true
  },
  carbonOffsetKg: {
    type: Number,
    default: 0
  },
  greenPointsEarned: {
    type: Number,
    default: 0
  },
  transactionId: {
    type: String,
    unique: true,
    required: true
  }
}, {
  timestamps: true
});

// Generate unique transaction ID
TransactionSchema.pre('save', function(next) {
  if (!this.transactionId) {
    this.transactionId = 'GC' + Date.now() + Math.random().toString(36).substr(2, 9).toUpperCase();
  }
  next();
});

const PaymentMethod = mongoose.model('PaymentMethod', PaymentMethodSchema);
const Transaction = mongoose.model('Transaction', TransactionSchema);

module.exports = { PaymentMethod, Transaction };
