// src/controllers/operationController.js
const { Op } = require('sequelize');
const { 
  DailyOperation, 
  FarmTransaction, 
  SaleTransaction, 
  TransportLoss, 
  DailyCost,
  Farm,
  Buyer,
  Vehicle,
  ChickenType,
  CostCategory,
  sequelize,
  ProfitDistribution,
  PartnerProfit,
  Partner,
  FarmDebtPayment,
  BuyerDebtPayment
} = require('../models');
const VehicleOperation = require('../models/VehicleOperation');
const ProfitService = require('../services/ProfitService');

// Start a new daily operation
// exports.startDailyOperation = async (req, res) => {
//   const transaction = await sequelize.transaction();
  
//   try {
//     const { operation_date, vehicle_id } = req.body;

//     // Check if operation already exists for this date
//     const existing = await DailyOperation.findOne({
//       where: { operation_date }
//     });

//     if (existing) {
//       await transaction.rollback();
//       return res.status(200).json({
//         success: true,
//         message: 'Daily operation already exists for this date',
//         alreadyExists:true,
//         data:existing
//       });
//     }

//     const operation = await DailyOperation.create({
//       operation_date,
//       vehicle_id,
//       user_id: req.user.id,
//       status: 'OPEN'
//     }, { transaction });

//     await transaction.commit();

//     res.status(201).json({
//       success: true,
//       data: operation
//     });
//   } catch (error) {
//     await transaction.rollback();
//     res.status(500).json({
//       success: false,
//       message: 'Error starting daily operation',
//       error: error.message
//     });
//   }
// };
// ✅ NEW - Multiple vehicles
// exports.startDailyOperation = async (req, res) => {
//   const transaction = await sequelize.transaction();
  
//   try {
//     const { operation_date, vehicle_ids } = req.body;  // ✅ Now expects array
    
//     // ✅ Validation
//     if (!Array.isArray(vehicle_ids) || vehicle_ids.length === 0) {
//       return res.status(400).json({
//         success: false,
//         message: 'vehicle_ids must be a non-empty array'
//       });
//     }
    
//     // ✅ Check if any vehicle is already assigned for this date
//     const existingVehicleOps = await VehicleOperation.findAll({
//       include: [{
//         model: DailyOperation,
//         as:"operation",
//         where: { 
//           operation_date,
//           status: 'OPEN'
//         }
//       }],
//       where: {
//         vehicle_id: vehicle_ids
//       }
//     });
    
//     if (existingVehicleOps.length > 0) {
//       const busyVehicles = existingVehicleOps.map(vo => vo.vehicle_id);
//       return res.status(200).json({
//         success: false,
//         message: `Vehicles ${busyVehicles.join(', ')} are already assigned to an open operation for this date`,
//         alreadyExists:true,
//         data:existingVehicleOps
//       });
//     }
    
//     // ✅ Create operation (no vehicle_id in this table anymore)
//     const operation = await DailyOperation.create({
//       operation_date,
//       user_id: req.user.id,
//       status: 'OPEN'
//     }, { transaction });
    
//     // ✅ Create vehicle assignments
//     const vehicleAssignments = await Promise.all(
//       vehicle_ids.map(vehicle_id => 
//         VehicleOperation.create({
//           daily_operation_id: operation.id,
//           vehicle_id,
//           status: 'ACTIVE'
//         }, { transaction })
//       )
//     );
    
//     await transaction.commit();
    
//     // ✅ Fetch with vehicles included
//     const operationWithVehicles = await DailyOperation.findByPk(operation.id, {
//       include: [
//         {
//           model: Vehicle,
//           as: 'vehicles',
//           through: { attributes: ['status'] }
//         }
//       ]
//     });
    
