// =========================
// File: User.js (UPDATED)
// =========================

const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');
const bcrypt = require('bcryptjs');

const User = sequelize.define('User', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  username: {
    type: DataTypes.STRING(50),
    allowNull: false,
    unique: true,
    validate: {
      len: [3, 50]
    }
  },
  password_hash: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  full_name: {
    type: DataTypes.STRING(100),
    allowNull: false
  },
  email: {
    type: DataTypes.STRING(100),
    allowNull: true,
    unique: true,
    validate: {
      isEmail: {
        msg: 'Must be a valid email address'
      }
    }
  },
  phone: {
    type: DataTypes.STRING(20),
    allowNull: true
  },
  is_active: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  }

}, {
  tableName: 'users',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});

/**
 * Instance Methods
 */

/**
 * Check password
 * @param {string} password
 * @returns {Promise<boolean>}
 */
User.prototype.checkPassword = async function(password) {
  return await bcrypt.compare(password, this.password_hash);
};

/**
 * Get user's permissions
 * @returns {Promise<Array>}
 */
User.prototype.getPermissions = async function() {
  const Permission = require('./Permission');
  const UserPermission = require('./UserPermission');
  
  const userPermissions = await UserPermission.findAll({
    where: { user_id: this.id },
    include: [{
      model: Permission,
      as: 'permission',
      where: { is_active: true }
    }]
  });
  
  return userPermissions.map(up => up.permission);
};

/**
 * Get user's permission keys
 * @returns {Promise<Array<string>>}
 */
User.prototype.getPermissionKeys = async function() {
  const permissions = await this.getPermissions();
  return permissions.map(p => p.key);
};

/**
 * Check if user has specific permission
 * @param {string} permissionKey
 * @returns {Promise<boolean>}
 */
User.prototype.hasPermission = async function(permissionKey) {
  const Permission = require('./Permission');
  const UserPermission = require('./UserPermission');
  
  const permission = await Permission.findOne({
    where: { key: permissionKey, is_active: true }
  });
  
  if (!permission) return false;
  
  const userPermission = await UserPermission.findOne({
    where: {
      user_id: this.id,
      permission_id: permission.id
    }
  });
  
  return !!userPermission;
};

/**
 * Check if user has any of the specified permissions
 * @param {Array<string>} permissionKeys
 * @returns {Promise<boolean>}
 */
User.prototype.hasAnyPermission = async function(permissionKeys) {
  const userPermissionKeys = await this.getPermissionKeys();
  return permissionKeys.some(key => userPermissionKeys.includes(key));
};

/**
 * Check if user has all specified permissions
 * @param {Array<string>} permissionKeys
 * @returns {Promise<boolean>}
 */
User.prototype.hasAllPermissions = async function(permissionKeys) {
  const userPermissionKeys = await this.getPermissionKeys();
  return permissionKeys.every(key => userPermissionKeys.includes(key));
};

/**
 * Grant permission to user
 * @param {number} permissionId
 * @param {number} grantedBy - User ID who is granting the permission
 * @returns {Promise<Object>}
 */
User.prototype.grantPermission = async function(permissionId, grantedBy) {
  const UserPermission = require('./UserPermission');
  
  const [userPermission, created] = await UserPermission.findOrCreate({
    where: {
      user_id: this.id,
      permission_id: permissionId
    },
    defaults: {
      granted_by: grantedBy,
      granted_at: new Date().toLocaleString('en-GB', { timeZone: 'Africa/Cairo' })
    }
  });
  
  return { userPermission, created };
};

/**
 * Revoke permission from user
 * @param {number} permissionId
 * @returns {Promise<boolean>}
 */
User.prototype.revokePermission = async function(permissionId) {
  const UserPermission = require('./UserPermission');
  
  const deleted = await UserPermission.destroy({
    where: {
      user_id: this.id,
      permission_id: permissionId
    }
  });
  
  return deleted > 0;
};

/**
 * Sync user permissions (replace all with new set)
 * @param {Array<number>} permissionIds
 * @param {number} grantedBy
 * @returns {Promise<Object>}
 */
User.prototype.syncPermissions = async function(permissionIds, grantedBy) {
  const UserPermission = require('./UserPermission');
  
  // Remove all existing permissions
  await UserPermission.destroy({
    where: { user_id: this.id }
  });
  
  // Add new permissions
  const newPermissions = permissionIds.map(permissionId => ({
    user_id: this.id,
    permission_id: permissionId,
    granted_by: grantedBy,
    granted_at: new Date().toLocaleString('en-GB', { timeZone: 'Africa/Cairo' })
  }));
  
  const created = await UserPermission.bulkCreate(newPermissions);
  
  return {
    removed: permissionIds.length,
    added: created.length
  };
};

/**
 * Get user profile with permissions
 * @returns {Promise<Object>}
 */
User.prototype.getProfileWithPermissions = async function() {
  const permissions = await this.getPermissions();
  
  return {
    id: this.id,
    username: this.username,
    full_name: this.full_name,
    email: this.email,
    phone: this.phone,
    is_active: this.is_active,
    created_at: this.created_at,
    permissions: permissions.map(p => ({
      id: p.id,
      key: p.key,
      name: p.name,
      description: p.description,
      category: p.category
    }))
  };
};

/**
 * Hooks
 */

// Hash password before creating user
User.beforeCreate(async (user) => {
  if (user.password_hash) {
    const salt = await bcrypt.genSalt(10);
    user.password_hash = await bcrypt.hash(user.password_hash, salt);
  }
});

// Hash password before updating user
User.beforeUpdate(async (user) => {
  if (user.changed('password_hash')) {
    const salt = await bcrypt.genSalt(10);
    user.password_hash = await bcrypt.hash(user.password_hash, salt);
  }
});

module.exports = User;