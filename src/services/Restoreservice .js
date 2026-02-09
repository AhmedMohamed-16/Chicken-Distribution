/**
 * Restore Service
 * Handles database restore operations including:
 * - Extracting ZIP files
 * - Reading JSON data
 * - Bulk inserting/updating records
 */

const fs = require('fs').promises;
const path = require('path');
const unzipper = require('unzipper');
const { sequelize } = require('../config/database');
const { models } = require('../models');
const {getCairoTimestampForFile} = require('../utils/CairoTimestampForFile');

/**
 * Extract ZIP file to temporary directory
 * @param {string} zipPath - Path to ZIP file
 * @param {string} extractPath - Directory to extract to
 * @returns {Promise<Array>} - List of extracted files
 */
const extractZipFile = async (zipPath, extractPath) => {
  return new Promise(async (resolve, reject) => {
    try {
      // Ensure extract directory exists
      await fs.mkdir(extractPath, { recursive: true });

      const extractedFiles = [];

      // Extract ZIP file
      require('fs').createReadStream(zipPath)
        .pipe(unzipper.Parse())
        .on('entry', async (entry) => {
          const fileName = entry.path;
          const filePath = path.join(extractPath, fileName);
          if (!filePath.startsWith(extractPath)) {
            entry.autodrain();
            return;
          }
          if (entry.type === 'File') {
            // Extract file
            entry.pipe(require('fs').createWriteStream(filePath));
            extractedFiles.push(fileName);
          } else {
            entry.autodrain();
          }
        })
        .on('close', () => {
          console.log(`✓ Extracted ${extractedFiles.length} files from ZIP`);
          resolve(extractedFiles);
        })
        .on('error', (error) => {
          reject(error);
        });

    } catch (error) {
      reject(error);
    }
  });
};

/**
 * Read and parse JSON file
 * @param {string} filePath - Path to JSON file
 * @returns {Object} - Parsed JSON data
 */
const readJsonFile = async (filePath) => {
  try {
    const content = await fs.readFile(filePath, 'utf8');
    return JSON.parse(content);
  } catch (error) {
    console.error(`Error reading ${filePath}:`, error.message);
    throw error;
  }
};

/**
 * Restore data to a single table
 * @param {string} modelName - Name of the model
 * @param {Array} records - Array of records to restore
 * @param {string} strategy - Restore strategy ('replace' or 'append')
 * @returns {Object} - Restore statistics
 */
const restoreTableData = async (modelName, records, strategy = 'replace') => {
  try {
    const Model = models[modelName];
    if (!Model) {
      console.warn(`Model ${modelName} not found, skipping...`);
      return { skipped: true, reason: 'Model not found' };
    }

    const startTime =  Date.now();
    let inserted = 0;
    let updated = 0;
    let errors = 0;

    console.log(`\n  Processing ${modelName}...`);

    // Start transaction for data integrity
    const transaction = await sequelize.transaction();

    try {
      // If strategy is 'replace', clear existing data
      if (strategy === 'replace') {
        const deletedCount = await Model.destroy({
          where: {},
          truncate: true,
          cascade: true,
          transaction
        });
        console.log(`    Cleared ${deletedCount} existing records`);
      }

      // Bulk insert records in batches
      const BATCH_SIZE = 1000;
      
      for (let i = 0; i < records.length; i += BATCH_SIZE) {
        const batch = records.slice(i, i + BATCH_SIZE);
        
        try {
          if (strategy === 'replace') {
            // Skip empty batches
            if (!batch || batch.length === 0) {
              console.warn(`    Skipping empty batch`);
              continue;
            }

            // Direct bulk insert for replace strategy
            await Model.bulkCreate(batch, {
              transaction,
              validate: true,
              ignoreDuplicates: false,
              updateOnDuplicate: Object.keys(batch[0] || {}).filter(key => key !== 'id')
            });
            inserted += batch.length;
          } else {
            // Upsert for append strategy
            for (const record of batch) {
              try {
                const [instance, created] = await Model.upsert(record, {
                  transaction
                });
                if (created) {
                  inserted++;
                } else {
                  updated++;
                }
              } catch (error) {
                errors++;
                console.error(`      Error upserting record ID ${record.id}:`, error.message);
              }
            }
          }

          console.log(`    Progress: ${Math.min(i + BATCH_SIZE, records.length)}/${records.length}`);
        } catch (error) {
          errors += batch.length;
          
          // Special handling for column mismatch errors
          if (error.message && error.message.includes('column')) {
            console.error(`    ⚠ Column mismatch error in ${modelName}:`, error.message);
            console.error(`    Available columns in model:`, Object.keys(Model.rawAttributes).join(', '));
            console.error(`    Columns in backup data:`, Object.keys(batch[0] || {}).join(', '));
            
            // Try to map only matching columns
            try {
              const modelColumns = Object.keys(Model.rawAttributes);
              const cleanedBatch = batch.map(record => {
                const cleaned = {};
                modelColumns.forEach(col => {
                  if (record[col] !== undefined) {
                    cleaned[col] = record[col];
                  }
                });
                return cleaned;
              });
              
              await Model.bulkCreate(cleanedBatch, {
                transaction,
                validate: false, // Skip validation for partial data
                ignoreDuplicates: false
              });
              
              inserted += cleanedBatch.length;
              errors -= batch.length; // Correct the error count
              console.log(`    ✓ Recovered: Inserted ${cleanedBatch.length} records with column mapping`);
            } catch (recoveryError) {
              console.error(`    Recovery attempt failed:`, recoveryError.message);
            }
          } else {
            console.error(`    Batch insert failed:`, error.message);
          }
          
          // Log first few characters of problematic data for debugging
          if (process.env.NODE_ENV === 'development') {
            console.error(`    First record sample:`, JSON.stringify(batch[0]).substring(0, 200));
          }
        }
      }

      // Reset sequence for tables with auto-increment IDs
      if (strategy === 'replace' && records.length > 0) {
        try {
          const maxId = Math.max(...records.map(r => r.id || 0));
          if (maxId > 0) {
            await sequelize.query(
              `SELECT setval(pg_get_serial_sequence('${Model.tableName}', 'id'), ${maxId}, true)`,
              { transaction }
            );
          }
        } catch (error) {
          // Sequence reset is not critical, just log
          console.warn(`    Could not reset sequence: ${error.message}`);
        }
      }

      // Commit transaction
      await transaction.commit();

      const duration = (( Date.now() - startTime ) / 1000).toFixed(2);
      
      console.log(`    ✓ ${modelName}: ${inserted} inserted, ${updated} updated, ${errors} errors (${duration}s)`);

      return {
        success: true,
        modelName,
        inserted,
        updated,
        errors,
        duration
      };

    } catch (error) {
      // Rollback on error
      await transaction.rollback();
      throw error;
    }

  } catch (error) {
    console.error(`  ✗ Error restoring ${modelName}:`, error.message);
    return {
      success: false,
      modelName,
      error: error.message
    };
  }
};

