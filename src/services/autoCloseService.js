const { DailyOperation, sequelize } = require('../models');
const ProfitService = require('./ProfitService');
const { Op } = require('sequelize');

exports.autoCloseDailyOperations = async () => {
  const transaction = await sequelize.transaction();

  try {
    const today = new Date();

    // ✅ نجيب بس العمليات المفتوحة
    const operations = await DailyOperation.findAll({
      where: {
        operation_date: today,
        status: 'OPEN',
        closed_at: null
      },
      transaction,
      lock: transaction.LOCK.UPDATE
    });

    if (operations.length === 0) {
      await transaction.commit();
      return 0;
    }

    for (const operation of operations) {
      // ⚠️ profit service لازم تكون idempotent برده
      await ProfitService.closeOperation(operation.id, transaction);

      await operation.update({
        status: 'CLOSED',
        closed_at: new Date()
      }, { transaction });
    }

    await transaction.commit();
    return operations.length;

  } catch (error) {
    await transaction.rollback();
    throw error;
  }
};
