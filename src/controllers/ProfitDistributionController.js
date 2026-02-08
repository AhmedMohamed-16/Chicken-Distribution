// =========================
// File: controllers/ProfitDistributionController.js
// الوصف: كونترولر توزيع الأرباح على الشركاء
// =========================

const { sequelize } = require('../config/database');
const ProfitReportService = require('../services/ProfitReportService');
const {
  DailyOperation,
  ProfitDistribution,
  PartnerProfit,
  Partner,
  Vehicle,
  VehiclePartner
} = require('../models');

class ProfitDistributionController {
  
  /**
   * GET /api/profit-distribution/report
   * تقرير توزيع الأرباح الشامل مع تفاصيل الشركاء
   */
  static async getProfitDistributionReport(req, res) {
    try {
      const { start_date, end_date } = req.query;
      
      // Validation
      if (!start_date || !end_date) {
        return res.status(400).json({
          success: false,
          message: 'يجب تحديد تاريخ البداية والنهاية'
        });
      }
      
      // استخدام خدمة التقرير الأساسية
      const profitReport = await ProfitReportService.generateProfitReport(
        start_date,
        end_date
      );
      
      if (!profitReport.success) {
        return res.status(404).json(profitReport);
      }
      
      // إضافة تحليل توزيع الأرباح على الشركاء
      const partnerDistribution = await ProfitDistributionController.calculatePartnerDistribution(
        start_date,
        end_date
      );
      
      // دمج التقارير
      const fullReport = {
        ...profitReport.data,
        '7_partner_profit_distribution': partnerDistribution
      };
      
      return res.status(200).json({
        success: true,
        data: fullReport
      });
      
    } catch (error) {
      console.error('خطأ في تقرير توزيع الأرباح:', error);
      return res.status(500).json({
        success: false,
        message: 'حدث خطأ في إنشاء التقرير',
        error: error.message
      });
    }
  }
  
  /**
   * GET /api/profit-distribution/partners
   * تفاصيل توزيع الأرباح لكل شريك
   */
  static async getPartnerProfitDetails(req, res) {
    try {
      const { start_date, end_date } = req.query;
      
      if (!start_date || !end_date) {
        return res.status(400).json({
          success: false,
          message: 'يجب تحديد تاريخ البداية والنهاية'
        });
      }
      
      const distribution = await ProfitDistributionController.calculatePartnerDistribution(
        start_date,
        end_date
      );
      
      return res.status(200).json({
        success: true,
        data: distribution
      });
      
    } catch (error) {
      console.error('خطأ في تفاصيل توزيع الشركاء:', error);
      return res.status(500).json({
        success: false,
        message: 'حدث خطأ في جلب البيانات',
        error: error.message
      });
    }
  }
  
  /**
   * GET /api/profit-distribution/partner/:partnerId
   * تفاصيل ربح شريك معين
   */
  static async getIndividualPartnerProfit(req, res) {
    try {
      const { partnerId } = req.params;
      const { start_date, end_date } = req.query;
      
      if (!start_date || !end_date) {
        return res.status(400).json({
          success: false,
          message: 'يجب تحديد تاريخ البداية والنهاية'
        });
      }
      
      const partner = await Partner.findByPk(partnerId);
      
      if (!partner) {
        return res.status(404).json({
          success: false,
          message: 'الشريك غير موجود'
        });
      }
      
      const partnerDetails = await ProfitDistributionController.calculateIndividualPartnerProfit(
        partnerId,
        start_date,
        end_date
      );
      
      return res.status(200).json({
        success: true,
        data: partnerDetails
      });
      
    } catch (error) {
      console.error('خطأ في تفاصيل ربح الشريك:', error);
      return res.status(500).json({
        success: false,
        message: 'حدث خطأ في جلب البيانات',
        error: error.message
      });
    }
  }
  
