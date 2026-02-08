const { Op } = require('sequelize');
const {
  DailyOperation,
  FarmTransaction,
  SaleTransaction,
  TransportLoss,
  DailyCost,
  ProfitDistribution,
  PartnerProfit,
  Farm,
  Buyer,
  Partner,
  ChickenType,
  CostCategory,
  Vehicle,
  User,
  VehicleOperation,
  FarmDebtPayment,
  BuyerDebtPayment
} = require('../models');
const ProfitService = require('../services/ProfitService');
const PeriodReportService = require('../services/PeriodReportService');
const ProfitReportService = require('../services/ProfitReportService');

// exports.getDailyReport = async (req, res) => {
//   try {
//     const { date } = req.params;

//     const operations = await DailyOperation.findAll({
//   where: { operation_date: date },
//   include: [
//     {
//       model: Vehicle,
//       as: 'vehicles',
//       through: { attributes: ['status'] }
//     },
//     {
//       model: FarmTransaction,as:"farm_transactions",
//       include: [{model:Farm,as:"farm"}, {model:ChickenType,as:"chicken_type"}]
//     },
//     {
//       model: SaleTransaction,as:"sale_transactions",
//       include: [
//   { model: Buyer, as: 'buyer' },
//   { model: ChickenType, as: 'chicken_type' }
// ]

//     },
//     {
//       model: TransportLoss,as:"losses",
//       include: [{model:ChickenType,as:"chicken_type"}]
//     },
//     {
//       model: DailyCost,as:"costs",
//       include: [{model:CostCategory,as: 'category'}]
//     },
//     {
//       model: ProfitDistribution,
//       as: 'profit_distribution',   
//       include: [
//         {
//           model: PartnerProfit,
//           as: 'partner_profits',    
//           include: [
//             { model: Partner, as: 'partner' }  
//           ]
//         }
//       ]
//     }
//   ]
// });


//     if (operations.length === 0) {
//       return res.status(404).json({
//         success: false,
//         message: 'لم يتم العثور على أي عمليات لهذا التاريخ'
//       });
//     }

// //     // Calculate summary
// //     const totalPurchases = operation.FarmTransactions.reduce((sum, t) => 
// //       sum + parseFloat(t.total_amount), 0
// //     );
// //     const totalSales = operation.SaleTransactions.reduce((sum, t) => 
// //       sum + parseFloat(t.total_amount), 0
// //     );
// //     const totalLosses = operation.TransportLosses.reduce((sum, l) => 
// //       sum + parseFloat(l.loss_amount), 0
// //     );
// //     const totalCosts = operation.DailyCosts.reduce((sum, c) => 
// //       sum + parseFloat(c.amount), 0
// //     );

// //     res.json({
// //       success: true,
// //       data: {
// //         operation_date: date,
// //         status: operation.status,
// //         summary: {
// //           total_purchases: totalPurchases,
// //           total_sales: totalSales,
// //           total_losses: totalLosses,
// //           total_costs: totalCosts,
// //           net_profit: operation.profit_distribution?.net_profit || 0
// //         },
// //         farm_transactions: operation.FarmTransactions,
// //         sales: operation.SaleTransactions,
// //         losses: operation.TransportLosses,
// //         costs: operation.DailyCosts,
// //         profit_distribution: operation.profit_distribution
// //       }
// //     });
// //   } catch (error) {
// //     res.status(500).json({
// //       success: false,
// //       message: 'Error generating daily report',
// //       error: error.message
// //     });
// //   }
// // };
//  // ✅ NEW: Calculate per-vehicle stats for each operation
//     const reportData = await Promise.all(
//       operations.map(async (operation) => {
//         const profitData = await ProfitService.calculateDailyProfit(operation.id);
        
//         return {
//           operation_id: operation.id,
//           vehicle_count: operation.vehicles.length,
//           vehicles: operation.vehicles.map(v => ({
//             id: v.id,
//             name: v.name,
//             plate_number: v.plate_number,
//             purchase_price: v.purchase_price,
//             created_at: v.created_at
//           })),
//           summary: {
//             total_purchases: profitData.totalPurchases,
//             total_sales: profitData.totalRevenue,
//             total_costs: profitData.totalCosts,
//             total_losses: profitData.totalLosses,
//             net_profit: profitData.netProfit
//           },
//           vehicle_breakdown: profitData.vehicleBreakdown,  // ✅ NEW
//           status: operation.status,
//           farm_transactions: operation.FarmTransactions,
//         sales: operation.SaleTransactions,
//         losses: operation.TransportLosses,
//         costs: operation.DailyCosts,
//         profit_distribution: operation.profit_distribution
//         };
//       })
//     );
    
//     res.json({
//       success: true,
//       data: {
//         operation_date: date,
//         operations: reportData
//       }
//     });
//   } catch (error) {
//     res.status(500).json({
//       success: false,
//       message: error.message
//     });
//   }
// };

// exports.getPeriodReport = async (req, res) => {
//   try {
//     const { from, to } = req.query;

//     if (!from || !to) {
//       return res.status(400).json({
//         success: false,
//         message: 'From and to dates are required'
//       });
//     }

//     const operations = await DailyOperation.findAll({
//       where: {
//         operation_date: {
//           [Op.between]: [from, to]
//         }
//       },
//       include: [
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
//         {
//           model: ProfitDistribution
//         }
//       ],
//       order: [['operation_date', 'DESC']]
//     });

//     // Aggregate totals
//     let totals = {
//       total_purchases: 0,
//       total_sales: 0,
//       total_losses: 0,
//       total_costs: 0,
//       total_profit: 0,
//       days_operated: operations.length
//     };

//     operations.forEach(op => {
//       op.FarmTransactions.forEach(t => {
//         totals.total_purchases += parseFloat(t.total_amount);
//       });
//       op.SaleTransactions.forEach(t => {
//         totals.total_sales += parseFloat(t.total_amount);
//       });
//       op.TransportLosses.forEach(l => {
//         totals.total_losses += parseFloat(l.loss_amount);
//       });
//       op.DailyCosts.forEach(c => {
//         totals.total_costs += parseFloat(c.amount);
//       });
//       if (op.ProfitDistribution) {
//         totals.total_profit += parseFloat(op.ProfitDistribution.net_profit);
//       }
//     });

//     res.json({
//       success: true,
//       data: {
//         period: { from, to },
//         totals,
//         operations
//       }
//     });
//   } catch (error) {
//     res.status(500).json({
//       success: false,
//       message: 'Error generating period report'
//     });
//   }
// };
// exports.getPeriodReport = async (req, res) => {
//   try {
//     const { from, to } = req.query;
//     console.log(from,to)
//     if (!from || !to) {
//       return res.status(400).json({
//         success: false,
//         message: 'From and to dates are required'
//       });
//     }

//     // التحقق من صيغة التاريخ
//     const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
//     if (!dateRegex.test(from) || !dateRegex.test(to)) {
//       return res.status(400).json({
//         success: false,
//         message: 'Invalid date format. Use YYYY-MM-DD'
//       });
//     }

//     const operations = await DailyOperation.findAll({
//       where: {
//         operation_date: {
//           [Op.between]: [
//             new Date(from + 'T00:00:00'),
//             new Date(to + 'T23:59:59')
//           ]
//         }
//       } ,
//       include: [
//         { model: FarmTransaction, include: [Farm, ChickenType] },
//         { model: SaleTransaction, include: [Buyer, ChickenType] },
//         { model: TransportLoss, include: [ChickenType] },
//         { model: DailyCost, include: [CostCategory] },
//         { model: ProfitDistribution, as: 'profit_distribution' } // استخدم الـ alias
//       ],
//       order: [['operation_date', 'DESC']]
//     });

//     let totals = {
//       total_purchases: 0,
//       total_sales: 0,
//       total_losses: 0,
//       total_costs: 0,
//       total_profit: 0,
//       days_operated: operations.length
//     };

//     operations.forEach(op => {
//       op.FarmTransactions.forEach(t => totals.total_purchases += parseFloat(t.total_amount));
//       op.SaleTransactions.forEach(t => totals.total_sales += parseFloat(t.total_amount));
//       op.TransportLosses.forEach(l => totals.total_losses += parseFloat(l.loss_amount));
//       op.DailyCosts.forEach(c => totals.total_costs += parseFloat(c.amount));
//       if (op.profit_distribution) totals.total_profit += parseFloat(op.profit_distribution.net_profit);
//     });

//     res.json({
//       success: true,
//       data: { period: { from, to }, totals, operations }
//     });
//   } catch (error) {
//     res.status(500).json({
//       success: false,
//       message: 'Error generating period report',
//       error: error.message
//     });
//   }
// };
// ✅ UPDATED: Multi-vehicle period report
// =========================
// Enhanced Daily Report Controller
// =========================
 
// exports.getEnhancedDailyReport = async (req, res) => {
//   try {
//     const { date } = req.params;
 
// let operations = await DailyOperation.findAll({
//   where: { operation_date: date },
//   subQuery: false,
//   include: [
//     {
//       model: User,
//       as: 'user',
//       attributes: ['id', 'username', 'full_name']
//     },
//     {
//       model: Vehicle,
//       as: 'vehicles',
//       through: { 
//         attributes: ['status', 'created_at'],
//         as: 'vehicle_operation_info'
//       },
//       include: [
//         {
//           model: Partner,
//           as: 'partners',
//           through: { 
//             attributes: ['share_percentage'],
//             as: 'vehicle_partner_info'
//           }
//         }
//       ]
//     },
//     {
//       model: ProfitDistribution,
//       as: 'profit_distribution',
//       include: [
//         {
//           model: PartnerProfit,
//           as: 'partner_profits',
//           include: [
//             { 
//               model: Partner, 
//               as: 'partner',
//               attributes: ['id', 'name', 'investment_percentage', 'is_vehicle_partner']
//             }
//           ]
//         }
//       ]
//     }
//   ]
//  });
  

//     // ✅ STEP 2: Process each operation
//     const enhancedReport = await Promise.all(
//       operations.map(async (operation) => {
        
//         // Calculate profit data
//         const profitData = await ProfitService.calculateDailyProfit(operation.id);

//         // ========================================
//         // 📦 FARM TRANSACTIONS DETAILS
//         // ========================================
//         const farmTransactions = await FarmTransaction.findAll({
//           where: { daily_operation_id: operation.id },
//           include: [
//             { 
//               model: Farm, 
//               as: 'farm',
//               attributes: ['id', 'name', 'owner_name', 'phone', 'current_balance']
//             },
//             { 
//               model: ChickenType, 
//               as: 'chicken_type',
//               attributes: ['id', 'name']
//             },
//             {
//               model: Vehicle,
//               as: 'vehicle',
//               attributes: ['id', 'name', 'plate_number']
//             },
//             {
//               model: VehicleOperation,
//               as: 'vehicle_operation',
//               attributes: ['id', 'status']
//             }
//           ],
//           order: [['sequence_number', 'ASC']]
//         });

//         const farmTransactionsDetails = farmTransactions.map(ft => {
//           const totalAmount = parseFloat(ft.total_amount);
//           const paidAmount = parseFloat(ft.paid_amount);
//           const remainingAmount = parseFloat(ft.remaining_amount);
//           const usedCredit = parseFloat(ft.used_credit || 0);
          
//           // Determine debt status with detailed breakdown
//           let debtStatus = '';
//           let debtStatusDetails = [];
          
//           // Check if cash was paid
//           if (paidAmount > 0) {
//             debtStatusDetails.push(`دفع نقدي: ${paidAmount.toFixed(2)} جنيه`);
//           }
          
//           // Check if credit was used
//           if (usedCredit > 0) {
//             debtStatusDetails.push(`استخدم رصيد: ${usedCredit.toFixed(2)} جنيه`);
//           }
          
//           // Check if there's remaining debt (we owe them)
//           if (remainingAmount > 0) {
//             debtStatusDetails.push(`دين جديد علينا: ${remainingAmount.toFixed(2)} جنيه`);
//           }
          
//           // Build final status
//           if (paidAmount >= totalAmount && usedCredit === 0) {
//             debtStatus = 'دفع كامل نقداً';
//           } else if (paidAmount + usedCredit >= totalAmount) {
//             debtStatus = 'سدد كامل (نقد + رصيد)';
//           } else {
//             debtStatus = 'دفع جزئي';
//           }
          
//           // Calculate balance change
//           // used_credit reduces their RECEIVABLE (positive balance)
//           // remaining_amount creates new PAYABLE (negative balance) - we owe them
//           const balanceChange = -usedCredit - remainingAmount;

