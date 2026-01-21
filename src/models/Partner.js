const { DataTypes, Op } = require('sequelize');
const { sequelize } = require('../config/database');

const Partner = sequelize.define('Partner', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  name: {
    type: DataTypes.STRING(100),
    allowNull: false
  },
  phone: {
    type: DataTypes.STRING(20),
    allowNull: true
  },
  address: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  investment_amount: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: false,
    defaultValue: 0,
    validate: {
      min: 0
    }
  },
  investment_percentage: {
    type: DataTypes.DECIMAL(5, 2),
    allowNull: true,
    defaultValue: 0,
    validate: {
      min: 0,
      max: 100
    }
  },
  is_vehicle_partner: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  }
}, {
  tableName: 'partners',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: false
});

// Helper function to recalculate all percentages
async function recalculateAllPercentages(transaction) {
  const partners = await Partner.findAll({ transaction });
  
  const totalInvestment = partners.reduce((sum, p) => sum + parseFloat(p.investment_amount || 0), 0);
  
  if (totalInvestment === 0) {
    // If no investment, set all to 0
    await Partner.update(
      { investment_percentage: 0 },
      { where: {}, hooks: false, transaction }
    );
    return;
  }

  // Update each partner's percentage
  for (const partner of partners) {
    const percentage = (parseFloat(partner.investment_amount) / totalInvestment) * 100;
    await partner.update(
      { investment_percentage: percentage },
      { hooks: false, transaction }
    );
  }
}

// After create or update, recalculate all percentages
Partner.afterCreate(async (partner, options) => {
  await recalculateAllPercentages(options.transaction);
});

Partner.afterUpdate(async (partner, options) => {
  // Only recalculate if investment_amount changed
  if (partner.changed('investment_amount')) {
    await recalculateAllPercentages(options.transaction);
  }
});

Partner.afterDestroy(async (partner, options) => {
  await recalculateAllPercentages(options.transaction);
});

module.exports = Partner;