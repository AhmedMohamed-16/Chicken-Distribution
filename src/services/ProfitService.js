const {
  FarmTransaction,
  SaleTransaction,
  TransportLoss,
  DailyCost,
  ProfitDistribution,
  PartnerProfit,
  Partner,
  CostCategory,
  DailyOperation,
  Vehicle
} = require('../models');
const { Op } = require('sequelize');
const VehicleOperation = require('../models/VehicleOperation');

// class ProfitService {
//   /**
//    * Calculate and distribute profits for a daily operation
//    * @param {number} dailyOperationId 
//    * @param {Transaction} transaction - Sequelize transaction
//    * @returns {Object} Profit distribution details
//    */
//   async calculateAndDistribute(dailyOperationId, transaction) {
//     // STEP 1: Calculate Total Revenue
//     const sales = await SaleTransaction.findAll({
//       where: { daily_operation_id: dailyOperationId },
//       transaction
//     });
    
//     const totalRevenue = sales.reduce((sum, sale) => {
//       return sum + parseFloat(sale.total_amount);
//     }, 0);

//     // STEP 2: Calculate Total Purchases
//     const purchases = await FarmTransaction.findAll({
//       where: { daily_operation_id: dailyOperationId },
//       transaction
//     });
    
//     const totalPurchases = purchases.reduce((sum, purchase) => {
//       return sum + parseFloat(purchase.total_amount);
//     }, 0);

//     // STEP 3: Calculate Total Losses
//     const losses = await TransportLoss.findAll({
//       where: { daily_operation_id: dailyOperationId },
//       transaction
//     });
    
//     const totalLosses = losses.reduce((sum, loss) => {
//       return sum + parseFloat(loss.loss_amount);
//     }, 0);

//     // STEP 4: Calculate Total Costs (Vehicle vs Other)
//     const costs = await DailyCost.findAll({
//       where: { daily_operation_id: dailyOperationId },
//       include: [{ model: CostCategory }],
//       transaction
//     });
    
//     let vehicleCosts = 0;
//     let otherCosts = 0;
    
//     costs.forEach(cost => {
//       const amount = parseFloat(cost.amount);
//       if (cost.CostCategory && cost.CostCategory.is_vehicle_cost) {
//         vehicleCosts += amount;
//       } else {
//         otherCosts += amount;
//       }
//     });
    
//     const totalCosts = vehicleCosts + otherCosts;

//     // STEP 5: Calculate Net Profit
//     const netProfit = totalRevenue - totalPurchases - totalLosses - totalCosts;

//     // Create profit distribution record
//     const profitDistribution = await ProfitDistribution.create({
//       daily_operation_id: dailyOperationId,
//       total_revenue: totalRevenue,
//       total_purchases: totalPurchases,
//       total_losses: totalLosses,
//       total_costs: totalCosts,
//       vehicle_costs: vehicleCosts,
//       net_profit: netProfit
//     }, { transaction });

//     // STEP 6: Distribute to Partners
//     const partners = await Partner.findAll({ transaction });
//     const partnerProfits = [];

//     for (const partner of partners) {
//       const investmentPercentage = parseFloat(partner.investment_percentage);
      
//       // A. Calculate Base Profit Share
//       const baseShare = (netProfit * investmentPercentage) / 100;
      
//       // B. Calculate Vehicle Cost Deduction
//       let vehicleCostShare = 0;
//       if (!partner.is_vehicle_partner) {
//         // Non-vehicle partners pay their share of vehicle costs from profit
//         vehicleCostShare = (vehicleCosts * investmentPercentage) / 100;
//       }
      
//       // C. Calculate Final Profit
//       const finalProfit = baseShare - vehicleCostShare;

//       const partnerProfit = await PartnerProfit.create({
//         profit_distribution_id: profitDistribution.id,
//         partner_id: partner.id,
//         base_profit_share: baseShare,
//         vehicle_cost_share: vehicleCostShare,
//         final_profit: finalProfit
//       }, { transaction });

//       partnerProfits.push({
//         partner_id: partner.id,
//         partner_name: partner.name,
//         investment_percentage: investmentPercentage,
//         is_vehicle_partner: partner.is_vehicle_partner,
//         base_share: baseShare,
//         vehicle_cost_share: vehicleCostShare,
//         final_profit: finalProfit
//       });
//     }

//     // STEP 7: Verification (optional - for debugging)
//     const totalDistributed = partnerProfits.reduce((sum, p) => sum + p.final_profit, 0);
//     const difference = Math.abs(netProfit - totalDistributed - vehicleCosts);
    
//     // Allow small rounding differences (less than 1 EGP)
//     if (difference > 1) {
//       console.warn(`Profit distribution discrepancy: ${difference} EGP`);
//     }

//     return {
//       profit_distribution_id: profitDistribution.id,
//       total_revenue: totalRevenue,
//       total_purchases: totalPurchases,
//       total_losses: totalLosses,
//       total_costs: totalCosts,
//       vehicle_costs: vehicleCosts,
//       other_costs: otherCosts,
//       net_profit: netProfit,
//       partner_profits: partnerProfits,
//       verification: {
//         total_distributed: totalDistributed,
//         difference: difference
//       }
//     };
//   }

//   /**
//    * Get profit report for a date range
//    * @param {string} fromDate 
//    * @param {string} toDate 
//    * @returns {Object} Aggregated profit data
//    */
//  async getProfitReport(fromDate, toDate) {
//   const distributions = await ProfitDistribution.findAll({
//     include: [
//       {
//         model: DailyOperation,
//         as: 'daily_operation',
//         where: {
//           operation_date: {
//             [Op.between]: [fromDate, toDate]
//           }
//         }
//       },
//       {
//         model: PartnerProfit,
//         as: 'partner_profits',
//         include: [
//           { model: Partner, as: 'partner' }
//         ]
//       }
//     ],
//     order: [
//       [{ model: DailyOperation, as: 'daily_operation' }, 'operation_date', 'DESC']
//     ]
//   });