//           return {
//             transaction_id: ft.id,
//             sequence_number: ft.sequence_number,
//             farm: {
//               id: ft.farm.id,
//               name: ft.farm.name,
//               owner_name: ft.farm.owner_name,
//               phone: ft.farm.phone,
//               current_balance: parseFloat(ft.farm.current_balance),
//               balance_type: ft.farm.current_balance < 0 ? 'لهم علينا' : 
//                            ft.farm.current_balance > 0 ? 'لنا عليهم' : 'متصفي'
//             },
//             chicken_type: {
//               id: ft.chicken_type.id,
//               name: ft.chicken_type.name
//             },
//             vehicle: {
//               id: ft.vehicle.id,
//               name: ft.vehicle.name,
//               plate_number: ft.vehicle.plate_number
//             },
//             weighing: {
//               empty_vehicle_weight: parseFloat(ft.empty_vehicle_weight),
//               loaded_vehicle_weight: parseFloat(ft.loaded_vehicle_weight),
//               cage_count: ft.cage_count,
//               cage_weight_per_unit: parseFloat(ft.cage_weight_per_unit),
//               total_cage_weight: ft.cage_count * parseFloat(ft.cage_weight_per_unit),
//               net_chicken_weight: parseFloat(ft.net_chicken_weight)
//             },
//             pricing: {
//               price_per_kg: parseFloat(ft.price_per_kg),
//               total_amount: totalAmount,
//               paid_amount: paidAmount,
//               remaining_amount: remainingAmount,
//               used_credit: usedCredit,
//               total_paid_with_credit: paidAmount + usedCredit,
//               payment_percentage: (((paidAmount + usedCredit) / totalAmount) * 100).toFixed(2) + '%'
//             },
//             debt_info: {
//               status: debtStatus,
//               status_details: debtStatusDetails,
//               balance_change: balanceChange,
//               breakdown: {
//                 cash_paid: paidAmount,
//                 credit_used: usedCredit,
//                 new_debt_created: remainingAmount,
//                 net_balance_impact: balanceChange
//               },
//               is_full_payment: (paidAmount + usedCredit) >= totalAmount,
//               has_remaining_debt: remainingAmount > 0,
//               used_existing_credit: usedCredit > 0,
//               interpretation: balanceChange < 0 
//                 ? `المزرعة دفعت ${Math.abs(balanceChange).toFixed(2)} جنيه من رصيدها`
//                 : balanceChange > 0
//                   ? `احنا مدينين للمزرعة بـ ${Math.abs(balanceChange).toFixed(2)} جنيه إضافي`
//                   : 'لا يوجد تغيير في الرصيد'
//             },
//             transaction_time: ft.transaction_time,
//             notes: ft.notes || null
//           };
//         });

//         // ========================================
//         // 🛒 SALE TRANSACTIONS DETAILS
//         // ========================================
//         const saleTransactions = await SaleTransaction.findAll({
//           where: { daily_operation_id: operation.id },
//           include: [
//             { 
//               model: Buyer, 
//               as: 'buyer',
//               attributes: ['id', 'name', 'phone', 'address', 'total_debt']
//             },
//             { 
//               model: ChickenType, 
//               as: 'chicken_type',
//               attributes: ['id', 'name']
//             },
//             {
//               model: Vehicle,
//               as: 'vehicle',
//               attributes: ['id', 'name', 'plate_number']
//             },
//             {
//               model: VehicleOperation,
//               as: 'vehicle_operation',
//               attributes: ['id', 'status']
//             }
//           ],
//           order: [['sequence_number', 'ASC']]
//         });

//         const saleTransactionsDetails = saleTransactions.map(st => {
//           const totalAmount = parseFloat(st.total_amount);
//           const paidAmount = parseFloat(st.paid_amount);
//           const remainingAmount = parseFloat(st.remaining_amount);
//           const oldDebtPaid = parseFloat(st.old_debt_paid || 0);
          
//           // Calculate buyer's debt change
//           let buyerDebtChange = remainingAmount; // New debt
//           if (oldDebtPaid > 0) {
//             buyerDebtChange -= oldDebtPaid; // Reduced old debt
//           }
          
//           // Determine payment status
//           let paymentStatus = '';
//           if (paidAmount >= totalAmount) {
//             paymentStatus = 'دفع كامل';
//           } else if (paidAmount > 0) {
//             paymentStatus = 'دفع جزئي';
//           } else {
//             paymentStatus = 'لم يدفع';
//           }
          
//           if (oldDebtPaid > 0) {
//             paymentStatus += ` + سدد ${oldDebtPaid.toFixed(2)} من الدين القديم`;
//           }

//           return {
//             transaction_id: st.id,
//             sequence_number: st.sequence_number,
//             buyer: {
//               id: st.buyer.id,
//               name: st.buyer.name,
//               phone: st.buyer.phone,
//               address: st.buyer.address,
//               total_debt: parseFloat(st.buyer.total_debt),
//               debt_status: st.buyer.total_debt > 0 ? 'مدين' : 'لا يوجد دين'
//             },
//             chicken_type: {
//               id: st.chicken_type.id,
//               name: st.chicken_type.name
//             },
//             vehicle: {
//               id: st.vehicle.id,
//               name: st.vehicle.name,
//               plate_number: st.vehicle.plate_number
//             },
//             weighing: {
//               loaded_cages_weight: parseFloat(st.loaded_cages_weight),
//               empty_cages_weight: parseFloat(st.empty_cages_weight),
//               cage_count: st.cage_count,
//               net_chicken_weight: parseFloat(st.net_chicken_weight)
//             },
//             pricing: {
//               price_per_kg: parseFloat(st.price_per_kg),
//               total_amount: totalAmount,
//               paid_amount: paidAmount,
//               remaining_amount: remainingAmount,
//               old_debt_paid: oldDebtPaid,
//               payment_percentage: ((paidAmount / totalAmount) * 100).toFixed(2) + '%'
//             },
//             debt_info: {
//               status: paymentStatus,
//               buyer_debt_change: buyerDebtChange,
//               is_full_payment: paidAmount >= totalAmount,
//               has_remaining_debt: remainingAmount > 0,
//               paid_old_debt: oldDebtPaid > 0,
//               net_debt_impact: buyerDebtChange.toFixed(2)
//             },
//             transaction_time: st.transaction_time,
//             notes: st.notes || null
//           };
//         });

//         // ========================================
//         // 🚨 TRANSPORT LOSSES DETAILS
//         // ========================================
//         const transportLosses = await TransportLoss.findAll({
//           where: { daily_operation_id: operation.id },
//           include: [
//             { 
//               model: ChickenType, 
//               as: 'chicken_type',
//               attributes: ['id', 'name']
//             },
//             {
//               model: Vehicle,
//               as: 'vehicle',
//               attributes: ['id', 'name', 'plate_number']
//             },
//             {
//               model: Farm,
//               as: 'farm',
//               attributes: ['id', 'name'],
//               required: false
//             },
//             {
//               model: VehicleOperation,
//               as: 'vehicle_operation',
//               attributes: ['id', 'status']
//             }
//           ],
//           order: [['recorded_at', 'ASC']]
//         });

//         const transportLossesDetails = transportLosses.map(loss => {
//           const lossAmount = parseFloat(loss.loss_amount);
//           const deadWeight = parseFloat(loss.dead_weight);
          
//           // Check if loss is attributed to a farm
//           const isFarmResponsible = loss.farm_id !== null;
          
//           let farmResponsibility = {};
          
//           if (isFarmResponsible) {
//             farmResponsibility = {
//               is_farm_responsible: true,
//               farm: {
//                 id: loss.farm.id,
//                 name: loss.farm.name
//               },
//               balance_impact: {
//                 amount: lossAmount,
//                 direction: 'increases_receivable',
//                 explanation: `المزرعة مسؤولة عن الخسارة، تم خصم ${lossAmount.toFixed(2)} جنيه من رصيدها (لنا عليهم)`,
//                 note: 'الخسارة تُحمّل على المزرعة وتزيد من الدين اللي عليهم لينا'
//               }
//             };
//           } else {
//             farmResponsibility = {
//               is_farm_responsible: false,
//               note: 'خسارة عامة غير منسوبة لمزرعة محددة - تُخصم من الأرباح العامة'
//             };
//           }
          
//           return {
//             loss_id: loss.id,
//             chicken_type: {
//               id: loss.chicken_type.id,
//               name: loss.chicken_type.name
//             },
//             vehicle: {
//               id: loss.vehicle.id,
//               name: loss.vehicle.name,
//               plate_number: loss.vehicle.plate_number
//             },
//             loss_details: {
//               dead_weight: deadWeight,
//               price_per_kg: parseFloat(loss.price_per_kg),
//               loss_amount: lossAmount,
//               location: loss.location || 'غير محدد'
//             },
//             farm_responsibility: farmResponsibility,
//             recorded_at: loss.recorded_at,
//             notes: loss.notes || null
//           };
//         });

//         // ========================================
//         // 💰 DAILY COSTS DETAILS
//         // ========================================
//         const dailyCosts = await DailyCost.findAll({
//           where: { daily_operation_id: operation.id },
//           include: [
//             { 
//               model: CostCategory, 
//               as: 'category',
//               attributes: ['id', 'name', 'description', 'is_vehicle_cost']
//             },
//             {
//               model: Vehicle,
//               as: 'vehicle',
//               attributes: ['id', 'name', 'plate_number'],
//               required: false
//             },
//             {
//               model: VehicleOperation,
//               as: 'vehicle_operation',
//               attributes: ['id', 'status'],
//               required: false
//             }
//           ],
//           order: [['recorded_at', 'ASC']]
//         });

//         const dailyCostsDetails = dailyCosts.map(cost => {
//           const isVehicleCost = cost.category.is_vehicle_cost;
//           const hasSpecificVehicle = cost.vehicle_id !== null;
          
//           let costAllocation = '';
//           if (isVehicleCost && hasSpecificVehicle) {
//             costAllocation = `خاص بالعربية: ${cost.vehicle.name}`;
//           } else if (isVehicleCost && !hasSpecificVehicle) {
//             costAllocation = 'موزع على كل العربيات';
//           } else {
//             costAllocation = 'مصروف عام';
//           }

//           return {
//             cost_id: cost.id,
//             category: {
//               id: cost.category.id,
//               name: cost.category.name,
//               description: cost.category.description,
//               is_vehicle_cost: isVehicleCost,
//               category_type: isVehicleCost ? 'مصروف عربية' : 'مصروف عام'
//             },
//             vehicle: cost.vehicle ? {
//               id: cost.vehicle.id,
//               name: cost.vehicle.name,
//               plate_number: cost.vehicle.plate_number
//             } : null,
//             cost_details: {
//               amount: parseFloat(cost.amount),
//               description: cost.description || 'لا يوجد تفاصيل',
//               allocation: costAllocation,
//               affects_vehicle_partners: isVehicleCost
//             },
//             recorded_at: cost.recorded_at
//           };
//         });

//         // Group costs by category
//         const costsByCategory = dailyCostsDetails.reduce((acc, cost) => {
//           const categoryName = cost.category.name;
//           if (!acc[categoryName]) {
//             acc[categoryName] = {
//               category_info: cost.category,
//               costs: [],
//               total_amount: 0,
//               count: 0
//             };
//           }
//           acc[categoryName].costs.push(cost);
//           acc[categoryName].total_amount += cost.cost_details.amount;
//           acc[categoryName].count += 1;
//           return acc;
//         }, {});

//         // ========================================
//         // 📊 DEBT PAYMENTS (STANDALONE)
//         // ========================================
//         const farmDebtPayments = await FarmDebtPayment.findAll({
//           where: { daily_operation_id: operation.id },
//           include: [
//             {
//               model: Farm,
//               as: 'farm',
//               attributes: ['id', 'name', 'current_balance']
//             }
//           ]
//         });

//         const buyerDebtPayments = await BuyerDebtPayment.findAll({
//           where: { daily_operation_id: operation.id },
//           include: [
//             {
//               model: Buyer,
//               as: 'buyer',
//               attributes: ['id', 'name', 'total_debt']
//             }
//           ]
//         });

//         // ========================================
//         // 📈 OPERATION SUMMARY
//         // ========================================
//         const summary = {
//           operation_info: {
//             operation_id: operation.id,
//             operation_date: operation.operation_date,
//             status: operation.status,
//             user: {
//               id: operation.user.id,
//               username: operation.user.username,
//               full_name: operation.user.full_name,
//              },
//             vehicles_count: operation.vehicles.length,
//             vehicles: operation.vehicles.map(v => ({
//               id: v.id,
//               name: v.name,
//               plate_number: v.plate_number,
//               status: v.vehicle_operation_info?.status || 'ACTIVE',
//               partners: v.partners?.map(p => ({
//                 id: p.id,
//                 name: p.name,
//                 share_percentage: parseFloat(p.vehicle_partner_info?.share_percentage || 0)
//               })) || []
//             })),
//             created_at: operation.created_at,
//             closed_at: operation.closed_at
//           },
          
