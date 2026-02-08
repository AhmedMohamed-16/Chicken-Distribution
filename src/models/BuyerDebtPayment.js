const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const BuyerDebtPayment = sequelize.define('BuyerDebtPayment', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  buyer_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'buyers',
      key: 'id'
    }
  },
  daily_operation_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'daily_operations',
      key: 'id'
    }
  },
  amount: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: false
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true
  }
}, {
  tableName: 'buyer_debt_payments',
  timestamps: true,
  createdAt: 'payment_date',
  updatedAt: false,
  underscored: true,
});

module.exports = BuyerDebtPayment;