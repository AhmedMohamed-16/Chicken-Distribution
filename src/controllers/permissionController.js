// =========================
// File: permissionController.js
// Controller for permission management
// =========================

const { Permission, User, UserPermission } = require('../models');
const { Op } = require('sequelize');

/**
 * Get all permissions
 * @route GET /api/permissions
 * @access Admin (VIEW_PERMISSIONS or MANAGE_PERMISSIONS)
 */
exports.getAllPermissions = async (req, res) => {
  try {
    const { category, is_active, grouped } = req.query;
    
    const where = {};
    
    if (category) {
      where.category = category;
    }
    
    if (is_active !== undefined) {
      where.is_active = is_active === 'true';
    }
    
    if (grouped === 'true') {
      // Return permissions grouped by category
      const permissions = await Permission.getGroupedByCategory();
      
      return res.json({
        success: true,
        data: permissions
      });
    }
    
    // Return flat list
    const permissions = await Permission.findAll({
      where,
      order: [['category', 'ASC'], ['name', 'ASC']]
    });
    
    res.json({
      success: true,
      data: permissions
    });
    
  } catch (error) {
    console.error('Get all permissions error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching permissions',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Get permission by ID
 * @route GET /api/permissions/:id
 * @access Admin
 */
exports.getPermissionById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const permission = await Permission.findByPk(id, {
      include: [{
        model: User,
        as: 'users',
        attributes: ['id', 'username', 'full_name', 'is_active'],
        through: { attributes: ['granted_at', 'granted_by'] }
      }]
    });
    
    if (!permission) {
      return res.status(404).json({
        success: false,
        message: 'Permission not found'
      });
    }
    
    res.json({
      success: true,
      data: permission
    });
    
  } catch (error) {
    console.error('Get permission by ID error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching permission',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Get permissions by category
 * @route GET /api/permissions/category/:category
 * @access Admin
 */
exports.getPermissionsByCategory = async (req, res) => {
  try {
    const { category } = req.params;
    
    const permissions = await Permission.getByCategory(category);
    
    res.json({
      success: true,
      data: permissions
    });
    
  } catch (error) {
    console.error('Get permissions by category error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching permissions',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Create new permission
 * @route POST /api/permissions
 * @access Admin (MANAGE_PERMISSIONS)
 */
exports.createPermission = async (req, res) => {
  try {
    const { key, name, description, category, is_active = true } = req.body;
    
    // Validation
    if (!key || !name || !category) {
      return res.status(400).json({
        success: false,
        message: 'Key, name, and category are required'
      });
    }
    
    // Check if key already exists
    const existingPermission = await Permission.findOne({ where: { key } });
    
    if (existingPermission) {
      return res.status(400).json({
        success: false,
        message: 'Permission key already exists'
      });
    }
    
    const permission = await Permission.create({
      key,
      name,
      description,
      category,
      is_active
    });
    
    res.status(201).json({
      success: true,
      message: 'Permission created successfully',
      data: permission
    });
    
  } catch (error) {
    console.error('Create permission error:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating permission',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Update permission
 * @route PUT /api/permissions/:id
 * @access Admin (MANAGE_PERMISSIONS)
 */
exports.updatePermission = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, category, is_active } = req.body;
    
    const permission = await Permission.findByPk(id);
    
    if (!permission) {
      return res.status(404).json({
        success: false,
        message: 'Permission not found'
      });
    }
    
    const updateData = {};
    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (category !== undefined) updateData.category = category;
    if (is_active !== undefined) updateData.is_active = is_active;
    
    await permission.update(updateData);
    
    res.json({
      success: true,
      message: 'Permission updated successfully',
      data: permission
    });
    
  } catch (error) {
    console.error('Update permission error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating permission',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Delete permission
 * @route DELETE /api/permissions/:id
 * @access Admin (MANAGE_PERMISSIONS)
 */
exports.deletePermission = async (req, res) => {
  try {
    const { id } = req.params;
    
    const permission = await Permission.findByPk(id);
    
    if (!permission) {
      return res.status(404).json({
        success: false,
        message: 'Permission not found'
      });
    }
    
    // Check if permission is assigned to any users
    const assignmentCount = await UserPermission.count({
      where: { permission_id: id }
    });
    
    if (assignmentCount > 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot delete permission. It is assigned to ${assignmentCount} user(s)`,
        assigned_users_count: assignmentCount
      });
    }
    
    await permission.destroy();
    
    res.json({
      success: true,
      message: 'Permission deleted successfully'
    });
    
  } catch (error) {
    console.error('Delete permission error:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting permission',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Get permission usage statistics
 * @route GET /api/permissions/:id/statistics
 * @access Admin
 */
exports.getPermissionStatistics = async (req, res) => {
  try {
    const { id } = req.params;
    
    const permission = await Permission.findByPk(id);
    
    if (!permission) {
      return res.status(404).json({
        success: false,
        message: 'Permission not found'
      });
    }
    
    // Count total users with this permission
    const totalUsers = await UserPermission.count({
      where: { permission_id: id }
    });
    
    // Count active users with this permission
    const activeUsers = await UserPermission.count({
      where: { permission_id: id },
      include: [{
        model: User,
        as: 'user',
        where: { is_active: true },
        attributes: []
      }]
    });
    
    // Get recently granted (last 30 days)
    const thirtyDaysAgo = new Date().toLocaleString('en-GB', { timeZone: 'Africa/Cairo' });
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const recentlyGranted = await UserPermission.count({
      where: {
        permission_id: id,
        granted_at: { [Op.gte]: thirtyDaysAgo }
      }
    });
    
    res.json({
      success: true,
      data: {
        permission,
        statistics: {
          total_users: totalUsers,
          active_users: activeUsers,
          inactive_users: totalUsers - activeUsers,
          recently_granted_30d: recentlyGranted
        }
      }
    });
    
  } catch (error) {
    console.error('Get permission statistics error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching permission statistics',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

module.exports = exports;