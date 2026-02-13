const cron = require('node-cron');
const { autoCloseDailyOperations } = require('../services/autoCloseService');

const scheduleAutoCloseDaily = () => {
  cron.schedule('50 23 * * *', async () => {
    try {
      console.log(`[${new Date()}] Running daily auto-close job...`);

      const closedCount = await autoCloseDailyOperations();

      console.log(`✅ Daily auto-close completed: ${closedCount} operations closed`);
    } catch (error) {
      console.error('❌ Error in daily auto-close job:', error);
    }
  }, {
    timezone: "Africa/Cairo"
  });

  console.log('✅ Daily auto-close scheduler started (23:50 Cairo)');
};

module.exports = { scheduleAutoCloseDaily };
