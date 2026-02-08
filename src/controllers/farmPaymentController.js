const { sequelize } = require('../config/database');
const { Farm, FarmDebtPayment, DailyOperation } = require('../models');
const { Op } = require('sequelize');
const AppError = require('../utils/app-error.utility');

/**
 * Record a farm debt payment (bidirectional)
 * POST /api/farm-debt-payments
 */
exports.recordPayment = async (req, res,next) => {
  const dbTransaction = await sequelize.transaction();

  try {
    const {
      farm_id,
      amount,
      payment_direction,  // 'FROM_FARM' or 'TO_FARM'
      payment_date,
      daily_operation_id = null,
      notes = null
    } = req.body;

    // ========================================
    // VALIDATION
    // ========================================

    if (!farm_id) {
      await dbTransaction.rollback();
 
      next(new AppError( 'معرف المزرعة مطلوب',400));
    }

    if (!amount || amount <= 0) {
      await dbTransaction.rollback();
           next(new AppError( 'يجب أن يكون المبلغ أكبر من 0',400));

    }

    if (!payment_direction || !['FROM_FARM', 'TO_FARM'].includes(payment_direction)) {
      await dbTransaction.rollback();

      next(new AppError( 'يجب أن يكون اتجاه الدفع من المزرعة أو إلى المزرعة',400));

    }

    if (!payment_date) {
      await dbTransaction.rollback();

           next(new AppError( 'تاريخ الدفع مطلوب',400));

    }

    // Validate farm exists
    const farm = await Farm.findByPk(farm_id, { transaction: dbTransaction });
    
    if (!farm) {
      await dbTransaction.rollback();
   
      next(new AppError( 'لم يتم العثور على المزرعة',404));

    }

    // Validate daily operation if provided
    if (daily_operation_id) {
      const operation = await DailyOperation.findByPk(daily_operation_id, { 
        transaction: dbTransaction 
      });
      
      if (!operation) {
        await dbTransaction.rollback();
           next(new AppError( 'لم يتم العثور على لم يتم العثور على العملية اليومية',404));

      }
    }

    // ========================================
    // BUSINESS LOGIC VALIDATION
    // ========================================

    const currentBalance = parseFloat(farm.current_balance) || 0;

    // Check for logical payment scenarios
    if (payment_direction === 'FROM_FARM') {
      // Farm is paying us
      if (currentBalance < 0) {
        // We owe them, but they're paying us - unusual but allowed
        console.warn(`Warning: Farm ${farm_id} is paying us ${amount} EGP, but we owe them ${Math.abs(currentBalance)} EGP`);
      }
    } else {
      // We are paying farm
      if (currentBalance > 0) {
        // They owe us, but we're paying them - unusual but allowed
        console.warn(`Warning: We are paying farm ${farm_id} ${amount} EGP, but they owe us ${currentBalance} EGP`);
      }
    }

    // ========================================
    // CREATE PAYMENT RECORD
    // ========================================

    const payment = await FarmDebtPayment.create({
      farm_id,
      amount,
      payment_direction,
      payment_date,
      daily_operation_id,
      notes
    }, { transaction: dbTransaction });

    // ========================================
    // UPDATE FARM BALANCE
    // ========================================

    // Calculate balance impact:
    // FROM_FARM: Farm pays us → reduces their debt (negative impact on their balance)
    // TO_FARM: We pay farm → increases their debt to us OR reduces our debt to them (positive impact)
    
    const balanceChange = payment.balanceImpact;
    const balanceInfo = await farm.updateBalance(balanceChange, dbTransaction);

    // ========================================
    // COMMIT TRANSACTION
    // ========================================

    await dbTransaction.commit();

    // ========================================
    // FETCH COMPLETE RESULT
    // ========================================

    const result = await FarmDebtPayment.findByPk(payment.id, {
      include: [
        {
          model: Farm,
          as: 'farm',
          attributes: ['id', 'name', 'current_balance']
        },
        {
          model: DailyOperation,
          as: 'operation',
          attributes: ['id', 'operation_date'],
          required: false
        }
      ]
    });

    // ========================================
    // RESPONSE
    // ========================================

    res.status(201).json({
      success: true,
      message: `المزرعه ${payment_direction === 'FROM_FARM' ? 'استقبلت من' : 'دفعت ل'} تم تسجيل الدين`,
      data: {
        payment: {
          ...result.toJSON(),
          signed_amount: result.signedAmount,
          display_description: result.displayDescription
        },
        balance_info: {
          farm_id: balanceInfo.farm_id,
          farm_name: balanceInfo.farm_name,
          previous_balance: balanceInfo.previous_balance,
          payment_impact: balanceChange,
          new_balance: balanceInfo.new_balance,
          balance_type: balanceInfo.new_type,
          direction_changed: balanceInfo.direction_changed,
          display_message: balanceInfo.display_balance,
          
          // ✅ ALERT if direction changed
          ...(balanceInfo.direction_changed && {
            alert: `⚠️ تغير اتجاه الرصيد من ${balanceInfo.previous_type} الي ${balanceInfo.new_type}`
          })
        }
      }
    });

  } catch (error) {
    if (!dbTransaction.finished) {
      await dbTransaction.rollback();
    }

      next(new AppError( 'خطأ في تسجيل الدفع'));
  }
};

