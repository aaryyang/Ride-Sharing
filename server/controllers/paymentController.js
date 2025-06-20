// server/controllers/paymentController.js
const { PaymentMethod, Transaction } = require('../models/Payment');
const Ride = require('../models/Ride');

// Add a new payment method
exports.addPaymentMethod = async (req, res) => {
  try {
    const userId = req.user._id;
    const { type, cardNumber, cardHolderName, expiryMonth, expiryYear, email, upiId, isDefault } = req.body;

    // Validate required fields based on payment type
    const paymentData = {
      user: userId,
      type,
      isDefault: isDefault || false
    };

    switch (type) {
      case 'credit_card':
      case 'debit_card':
        if (!cardNumber || !cardHolderName || !expiryMonth || !expiryYear) {
          return res.status(400).json({ message: 'Card details are required' });
        }
        // Store only last 4 digits for security
        paymentData.cardNumber = cardNumber.slice(-4);
        paymentData.cardHolderName = cardHolderName;
        paymentData.expiryMonth = expiryMonth;
        paymentData.expiryYear = expiryYear;
        break;
      
      case 'paypal':
        if (!email) {
          return res.status(400).json({ message: 'PayPal email is required' });
        }
        paymentData.email = email;
        break;
      
      case 'upi':
        if (!upiId) {
          return res.status(400).json({ message: 'UPI ID is required' });
        }
        paymentData.upiId = upiId;
        break;
      
      case 'green_wallet':
        paymentData.greenWalletBalance = 100; // Starting bonus
        break;
      
      case 'eco_credits':
        paymentData.ecoCredits = 50; // Starting eco credits
        break;
      
      default:
        return res.status(400).json({ message: 'Invalid payment method type' });
    }

    const paymentMethod = await PaymentMethod.create(paymentData);
    
    // If this is the first payment method, make it default
    const userPaymentMethods = await PaymentMethod.countDocuments({ user: userId, isActive: true });
    if (userPaymentMethods === 1) {
      paymentMethod.isDefault = true;
      await paymentMethod.save();
    }

    res.status(201).json({
      success: true,
      message: 'Payment method added successfully',
      paymentMethod: {
        _id: paymentMethod._id,
        type: paymentMethod.type,
        cardNumber: paymentMethod.cardNumber,
        cardHolderName: paymentMethod.cardHolderName,
        email: paymentMethod.email,
        upiId: paymentMethod.upiId,
        isDefault: paymentMethod.isDefault
      }
    });
  } catch (error) {
    console.error('Error adding payment method:', error);
    res.status(500).json({ message: 'Failed to add payment method', error: error.message });
  }
};

// Get user's payment methods
exports.getPaymentMethods = async (req, res) => {
  try {
    const userId = req.user._id;
    
    const paymentMethods = await PaymentMethod.find({ 
      user: userId, 
      isActive: true 
    }).select('-__v').sort({ isDefault: -1, createdAt: -1 });

    res.status(200).json({
      success: true,
      paymentMethods
    });
  } catch (error) {
    console.error('Error fetching payment methods:', error);
    res.status(500).json({ message: 'Failed to fetch payment methods', error: error.message });
  }
};

// Process ride payment
exports.processRidePayment = async (req, res) => {
  try {
    const userId = req.user._id;
    const { rideId, paymentMethodId, amount } = req.body;

    if (!rideId || !paymentMethodId || !amount) {
      return res.status(400).json({ message: 'Missing required payment details' });
    }

    // Verify the ride exists and user is part of it
    const ride = await Ride.findById(rideId);
    if (!ride) {
      return res.status(404).json({ message: 'Ride not found' });
    }

    // Check if user is driver or passenger
    const isDriver = ride.driver.toString() === userId.toString();
    const isPassenger = ride.passengers.includes(userId);
    
    if (!isDriver && !isPassenger) {
      return res.status(403).json({ message: 'You are not part of this ride' });
    }

    // Verify payment method belongs to user
    const paymentMethod = await PaymentMethod.findOne({
      _id: paymentMethodId,
      user: userId,
      isActive: true
    });

    if (!paymentMethod) {
      return res.status(404).json({ message: 'Payment method not found' });
    }

    // Calculate eco benefits
    const distanceKm = ride.distanceKm || 10; // Default distance if not set
    const carbonOffsetKg = distanceKm * 0.121; // CO2 saved per km
    const greenPointsEarned = Math.round(carbonOffsetKg * 10);

    // Create transaction
    const transaction = await Transaction.create({
      user: userId,
      ride: rideId,
      paymentMethod: paymentMethodId,
      amount,
      type: 'ride_payment',
      status: 'completed', // Simulate successful payment
      description: `Payment for ride from ${ride.origin} to ${ride.destination}`,
      carbonOffsetKg,
      greenPointsEarned
    });

    // If using green wallet or eco credits, update balance
    if (paymentMethod.type === 'green_wallet') {
      if (paymentMethod.greenWalletBalance < amount) {
        return res.status(400).json({ message: 'Insufficient Green Wallet balance' });
      }
      paymentMethod.greenWalletBalance -= amount;
      paymentMethod.greenWalletBalance += greenPointsEarned * 0.1; // Add green points as balance
      await paymentMethod.save();
    } else if (paymentMethod.type === 'eco_credits') {
      const creditsNeeded = Math.ceil(amount / 0.5); // 1 credit = 0.5 currency
      if (paymentMethod.ecoCredits < creditsNeeded) {
        return res.status(400).json({ message: 'Insufficient Eco Credits' });
      }
      paymentMethod.ecoCredits -= creditsNeeded;
      paymentMethod.ecoCredits += greenPointsEarned; // Add green points as credits
      await paymentMethod.save();
    }

    res.status(200).json({
      success: true,
      message: 'Payment processed successfully',
      transaction: {
        transactionId: transaction.transactionId,
        amount: transaction.amount,
        carbonOffsetKg: transaction.carbonOffsetKg,
        greenPointsEarned: transaction.greenPointsEarned,
        status: transaction.status
      }
    });
  } catch (error) {
    console.error('Error processing payment:', error);
    res.status(500).json({ message: 'Payment processing failed', error: error.message });
  }
};