//     res.status(201).json({
//       success: true,
//       data: operationWithVehicles
//     });
//   } catch (error) {
//     await transaction.rollback();
//     res.status(500).json({
//       success: false,
//       message: error.message
//     });
//   }
// };
exports.startDailyOperation = async (req, res,next) => {
  const transaction = await sequelize.transaction();
  
  try {
    const { operation_date, vehicle_ids } = req.body;
    
    // ✅ Validation
    if (!operation_date) {
    next(new AppError( 'تاريخ العملية مطلوب',400));

    }
    
    if (!Array.isArray(vehicle_ids) || vehicle_ids.length === 0) {

          next(new AppError( 'يجب أن تكون vehicle_ids مصفوفة غير فارغة',400));


    }
    
    // ✅ STEP 1: Check if OPEN operation exists for this date
    let existingOperation = await DailyOperation.findOne({
      where: { 
        operation_date,
        status: 'OPEN'
      }
    });
    
    // ========================================
    // CASE 1: NO Operation Exists → Create New
    // ========================================
    if (!existingOperation) {
      const operation = await DailyOperation.create({
        operation_date,
        user_id: req.user.id,
        status: 'OPEN',
        notes: req.body.notes || null
      }, { transaction });
      
      // Create all vehicles as ACTIVE
      await Promise.all(
        vehicle_ids.map(vehicle_id => 
          VehicleOperation.create({
            daily_operation_id: operation.id,
            vehicle_id,
            status: 'ACTIVE'
          }, { transaction })
        )
      );
      
      await transaction.commit();
      
      // Fetch complete operation
      const operationWithVehicles = await DailyOperation.findByPk(operation.id, {
        include: [
          {
            model: Vehicle,
            as: 'vehicles',
            through: { 
              attributes: ['status', 'created_at'],
              as: 'assignment'
            }
          }
        ]
      });
      
      return res.status(201).json({
        success: true,
        message: 'تم بدء العملية اليومية بنجاح',
        isNew: true,
        data: operationWithVehicles
      });
    }
    
    // ========================================
    // CASE 2: Operation EXISTS → Check Each Vehicle
    // ========================================
    const vehicleResults = [];
    
    for (const vehicle_id of vehicle_ids) {
      // Check if this vehicle has an assignment in this operation
      const existingAssignment = await VehicleOperation.findOne({
        where: {
          daily_operation_id: existingOperation.id,
          vehicle_id
        }
      });
      
      if (!existingAssignment) {
        // ✅ Vehicle NOT in operation → Create as ACTIVE
        await VehicleOperation.create({
          daily_operation_id: existingOperation.id,
          vehicle_id,
          status: 'ACTIVE'
        }, { transaction });
        
        vehicleResults.push({
          vehicle_id,
          action: 'CREATED',
          OperationAlreadyExists:true,
          message: 'تم إضافة المركبة للعملية'
        });
        
      } else if (existingAssignment.status === 'COMPLETED') {
        // ✅ Vehicle was COMPLETED → Reactivate
        await existingAssignment.update({
          status: 'ACTIVE'
        }, { transaction });
        
        vehicleResults.push({
          vehicle_id,
          action: 'REACTIVATED',
          vehicleAlreadyExists:true,
          message: 'تم إعادة تفعيل المركبة'
        });
        
      } else if (existingAssignment.status === 'ACTIVE') {
        // ✅ Vehicle already ACTIVE → No change needed
        vehicleResults.push({
          vehicle_id,
          action: 'ALREADY_ACTIVE',
          vehicleAlreadyExists:true,
          message: 'المركبة مفعلة بالفعل'
        });
      }
    }
    
    await transaction.commit();
    
    // Fetch complete operation with all vehicles
    const operationWithVehicles = await DailyOperation.findByPk(existingOperation.id, {
      include: [
        {
          model: Vehicle,
          as: 'vehicles',
          through: { 
            attributes: ['status', 'created_at', 'updated_at'],
            as: 'assignment'
          }
        }
      ]
    });
    
    res.status(200).json({
      success: true,
      message: 'تم معالجة العملية بنجاح',
      isNew: false,
      vehicleResults,
      data: operationWithVehicles
    });
    
  } catch (error) {
    await transaction.rollback();
    console.error('Error in startDailyOperation:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};



// Get operation by ID
// exports.getOperation = async (req, res) => {
//   try {
//     const operation = await DailyOperation.findByPk(req.params.id, {
//       include: [
//         { model: Vehicle },
//         { 
//           model: FarmTransaction,
//           include: [{ model: Farm }, { model: ChickenType }]
//         },
//         { 
//           model: SaleTransaction,
//           include: [{ model: Buyer }, { model: ChickenType }]
//         },
//         { 
//           model: TransportLoss,
//           include: [{ model: ChickenType }]
//         },
//         { 
//           model: DailyCost,
//           include: [{ model: CostCategory }]
//         }
//       ]
//     });

//     if (!operation) {
//       return res.status(404).json({
//         success: false,
//         message: 'Operation not found'
//       });
//     }

//     res.json({
//       success: true,
//       data: operation
//     });
//   } catch (error) {
//     res.status(500).json({
//       success: false,
//       message: 'Error fetching operation'
//     });
//   }
// };
// exports.getOperation = async (req, res) => {
//   try {
//     const operation = await DailyOperation.findByPk(req.params.id, {
//       include: [
//         { model: Vehicle },

//         {
//           model: FarmTransaction,
//           include: [{ model: Farm }, { model: ChickenType }]
//         },

//         {
//           model: SaleTransaction,
//           include: [{ model: Buyer }, { model: ChickenType }]
//         },

//         {
//           model: TransportLoss,
//           include: [{ model: ChickenType }]
//         },

//         {
//           model: DailyCost,
//           include: [{ model: CostCategory }]
//         },

//         // ✅ PROFIT DISTRIBUTION (المهم)
//         {
//           model: ProfitDistribution,
//           as: 'profit_distribution',
//           required: false,
//           include: [
//             {
//               model: PartnerProfit,
//               as: 'partner_profits',
//               include: [
//                 {
//                   model: Partner,
//                   as: 'partner',
//                   attributes: ['id', 'name', 'investment_percentage', 'is_vehicle_partner']
//                 }
//               ]
//             }
//           ]
//         }
//       ]
//     });

//     if (!operation) {
//       return res.status(404).json({
//         success: false,
//         message: 'Operation not found'
//       });
//     }

//     res.json({
//       success: true,
//       data: operation
//     });

//   } catch (error) {
//     res.status(500).json({
//       success: false,
//       message: 'Error fetching operation',
//       error: error.message
//     });
//   }
// };
exports.getOperation = async (req, res) => {
  try {
    const { id } = req.params;

    const operation = await DailyOperation.findByPk(id, {
      include: [
        {
          model: VehicleOperation,
          as: 'vehicle_operations',
          include: [
            { model: Vehicle, as: 'vehicle' },
            {
              model: FarmTransaction,
              as: 'farm_transactions',
              include: [
                { model: Farm, as: 'farm' },
                { model: ChickenType, as: 'chicken_type' }
              ]
            },
            {
              model: TransportLoss,
              as: 'transport_losses',
              include: [
                { model: ChickenType, as: 'chicken_type' }
              ]
            },
            {
              model: SaleTransaction,
              as: 'sale_transactions',
              include: [
                { model: Buyer, as: 'buyer' },
                { model: ChickenType, as: 'chicken_type' }
              ]
            },
            {
              model: DailyCost,
              as: 'daily_costs',
              include: [
                { model: CostCategory, as: 'category' }
              ]
            }
          ]
        },
        {
          model: Vehicle,
          as: 'vehicles',
          through: { attributes: [] }
        }
      ]
    });

    if (!operation) {
      return res.status(404).json({
        success: false,
        message: 'Operation not found'
      });
    }

    let profitDistribution = null;

    if (operation.status === 'CLOSED') {
      profitDistribution = await ProfitService.calculateDailyProfit(operation.id);
    }

    res.status(200).json({
      success: true,
      data: {
        ...operation.toJSON(),
        profitDistribution
      }
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Error fetching operation details',
      error: error.message
    });
  }
};



// Record farm loading
// exports.recordFarmLoading = async (req, res) => {
//   const transaction = await sequelize.transaction();
  
//   try {
//     const operation = await DailyOperation.findByPk(req.params.id);

//     if (!operation || operation.status === 'CLOSED') {
//       await transaction.rollback();
//       return res.status(400).json({
//         success: false,
//         message: 'العملية غير موجودة أو مغلقة بالفعل'
//       });
//     }

//     const {
//       farm_id,
//       chicken_type_id,
//       empty_vehicle_weight,
//       loaded_vehicle_weight,
//       cage_count,
//       cage_weight_per_unit,
//       price_per_kg,
//       paid_amount
//     } = req.body;

//     // Calculate net weight
//     const net_chicken_weight = loaded_vehicle_weight - empty_vehicle_weight - (cage_count * cage_weight_per_unit);
//     const total_amount = net_chicken_weight * price_per_kg;
//     const remaining_amount = total_amount - paid_amount;

//     // Get sequence number
//     const count = await FarmTransaction.count({
//       where: { daily_operation_id: req.params.id }
//     });

//     const farmTransaction = await FarmTransaction.create({
//       daily_operation_id: req.params.id,
//       farm_id,
//       chicken_type_id,
//       sequence_number: count + 1,
//       empty_vehicle_weight,
//       loaded_vehicle_weight,
//       cage_count,
//       cage_weight_per_unit,
//       net_chicken_weight,
//       price_per_kg,
//       total_amount,
//       paid_amount,
//       remaining_amount
//     }, { transaction });

//     // Update farm debt
//     const farm = await Farm.findByPk(farm_id);
//     await farm.update({
//       total_debt: parseFloat(farm.total_debt) + parseFloat(remaining_amount)
//     }, { transaction });

//     await transaction.commit();

//     res.status(201).json({
//       success: true,
//       data: farmTransaction
//     });
//   } catch (error) {
//     await transaction.rollback();
//     res.status(500).json({
//       success: false,
//       message: 'Error recording farm loading',
//       error: error.message
//     });
//   }
// };
// ✅ NEW - Requires vehicle_id
// exports.recordFarmLoading = async (req, res) => {
//   const dbTransaction = await sequelize.transaction();

//   try {
//     const { id } = req.params;
//     const {
//       vehicle_id,
//       farm_id,
//       chicken_type_id,
//       empty_vehicle_weight,
//       loaded_vehicle_weight,
//       cage_count,
//       cage_weight_per_unit,
//       price_per_kg,
//       paid_amount
//     } = req.body;

//     if (!vehicle_id) {
//       return res.status(400).json({
//         success: false,
//         message: 'vehicle_id is required'
//       });
//     }

//     const operation = await DailyOperation.findByPk(id);
//     if (!operation || operation.status !== 'OPEN') {
//       return res.status(400).json({
//         success: false,
//         message: 'Operation not found or already closed'
//       });
//     }

//     const vehicleAssignment = await VehicleOperation.findOne({
//       where: {
//         daily_operation_id: id,
//         vehicle_id,
//         status: 'ACTIVE'
//       }
//     });

//     if (!vehicleAssignment) {
//       return res.status(400).json({
//         success: false,
//         message: `Vehicle ${vehicle_id} is not assigned to this operation`
//       });
//     }

//     const totalCageWeight = cage_count * cage_weight_per_unit;
//     const net_chicken_weight = loaded_vehicle_weight - empty_vehicle_weight - totalCageWeight;

//     if (net_chicken_weight <= 0) {
//       return res.status(400).json({
//         success: false,
//         message: 'Invalid weight calculation: net weight must be positive'
//       });
//     }

//     const total_amount = net_chicken_weight * price_per_kg;
//     const remaining_amount = total_amount - paid_amount;

//     const lastTransaction = await FarmTransaction.findOne({
//       where: { daily_operation_id: id, vehicle_id },
//       order: [['sequence_number', 'DESC']]
//     });
//     const sequence_number = (lastTransaction?.sequence_number || 0) + 1;

//     const farmTransaction = await FarmTransaction.create({
//       daily_operation_id: id,
//       vehicle_id,
//       farm_id,
//       vehicle_operation_id: vehicleAssignment.id,
//       chicken_type_id,
//       sequence_number,
//       empty_vehicle_weight,
//       loaded_vehicle_weight,
//       cage_count,
//       cage_weight_per_unit,
//       net_chicken_weight,
//       price_per_kg,
//       total_amount,
//       paid_amount,
//       remaining_amount
//     }, { transaction: dbTransaction });

//     // Update farm debt inside transaction
//     await Farm.increment('total_debt', {
//       by: remaining_amount,
//       where: { id: farm_id }
//     }, { transaction: dbTransaction });

//     // ✅ Commit AFTER all transaction-dependent operations
//     await dbTransaction.commit();

//     // Fetch result after commit (doesn't need to be in transaction)
//     const result = await FarmTransaction.findByPk(farmTransaction.id, {
//       include: [
//         { model: Farm, as: 'farm' },
//         { model: ChickenType, as: 'chicken_type' },
//         { model: Vehicle, as: 'vehicle' }
//       ]
//     });

//     res.status(201).json({
//       success: true,
//       data: result
//     });

//   } catch (error) {
//     // Only rollback if transaction is still active
//     if (!dbTransaction.finished) {
//       await dbTransaction.rollback();
//     }
//     res.status(500).json({
//       success: false,
//       message: error.message
//     });
//   }
// };
/**
 * Record farm loading transaction
 * POST /api/daily-operations/:id/farm-loading
 */
// exports.recordFarmLoading = async (req, res) => {
//   const dbTransaction = await sequelize.transaction();

//   try {
//     const { id } = req.params;
//     const {
//       vehicle_id,
//       farm_id,
//       chicken_type_id,
//       empty_vehicle_weight,
//       loaded_vehicle_weight,
//       cage_count,
//       cage_weight_per_unit,
//       price_per_kg,
//       paid_amount = 0,
//     old_balance_paid
//     } = req.body;

//     // ========================================
//     // VALIDATION
//     // ========================================
    
//     if (!vehicle_id) {
//       await dbTransaction.rollback();
//       return res.status(400).json({
//         success: false,
//         message: 'vehicle_id is required'
//       });
//     }

//     if (!farm_id || !chicken_type_id) {
//       await dbTransaction.rollback();
//       return res.status(400).json({
//         success: false,
//         message: 'farm_id and chicken_type_id are required'
//       });
//     }

//     // Validate operation exists and is open
//     const operation = await DailyOperation.findByPk(id, { transaction: dbTransaction });
    
//     if (!operation) {
//       await dbTransaction.rollback();
//       return res.status(404).json({
//         success: false,
//         message: 'Daily operation not found'
//       });
//     }
    
//     if (operation.status !== 'OPEN') {
//       await dbTransaction.rollback();
//       return res.status(400).json({
//         success: false,
//         message: 'Operation is already closed'
//       });
//     }

//     // Validate vehicle assignment
//     const vehicleAssignment = await VehicleOperation.findOne({
//       where: {
//         daily_operation_id: id,
//         vehicle_id,
//         status: 'ACTIVE'
//       },
//       transaction: dbTransaction
//     });

//     if (!vehicleAssignment) {
//       await dbTransaction.rollback();
//       return res.status(400).json({
//         success: false,
//         message: `Vehicle ${vehicle_id} is not assigned to this operation`
//       });}

// // ========================================
// // WEIGHT CALCULATION
// // ========================================

// const totalCageWeight = cage_count * cage_weight_per_unit;
// const net_chicken_weight = loaded_vehicle_weight - empty_vehicle_weight - totalCageWeight;

// if (net_chicken_weight <= 0) {
//   await dbTransaction.rollback();
//   return res.status(400).json({
//     success: false,
//     message: 'Invalid weight calculation: net weight must be positive',
//     debug: {
//       loaded: loaded_vehicle_weight,
//       empty: empty_vehicle_weight,
//       cages: totalCageWeight,
//       net: net_chicken_weight
//     }
//   });
// }

// // ========================================
// // PRICING CALCULATION
// // ========================================

// const total_amount = net_chicken_weight * price_per_kg;
// const remaining_amount = total_amount - paid_amount;

// // Get next sequence number
// const lastTransaction = await FarmTransaction.findOne({
//   where: { daily_operation_id: id, vehicle_id },
//   order: [['sequence_number', 'DESC']],
//   transaction: dbTransaction
// });

// const sequence_number = (lastTransaction?.sequence_number || 0) + 1;

// // ========================================
// // CREATE TRANSACTION
// // ========================================

// const farmTransaction = await FarmTransaction.create({
//   daily_operation_id: id,
//   vehicle_id,
//   farm_id,
//   vehicle_operation_id: vehicleAssignment.id,
//   chicken_type_id,
//   sequence_number,
//   empty_vehicle_weight,
//   loaded_vehicle_weight,
//   cage_count,
//   cage_weight_per_unit,
//   net_chicken_weight,
//   price_per_kg,
//   total_amount,
//   paid_amount,
//   remaining_amount
// }, { transaction: dbTransaction });

// // ========================================
// // UPDATE FARM BALANCE (NEW LOGIC)
// // ========================================

// // Get farm with current balance
// const farm = await Farm.findByPk(farm_id, { transaction: dbTransaction });

// if (!farm) {
//   await dbTransaction.rollback();
//   return res.status(404).json({
//     success: false,
//     message: 'Farm not found'
//   });
// }

 
// // Update balance and get change info
// const balanceInfo = await farm.updateBalance(remaining_amount,old_balance_paid, dbTransaction);

// // ========================================
// // COMMIT TRANSACTION
// // ========================================

// await dbTransaction.commit();

// // ========================================
// // FETCH COMPLETE RESULT
// // ========================================

// const result = await FarmTransaction.findByPk(farmTransaction.id, {
//   include: [
//     { 
//       model: Farm, 
//       as: 'farm',
//       attributes: ['id', 'name', 'current_balance']
//     },
//     { 
//       model: ChickenType, 
//       as: 'chicken_type',
//       attributes: ['id', 'name']
//     },
//     { 
//       model: Vehicle, 
//       as: 'vehicle',
//       attributes: ['id', 'name', 'plate_number']
//     }
//   ]
// });

// // ========================================
// // RESPONSE WITH BALANCE INFO
// // ========================================

// res.status(201).json({
//   success: true,
//   message: 'Farm loading recorded successfully',
//   data: {
//     transaction: result,
//     balance_info: {
//       farm_id: balanceInfo.farm_id,
//       farm_name: balanceInfo.farm_name,
//       previous_balance: balanceInfo.previous_balance,
//       transaction_impact: remaining_amount,
//       new_balance: balanceInfo.new_balance,
//       balance_type: balanceInfo.new_type,
//       direction_changed: balanceInfo.direction_changed,
//       display_balance: balanceInfo.display_balance,
      
//       // ✅ ALERT if direction changed
//       ...(balanceInfo.direction_changed && {
//         alert: `⚠️ Balance direction changed from ${balanceInfo.previous_type} to ${balanceInfo.new_type}`
//       })
//     }
//   }
// });
// } catch (error) {
// // Rollback if transaction is still active
// if (!dbTransaction.finished) {
// await dbTransaction.rollback();
// }
// console.error('Error recording farm loading:', error);
// res.status(500).json({
//   success: false,
//   message: 'Error recording farm loading',
//   error: process.env.NODE_ENV === 'development' ? error.message : undefined
// });
// }
// };
// Record transport loss
// exports.recordTransportLoss = async (req, res) => {
//   try {
//     const operation = await DailyOperation.findByPk(req.params.id);

//     if (!operation || operation.status === 'CLOSED') {
//       return res.status(400).json({
//         success: false,
//         message: 'العملية غير موجودة أو مغلقة بالفعل'
//       });
//     }

//     const { chicken_type_id, dead_weight, price_per_kg, location } = req.body;
//     const loss_amount = dead_weight * price_per_kg;

//     const loss = await TransportLoss.create({
//       daily_operation_id: req.params.id,
//       chicken_type_id,
//       dead_weight,
//       price_per_kg,
//       loss_amount,
//       location
//     });

//     res.status(201).json({
//       success: true,
//       data: loss
//     });
//   } catch (error) {
//     res.status(500).json({
//       success: false,
//       message: 'Error recording transport loss'
//     });
//   }
// };

// ✅ Updated Transport Loss
// controllers/farmLoadingController.js


exports.recordFarmLoading = async (req, res) => {
  const dbTransaction = await sequelize.transaction();

  try {
    const { id } = req.params;
    const {
      vehicle_id,
      farm_id,
      chicken_type_id,
      empty_vehicle_weight,
      loaded_vehicle_weight,
      cage_count,
      cage_weight_per_unit,
      price_per_kg,
      paid_amount = 0,
      old_balance_paid = 0, // Can be positive for any direction
      is_debt_payment_only = false // New flag for debt-only transactions
    } = req.body;
    console.log("req.body",req.body);

    // ========================================
    // VALIDATION
    // ========================================
    
    // Validate operation exists and is open
    const operation = await DailyOperation.findByPk(id, { transaction: dbTransaction });
    
    if (!operation) {
      await dbTransaction.rollback();
      return res.status(404).json({
        success: false,
        message: 'Daily operation not found'
      });
    }
    
    if (operation.status !== 'OPEN') {
      await dbTransaction.rollback();
      return res.status(400).json({
        success: false,
        message: 'Operation is already closed'
      });
    }

    // Get farm with current balance
    const farm = await Farm.findByPk(farm_id, { transaction: dbTransaction });

    if (!farm) {
      await dbTransaction.rollback();
      return res.status(404).json({
        success: false,
        message: 'Farm not found'
      });
    }

    const previous_balance = parseFloat(farm.current_balance) || 0;

    // ========================================
    // DEBT PAYMENT ONLY (NO LOADING)
    // ========================================
    
    if (is_debt_payment_only) {
      if (old_balance_paid <= 0) {
        await dbTransaction.rollback();
        return res.status(400).json({
          success: false,
          message: 'Payment amount must be greater than 0 for debt payment'
        });
      }

      // // Determine payment direction based on current balance
      // let payment_direction;
      // let payment_description;
      
      // if (previous_balance > 0) {
      //   // Farm has RECEIVABLE (they owe us) → Farm pays us
      //   payment_direction = 'FROM_FARM';
      //   payment_description = `Farm payment toward debt of ${previous_balance.toFixed(2)} EGP`;
        
      //   // Validate payment doesn't exceed debt
      //   if (old_balance_paid > previous_balance) {
      //     await dbTransaction.rollback();
      //     return res.status(400).json({
      //       success: false,
      //       message: `Payment amount (${old_balance_paid}) exceeds current debt (${previous_balance})`,
      //       current_balance: previous_balance,
      //       max_payment: previous_balance
      //     });
      //   }
      // } else if (previous_balance < 0) {
      //   // Farm has PAYABLE (we owe them) → We pay farm
      //   payment_direction = 'TO_FARM';
      //   payment_description = `Payment to farm toward our debt of ${Math.abs(previous_balance).toFixed(2)} EGP`;
        
      //   // Validate payment doesn't exceed what we owe
      //   if (old_balance_paid > Math.abs(previous_balance)) {
      //     await dbTransaction.rollback();
      //     return res.status(400).json({
      //       success: false,
      //       message: `Payment amount (${old_balance_paid}) exceeds what we owe (${Math.abs(previous_balance)})`,
      //       current_balance: previous_balance,
      //       max_payment: Math.abs(previous_balance)
      //     });
      //   }
      // } else {
      //   // Balance is zero
      //   await dbTransaction.rollback();
      //   return res.status(400).json({
      //     success: false,
      //     message: 'No outstanding debt to pay',
      //     current_balance: 0
      //   });
      // }

      // // Create debt payment record
      // const debtPayment = await FarmDebtPayment.create({
      //   farm_id,
      //   daily_operation_id: id,
      //   amount: old_balance_paid,
      //   payment_direction,
      //   // payment_date: operation.operation_date,
      //   notes: payment_description
      // }, { transaction: dbTransaction });
// ========================================
// HANDLE OLD BALANCE PAYMENT (IF ANY)
// ========================================

let debtPayment = null;
let payment_direction;      // ← Move declaration here
let payment_description;    // ← Move declaration here

if (old_balance_paid > 0) {
  // Determine payment direction based on current balance
  
  if (previous_balance > 0) {
    // Farm has RECEIVABLE (they owe us) → Farm pays us
    payment_direction = 'FROM_FARM';
    payment_description = `الدفع أثناء تحميل الفراخ `;
    
    // Validate payment doesn't exceed debt
    if (old_balance_paid > previous_balance) {
      await dbTransaction.rollback();
      return res.status(400).json({
        success: false,
        message: `Old balance payment (${old_balance_paid}) exceeds current debt (${previous_balance})`,
        current_balance: previous_balance,
        max_payment: previous_balance
      });
    }
  } else if (previous_balance < 0) {
    // Farm has PAYABLE (we owe them) → We pay farm
    payment_direction = 'TO_FARM';
    payment_description = `الدفع أثناء تحميل الفراخ `;
    
    // Validate payment doesn't exceed what we owe
    if (old_balance_paid > Math.abs(previous_balance)) {
      await dbTransaction.rollback();
      return res.status(400).json({
        success: false,
        message: `Payment amount (${old_balance_paid}) exceeds what we owe (${Math.abs(previous_balance)})`,
        current_balance: previous_balance,
        max_payment: Math.abs(previous_balance)
      });
    }
  } else {
    // Balance is zero - no debt to pay
    await dbTransaction.rollback();
    return res.status(400).json({
      success: false,
      message: 'Cannot pay old balance: No outstanding debt exists',
      current_balance: 0
    });
  }
}

// ========================================
// CREATE FARM TRANSACTION
// ========================================

// const farmTransaction = await FarmTransaction.create({
//   // ... your existing code
// }, { transaction: dbTransaction });

// console.log("\ntrans\n", farmTransaction);

if (old_balance_paid > 0) {
  // Create debt payment record
  debtPayment = await FarmDebtPayment.create({
    farm_id,
    daily_operation_id: id,
    amount: old_balance_paid,
    payment_direction,        // ← Now accessible
    notes: payment_description  // ← Now accessible
  }, { transaction: dbTransaction });
}
      // Update farm balance
      const balanceInfo = await farm.updateBalance(debtPayment.balanceImpact, dbTransaction);

      await dbTransaction.commit();

      return res.status(201).json({
        success: true,
        message: 'Debt payment recorded successfully',
        data: {
          payment: {
            id: debtPayment.id,
            amount: debtPayment.amount,
            direction: debtPayment.payment_direction,
            date: debtPayment.payment_date,
            description: debtPayment.displayDescription
          },
          balance_info: {
            farm_id: balanceInfo.farm_id,
            farm_name: balanceInfo.farm_name,
            previous_balance: previous_balance,
            payment_amount: old_balance_paid,
            payment_direction,
            new_balance: balanceInfo.new_balance,
            balance_type: balanceInfo.new_type,
            direction_changed: balanceInfo.direction_changed,
            display_balance: balanceInfo.display_balance,
            ...(balanceInfo.direction_changed && {
              alert: `⚠️ Balance direction changed from ${balanceInfo.previous_type} to ${balanceInfo.new_type}`
            })
          }
        }
      });
    }

    // ========================================
    // FARM LOADING TRANSACTION (NORMAL FLOW)
    // ========================================

    if (!vehicle_id) {
      await dbTransaction.rollback();
      return res.status(400).json({
        success: false,
        message: 'vehicle_id is required for farm loading'
      });
    }

    if (!chicken_type_id) {
      await dbTransaction.rollback();
      return res.status(400).json({
        success: false,
        message: 'chicken_type_id is required for farm loading'
      });
    }

    // Validate vehicle assignment
    const vehicleAssignment = await VehicleOperation.findOne({
      where: {
        daily_operation_id: id,
        vehicle_id,
        status: 'ACTIVE'
      },
      transaction: dbTransaction
    });

    if (!vehicleAssignment) {
      await dbTransaction.rollback();
      return res.status(400).json({
        success: false,
        message: `Vehicle ${vehicle_id} is not assigned to this operation`
      });
    }

    // ========================================
    // WEIGHT CALCULATION
    // ========================================

    const totalCageWeight = cage_count * cage_weight_per_unit;
    const net_chicken_weight = loaded_vehicle_weight - empty_vehicle_weight - totalCageWeight;

    if (net_chicken_weight <= 0) {
      await dbTransaction.rollback();
      return res.status(400).json({
        success: false,
        message: 'Invalid weight calculation: net weight must be positive',
        debug: {
          loaded: loaded_vehicle_weight,
          empty: empty_vehicle_weight,
          cages: totalCageWeight,
          net: net_chicken_weight
        }
      });
    }

    // ========================================
    // PRICING CALCULATION
    // ========================================

    const total_amount = net_chicken_weight * price_per_kg;
    const remaining_amount = total_amount - paid_amount;
     
    // Get next sequence number
    const lastTransaction = await FarmTransaction.findOne({
      where: { daily_operation_id: id, vehicle_id },
      order: [['sequence_number', 'DESC']],
      transaction: dbTransaction
    });

    const sequence_number = (lastTransaction?.sequence_number || 0) + 1;

    // ========================================
    // HANDLE OLD BALANCE PAYMENT (IF ANY)
    // ========================================
 let payment_direction;
      let payment_description;
    let debtPayment = null;
    
    if (old_balance_paid > 0) {
      // Determine payment direction based on current balance
     
      
      if (previous_balance > 0) {
        // Farm has RECEIVABLE (they owe us) → Farm pays us
        payment_direction = 'FROM_FARM';
        console.log("sequence_number",sequence_number);
        
        payment_description = `الدفع أثناء تحميل المعاملة برقم ${sequence_number} في نفس اليوم ونفس المركبه`;
        
        // Validate payment doesn't exceed debt
        if (old_balance_paid > previous_balance) {
          await dbTransaction.rollback();
          return res.status(400).json({
            success: false,
            message: `Old balance payment (${old_balance_paid}) exceeds current debt (${previous_balance})`,
            current_balance: previous_balance,
            max_payment: previous_balance
          });
        }
      } else if (previous_balance < 0) {
        // Farm has PAYABLE (we owe them) → We pay farm
        payment_direction = 'TO_FARM';
        payment_description = `Payment to farm during loading transaction #${sequence_number}`;
        
        // Validate payment doesn't exceed what we owe
        if (old_balance_paid > Math.abs(previous_balance)) {
          await dbTransaction.rollback();
          return res.status(400).json({
            success: false,
            message: `Payment amount (${old_balance_paid}) exceeds what we owe (${Math.abs(previous_balance)})`,
            current_balance: previous_balance,
            max_payment: Math.abs(previous_balance)
          });
        }
      } else {
        // Balance is zero - no debt to pay
        await dbTransaction.rollback();
        return res.status(400).json({
          success: false,
          message: 'Cannot pay old balance: No outstanding debt exists',
          current_balance: 0
        });
      }
    }
    
    const farmTransaction = await FarmTransaction.create({
      daily_operation_id: id,
      vehicle_id,
      farm_id,
      vehicle_operation_id: vehicleAssignment.id,
      chicken_type_id,
      sequence_number,
      empty_vehicle_weight,
      loaded_vehicle_weight,
      cage_count,
      cage_weight_per_unit,
      net_chicken_weight,
      price_per_kg,
      total_amount,
      paid_amount,
      remaining_amount,
      used_credit:0
    }, { transaction: dbTransaction });
    console.log("\ntrans\n",farmTransaction);

    if (old_balance_paid > 0) {
    // Create debt payment record
      debtPayment = await FarmDebtPayment.create({
        farm_id,
        daily_operation_id: id,
        amount: old_balance_paid,
        payment_direction,
        createdAt: farmTransaction.transaction_time,
        notes: payment_description
      }, { transaction: dbTransaction });
    }
const debt_payment_impact = debtPayment ? debtPayment.balanceImpact : 0;
let total_balance_change=previous_balance+debt_payment_impact
    let used_credit = 0;

    // If farm has PAYABLE balance (we owe them) AND there's remaining amount
    if (total_balance_change > 0 && remaining_amount > 0) {
      const available_credit = Math.abs(total_balance_change);  // How much we owe them
      
      // Use credit up to the available amount or remaining amount, whichever is smaller
      used_credit = Math.min(available_credit, remaining_amount);
      console.log("\nin used_credit\n");
      
    }
    // Adjust remaining amount after using credit
    const final_remaining_amount = remaining_amount - used_credit;
    if(used_credit!=0){
         await farmTransaction.update(
          {
            remaining_amount: final_remaining_amount,
            used_credit: used_credit
          },
          { transaction: dbTransaction }
        );
    }
    // ========================================
    // UPDATE FARM BALANCE
    // ========================================

    // Calculate total balance impact:
    // 1. Add/subtract old_balance_paid based on direction (handled by balanceImpact getter)
    // 2. Add remaining_amount (new debt they owe us if positive, or we owe them if negative)
    
    
    total_balance_change = debt_payment_impact -used_credit - final_remaining_amount;
    console.log("\n\nprevious_balance",previous_balance,"\n\n");
    console.log("\n\ndebt_payment_impact",debt_payment_impact,"\n\n");
    console.log("\n\ninal_remaining_amount",final_remaining_amount,"\n\n");
    console.log("\n\nused_credit",used_credit,"\n\n");
    console.log("\n\ntotal_balance_change",total_balance_change,"\n\n");
    
    const balanceInfo = await farm.updateBalance(total_balance_change, dbTransaction);

    // ========================================
    // COMMIT TRANSACTION
    // ========================================

    await dbTransaction.commit();

    // ========================================
    // FETCH COMPLETE RESULT
    // ========================================

    const result = await FarmTransaction.findByPk(farmTransaction.id, {
      include: [
        { 
          model: Farm, 
          as: 'farm',
          attributes: ['id', 'name', 'current_balance']
        },
        { 
          model: ChickenType, 
          as: 'chicken_type',
          attributes: ['id', 'name']
        },
        { 
          model: Vehicle, 
          as: 'vehicle',
          attributes: ['id', 'name', 'plate_number']
        }
      ]
    });

    // ========================================
    // RESPONSE WITH COMPLETE INFO
    // ========================================

    res.status(201).json({
      success: true,
      message: 'Farm loading recorded successfully',
      data: {
        transaction: result,
        
        // Balance information
        balance_info: {
          farm_id: balanceInfo.farm_id,
          farm_name: balanceInfo.farm_name,
          previous_balance: previous_balance,
          
          // Breakdown of changes
          changes: {
            old_balance_paid: old_balance_paid,
            old_balance_direction: debtPayment?.payment_direction || null,
            new_transaction_debt: remaining_amount,
            net_change: total_balance_change,
            used_credit
          },
          
          new_balance: balanceInfo.new_balance,
          balance_type: balanceInfo.new_type,
          direction_changed: balanceInfo.direction_changed,
          display_balance: balanceInfo.display_balance,
          
          // Alert if direction changed
          ...(balanceInfo.direction_changed && {
            alert: `⚠️ Balance direction changed from ${balanceInfo.previous_type} to ${balanceInfo.new_type}`
          })
        },

        // Debt payment record (if any)
        ...(debtPayment && {
          debt_payment: {
            id: debtPayment.id,
            amount: debtPayment.amount,
            direction: debtPayment.payment_direction,
            date: debtPayment.payment_date,
            description: debtPayment.displayDescription
          }
        })
      }
    });

  } catch (error) {
    // Rollback if transaction is still active
    if (!dbTransaction.finished) {
      await dbTransaction.rollback();
    }
    
    console.error('Error recording farm loading:', error);
    
    res.status(500).json({
      success: false,
      message: 'Error recording farm loading',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// exports.recordTransportLoss = async (req, res) => {
//     const dbTransaction = await sequelize.transaction();
//   try {
// const { vehicle_id, chicken_type_id, dead_weight, price_per_kg, location } = req.body;

// if (!vehicle_id) return res.status(400).json({ success: false, message: 'vehicle_id is required' });

// const vehicleAssignment = await VehicleOperation.findOne({
//   where: { daily_operation_id: req.params.id, vehicle_id, status: 'ACTIVE' }
// });

// if (!vehicleAssignment) return res.status(400).json({
//   success: false,
//   message: `Vehicle ${vehicle_id} is not assigned to this operation`
// });

// const loss_amount = dead_weight * price_per_kg;

// const loss = await TransportLoss.create({
//   daily_operation_id: req.params.id,
//   vehicle_id,
//   vehicle_operation_id: vehicleAssignment.id,
//   chicken_type_id,
//   dead_weight,
//   price_per_kg,
//   loss_amount,
//   location
// }, { transaction: dbTransaction });
//     await dbTransaction.commit();

//     res.status(201).json({
//       success: true,
//       data: loss
//     });
//   } catch (error) {
//     await dbTransaction.rollback();
//     res.status(500).json({
//       success: false,
//       message: 'Error recording transport loss',
//       error: error.message
//     });
//   }
// };
// Record daily cost
// exports.recordDailyCost = async (req, res) => {
//   try {
//     const operation = await DailyOperation.findByPk(req.params.id);

//     if (!operation || operation.status === 'CLOSED') {
//       return res.status(400).json({
//         success: false,
//         message: 'العملية غير موجودة أو مغلقة بالفعل'
//       });
//     }

//     const cost = await DailyCost.create({
//       daily_operation_id: req.params.id,
//       ...req.body
//     });

//     res.status(201).json({
//       success: true,
//       data: cost
//     });
//   } catch (error) {
//     res.status(500).json({
//       success: false,
//       message: 'Error recording cost'
//     });
//   }
// };


exports.recordTransportLoss = async (req, res) => {
  const dbTransaction = await sequelize.transaction();
  
  try {
    const { 
      vehicle_id, 
      chicken_type_id, 
      dead_weight, 
      price_per_kg, 
      location,
      farm_id,  // ✅ OPTIONAL: Farm responsible for loss
      notes 
    } = req.body;

    // Validate required fields
    if (!vehicle_id) {
      return res.status(400).json({ 
        success: false, 
        message: 'vehicle_id is required' 
      });
    }

    if (!chicken_type_id || !dead_weight || !price_per_kg) {
      return res.status(400).json({
        success: false,
        message: 'chicken_type_id, dead_weight, and price_per_kg are required'
      });
    }

    // Verify vehicle is assigned to this operation
    const vehicleAssignment = await VehicleOperation.findOne({
      where: { 
        daily_operation_id: req.params.id, 
        vehicle_id, 
        status: 'ACTIVE' 
      },
      transaction: dbTransaction
    });

    if (!vehicleAssignment) {
      await dbTransaction.rollback();
      return res.status(400).json({
        success: false,
        message: `Vehicle ${vehicle_id} is not assigned to this operation or is not active`
      });
    }

    // Calculate loss amount
    const loss_amount = parseFloat(dead_weight) * parseFloat(price_per_kg);

    // ✅ If farm_id provided, verify farm exists and adjust balance
    let farmBalanceInfo = null;
 
    if (farm_id) {
      const farm = await Farm.findByPk(farm_id, { transaction: dbTransaction });
      
      if (!farm) {
        await dbTransaction.rollback();
        return res.status(404).json({
          success: false,
          message: `Farm with id ${farm_id} not found`
        });
      }

      // ✅ INCREASE FARM BALANCE (Farm owes us for the loss)
      // Positive balance = Farm owes us (RECEIVABLE)
      farmBalanceInfo = await farm.updateBalance(loss_amount, dbTransaction);
     }

    // Create transport loss record
    const loss = await TransportLoss.create({
      daily_operation_id: req.params.id,
      vehicle_id,
      vehicle_operation_id: vehicleAssignment.id,
      chicken_type_id,
      farm_id: farm_id || null,
      dead_weight,
      price_per_kg,
      loss_amount,
      location,
       notes
    }, { transaction: dbTransaction });

    await dbTransaction.commit();

    // Prepare response
    const response = {
      success: true,
      message: 'Transport loss recorded successfully',
      data: {
        loss: {
          id: loss.id,
          daily_operation_id: loss.daily_operation_id,
          vehicle_id: loss.vehicle_id,
          chicken_type_id: loss.chicken_type_id,
          farm_id: loss.farm_id,
          dead_weight: parseFloat(loss.dead_weight),
          price_per_kg: parseFloat(loss.price_per_kg),
          loss_amount: parseFloat(loss.loss_amount),
          location: loss.location,
           recorded_at: loss.recorded_at
        }
      }
    };

    // ✅ Include farm balance update info if applicable
    if (farmBalanceInfo) {
      response.data.farm_balance_update = farmBalanceInfo;
      response.message += ` - Farm balance updated: ${farmBalanceInfo.display_balance}`;
    }

    res.status(201).json(response);

  } catch (error) {
    await dbTransaction.rollback();
    console.error('Error recording transport loss:', error);
    res.status(500).json({
      success: false,
      message: 'Error recording transport loss',
      error: error.message
    });
  }
};

exports.recordDailyCost = async (req, res) => {
  const dbTransaction = await sequelize.transaction();

  try {
    const { vehicle_id, cost_category_id, amount, description } = req.body;

    // ✅ تحقق من العملية
    const operation = await DailyOperation.findByPk(req.params.id);
    if (!operation || operation.status === 'CLOSED') {
      return res.status(400).json({
        success: false,
        message: 'العملية غير موجودة أو مغلقة بالفعل'
      });
    }
let vehicleAssignment;
    // ✅ لو تم تمرير vehicle_id، تحقق أن المركبة مسجلة في العملية
    if (vehicle_id) {
       
        vehicleAssignment = await VehicleOperation.findOne({
        where: {
          daily_operation_id: req.params.id,
          vehicle_id,
          status: 'ACTIVE'
        }
      });

      if (!vehicleAssignment) {
        return res.status(400).json({
          success: false,
          message: `Vehicle ${vehicle_id} is not assigned to this operation`
        });
      }
    
    }

    // ✅ إنشاء التكلفة
    const cost = await DailyCost.create({
      daily_operation_id: req.params.id,
      vehicle_id: vehicle_id || null,  // ✅ اختياري
     vehicle_operation_id: vehicleAssignment ? vehicleAssignment.id : null,
      cost_category_id,
      amount,
      description
    }, { transaction: dbTransaction });
// Reload to include category
    const costWithCategory = await DailyCost.findByPk(cost.id, {
      include: [{ model: CostCategory, as: 'category' }
        ,    { model: Vehicle, as: 'vehicle' }  
      ],transaction: dbTransaction
    });

    await dbTransaction.commit();
    console.log("cost",cost);
    console.log("costWithCategory",costWithCategory);
    
    res.status(201).json({
      success: true,
      data: costWithCategory
    });
  } catch (error) {
    await dbTransaction.rollback();
    res.status(500).json({
      success: false,
      message: 'Error recording cost',
      error:error.message
    });
  }
};

// Record sale
// exports.recordSale = async (req, res) => {
//   const transaction = await sequelize.transaction();
  
//   try {
//     const operation = await DailyOperation.findByPk(req.params.id);

//     if (!operation || operation.status === 'CLOSED') {
//       await transaction.rollback();
//       return res.status(400).json({
//         success: false,
//         message: 'العملية غير موجودة أو مغلقة بالفعل'
//       });
//     }

//     const {
//       buyer_id,
//       chicken_type_id,
//       loaded_cages_weight,
//       empty_cages_weight,
//       cage_count,
//       price_per_kg,
//       paid_amount,
//       old_debt_paid = 0
//     } = req.body;

//     // Calculate net weight
//     const net_chicken_weight = loaded_cages_weight - empty_cages_weight;
//     const total_amount = net_chicken_weight * price_per_kg;
//     const remaining_amount = total_amount - paid_amount;

//     // Get sequence number
//     const count = await SaleTransaction.count({
//       where: { daily_operation_id: req.params.id }
//     });

//     const sale = await SaleTransaction.create({
//       daily_operation_id: req.params.id,
//       buyer_id,
//       chicken_type_id,
//       sequence_number: count + 1,
//       loaded_cages_weight,
//       empty_cages_weight,
//       cage_count,
//       net_chicken_weight,
//       price_per_kg,
//       total_amount,
//       paid_amount,
//       remaining_amount,
//       old_debt_paid
//     }, { transaction });

//     // Update buyer debt
//     const buyer = await Buyer.findByPk(buyer_id);
//     const newDebt = parseFloat(buyer.total_debt) - parseFloat(old_debt_paid) + parseFloat(remaining_amount);
//     await buyer.update({
//       total_debt: newDebt
//     }, { transaction });

//     await transaction.commit();

//     res.status(201).json({
//       success: true,
//       data: sale
//     });
//   } catch (error) {
//     await transaction.rollback();
//     res.status(500).json({
//       success: false,
//       message: 'Error recording sale',
//       error: error.message
//     });
//   }
// };
// exports.recordSale = async (req, res) => {
//   const transaction = await sequelize.transaction();

//   try {
//     const operation = await DailyOperation.findByPk(req.params.id);

//     if (!operation || operation.status === 'CLOSED') {
//       await transaction.rollback();
//       return res.status(400).json({
//         success: false,
//         message: 'العملية غير موجودة أو مغلقة بالفعل'
//       });
//     }

//     const {
//       vehicle_id,       // ✅ جديد
//       buyer_id,
//       chicken_type_id,
//       loaded_cages_weight,
//       empty_cages_weight,
//       cage_count,
//       price_per_kg,
//       paid_amount,
//       old_debt_paid = 0
//     } = req.body;

//     // ✅ تحقق من وجود vehicle_id
//     if (!vehicle_id) {
//       await transaction.rollback();
//       return res.status(400).json({
//         success: false,
//         message: 'vehicle_id is required'
//       });
//     }

//     // ✅ تحقق من أن المركبة مسجلة وفعالة للعملية
//     const vehicleAssignment = await VehicleOperation.findOne({
//       where: {
//         daily_operation_id: req.params.id,
//         vehicle_id,
//         status: 'ACTIVE'
//       }
//     });

//     if (!vehicleAssignment) {
//       await transaction.rollback();
//       return res.status(400).json({
//         success: false,
//         message: `Vehicle ${vehicle_id} is not assigned to this operation`
//       });
//     }

//     // حساب الوزن الصافي والمبالغ
//     const net_chicken_weight = loaded_cages_weight - empty_cages_weight;
//     const total_amount = net_chicken_weight * price_per_kg;
//     const remaining_amount = total_amount - paid_amount;

//     // تسلسل المعاملات لكل عملية ومركبة
//     const lastTransaction = await SaleTransaction.findOne({
//       where: { daily_operation_id: req.params.id, vehicle_id },
//       order: [['sequence_number', 'DESC']]
//     });
//     const sequence_number = (lastTransaction?.sequence_number || 0) + 1;

//     // إنشاء المعاملة
//     const sale = await SaleTransaction.create({
//       daily_operation_id: req.params.id,
//       vehicle_id,         // ✅ جديد
//       buyer_id,
//       vehicle_operation_id: vehicleAssignment.id,
//       chicken_type_id,
//       sequence_number,
//       loaded_cages_weight,
//       empty_cages_weight,
//       cage_count,
//       net_chicken_weight,
//       price_per_kg,
//       total_amount,
//       paid_amount,
//       remaining_amount,
//       old_debt_paid
//     }, { transaction });

//     // تحديث ديون المشتري
//     const buyer = await Buyer.findByPk(buyer_id);
//     const newDebt = parseFloat(buyer.total_debt) - parseFloat(old_debt_paid) + parseFloat(remaining_amount);
//     await buyer.update({ total_debt: newDebt }, { transaction });

//     await transaction.commit();

//     res.status(201).json({
//       success: true,
//       data: sale
//     });
//   } catch (error) {
//     await transaction.rollback();
//     res.status(500).json({
//       success: false,
//       message: 'Error recording sale',
//       error: error.message
//     });
//   }
// };
exports.recordSale = async (req, res) => {
  const dbTransaction = await sequelize.transaction();

  try {
    const { id } = req.params;
    const {
      vehicle_id,
      buyer_id,
      chicken_type_id,
      loaded_cages_weight,
      empty_cages_weight,
      cage_count,
      price_per_kg,
      paid_amount = 0,
      old_debt_paid = 0,
      is_debt_payment_only = false  // ✅ Support debt payment only
    } = req.body;

    // ========================================
    // VALIDATION
    // ========================================
    
    const operation = await DailyOperation.findByPk(id, { transaction: dbTransaction });

    if (!operation) {
      await dbTransaction.rollback();
      return res.status(404).json({
        success: false,
        message: 'Daily operation not found'
      });
    }

    if (operation.status === 'CLOSED') {
      await dbTransaction.rollback();
      return res.status(400).json({
        success: false,
        message: 'Operation is already closed'
      });
    }

    // Get buyer with current balance
    const buyer = await Buyer.findByPk(buyer_id, { transaction: dbTransaction });

    if (!buyer) {
      await dbTransaction.rollback();
      return res.status(404).json({
        success: false,
        message: 'Buyer not found'
      });
    }

    const previous_balance = parseFloat(buyer.total_debt) || 0;

    // ========================================
    // DEBT PAYMENT ONLY (NO SALE)
    // ========================================

    if (is_debt_payment_only) {
      if (old_debt_paid <= 0) {
        await dbTransaction.rollback();
        return res.status(400).json({
          success: false,
          message: 'Payment amount must be greater than 0 for debt payment'
        });
      }

      // Buyer can only have positive balance (they owe us)
      if (previous_balance <= 0) {
        await dbTransaction.rollback();
        return res.status(400).json({
          success: false,
          message: 'Buyer has no outstanding debt to pay',
          total_debt: previous_balance
        });
      }

      // Validate payment doesn't exceed debt
      if (old_debt_paid > previous_balance) {
        await dbTransaction.rollback();
        return res.status(400).json({
          success: false,
          message: `Payment amount (${old_debt_paid}) exceeds current debt (${previous_balance})`,
          total_debt: previous_balance,
          max_payment: previous_balance
        });
      }

      // Create debt payment record
      const debtPayment = await BuyerDebtPayment.create({
        buyer_id,
        daily_operation_id: id,
        amount: old_debt_paid,
        payment_direction: 'FROM_BUYER',  // Always FROM_BUYER
        // payment_date: operation.operation_date,
        notes: `Buyer payment toward debt of ${previous_balance.toFixed(2)} EGP`
      }, { transaction: dbTransaction });

      // Update buyer balance (reduce their debt)
      const new_balance = previous_balance - old_debt_paid;
      await buyer.update({ total_debt: new_balance }, { transaction: dbTransaction });

      await dbTransaction.commit();

      return res.status(201).json({
        success: true,
        message: 'Debt payment recorded successfully',
        data: {
          payment: {
            id: debtPayment.id,
            amount: debtPayment.amount,
            date: debtPayment.payment_date
          },
          balance_info: {
            buyer_id: buyer.id,
            buyer_name: buyer.name,
            previous_balance: previous_balance,
            payment_amount: old_debt_paid,
            new_balance: new_balance,
            is_settled: new_balance === 0
          }
        }
      });
    }

    // ========================================
    // SALE TRANSACTION (NORMAL FLOW)
    // ========================================

    if (!vehicle_id) {
      await dbTransaction.rollback();
      return res.status(400).json({
        success: false,
        message: 'vehicle_id is required for sale'
      });
    }

    if (!chicken_type_id) {
      await dbTransaction.rollback();
      return res.status(400).json({
        success: false,
        message: 'chicken_type_id is required for sale'
      });
    }

    // Validate vehicle assignment
    const vehicleAssignment = await VehicleOperation.findOne({
      where: {
        daily_operation_id: id,
        vehicle_id,
        status: 'ACTIVE'
      },
      transaction: dbTransaction
    });

    if (!vehicleAssignment) {
      await dbTransaction.rollback();
      return res.status(400).json({
        success: false,
        message: `Vehicle ${vehicle_id} is not assigned to this operation`
      });
    }

    // ========================================
    // WEIGHT & PRICING CALCULATION
    // ========================================

    const net_chicken_weight = loaded_cages_weight - empty_cages_weight;
    
    if (net_chicken_weight <= 0) {
      await dbTransaction.rollback();
      return res.status(400).json({
        success: false,
        message: 'Net weight must be positive'
      });
    }

    const total_amount = net_chicken_weight * price_per_kg;
    const remaining_amount = total_amount - paid_amount;

    // Get next sequence number
    const lastTransaction = await SaleTransaction.findOne({
      where: { daily_operation_id: id, vehicle_id },
      order: [['sequence_number', 'DESC']],
      transaction: dbTransaction
    });

    const sequence_number = (lastTransaction?.sequence_number || 0) + 1;

    // ========================================
    // HANDLE OLD BALANCE PAYMENT (IF ANY)
    // ========================================

    let debtPaymentRecord = null;
    
    if (old_debt_paid > 0) {
      // Buyer can only have positive balance (they owe us)
      if (previous_balance <= 0) {
        await dbTransaction.rollback();
        return res.status(400).json({
          success: false,
          message: 'Cannot pay old balance: Buyer has no outstanding debt',
          total_debt: previous_balance
        });
      }

      // Validate payment doesn't exceed debt
      if (old_debt_paid > previous_balance) {
        await dbTransaction.rollback();
        return res.status(400).json({
          success: false,
          message: `Old balance payment (${old_debt_paid}) exceeds current debt (${previous_balance})`,
          total_debt: previous_balance,
          max_payment: previous_balance
        });
      }

      // // Create debt payment record
      // debtPaymentRecord = await BuyerDebtPayment.create({
      //   buyer_id,
      //   daily_operation_id: id,
      //   amount: old_debt_paid,
      //   payment_direction: 'FROM_BUYER',
      //   // payment_date: operation.operation_date,
      //   notes: `Payment during sale transaction #${sequence_number}`
      // }, { transaction: dbTransaction });
    }

    // ========================================
    // CREATE SALE TRANSACTION
    // ========================================

    const sale = await SaleTransaction.create({
      daily_operation_id: id,
      vehicle_id,
      buyer_id,
      vehicle_operation_id: vehicleAssignment.id,
      chicken_type_id,
      sequence_number,
      loaded_cages_weight,
      empty_cages_weight,
      cage_count,
      net_chicken_weight,
      price_per_kg,
      total_amount,
      paid_amount,
      remaining_amount,
      old_debt_paid: old_debt_paid
    }, { transaction: dbTransaction });
if (old_debt_paid > 0) {
  debtPaymentRecord = await BuyerDebtPayment.create({
    buyer_id,
    daily_operation_id: id,
    amount: old_debt_paid,
    payment_direction: 'FROM_BUYER',
    createdAt: sale.transaction_time, // ✅ نفس توقيت البيع
    notes: `الدفع أثناء معاملة البيع برقم ${sequence_number} في نفس اليوم ونفس المركبه`
  }, { transaction: dbTransaction });
}

    // ========================================
    // UPDATE BUYER BALANCE
    // ========================================

    // Balance calculation:
    // - Subtract old_debt_paid (buyer pays old debt)
    // + Add remaining_amount (new debt created)
    const balance_change = remaining_amount - old_debt_paid;
    const new_balance = previous_balance + balance_change;

    await buyer.update({ total_debt: new_balance }, { transaction: dbTransaction });

    // ========================================
    // COMMIT TRANSACTION
    // ========================================

    await dbTransaction.commit();

    // ========================================
    // FETCH COMPLETE RESULT
    // ========================================

    const result = await SaleTransaction.findByPk(sale.id, {
      include: [
        { 
          model: Buyer, 
          as: 'buyer',
          attributes: ['id', 'name', 'total_debt']
        },
        { 
          model: ChickenType, 
          as: 'chicken_type',
          attributes: ['id', 'name']
        },
        { 
          model: Vehicle, 
          as: 'vehicle',
          attributes: ['id', 'name', 'plate_number']
        }
      ]
    });

    // ========================================
    // RESPONSE
    // ========================================

    res.status(201).json({
      success: true,
      message: 'Sale recorded successfully',
      data: {
        transaction: result,
        balance_info: {
          buyer_id: buyer.id,
          buyer_name: buyer.name,
          previous_balance: previous_balance,
          changes: {
            old_debt_paid: old_debt_paid,
            new_transaction_debt: remaining_amount,
            net_change: balance_change
          },
          new_balance: new_balance,
          is_settled: new_balance === 0
        },
        ...(debtPaymentRecord && {
          debt_payment: {
            id: debtPaymentRecord.id,
            amount: debtPaymentRecord.amount,
            date: debtPaymentRecord.payment_date,
            description: `Received ${Number(debtPaymentRecord.amount).toFixed(2)} EGP from buyer`
          }
        })
      }
    });

  } catch (error) {
    if (!dbTransaction.finished) {
      await dbTransaction.rollback();
    }
    
    console.error('Error recording sale:', error);
    
    res.status(500).json({
      success: false,
      message: 'Error recording sale',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};
// Close daily operation
exports.closeDailyOperation = async (req, res) => {
  const transaction = await sequelize.transaction();
  
  try {
    const operation = await DailyOperation.findByPk(req.params.id);

    if (!operation) {
      await transaction.rollback();
      return res.status(404).json({
        success: false,
        message: 'Operation not found'
      });
    }

    if (operation.status === 'CLOSED') {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: 'Operation already closed'
      });
    }

    // Calculate and distribute profits
    const profitDistribution = await ProfitService.closeOperation(req.params.id,transaction);

    // Update operation status
    await operation.update({
      status: 'CLOSED',
      closed_at: new Date().toLocaleString('en-GB', { timeZone: 'Africa/Cairo' })
    }, { transaction });

    await transaction.commit();

    res.json({
      success: true,
      data: profitDistribution
    });
  } catch (error) {
    await transaction.rollback();
    res.status(500).json({
      success: false,
      message: 'Error closing operation',
      error: error.message,
    });
  }
};

 
// Get chicken types
exports.getChickenTypes = async (req, res) => {
  try {
    const { ChickenType } = require('../models');
    const types = await ChickenType.findAll({
      order: [['name', 'ASC']]
    });

    res.json({
      success: true,
      data: types
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching chicken types'
    });
  }
};

// Create chicken type
exports.createChickenType = async (req, res) => {
  try {
    const { ChickenType } = require('../models');
    const type = await ChickenType.create(req.body);

    res.status(201).json({
      success: true,
      data: type
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error creating chicken type'
    });
  }
};

// Get single chicken type
exports.getChickenTypeById = async (req, res) => {
  try {
    const { ChickenType } = require('../models');
    const type = await ChickenType.findByPk(req.params.id);

    if (!type) {
      return res.status(404).json({
        success: false,
        message: 'Chicken type not found'
      });
    }

    res.json({ success: true, data: type });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching chicken type',
      error: error.message
    });
  }
};

// Update chicken type
exports.updateChickenType = async (req, res) => {
  try {
    const { ChickenType } = require('../models');
    const type = await ChickenType.findByPk(req.params.id);

    if (!type) {
      return res.status(404).json({
        success: false,
        message: 'Chicken type not found'
      });
    }

    await type.update(req.body);

    res.json({ success: true, data: type });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error updating chicken type',
      error: error.message
    });
  }
};

// Delete chicken type
exports.deleteChickenType = async (req, res) => {
  try {
    const { ChickenType } = require('../models');
    const type = await ChickenType.findByPk(req.params.id);

    if (!type) {
      return res.status(404).json({
        success: false,
        message: 'Chicken type not found'
      });
    }

    await type.destroy();

    res.json({ success: true, message: 'Chicken type deleted' });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error deleting chicken type',
      error: error.message
    });
  }
};


// Get cost categories
exports.getCostCategories = async (req, res) => {
  try {
    const categories = await CostCategory.findAll({
      include: [
        {
          model: DailyCost,
          as: 'costs',
          attributes: [],
          required: false
        }
      ],
      attributes: {
        include: [
          [
            CostCategory.sequelize.fn('COUNT', CostCategory.sequelize.col('costs.id')),
            'usage_count'
          ]
        ]
      },
      group: ['CostCategory.id'],
      order: [
        ['is_vehicle_cost', 'DESC'],
        ['name', 'ASC']
      ]
    });

    res.json({
      success: true,
      data: categories
    });
  } catch (error) {
    console.error('Error fetching cost categories:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching cost categories',
      error: error.message
    });
  }
};
exports.getPaginationCostCategories = async (req, res) => {
  try {
    const { page = 1, limit = 50, search, type_cost } = req.query;
    
    const offset = (parseInt(page) - 1) * parseInt(limit);
    
    const where = {};
    
    // Search filter
    if (search) {
      where[Op.or] = [
        { name: { [Op.iLike]: `%${search}%` } },
        { description: { [Op.iLike]: `%${search}%` } }
      ];
    }
    
    // Vehicle cost filter
    if (type_cost === 'vehicle') {
      where.is_vehicle_cost = true;
    } else   if (type_cost === 'vehicle') {
      where.is_vehicle_cost = false;
    } 
    console.log(where);
    
    const { count, rows: categories } = await CostCategory.findAndCountAll({
      where,
      include: [
        {
          model: DailyCost,
          as: 'costs',
          attributes: [],
          required: false
        }
      ],
      attributes: {
        include: [
          [
            CostCategory.sequelize.fn('COUNT', CostCategory.sequelize.col('costs.id')),
            'usage_count'
          ]
        ]
      },
      group: ['CostCategory.id'],
      order: [
        ['is_vehicle_cost', 'DESC'],
        ['name', 'ASC']
      ],
      limit: parseInt(limit),
      offset,
      subQuery: false
    });
    console.log("categories",categories);
    
    res.json({
      success: true,
      data: {
        items: categories,
        pagination: {
          total: count.length || 0,
          page: parseInt(page),
          limit: parseInt(limit),
          total_pages: Math.ceil((count.length || 0) / parseInt(limit))
        }
      }
    });
    
  } catch (error) {
    console.error('Error fetching cost categories:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching cost categories',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};
// ========================================
// CREATE COST CATEGORY
// ========================================
exports.createCostCategory = async (req, res) => {
  try {
    const { name, description, is_vehicle_cost } = req.body;

    // Validation
    if (!name || name.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Category name is required'
      });
    }

    // Check for duplicate name
    const existing = await CostCategory.findOne({
      where: { name: name.trim() }
    });

    if (existing) {
      return res.status(409).json({
        success: false,
        message: 'Cost category with this name already exists'
      });
    }

    const category = await CostCategory.create({
      name: name.trim(),
      description: description?.trim() || null,
      is_vehicle_cost: is_vehicle_cost || false
    });

    res.status(201).json({
      success: true,
      data: category,
      message: 'Cost category created successfully'
    });
  } catch (error) {
    console.error('Error creating cost category:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating cost category',
      error: error.message
    });
  }
};