//           financial_summary: {
//             total_purchases: profitData.totalPurchases,
//             total_revenue: profitData.totalRevenue,
//             total_losses: profitData.totalLosses,
//             total_costs: profitData.totalCosts,
//             vehicle_costs: profitData.vehicleCosts,
//             other_costs: profitData.otherCosts,
//             net_profit: profitData.netProfit,
//             profit_margin_percentage: profitData.totalRevenue > 0 
//               ? ((profitData.netProfit / profitData.totalRevenue) * 100).toFixed(2) + '%'
//               : '0.00%'
//           },
          
//           transactions_summary: {
//             farm_transactions: {
//               count: farmTransactionsDetails.length,
//               total_weight: farmTransactionsDetails.reduce((sum, ft) => 
//                 sum + ft.weighing.net_chicken_weight, 0
//               ),
//               total_amount: farmTransactionsDetails.reduce((sum, ft) => 
//                 sum + ft.pricing.total_amount, 0
//               ),
//               total_paid: farmTransactionsDetails.reduce((sum, ft) => 
//                 sum + ft.pricing.paid_amount, 0
//               ),
//               total_remaining: farmTransactionsDetails.reduce((sum, ft) => 
//                 sum + ft.pricing.remaining_amount, 0
//               )
//             },
            
//             sale_transactions: {
//               count: saleTransactionsDetails.length,
//               total_weight: saleTransactionsDetails.reduce((sum, st) => 
//                 sum + st.weighing.net_chicken_weight, 0
//               ),
//               total_amount: saleTransactionsDetails.reduce((sum, st) => 
//                 sum + st.pricing.total_amount, 0
//               ),
//               total_paid: saleTransactionsDetails.reduce((sum, st) => 
//                 sum + st.pricing.paid_amount, 0
//               ),
//               total_remaining: saleTransactionsDetails.reduce((sum, st) => 
//                 sum + st.pricing.remaining_amount, 0
//               ),
//               total_old_debt_collected: saleTransactionsDetails.reduce((sum, st) => 
//                 sum + st.pricing.old_debt_paid, 0
//               )
//             },
            
//             losses: {
//               count: transportLossesDetails.length,
//               total_weight: transportLossesDetails.reduce((sum, loss) => 
//                 sum + loss.loss_details.dead_weight, 0
//               ),
//               total_amount: transportLossesDetails.reduce((sum, loss) => 
//                 sum + loss.loss_details.loss_amount, 0
//               )
//             },
            
//             costs: {
//               count: dailyCostsDetails.length,
//               total_amount: dailyCostsDetails.reduce((sum, cost) => 
//                 sum + cost.cost_details.amount, 0
//               ),
//               vehicle_costs_total: dailyCostsDetails
//                 .filter(c => c.category.is_vehicle_cost)
//                 .reduce((sum, c) => sum + c.cost_details.amount, 0),
//               other_costs_total: dailyCostsDetails
//                 .filter(c => !c.category.is_vehicle_cost)
//                 .reduce((sum, c) => sum + c.cost_details.amount, 0)
//             }
//           },
          
//           vehicle_breakdown: profitData.vehicleBreakdown?.map(vb => ({
//             vehicle_id: vb.vehicle_id,
//             vehicle_name: operation.vehicles.find(v => v.id === vb.vehicle_id)?.name || 'Unknown',
//             purchases: vb.purchases,
//             revenue: vb.revenue,
//             losses: vb.losses,
//             vehicle_costs: vb.vehicle_costs,
//             other_costs: vb.other_costs,
//             net_profit: vb.net_profit
//           })) || []
//         };

//         // ========================================
//         // 💼 PROFIT DISTRIBUTION
//         // ========================================
// //         const profitDistribution = operation.profit_distribution ? {
// //           distribution_id: operation.profit_distribution.id,
// //           calculated_at: operation.profit_distribution.calculated_at,
// //           totals: {
// //             total_revenue: parseFloat(operation.profit_distribution.total_revenue),
// //             total_purchases: parseFloat(operation.profit_distribution.total_purchases),
// //             total_losses: parseFloat(operation.profit_distribution.total_losses),
// //             total_costs: parseFloat(operation.profit_distribution.total_costs),
// //             vehicle_costs: parseFloat(operation.profit_distribution.vehicle_costs),
// //             net_profit: parseFloat(operation.profit_distribution.net_profit)
// //           },
// //           partner_profits: operation.profit_distribution.partner_profits?.map(pp => ({
// //             partner: {
// //               id: pp.partner.id,
// //               name: pp.partner.name,
// //               investment_percentage: parseFloat(pp.partner.investment_percentage||pp.partner.get('investment_percentage')),
// //               is_vehicle_partner: pp.partner.is_vehicle_partner
// //             },
// //             profit_breakdown: {
// //               base_profit_share: parseFloat(pp.base_profit_share),
// //               vehicle_cost_share: parseFloat(pp.vehicle_cost_share),
// //               final_profit: parseFloat(pp.final_profit),
// //               profit_percentage: operation.profit_distribution.net_profit > 0
// //                 ? ((parseFloat(pp.final_profit) / parseFloat(operation.profit_distribution.net_profit)) * 100).toFixed(2) + '%'
// //                 : '0.00%'
// //             }
// //           })) || []
// //         } : null;
// // console.log("operations",operation.profit_distribution.partner_profits[1].partner);
// // ========================================
// // 💼 PROFIT DISTRIBUTION
// // ========================================
// // ========================================
// // 💼 PROFIT DISTRIBUTION
// // ========================================
// let profitDistribution = null;

// if (operation.profit_distribution) {
//   const plainDistribution = operation.profit_distribution.get ? 
//     operation.profit_distribution.get({ plain: true }) : 
//     operation.profit_distribution;

//   // ✅ FETCH PARTNERS SEPARATELY to avoid nested include issues
//   const partnerProfits = plainDistribution.partner_profits || [];
  
//   if (partnerProfits.length > 0) {
//     const partnerIds = partnerProfits.map(pp => pp.partner_id);
    
//     // Fetch all partners at once with all attributes
//     const partnersData = await Partner.findAll({
//       where: { id: partnerIds },
//       attributes: ['id', 'name', 'investment_percentage', 'is_vehicle_partner'],
//       raw: true
//     });
    
//     // Create a map for quick lookup
//     const partnersMap = partnersData.reduce((map, p) => {
//       map[p.id] = p;
//       return map;
//     }, {});

//     profitDistribution = {
//       distribution_id: plainDistribution.id,
//       calculated_at: plainDistribution.calculated_at,
//       totals: {
//         total_revenue: parseFloat(plainDistribution.total_revenue),
//         total_purchases: parseFloat(plainDistribution.total_purchases),
//         total_losses: parseFloat(plainDistribution.total_losses),
//         total_costs: parseFloat(plainDistribution.total_costs),
//         vehicle_costs: parseFloat(plainDistribution.vehicle_costs),
//         net_profit: parseFloat(plainDistribution.net_profit)
//       },
//       partner_profits: partnerProfits.map(pp => {
//         const plainPP = pp.get ? pp.get({ plain: true }) : pp;
//         const partner = partnersMap[plainPP.partner_id];
        
//         return {
//           partner: {
//             id: partner.id,
//             name: partner.name,
//             investment_percentage: parseFloat(partner.investment_percentage),
//             is_vehicle_partner: partner.is_vehicle_partner
//           },
//           profit_breakdown: {
//             base_profit_share: parseFloat(plainPP.base_profit_share),
//             vehicle_cost_share: parseFloat(plainPP.vehicle_cost_share),
//             final_profit: parseFloat(plainPP.final_profit),
//             profit_percentage: plainDistribution.net_profit > 0
//               ? ((parseFloat(plainPP.final_profit) / parseFloat(plainDistribution.net_profit)) * 100).toFixed(2) + '%'
//               : '0.00%'
//           }
//         };
//       })
//     };
//   } else {
//     // No partner profits
//     profitDistribution = {
//       distribution_id: plainDistribution.id,
//       calculated_at: plainDistribution.calculated_at,
//       totals: {
//         total_revenue: parseFloat(plainDistribution.total_revenue),
//         total_purchases: parseFloat(plainDistribution.total_purchases),
//         total_losses: parseFloat(plainDistribution.total_losses),
//         total_costs: parseFloat(plainDistribution.total_costs),
//         vehicle_costs: parseFloat(plainDistribution.vehicle_costs),
//         net_profit: parseFloat(plainDistribution.net_profit)
//       },
//       partner_profits: []
//     };
//   }
// }

// // Remove the debug log after confirming it works

// // Debug log (remove after confirming it works)
// if (profitDistribution?.partner_profits?.[1]) {
//   console.log("Partner investment_percentage:", profitDistribution.partner_profits[1].partner.investment_percentage);
// }
//         // ========================================
//         // 🎯 RETURN COMPLETE REPORT
//         // ========================================
//         return {
//           summary,
          
//           detailed_transactions: {
//             farm_loading: {
//               transactions: farmTransactionsDetails,
//               summary: summary.transactions_summary.farm_transactions
//             },
            
//             sales: {
//               transactions: saleTransactionsDetails,
//               summary: summary.transactions_summary.sale_transactions
//             },
            
//             losses: {
//               records: transportLossesDetails,
//               summary: summary.transactions_summary.losses
//             },
            
//             costs: {
//               records: dailyCostsDetails,
//               by_category: costsByCategory,
//               summary: summary.transactions_summary.costs
//             }
//           },
          
//           debt_movements: {
//             farm_payments: farmDebtPayments.map(fp => {
//               const amount = parseFloat(fp.amount);
//               const direction = fp.payment_direction;
              
//               let explanation = '';
//               let balance_impact = 0;
              
//               if (direction === 'FROM_FARM') {
//                 // Farm pays us → reduces RECEIVABLE (their debt to us)
//                 explanation = `المزرعة دفعتلنا ${amount.toFixed(2)} جنيه من الدين اللي عليها`;
//                 balance_impact = -amount; // Reduces positive balance
//               } else {
//                 // We pay farm → reduces PAYABLE (our debt to them)
//                 explanation = `احنا دفعنا للمزرعة ${amount.toFixed(2)} جنيه من الدين اللي علينا`;
//                 balance_impact = amount; // Reduces negative balance (moves toward zero)
//               }
              
//               return {
//                 payment_id: fp.id,
//                 farm: {
//                   id: fp.farm.id,
//                   name: fp.farm.name,
//                   current_balance: parseFloat(fp.farm.current_balance),
//                   balance_display: fp.farm.current_balance <0 
//                     ? `لهم علينا: ${fp.farm.current_balance.toFixed(2)} جنيه`
//                     : fp.farm.current_balance >0
//                       ? `لنا عليهم: ${Math.abs(fp.farm.current_balance).toFixed(2)} جنيه`
//                       : 'متصفي'
//                 },
//                 payment_details: {
//                   amount: amount,
//                   direction: direction,
//                   direction_arabic: direction === 'FROM_FARM' ? 'من المزرعة لينا' : 'مننا للمزرعة',
//                   explanation: explanation,
//                   balance_impact: balance_impact
//                 },
//                 payment_date: fp.payment_date,
//                 notes: fp.notes,
//                 is_standalone: true // This is NOT part of a loading transaction
//               };
//             }),
            
//             buyer_payments: buyerDebtPayments.map(bp => {
//               const amount = parseFloat(bp.amount);
              
//               return {
//                 payment_id: bp.id,
//                 buyer: {
//                   id: bp.buyer.id,
//                   name: bp.buyer.name,
//                   total_debt: parseFloat(bp.buyer.total_debt),
//                   debt_display: bp.buyer.total_debt > 0
//                     ? `مدين بـ ${parseFloat(bp.buyer.total_debt).toFixed(2)} جنيه`
//                     : 'متصفي'
//                 },
//                 payment_details: {
//                   amount: amount,
//                   explanation: `المشتري دفع ${amount.toFixed(2)} جنيه من ديونه`,
//                   balance_impact: -amount // Reduces buyer's debt
//                 },
//                 payment_date: bp.payment_date,
//                 notes: bp.notes,
//                 is_standalone: true // This is NOT part of a sale transaction
//               };
//             })
//           },
          
//           profit_distribution: profitDistribution
//         };
//       })
//     );

//     // ========================================
//     // 📤 SEND RESPONSE
//     // ========================================
//     console.log('repo',enhancedReport);
    
//     res.json({
//       success: true,
//       data: {
//         report_date: date,
//         operations_count: operations.length,
//         report_generated_at: new Date(),
//         operation: enhancedReport[0]
//       }
//     });

//   } catch (error) {
//     console.error('Error generating enhanced daily report:', error);
//     res.status(500).json({
//       success: false,
//       message: 'حدث خطأ أثناء إنشاء التقرير اليومي',
//       error: error.message
//     });
//   }
// };

