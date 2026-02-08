// =========================
// File: permissions.js
// Middleware for permission-based authorization
// =========================

const { User, Permission, UserPermission } = require('../models');

/**
 * Middleware to check if user has required permissions
 * @param {Array<string>} permissionKeys - Array of permission keys required
 * @param {Object} options - Configuration options
 * @param {boolean} options.requireAll - If true, user must have ALL permissions. If false, ANY permission is enough
 * @returns {Function} Express middleware
 */
const requirePermissions = (permissionKeys, options = {}) => {
  const { requireAll = true } = options;

  return async (req, res, next) => {
    try {
      // Ensure user is authenticated
      if (!req.user || !req.user.id) {
        return res.status(401).json({
          success: false,
          message: 'المصادقة مطلوبة'
        });
      }

      // Validate input
      if (!Array.isArray(permissionKeys) || permissionKeys.length === 0) {
        return res.status(500).json({
          success: false,
          message: 'إعدادات أذونات غير صالحة'
        });
      }

      // Get user from database with permissions
      const user = await User.findByPk(req.user.id);

      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'لم يتم العثور على المستخدم'
        });
      }

      // Check if user is active
      if (!user.is_active) {
        return res.status(403).json({
          success: false,
          message: 'حساب المستخدم غير نشط'
        });
      }

      // Get user's permission keys
      const userPermissionKeys = await user.getPermissionKeys();

      // Check permissions based on requireAll option
      console.log('\n userPermissionKeys',userPermissionKeys.includes('APPLICATION_ADMIN'));
      
      let hasPermission = false;
        if(userPermissionKeys.includes('APPLICATION_ADMIN')){
          hasPermission=true;
        }
      else if (requireAll) {
        // User must have ALL specified permissions
        hasPermission = permissionKeys.every(key => userPermissionKeys.includes(key));
      } else {
        // User must have at least ONE of the specified permissions
        hasPermission = permissionKeys.some(key => userPermissionKeys.includes(key));
      }

      if (!hasPermission) {
        const missingPermissions = requireAll
          ? permissionKeys.filter(key => !userPermissionKeys.includes(key))
          : permissionKeys;

        return res.status(403).json({
          success: false,
          message: 'لا يوجد لديك الصلاحيه لهذا',
          required_permissions: permissionKeys,
          missing_permissions: requireAll ? missingPermissions : undefined,
          access_type: requireAll ? 'ALL_REQUIRED' : 'ANY_REQUIRED'
        });
      }

      // User has required permissions, proceed
      next();

    } catch (error) {
      console.error('Permission check error:', error);
      return res.status(500).json({
        success: false,
        message: 'خطأ في التحقق من الأذونات',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  };
};

/**
 * Middleware to check if user can manage users (for admin operations)
 * This is a convenience wrapper for common admin permission
 */
const requireUserManagement = () => {
  return requirePermissions(['MANAGE_USERS']);
};

/**
 * Middleware to check if user can manage permissions
 */
const requirePermissionManagement = () => {
  return requirePermissions(['MANAGE_PERMISSIONS']);
};

/**
 * Middleware to attach user's permissions to request object
 * Use this if you need to access permissions in controller without blocking
 */
const attachPermissions = async (req, res, next) => {
  try {
    if (req.user && req.user.id) {
      const user = await User.findByPk(req.user.id);
      if (user) {
        req.userPermissions = await user.getPermissionKeys();
      }
    }
    next();
  } catch (error) {
    console.error('Error attaching permissions:', error);
    next(); // Don't block on error, just proceed without permissions
  }
};

/**
 * Helper function to check permission in controller
 * @param {Object} user - User object or user ID
 * @param {string|Array<string>} permissionKeys - Permission key(s) to check
 * @returns {Promise<boolean>}
 */
const checkPermission = async (user, permissionKeys) => {
  try {
    const userId = typeof user === 'object' ? user.id : user;
    const userInstance = await User.findByPk(userId);

    if (!userInstance) return false;

    const keys = Array.isArray(permissionKeys) ? permissionKeys : [permissionKeys];
    return await userInstance.hasAllPermissions(keys);

  } catch (error) {
    console.error('Error checking permission:', error);
    return false;
  }
};

module.exports = {
  requirePermissions,
  requireUserManagement,
  requirePermissionManagement,
  attachPermissions,
  checkPermission
};