// ========================================
// DATABASE MIGRATION SCRIPT - IMPROVED
// Handles foreign key constraints properly
// ========================================

const { sequelize, testConnection, getDatabaseInfo } = require('./config/database');
require('dotenv').config();

const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

async function migrate() {
  try {
    log('\n' + '='.repeat(60), 'bright');
    log('  🐔 CHICKEN DISTRIBUTION SYSTEM - DATABASE MIGRATION', 'bright');
    log('='.repeat(60) + '\n', 'bright');

    // Step 1: Test connection
    log('📡 Step 1: Testing database connection...', 'blue');
    const connected = await testConnection();
    
    if (!connected) {
      log('\n❌ Migration aborted: Could not connect to database\n', 'red');
      process.exit(1);
    }

    // Get database info
    const dbInfo = await getDatabaseInfo();
    if (dbInfo) {
      log(`   PostgreSQL: ${dbInfo.pg_version.split(',')[0]}`, 'yellow');
      log(`   Database: ${dbInfo.db_name}`, 'yellow');
      log(`   User: ${dbInfo.user}`, 'yellow');
    }

    // Step 2: Import all models
    log('\n📦 Step 2: Loading models...', 'blue');
    const { syncModels } = require('./models');
    log('   ✅ All models and associations loaded', 'green');

    // Step 3: Sync database
    log('\n🔄 Step 3: Creating/updating database tables...', 'blue');
    log('   Using correct order for foreign key constraints...', 'yellow');
    
    // Check for force flag
    const forceMode = process.argv.includes('--force');
    
    if (forceMode) {
      log('   ⚠️  FORCE MODE: Dropping all tables!', 'red');
    }
    
    const syncOptions = {
      alter: !forceMode,  // Update tables to match models (unless force)
      force: forceMode    // Drop and recreate if --force flag
    };

    // Use custom sync function that respects dependency order
    await syncModels(syncOptions);
    
    log('\n   ✅ Database sync completed!', 'green');

    // Step 4: List created tables
    log('\n📊 Step 4: Verifying tables...', 'blue');
    
    const tables = await sequelize.query(
      `SELECT table_name 
       FROM information_schema.tables 
       WHERE table_schema = 'public' 
       AND table_type = 'BASE TABLE'
       ORDER BY table_name`,
      { type: sequelize.QueryTypes.SELECT }
    );

    log(`   Found ${tables.length} tables:`, 'yellow');
    
    // Group tables by category
    const masterTables = tables.filter(t => 
      ['users', 'partners', 'vehicles', 'farms', 'buyers', 'chicken_types', 'cost_categories', 'permissions']
        .includes(t.table_name)
    );
    
    const operationTables = tables.filter(t => 
      ['daily_operations', 'vehicle_operations', 'farm_transactions', 'sale_transactions', 
       'transport_losses', 'daily_costs']
        .includes(t.table_name)
    );
    
    const finTables = tables.filter(t => 
      ['profit_distributions', 'partner_profits', 'farm_debt_payments', 'buyer_debt_payments']
        .includes(t.table_name)
    );
    
    const junctionTables = tables.filter(t => 
      ['vehicle_partners', 'user_permissions']
        .includes(t.table_name)
    );

    if (masterTables.length > 0) {
      log('\n   📋 Master Data Tables:', 'blue');
      masterTables.forEach(t => log(`      - ${t.table_name}`, 'yellow'));
    }
    
    if (operationTables.length > 0) {
      log('\n   🔄 Operation Tables:', 'blue');
      operationTables.forEach(t => log(`      - ${t.table_name}`, 'yellow'));
    }
    
    if (finTables.length > 0) {
      log('\n   💰 Financial Tables:', 'blue');
      finTables.forEach(t => log(`      - ${t.table_name}`, 'yellow'));
    }
    
    if (junctionTables.length > 0) {
      log('\n   🔗 Junction Tables:', 'blue');
      junctionTables.forEach(t => log(`      - ${t.table_name}`, 'yellow'));
    }

    // Success message
    log('\n' + '='.repeat(60), 'bright');
    log('  ✅ MIGRATION COMPLETED SUCCESSFULLY!', 'green');
    log('='.repeat(60), 'bright');
    log('\n📝 Next steps:', 'blue');
    log('   1. Run: node seed.js (to add sample data)', 'yellow');
    log('   2. Or start your backend: npm run dev\n', 'yellow');

    await sequelize.close();
    process.exit(0);

  } catch (error) {
    log('\n❌ Migration failed:', 'red');
    log(`   ${error.message}\n`, 'red');
    
    if (error.name === 'SequelizeDatabaseError') {
      log('💡 Database error details:', 'yellow');
      log(`   ${error.parent?.message || error.message}`, 'yellow');
      
      if (error.message.includes('foreign key')) {
        log('\n💡 Foreign key error detected!', 'yellow');
        log('   This usually means tables are being created in wrong order.', 'yellow');
        log('   Try running: node migrate.js --force', 'yellow');
        log('   This will drop all tables and recreate them in correct order.\n', 'yellow');
      }
    }
    
    if (error.stack && process.argv.includes('--verbose')) {
      log('\n📋 Stack trace:', 'yellow');
      console.error(error.stack);
    }
    
    await sequelize.close();
    process.exit(1);
  }
}

// Handle script arguments
const args = process.argv.slice(2);

if (args.includes('--help') || args.includes('-h')) {
  log('\n🐔 Database Migration Tool', 'bright');
  log('\nUsage:', 'blue');
  log('  node migrate.js            Run migration (alter mode - safe)', 'yellow');
  log('  node migrate.js --force    Drop and recreate all tables (DANGER!)', 'yellow');
  log('  node migrate.js --verbose  Show detailed error traces', 'yellow');
  log('  node migrate.js --help     Show this help\n', 'yellow');
  log('\nℹ️  Notes:', 'blue');
  log('  - Alter mode: Updates existing tables without data loss', 'yellow');
  log('  - Force mode: Deletes ALL data and recreates tables', 'yellow');
  log('  - Tables are created in correct order to respect foreign keys\n', 'yellow');
  process.exit(0);
}

if (args.includes('--force')) {
  log('\n⚠️  WARNING: FORCE MODE ENABLED', 'red');
  log('   This will DELETE ALL DATA and recreate tables!', 'red');
  log('   Press Ctrl+C within 5 seconds to cancel...\n', 'yellow');
  
  setTimeout(() => {
    migrate();
  }, 5000);
} else {
  migrate();
}