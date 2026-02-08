// ========================================
// NEON POSTGRESQL DATABASE CONFIGURATION
// Using Sequelize ORM
// ========================================

const { Sequelize } = require('sequelize');
require('dotenv').config();

// ✅ TWO WAYS TO CONNECT:

// METHOD 1: Using full connection string (RECOMMENDED for Neon)
const sequelize = new Sequelize(process.env.DATABASE_URL, {
  dialect: 'postgres',
  dialectOptions: {
    ssl: {
      require: true,
      rejectUnauthorized: false // Required for Neon
    }
  },
  logging: process.env.NODE_ENV === 'development' ? console.log : false,
  pool: {
    max: 5,        // Maximum connections
    min: 0,
    acquire: 30000,
    idle: 10000
  },
  timezone: 'Africa/Cairo',
  define: {
    timestamps: true,
    underscored: false,  // Keep camelCase (matching your models)
    freezeTableName: true
  }
});

// METHOD 2: Using separate config (alternative)
/*
const sequelize = new Sequelize(
  process.env.DB_NAME || 'neondb',
  process.env.DB_USER || 'username',
  process.env.DB_PASSWORD || 'password',
  {
    host: process.env.DB_HOST || 'ep-xxx.region.aws.neon.tech',
    port: process.env.DB_PORT || 5432,
    dialect: 'postgres',
    dialectOptions: {
      ssl: {
        require: true,
        rejectUnauthorized: false
      }
    },
    logging: process.env.NODE_ENV === 'development' ? console.log : false,
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000
    },
    timezone: 'Africa/Cairo',
    define: {
      timestamps: true,
      underscored: false,
      freezeTableName: true
    }
  }
);
*/

/**
 * Test database connection
 */
const testConnection = async () => {
  try {
    await sequelize.authenticate();
    console.log('✅ Neon PostgreSQL connection established successfully');
    console.log(`📊 Database: ${sequelize.config.database}`);
    console.log(`🏠 Host: ${sequelize.config.host}`);
    return true;
  } catch (error) {
    console.error('❌ Unable to connect to Neon database:', error.message);
    console.error('\n💡 Troubleshooting:');
    console.error('   1. Check DATABASE_URL in .env file');
    console.error('   2. Verify Neon project is active (not paused)');
    console.error('   3. Check internet connection');
    console.error('   4. Ensure SSL is enabled (?sslmode=require)\n');
    return false;
  }
};

/**
 * Close database connection gracefully
 */
const closeConnection = async () => {
  try {
    await sequelize.close();
    console.log('👋 Database connection closed');
  } catch (error) {
    console.error('❌ Error closing database:', error.message);
  }
};

/**
 * Get database info
 */
const getDatabaseInfo = async () => {
  try {
    const result = await sequelize.query(
      'SELECT version() as pg_version, current_database() as db_name, current_user as user',
      { type: Sequelize.QueryTypes.SELECT }
    );
    return result[0];
  } catch (error) {
    console.error('Error fetching database info:', error);
    return null;
  }
};

// Export sequelize instance and utilities
module.exports = {
  sequelize,
  testConnection,
  closeConnection,
  getDatabaseInfo,
  Sequelize // Export Sequelize class for types
};