exports.getEnhancedDailyReport = async (req, res) => {
  try {
    const { date } = req.params;
 
    let operations = await DailyOperation.findAll({
      where: { operation_date: date },
      subQuery: false,
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'username', 'full_name']
        },
        {
          model: Vehicle,
          as: 'vehicles',
          through: { 
            attributes: ['status', 'created_at'],
            as: 'vehicle_operation_info'
          },
          include: [
            {
              model: Partner,
              as: 'partners',
              through: { 
                attributes: ['share_percentage'],
                as: 'vehicle_partner_info'
              }
            }
          ]
        },
        {
          model: ProfitDistribution,
          as: 'profit_distribution',
          include: [
            {
              model: PartnerProfit,
              as: 'partner_profits',
              include: [
                { 
                  model: Partner, 
                  as: 'partner',
                  attributes: ['id', 'name', 'investment_percentage', 'is_vehicle_partner']
                }
              ]
            }
          ]
        }
      ]
    });

        if (operations.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'لم يتم العثور على أي عمليات لهذا التاريخ'
      });
    }
    // ========================================
    // 🎯 INITIALIZE CONSOLIDATED REPORT
    // ========================================
    const consolidatedReport = {
  
      summary: {
        operation_info: {
          operation_date: date,
          operation_id: [],
          operations_count: operations.length,
          vehicles_count: 0,
          vehicles: [],
          users: [],
          status: operations.every(op => op.status === 'CLOSED') ? 'CLOSED' : 'ACTIVE'
        },
 
        financial_summary: {
          total_purchases: 0,
            lossesWithFarm: 0,
  lossesWithoutFarm: 0,
          total_revenue: 0,
          total_losses: 0,
          total_costs: 0,
          vehicle_costs: 0,
          other_costs: 0,
          net_profit: 0,
          profit_margin_percentage: '0.00%'
        },
        transactions_summary: {
          farm_transactions: {
            count: 0,
            total_weight: 0,
            total_amount: 0,
            total_paid: 0,
            total_remaining: 0
          },
          
          sale_transactions: {
            count: 0,
            total_weight: 0,
            total_amount: 0,
            total_paid: 0,
            total_remaining: 0,
            total_old_debt_collected: 0
          },
          
          losses: {
            count: 0,
            total_weight: 0,
            total_amount: 0
          },
          
          costs: {
            count: 0,
            total_amount: 0,
            vehicle_costs_total: 0,
            other_costs_total: 0
          }
        },
        
        vehicle_breakdown: []
      },
      
      detailed_transactions: {
        farm_loading: {
          transactions: [],
          summary: {}
        },
        
        sales: {
          transactions: [],
          summary: {}
        },
        
        losses: {
          records: [],
          summary: {}
        },
        
        costs: {
          records: [],
          by_category: {},
          summary: {}
        }
      },
      
      debt_movements: {
        farm_payments: [],
        buyer_payments: []
      },
      
      profit_distribution: {
        totals: {
          total_revenue: 0,
          total_purchases: 0,
          // total_losses: 0,
          lossesWithFarm: 0,
    lossesWithoutFarm: 0,
          total_costs: 0,
          vehicle_costs: 0,
          net_profit: 0
        },
        partner_profits: {}
      }
    };

    // ========================================
    // 🔄 PROCESS ALL OPERATIONS
    // ========================================
    const vehiclesMap = new Map();
    const usersMap = new Map();
    const vehicleBreakdownMap = new Map();

    for (const operation of operations) {
      // ========================================
      // 💰 CALCULATE PROFIT DATA
      // ========================================
      const profitData = await ProfitService.calculateDailyProfit(operation.id);

      // Update financial summary
      consolidatedReport.summary.operation_info.operation_id.push(operation.id)
      consolidatedReport.summary.financial_summary.total_purchases += profitData.totalPurchases;
      consolidatedReport.summary.financial_summary.total_revenue += profitData.totalRevenue;
      // consolidatedReport.summary.financial_summary.total_losses += profitData.totalLosses;
      consolidatedReport.summary.financial_summary.lossesWithFarm += profitData.lossesWithFarm || 0;
consolidatedReport.summary.financial_summary.lossesWithoutFarm += profitData.lossesWithoutFarm || 0;

      consolidatedReport.summary.financial_summary.total_costs += profitData.totalCosts;
      consolidatedReport.summary.financial_summary.vehicle_costs += profitData.vehicleCosts;
      consolidatedReport.summary.financial_summary.other_costs += profitData.otherCosts;
      consolidatedReport.summary.financial_summary.net_profit += profitData.netProfit;
      console.log("\nprofitData",profitData);
      
      // Track vehicles and users
      operation.vehicles.forEach(v => {
        if (!vehiclesMap.has(v.id)) {
          vehiclesMap.set(v.id, {
            id: v.id,
            name: v.name,
            plate_number: v.plate_number,
            partners: v.partners?.map(p => ({
              id: p.id,
              name: p.name,
              share_percentage: parseFloat(p.vehicle_partner_info?.share_percentage || 0)
            })) || []
          });
        }
      });

      if (!usersMap.has(operation.user.id)) {
        usersMap.set(operation.user.id, {
          id: operation.user.id,
          username: operation.user.username,
          full_name: operation.user.full_name
        });
      }

      // Merge vehicle breakdown
      if (profitData.vehicleBreakdown) {
        profitData.vehicleBreakdown.forEach(vb => {
          if (vehicleBreakdownMap.has(vb.vehicle_id)) {
            const existing = vehicleBreakdownMap.get(vb.vehicle_id);
            existing.purchases += vb.purchases;
            existing.revenue += vb.revenue;
            existing.losses += vb.losses;
                  existing.lossesWithFarm += vb.lossesWithFarm || 0;        // ✅ جديد
      existing.lossesWithoutFarm += vb.lossesWithoutFarm || 0;  // ✅ جديد

            existing.vehicle_costs += vb.vehicle_costs;
            existing.other_costs += vb.other_costs;
            existing.net_profit += vb.net_profit;

                console.log("existing.lossesWithFarm",existing.lossesWithFarm);
         console.log("existing.lossesWithoutFarm",existing.lossesWithoutFarm);
           } else {
            vehicleBreakdownMap.set(vb.vehicle_id, { ...vb });
          }
     
         
          
        });
      }
       
          
      // ========================================
      // 📦 FARM TRANSACTIONS
      // ========================================
      const farmTransactions = await FarmTransaction.findAll({
        where: { daily_operation_id: operation.id },
        include: [
          { 
            model: Farm, 
            as: 'farm',
            attributes: ['id', 'name', 'owner_name', 'phone', 'current_balance']
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
          },
          {
            model: VehicleOperation,
            as: 'vehicle_operation',
            attributes: ['id', 'status']
          }
        ],
        order: [['sequence_number', 'ASC']]
      });

      farmTransactions.forEach(ft => {
        const totalAmount = parseFloat(ft.total_amount);
        const paidAmount = parseFloat(ft.paid_amount);
        const remainingAmount = parseFloat(ft.remaining_amount);
        const usedCredit = parseFloat(ft.used_credit || 0);
        
        let debtStatus = '';
        let debtStatusDetails = [];
        
        if (paidAmount > 0) {
          debtStatusDetails.push(`دفع نقدي: ${paidAmount.toFixed(2)} جنيه`);
        }
        
        if (usedCredit > 0) {
          debtStatusDetails.push(`استخدم رصيد: ${usedCredit.toFixed(2)} جنيه`);
        }
        
        if (remainingAmount > 0) {
          debtStatusDetails.push(`دين جديد علينا: ${remainingAmount.toFixed(2)} جنيه`);
        }
        
        if (paidAmount >= totalAmount && usedCredit === 0) {
          debtStatus = 'دفع كامل نقداً';
        } else if (paidAmount + usedCredit >= totalAmount) {
          debtStatus = 'سدد كامل (نقد + رصيد)';
        } else {
          debtStatus = 'دفع جزئي';
        }
        
        const balanceChange = -usedCredit - remainingAmount;

        const transactionDetail = {
          transaction_id: ft.id,
          operation_id: operation.id,
          sequence_number: ft.sequence_number,
          farm: {
            id: ft.farm.id,
            name: ft.farm.name,
            owner_name: ft.farm.owner_name,
            phone: ft.farm.phone,
            current_balance: parseFloat(ft.farm.current_balance),
            balance_type: ft.farm.current_balance < 0 ? 'لهم علينا' : 
                         ft.farm.current_balance > 0 ? 'لنا عليهم' : 'متصفي'
          },
          chicken_type: {
            id: ft.chicken_type.id,
            name: ft.chicken_type.name
          },
          vehicle: {
            id: ft.vehicle.id,
            name: ft.vehicle.name,
            plate_number: ft.vehicle.plate_number
          },
          weighing: {
            empty_vehicle_weight: parseFloat(ft.empty_vehicle_weight),
            loaded_vehicle_weight: parseFloat(ft.loaded_vehicle_weight),
            cage_count: ft.cage_count,
            cage_weight_per_unit: parseFloat(ft.cage_weight_per_unit),
            total_cage_weight: ft.cage_count * parseFloat(ft.cage_weight_per_unit),
            net_chicken_weight: parseFloat(ft.net_chicken_weight)
          },
          pricing: {
            price_per_kg: parseFloat(ft.price_per_kg),
            total_amount: totalAmount,
            paid_amount: paidAmount,
            remaining_amount: remainingAmount,
            used_credit: usedCredit,
            total_paid_with_credit: paidAmount + usedCredit,
            payment_percentage: (((paidAmount + usedCredit) / totalAmount) * 100).toFixed(2) + '%'
          },
          debt_info: {
            status: debtStatus,
            status_details: debtStatusDetails,
            balance_change: balanceChange,
            breakdown: {
              cash_paid: paidAmount,
              credit_used: usedCredit,
              new_debt_created: remainingAmount,
              net_balance_impact: balanceChange
            },
            is_full_payment: (paidAmount + usedCredit) >= totalAmount,
            has_remaining_debt: remainingAmount > 0,
            used_existing_credit: usedCredit > 0,
            interpretation: balanceChange > 0 
              ? `المزرعة دفعت ${Math.abs(balanceChange).toFixed(2)} جنيه من رصيدها`
              : balanceChange < 0
                ? `احنا مدينين للمزرعة بـ ${Math.abs(balanceChange).toFixed(2)} جنيه إضافي`
                : 'لا يوجد تغيير في الرصيد'
          },
          transaction_time: ft.transaction_time,
          notes: ft.notes || null
        };

        consolidatedReport.detailed_transactions.farm_loading.transactions.push(transactionDetail);
        
        // Update summary
        consolidatedReport.summary.transactions_summary.farm_transactions.count++;
        consolidatedReport.summary.transactions_summary.farm_transactions.total_weight += parseFloat(ft.net_chicken_weight);
        consolidatedReport.summary.transactions_summary.farm_transactions.total_amount += totalAmount;
        consolidatedReport.summary.transactions_summary.farm_transactions.total_paid += paidAmount;
        consolidatedReport.summary.transactions_summary.farm_transactions.total_remaining += remainingAmount;
      });

      // ========================================
      // 🛒 SALE TRANSACTIONS
      // ========================================
      const saleTransactions = await SaleTransaction.findAll({
        where: { daily_operation_id: operation.id },
        include: [
          { 
            model: Buyer, 
            as: 'buyer',
            attributes: ['id', 'name', 'phone', 'address', 'total_debt']
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
          },
          {
            model: VehicleOperation,
            as: 'vehicle_operation',
            attributes: ['id', 'status']
          }
        ],
        order: [['sequence_number', 'ASC']]
      });

      saleTransactions.forEach(st => {
        const totalAmount = parseFloat(st.total_amount);
        const paidAmount = parseFloat(st.paid_amount);
        const remainingAmount = parseFloat(st.remaining_amount);
        const oldDebtPaid = parseFloat(st.old_debt_paid || 0);
        
        let buyerDebtChange = remainingAmount;
        if (oldDebtPaid > 0) {
          buyerDebtChange -= oldDebtPaid;
        }
        
        let paymentStatus = '';
        if (paidAmount >= totalAmount) {
          paymentStatus = 'دفع كامل';
        } else if (paidAmount > 0) {
          paymentStatus = 'دفع جزئي';
        } else {
          paymentStatus = 'لم يدفع';
        }
        
        if (oldDebtPaid > 0) {
          paymentStatus += ` + سدد ${oldDebtPaid.toFixed(2)} من الدين القديم`;
        }

        const transactionDetail = {
          transaction_id: st.id,
          operation_id: operation.id,
          sequence_number: st.sequence_number,
          buyer: {
            id: st.buyer.id,
            name: st.buyer.name,
            phone: st.buyer.phone,
            address: st.buyer.address,
            total_debt: parseFloat(st.buyer.total_debt),
            debt_status: st.buyer.total_debt > 0 ? 'مدين' : 'لا يوجد دين'
          },
          chicken_type: {
            id: st.chicken_type.id,
            name: st.chicken_type.name
          },
          vehicle: {
            id: st.vehicle.id,
            name: st.vehicle.name,
            plate_number: st.vehicle.plate_number
          },
          weighing: {
            loaded_cages_weight: parseFloat(st.loaded_cages_weight),
            empty_cages_weight: parseFloat(st.empty_cages_weight),
            cage_count: st.cage_count,
            net_chicken_weight: parseFloat(st.net_chicken_weight)
          },
          pricing: {
            price_per_kg: parseFloat(st.price_per_kg),
            total_amount: totalAmount,
            paid_amount: paidAmount,
            remaining_amount: remainingAmount,
            old_debt_paid: oldDebtPaid,
            payment_percentage: ((paidAmount / totalAmount) * 100).toFixed(2) + '%'
          },
          debt_info: {
            status: paymentStatus,
            buyer_debt_change: buyerDebtChange,
            is_full_payment: paidAmount >= totalAmount,
            has_remaining_debt: remainingAmount > 0,
            paid_old_debt: oldDebtPaid > 0,
            net_debt_impact: buyerDebtChange.toFixed(2)
          },
          transaction_time: st.transaction_time,
          notes: st.notes || null
        };

        consolidatedReport.detailed_transactions.sales.transactions.push(transactionDetail);
        
        // Update summary
        consolidatedReport.summary.transactions_summary.sale_transactions.count++;
        consolidatedReport.summary.transactions_summary.sale_transactions.total_weight += parseFloat(st.net_chicken_weight);
        consolidatedReport.summary.transactions_summary.sale_transactions.total_amount += totalAmount;
        consolidatedReport.summary.transactions_summary.sale_transactions.total_paid += paidAmount;
        consolidatedReport.summary.transactions_summary.sale_transactions.total_remaining += remainingAmount;
        consolidatedReport.summary.transactions_summary.sale_transactions.total_old_debt_collected += oldDebtPaid;
      });

      // ========================================
      // 🚨 TRANSPORT LOSSES
      // ========================================
      const transportLosses = await TransportLoss.findAll({
        where: { daily_operation_id: operation.id },
        include: [
          { 
            model: ChickenType, 
            as: 'chicken_type',
            attributes: ['id', 'name']
          },
          {
            model: Vehicle,
            as: 'vehicle',
            attributes: ['id', 'name', 'plate_number']
          },
          {
            model: Farm,
            as: 'farm',
            attributes: ['id', 'name'],
            required: false
          },
          {
            model: VehicleOperation,
            as: 'vehicle_operation',
            attributes: ['id', 'status']
          }
        ],
        order: [['recorded_at', 'ASC']]
      });

      transportLosses.forEach(loss => {
        const lossAmount = parseFloat(loss.loss_amount);
        const deadWeight = parseFloat(loss.dead_weight);
        
        const isFarmResponsible = loss.farm_id !== null;
        
        let farmResponsibility = {};
        
        if (isFarmResponsible) {
          farmResponsibility = {
            is_farm_responsible: true,
            farm: {
              id: loss.farm.id,
              name: loss.farm.name
            },
            balance_impact: {
              amount: lossAmount,
              direction: 'increases_receivable',
              explanation: `المزرعة مسؤولة عن الخسارة، تم خصم ${lossAmount.toFixed(2)} جنيه من رصيدها (لنا عليهم)`,
              note: 'الخسارة تُحمّل على المزرعة وتزيد من الدين اللي عليهم لينا'
            }
          };
        } else {
          farmResponsibility = {
            is_farm_responsible: false,
            note: 'خسارة عامة غير منسوبة لمزرعة محددة - تُخصم من الأرباح العامة'
          };
        }
        
        const lossDetail = {
          loss_id: loss.id,
          operation_id: operation.id,
          chicken_type: {
            id: loss.chicken_type.id,
            name: loss.chicken_type.name
          },
          vehicle: {
            id: loss.vehicle.id,
            name: loss.vehicle.name,
            plate_number: loss.vehicle.plate_number
          },
          loss_details: {
            dead_weight: deadWeight,
            price_per_kg: parseFloat(loss.price_per_kg),
            loss_amount: lossAmount,
            location: loss.location || 'غير محدد'
          },
          farm_responsibility: farmResponsibility,
          recorded_at: loss.recorded_at,
          notes: loss.notes || null
        };

        consolidatedReport.detailed_transactions.losses.records.push(lossDetail);
        
        // Update summary
        consolidatedReport.summary.transactions_summary.losses.count++;
        consolidatedReport.summary.transactions_summary.losses.total_weight += deadWeight;
        consolidatedReport.summary.transactions_summary.losses.total_amount += lossAmount;
      });

      // ========================================
      // 💰 DAILY COSTS
      // ========================================
      const dailyCosts = await DailyCost.findAll({
        where: { daily_operation_id: operation.id },
        include: [
          { 
            model: CostCategory, 
            as: 'category',
            attributes: ['id', 'name', 'description', 'is_vehicle_cost']
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
            attributes: ['id', 'status'],
            required: false
          }
        ],
        order: [['recorded_at', 'ASC']]
      });

      dailyCosts.forEach(cost => {
        const isVehicleCost = cost.category.is_vehicle_cost;
        const hasSpecificVehicle = cost.vehicle_id !== null;
        
        let costAllocation = '';
        if (isVehicleCost && hasSpecificVehicle) {
          costAllocation = `خاص بالعربية: ${cost.vehicle.name}`;
        } else if (isVehicleCost && !hasSpecificVehicle) {
          costAllocation = 'موزع على كل العربيات';
        } else {
          costAllocation = 'مصروف عام';
        }

        const costDetail = {
          cost_id: cost.id,
          operation_id: operation.id,
          category: {
            id: cost.category.id,
            name: cost.category.name,
            description: cost.category.description,
            is_vehicle_cost: isVehicleCost,
            category_type: isVehicleCost ? 'مصروف عربية' : 'مصروف عام'
          },
          vehicle: cost.vehicle ? {
            id: cost.vehicle.id,
            name: cost.vehicle.name,
            plate_number: cost.vehicle.plate_number
          } : null,
          cost_details: {
            amount: parseFloat(cost.amount),
            description: cost.description || 'لا يوجد تفاصيل',
            allocation: costAllocation,
            affects_vehicle_partners: isVehicleCost
          },
          recorded_at: cost.recorded_at
        };

        consolidatedReport.detailed_transactions.costs.records.push(costDetail);
        
        // Update summary
        const costAmount = parseFloat(cost.amount);
        consolidatedReport.summary.transactions_summary.costs.count++;
        consolidatedReport.summary.transactions_summary.costs.total_amount += costAmount;
        
        if (isVehicleCost) {
          consolidatedReport.summary.transactions_summary.costs.vehicle_costs_total += costAmount;
        } else {
          consolidatedReport.summary.transactions_summary.costs.other_costs_total += costAmount;
        }
        
        // Group by category
        const categoryName = cost.category.name;
        if (!consolidatedReport.detailed_transactions.costs.by_category[categoryName]) {
          consolidatedReport.detailed_transactions.costs.by_category[categoryName] = {
            category_info: {
              id: cost.category.id,
              name: cost.category.name,
              description: cost.category.description,
              is_vehicle_cost: isVehicleCost,
              category_type: isVehicleCost ? 'مصروف عربية' : 'مصروف عام'
            },
            costs: [],
            total_amount: 0,
            count: 0
          };
        }
        consolidatedReport.detailed_transactions.costs.by_category[categoryName].costs.push(costDetail);
        consolidatedReport.detailed_transactions.costs.by_category[categoryName].total_amount += costAmount;
        consolidatedReport.detailed_transactions.costs.by_category[categoryName].count += 1;
      });

      // ========================================
      // 📊 DEBT PAYMENTS
      // ========================================
      const farmDebtPayments = await FarmDebtPayment.findAll({
        where: { daily_operation_id: operation.id },
        include: [
          {
            model: Farm,
            as: 'farm',
            attributes: ['id', 'name', 'current_balance']
          }
        ]
      });

      farmDebtPayments.forEach(fp => {
        const amount = parseFloat(fp.amount);
        const direction = fp.payment_direction;
        
        let explanation = '';
        let balance_impact = 0;
        
        if (direction === 'FROM_FARM') {
          explanation = `المزرعة دفعتلنا ${amount.toFixed(2)} جنيه من الدين اللي عليها`;
          balance_impact = -amount;
        } else {
          explanation = `احنا دفعنا للمزرعة ${amount.toFixed(2)} جنيه من الدين اللي علينا`;
          balance_impact = amount;
        }
        
        consolidatedReport.debt_movements.farm_payments.push({
          payment_id: fp.id,
          operation_id: operation.id,
          farm: {
            id: fp.farm.id,
            name: fp.farm.name,
            current_balance: parseFloat(fp.farm.current_balance),
            balance_display: fp.farm.current_balance < 0 
              ? `لهم علينا: ${Math.abs(fp.farm.current_balance).toFixed(2)} جنيه`
              : fp.farm.current_balance > 0
                ? `لنا عليهم: ${parseFloat(fp.farm.current_balance).toFixed(2)} جنيه`
                : 'متصفي'
          },
          payment_details: {
            amount: amount,
            direction: direction,
            direction_arabic: direction === 'FROM_FARM' ? 'من المزرعة لينا' : 'مننا للمزرعة',
            explanation: explanation,
            balance_impact: balance_impact
          },
          payment_date: fp.payment_date,
          notes: fp.notes,
          is_standalone: true
        });
      });

      const buyerDebtPayments = await BuyerDebtPayment.findAll({
        where: { daily_operation_id: operation.id },
        include: [
          {
            model: Buyer,
            as: 'buyer',
            attributes: ['id', 'name', 'total_debt']
          }
        ]
      });

      buyerDebtPayments.forEach(bp => {
        const amount = parseFloat(bp.amount);
        
        consolidatedReport.debt_movements.buyer_payments.push({
          payment_id: bp.id,
          operation_id: operation.id,
          buyer: {
            id: bp.buyer.id,
            name: bp.buyer.name,
            total_debt: parseFloat(bp.buyer.total_debt),
            debt_display: bp.buyer.total_debt > 0
              ? `مدين بـ ${parseFloat(bp.buyer.total_debt).toFixed(2)} جنيه`
              : 'متصفي'
          },
          payment_details: {
            amount: amount,
            explanation: `المشتري دفع ${amount.toFixed(2)} جنيه من ديونه`,
            balance_impact: -amount
          },
          payment_date: bp.payment_date,
          notes: bp.notes,
          is_standalone: true
        });
      });

      // ========================================
      // 💼 PROFIT DISTRIBUTION
      // ========================================
      if (operation.profit_distribution) {
        const plainDistribution = operation.profit_distribution.get ? 
          operation.profit_distribution.get({ plain: true }) : 
          operation.profit_distribution;

        // Update combined totals
        consolidatedReport.profit_distribution.totals.total_revenue += parseFloat(plainDistribution.total_revenue);
        consolidatedReport.profit_distribution.totals.total_purchases += parseFloat(plainDistribution.total_purchases);
        // consolidatedReport.profit_distribution.totals.total_losses += parseFloat(plainDistribution.total_losses);
        consolidatedReport.profit_distribution.totals.lossesWithFarm += parseFloat(plainDistribution.lossesWithFarm || 0);
consolidatedReport.profit_distribution.totals.lossesWithoutFarm += parseFloat(plainDistribution.lossesWithoutFarm || 0);

        consolidatedReport.profit_distribution.totals.total_costs += parseFloat(plainDistribution.total_costs);
        consolidatedReport.profit_distribution.totals.vehicle_costs += parseFloat(plainDistribution.vehicle_costs);
        consolidatedReport.profit_distribution.totals.net_profit += parseFloat(plainDistribution.net_profit);

        const partnerProfits = plainDistribution.partner_profits || [];
        
        if (partnerProfits.length > 0) {
          const partnerIds = partnerProfits.map(pp => pp.partner_id);
          
          const partnersData = await Partner.findAll({
            where: { id: partnerIds },
            attributes: ['id', 'name', 'investment_percentage', 'is_vehicle_partner'],
            raw: true
          });
          
          const partnersMap = partnersData.reduce((map, p) => {
            map[p.id] = p;
            return map;
          }, {});

          partnerProfits.forEach(pp => {
            const plainPP = pp.get ? pp.get({ plain: true }) : pp;
            const partner = partnersMap[plainPP.partner_id];
            
            if (!consolidatedReport.profit_distribution.partner_profits[partner.id]) {
              consolidatedReport.profit_distribution.partner_profits[partner.id] = {
                partner: {
                  id: partner.id,
                  name: partner.name,
                  investment_percentage: parseFloat(partner.investment_percentage),
                  is_vehicle_partner: partner.is_vehicle_partner
                },
                base_profit_share: 0,
                vehicle_cost_share: 0,
                final_profit: 0,
                operations_count: 0
              };
            }
            
            const partnerData = consolidatedReport.profit_distribution.partner_profits[partner.id];
            partnerData.base_profit_share += parseFloat(plainPP.base_profit_share);
            partnerData.vehicle_cost_share += parseFloat(plainPP.vehicle_cost_share);
            partnerData.final_profit += parseFloat(plainPP.final_profit);
            partnerData.operations_count += 1;
          });
        }
      }
    }

    // ========================================
    // 📊 FINALIZE CONSOLIDATED REPORT
    // ========================================
    
    // Set vehicles and users
    consolidatedReport.summary.operation_info.vehicles = Array.from(vehiclesMap.values());
    consolidatedReport.summary.operation_info.vehicles_count = vehiclesMap.size;
    consolidatedReport.summary.operation_info.users = Array.from(usersMap.values());

    // Set vehicle breakdown
    consolidatedReport.summary.vehicle_breakdown = Array.from(vehicleBreakdownMap.entries()).map(([vehicleId, breakdown]) => {
      const vehicle = vehiclesMap.get(vehicleId);
      return {
        vehicle_id: vehicleId,
        vehicle_name: vehicle?.name || 'Unknown',
        purchases: breakdown.purchases,
        revenue: breakdown.revenue,
        losses: breakdown.losses,
            lossesWithFarm: breakdown.lossesWithFarm || 0,        // ✅ جديد
          lossesWithoutFarm: breakdown.lossesWithoutFarm || 0,  // ✅ جديد

        vehicle_costs: breakdown.vehicle_costs,
        other_costs: breakdown.other_costs,
        net_profit: breakdown.net_profit
      };
    });

    // Calculate profit margin
    if (consolidatedReport.summary.financial_summary.total_revenue > 0) {
      const margin = (consolidatedReport.summary.financial_summary.net_profit / 
                     consolidatedReport.summary.financial_summary.total_revenue) * 100;
      consolidatedReport.summary.financial_summary.profit_margin_percentage = margin.toFixed(2) + '%';
    }

    // Set transaction summaries
    consolidatedReport.detailed_transactions.farm_loading.summary = 
      consolidatedReport.summary.transactions_summary.farm_transactions;
    consolidatedReport.detailed_transactions.sales.summary = 
      consolidatedReport.summary.transactions_summary.sale_transactions;
    consolidatedReport.detailed_transactions.losses.summary = 
      consolidatedReport.summary.transactions_summary.losses;
    consolidatedReport.detailed_transactions.costs.summary = 
      consolidatedReport.summary.transactions_summary.costs;


      consolidatedReport.summary.financial_summary.total_losses = 
  consolidatedReport.summary.financial_summary.lossesWithFarm + 
  consolidatedReport.summary.financial_summary.lossesWithoutFarm;