//   const totals = {
//     total_revenue: 0,
//     total_purchases: 0,
//     total_losses: 0,
//     total_costs: 0,
//     vehicle_costs: 0,
//     net_profit: 0
//   };

//   const partnerTotals = {};

//   distributions.forEach(dist => {
//     totals.total_revenue += parseFloat(dist.total_revenue);
//     totals.total_purchases += parseFloat(dist.total_purchases);
//     totals.total_losses += parseFloat(dist.total_losses);
//     totals.total_costs += parseFloat(dist.total_costs);
//     totals.vehicle_costs += parseFloat(dist.vehicle_costs);
//     totals.net_profit += parseFloat(dist.net_profit);

//     dist.partner_profits.forEach(pp => {
//       const partnerId = pp.partner_id;

//       if (!partnerTotals[partnerId]) {
//         partnerTotals[partnerId] = {
//           partner_id: partnerId,
//           partner_name: pp.partner.name,
//           total_base_share: 0,
//           total_vehicle_cost_share: 0,
//           total_final_profit: 0
//         };
//       }

//       partnerTotals[partnerId].total_base_share += parseFloat(pp.base_profit_share);
//       partnerTotals[partnerId].total_vehicle_cost_share += parseFloat(pp.vehicle_cost_share);
//       partnerTotals[partnerId].total_final_profit += parseFloat(pp.final_profit);
//     });
//   });

//   return {
//     period: { from: fromDate, to: toDate },
//     totals,
//     partner_totals: Object.values(partnerTotals),
//     daily_distributions: distributions
//   };
// }

// }

// module.exports = new ProfitService();

// ✅ NEW - Multi-vehicle calculations with per-vehicle breakdowns
// class ProfitService {
  
//   /**
//    * Calculate profits with vehicle-specific breakdowns
//    */
//   static async calculateDailyProfit(operationId) {
//     const operation = await DailyOperation.findByPk(operationId, {
//       include: [
//         { 
//           model: Vehicle, 
//           as: 'vehicles',
//           through: { attributes: ['status'] }
//         },
//         { 
//           model: FarmTransaction, 
//           as: 'farm_transactions',
//           include: [{ model: Vehicle, as: 'vehicle' }]
//         },
//         { 
//           model: SaleTransaction, 
//           as: 'sale_transactions',
//           include: [{ model: Vehicle, as: 'vehicle' }]
//         },
//         { 
//           model: TransportLoss, 
//           as: 'losses',
//           include: [{ model: Vehicle, as: 'vehicle' }]
//         },
//         { 
//           model: DailyCost, 
//           as: 'costs',
//           include: [
//             { model: CostCategory, as: 'category' },
//             { model: Vehicle, as: 'vehicle', required: false }
//           ]
//         }
//       ]
//     });
    
//     if (!operation) {
//       throw new Error('Operation not found');
//     }
    
//     // ✅ NEW: Calculate per-vehicle statistics
//     const vehicleStats = {};
//     const vehicleIds = operation.vehicles.map(v => v.id);
    
//     for (const vehicleId of vehicleIds) {
//       vehicleStats[vehicleId] = {
//         vehicle_id: vehicleId,
//         purchases: 0,
//         revenue: 0,
//         losses: 0,
//         vehicle_costs: 0,
//         net_profit: 0
//       };
//     }
    
//     // ✅ Aggregate per vehicle
//     operation.farm_transactions.forEach(t => {
//       if (vehicleStats[t.vehicle_id]) {
//         vehicleStats[t.vehicle_id].purchases += parseFloat(t.total_amount);
//       }
//     });
    
//     operation.sale_transactions.forEach(t => {
//       if (vehicleStats[t.vehicle_id]) {
//         vehicleStats[t.vehicle_id].revenue += parseFloat(t.total_amount);
//       }
//     });
    
//     operation.transport_losses.forEach(t => {
//       if (vehicleStats[t.vehicle_id]) {
//         vehicleStats[t.vehicle_id].losses += parseFloat(t.loss_amount);
//       }
//     });
    
//     // ✅ Vehicle-specific costs
//     operation.daily_costs
//       .filter(c => c.vehicle_id && c.cost_category.is_vehicle_cost)
//       .forEach(c => {
//         if (vehicleStats[c.vehicle_id]) {
//           vehicleStats[c.vehicle_id].vehicle_costs += parseFloat(c.amount);
//         }
//       });
    
//     // ✅ Shared costs (split equally among vehicles)
//     const sharedVehicleCosts = operation.daily_costs
//       .filter(c => !c.vehicle_id && c.cost_category.is_vehicle_cost)
//       .reduce((sum, c) => sum + parseFloat(c.amount), 0);
    
//     const sharedCostPerVehicle = sharedVehicleCosts / vehicleIds.length;
    
//     vehicleIds.forEach(vId => {
//       vehicleStats[vId].vehicle_costs += sharedCostPerVehicle;
//     });
    
//     // ✅ Non-vehicle costs (shared across all)
//     const otherCosts = operation.daily_costs
//       .filter(c => !c.cost_category.is_vehicle_cost)
//       .reduce((sum, c) => sum + parseFloat(c.amount), 0);
    
//     const otherCostPerVehicle = otherCosts / vehicleIds.length;
    
//     // ✅ Calculate net profit per vehicle
//     vehicleIds.forEach(vId => {
//       const stats = vehicleStats[vId];
//       stats.net_profit = stats.revenue - stats.purchases - stats.losses - stats.vehicle_costs - otherCostPerVehicle;
//     });
    
//     // ✅ Calculate operation totals
//     const totalPurchases = Object.values(vehicleStats).reduce((sum, v) => sum + v.purchases, 0);
//     const totalRevenue = Object.values(vehicleStats).reduce((sum, v) => sum + v.revenue, 0);
//     const totalLosses = Object.values(vehicleStats).reduce((sum, v) => sum + v.losses, 0);
//     const totalVehicleCosts = Object.values(vehicleStats).reduce((sum, v) => sum + v.vehicle_costs, 0);
//     const totalCosts = totalVehicleCosts + otherCosts;
//     const netProfit = totalRevenue - totalPurchases - totalLosses - totalCosts;
    
