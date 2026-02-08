// src/controllers/buyerController.js
const { Buyer, SaleTransaction, BuyerDebtPayment, DailyOperation } = require('../models');
const { sequelize } = require('../config/database');
const { format12Hour } =  require('./../utils/format12Hour');
const { Op } = require('sequelize');
const AppError = require('../utils/app-error.utility');

exports.getAllBuyers = async (req, res,next) => {
  try {
    const buyers = await Buyer.findAll({
      order: [['name', 'ASC']]
    });

    res.json({
      success: true,
      data: buyers
    });
  } catch (error) {
     next(new AppError( 'حدث خطأ في جلب المشترين'));
  }
};

exports.getPaginationAllBuyers = async (req, res,next) => {
  try {
    const { page = 1, limit = 50, search,has_debt } = req.query;
    
    const offset = (parseInt(page) - 1) * parseInt(limit);
    
    const where = {};
    
    // Search filter
    if (search) {
      where[Op.or] = [
        { name: { [Op.iLike]: `%${search}%` } },
        { phone: { [Op.iLike]: `%${search}%` } },
        { address: { [Op.iLike]: `%${search}%` } }
      ];
    }
    console.log("has_debt",has_debt);
    
    // فلتر الدين
    if (has_debt === 'true') {
      where.total_debt = { [Op.gt]: 0 }; // عليه دين
    } else if (has_debt === 'false') {
      where.total_debt = 0; // لا يوجد دين
    }

    const { count, rows: buyers } = await Buyer.findAndCountAll({
      where,
      order: [['name', 'ASC']],
      limit: parseInt(limit),
      offset
    });
    
    res.json({
      success: true,
      data: {
        items: buyers,
        pagination: {
          total: count,
          page: parseInt(page),
          limit: parseInt(limit),
          total_pages: Math.ceil(count / parseInt(limit))
        }
      }
    });
    
  } catch (error) {
     next(new AppError( 'حدث خطأ في جلب المشترين'));
  }
};
exports.getBuyerById = async (req, res,next) => {
  try {
    const buyer = await Buyer.findByPk(req.params.id);

    if (!buyer) {
         next(new AppError( 'لم يتم العثور على المشتري',404));
    }

    res.json({
      success: true,
      data: buyer
    });
  } catch (error) {
     next(new AppError( 'حدث خطأ في جلب المشترين'));
  }
};

exports.createBuyer = async (req, res,next) => {
  try {
    const buyer = await Buyer.create(req.body);

    res.status(201).json({
      success: true,
      message: 'تم إنشاء المشتري بنجاح',
      data: buyer
    });
  } catch (error) {
 next(new AppError( 'حدث خطأ في جلب حدث خطأ أثناء إنشاء المشتري'));
  }
};

exports.updateBuyer = async (req, res,next) => {
  try {
    const buyer = await Buyer.findByPk(req.params.id);

    if (!buyer) {
       next(new AppError( 'لم يتم العثور على المشتري',404));
    }

    // Don't allow manual update of total_debt through this endpoint
    const { total_debt, ...updateData } = req.body;

    await buyer.update(updateData);

    res.json({
      success: true,
      message: 'تم تحديث المشتري بنجاح',
      data: buyer
    });
  } catch (error) {
    next(new AppError( 'حدث خطأ أثناء تحديث المشتري'));
  }
};

exports.deleteBuyer = async (req, res,next) => {
  try {
    const buyer = await Buyer.findByPk(req.params.id);

    if (!buyer) {
         next(new AppError( 'لم يتم العثور على المشتري',404));
    }

    // Check if buyer has any transactions
    const transactionCount = await SaleTransaction.count({
      where: { buyer_id: req.params.id }
    });

    if (transactionCount > 0) {
       next(new AppError(' لا يمكن حذف المشتري الذي لديه معاملات قائمة غير موجود ', 400));
    }

    await buyer.destroy();

    res.json({
      success: true,
      message: 'تم حذف المشتري بنجاح'
    });
  } catch (error) {
     next(new AppError( 'خطأ في حذف المشتري '));
  }
};

// exports.getBuyerDebtHistory = async (req, res) => {
//   try {
//     const buyer = await Buyer.findByPk(req.params.id);

//     if (!buyer) {
//       return res.status(404).json({
//         success: false,
//         message: 'Buyer not found'
//       });
//     }