/**
 * Restore all tables from extracted JSON files
 * @param {string} extractPath - Directory containing extracted JSON files
 * @param {string} strategy - Restore strategy ('replace' or 'append')
 * @returns {Object} - Restore statistics
 */
const restoreAllTables = async (extractPath, strategy = 'replace') => {
  const results = [];
  let totalInserted = 0;
  let totalUpdated = 0;
  let totalErrors = 0;

  try {
    const files = await fs.readdir(extractPath);
    const jsonFiles = files.filter(f => f.endsWith('.json') && f !== 'metadata.json');

    console.log(`\nRestoring ${jsonFiles.length} tables...`);

    // Define restore order (to handle foreign key constraints)
    // CRITICAL: Parent tables MUST be restored before child tables
    const restoreOrder = [
      // Level 1: Independent tables (no foreign keys)
      'users.json',
      'partners.json',
      'chicken_types.json',
      'cost_categories.json',
      'farms.json',
      'buyers.json',
      'vehicles.json',
      'permissions.json',
      
      // Level 2: Tables with foreign keys to Level 1
      'vehicle_partners.json',
      'daily_operations.json',
      
      // Level 3: Tables with foreign keys to Level 2
      'vehicle_operations.json',
      'profit_distributions.json',
      
      // Level 4: Tables with foreign keys to Level 3
      'farm_transactions.json',
      'sale_transactions.json',
      'transport_losses.json',
      'daily_costs.json',
      'farm_debt_payments.json',
      'buyer_debt_payments.json',
      'partner_profits.json'
    ];

    // Restore in order, then restore remaining files
    const orderedFiles = [
      ...restoreOrder.filter(f => jsonFiles.includes(f)),
      ...jsonFiles.filter(f => !restoreOrder.includes(f))
    ];

    // Disable foreign key checks for PostgreSQL (if strategy is replace)
    if (strategy === 'replace') {
      try {
        await sequelize.query('SET session_replication_role = replica;');
        console.log('  ✓ Foreign key constraints temporarily disabled');
      } catch (error) {
        console.warn('  ⚠ Could not disable foreign key constraints:', error.message);
      }
    }

    for (const jsonFile of orderedFiles) {
      const filePath = path.join(extractPath, jsonFile);
      
      try {
        const tableData = await readJsonFile(filePath);
        
        if (!tableData.data || !Array.isArray(tableData.data)) {
          console.warn(`Invalid data format in ${jsonFile}, skipping...`);
          continue;
        }

        // Skip if no data
        if (tableData.data.length === 0) {
          console.log(`\n  Skipping ${tableData.modelName} (no data)`);
          continue;
        }

        const result = await restoreTableData(
          tableData.modelName,
          tableData.data,
          strategy
        );

        results.push(result);
        
        if (result.success) {
          totalInserted += result.inserted || 0;
          totalUpdated += result.updated || 0;
          totalErrors += result.errors || 0;
        }

      } catch (error) {
        console.error(`Failed to process ${jsonFile}:`, error.message);
        results.push({
          success: false,
          file: jsonFile,
          error: error.message
        });
      }
    }

    // Re-enable foreign key checks
    if (strategy === 'replace') {
      try {
        await sequelize.query('SET session_replication_role = DEFAULT;');
        console.log('\n  ✓ Foreign key constraints re-enabled');
      } catch (error) {
        console.warn('  ⚠ Could not re-enable foreign key constraints:', error.message);
      }
    }

    return {
      totalInserted,
      totalUpdated,
      totalErrors,
      tablesProcessed: results.length,
      results
    };

  } catch (error) {
    // Ensure foreign keys are re-enabled even on error
    try {
      await sequelize.query('SET session_replication_role = DEFAULT;');
    } catch (e) {
      // Ignore
    }
    
    console.error('Error restoring tables:', error.message);
    throw error;
  }
};

