/**
 * Backup Controller
 * Handles HTTP requests for backup operations
 */

const path = require('path');
const fs = require('fs').promises;
const { createBackup, listBackups, BACKUP_DIR } = require('../services/Backupservice');
const { restoreBackup, validateBackupFile } = require('../services/Restoreservice ');

/**
 * Create a new backup
 * POST /api/backup
 */
const createBackupController = async (req, res) => {
  try {
    // Get user ID from request (authentication should set this)
    const userId = req.user?.id || 1; // Default to system user if not authenticated

    console.log(`Backup requested by user ${userId}`);

    // Create backup
    const result = await createBackup(userId);

    res.status(200).json({
      success: true,
      message: 'Backup created successfully',
      data: {
        backupId: result.backupId,
        filename: result.filename,
        fileSize: result.fileSize,
        fileSizeMB: (result.fileSize / 1024 / 1024).toFixed(2),
        tableCount: result.tableCount,
        tables: result.tables,
        duration: result.duration,
        downloadUrl: `/api/backup/download/${result.filename}`
      }
    });

  } catch (error) {
    console.error('Backup controller error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create backup',
      error: error.message
    });
  }
};

/**
 * Download a backup file
 * GET /api/backup/download/:filename
 */
const downloadBackupController = async (req, res) => {
  try {
    const { filename } = req.params;

    // Validate filename (security check - prevent path traversal)
    if (filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
      return res.status(400).json({
        success: false,
        message: 'Invalid filename'
      });
    }

    const filePath = path.join(BACKUP_DIR, filename);

    // Check if file exists
    try {
      await fs.access(filePath);
    } catch {
      return res.status(404).json({
        success: false,
        message: 'Backup file not found'
      });
    }

    // Get file stats
    const stats = await fs.stat(filePath);

    // Set headers for download
    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Length', stats.size);

    // Stream file to response
    const fileStream = require('fs').createReadStream(filePath);
    fileStream.pipe(res);

    fileStream.on('error', (error) => {
      console.error('File stream error:', error);
      if (!res.headersSent) {
        res.status(500).json({
          success: false,
          message: 'Error streaming file'
        });
      }
    });

    console.log(`Backup file downloaded: ${filename}`);

  } catch (error) {
    console.error('Download controller error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to download backup',
      error: error.message
    });
  }
};

/**
 * Restore database from uploaded backup file
 * POST /api/backup/restore
 */
const restoreBackupController = async (req, res) => {
  let uploadedFilePath = null;

  try {
    // Check if file was uploaded
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No backup file uploaded'
      });
    }

    uploadedFilePath = req.file.path;
    const strategy = req.body.strategy || 'replace'; // 'replace' or 'append'

    // Validate strategy
    if (!['replace', 'append'].includes(strategy)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid restore strategy. Use "replace" or "append"'
      });
    }

    console.log(`Restore requested with strategy: ${strategy}`);
    console.log(`File: ${req.file.originalname} (${req.file.size} bytes)`);

    // Validate backup file
    const validation = await validateBackupFile(uploadedFilePath);
    if (!validation.valid) {
      // Clean up uploaded file
      await fs.unlink(uploadedFilePath);
      
      return res.status(400).json({
        success: false,
        message: 'Invalid backup file',
        error: validation.error
      });
    }

    // Perform restore
    const result = await restoreBackup(uploadedFilePath, strategy);

    // Clean up uploaded file after restore
    try {
      await fs.unlink(uploadedFilePath);
    } catch (error) {
      console.warn('Could not delete uploaded file:', error.message);
    }

    res.status(200).json({
      success: true,
      message: 'Database restored successfully',
      data: {
        strategy: result.strategy,
        duration: result.duration,
        tablesProcessed: result.tablesProcessed,
        totalInserted: result.totalInserted,
        totalUpdated: result.totalUpdated,
        totalErrors: result.totalErrors,
        metadata: result.metadata
      }
    });

  } catch (error) {
    console.error('Restore controller error:', error);

    // Clean up uploaded file on error
    if (uploadedFilePath) {
      try {
        await fs.unlink(uploadedFilePath);
      } catch (cleanupError) {
        console.warn('Could not delete uploaded file:', cleanupError.message);
      }
    }

    res.status(500).json({
      success: false,
      message: 'Failed to restore backup',
      error: error.message
    });
  }
};

/**
 * List all available backups
 * GET /api/backup/list
 */
const listBackupsController = async (req, res) => {
  try {
    const backups = await listBackups();

    res.status(200).json({
      success: true,
      count: backups.length,
      data: backups.map(backup => ({
        id: backup.id,
        filename: backup.backup_name,
        date: backup.backup_date,
        fileSize: backup.file_size,
        fileSizeMB: backup.file_size ? (backup.file_size / 1024 / 1024).toFixed(2) : null,
        status: backup.status,
        downloadUrl: `/api/backup/download/${backup.backup_name}`
      }))
    });

  } catch (error) {
    console.error('List backups controller error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to list backups',
      error: error.message
    });
  }
};

module.exports = {
  createBackupController,
  downloadBackupController,
  restoreBackupController,
  listBackupsController
};