//     return {
//       // ✅ Operation-level totals
//       totalRevenue,
//       totalPurchases,
//       totalLosses,
//       totalCosts,
//       vehicleCosts: totalVehicleCosts,
//       otherCosts,
//       netProfit,
      
//       // ✅ NEW: Per-vehicle breakdown
//       vehicleBreakdown: Object.values(vehicleStats),
      
//       // ✅ NEW: Metadata
//       vehicle_count: vehicleIds.length,
//       operation_id: operationId
//     };
//   }
  
//   /**
//    * ✅ NEW: Calculate profits for specific vehicle
//    */
//   static async calculateVehicleProfit(operationId, vehicleId) {
//     const fullProfits = await this.calculateDailyProfit(operationId);
//     const vehicleProfit = fullProfits.vehicleBreakdown.find(v => v.vehicle_id === vehicleId);
    
//     if (!vehicleProfit) {
//       throw new Error(`Vehicle ${vehicleId} not found in operation ${operationId}`);
//     }
    
//     return vehicleProfit;
//   }
  
//   /**
//    * Distribute operation profits to partners
//    * ✅ UPDATED: Now handles vehicle-specific partner associations
//    */
//   static async distributeToPartners(operationId, profitData) {
//     // Get all partners
//     const allPartners = await Partner.findAll();
    
//     // Get vehicles in this operation with their partner associations
//     const operation = await DailyOperation.findByPk(operationId, {
//       include: [{
//         model: Vehicle,
//         as: 'vehicles',
//         include: [{
//           model: Partner,
//           as: 'partners',
//           through: { attributes: ['share_percentage'] }
//         }]
//       }]
//     });
    
//     const distributions = [];
    
//     for (const partner of allPartners) {
//       let totalBaseShare = 0;
//       let totalVehicleCostShare = 0;
      
//       // ✅ Check if partner has vehicle ownership in this operation
//       const partnerVehicles = operation.vehicles.filter(v =>
//         v.partners.some(p => p.id === partner.id)
//       );
      
//       const isVehiclePartnerInOperation = partnerVehicles.length > 0;
      
//       // Calculate base share from total net profit
//       const baseShare = profitData.netProfit * (partner.investment_percentage / 100);
//       totalBaseShare = baseShare;
      
//       // ✅ NEW: Vehicle cost deduction logic
//       if (isVehiclePartnerInOperation) {
//         // Partner owns vehicle(s) - no deduction
//         totalVehicleCostShare = 0;
//       } else {
//         // Partner doesn't own vehicles - deduct proportional vehicle costs
//         totalVehicleCostShare = profitData.vehicleCosts * (partner.investment_percentage / 100);
//       }
      
//       const finalProfit = totalBaseShare - totalVehicleCostShare;
      
//       distributions.push({
//         partner_id: partner.id,
//         partner_name: partner.name,
//         base_profit_share: totalBaseShare,
//         vehicle_cost_share: totalVehicleCostShare,
//         final_profit: finalProfit,
//         is_vehicle_partner_in_operation: isVehiclePartnerInOperation,
//         owned_vehicles_in_operation: partnerVehicles.map(v => v.id)
//       });
//     }
    
//     return distributions;
//   }
  
//   /**
//    * ✅ NEW: Close operation with multi-vehicle profit calculation
//    */
//   static async closeOperation(operationId,transaction) {
//     // const transaction = await sequelize.transaction();
    
     
//       const operation = await DailyOperation.findByPk(operationId);
      
//       if (!operation) {
//         throw new Error('Operation not found');
//       }
      
//       if (operation.status === 'CLOSED') {
//         throw new Error('Operation already closed');
//       }
      
//       // Calculate profits
//       const profitData = await this.calculateDailyProfit(operationId);
      
//       // Distribute to partners
//       const partnerDistributions = await this.distributeToPartners(operationId, profitData);
      
//       // Save profit distribution
//       const profitDistribution = await ProfitDistribution.create({
//         daily_operation_id: operationId,
//         total_revenue: profitData.totalRevenue,
//         total_purchases: profitData.totalPurchases,
//         total_losses: profitData.totalLosses,
//         total_costs: profitData.totalCosts,
//         vehicle_costs: profitData.vehicleCosts,
//         net_profit: profitData.netProfit
//       }, { transaction });
      
//       // Save partner profits
//       for (const dist of partnerDistributions) {
//         await PartnerProfit.create({
//           profit_distribution_id: profitDistribution.id,
//           partner_id: dist.partner_id,
//           base_profit_share: dist.base_profit_share,
//           vehicle_cost_share: dist.vehicle_cost_share,
//           final_profit: dist.final_profit
//         }, { transaction });
//       }
      
//       // ✅ Mark all vehicle operations as completed
//       await VehicleOperation.update(
//         { status: 'COMPLETED' },
//         { 
//           where: { daily_operation_id: operationId },
//           transaction 
//         }
//       );
      
//       // Close operation
//       operation.status = 'CLOSED';
//       operation.closed_at = new Date();
//       await operation.save({ transaction });
      
//       // await transaction.commit();
      
//       return {
//         operation,
//         profitDistribution,
//         partnerDistributions,
//         vehicleBreakdown: profitData.vehicleBreakdown
//       };
   
//   }
// }

// module.exports = ProfitService;
class ProfitService {
  