/**
 * Clean up temporary extraction directory
 * @param {string} extractPath - Directory to clean
 */
const cleanupExtractDir = async (extractPath) => {
  try {
    await fs.rm(extractPath, { recursive: true, force: true });
    console.log('✓ Cleaned up extraction directory');
  } catch (error) {
    console.error('Warning: Could not clean extraction directory:', error.message);
  }
};

/**
 * Main restore function
 * Restores database from a backup ZIP file
 * @param {string} zipPath - Path to backup ZIP file
 * @param {string} strategy - Restore strategy ('replace' or 'append')
 * @returns {Object} - Restore result with statistics
 */
const restoreBackup = async (zipPath, strategy = 'replace') => {
  const startTime = Date.now();
  let extractPath = null;

  try {
    console.log('\n========================================');
    console.log('Starting Database Restore Process');
    console.log(`Strategy: ${strategy.toUpperCase()}`);
    console.log('========================================');

    // Create temporary extraction directory
    extractPath = path.join(
      path.dirname(zipPath),
      `extract_${Date.now()}`
    );

    // Extract ZIP file
    console.log('\nExtracting backup file...');
    await extractZipFile(zipPath, extractPath);

    // Read metadata
    const metadataPath = path.join(extractPath, 'metadata.json');
    let metadata = null;
    try {
      metadata = await readJsonFile(metadataPath);
      console.log(`\nBackup Info:`);
      console.log(`  Date: ${metadata.backupDate}`);
      console.log(`  Database: ${metadata.databaseName}`);
      console.log(`  Tables: ${metadata.tableCount}`);
    } catch (error) {
      console.warn('Could not read metadata, continuing...');
    }

    // Restore all tables
    const restoreResults = await restoreAllTables(extractPath, strategy);

    // Clean up extraction directory
    await cleanupExtractDir(extractPath);

    const duration = (( Date.now() - startTime ) / 1000).toFixed(2);

    console.log('\n========================================');
    console.log('Restore Completed Successfully');
    console.log(`Duration: ${duration}s`);
    console.log(`Inserted: ${restoreResults.totalInserted}`);
    console.log(`Updated: ${restoreResults.totalUpdated}`);
    console.log(`Errors: ${restoreResults.totalErrors}`);
    console.log('========================================\n');

    return {
      success: true,
      strategy,
      duration,
      ...restoreResults,
      metadata
    };

  } catch (error) {
    console.error('\n✗ Restore failed:', error.message);
    console.error(error.stack);

    // Clean up on failure
    if (extractPath) {
      await cleanupExtractDir(extractPath);
    }

    throw error;
  }
};

/**
 * Validate backup file
 * @param {string} zipPath - Path to ZIP file
 * @returns {Object} - Validation result
 */
const validateBackupFile = async (zipPath) => {
  try {
    // Check if file exists
    await fs.access(zipPath);

    // Check file size
    const stats = await fs.stat(zipPath);
    if (stats.size === 0) {
      return { valid: false, error: 'Backup file is empty' };
    }

    // Try to extract metadata only
    const extractPath = path.join(
      path.dirname(zipPath),
      `validate_${getCairoTimestampForFile()}`
    );

    try {
      await extractZipFile(zipPath, extractPath);
      const metadataPath = path.join(extractPath, 'metadata.json');
      const metadata = await readJsonFile(metadataPath);
      
      await cleanupExtractDir(extractPath);

      return {
        valid: true,
        metadata,
        fileSize: stats.size
      };
    } catch (error) {
      await cleanupExtractDir(extractPath);
      return {
        valid: false,
        error: 'Invalid backup file format'
      };
    }

  } catch (error) {
    return {
      valid: false,
      error: error.message
    };
  }
};

module.exports = {
  restoreBackup,
  validateBackupFile
};