  /**
   * GET /api/profit-distribution/summary
   * ملخص سريع لتوزيع الأرباح
   */
  static async getDistributionSummary(req, res) {
    try {
      const { start_date, end_date } = req.query;
      
      if (!start_date || !end_date) {
        return res.status(400).json({
          success: false,
          message: 'يجب تحديد تاريخ البداية والنهاية'
        });
      }
      
      const summary = await ProfitDistributionController.generateDistributionSummary(
        start_date,
        end_date
      );
      
      return res.status(200).json({
        success: true,
        data: summary
      });
      
    } catch (error) {
      console.error('خطأ في ملخص التوزيع:', error);
      return res.status(500).json({
        success: false,
        message: 'حدث خطأ في إنشاء الملخص',
        error: error.message
      });
    }
  }
  
  /**
   * ==========================================
   * دوال مساعدة - Partner Distribution Logic
   * ==========================================
   */
  
  /**
   * حساب توزيع الأرباح لكل الشركاء
   */
  static async calculatePartnerDistribution(startDate, endDate) {
    try {
      console.log("dwqjnfdoiqnf2i");
      
      // جلب جميع العمليات المغلقة
      const operations = await DailyOperation.findAll({
        where: {
          operation_date: {
            [sequelize.Sequelize.Op.between]: [startDate, endDate]
          },
          status: 'CLOSED'
        },
        include: [
          {
            model: ProfitDistribution,
            as: 'profit_distribution',
            required: true,
            include: [
              {
                model: PartnerProfit,
                as: 'partner_profits',
                include: [
                  {
                    model: Partner,
                    as: 'partner'
                  }
                ]
              }
            ]
          },
          {
            model: Vehicle,
            as: 'vehicles',
            through: { attributes: ['status'] },
            include: [
              {
                model: Partner,
                as: 'partners',
                through: { 
                  attributes: ['share_percentage'],
                  as: 'vehicle_partnership'
                }
              }
            ]
          }
        ]
      });
      
      if (operations.length === 0) {
        return {
          description: 'لا توجد عمليات مغلقة في الفترة المحددة',
          partners: [],
          period_summary: null
        };
      }
      
      // جلب جميع الشركاء
      const allPartners = await Partner.findAll({
        order: [['investment_percentage', 'DESC']]
      });
      
      // تجميع بيانات كل شريك
      const partnerData = {};
      
      for (const partner of allPartners) {
        partnerData[partner.id] = {
          partner_id: partner.id,
          partner_name: partner.name,
          investment_amount: parseFloat(partner.investment_amount),
          investment_percentage: parseFloat(partner.investment_percentage),
          
          // إجماليات الفترة
          total_base_profit_share: 0,
          total_vehicle_cost_deduction: 0,
          total_final_profit: 0,
          
          // تحليل المشاركة في المركبات
          days_as_vehicle_partner: 0,
          days_as_non_vehicle_partner: 0,
          total_days: 0,
          
          // تفاصيل المركبات
          vehicles_owned: new Set(),
          vehicle_operations_count: 0,
          
          // تفاصيل يومية
          daily_breakdown: []
        };
      }
      
      // معالجة كل عملية
      for (const operation of operations) {
        const profitDist = operation.profit_distribution;
        
        if (!profitDist || !profitDist.partner_profits) continue;
        
        // جمع معرفات المركبات في هذه العملية
        const vehicleIds = (operation.vehicles || []).map(v => v.id);
        
        // معالجة أرباح كل شريك في هذه العملية
        for (const partnerProfit of profitDist.partner_profits) {
          const partnerId = partnerProfit.partner_id;
          
          if (!partnerData[partnerId]) continue;
          
          const data = partnerData[partnerId];
          
          // تحديث الإجماليات
          data.total_base_profit_share += parseFloat(partnerProfit.base_profit_share || 0);
          data.total_vehicle_cost_deduction += parseFloat(partnerProfit.vehicle_cost_share || 0);
          data.total_final_profit += parseFloat(partnerProfit.final_profit || 0);
          data.total_days += 1;
          
          // تحديد نوع المشاركة في هذا اليوم
          let isVehiclePartnerThisDay = false;
          const ownedVehiclesThisDay = [];
          
          for (const vehicle of operation.vehicles || []) {
            const isOwner = (vehicle.partners || []).some(p => p.id === partnerId);
            
            if (isOwner) {
              isVehiclePartnerThisDay = true;
              data.vehicles_owned.add(vehicle.id);
              ownedVehiclesThisDay.push({
                vehicle_id: vehicle.id,
                vehicle_name: vehicle.name
              });
            }
          }
          
          if (isVehiclePartnerThisDay) {
            data.days_as_vehicle_partner += 1;
            data.vehicle_operations_count += ownedVehiclesThisDay.length;
          } else {
            data.days_as_non_vehicle_partner += 1;
          }
          
          // إضافة التفاصيل اليومية
          data.daily_breakdown.push({
            date: operation.operation_date,
            operation_id: operation.id,
            base_share: parseFloat(partnerProfit.base_profit_share || 0),
            vehicle_cost_deduction: parseFloat(partnerProfit.vehicle_cost_share || 0),
            final_profit: parseFloat(partnerProfit.final_profit || 0),
            is_vehicle_partner: isVehiclePartnerThisDay,
            owned_vehicles: ownedVehiclesThisDay,
            operation_net_profit: parseFloat(profitDist.net_profit || 0)
          });
        }
      }
      
      // تحويل Set إلى Array وحساب المقاييس النهائية
      const partnersArray = Object.values(partnerData).map(p => {
        const vehiclesOwnedArray = Array.from(p.vehicles_owned);
        
        return {
          ...p,
          vehicles_owned: vehiclesOwnedArray,
          vehicles_owned_count: vehiclesOwnedArray.length,
          
          // متوسطات
          avg_daily_profit: p.total_days > 0 
            ? parseFloat((p.total_final_profit / p.total_days).toFixed(2))
            : 0,
          
          avg_vehicle_cost_deduction: p.total_days > 0
            ? parseFloat((p.total_vehicle_cost_deduction / p.total_days).toFixed(2))
            : 0,
          
          // نسب
          vehicle_participation_rate: p.total_days > 0
            ? parseFloat(((p.days_as_vehicle_partner / p.total_days) * 100).toFixed(2))
            : 0,
          
          profit_vs_investment_ratio: p.investment_amount > 0
            ? parseFloat((p.total_final_profit / p.investment_amount).toFixed(4))
            : 0,
          
          // تقييم الأداء
          performance_rating: ProfitDistributionController.calculatePartnerPerformanceRating(p)
        };
      });
      
      // حساب ملخص الفترة
      const periodSummary = ProfitDistributionController.calculatePeriodSummary(
        operations,
        partnersArray
      );
      
      return {
        description: 'توزيع الأرباح على الشركاء مع مراعاة المشاركة في المركبات',
        period: {
          start_date: startDate,
          end_date: endDate,
          total_operations: operations.length
        },
        partners: partnersArray,
        period_summary: periodSummary
      };
      
    } catch (error) {
      console.error('خطأ في حساب توزيع الشركاء:', error);
      throw error;
    }
  }
  
