const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const VehicleOperation = sequelize.define('VehicleOperation', {
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
    vehicle_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'vehicles',
        key: 'id'
      }
    },
    status: {
      type: DataTypes.ENUM('ACTIVE', 'COMPLETED'),
      defaultValue: 'ACTIVE'
    }
  }, {
    tableName: 'vehicle_operations',
    underscored: true,
     timestamps: true,
     createdAt: 'created_at',
     updatedAt: 'updated_at',
    indexes: [
      {
        unique: true,
        fields: ['daily_operation_id', 'vehicle_id']
      },
      {
        fields: ['daily_operation_id']
      },
      {
        fields: ['vehicle_id']
      }
    ]
  });
module.exports = VehicleOperation;