// ========================================
// GET COST CATEGORY BY ID
// ========================================
exports.getCostCategory = async (req, res) => {
  try {
    const { id } = req.params;

    const category = await CostCategory.findByPk(id, {
      include: [
        {
          model: DailyCost,
          as: 'costs',
          attributes: [],
          required: false
        }
      ],
      attributes: {
        include: [
          [
            CostCategory.sequelize.fn('COUNT', CostCategory.sequelize.col('costs.id')),
            'usage_count'
          ],
          [
            CostCategory.sequelize.fn('SUM', CostCategory.sequelize.col('costs.amount')),
            'total_amount'
          ]
        ]
      },
      group: ['CostCategory.id']
    });

    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Cost category not found'
      });
    }

    res.json({
      success: true,
      data: category
    });
  } catch (error) {
    console.error('Error fetching cost category:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching cost category',
      error: error.message
    });
  }
};

// ========================================
// UPDATE COST CATEGORY
// ========================================
exports.updateCostCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, is_vehicle_cost } = req.body;

    const category = await CostCategory.findByPk(id);

    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Cost category not found'
      });
    }

    // Check if name is being changed and if it conflicts
    if (name && name.trim() !== category.name) {
      const existing = await CostCategory.findOne({
        where: {
          name: name.trim(),
          id: { [Op.ne]: id }
        }
      });

      if (existing) {
        return res.status(409).json({
          success: false,
          message: 'Another cost category with this name already exists'
        });
      }
    }

    // Update fields
    const updateData = {};
    if (name !== undefined) updateData.name = name.trim();
    if (description !== undefined) updateData.description = description?.trim() || null;
    if (is_vehicle_cost !== undefined) updateData.is_vehicle_cost = is_vehicle_cost;

    await category.update(updateData);

    res.json({
      success: true,
      data: category,
      message: 'Cost category updated successfully'
    });
  } catch (error) {
    console.error('Error updating cost category:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating cost category',
      error: error.message
    });
  }
};