//     // Get all sales transactions
//     const transactions = await SaleTransaction.findAll({
//       where: { buyer_id: req.params.id },
//       include: [
//         {
//           model: DailyOperation,as:"operation",
//           attributes: ['id', 'operation_date']
//         }
//       ],
//       order: [['transaction_time', 'DESC']]
//     });

//     // Get all debt payments
//     const payments = await BuyerDebtPayment.findAll({
//       where: { buyer_id: req.params.id },
//       include: [
//         {
//           model: DailyOperation,as:"operation",
//           attributes: ['id', 'operation_date'],
//           required: false
//         }
//       ],
//       order: [['payment_date', 'DESC']]
//     });

//     res.json({
//       success: true,
//       data: {
//         buyer,
//         current_debt: buyer.total_debt,
//         transactions,
//         payments,
//         summary: {
//           total_sales: transactions.length,
//           total_payments: payments.length,
//           total_amount_sold: transactions.reduce((sum, t) => sum + parseFloat(t.total_amount), 0),
//           total_amount_paid: transactions.reduce((sum, t) => sum + parseFloat(t.paid_amount) + parseFloat(t.old_debt_paid), 0)
//         }
//       }
//     });
//   } catch (error) {
//     console.error('Error fetching buyer debt history:', error);
//     res.status(500).json({
//       success: false,
//       message: 'Error fetching debt history',
//       error: error.message
//     });
//   }
// };

// Record a standalone debt payment (not part of a sale)
// exports.getBuyerDebtHistory = async (req, res) => {
//   try {
//     const buyer = await Buyer.findByPk(req.params.id);
//     if (!buyer) {
//       return res.status(404).json({
//         success: false,
//         message: 'Buyer not found'
//       });
//     }

//     // Get all sales transactions
//     const transactions = await SaleTransaction.findAll({
//       where: { buyer_id: req.params.id },
//       include: [
//         {
//           model: DailyOperation,
//           as: "operation",
//           attributes: ['id', 'operation_date']
//         }
//       ],
//       order: [['transaction_time', 'ASC']] // ASC for chronological calculation
//     });

//     // Get all debt payments
//     const payments = await BuyerDebtPayment.findAll({
//       where: { buyer_id: req.params.id },
//       include: [
//         {
//           model: DailyOperation,
//           as: "operation",
//           attributes: ['id', 'operation_date'],
//           required: false
//         }
//       ],
//       order: [['payment_date', 'ASC']] // ASC for chronological calculation
//     });

//     // Merge and sort all events chronologically
//     const events = [];

//     // Add transactions
//     transactions.forEach(t => {
//       events.push({
//         date: t.transaction_time,
//         type: 'transaction',
//         transaction_id: t.id,
//         total_amount: parseFloat(t.total_amount),
//         paid_amount: parseFloat(t.paid_amount) + parseFloat(t.old_debt_paid || 0),
//         old_debt_paid: parseFloat(t.old_debt_paid || 0),
//         remaining_amount: parseFloat(t.remaining_amount),
//         raw_data: t
//       });
//     });

//     // Add payments
//     payments.forEach(p => {
//       events.push({
//         date: p.payment_date,
//         type: 'payment',
//         payment_id: p.id,
//         amount: parseFloat(p.amount),
//         raw_data: p
//       });
//     });

//     // Sort by date ascending
//     events.sort((a, b) => new Date(a.date) - new Date(b.date));

//     // Calculate cumulative debt
//     let cumulativeDebt = 0;
//     const history = [];

//     events.forEach(event => {
//       if (event.type === 'transaction') {
//         // For transaction: debt increases by remaining_amount
//         const debtIncrease = event.remaining_amount;
//         cumulativeDebt += debtIncrease;

//         history.push({
//           date: event.date,
//           type: 'transaction',
//           transaction_id: event.transaction_id,
//           total_amount: event.total_amount,
//           paid_amount: event.paid_amount,
//           old_debt_paid: event.old_debt_paid,
//           remaining_amount: event.remaining_amount,
//           debt_before: cumulativeDebt - debtIncrease,
//           debt_change: debtIncrease,
//           debt_after: cumulativeDebt,
//           raw_data: event.raw_data
//         });
//       } else if (event.type === 'payment') {
//         // For payment: debt decreases by payment amount
//         const debtDecrease = event.amount;
//         cumulativeDebt -= debtDecrease;