  /**
   * حساب تفاصيل ربح شريك واحد
   */
  static async calculateIndividualPartnerProfit(partnerId, startDate, endDate) {
    try {
      const partner = await Partner.findByPk(partnerId, {
        include: [
          {
            model: Vehicle,
            as: 'vehicles',
            through: { 
              attributes: ['share_percentage']
            }
          }
        ]
      });
      
      if (!partner) {
        throw new Error('الشريك غير موجود');
      }
      
      // جلب جميع أرباح الشريك في الفترة
      const partnerProfits = await PartnerProfit.findAll({
        include: [
          {
            model: ProfitDistribution,
            as: 'profit_distribution',
            required: true,
            include: [
              {
                model: DailyOperation,
                as: 'operation',
                required: true,
                where: {
                  operation_date: {
                    [sequelize.Sequelize.Op.between]: [startDate, endDate]
                  },
                  status: 'CLOSED'
                },
                include: [
                  {
                    model: Vehicle,
                    as: 'vehicles',
                    through: { attributes: ['status'] }
                  }
                ]
              }
            ]
          }
        ],
        where: {
          partner_id: partnerId
        },
        order: [[
          { model: ProfitDistribution, as: 'profit_distribution' },
          { model: DailyOperation, as: 'operation' },
          'operation_date',
          'ASC'
        ]]
      });
      
      if (partnerProfits.length === 0) {
        return {
          partner_info: {
            id: partner.id,
            name: partner.name,
            investment_amount: parseFloat(partner.investment_amount),
            investment_percentage: parseFloat(partner.investment_percentage)
          },
          period: {
            start_date: startDate,
            end_date: endDate
          },
          summary: {
            total_operations: 0,
            total_profit: 0,
            message: 'لا توجد عمليات مغلقة في هذه الفترة'
          }
        };
      }
      
      // تحليل تفصيلي
      let totalBaseShare = 0;
      let totalVehicleCostDeduction = 0;
      let totalFinalProfit = 0;
      let daysAsVehiclePartner = 0;
      let daysAsNonVehiclePartner = 0;
      
      const dailyDetails = [];
      const vehiclesParticipated = new Set();
      
      for (const profit of partnerProfits) {
        const operation = profit.profit_distribution.operation;
        
        totalBaseShare += parseFloat(profit.base_profit_share || 0);
        totalVehicleCostDeduction += parseFloat(profit.vehicle_cost_share || 0);
        totalFinalProfit += parseFloat(profit.final_profit || 0);
        
        // تحديد نوع المشاركة
        let isVehiclePartnerThisDay = false;
        const ownedVehicles = [];
        
        for (const vehicle of operation.vehicles || []) {
          const partnerVehicle = partner.vehicles.find(v => v.id === vehicle.id);
          
          if (partnerVehicle) {
            isVehiclePartnerThisDay = true;
            vehiclesParticipated.add(vehicle.id);
            ownedVehicles.push({
              vehicle_id: vehicle.id,
              vehicle_name: vehicle.name,
              share_percentage: parseFloat(
                partnerVehicle.vehicle_partnership?.share_percentage || 0
              )
            });
          }
        }
        
        if (isVehiclePartnerThisDay) {
          daysAsVehiclePartner += 1;
        } else {
          daysAsNonVehiclePartner += 1;
        }
        
        dailyDetails.push({
          date: operation.operation_date,
          operation_id: operation.id,
          base_profit_share: parseFloat(profit.base_profit_share || 0),
          vehicle_cost_deduction: parseFloat(profit.vehicle_cost_share || 0),
          final_profit: parseFloat(profit.final_profit || 0),
          is_vehicle_partner: isVehiclePartnerThisDay,
          owned_vehicles: ownedVehicles,
          operation_net_profit: parseFloat(profit.profit_distribution.net_profit || 0),
          profit_percentage_of_operation: profit.profit_distribution.net_profit > 0
            ? parseFloat(((profit.final_profit / profit.profit_distribution.net_profit) * 100).toFixed(2))
            : 0
        });
      }
      
      const totalDays = partnerProfits.length;
      
      return {
        partner_info: {
          id: partner.id,
          name: partner.name,
          investment_amount: parseFloat(partner.investment_amount),
          investment_percentage: parseFloat(partner.investment_percentage),
          vehicles_owned: partner.vehicles.map(v => ({
            vehicle_id: v.id,
            vehicle_name: v.name,
            share_percentage: parseFloat(v.vehicle_partnership?.share_percentage || 0)
          }))
        },
        
        period: {
          start_date: startDate,
          end_date: endDate,
          total_operations: totalDays
        },
        
        summary: {
          total_base_profit_share: parseFloat(totalBaseShare.toFixed(2)),
          total_vehicle_cost_deduction: parseFloat(totalVehicleCostDeduction.toFixed(2)),
          total_final_profit: parseFloat(totalFinalProfit.toFixed(2)),
          
          avg_daily_profit: totalDays > 0 
            ? parseFloat((totalFinalProfit / totalDays).toFixed(2))
            : 0,
          
          days_as_vehicle_partner: daysAsVehiclePartner,
          days_as_non_vehicle_partner: daysAsNonVehiclePartner,
          vehicle_participation_rate: totalDays > 0
            ? parseFloat(((daysAsVehiclePartner / totalDays) * 100).toFixed(2))
            : 0,
          
          vehicles_participated: Array.from(vehiclesParticipated).length,
          
          roi: partner.investment_amount > 0
            ? parseFloat(((totalFinalProfit / partner.investment_amount) * 100).toFixed(2))
            : 0
        },
        
        daily_details: dailyDetails,
        
        insights: ProfitDistributionController.generatePartnerInsights(
          partner,
          totalFinalProfit,
          daysAsVehiclePartner,
          daysAsNonVehiclePartner,
          totalVehicleCostDeduction
        )
      };
      
    } catch (error) {
      console.error('خطأ في حساب ربح الشريك:', error);
      throw error;
    }
  }
  