// ========================================
// DELETE COST CATEGORY
// ========================================
exports.deleteCostCategory = async (req, res) => {
  try {
    const { id } = req.params;

    const category = await CostCategory.findByPk(id);

    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Cost category not found'
      });
    }

    // Check if category is in use
    const usageCount = await DailyCost.count({
      where: { cost_category_id: id }
    });

    if (usageCount > 0) {
      return res.status(409).json({
        success: false,
        message: `Cannot delete cost category. It is used in ${usageCount} cost record(s)`,
        usage_count: usageCount
      });
    }

    await category.destroy();

    res.json({
      success: true,
      message: 'Cost category deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting cost category:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting cost category',
      error: error.message
    });
  }
};

// ========================================
// GET COST CATEGORIES BY TYPE (NEW)
// ========================================
exports.getCostCategoriesByType = async (req, res) => {
  try {
    const { type } = req.params; // 'vehicle' or 'general'

    const isVehicleCost = type === 'vehicle';

    const categories = await CostCategory.findAll({
      where: { is_vehicle_cost: isVehicleCost },
      order: [['name', 'ASC']]
    });

    res.json({
      success: true,
      data: categories,
      type: type
    });
  } catch (error) {
    console.error('Error fetching cost categories by type:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching cost categories',
      error: error.message
    });
  }
};