//         history.push({
//           date: event.date,
//           type: 'payment',
//           payment_id: event.payment_id,
//           amount: event.amount,
//           debt_before: cumulativeDebt + debtDecrease,
//           debt_change: -debtDecrease,
//           debt_after: cumulativeDebt,
//           raw_data: event.raw_data
//         });
//       }
//     });

//     // Reverse for display (most recent first)
//     // history.reverse();
//  // Sort by date descending (الأحدث أولاً)
// events.sort((a, b) => new Date(b.date) - new Date(a.date));

//     res.json({
//       success: true,
//       data: {
//         buyer,
//         current_debt: parseFloat(buyer.total_debt),
//         calculated_debt: cumulativeDebt, // Should match current_debt
//         history,
//         summary: {
//           total_sales: transactions.length,
//           total_payments: payments.length,
//           total_amount_sold: transactions.reduce((sum, t) => sum + parseFloat(t.total_amount), 0),
//           total_amount_paid: transactions.reduce((sum, t) => sum + parseFloat(t.paid_amount) + parseFloat(t.old_debt_paid || 0), 0) + payments.reduce((sum, p) => sum + parseFloat(p.amount), 0)
//         }
//       }
//     });
//   } catch (error) {
//     console.error('Error fetching buyer debt history:', error);
//     res.status(500).json({
//       success: false,
//       message: 'Error fetching debt history',
//       error: error.message
//     });
//   }
// };
// exports.getBuyerDebtHistory = async (req, res,next) => {
//   try {
//     const buyer = await Buyer.findByPk(req.params.id);
//     if (!buyer) {
//     next(new AppError( 'لم يتم العثور على المشتري',404));

//     }

//     // Get all sales transactions
//     const transactions = await SaleTransaction.findAll({
//       where: { buyer_id: req.params.id },
//       include: [
//         {
//           model: DailyOperation,
//           as: "operation",
//           attributes: ['id', 'operation_date']
//         }
//       ],
//       order: [['transaction_time', 'ASC']]
//     });

//     // Get all debt payments
//     const payments = await BuyerDebtPayment.findAll({
//       where: { buyer_id: req.params.id },
//       include: [
//         {
//           model: DailyOperation,
//           as: "operation",
//           attributes: ['id', 'operation_date'],
//           required: false
//         }
//       ],
//       order: [['payment_date', 'ASC']]
//     });

//     // Create a Set of transaction timestamps for quick lookup
//     const transactionTimestamps = new Set(
//       transactions.map(t => new Date(t.transaction_time).getTime())
//     );

//     // Filter out payments that haven't the exact same timestamp as any transaction
//     const filteredPayments = payments.filter(p => {
//       const paymentTimestamp = new Date(p.payment_date).getTime();
//       return transactionTimestamps.has(paymentTimestamp);
//     });
//   console.log("\n\nfilteredPayments",filteredPayments);
//   console.log("payments",payments);
  
//     // Merge and sort all events chronologically
//     const events = [];

//     // Add transactions
//     transactions.forEach(t => {
       
//       events.push({
//         date: t.transaction_time,
//         type: 'transaction',
//         transaction_id: t.id,
//         total_amount: parseFloat(t.total_amount),
//         paid_amount: parseFloat(t.paid_amount) + parseFloat(t.old_debt_paid || 0),
//         old_debt_paid: parseFloat(t.old_debt_paid || 0),
//         remaining_amount: parseFloat(t.remaining_amount),
//         raw_data: t
//       });
//     });

//     // Add filtered payments only
//     filteredPayments.forEach(p => {
//       events.push({
//         date: p.payment_date,
//         type: 'payment',
//         payment_id: p.id,
//         amount: parseFloat(p.amount),
//         raw_data: p
//       });
//     });

//     // Sort by date ascending
//     events.sort((a, b) => new Date(a.date) - new Date(b.date));

//     // Calculate cumulative debt
//     let cumulativeDebt = 0;
//     const history = [];

//     events.forEach(event => {
//       if (event.type === 'transaction') {
//         // const debtIncrease = event.remaining_amount;
//         console.log("event.total_amount",event.total_amount);
//         console.log("event.total_amount_paid",event.total_amount_paid);
        