  /**
   * إنشاء ملخص التوزيع
   */
  static async generateDistributionSummary(startDate, endDate) {
    try {
      const distribution = await ProfitDistributionController.calculatePartnerDistribution(
        startDate,
        endDate
      );
      
      if (!distribution.partners || distribution.partners.length === 0) {
        return {
          message: 'لا توجد بيانات للفترة المحددة'
        };
      }
      
      const partners = distribution.partners;
      const totalProfit = partners.reduce((sum, p) => sum + p.total_final_profit, 0);
      
      return {
        period: distribution.period,
        
        overview: {
          total_partners: partners.length,
          total_profit_distributed: parseFloat(totalProfit.toFixed(2)),
          total_operations: distribution.period.total_operations
        },
        
        top_earners: partners
          .sort((a, b) => b.total_final_profit - a.total_final_profit)
          .slice(0, 3)
          .map(p => ({
            partner_name: p.partner_name,
            total_profit: parseFloat(p.total_final_profit.toFixed(2)),
            percentage_of_total: totalProfit > 0
              ? parseFloat(((p.total_final_profit / totalProfit) * 100).toFixed(2))
              : 0
          })),
        
        vehicle_vs_non_vehicle: {
          partners_with_vehicles: partners.filter(p => p.vehicles_owned_count > 0).length,
          partners_without_vehicles: partners.filter(p => p.vehicles_owned_count === 0).length,
          
          avg_profit_vehicle_partners: ProfitDistributionController.calculateAverageProfit(
            partners.filter(p => p.vehicles_owned_count > 0)
          ),
          avg_profit_non_vehicle_partners: ProfitDistributionController.calculateAverageProfit(
            partners.filter(p => p.vehicles_owned_count === 0)
          )
        },
        
        roi_analysis: {
          highest_roi: partners.length > 0
            ? {
                partner_name: partners.reduce((max, p) => 
                  p.profit_vs_investment_ratio > max.profit_vs_investment_ratio ? p : max
                ).partner_name,
                roi: parseFloat(partners.reduce((max, p) => 
                  p.profit_vs_investment_ratio > max.profit_vs_investment_ratio ? p : max
                ).profit_vs_investment_ratio.toFixed(4))
              }
            : null,
          
          average_roi: partners.length > 0
            ? parseFloat((
                partners.reduce((sum, p) => sum + p.profit_vs_investment_ratio, 0) / 
                partners.length
              ).toFixed(4))
            : 0
        }
      };
      
    } catch (error) {
      console.error('خطأ في ملخص التوزيع:', error);
      throw error;
    }
  }
  
