const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const DailyCost = sequelize.define('DailyCost', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  daily_operation_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'daily_operations',
      key: 'id'
    }
  },
  vehicle_id: {  // ✅ NEW FIELD
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'vehicles',
      key: 'id'
    }
  },
  cost_category_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'cost_categories',
      key: 'id'
    }
  },
  amount: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: false
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  vehicle_operation_id: {
  type: DataTypes.INTEGER,
  allowNull: true,
  references: {
    model: 'vehicle_operations',
    key: 'id'
  }
}

}, {
  tableName: 'daily_costs',
  timestamps: true,
  createdAt: 'recorded_at',
  updatedAt: false,
  underscored: true,
  indexes: [
    { fields: ['daily_operation_id'] },
    { fields: ['vehicle_id', 'daily_operation_id'] }  // ✅ NEW INDEX
  ]
});

module.exports = DailyCost;