//         const debtIncrease = event.total_amount- event.paid_amount;
//         cumulativeDebt += debtIncrease;

//         history.push({
//           date: event.date,
//           type: 'transaction',
//           transaction_id: event.transaction_id,
//           total_amount: event.total_amount,
//           paid_amount: event.paid_amount,
//           old_debt_paid: event.old_debt_paid,
//           remaining_amount: event.remaining_amount,
//           debt_before: cumulativeDebt - debtIncrease,
//           debt_change: debtIncrease,
//           debt_after: cumulativeDebt,
//           raw_data: event.raw_data
//         });
//       } else if (event.type === 'payment') {
//         const debtDecrease = event.amount;
//         cumulativeDebt -= debtDecrease;

//         history.push({
//           date: event.date,
//           type: 'payment',
//           payment_id: event.payment_id,
//           amount: event.amount,
//           debt_before: cumulativeDebt + debtDecrease,
//           debt_change: -debtDecrease,
//           debt_after: cumulativeDebt,
//           raw_data: event.raw_data
//         });
//       }
//     });

//     // Sort by date descending (الأحدث أولاً)
//     history.sort((a, b) => new Date(b.date) - new Date(a.date));

//     res.json({
//       success: true,
//       data: {
//         buyer,
//         current_debt: parseFloat(buyer.total_debt),
//         calculated_debt: cumulativeDebt,
//         history,
//         summary: {
//           total_sales: transactions.length,
//           total_payments: filteredPayments.length,
//           total_amount_sold: transactions.reduce((sum, t) => sum + parseFloat(t.total_amount), 0),
//           total_amount_paid: transactions.reduce((sum, t) => sum + parseFloat(t.paid_amount) + parseFloat(t.old_debt_paid || 0), 0) + filteredPayments.reduce((sum, p) => sum + parseFloat(p.amount), 0)
//         }
//       }
//     });
//   } catch (error) { 
//     next(new AppError( 'خطأ في جلب سجل الديون ',));
//   }
// };
 