// Get transaction history
exports.getTransactionHistory = async (req, res) => {
  try {
    const userId = req.user._id;
    
    const transactions = await Transaction.find({ user: userId })
      .populate('ride', 'origin destination departureTime')
      .populate('paymentMethod', 'type cardNumber email upiId')
      .sort({ createdAt: -1 })
      .limit(50); // Limit to last 50 transactions

    res.status(200).json({
      success: true,
      transactions
    });
  } catch (error) {
    console.error('Error fetching transaction history:', error);
    res.status(500).json({ message: 'Failed to fetch transaction history', error: error.message });
  }
};

// Delete payment method
exports.deletePaymentMethod = async (req, res) => {
  try {
    const userId = req.user._id;
    const { paymentMethodId } = req.params;

    const paymentMethod = await PaymentMethod.findOne({
      _id: paymentMethodId,
      user: userId
    });

    if (!paymentMethod) {
      return res.status(404).json({ message: 'Payment method not found' });
    }

    // Don't allow deletion if it's the only payment method
    const userPaymentMethods = await PaymentMethod.countDocuments({ 
      user: userId, 
      isActive: true 
    });
    
    if (userPaymentMethods === 1) {
      return res.status(400).json({ message: 'Cannot delete the only payment method' });
    }

    // If deleting default payment method, set another as default
    if (paymentMethod.isDefault) {
      const nextPaymentMethod = await PaymentMethod.findOne({
        user: userId,
        isActive: true,
        _id: { $ne: paymentMethodId }
      });
      
      if (nextPaymentMethod) {
        nextPaymentMethod.isDefault = true;
        await nextPaymentMethod.save();
      }
    }

    paymentMethod.isActive = false;
    await paymentMethod.save();

    res.status(200).json({
      success: true,
      message: 'Payment method deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting payment method:', error);
    res.status(500).json({ message: 'Failed to delete payment method', error: error.message });
  }
};

// Award eco bonus (for completed eco-friendly rides)
exports.awardEcoBonus = async (req, res) => {
  try {
    const userId = req.user._id;
    const { rideId, bonusAmount, co2Saved } = req.body;

    // Find user's eco credits payment method
    let ecoCreditsMethod = await PaymentMethod.findOne({
      user: userId,
      type: 'eco_credits',
      isActive: true
    });

    // Create eco credits account if doesn't exist
    if (!ecoCreditsMethod) {
      ecoCreditsMethod = await PaymentMethod.create({
        user: userId,
        type: 'eco_credits',
        ecoCredits: 0
      });
    }

    // Create bonus transaction
    const transaction = await Transaction.create({
      user: userId,
      ride: rideId,
      paymentMethod: ecoCreditsMethod._id,
      amount: bonusAmount,
      type: 'eco_bonus',
      status: 'completed',
      description: `Eco bonus for sustainable ride - ${co2Saved}kg CO₂ saved`,
      carbonOffsetKg: co2Saved,
      greenPointsEarned: Math.round(co2Saved * 10)
    });

    // Add eco credits
    ecoCreditsMethod.ecoCredits += Math.round(co2Saved * 10);
    await ecoCreditsMethod.save();

    res.status(200).json({
      success: true,
      message: 'Eco bonus awarded!',
      transaction,
      newEcoCredits: ecoCreditsMethod.ecoCredits
    });
  } catch (error) {
    console.error('Error awarding eco bonus:', error);
    res.status(500).json({ message: 'Failed to award eco bonus', error: error.message });
  }
};