  /**
   * ==========================================
   * دوال مساعدة إضافية
   * ==========================================
   */
  
  /**
   * حساب تقييم أداء الشريك
   */
  static calculatePartnerPerformanceRating(partnerData) {
    let score = 0;
    
    // معيار 1: نسبة الربح إلى الاستثمار (40%)
    const roiScore = Math.min(partnerData.profit_vs_investment_ratio * 20, 40);
    score += roiScore;
    
    // معيار 2: متوسط الربح اليومي (30%)
    const avgProfitScore = Math.min(partnerData.avg_daily_profit / 100, 30);
    score += avgProfitScore;
    
    // معيار 3: الاستقرار - نسبة المشاركة في المركبات (30%)
    score += (partnerData.vehicle_participation_rate / 100) * 30;
    
    if (score >= 80) return 'ممتاز';
    if (score >= 60) return 'جيد جداً';
    if (score >= 40) return 'جيد';
    if (score >= 20) return 'مقبول';
    return 'ضعيف';
  }
  
  /**
   * حساب ملخص الفترة
   */
  static calculatePeriodSummary(operations, partnersArray) {
    const totalNetProfit = operations.reduce((sum, op) => 
      sum + parseFloat(op.profit_distribution?.net_profit || 0), 0
    );
    
    const totalDistributed = partnersArray.reduce((sum, p) => 
      sum + p.total_final_profit, 0
    );
    
    const totalVehicleCostDeductions = partnersArray.reduce((sum, p) => 
      sum + p.total_vehicle_cost_deduction, 0
    );
    
    return {
      total_net_profit: parseFloat(totalNetProfit.toFixed(2)),
      total_distributed_to_partners: parseFloat(totalDistributed.toFixed(2)),
      total_vehicle_cost_deductions: parseFloat(totalVehicleCostDeductions.toFixed(2)),
      
      distribution_accuracy: totalNetProfit > 0
        ? parseFloat(((totalDistributed / totalNetProfit) * 100).toFixed(2))
        : 0,
      
      avg_profit_per_operation: operations.length > 0
        ? parseFloat((totalNetProfit / operations.length).toFixed(2))
        : 0,
      
      partners_summary: {
        total_partners: partnersArray.length,
        vehicle_partners: partnersArray.filter(p => p.vehicles_owned_count > 0).length,
        non_vehicle_partners: partnersArray.filter(p => p.vehicles_owned_count === 0).length
      }
    };
  }
  
