// =========================
// File: userController.js
// Controller for user management (admin operations)
// =========================

const { User, Permission, UserPermission, sequelize } = require('../models');
const { Op } = require('sequelize');

/**
 * Get all users with their permissions
 * @route GET /api/users
 * @access Admin (MANAGE_USERS permission)
 */
exports.getAllUsers = async (req, res) => {
  try {
  
    const {rows: users } = await User.findAndCountAll({
       attributes: { exclude: ['password_hash'] },
      include: [{
        model: Permission,
        as: 'permissions',
        through: { attributes: ['granted_at', 'granted_by'] },
        attributes: ['id', 'key', 'name', 'category']
      }],
      order: [['created_at', 'DESC']],
    });
    
    res.json({
      success: true,
      data:users
    });
    
  } catch (error) {
    console.error('Get all users error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching users',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Get single user by ID with permissions
 * @route GET /api/users/:id
 * @access Admin (MANAGE_USERS permission)
 */
exports.getUserById = async (req, res) => {
  try {
    const { id } = req.params;
    
    // const user = await User.findByPk(id, {
    //   attributes: { exclude: ['password_hash'] },
    //   include: [{
    //     model: Permission,
    //     as: 'permissions',
    //     through: {
    //       attributes: ['granted_at', 'granted_by'],
    //       include: [{
    //         model: User,
    //         as: 'granter',
    //         attributes: ['id', 'username', 'full_name']
    //       }]
    //     },
    //     attributes: ['id', 'key', 'name', 'description', 'category']
    //   }]
    // });
    const user = await User.findByPk(id, {
  attributes: { exclude: ['password_hash'] },
  include: [
    {
      model: Permission,
      as: 'permissions',
      attributes: ['id', 'key', 'name', 'description', 'category'],
      through: {
        attributes: ['granted_at', 'granted_by']
      }
    },
    {
      model: UserPermission,
      as: 'user_permissions',
      include: [
        {
          model: User,
          as: 'granter',
          attributes: ['id', 'username', 'full_name']
        }
      ]
    }
  ]
});

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
      console.log("\n user",user);
      
    res.json({
      success: true,
      data: user
    });
    
  } catch (error) {
    console.error('Get user by ID error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching user',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Create new user
 * @route POST /api/users
 * @access Admin (MANAGE_USERS permission)
 */
exports.createUser = async (req, res) => {
  const transaction = await sequelize.transaction();
  
  try {
    const {
      username,
      password,
      full_name,
      email,
      phone,
      is_active = true,
      permission_ids = []
    } = req.body;
    
    // Validation
    if (!username || !password || !full_name) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: 'Username, password, and full name are required'
      });
    }
    
    // Check if username already exists
    const existingUser = await User.findOne({ where: { username } });
    if (existingUser) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: 'Username already exists'
      });
    }
    
    // Check if email already exists (if provided)
    if (email) {
      const existingEmail = await User.findOne({ where: { email } });
      if (existingEmail) {
        await transaction.rollback();
        return res.status(400).json({
          success: false,
          message: 'Email already exists'
        });
      }
    }
    
    // Create user
    const user = await User.create({
      username,
      password_hash: password, // Will be hashed by beforeCreate hook
      full_name,
      email,
      phone,
      is_active
    }, { transaction });
    
    // Assign permissions if provided
    if (permission_ids.length > 0) {
      const grantedBy = req.user.id;
      
      // Validate all permission IDs exist
      const permissions = await Permission.findAll({
        where: { id: { [Op.in]: permission_ids } }
      });
      
      if (permissions.length !== permission_ids.length) {
        await transaction.rollback();
        return res.status(400).json({
          success: false,
          message: 'One or more invalid permission IDs'
        });
      }
      
      // Create user permissions
      const userPermissions = permission_ids.map(permissionId => ({
        user_id: user.id,
        permission_id: permissionId,
        granted_by: grantedBy,
        granted_at: new Date()
      }));
      
      await UserPermission.bulkCreate(userPermissions, { transaction });
    }
    
    await transaction.commit();
    
    // Fetch created user with permissions
    const createdUser = await User.findByPk(user.id, {
      attributes: { exclude: ['password_hash'] },
      include: [{
        model: Permission,
        as: 'permissions',
        attributes: ['id', 'key', 'name', 'category']
      }]
    });
    
    res.status(201).json({
      success: true,
      message: 'User created successfully',
      data: createdUser
    });
    
  } catch (error) {
    await transaction.rollback();
    console.error('Create user error:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating user',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Update user
 * @route PUT /api/users/:id
 * @access Admin (MANAGE_USERS permission)
 */
exports.updateUser = async (req, res) => {
  const transaction = await sequelize.transaction();
  
  try {
    const { id } = req.params;
    const {
      username,
      password,
      full_name,
      email,
      phone,
      is_active
    } = req.body;
    console.log("req.body",req.body);
    
    const user = await User.findByPk(id, { transaction });
    
    if (!user) {
      await transaction.rollback();
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    // Check if username is being changed and already exists
    if (username && username !== user.username) {
      const existingUser = await User.findOne({ where: { username } });
      if (existingUser) {
        await transaction.rollback();
        return res.status(400).json({
          success: false,
          message: 'Username already exists'
        });
      }
    }
    
    // Check if email is being changed and already exists
    if (email && email !== user.email) {
      const existingEmail = await User.findOne({ where: { email } });
      if (existingEmail) {
        await transaction.rollback();
        return res.status(400).json({
          success: false,
          message: 'Email already exists'
        });
      }
    }
    
    // Update user fields
    const updateData = {};
    if (username !== undefined) updateData.username = username;
    if (password !== undefined) updateData.password_hash = password; // Will be hashed by hook
    if (full_name !== undefined) updateData.full_name = full_name;
    if (email !== undefined) updateData.email = email;
    if (phone !== undefined) updateData.phone = phone;
    if (is_active !== undefined) updateData.is_active = is_active;
    
    await user.update(updateData, { transaction });
    await transaction.commit();
    
    // Fetch updated user
    const updatedUser = await User.findByPk(id, {
      attributes: { exclude: ['password_hash'] },
      include: [{
        model: Permission,
        as: 'permissions',
        attributes: ['id', 'key', 'name', 'category']
      }]
    });
    
    res.json({
      success: true,
      message: 'User updated successfully',
      data: updatedUser
    });
    
  } catch (error) {
    await transaction.rollback();
    console.error('Update user error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating user',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Delete user
 * @route DELETE /api/users/:id
 * @access Admin (MANAGE_USERS permission)
 */
exports.deleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Prevent self-deletion
    if (parseInt(id) === req.user.id) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete your own account'
      });
    }
    
    const user = await User.findByPk(id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    await user.destroy();
    
    res.json({
      success: true,
      message: 'User deleted successfully'
    });
    
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting user',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Assign permissions to user
 * @route POST /api/users/:id/permissions
 * @access Admin (MANAGE_PERMISSIONS permission)
 */
exports.assignPermissions = async (req, res) => {
  const transaction = await sequelize.transaction();
  
  try {
    const { id } = req.params;
    const { permission_ids } = req.body;
    
    if (!Array.isArray(permission_ids) || permission_ids.length === 0) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: 'permission_ids must be a non-empty array'
      });
    }
    
    const user = await User.findByPk(id, { transaction });
    
    if (!user) {
      await transaction.rollback();
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    // Validate permissions exist
    const permissions = await Permission.findAll({
      where: { id: { [Op.in]: permission_ids } },
      transaction
    });
    
    if (permissions.length !== permission_ids.length) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: 'One or more invalid permission IDs'
      });
    }
    
    // Sync permissions (replace all)
    const grantedBy = req.user.id;
    const result = await user.syncPermissions(permission_ids, grantedBy);
    
    await transaction.commit();
    
    // Fetch user with updated permissions
    const updatedUser = await User.findByPk(id, {
      attributes: { exclude: ['password_hash'] },
      include: [{
        model: Permission,
        as: 'permissions',
        attributes: ['id', 'key', 'name', 'category']
      }]
    });
    
    res.json({
      success: true,
      message: 'Permissions assigned successfully',
      data: updatedUser,
      summary: result
    });
    
  } catch (error) {
    await transaction.rollback();
    console.error('Assign permissions error:', error);
    res.status(500).json({
      success: false,
      message: 'Error assigning permissions',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Revoke specific permission from user
 * @route DELETE /api/users/:id/permissions/:permissionId
 * @access Admin (MANAGE_PERMISSIONS permission)
 */
exports.revokePermission = async (req, res) => {
  try {
    const { id, permissionId } = req.params;
    
    const user = await User.findByPk(id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    const permission = await Permission.findByPk(permissionId);
    
    if (!permission) {
      return res.status(404).json({
        success: false,
        message: 'Permission not found'
      });
    }
    
    const revoked = await user.revokePermission(permissionId);
    
    if (!revoked) {
      return res.status(404).json({
        success: false,
        message: 'User does not have this permission'
      });
    }
    
    res.json({
      success: true,
      message: 'Permission revoked successfully'
    });
    
  } catch (error) {
    console.error('Revoke permission error:', error);
    res.status(500).json({
      success: false,
      message: 'Error revoking permission',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

module.exports = exports;