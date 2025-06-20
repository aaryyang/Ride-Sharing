// server/controllers/settingsController.js
const UserSettings = require('../models/UserSettings');
const { Transaction } = require('../models/Payment');

// Get user settings
exports.getUserSettings = async (req, res) => {
  try {
    const userId = req.user._id;
    
    let settings = await UserSettings.findOne({ user: userId });
    
    if (!settings) {
      // Create default settings for new user
      settings = await UserSettings.create({
        user: userId,
        ...UserSettings.getDefaultSettings()
      });
    }
    
    res.status(200).json({
      success: true,
      settings
    });
  } catch (error) {
    console.error('Error fetching user settings:', error);
    res.status(500).json({ message: 'Failed to fetch settings', error: error.message });
  }
};

// Update user settings
exports.updateUserSettings = async (req, res) => {
  try {
    const userId = req.user._id;
    const settingsData = req.body;
    
    // Validate settings data
    if (!settingsData) {
      return res.status(400).json({ message: 'Settings data is required' });
    }
    
    let settings = await UserSettings.findOne({ user: userId });
    
    if (!settings) {
      // Create new settings
      settings = await UserSettings.create({
        user: userId,
        ...settingsData
      });
    } else {
      // Update existing settings
      Object.keys(settingsData).forEach(key => {
        if (settings[key] && typeof settings[key] === 'object' && !Array.isArray(settings[key])) {
          // Merge nested objects
          settings[key] = { ...settings[key], ...settingsData[key] };
        } else {
          settings[key] = settingsData[key];
        }
      });
      
      await settings.save();
    }
    
    res.status(200).json({
      success: true,
      message: 'Settings updated successfully',
      settings
    });
  } catch (error) {
    console.error('Error updating user settings:', error);
    res.status(500).json({ message: 'Failed to update settings', error: error.message });
  }
};

// Get user's green statistics
exports.getGreenStats = async (req, res) => {
  try {
    const userId = req.user._id;
    
    // Get current month's statistics
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);
    
    // Get transactions for current month
    const transactions = await Transaction.find({
      user: userId,
      createdAt: { $gte: startOfMonth },
      status: 'completed'
    });
    
    // Calculate statistics
    const stats = {
      monthlyStats: {
        co2Saved: transactions.reduce((sum, t) => sum + (t.carbonOffsetKg || 0), 0),
        ridesCompleted: transactions.filter(t => t.type === 'ride_payment').length,
        greenPointsEarned: transactions.reduce((sum, t) => sum + (t.greenPointsEarned || 0), 0),
        moneySpent: transactions.reduce((sum, t) => sum + (t.amount || 0), 0)
      },
      allTimeStats: await getAllTimeStats(userId)
    };
    
    // Get user's green goals
    const settings = await UserSettings.findOne({ user: userId });
    const goals = settings?.greenGoals || {
      monthlyCO2Target: 50,
      monthlyRidesTarget: 20,
      greenPointsTarget: 1000
    };
    
    // Calculate progress
    const progress = {
      co2Progress: Math.min((stats.monthlyStats.co2Saved / goals.monthlyCO2Target) * 100, 100),
      ridesProgress: Math.min((stats.monthlyStats.ridesCompleted / goals.monthlyRidesTarget) * 100, 100),
      pointsProgress: Math.min((stats.monthlyStats.greenPointsEarned / goals.greenPointsTarget) * 100, 100)
    };
    
    res.status(200).json({
      success: true,
      stats,
      goals,
      progress
    });
  } catch (error) {
    console.error('Error fetching green stats:', error);
    res.status(500).json({ message: 'Failed to fetch green statistics', error: error.message });
  }
};

// Helper function to get all-time statistics
async function getAllTimeStats(userId) {
  const allTransactions = await Transaction.find({
    user: userId,
    status: 'completed'
  });
  
  return {
    totalCO2Saved: allTransactions.reduce((sum, t) => sum + (t.carbonOffsetKg || 0), 0),
    totalRides: allTransactions.filter(t => t.type === 'ride_payment').length,
    totalGreenPoints: allTransactions.reduce((sum, t) => sum + (t.greenPointsEarned || 0), 0),
    totalMoneySpent: allTransactions.reduce((sum, t) => sum + (t.amount || 0), 0),
    memberSince: allTransactions[0]?.createdAt || new Date()
  };
}

// Update green goals
exports.updateGreenGoals = async (req, res) => {
  try {
    const userId = req.user._id;
    const { monthlyCO2Target, monthlyRidesTarget, greenPointsTarget } = req.body;
    
    let settings = await UserSettings.findOne({ user: userId });
    
    if (!settings) {
      settings = await UserSettings.create({
        user: userId,
        ...UserSettings.getDefaultSettings()
      });
    }
    
    // Update goals
    if (monthlyCO2Target) settings.greenGoals.monthlyCO2Target = monthlyCO2Target;
    if (monthlyRidesTarget) settings.greenGoals.monthlyRidesTarget = monthlyRidesTarget;
    if (greenPointsTarget) settings.greenGoals.greenPointsTarget = greenPointsTarget;
    
    await settings.save();
    
    res.status(200).json({
      success: true,
      message: 'Green goals updated successfully',
      goals: settings.greenGoals
    });
  } catch (error) {
    console.error('Error updating green goals:', error);
    res.status(500).json({ message: 'Failed to update green goals', error: error.message });
  }
};

// Add achievement
exports.addAchievement = async (req, res) => {
  try {
    const userId = req.user._id;
    const { type, name, description, icon } = req.body;
    
    let settings = await UserSettings.findOne({ user: userId });
    
    if (!settings) {
      settings = await UserSettings.create({
        user: userId,
        ...UserSettings.getDefaultSettings()
      });
    }
    
    // Check if achievement already exists
    const existingAchievement = settings.achievements.find(a => a.type === type);
    if (existingAchievement) {
      return res.status(400).json({ message: 'Achievement already earned' });
    }
    
    // Add new achievement
    settings.achievements.push({
      type,
      name,
      description,
      icon,
      dateEarned: new Date()
    });
    
    await settings.save();
    
    res.status(200).json({
      success: true,
      message: 'Achievement unlocked!',
      achievement: { type, name, description, icon }
    });
  } catch (error) {
    console.error('Error adding achievement:', error);
    res.status(500).json({ message: 'Failed to add achievement', error: error.message });
  }
};

// Reset settings to default
exports.resetSettings = async (req, res) => {
  try {
    const userId = req.user._id;
    
    await UserSettings.findOneAndUpdate(
      { user: userId },
      { $set: UserSettings.getDefaultSettings() },
      { upsert: true, new: true }
    );
    
    res.status(200).json({
      success: true,
      message: 'Settings reset to default values'
    });
  } catch (error) {
    console.error('Error resetting settings:', error);
    res.status(500).json({ message: 'Failed to reset settings', error: error.message });
  }
};
