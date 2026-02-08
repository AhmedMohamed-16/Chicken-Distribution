const { sequelize } = require('../config/database');

// Import all models
const User = require('./User');
const {Partner,recalculateAllPercentages} = require('./Partner');
const Vehicle = require('./Vehicle');
const Farm = require('./Farm');
const Buyer = require('./Buyer');
const ChickenType = require('./ChickenType');
const CostCategory = require('./CostCategory');
const DailyOperation = require('./DailyOperation');
const FarmTransaction = require('./FarmTransaction');
const SaleTransaction = require('./SaleTransaction');
const TransportLoss = require('./TransportLoss');
const DailyCost = require('./DailyCost');
const ProfitDistribution = require('./ProfitDistribution');
const PartnerProfit = require('./PartnerProfit');
const VehiclePartner = require('./VehiclePartner');
const FarmDebtPayment = require('./FarmDebtPayment');
const BuyerDebtPayment = require('./BuyerDebtPayment');
const VehicleOperation = require('./VehicleOperation');
const Permission = require('./Permission');  // ✅ NEW
const UserPermission = require('./UserPermission');  // ✅ NEW
const UserBackup = require('./Userbackup');

const setupAssociations = () => {
  // ✅ NEW: User - Permission (Many-to-Many)
  User.belongsToMany(Permission, {
    through: UserPermission,
    foreignKey: 'user_id',
    otherKey: 'permission_id',
    as: 'permissions'
  });
  
  Permission.belongsToMany(User, {
    through: UserPermission,
    foreignKey: 'permission_id',
    otherKey: 'user_id',
    as: 'users'
  });
  
  // ✅ NEW: Direct UserPermission associations
  UserPermission.belongsTo(User, {
    foreignKey: 'user_id',
    as: 'user'
  });
  
  UserPermission.belongsTo(Permission, {
    foreignKey: 'permission_id',
    as: 'permission'
  });
  
  UserPermission.belongsTo(User, {
    foreignKey: 'granted_by',
    as: 'granter'
  });
  
  User.hasMany(UserPermission, {
    foreignKey: 'user_id',
    as: 'user_permissions'
  });
  
  Permission.hasMany(UserPermission, {
    foreignKey: 'permission_id',
    as: 'user_permissions'
  });

  Vehicle.belongsToMany(Partner, { through: VehiclePartner, foreignKey: 'vehicle_id', as: 'partners' });
  Partner.belongsToMany(Vehicle, { through: VehiclePartner, foreignKey: 'partner_id', as: 'vehicles' });

  // DailyOperation - Vehicle relationships
  DailyOperation.belongsToMany(Vehicle, {
    through: 'vehicle_operations',
    foreignKey: 'daily_operation_id',
    otherKey: 'vehicle_id',
    as: 'vehicles'
  });
  Vehicle.belongsToMany(DailyOperation, {
    through: 'vehicle_operations',
    foreignKey: 'vehicle_id',
    otherKey: 'daily_operation_id',
    as: 'daily_operations'
  });

  CostCategory.hasMany(DailyCost, { foreignKey: 'cost_category_id', as: 'costs' });


  // VehicleOperation direct associations
  VehicleOperation.belongsTo(DailyOperation, { foreignKey: 'daily_operation_id', as: 'operation' });
  VehicleOperation.belongsTo(Vehicle, { foreignKey: 'vehicle_id', as: 'vehicle' });

  DailyOperation.hasMany(VehicleOperation, { foreignKey: 'daily_operation_id', as: 'vehicle_operations' });
  Vehicle.hasMany(VehicleOperation, { foreignKey: 'vehicle_id', as: 'vehicle_operations' });

  // Transaction associations
  FarmTransaction.belongsTo(Vehicle, { foreignKey: 'vehicle_id', as: 'vehicle' });
  Vehicle.hasMany(FarmTransaction, { foreignKey: 'vehicle_id', as: 'farm_transactions' });

  SaleTransaction.belongsTo(Vehicle, { foreignKey: 'vehicle_id', as: 'vehicle' });
  Vehicle.hasMany(SaleTransaction, { foreignKey: 'vehicle_id', as: 'sale_transactions' });

  TransportLoss.belongsTo(Vehicle, { foreignKey: 'vehicle_id', as: 'vehicle' });
  Vehicle.hasMany(TransportLoss, { foreignKey: 'vehicle_id', as: 'losses' });

  DailyCost.belongsTo(Vehicle, { foreignKey: 'vehicle_id', as: 'vehicle' });
  Vehicle.hasMany(DailyCost, { foreignKey: 'vehicle_id', as: 'costs' });

  // DailyOperation belongs to User
  DailyOperation.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

  // FarmTransaction relationships
  FarmTransaction.belongsTo(DailyOperation, { foreignKey: 'daily_operation_id', as: 'operation' });
  FarmTransaction.belongsTo(Farm, { foreignKey: 'farm_id', as: 'farm' });
  FarmTransaction.belongsTo(ChickenType, { foreignKey: 'chicken_type_id', as: 'chicken_type' });

  DailyOperation.hasMany(FarmTransaction, { foreignKey: 'daily_operation_id', as: 'farm_transactions' });
  Farm.hasMany(FarmTransaction, { foreignKey: 'farm_id', as: 'transactions' });

  // SaleTransaction relationships
  SaleTransaction.belongsTo(DailyOperation, { foreignKey: 'daily_operation_id', as: 'operation' });
  SaleTransaction.belongsTo(Buyer, { foreignKey: 'buyer_id', as: 'buyer' });
  SaleTransaction.belongsTo(ChickenType, { foreignKey: 'chicken_type_id', as: 'chicken_type' });

  DailyOperation.hasMany(SaleTransaction, { foreignKey: 'daily_operation_id', as: 'sale_transactions' });
  Buyer.hasMany(SaleTransaction, { foreignKey: 'buyer_id', as: 'sales' });

  // TransportLoss relationships
  TransportLoss.belongsTo(DailyOperation, { foreignKey: 'daily_operation_id', as: 'operation' });
  TransportLoss.belongsTo(ChickenType, { foreignKey: 'chicken_type_id', as: 'chicken_type' });
  DailyOperation.hasMany(TransportLoss, { foreignKey: 'daily_operation_id', as: 'losses' });

  // DailyCost relationships
  DailyCost.belongsTo(DailyOperation, { foreignKey: 'daily_operation_id', as: 'operation' });
  DailyCost.belongsTo(CostCategory, { foreignKey: 'cost_category_id', as: 'category' });
  DailyOperation.hasMany(DailyCost, { foreignKey: 'daily_operation_id', as: 'costs' });

  // ProfitDistribution relationships
  ProfitDistribution.belongsTo(DailyOperation, { foreignKey: 'daily_operation_id', as: 'operation' });
  DailyOperation.hasOne(ProfitDistribution, { foreignKey: 'daily_operation_id', as: 'profit_distribution' });

  // PartnerProfit relationships
  PartnerProfit.belongsTo(ProfitDistribution, { foreignKey: 'profit_distribution_id', as: 'profit_distribution' });
  PartnerProfit.belongsTo(Partner, { foreignKey: 'partner_id', as: 'partner' });
  ProfitDistribution.hasMany(PartnerProfit, { foreignKey: 'profit_distribution_id', as: 'partner_profits' });

  // Debt Payment relationships
  FarmDebtPayment.belongsTo(Farm, { foreignKey: 'farm_id', as: 'farm' });
  FarmDebtPayment.belongsTo(DailyOperation, { foreignKey: 'daily_operation_id', as: 'operation' });
  Farm.hasMany(FarmDebtPayment, { foreignKey: 'farm_id', as: 'debt_payments' });

  BuyerDebtPayment.belongsTo(Buyer, { foreignKey: 'buyer_id', as: 'buyer' });
  BuyerDebtPayment.belongsTo(DailyOperation, { foreignKey: 'daily_operation_id', as: 'operation' });
  Buyer.hasMany(BuyerDebtPayment, { foreignKey: 'buyer_id', as: 'debt_payments' });

  // FarmTransaction <-> VehicleOperation
FarmTransaction.belongsTo(VehicleOperation, {
  foreignKey: 'vehicle_operation_id',
  as: 'vehicle_operation'
});

VehicleOperation.hasMany(FarmTransaction, {
  foreignKey: 'vehicle_operation_id',
  as: 'farm_transactions'
});

SaleTransaction.belongsTo(VehicleOperation, {
  foreignKey: 'vehicle_operation_id',
  as: 'vehicle_operation'
});

VehicleOperation.hasMany(SaleTransaction, {
  foreignKey: 'vehicle_operation_id',
  as: 'sale_transactions'
});
TransportLoss.belongsTo(VehicleOperation, {
  foreignKey: 'vehicle_operation_id',
  as: 'vehicle_operation'
});
// TransportLoss <-> Farm (optional, as farm may be null)
TransportLoss.belongsTo(Farm, {
  foreignKey: 'farm_id',
  as: 'farm',
  constraints: false // optional, allows null without error
});

Farm.hasMany(TransportLoss, {
  foreignKey: 'farm_id',
  as: 'transport_losses'
});

VehicleOperation.hasMany(TransportLoss, {
  foreignKey: 'vehicle_operation_id',
  as: 'transport_losses'
});
DailyCost.belongsTo(VehicleOperation, {
  foreignKey: 'vehicle_operation_id',
  as: 'vehicle_operation'
});

VehicleOperation.hasMany(DailyCost, {
  foreignKey: 'vehicle_operation_id',
  as: 'daily_costs'
});
 
 
};

setupAssociations();

const models = {
UserBackup,
  User,
  Partner,
  Vehicle,
  Farm,
  Buyer,
  ChickenType,
  CostCategory,
  DailyOperation,
  FarmTransaction,
  SaleTransaction,
  TransportLoss,
  DailyCost,
  ProfitDistribution,
  PartnerProfit,
  VehiclePartner,
  FarmDebtPayment,
  BuyerDebtPayment,
  VehicleOperation,
  Permission, 
  UserPermission , 
};
const getTableNames = () => {
  return Object.keys(models).filter(name => name !== 'UserBackup'&&name !== 'Permission'  );
};
module.exports = {
  ...models,
  models,
  getTableNames,
  recalculateAllPercentages,sequelize
};