consolidatedReport.profit_distribution.totals.total_losses = 
  consolidatedReport.profit_distribution.totals.lossesWithFarm + 
  consolidatedReport.profit_distribution.totals.lossesWithoutFarm;

  
    // Convert partner_profits from object to array
 consolidatedReport.profit_distribution.partner_profits = 
  Object.values(consolidatedReport.profit_distribution.partner_profits).map(pp => {
    const profit = Number(pp.final_profit) || 0; // ✅ استخدم final_profit
    const total = Number(consolidatedReport.profit_distribution.totals.net_profit) || 0;
    
    const percentage = total > 0 ? ((profit / total) * 100).toFixed(2) : '0.00';
    
    console.log('Partner:', pp.partner?.name, 'Profit:', profit, 'Total:', total, 'Percentage:', percentage);
    
    return {
      ...pp,
      profit_percentage: percentage + '%'
    };
  });

      console.log('report',consolidatedReport.summary.financial_summary);
      
    // ========================================
    // 📤 SEND RESPONSE
    // ========================================
    res.json({
      success: true,
      data: {
        report_date: date,
        operations_count: operations.length,
        report_generated_at: new Date().toLocaleString('en-GB', { timeZone: 'Africa/Cairo' }),
        operation: consolidatedReport
      }
    });

  } catch (error) {
    console.error('Error generating enhanced daily report:', error);
    res.status(500).json({
      success: false,
      message: 'حدث خطأ أثناء إنشاء التقرير اليومي',
      error: error.message
    });
  }
};