/**
 * Get payment history for a farm
 * GET /api/farm-debt-payments/farm/:farmId
 */
exports.getPaymentHistory = async (req, res,next) => {
  try {
    const { farmId } = req.params;
    const { 
      limit = 50, 
      offset = 0,
      start_date = null,
      end_date = null
    } = req.query;

    const payments = await FarmDebtPayment.getPaymentHistory(
      farmId,
      {
        limit: parseInt(limit),
        offset: parseInt(offset),
        startDate: start_date,
        endDate: end_date
      }
    );

    const summary = await FarmDebtPayment.getPaymentSummary(
      farmId,
      {
        startDate: start_date,
        endDate: end_date
      }
    );

    res.json({
      success: true,
      data: {
        summary,
        payments: payments.map(p => ({
          ...p.toJSON(),
          signed_amount: p.signedAmount,
          display_description: p.displayDescription
        })),
        pagination: {
          limit: parseInt(limit),
          offset: parseInt(offset),
          total: payments.length
        }
      }
    });

  } catch (error) {
         next(new AppError( 'حدث خطأ في جلب سجل الدين'));

  }
};

/**
 * Get payment by ID
 * GET /api/farm-debt-payments/:id
 */
exports.getPaymentById = async (req, res,next) => {
  try {
    const { id } = req.params;

    const payment = await FarmDebtPayment.findByPk(id, {
      include: [
        {
          model: Farm,
          as: 'farm',
          attributes: ['id', 'name', 'current_balance']
        },
        {
          model: DailyOperation,
          as: 'operation',
          attributes: ['id', 'operation_date'],
          required: false
        }
      ]
    });

    if (!payment) {
          next(new AppError( 'لم يتم العثور على الدين',404));

    }

    res.json({
      success: true,
      data: {
        ...payment.toJSON(),
        signed_amount: payment.signedAmount,
        balance_impact: payment.balanceImpact,
        display_description: payment.displayDescription
      }
    });

  } catch (error) {
      next(new AppError( 'معرف المزرعة حدث خطأ في جلب الديون'));

  }
};

/**
 * Delete a payment (admin only)
 * DELETE /api/farm-debt-payments/:id
 */
exports.deletePayment = async (req, res,next) => {
  const dbTransaction = await sequelize.transaction();

  try {
    const { id } = req.params;

    const payment = await FarmDebtPayment.findByPk(id, { 
      transaction: dbTransaction 
    });

    if (!payment) {
      await dbTransaction.rollback();

        next(new AppError( 'لم يتم العثور على الدفع',404));

    }

    // Reverse the balance impact
    const farm = await Farm.findByPk(payment.farm_id, { 
      transaction: dbTransaction 
    });

    if (!farm) {
      await dbTransaction.rollback();
    next(new AppError( 'لم يتم العثور على المزرعة المرتبطة',404));

    }

    // Reverse the payment impact
    const reverseImpact = -payment.balanceImpact;
    await farm.updateBalance(reverseImpact, dbTransaction);

    // Delete payment
    await payment.destroy({ transaction: dbTransaction });

    await dbTransaction.commit();

    res.json({
      success: true,
      message: 'تم حذف الدفعة وعكس الرصيد بنجاح'
    });

  } catch (error) {
    if (!dbTransaction.finished) {
      await dbTransaction.rollback();
    }

        next(new AppError( 'حدث خطأ أثناء حذف الدفعة'));
  }
};

module.exports = exports;