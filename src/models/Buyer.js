const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');
const Buyer = sequelize.define('Buyer', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  name: {
    type: DataTypes.STRING(100),
    allowNull: false
  },
  phone: {
    type: DataTypes.STRING(20),
    allowNull: true
  },
  address: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  total_debt: {
    type: DataTypes.DECIMAL(12, 2),
    defaultValue: 0
  }
}, {
  tableName: 'buyers',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: false
});

 
/**
 * Update buyer debt and return change info
 * @param {number} debtChange - Debt change (positive = increase debt, negative = decrease)
 * @param {object} transaction - Sequelize transaction
 * @returns {Promise<object>}
 */
Buyer.prototype.updateDebt = async function(debtChange, transaction = null) {
  const previousDebt = parseFloat(this.total_debt) || 0;
  const newDebt = previousDebt + debtChange;
  
  await this.update({
    total_debt: Math.max(0, newDebt)  // Prevent negative debt
  }, { transaction });
  
  return {
    buyer_id: this.id,
    buyer_name: this.name,
    previous_debt: previousDebt,
    new_debt: Math.max(0, newDebt),
    change_amount: debtChange,
    display: `${Math.abs(debtChange).toFixed(2)} EGP ${debtChange > 0 ? 'added to' : 'paid from'} debt`
  };
};

/**
 * Class Methods
 */

/**
 * Get buyers with outstanding debts
 * @returns {Promise<Array>}
 */
Buyer.getBuyersWithDebt = async function() {
  return await this.findAll({
    where: {
      total_debt: {
        [sequelize.Sequelize.Op.gt]: 0
      }
    },
    order: [['total_debt', 'DESC']]
  });
};

/**
 * Get total receivables summary
 * @returns {Promise<object>}
 */
Buyer.getReceivablesSummary = async function() {
  const result = await this.findAll({
    attributes: [
      [sequelize.fn('SUM', sequelize.col('total_debt')), 'total_receivables'],
      [sequelize.fn('COUNT', 
        sequelize.literal('CASE WHEN total_debt > 0 THEN 1 END')
      ), 'buyers_with_debt']
    ],
    raw: true
  });
  
  const data = result[0];
  return {
    total_receivables: parseFloat(data.total_receivables) || 0,
    buyers_with_debt: parseInt(data.buyers_with_debt) || 0
  };
};
module.exports = Buyer;