// exports.getPeriodReport = async (req, res) => {
//   try {
//     const { from, to } = req.query;
    
//     const operations = await DailyOperation.findAll({
//       where: {
//         operation_date: {
//           [Op.between]: [from, to]
//         },
//         status: 'CLOSED'
//       },
//       include: [
//         { model: Vehicle, as: 'vehicles' },
//         { model: ProfitDistribution, as: 'profit_distribution' }
//       ]
//     });
    
//     // ✅ Aggregate by vehicle across all operations
//     const vehicleAggregates = {};
    
//     for (const operation of operations) {
//       const profitData = await ProfitService.calculateDailyProfit(operation.id);
      
//       for (const vehicleBreakdown of profitData.vehicleBreakdown) {
//         const vId = vehicleBreakdown.vehicle_id;
        
//         if (!vehicleAggregates[vId]) {
//           const vehicle = operation.vehicles.find(v => v.id === vId);
//           vehicleAggregates[vId] = {
//             vehicle_id: vId,
//             vehicle_name: vehicle?.name || 'Unknown',
//             operations_count: 0,
//             total_purchases: 0,
//             total_revenue: 0,
//             total_losses: 0,
//             total_vehicle_costs: 0,
//             total_net_profit: 0
//           };
//         }
        
//         vehicleAggregates[vId].operations_count++;
//         vehicleAggregates[vId].total_purchases += vehicleBreakdown.purchases;
//         vehicleAggregates[vId].total_revenue += vehicleBreakdown.revenue;
//         vehicleAggregates[vId].total_losses += vehicleBreakdown.losses;
//         vehicleAggregates[vId].total_vehicle_costs += vehicleBreakdown.vehicle_costs;
//         vehicleAggregates[vId].total_net_profit += vehicleBreakdown.net_profit;
//       }
//     }
    
//     // ✅ Overall period summary
//     const periodSummary = {
//       total_operations: operations.length,
//       total_vehicles_used: Object.keys(vehicleAggregates).length,
//       total_purchases: operations.reduce((sum, op) => 
//         sum + parseFloat(op.profit_distribution?.total_purchases || 0), 0),
//       total_revenue: operations.reduce((sum, op) => 
//         sum + parseFloat(op.profit_distribution?.total_revenue || 0), 0),
//       total_costs: operations.reduce((sum, op) => 
//         sum + parseFloat(op.profit_distribution?.total_costs || 0), 0),
//       total_losses: operations.reduce((sum, op) => 
//         sum + parseFloat(op.profit_distribution?.total_losses || 0), 0),
//       total_net_profit: operations.reduce((sum, op) => 
//         sum + parseFloat(op.profit_distribution?.net_profit || 0), 0)
//     };
    
//     res.json({
//       success: true,
//       data: {
//         period: { from, to },
//         summary: periodSummary,
//         vehicle_performance: Object.values(vehicleAggregates),  // ✅ NEW
//         daily_operations: operations.map(op => ({
//           id: op.id,
//           date: op.operation_date,
//           vehicle_count: op.vehicles.length,
//           net_profit: parseFloat(op.profit_distribution?.net_profit || 0)
//         }))
//       }
//     });
//   } catch (error) {
//     res.status(500).json({
//       success: false,
//       message: error.message
//     });
//   }
// };

/**
 * Get comprehensive period report
 * GET /api/reports/period?from=2026-01-01&to=2026-01-31
 */
