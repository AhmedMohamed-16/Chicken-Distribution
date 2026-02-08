// =========================
// File: UserPermission.js
// =========================

const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const UserPermission = sequelize.define('UserPermission', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  user_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    },
    onDelete: 'CASCADE'
  },
  permission_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'permissions',
      key: 'id'
    },
    onDelete: 'CASCADE'
  },
  granted_by: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'users',
      key: 'id'
    },
    comment: 'User ID who granted this permission'
  },
  granted_at: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  }
}, {
  tableName: 'user_permissions',
  timestamps: false,
  indexes: [
    {
      unique: true,
      fields: ['user_id', 'permission_id'],
      name: 'unique_user_permission'
    },
    {
      fields: ['user_id']
    },
    {
      fields: ['permission_id']
    },
    {
      fields: ['granted_by']
    }
  ]
});

module.exports = UserPermission;