  /**
   * Calculate profits with vehicle-specific breakdowns
   */
  static async calculateDailyProfit(operationId, transaction = null) {
    try {
      const operation = await DailyOperation.findByPk(operationId, {
        include: [
          { 
            model: Vehicle, 
            as: 'vehicles',
            through: { attributes: ['status'] }
          },
          { 
            model: FarmTransaction, 
            as: 'farm_transactions',
            include: [{ model: Vehicle, as: 'vehicle' }]
          },
          { 
            model: SaleTransaction, 
            as: 'sale_transactions',
            include: [{ model: Vehicle, as: 'vehicle' }]
          },
          { 
            model: TransportLoss, 
            as: 'losses',
            include: [{ model: Vehicle, as: 'vehicle' }]
          },
          { 
            model: DailyCost, 
            as: 'costs',
            include: [
              { model: CostCategory, as: 'category' },
              { model: Vehicle, as: 'vehicle', required: false }
            ]
          }
        ],
        transaction
      });
      
      if (!operation) {
        throw new Error('Operation not found');
      }
      
      // Validate that vehicles array exists and has items
      if (!operation.vehicles || !Array.isArray(operation.vehicles) || operation.vehicles.length === 0) {
        console.warn('No vehicles found for operation:', operationId);
        return {
          totalRevenue: 0,
          totalPurchases: 0,
          totalLosses: 0,
            lossesWithFarm,        
            lossesWithoutFarm,        
          totalCosts: 0,
          vehicleCosts: 0,
          otherCosts: 0,
          netProfit: 0,
          vehicleBreakdown: [],
          vehicle_count: 0,
          operation_id: operationId
        };
      }
      
      // Calculate per-vehicle statistics
      const vehicleStats = {};
      const vehicleIds = operation.vehicles.map(v => v.id);
      
      for (const vehicleId of vehicleIds) {
        vehicleStats[vehicleId] = {
          vehicle_id: vehicleId,
          purchases: 0,
          revenue: 0,
          losses: 0,
          vehicle_costs: 0,
          other_costs: 0,
            lossesWithFarm: 0,
          lossesWithoutFarm: 0,
          net_profit: 0
        };
      }
      
      // Aggregate per vehicle - with safety checks
      const farmTransactions = operation.farm_transactions || [];
      farmTransactions.forEach(t => {
        if (t && t.vehicle_id && vehicleStats[t.vehicle_id]) {
          vehicleStats[t.vehicle_id].purchases += parseFloat(t.total_amount) || 0;
        }
      });
      
      const saleTransactions = operation.sale_transactions || [];
      saleTransactions.forEach(t => {
        if (t && t.vehicle_id && vehicleStats[t.vehicle_id]) {
          vehicleStats[t.vehicle_id].revenue += parseFloat(t.total_amount) || 0;
        }
      });
      
      const losses = operation.losses || [];
     let lossesWithFarm = 0;
        let lossesWithoutFarm = 0;

        losses.forEach(t => {
          if (!t || !t.vehicle_id) return;
          
          const amount = parseFloat(t.loss_amount) || 0;
          
      if (t.farm_id == null) {
        lossesWithoutFarm += amount;
        vehicleStats[t.vehicle_id].lossesWithoutFarm += amount;
      } else {
        lossesWithFarm += amount;
        vehicleStats[t.vehicle_id].lossesWithFarm += amount;
      }
    });

      
      // Vehicle-specific costs
      const dailyCosts = operation.costs || [];
      dailyCosts
        .filter(c => c && c.vehicle_id && c.category && c.category.is_vehicle_cost)
        .forEach(c => {
          if (vehicleStats[c.vehicle_id]) {
            vehicleStats[c.vehicle_id].vehicle_costs += parseFloat(c.amount) || 0;
          }
        });
      
      // Shared costs (split equally among vehicles)
      const sharedVehicleCosts = dailyCosts
        .filter(c => c && !c.vehicle_id && c.category && c.category.is_vehicle_cost)
        .reduce((sum, c) => sum + (parseFloat(c.amount) || 0), 0);
      
      const sharedCostPerVehicle = vehicleIds.length > 0 ? sharedVehicleCosts / vehicleIds.length : 0;
      
      vehicleIds.forEach(vId => {
        vehicleStats[vId].vehicle_costs += sharedCostPerVehicle;
      });
      
      // Non-vehicle costs (shared across all)
      const otherCosts = dailyCosts
        .filter(c => c && c.category && !c.category.is_vehicle_cost)
        .reduce((sum, c) => sum + (parseFloat(c.amount) || 0), 0);
      
      const otherCostPerVehicle = vehicleIds.length > 0 ? otherCosts / vehicleIds.length : 0;
      
      // Calculate net profit per vehicle
      vehicleIds.forEach(vId => {
        const stats = vehicleStats[vId];
        // console.log("\nmmm",stats.revenue ,stats.purchases , stats.losses , stats.vehicle_costs , otherCostPerVehicle);
        stats.other_costs = otherCostPerVehicle;
        stats.losses = stats.lossesWithoutFarm;

        stats.net_profit = stats.revenue - stats.purchases - stats.lossesWithoutFarm - stats.vehicle_costs - otherCostPerVehicle;
      });
      
      // Calculate operation totals
      const totalPurchases = Object.values(vehicleStats).reduce((sum, v) => sum + v.purchases, 0);
      const totalRevenue = Object.values(vehicleStats).reduce((sum, v) => sum + v.revenue, 0);
   

const totalLosses=lossesWithFarm+lossesWithoutFarm;

      const totalVehicleCosts = Object.values(vehicleStats).reduce((sum, v) => sum + v.vehicle_costs, 0);
      const totalCosts = totalVehicleCosts + otherCosts;
      const netProfit = totalRevenue - totalPurchases - lossesWithoutFarm - totalCosts;
      console.log("ةة",Object.values(vehicleStats));

      return {
        // Operation-level totals
        totalRevenue,
        totalPurchases,
        totalLosses,
        lossesWithFarm,
        lossesWithoutFarm,
        totalCosts,
        vehicleCosts: totalVehicleCosts,
        otherCosts,
        netProfit,
        
        // Per-vehicle breakdown
        vehicleBreakdown: Object.values(vehicleStats),
        
        // Metadata
        vehicle_count: vehicleIds.length,
        operation_id: operationId
      };
      
    } catch (error) {
      console.error('Error calculating daily profit:', error);
      throw new Error(`Failed to calculate profit: ${error.message}`);
    }
  }
  