exports.getPeriodReport = async (req, res) => {
  try {
    const { from, to } = req.query;

    // Validation
    if (!from || !to) {
      return res.status(400).json({
        success: false,
        message: 'Both "from" and "to" dates are required'
      });
    }

    // Date format validation
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(from) || !dateRegex.test(to)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid date format. Use YYYY-MM-DD'
      });
    }

    // Date range validation
    const startDate = new Date(from).toLocaleString('en-GB', { timeZone: 'Africa/Cairo' });
    const endDate = new Date(to).toLocaleString('en-GB', { timeZone: 'Africa/Cairo' });

    if (startDate > endDate) {
      return res.status(400).json({
        success: false,
        message: 'Start date must be before or equal to end date'
      });
    }

    const daysDiff = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24));
    if (daysDiff > 365) {
      return res.status(400).json({
        success: false,
        message: 'Period cannot exceed 365 days'
      });
    }

    // Generate report
    const result = await PeriodReportService.generatePeriodReport(from, to);

    if (!result.success) {
      return res.status(404).json(result);
    }
    console.log("\nresult: ",result.data);
    
    res.json({
      success: true,
      ...result.data
    });

  } catch (error) {
    console.error('Error generating period report:', error);
    res.status(500).json({
      success: false,
      message: 'Error generating period report',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};
// exports.getPartnerProfitReport = async (req, res) => {
//   try {
//     const { from, to } = req.query;

//     if (!from || !to) {
//       return res.status(400).json({
//         success: false,
//         message: 'From and to dates are required'
//       });
//     }

//     const report = await ProfitService.getProfitReport(from, to);

//     res.json({
//       success: true,
//       data: report
//     });
//   } catch (error) {
//     res.status(500).json({
//       success: false,
//       message: 'Error generating partner profit report',
//       error:error.message
//     });
//   }
// };
// exports.getPartnerProfitReport = async (req, res) => {
//   try {
//     const { from, to } = req.query;

//     if (!from || !to) {
//       return res.status(400).json({
//         success: false,
//         message: 'From and to dates are required'
//       });
//     }

//     // تحويل التاريخ إلى Date objects أو تركها كسلاسل نصية حسب قاعدة البيانات
//     const fromDate = new Date(from);
//     const toDate = new Date(to);

//     // 1️⃣ جلب كل العمليات بين التاريخين
//     const operations = await DailyOperation.findAll({
//       where: {
//         operation_date: {
//           [Op.between]: [fromDate, toDate]
//         }
//       }
//     });

//     if (!operations || operations.length === 0) {
//       return res.json({
//         success: true,
//         data: [],
//         message: 'No operations found in the given period'
//       });
//     }

//     const report = [];

//     // 2️⃣ حساب أرباح كل عملية وتوزيعها على الشركاء
//     for (const op of operations) {
//       const profitData = await ProfitService.calculateDailyProfit(op.id);
//       const partnerDistributions = await ProfitService.distributeToPartners(op.id, profitData);

//       report.push({
//         operation_id: op.id,
//         operation_date: op.date,
//         total_revenue: profitData.totalRevenue,
//         total_purchases: profitData.totalPurchases,
//         total_losses: profitData.totalLosses,
//         total_costs: profitData.totalCosts,
//         vehicle_costs: profitData.vehicleCosts,
//         net_profit: profitData.netProfit,
//         vehicleBreakdown: profitData.vehicleBreakdown,
//         partners: partnerDistributions
//       });
//     }

//     res.json({
//       success: true,
//       data: report
//     });

//   } catch (error) {
//     console.error('Error generating partner profit report:', error);
//     res.status(500).json({
//       success: false,
//       message: 'Error generating partner profit report',
//       error: error.message
//     });
//   }
// };
/**
 * Get comprehensive profit analysis report for a period
 * 
 * @route GET /api/reports/profit-analysis?from=YYYY-MM-DD&to=YYYY-MM-DD
 * @access Admin only
 */
exports.getProfitAnalysis = async (req, res) => {
  try {
    console.log("dwqdfqwfqwpm");
    
    const { from, to } = req.query;

    // Validate required parameters
    if (!from || !to) {
      return res.status(400).json({
        success: false,
        message: 'من فضلك حدد تاريخ البداية والنهاية (from and to dates are required)'
      });
    }

    // Validate date format
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(from) || !dateRegex.test(to)) {
      return res.status(400).json({
        success: false,
        message: 'تنسيق التاريخ غير صحيح. استخدم: YYYY-MM-DD (Invalid date format. Use: YYYY-MM-DD)'
      });
    }

    // Validate date range
    const startDate = new Date(from).toLocaleString('en-GB', { timeZone: 'Africa/Cairo' });
    const endDate = new Date(to).toLocaleString('en-GB', { timeZone: 'Africa/Cairo' });

    if (startDate > endDate) {
      return res.status(400).json({
        success: false,
        message: 'تاريخ البداية يجب أن يكون قبل تاريخ النهاية (Start date must be before end date)'
      });
    }

    // Check if range is too large (more than 1 year)
    const daysDiff = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24));
    if (daysDiff > 365) {
      return res.status(400).json({
        success: false,
        message: 'الفترة الزمنية كبيرة جداً. الحد الأقصى سنة واحدة (Period too large. Maximum 1 year)'
      });
    }

    console.log(`Generating profit analysis report from ${from} to ${to}`);

    // Generate the report
    const result = await ProfitReportService.generateProfitReport(from, to);

    if (!result.success) {
      return res.status(404).json({
        success: false,
        message: result.message || 'لا توجد عمليات مغلقة في الفترة المحددة (No closed operations found)'
      });
    }

    res.json({
      success: true,
      data: result.data,
      message: 'تم إنشاء تقرير تحليل الأرباح بنجاح (Profit analysis report generated successfully)'
    });

  } catch (error) {
    console.error('Error generating profit analysis report:', error);
    res.status(500).json({
      success: false,
      message: 'حدث خطأ أثناء إنشاء تقرير تحليل الأرباح (Error generating profit analysis report)',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Get profit analysis summary (lightweight version)
 * 
 * @route GET /api/reports/profit-summary?from=YYYY-MM-DD&to=YYYY-MM-DD
 * @access Admin only
 */
exports.getProfitSummary = async (req, res) => {
  try {
    const { from, to } = req.query;

    if (!from || !to) {
      return res.status(400).json({
        success: false,
        message: 'من فضلك حدد تاريخ البداية والنهاية (from and to dates are required)'
      });
    }

    const result = await ProfitReportService.generateProfitReport(from, to);

    if (!result.success) {
      return res.status(404).json({
        success: false,
        message: result.message
      });
    }

    // Return only executive summary and key metrics
    const summary = {
      period: result.data.period,
      executive_summary: result.data.executive_summary,
      profit_health: result.data['1_profit_composition_analysis'].total_net_profit,
      profit_per_kg: result.data['2_profit_per_kg_analysis'].current_period.net_profit_per_sold_kg,
      total_leakage: result.data['3_profit_leakage_detection'].total_identified_leakage,
      top_recommendations: result.data['6_actionable_profit_recommendations'].recommendations.slice(0, 3)
    };

    res.json({
      success: true,
      data: summary,
      message: 'ملخص تحليل الأرباح (Profit summary)'
    });

  } catch (error) {
    console.error('Error generating profit summary:', error);
    res.status(500).json({
      success: false,
      message: 'حدث خطأ أثناء إنشاء ملخص الأرباح (Error generating profit summary)',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Get profit leakage details only
 * 
 * @route GET /api/reports/profit-leakage?from=YYYY-MM-DD&to=YYYY-MM-DD
 * @access Admin only
 */
exports.getProfitLeakage = async (req, res) => {
  try {
    const { from, to } = req.query;

    if (!from || !to) {
      return res.status(400).json({
        success: false,
        message: 'من فضلك حدد تاريخ البداية والنهاية'
      });
    }

    const result = await ProfitReportService.generateProfitReport(from, to);

    if (!result.success) {
      return res.status(404).json({
        success: false,
        message: result.message
      });
    }

    res.json({
      success: true,
      data: {
        period: result.data.period,
        leakage_analysis: result.data['3_profit_leakage_detection']
      },
      message: 'تحليل تسرب الأرباح (Profit leakage analysis)'
    });

  } catch (error) {
    console.error('Error generating profit leakage report:', error);
    res.status(500).json({
      success: false,
      message: 'حدث خطأ أثناء تحليل تسرب الأرباح',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};


// exports.getFarmDebtReport = async (req, res) => {
//   try {
//     const farms = await Farm.findAll({
//       where: {
//         total_debt: {
//           [Op.gt]: 0
//         }
//       },
//       order: [['total_debt', 'DESC']]
//     });

//     const totalDebt = farms.reduce((sum, farm) => 
//       sum + parseFloat(farm.total_debt), 0
//     );

//     res.json({
//       success: true,
//       data: {
//         total_debt: totalDebt,
//         farms_count: farms.length,
//         farms
//       }
//     });
//   } catch (error) {
//     res.status(500).json({
//       success: false,
//       message: 'Error generating farm debt report'
//     });
//   }
// };

exports.getBuyerDebtReport = async (req, res) => {
  try {
    const buyers = await Buyer.findAll({
      where: {
        total_debt: {
          [Op.gt]: 0
        }
      },
      order: [['total_debt', 'DESC']]
    });

    const totalDebt = buyers.reduce((sum, buyer) => 
      sum + parseFloat(buyer.total_debt), 0
    );

    res.json({
      success: true,
      data: {
        total_debt: totalDebt,
        buyers_count: buyers.length,
        buyers
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error generating buyer debt report'
    });
  }
};
/**
 * Get detailed debt statement for a specific buyer
 * GET /api/reports/buyer-statement/:buyerId
 * 
 * ACCOUNTING LOGIC:
 * -----------------
 * Buyer total_debt is ALWAYS ≥ 0 (we never owe buyers in this system)
 * 
 * Balance Flow:
 * - Opening Balance = Previous debt
 * - INCREASE (+) = New sales where buyer didn't pay full amount (remaining_amount)
 * - DECREASE (-) = Payments received from buyer OR old_debt_paid in new sales
 * - Running Balance = Cumulative debt after each entry
 * 
 * Transactions included:
 * 1. SaleTransaction.remaining_amount → Adds to debt
 * 2. SaleTransaction.old_debt_paid → Reduces debt
 * 3. BuyerDebtPayment → Reduces debt
 * 
 * @access Private
 */
exports.getBuyerStatement = async (req, res) => {
  try {
    const { buyerId } = req.params;
    const { start_date = null, end_date = null } = req.query;

    // ✅ Step 1: Validate buyer exists
    const buyer = await Buyer.findByPk(buyerId);
    
    if (!buyer) {
      return res.status(404).json({
        success: false,
        message: 'Buyer not found'
      });
    }

    // ✅ Step 2: Build date filters
    const saleFilter = {};
    if (start_date || end_date) {
      saleFilter.transaction_time = {};
      if (start_date) saleFilter.transaction_time[Op.gte] = start_date;
      if (end_date) saleFilter.transaction_time[Op.lte] = end_date;
    }

    const paymentFilter = {};
    if (start_date || end_date) {
      paymentFilter.payment_date = {};
      if (start_date) paymentFilter.payment_date[Op.gte] = start_date;
      if (end_date) paymentFilter.payment_date[Op.lte] = end_date;
    }

    // ✅ Step 3: Get all sale transactions
    const sales = await SaleTransaction.findAll({
      where: {
        buyer_id: buyerId,
        ...saleFilter
      },
      include: [
        { 
          model: ChickenType, 
          as: 'chicken_type', 
          attributes: ['id', 'name'] 
        },
        { 
          model: DailyOperation, 
          as: 'operation', 
          attributes: ['id', 'operation_date'] 
        },
        { 
          model: Vehicle, 
          as: 'vehicle', 
          attributes: ['id', 'name', 'plate_number'] 
        }
      ],
      order: [['transaction_time', 'ASC']]
    });

    // ✅ Step 4: Get all standalone payments
    const payments = await BuyerDebtPayment.findAll({
      where: {
        buyer_id: buyerId,
        ...paymentFilter
      },
      include: [
        { 
          model: DailyOperation, 
          as: 'operation', 
          attributes: ['id', 'operation_date'], 
          required: false 
        }
      ],
      order: [['payment_date', 'ASC']]
    });

    // ✅ Step 5: Calculate period totals
    const newDebtInPeriod = sales.reduce((sum, s) => 
      sum + parseFloat(s.remaining_amount), 0
    );
    
    const oldDebtPaidInPeriod = sales.reduce((sum, s) => 
      sum + parseFloat(s.old_debt_paid), 0
    );
    
    const paymentsInPeriod = payments.reduce((sum, p) => 
      sum + parseFloat(p.amount), 0
    );

    const currentDebt = parseFloat(buyer.total_debt) || 0;

    // Opening = Current - New Debt + Payments Made
    const openingBalance = currentDebt - newDebtInPeriod + oldDebtPaidInPeriod + paymentsInPeriod;

    // ✅ Step 6: Build statement entries
    const allEntries = [];

    // Add sale transactions
    sales.forEach(sale => {
      const saleAmount = parseFloat(sale.total_amount);
      const paidAmount = parseFloat(sale.paid_amount);
      const oldDebtPaid = parseFloat(sale.old_debt_paid);
      const remainingAmount = parseFloat(sale.remaining_amount);

      // Entry 1: The sale itself (if created new debt)
      if (remainingAmount > 0) {
        allEntries.push({
          date: sale.transaction_time,
          type: 'SALE',
          description: `Sale #${sale.sequence_number} - ${parseFloat(sale.net_chicken_weight).toFixed(2)} kg ${sale.chicken_type?.name || ''} @ ${parseFloat(sale.price_per_kg).toFixed(2)} EGP/kg`,
          amount: saleAmount,
          paid_now: paidAmount,
          balance_change: remainingAmount, // Positive = increases debt
          reference_id: sale.id,
          operation_date: sale.operation?.operation_date,
          vehicle: sale.vehicle?.name
        });
      }

      // Entry 2: Old debt payment (if any)
      if (oldDebtPaid > 0) {
        allEntries.push({
          date: sale.transaction_time,
          type: 'OLD_DEBT_PAYMENT',
          description: `Payment of old debt during Sale #${sale.sequence_number}`,
          amount: oldDebtPaid,
          paid_now: oldDebtPaid,
          balance_change: -oldDebtPaid, // Negative = decreases debt
          reference_id: sale.id,
          operation_date: sale.operation?.operation_date,
          vehicle: sale.vehicle?.name
        });
      }
    });

    // Add standalone payments
    payments.forEach(payment => {
      allEntries.push({
        date: payment.payment_date,
        type: 'PAYMENT',
        description: `Standalone payment${payment.notes ? ' - ' + payment.notes : ''}`,
        amount: parseFloat(payment.amount),
        paid_now: parseFloat(payment.amount),
        balance_change: -parseFloat(payment.amount), // Negative = decreases debt
        reference_id: payment.id,
        operation_date: payment.operation?.operation_date || null,
        vehicle: null
      });
    });

    // Sort chronologically
    allEntries.sort((a, b) => new Date(a.date).toLocaleString('en-GB', { timeZone: 'Africa/Cairo' }) - new Date(b.date).toLocaleString('en-GB', { timeZone: 'Africa/Cairo' }));

    // ✅ Step 7: Calculate running balance
    let runningBalance = openingBalance;
    
    const statement = allEntries.map(entry => {
      runningBalance += entry.balance_change;
      
      return {
        date: entry.date,
        type: entry.type,
        description: entry.description,
        amount: entry.amount,
        paid_now: entry.paid_now,
        balance_change: entry.balance_change,
        running_balance: Math.max(0, runningBalance), // Never negative
        reference_id: entry.reference_id,
        operation_date: entry.operation_date,
        vehicle: entry.vehicle
      };
    });

    // ✅ Step 8: Calculate summary
    const totalSales = sales.reduce((sum, s) => 
      sum + parseFloat(s.total_amount), 0
    );
    
    const totalPaidDuringSales = sales.reduce((sum, s) => 
      sum + parseFloat(s.paid_amount), 0
    );
    
    const totalPayments = oldDebtPaidInPeriod + paymentsInPeriod;

    // ✅ Step 9: Return response
    res.json({
      success: true,
      data: {
        buyer: {
          id: buyer.id,
          name: buyer.name,
          phone: buyer.phone,
          address: buyer.address,
          current_debt: currentDebt
        },
        period: {
          start_date: start_date || 'Beginning',
          end_date: end_date || 'Current'
        },
        summary: {
          opening_balance: Math.max(0, openingBalance),
          
          // Sales breakdown
          total_sales: totalSales,
          paid_during_sales: totalPaidDuringSales,
          new_debt_from_sales: newDebtInPeriod,
          
          // Payments breakdown
          old_debt_paid_in_sales: oldDebtPaidInPeriod,
          standalone_payments: paymentsInPeriod,
          total_payments: totalPayments,
          
          // Net change
          net_change: newDebtInPeriod - totalPayments,
          closing_balance: currentDebt,
          
          // Counts
          sale_count: sales.length,
          payment_count: payments.length,
          total_entries: statement.length
        },
        statement
      }
    });

  } catch (error) {
    console.error('Error generating buyer statement:', error);
    res.status(500).json({
      success: false,
      message: 'Error generating buyer statement',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};
/**
 * Get farm receivables report (Farms that owe us)
 * GET /api/reports/farm-receivables
 */
exports.getFarmReceivablesReport = async (req, res) => {
  try {
    const farms = await Farm.getReceivables();

    const totalReceivables = farms.reduce((sum, farm) => 
      sum + parseFloat(farm.current_balance), 0
    );

    res.json({
      success: true,
      data: {
        report_type: 'RECEIVABLES',
        summary: {
          total_receivables: totalReceivables,
          farms_count: farms.length
        },
        farms: farms.map(f => ({
          id: f.id,
          name: f.name,
          owner_name: f.owner_name,
          phone: f.phone,
          current_balance: parseFloat(f.current_balance),
          balance_type: 'RECEIVABLE',
          display_balance: `${parseFloat(f.current_balance).toFixed(2)} EGP`
        }))
      }
    });

  } catch (error) {
    console.error('Error generating receivables report:', error);
    res.status(500).json({
      success: false,
      message: 'Error generating receivables report',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Get farm payables report (Farms we owe)
 * GET /api/reports/farm-payables
 */
exports.getFarmPayablesReport = async (req, res) => {
  try {
    const farms = await Farm.getPayables();

    const totalPayables = Math.abs(farms.reduce((sum, farm) => 
      sum + parseFloat(farm.current_balance), 0
    ));

    res.json({
      success: true,
      data: {
        report_type: 'PAYABLES',
        summary: {
          total_payables: totalPayables,
          farms_count: farms.length
        },
        farms: farms.map(f => ({
          id: f.id,
          name: f.name,
          owner_name: f.owner_name,
          phone: f.phone,
          current_balance: parseFloat(f.current_balance),
          absolute_balance: Math.abs(parseFloat(f.current_balance)),
          balance_type: 'PAYABLE',
          display_balance: `${Math.abs(parseFloat(f.current_balance)).toFixed(2)} EGP`
        }))
      }
    });

  } catch (error) {
    console.error('Error generating payables report:', error);
    res.status(500).json({
      success: false,
      message: 'Error generating payables report',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Get combined farm balances report
 * GET /api/reports/farm-balances
 */
exports.getFarmBalancesReport = async (req, res) => {
  try {
    const receivables = await Farm.getReceivables();
    const payables = await Farm.getPayables();
    const netPosition = await Farm.getNetPosition();

    res.json({
      success: true,
      data: {
        report_type: 'COMBINED_BALANCES',
        summary: {
          total_receivables: netPosition.total_receivables,
          total_payables: netPosition.total_payables,
          net_position: netPosition.net_position,
          position_type: netPosition.position_type,
          receivables_count: netPosition.receivables_count,
          payables_count: netPosition.payables_count,
          total_farms_with_balance: netPosition.receivables_count + netPosition.payables_count
        },
        receivables: {
          count: receivables.length,
          farms: receivables.map(f => ({
            id: f.id,
            name: f.name,
            owner_name: f.owner_name,
            phone: f.phone,
            current_balance: parseFloat(f.current_balance),
            balance_type: 'RECEIVABLE',
            display_balance: `${parseFloat(f.current_balance).toFixed(2)} EGP`
          }))
        },
        payables: {
          count: payables.length,
          farms: payables.map(f => ({
            id: f.id,
            name: f.name,
            owner_name: f.owner_name,
            phone: f.phone,
            current_balance: parseFloat(f.current_balance),
            absolute_balance: Math.abs(parseFloat(f.current_balance)),
            balance_type: 'PAYABLE',
            display_balance: `${Math.abs(parseFloat(f.current_balance)).toFixed(2)} EGP`
          }))
        }
      }
    });

  } catch (error) {
    console.error('Error generating balances report:', error);
    res.status(500).json({
      success: false,
      message: 'Error generating balances report',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * LEGACY: Old debt report endpoint (backward compatible)
 * GET /api/reports/farm-debts
 * @deprecated Use /farm-receivables instead
 */
exports.getFarmDebtReport = async (req, res) => {
  try {
    // Redirect to receivables report (farms that owe us)
    const farms = await Farm.getReceivables();

    const totalDebt = farms.reduce((sum, farm) => 
      sum + parseFloat(farm.current_balance), 0
    );

    res.json({
      success: true,
      deprecated: true,
      message: 'This endpoint is deprecated. Use /api/reports/farm-receivables instead',
      data: {
        total_debt: totalDebt,
        farms_count: farms.length,
        farms: farms.map(f => ({
          ...f.toJSON(),
          total_debt: parseFloat(f.current_balance)  // Alias for backward compatibility
        }))
      }
    });

  } catch (error) {
    console.error('Error generating farm debt report:', error);
    res.status(500).json({
      success: false,
      message: 'Error generating farm debt report',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Get detailed balance statement for a specific farm
 * GET /api/reports/farm-statement/:farmId
 * 
 * ACCOUNTING LOGIC (CORRECTED):
 * ------------------------------
 * Farm current_balance:
 *   > 0 = Farm owes US (RECEIVABLE)
 *   < 0 = WE owe Farm (PAYABLE)
 *   = 0 = Settled
 * 
 * Balance changes:
 *   - Purchase with remaining_amount: DECREASES balance (we owe them more) → Negative
 *   - Purchase with used_credit: INCREASES balance (reduces what we owe) → Positive
 *   - Payment FROM_FARM: INCREASES balance (they pay their debt) → Positive
 *   - Payment TO_FARM: DECREASES balance (we pay our debt) → Negative
 */
exports.getFarmStatement = async (req, res) => {
  try {
    const { farmId } = req.params;
    const { start_date = null, end_date = null } = req.query;

    const farm = await Farm.findByPk(farmId);
    
    if (!farm) {
      return res.status(404).json({
        success: false,
        message: 'Farm not found'
      });
    }

    // ========================================
    // BUILD DATE FILTERS
    // ========================================

    const transactionFilter = {};
    if (start_date || end_date) {
      transactionFilter.transaction_time = {};
      if (start_date) transactionFilter.transaction_time[Op.gte] = start_date;
      if (end_date) transactionFilter.transaction_time[Op.lte] = end_date;
    }

    const paymentFilter = {};
    if (start_date || end_date) {
      paymentFilter.payment_date = {};
      if (start_date) paymentFilter.payment_date[Op.gte] = start_date;
      if (end_date) paymentFilter.payment_date[Op.lte] = end_date;
    }

    // ========================================
    // GET ALL TRANSACTIONS
    // ========================================

    const transactions = await FarmTransaction.findAll({
      where: {
        farm_id: farmId,
        ...transactionFilter
      },
      include: [
        { 
          model: ChickenType, 
          as: 'chicken_type', 
          attributes: ['id', 'name'] 
        },
        { 
          model: DailyOperation, 
          as: 'operation', 
          attributes: ['id', 'operation_date'] 
        },
        { 
          model: Vehicle, 
          as: 'vehicle', 
          attributes: ['id', 'name', 'plate_number'] 
        }
      ],
      order: [['transaction_time', 'ASC']]
    });

    // ========================================
    // GET ALL PAYMENTS
    // ========================================

    const payments = await FarmDebtPayment.findAll({
      where: {
        farm_id: farmId,
        ...paymentFilter
      },
      include: [
        { 
          model: DailyOperation, 
          as: 'operation', 
          attributes: ['id', 'operation_date'], 
          required: false 
        }
      ],
      order: [['payment_date', 'ASC']]
    });

    // ========================================
    // CALCULATE OPENING BALANCE
    // ========================================

    const currentBalance = parseFloat(farm.current_balance) || 0;

    // Calculate net change in period
    const purchasesImpact = transactions.reduce((sum, t) => {
      const remaining = parseFloat(t.remaining_amount) || 0;
      const credit = parseFloat(t.used_credit) || 0;
      // Purchase creates debt (negative) but credit reduces it (positive)
      return sum - remaining - credit;
    }, 0);

    const paymentsImpact = payments.reduce((sum, p) => {
      return sum + p.balanceImpact;
    }, 0);

    const totalChangeInPeriod = purchasesImpact + paymentsImpact;
    const openingBalance = currentBalance - totalChangeInPeriod;

    // ========================================
    // BUILD STATEMENT ENTRIES
    // ========================================

    const allEntries = [];

    // Add purchase transactions
    transactions.forEach(t => {
      const totalAmount = parseFloat(t.total_amount);
      const paidAmount = parseFloat(t.paid_amount);
      const remainingAmount = parseFloat(t.remaining_amount);
      const usedCredit = parseFloat(t.used_credit) || 0;

      // Main purchase entry
      allEntries.push({
        date: t.transaction_time,
        type: 'PURCHASE',
        description: `Purchase #${t.sequence_number} - ${parseFloat(t.net_chicken_weight).toFixed(2)} kg ${t.chicken_type?.name || ''} @ ${parseFloat(t.price_per_kg).toFixed(2)} EGP/kg`,
        amount: totalAmount,
        paid_now: paidAmount,
        remaining_debt: remainingAmount,
        credit_used: usedCredit,
        balance_change: -remainingAmount - usedCredit,
        reference_id: t.id,
        operation_date: t.operation?.operation_date,
        vehicle: t.vehicle?.name,
        breakdown: {
          total: totalAmount,
          paid_cash: paidAmount,
          used_credit: usedCredit,
          new_debt: remainingAmount
        }
      });
    });

    // Add payment entries
    payments.forEach(p => {
      allEntries.push({
        date: p.payment_date,
        type: p.payment_direction === 'FROM_FARM' ? 'PAYMENT_RECEIVED' : 'PAYMENT_MADE',
        description: p.displayDescription + (p.notes ? ` - ${p.notes}` : ''),
        amount: parseFloat(p.amount),
        paid_now: parseFloat(p.amount),
        remaining_debt: 0,
        credit_used: 0,
        balance_change: p.balanceImpact,
        reference_id: p.id,
        operation_date: p.operation?.operation_date || null,
        vehicle: null,
        payment_direction: p.payment_direction
      });
    });

    // Sort chronologically
    allEntries.sort((a, b) => new Date(a.date).toLocaleString('en-GB', { timeZone: 'Africa/Cairo' }) - new Date(b.date).toLocaleString('en-GB', { timeZone: 'Africa/Cairo' }));

    // ========================================
    // CALCULATE RUNNING BALANCE
    // ========================================

    let runningBalance = openingBalance;
    
    const statement = allEntries.map(entry => {
      runningBalance += entry.balance_change;
      
      return {
        ...entry,
        running_balance: runningBalance,
        balance_status: runningBalance > 0 ? 'RECEIVABLE' : runningBalance < 0 ? 'PAYABLE' : 'SETTLED'
      };
    });

    // ========================================
    // CALCULATE SUMMARY
    // ========================================

    const totalPurchases = transactions.reduce((sum, t) => 
      sum + parseFloat(t.total_amount), 0
    );
    
    const totalPaidDuringPurchases = transactions.reduce((sum, t) => 
      sum + parseFloat(t.paid_amount), 0
    );
    
    const totalCreditUsed = transactions.reduce((sum, t) => 
      sum + (parseFloat(t.used_credit) || 0), 0
    );
    
    const totalNewDebt = transactions.reduce((sum, t) => 
      sum + parseFloat(t.remaining_amount), 0
    );

    const paymentsReceived = payments
      .filter(p => p.payment_direction === 'FROM_FARM')
      .reduce((sum, p) => sum + parseFloat(p.amount), 0);
    
    const paymentsMade = payments
      .filter(p => p.payment_direction === 'TO_FARM')
      .reduce((sum, p) => sum + parseFloat(p.amount), 0);

    // ========================================
    // RETURN RESPONSE
    // ========================================

    res.json({
      success: true,
      data: {
        farm: {
          id: farm.id,
          name: farm.name,
          owner_name: farm.owner_name,
          phone: farm.phone,
          current_balance: currentBalance,
          balance_type: farm.balanceType,
          display_balance: farm.displayBalance
        },
        period: {
          start_date: start_date || 'Beginning',
          end_date: end_date || 'Current'
        },
        summary: {
          opening_balance: openingBalance,
          opening_balance_type: openingBalance > 0 ? 'RECEIVABLE' : openingBalance < 0 ? 'PAYABLE' : 'SETTLED',
          
          // Purchase breakdown
          total_purchases: totalPurchases,
          paid_during_purchases: totalPaidDuringPurchases,
          credit_used_in_purchases: totalCreditUsed,
          new_debt_from_purchases: totalNewDebt,
          
          // Payments breakdown
          payments_received_from_farm: paymentsReceived,
          payments_made_to_farm: paymentsMade,
          net_payments: paymentsReceived - paymentsMade,
          
          // Net change
          net_change: totalChangeInPeriod,
          closing_balance: currentBalance,
          closing_balance_type: farm.balanceType,
          
          // Counts
          transaction_count: transactions.length,
          payment_count: payments.length,
          total_entries: statement.length
        },
        statement
      }
    });

  } catch (error) {
    console.error('Error generating farm statement:', error);
    res.status(500).json({
      success: false,
      message: 'Error generating farm statement',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

module.exports = exports;