  /**
   * حساب متوسط الربح لمجموعة شركاء
   */
  static calculateAverageProfit(partnersSubset) {
    if (partnersSubset.length === 0) return 0;
    
    const totalProfit = partnersSubset.reduce((sum, p) => 
      sum + p.total_final_profit, 0
    );
    
    return parseFloat((totalProfit / partnersSubset.length).toFixed(2));
  }
  
  /**
   * توليد رؤى للشريك
   */
  static generatePartnerInsights(partner, totalProfit, vehicleDays, nonVehicleDays, vehicleCostDeduction) {
    const insights = [];
    
    const totalDays = vehicleDays + nonVehicleDays;
    
    // رؤية 1: المشاركة في المركبات
    if (vehicleDays > 0 && nonVehicleDays > 0) {
      const vehicleRate = (vehicleDays / totalDays) * 100;
      insights.push({
        type: 'vehicle_participation',
        message: `شارك في المركبات ${vehicleRate.toFixed(0)}% من الأيام، مما وفّر ${vehicleCostDeduction.toFixed(2)} جنيه في تكاليف المركبات`
      });
    } else if (vehicleDays === 0) {
      insights.push({
        type: 'vehicle_participation',
        message: `لم يشارك في أي مركبات، مما أدى لخصم ${vehicleCostDeduction.toFixed(2)} جنيه من أرباحه`
      });
    } else {
      insights.push({
        type: 'vehicle_participation',
        message: 'شارك في المركبات في جميع الأيام، بدون خصومات تكاليف مركبات'
      });
    }
    
    // رؤية 2: الربح مقابل الاستثمار
    const roi = partner.investment_amount > 0 
      ? (totalProfit / partner.investment_amount) * 100 
      : 0;
    
    if (roi > 10) {
      insights.push({
        type: 'roi',
        message: `عائد استثمار ممتاز ${roi.toFixed(2)}% للفترة`
      });
    } else if (roi > 5) {
      insights.push({
        type: 'roi',
        message: `عائد استثمار جيد ${roi.toFixed(2)}% للفترة`
      });
    } else {
      insights.push({
        type: 'roi',
        message: `عائد استثمار متواضع ${roi.toFixed(2)}% - يحتاج تحسين`
      });
    }
    
    // رؤية 3: توصية
    if (nonVehicleDays > vehicleDays && vehicleCostDeduction > 1000) {
      insights.push({
        type: 'recommendation',
        message: `يُنصح بالاستثمار في مركبة لتوفير ${vehicleCostDeduction.toFixed(2)} جنيه من الخصومات`
      });
    }
    
    return insights;
  }
}

module.exports = ProfitDistributionController;