  /**
   * Calculate profits for specific vehicle
   */
  static async calculateVehicleProfit(operationId, vehicleId, transaction = null) {
    try {
      const fullProfits = await this.calculateDailyProfit(operationId, transaction);
      
      if (!fullProfits.vehicleBreakdown || fullProfits.vehicleBreakdown.length === 0) {
        throw new Error(`No vehicle data found for operation ${operationId}`);
      }
      
      const vehicleProfit = fullProfits.vehicleBreakdown.find(v => v.vehicle_id === vehicleId);
      
      if (!vehicleProfit) {
        throw new Error(`Vehicle ${vehicleId} not found in operation ${operationId}`);
      }
      
      return vehicleProfit;
      
    } catch (error) {
      console.error('Error calculating vehicle profit:', error);
      throw error;
    }
  }
  
  /**
   * Distribute operation profits to partners
   * Handles vehicle-specific partner associations
   */
  static async distributeToPartners(operationId, profitData, transaction = null) {
    try {
      // Validate input
      if (!profitData || typeof profitData !== 'object') {
        throw new Error('Invalid profit data provided');
      }
      
      // Get all partners
      const allPartners = await Partner.findAll({ transaction });
      
      if (!allPartners || allPartners.length === 0) {
        console.warn('No partners found for profit distribution');
        return [];
      }
      
      // Get vehicles in this operation with their partner associations
      const operation = await DailyOperation.findByPk(operationId, {
        include: [{
          model: Vehicle,
          as: 'vehicles',
          include: [{
            model: Partner,
            as: 'partners',
            through: { attributes: ['share_percentage'] }
          }]
        }],
        transaction
      });
      
      if (!operation) {
        throw new Error('Operation not found');
      }
      
      const distributions = [];
      const netProfit = parseFloat(profitData.netProfit) || 0;
      const vehicleCosts = parseFloat(profitData.vehicleCosts) || 0;
      
      for (const partner of allPartners) {
        let totalBaseShare = 0;
        let totalVehicleCostShare = 0;
        
        // Check if partner has vehicle ownership in this operation
        const partnerVehicles = (operation.vehicles || []).filter(v =>
          v.partners && Array.isArray(v.partners) && v.partners.some(p => p.id === partner.id)
        );
        
        const isVehiclePartnerInOperation = partnerVehicles.length > 0;
        
        // Calculate base share from total net profit
        const investmentPercentage = parseFloat(partner.investment_percentage) || 0;
        const baseShare = netProfit * (investmentPercentage / 100);
        totalBaseShare = baseShare;
        
        // Vehicle cost deduction logic
        if (isVehiclePartnerInOperation) {
          // Partner owns vehicle(s) - no deduction
          totalVehicleCostShare = 0;
        } else {
          // Partner doesn't own vehicles - deduct proportional vehicle costs
          totalVehicleCostShare = vehicleCosts * (investmentPercentage / 100);
        }
        
        const finalProfit = totalBaseShare - totalVehicleCostShare;
        
        distributions.push({
          partner_id: partner.id,
          partner_name: partner.name,
          base_profit_share: totalBaseShare,
          vehicle_cost_share: totalVehicleCostShare,
          final_profit: finalProfit,
          is_vehicle_partner_in_operation: isVehiclePartnerInOperation,
          owned_vehicles_in_operation: partnerVehicles.map(v => v.id)
        });
      }
      
      return distributions;
      
    } catch (error) {
      console.error('Error distributing to partners:', error);
      throw new Error(`Failed to distribute profits: ${error.message}`);
    }
  }
  
  /**
   * Close operation with multi-vehicle profit calculation
   */
  static async closeOperation(operationId, transaction) {
    try {
      // Validate input
      if (!operationId) {
        throw new Error('Operation ID is required');
      }
      
      if (!transaction) {
        throw new Error('Transaction is required');
      }
      
const operation = await DailyOperation.findOne({
                where: {
                  id: operationId,
                  status: 'OPEN',
                  closed_at: null
                },
                transaction,
                lock: transaction.LOCK.UPDATE
              });
                    
      if (!operation) {
        throw new Error('Operation not found');
      }
      
      if (operation.status === 'CLOSED') {
        throw new Error('Operation already closed');
      }
      
      // Calculate profits
      const profitData = await this.calculateDailyProfit(operationId, transaction);
      
      // Validate profit data
      if (!profitData || typeof profitData !== 'object') {
        throw new Error('Failed to calculate profit data');
      }
      
      // Distribute to partners
      const partnerDistributions = await this.distributeToPartners(operationId, profitData, transaction);
      
      // Validate distributions
      if (!Array.isArray(partnerDistributions)) {
        throw new Error('Partner distributions must be an array');
      }
      
      // Save profit distribution
      const profitDistribution = await ProfitDistribution.create({
        daily_operation_id: operationId,
        total_revenue: profitData.totalRevenue || 0,
        total_purchases: profitData.totalPurchases || 0,
        total_losses: profitData.totalLosses || 0,
        total_costs: profitData.totalCosts || 0,
        lossesWithFarm: profitData.lossesWithFarm || 0,      
         lossesWithoutFarm: profitData.lossesWithoutFarm || 0,   
        vehicle_costs: profitData.vehicleCosts || 0,
        net_profit: profitData.netProfit || 0
      }, { transaction });

      // Save partner profits
      if (partnerDistributions.length > 0) {
        for (const dist of partnerDistributions) {
          await PartnerProfit.create({
            profit_distribution_id: profitDistribution.id,
            partner_id: dist.partner_id,
            base_profit_share: dist.base_profit_share || 0,
            vehicle_cost_share: dist.vehicle_cost_share || 0,
            final_profit: dist.final_profit || 0
          }, { transaction });
        }
      }
      
      // Mark all vehicle operations as completed
      await VehicleOperation.update(
        { status: 'COMPLETED' },
        { 
          where: { daily_operation_id: operationId },
          transaction 
        }
      );
      
      // Update operation status
      await operation.update({
        status: 'CLOSED',
        closed_at: new Date().toLocaleString('en-GB', { timeZone: 'Africa/Cairo' })
      }, { transaction });
      
      return {
        operation,
        profitDistribution,
        partnerDistributions,
        vehicleBreakdown: profitData.vehicleBreakdown || []
      };
      
    } catch (error) {
      console.error('Error in closeOperation service:', error);
      throw error; // Re-throw to let controller handle transaction rollback
    }
  }
}