// ========================================
// GET COST STATISTICS (NEW)
// ========================================
exports.getCostCategoryStatistics = async (req, res) => {
  try {
    const { id } = req.params;
    const { start_date, end_date } = req.query;

    const category = await CostCategory.findByPk(id);

    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Cost category not found'
      });
    }

    // Build date filter
    const dateFilter = {};
    if (start_date && end_date) {
      dateFilter.recorded_at = {
        [Op.between]: [new Date(start_date).toLocaleString('en-GB', { timeZone: 'Africa/Cairo' }), new Date(end_date).toLocaleString('en-GB', { timeZone: 'Africa/Cairo' })]
      };
    }

    // Get statistics
    const costs = await DailyCost.findAll({
      where: {
        cost_category_id: id,
        ...dateFilter
      },
      include: [
        {
          model: DailyOperation,
          as: 'operation',
          attributes: ['id', 'operation_date', 'status']
        },
        {
          model: Vehicle,
          as: 'vehicle',
          attributes: ['id', 'name', 'plate_number'],
          required: false
        },
        {
          model: VehicleOperation,
          as: 'vehicle_operation',
          include: [
            {
              model: Vehicle,
              as: 'vehicle',
              attributes: ['id', 'name', 'plate_number']
            }
          ],
          required: false
        }
      ],
      order: [['recorded_at', 'DESC']]
    });

    // Calculate statistics
    const totalAmount = costs.reduce((sum, cost) => sum + parseFloat(cost.amount), 0);
    const avgAmount = costs.length > 0 ? totalAmount / costs.length : 0;
    const maxAmount = costs.length > 0 ? Math.max(...costs.map(c => parseFloat(c.amount))) : 0;
    const minAmount = costs.length > 0 ? Math.min(...costs.map(c => parseFloat(c.amount))) : 0;

    // Group by vehicle (if vehicle cost)
    let byVehicle = null;
    if (category.is_vehicle_cost) {
      byVehicle = costs.reduce((acc, cost) => {
        const vehicleId = cost.vehicle_id || cost.vehicle_operation?.vehicle_id;
        const vehicleName = cost.vehicle?.name || cost.vehicle_operation?.vehicle?.name || 'Unknown';
        
        if (!acc[vehicleId]) {
          acc[vehicleId] = {
            vehicle_id: vehicleId,
            vehicle_name: vehicleName,
            count: 0,
            total: 0
          };
        }
        
        acc[vehicleId].count++;
        acc[vehicleId].total += parseFloat(cost.amount);
        
        return acc;
      }, {});

      byVehicle = Object.values(byVehicle);
    }

    res.json({
      success: true,
      data: {
        category,
        statistics: {
          total_records: costs.length,
          total_amount: totalAmount,
          average_amount: avgAmount,
          max_amount: maxAmount,
          min_amount: minAmount
        },
        by_vehicle: byVehicle,
        recent_costs: costs.slice(0, 10) // Last 10 records
      }
    });
  } catch (error) {
    console.error('Error fetching cost category statistics:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching statistics',
      error: error.message
    });
  }
};

// Get operation by date
exports.getOperationByDate = async (req, res) => {
  try {
    const { DailyOperation, Vehicle } = require('../models');
    const operation = await DailyOperation.findOne({
      where: { operation_date: req.params.date },
      include: [{ model: Vehicle ,as:"vehicles"}]
    });

    if (!operation) {
      return res.status(404).json({
        success: false,
        message: 'No operation found for this date'
      });
    }

    res.json({
      success: true,
      data: operation
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching operation'
    });
  }
};
module.exports = exports;