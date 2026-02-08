const { body, param, query, validationResult } = require('express-validator');
const VehicleValidationHelper = require('../utils/vehicleValidation');

class ValidationMiddleware {
  
  /**
   * Validate start operation request
   */
  static startOperation = [
    body('operation_date')
      .isDate()
      .withMessage('operation_date must be a valid date'),
    body('vehicle_ids')
      .isArray({ min: 1 })
      .withMessage('vehicle_ids must be a non-empty array'),
    body('vehicle_ids.*')
      .isInt({ min: 1 })
      .withMessage('Each vehicle_id must be a positive integer'),
    
    async (req, res, next) => {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          errors: errors.array()
        });
      }
      
      // Check for duplicate vehicle IDs
      const vehicleIds = req.body.vehicle_ids;
      const uniqueIds = [...new Set(vehicleIds)];
      
      if (uniqueIds.length !== vehicleIds.length) {
        return res.status(400).json({
          success: false,
          message: 'لا يُسمح بتكرار معرفات المركبات'
        });
      }
      
      next();
    }
  ];
  
  /**
   * Validate transaction requests (farm loading, sales, etc.)
   */
  static transactionWithVehicle = [
    param('id')
      .isInt({ min: 1 })
      .withMessage('Operation ID must be a positive integer'),
    body('vehicle_id')
      .isInt({ min: 1 })
      .withMessage('vehicle_id is required and must be a positive integer'),
    
    async (req, res, next) => {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          errors: errors.array()
        });
      }
      
      // Verify vehicle is assigned to operation
      const isAssigned = await VehicleValidationHelper.isVehicleInOperation(
        req.params.id,
        req.body.vehicle_id
      );
      
      if (!isAssigned) {
        return res.status(400).json({
          success: false,
          message: `Vehicle ${req.body.vehicle_id} is not assigned to operation ${req.params.id}`
        });
      }
      
      next();
    }
  ];
  
  /**
   * Validate vehicle assignment
   */
  static addVehicleToOperation = [
    param('id')
      .isInt({ min: 1 })
      .withMessage('Operation ID must be a positive integer'),
    body('vehicle_id')
      .isInt({ min: 1 })
      .withMessage('vehicle_id must be a positive integer'),
    
    async (req, res, next) => {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          errors: errors.array()
        });
      }
      
      const validation = await VehicleValidationHelper.validateVehicleAssignment(
        req.params.id,
        [req.body.vehicle_id]
      );
      
      if (!validation.valid) {
        return res.status(400).json({
          success: false,
          errors: validation.errors
        });
      }
      
      next();
    }
  ];
}

module.exports = ValidationMiddleware;