module.exports = ProfitService;

// const {
//   FarmTransaction,
//   SaleTransaction,
//   TransportLoss,
//   DailyCost,
//   ProfitDistribution,
//   PartnerProfit,
//   Partner,
//   CostCategory,
//   DailyOperation,
//   Vehicle,
//   VehicleOperation
// } = require('../models');
// const { Op } = require('sequelize');
// const sequelize = require('../config/database');

// class ProfitService {
  
//   /**
//    * Calculate daily profit with automatic single/multi-vehicle detection
//    * @param {number} operationId 
//    * @returns {Object} Profit calculation with vehicle breakdown
//    */
//   async calculateDailyProfit(operationId) {
//     const operation = await DailyOperation.findByPk(operationId, {
//       include: [
//         { 
//           model: Vehicle, 
//           as: 'vehicles',
//           through: { attributes: ['status'] }
//         },
//         { 
//           model: FarmTransaction, 
//           as: 'farm_transactions',
//           include: [{ model: Vehicle, as: 'vehicle', required: false }]
//         },
//         { 
//           model: SaleTransaction, 
//           as: 'sale_transactions',
//           include: [{ model: Vehicle, as: 'vehicle', required: false }]
//         },
//         { 
//           model: TransportLoss, 
//           as: 'transport_losses',
//           include: [{ model: Vehicle, as: 'vehicle', required: false }]
//         },
//         { 
//           model: DailyCost, 
//           as: 'daily_costs',
//           include: [
//             { model: CostCategory, as: 'cost_category' },
//             { model: Vehicle, as: 'vehicle', required: false }
//           ]
//         }
//       ]
//     });
    
//     if (!operation) {
//       throw new Error('Operation not found');
//     }
    
//     const vehicleIds = operation.vehicles?.map(v => v.id) || [];
//     const isMultiVehicle = vehicleIds.length > 1;
//     const isSingleVehicle = vehicleIds.length === 1;
//     const hasNoVehicles = vehicleIds.length === 0;
    
//     // Initialize vehicle stats
//     const vehicleStats = {};
    
//     if (hasNoVehicles) {
//       // Legacy mode: No vehicle tracking
//       vehicleStats['UNASSIGNED'] = {
//         vehicle_id: null,
//         vehicle_name: 'Unassigned',
//         purchases: 0,
//         revenue: 0,
//         losses: 0,
//         vehicle_costs: 0,
//         other_costs: 0,
//         net_profit: 0
//       };
//     } else {
//       // Initialize stats for each vehicle
//       for (const vehicleId of vehicleIds) {
//         vehicleStats[vehicleId] = {
//           vehicle_id: vehicleId,
//           purchases: 0,
//           revenue: 0,
//           losses: 0,
//           vehicle_costs: 0,
//           other_costs: 0,
//           net_profit: 0
//         };
//       }
//     }
    
//     // Helper: Assign transaction to vehicle or default
//     const assignToVehicle = (vehicleId, statKey, amount) => {
//       if (hasNoVehicles) {
//         vehicleStats['UNASSIGNED'][statKey] += amount;
//       } else if (vehicleId && vehicleStats[vehicleId]) {
//         vehicleStats[vehicleId][statKey] += amount;
//       } else {
//         // Fallback: assign to first vehicle or split equally
//         if (isSingleVehicle) {
//           vehicleStats[vehicleIds[0]][statKey] += amount;
//         } else if (isMultiVehicle) {
//           // Split unassigned transactions equally
//           const perVehicle = amount / vehicleIds.length;
//           vehicleIds.forEach(vId => {
//             vehicleStats[vId][statKey] += perVehicle;
//           });
//         }
//       }
//     };
    
//     // Aggregate purchases
//     operation.farm_transactions.forEach(t => {
//       assignToVehicle(t.vehicle_id, 'purchases', parseFloat(t.total_amount));
//     });
    
//     // Aggregate sales
//     operation.sale_transactions.forEach(t => {
//       assignToVehicle(t.vehicle_id, 'revenue', parseFloat(t.total_amount));
//     });
    
//     // Aggregate losses
//     operation.transport_losses.forEach(t => {
//       assignToVehicle(t.vehicle_id, 'losses', parseFloat(t.loss_amount));
//     });
    
//     // Process costs
//     let totalVehicleCosts = 0;
//     let totalOtherCosts = 0;
    
//     operation.daily_costs.forEach(cost => {
//       const amount = parseFloat(cost.amount);
//       const isVehicleCost = cost.cost_category?.is_vehicle_cost || false;
      
//       if (isVehicleCost) {
//         totalVehicleCosts += amount;
        
//         if (cost.vehicle_id) {
//           // Assigned to specific vehicle
//           assignToVehicle(cost.vehicle_id, 'vehicle_costs', amount);
//         } else {
//           // Shared vehicle cost - split equally
//           if (hasNoVehicles) {
//             vehicleStats['UNASSIGNED'].vehicle_costs += amount;
//           } else {
//             const perVehicle = amount / vehicleIds.length;
//             vehicleIds.forEach(vId => {
//               vehicleStats[vId].vehicle_costs += perVehicle;
//             });
//           }
//         }
//       } else {
//         // Non-vehicle costs
//         totalOtherCosts += amount;
        
//         if (hasNoVehicles) {
//           vehicleStats['UNASSIGNED'].other_costs += amount;
//         } else {
//           const perVehicle = amount / vehicleIds.length;
//           vehicleIds.forEach(vId => {
//             vehicleStats[vId].other_costs += perVehicle;
//           });
//         }
//       }
//     });
    