exports.getBuyerDebtHistory = async (req, res, next) => {
  try {
    const { id } = req.params;
    // default: آخر 7 معاملات، أو اللي اليوزر يحدده
    const limit = parseInt(req.query.limit) || 7;

    const buyer = await Buyer.findByPk(id);
    if (!buyer) {
      return next(new AppError('لم يتم العثور على المشتري', 404));
    }

    // جلب آخر N معاملة بيع فقط
    const transactions = await SaleTransaction.findAll({
      where: { buyer_id: id },
      include: [
        {
          model: DailyOperation,
          as: "operation",
          attributes: ['id', 'operation_date']
        }
      ],
      order: [['transaction_time', 'DESC']],
      limit: limit
    });

    // جلب آخر N دفعة فقط
    const payments = await BuyerDebtPayment.findAll({
      where: { buyer_id: id },
      include: [
        {
          model: DailyOperation,
          as: "operation",
          attributes: ['id', 'operation_date'],
          required: false
        }
      ],
      order: [['payment_date', 'DESC']],
      limit: limit
    });

    // Create a Set of transaction timestamps for quick lookup
    const transactionTimestamps = new Set(
      transactions.map(t =>  new Date(t.transaction_time).toLocaleString('en-GB', { timeZone: 'Africa/Cairo' }).getTime())
    );

    // Filter out payments that have the exact same timestamp as any transaction
    const filteredPayments = payments.filter(p => {
      const paymentTimestamp = new Date(p.payment_date).toLocaleString('en-GB', { timeZone: 'Africa/Cairo' }).getTime();
      return !transactionTimestamps.has(paymentTimestamp);
    });

    // دمج الأحداث
    const events = [];

    // Add transactions
    transactions.forEach(t => {
      events.push({
        date: t.transaction_time,
        type: 'transaction',
        transaction_id: t.id,
        total_amount: parseFloat(t.total_amount),
        paid_amount: parseFloat(t.paid_amount) + parseFloat(t.old_debt_paid || 0),
        old_debt_paid: parseFloat(t.old_debt_paid || 0),
        remaining_amount: parseFloat(t.remaining_amount),
        raw_data: t
      });
    });

    // Add filtered payments only
    filteredPayments.forEach(p => {
      events.push({
        date: p.payment_date,
        type: 'payment',
        payment_id: p.id,
        amount: parseFloat(p.amount),
        raw_data: p
      });
    });

    // ترتيب من الأحدث للأقدم
    events.sort((a, b) => new Date(b.date).toLocaleString('en-GB', { timeZone: 'Africa/Cairo' }) - new Date(a.date).toLocaleString('en-GB', { timeZone: 'Africa/Cairo' }));

    // أخذ آخر N حدث فقط بعد الدمج
    const recentEvents = events.slice(0, limit);

    // حساب الدين التراكمي
    // نبدأ من الدين الحالي ونرجع للخلف
    let cumulativeDebt = parseFloat(buyer.total_debt);
    
    const history = recentEvents.map(event => {
      const debtBefore = cumulativeDebt;
      
      if (event.type === 'transaction') {
        // عند الرجوع للخلف، نطرح الدين اللي اتضاف
        const debtIncrease = event.total_amount - event.paid_amount;
        cumulativeDebt -= debtIncrease;

        return {
          date: event.date,
          type: 'transaction',
          transaction_id: event.transaction_id,
          total_amount: event.total_amount,
          paid_amount: event.paid_amount,
          old_debt_paid: event.old_debt_paid,
          remaining_amount: event.remaining_amount,
          debt_before: cumulativeDebt,
          debt_change: debtIncrease,
          debt_after: debtBefore,
          raw_data: event.raw_data
        };
      } else {
        // عند الرجوع للخلف، نضيف الدفعة (لأننا راجعين)
        const debtDecrease = event.amount;
        cumulativeDebt += debtDecrease;

        return {
          date: event.date,
          type: 'payment',
          payment_id: event.payment_id,
          amount: event.amount,
          debt_before: cumulativeDebt,
          debt_change: -debtDecrease,
          debt_after: debtBefore,
          raw_data: event.raw_data
        };
      }
    });

    // ترتيب من الأقدم للأحدث في النهاية (زي ما كان)
    history.sort((a, b) => new Date(a.date).toLocaleString('en-GB', { timeZone: 'Africa/Cairo' }) - new Date(b.date).toLocaleString('en-GB', { timeZone: 'Africa/Cairo' }));

    // حساب الـ calculated_debt من آخر سجل في الـ history
    const calculatedDebt = history.length > 0 
      ? history[history.length - 1].debt_after 
      : parseFloat(buyer.total_debt);

    res.json({
      success: true,
      data: {
        buyer,
        current_debt: parseFloat(buyer.total_debt),
        calculated_debt: calculatedDebt,
        history,
        summary: {
          total_sales: transactions.length,
          total_payments: filteredPayments.length,
          total_amount_sold: transactions.reduce((sum, t) => sum + parseFloat(t.total_amount), 0),
          total_amount_paid: transactions.reduce((sum, t) => sum + parseFloat(t.paid_amount) + parseFloat(t.old_debt_paid || 0), 0) + filteredPayments.reduce((sum, p) => sum + parseFloat(p.amount), 0)
        }
      }
    });
  } catch (error) {
    console.error('Error in getBuyerDebtHistory:', error);
    next(new AppError('خطأ في جلب سجل الديون', 500));
  }
};

exports.recordDebtPayment = async (req, res,next) => {
  const transaction = await sequelize.transaction();

  try {
    const { buyer_id, amount, payment_date, notes, daily_operation_id } = req.body;

    const buyer = await Buyer.findByPk(buyer_id);

    if (!buyer) {
      await transaction.rollback();
        next(new AppError( 'لم يتم العثور على المشتري',404));

    }

    // Record payment
    const payment = await BuyerDebtPayment.create({
      buyer_id,
      daily_operation_id: daily_operation_id || null,
      amount,
      payment_date,
      notes
    }, { transaction });

    // Update buyer's total debt
    await buyer.update({
      total_debt: parseFloat(buyer.total_debt) - parseFloat(amount)
    }, { transaction });

    await transaction.commit();

    res.status(201).json({
      success: true,
      message: 'تم تسجيل سداد الدين بنجاح',
      data: payment
    });
  } catch (error) {
    await transaction.rollback();
        next(new AppError( 'لم يتم العثور على خطأ في تسجيل سداد الديون',404));
  }
};

module.exports = exports;