//     // Calculate net profit per vehicle
//     const activeVehicles = hasNoVehicles ? ['UNASSIGNED'] : vehicleIds;
    
//     activeVehicles.forEach(vId => {
//       const stats = vehicleStats[vId];
//       stats.net_profit = stats.revenue - stats.purchases - stats.losses 
//                         - stats.vehicle_costs - stats.other_costs;
//     });
    
//     // Calculate operation totals
//     const totalPurchases = Object.values(vehicleStats)
//       .reduce((sum, v) => sum + v.purchases, 0);
//     const totalRevenue = Object.values(vehicleStats)
//       .reduce((sum, v) => sum + v.revenue, 0);
//     const totalLosses = Object.values(vehicleStats)
//       .reduce((sum, v) => sum + v.losses, 0);
//     const totalCosts = totalVehicleCosts + totalOtherCosts;
//     const netProfit = totalRevenue - totalPurchases - totalLosses - totalCosts;
    
//     return {
//       operation_id: operationId,
//       mode: hasNoVehicles ? 'LEGACY' : (isSingleVehicle ? 'SINGLE_VEHICLE' : 'MULTI_VEHICLE'),
//       vehicle_count: vehicleIds.length,
      
//       // Operation-level totals
//       total_revenue: totalRevenue,
//       total_purchases: totalPurchases,
//       total_losses: totalLosses,
//       total_costs: totalCosts,
//       vehicle_costs: totalVehicleCosts,
//       other_costs: totalOtherCosts,
//       net_profit: netProfit,
      
//       // Per-vehicle breakdown
//       vehicle_breakdown: Object.values(vehicleStats)
//     };
//   }

//   /**
//    * Calculate and distribute profits for a daily operation
//    * @param {number} dailyOperationId 
//    * @param {Transaction} transaction - Sequelize transaction
//    * @returns {Object} Profit distribution details
//    */
//   async calculateAndDistribute(dailyOperationId, transaction) {
//     // Calculate profits using the unified method
//     const profitData = await this.calculateDailyProfit(dailyOperationId);
    
//     // Create profit distribution record
//     const profitDistribution = await ProfitDistribution.create({
//       daily_operation_id: dailyOperationId,
//       total_revenue: profitData.total_revenue,
//       total_purchases: profitData.total_purchases,
//       total_losses: profitData.total_losses,
//       total_costs: profitData.total_costs,
//       vehicle_costs: profitData.vehicle_costs,
//       net_profit: profitData.net_profit
//     }, { transaction });

//     // Get all partners
//     const allPartners = await Partner.findAll({ transaction });
    
//     // Get vehicles in this operation with their partner associations
//     const operation = await DailyOperation.findByPk(dailyOperationId, {
//       include: [{
//         model: Vehicle,
//         as: 'vehicles',
//         include: [{
//           model: Partner,
//           as: 'partners',
//           through: { attributes: ['share_percentage'] }
//         }]
//       }],
//       transaction
//     });
    
//     const partnerProfits = [];
    
//     for (const partner of allPartners) {
//       const investmentPercentage = parseFloat(partner.investment_percentage);
      
//       // Check if partner owns vehicle(s) in this operation
//       const partnerVehicles = operation.vehicles?.filter(v =>
//         v.partners?.some(p => p.id === partner.id)
//       ) || [];
      
//       const isVehiclePartnerInOperation = partnerVehicles.length > 0;
      
//       // A. Calculate Base Profit Share
//       const baseShare = (profitData.net_profit * investmentPercentage) / 100;
      
//       // B. Calculate Vehicle Cost Deduction
//       let vehicleCostShare = 0;
//       if (!isVehiclePartnerInOperation && profitData.vehicle_costs > 0) {
//         // Non-vehicle partners pay their share of vehicle costs from profit
//         vehicleCostShare = (profitData.vehicle_costs * investmentPercentage) / 100;
//       }
      
//       // C. Calculate Final Profit
//       const finalProfit = baseShare - vehicleCostShare;

//       const partnerProfit = await PartnerProfit.create({
//         profit_distribution_id: profitDistribution.id,
//         partner_id: partner.id,
//         base_profit_share: baseShare,
//         vehicle_cost_share: vehicleCostShare,
//         final_profit: finalProfit
//       }, { transaction });

//       partnerProfits.push({
//         partner_id: partner.id,
//         partner_name: partner.name,
//         investment_percentage: investmentPercentage,
//         is_vehicle_partner: isVehiclePartnerInOperation,
//         owned_vehicles: partnerVehicles.map(v => v.id),
//         base_share: baseShare,
//         vehicle_cost_share: vehicleCostShare,
//         final_profit: finalProfit
//       });
//     }

//     // Verification
//     const totalDistributed = partnerProfits.reduce((sum, p) => sum + p.final_profit, 0);
//     const difference = Math.abs(profitData.net_profit - totalDistributed - profitData.vehicle_costs);
    
//     if (difference > 1) {
//       console.warn(`Profit distribution discrepancy: ${difference} EGP`);
//     }

//     return {
//       profit_distribution_id: profitDistribution.id,
//       mode: profitData.mode,
//       vehicle_count: profitData.vehicle_count,
//       total_revenue: profitData.total_revenue,
//       total_purchases: profitData.total_purchases,
//       total_losses: profitData.total_losses,
//       total_costs: profitData.total_costs,
//       vehicle_costs: profitData.vehicle_costs,
//       other_costs: profitData.other_costs,
//       net_profit: profitData.net_profit,
//       partner_profits: partnerProfits,
//       vehicle_breakdown: profitData.vehicle_breakdown,
//       verification: {
//         total_distributed: totalDistributed,
//         difference: difference
//       }
//     };
//   }

//   /**
//    * Get profit report for a date range
//    * @param {string} fromDate 
//    * @param {string} toDate 
//    * @returns {Object} Aggregated profit data
//    */
//   async getProfitReport(fromDate, toDate) {
//     const distributions = await ProfitDistribution.findAll({
//       include: [
//         {
//           model: DailyOperation,
//           as: 'daily_operation',
//           where: {
//             operation_date: {
//               [Op.between]: [fromDate, toDate]
//             }
//           },
//           include: [{
//             model: Vehicle,
//             as: 'vehicles'
//           }]
//         },
//         {
//           model: PartnerProfit,
//           as: 'partner_profits',
//           include: [
//             { model: Partner, as: 'partner' }
//           ]
//         }
//       ],
//       order: [
//         [{ model: DailyOperation, as: 'daily_operation' }, 'operation_date', 'DESC']
//       ]
//     });

//     const totals = {
//       total_revenue: 0,
//       total_purchases: 0,
//       total_losses: 0,
//       total_costs: 0,
//       vehicle_costs: 0,
//       net_profit: 0
//     };

//     const partnerTotals = {};
//     const vehicleTotals = {};
    
//     let operationCount = 0;
//     let singleVehicleOps = 0;
//     let multiVehicleOps = 0;
//     let legacyOps = 0;

//     distributions.forEach(dist => {
//       operationCount++;
      
//       // Aggregate totals
//       totals.total_revenue += parseFloat(dist.total_revenue);
//       totals.total_purchases += parseFloat(dist.total_purchases);
//       totals.total_losses += parseFloat(dist.total_losses);
//       totals.total_costs += parseFloat(dist.total_costs);
//       totals.vehicle_costs += parseFloat(dist.vehicle_costs);
//       totals.net_profit += parseFloat(dist.net_profit);
      
//       // Track operation type
//       const vehicleCount = dist.daily_operation.vehicles?.length || 0;
//       if (vehicleCount === 0) legacyOps++;
//       else if (vehicleCount === 1) singleVehicleOps++;
//       else multiVehicleOps++;
      
//       // Track vehicle statistics
//       dist.daily_operation.vehicles?.forEach(vehicle => {
//         if (!vehicleTotals[vehicle.id]) {
//           vehicleTotals[vehicle.id] = {
//             vehicle_id: vehicle.id,
//             vehicle_name: vehicle.name || `Vehicle ${vehicle.id}`,
//             operation_count: 0,
//             total_profit: 0
//           };
//         }
//         vehicleTotals[vehicle.id].operation_count++;
//       });

//       // Aggregate partner profits
//       dist.partner_profits.forEach(pp => {
//         const partnerId = pp.partner_id;

//         if (!partnerTotals[partnerId]) {
//           partnerTotals[partnerId] = {
//             partner_id: partnerId,
//             partner_name: pp.partner.name,
//             total_base_share: 0,
//             total_vehicle_cost_share: 0,
//             total_final_profit: 0
//           };
//         }

//         partnerTotals[partnerId].total_base_share += parseFloat(pp.base_profit_share);
//         partnerTotals[partnerId].total_vehicle_cost_share += parseFloat(pp.vehicle_cost_share);
//         partnerTotals[partnerId].total_final_profit += parseFloat(pp.final_profit);
//       });
//     });

//     return {
//       period: { from: fromDate, to: toDate },
//       summary: {
//         total_operations: operationCount,
//         legacy_operations: legacyOps,
//         single_vehicle_operations: singleVehicleOps,
//         multi_vehicle_operations: multiVehicleOps
//       },
//       totals,
//       partner_totals: Object.values(partnerTotals),
//       vehicle_totals: Object.values(vehicleTotals),
//       daily_distributions: distributions.map(dist => ({
//         id: dist.id,
//         operation_id: dist.daily_operation_id,
//         operation_date: dist.daily_operation.operation_date,
//         vehicle_count: dist.daily_operation.vehicles?.length || 0,
//         total_revenue: parseFloat(dist.total_revenue),
//         total_purchases: parseFloat(dist.total_purchases),
//         total_losses: parseFloat(dist.total_losses),
//         total_costs: parseFloat(dist.total_costs),
//         vehicle_costs: parseFloat(dist.vehicle_costs),
//         net_profit: parseFloat(dist.net_profit),
//         partner_profits: dist.partner_profits.map(pp => ({
//           partner_name: pp.partner.name,
//           final_profit: parseFloat(pp.final_profit)
//         }))
//       }))
//     };
//   }

//   /**
//    * Calculate profits for specific vehicle
//    * @param {number} operationId 
//    * @param {number} vehicleId 
//    * @returns {Object} Vehicle-specific profit data
//    */
//   async calculateVehicleProfit(operationId, vehicleId) {
//     const fullProfits = await this.calculateDailyProfit(operationId);
//     const vehicleProfit = fullProfits.vehicle_breakdown.find(
//       v => v.vehicle_id === vehicleId
//     );
    
//     if (!vehicleProfit) {
//       throw new Error(`Vehicle ${vehicleId} not found in operation ${operationId}`);
//     }
    
//     return vehicleProfit;
//   }

//   /**
//    * Close operation with profit calculation and distribution
//    * @param {number} operationId 
//    * @returns {Object} Closed operation with profit data
//    */
//   async closeOperation(operationId) {
//     const transaction = await sequelize.transaction();
    
//     try {
//       const operation = await DailyOperation.findByPk(operationId, { transaction });
      
//       if (!operation) {
//         throw new Error('Operation not found');
//       }
      
//       if (operation.status === 'CLOSED') {
//         throw new Error('Operation already closed');
//       }
      
//       // Calculate and distribute profits
//       const result = await this.calculateAndDistribute(operationId, transaction);
      
//       // Mark vehicle operations as completed (if any)
//       await VehicleOperation.update(
//         { status: 'COMPLETED' },
//         { 
//           where: { daily_operation_id: operationId },
//           transaction 
//         }
//       );
      
//       // Close operation
//       operation.status = 'CLOSED';
//       operation.closed_at = new Date();
//       await operation.save({ transaction });
      
//       await transaction.commit();
      
//       return {
//         operation,
//         ...result
//       };
//     } catch (error) {
//       await transaction.rollback();
//       throw error;
//     }
//   }
// }

// module.exports = new ProfitService();