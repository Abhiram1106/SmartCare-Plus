const express = require('express');
const router = express.Router();
const AuditLog = require('../models/AuditLog');
const Role = require('../models/Role');
const User = require('../models/User');
const { auth, authorize } = require('../middleware/auth');
const crypto = require('crypto');

// Audit logging middleware helper
const logAudit = async (userId, action, resource, resourceId, details, req, status = 'success', error = null) => {
  try {
    await AuditLog.create({
      user: userId,
      action,
      resource,
      resourceId,
      details,
      ipAddress: req.ip || req.connection.remoteAddress,
      userAgent: req.get('user-agent'),
      status,
      errorMessage: error
    });
  } catch (err) {
    console.error('Failed to create audit log:', err);
  }
};

// @route   GET /api/security/audit-logs
// @desc    Get audit logs with filtering
// @access  Private (Admin only)
router.get('/audit-logs', auth, authorize('admin'), async (req, res) => {
  try {
    const { userId, action, resource, startDate, endDate, status, limit = 100 } = req.query;

    const query = {};
    if (userId) query.user = userId;
    if (action) query.action = action;
    if (resource) query.resource = resource;
    if (status) query.status = status;
    
    if (startDate || endDate) {
      query.timestamp = {};
      if (startDate) query.timestamp.$gte = new Date(startDate);
      if (endDate) query.timestamp.$lte = new Date(endDate);
    }

    const logs = await AuditLog.find(query)
      .populate('user', 'name email role')
      .sort({ timestamp: -1 })
      .limit(parseInt(limit));

    res.json({
      success: true,
      count: logs.length,
      data: logs
    });

    // Log this audit query
    await logAudit(req.user.id, 'read', 'audit_logs', null, { query }, req);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   GET /api/security/audit-logs/user/:userId
// @desc    Get audit logs for specific user
// @access  Private (Admin or self)
router.get('/audit-logs/user/:userId', auth, async (req, res) => {
  try {
    const { userId } = req.params;

    // Users can view their own logs, admins can view any
    if (req.user.id !== userId && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const logs = await AuditLog.find({ user: userId })
      .sort({ timestamp: -1 })
      .limit(100);

    res.json({
      success: true,
      count: logs.length,
      data: logs
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   GET /api/security/audit-stats
// @desc    Get audit statistics
// @access  Private (Admin)
router.get('/audit-stats', auth, authorize('admin'), async (req, res) => {
  try {
    const { days = 30 } = req.query;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(days));

    const logs = await AuditLog.find({ timestamp: { $gte: startDate } });

    // Aggregate statistics
    const actionCounts = {};
    const resourceCounts = {};
    const userActivity = {};
    const failedActions = logs.filter(l => l.status === 'failure');

    logs.forEach(log => {
      actionCounts[log.action] = (actionCounts[log.action] || 0) + 1;
      resourceCounts[log.resource] = (resourceCounts[log.resource] || 0) + 1;
      userActivity[log.user] = (userActivity[log.user] || 0) + 1;
    });

    res.json({
      success: true,
      data: {
        period: `Last ${days} days`,
        totalActions: logs.length,
        failedActions: failedActions.length,
        successRate: (((logs.length - failedActions.length) / logs.length) * 100).toFixed(2),
        actionBreakdown: actionCounts,
        resourceBreakdown: resourceCounts,
        mostActiveUsers: Object.entries(userActivity)
          .map(([userId, count]) => ({ userId, actionCount: count }))
          .sort((a, b) => b.actionCount - a.actionCount)
          .slice(0, 10)
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   POST /api/security/roles
// @desc    Create new role
// @access  Private (Admin)
router.post('/roles', auth, authorize('admin'), async (req, res) => {
  try {
    const { name, displayName, permissions, description } = req.body;

    if (!name || !displayName || !permissions) {
      return res.status(400).json({ message: 'Name, display name, and permissions are required' });
    }

    const role = await Role.create({
      name,
      displayName,
      permissions,
      description
    });

    await logAudit(req.user.id, 'create', 'role', role._id, { roleName: name }, req);

    res.status(201).json({
      success: true,
      message: 'Role created successfully',
      data: role
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ message: 'Role already exists' });
    }
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   GET /api/security/roles
// @desc    Get all roles
// @access  Private (Admin)
router.get('/roles', auth, authorize('admin'), async (req, res) => {
  try {
    const roles = await Role.find({});

    res.json({
      success: true,
      count: roles.length,
      data: roles
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   PUT /api/security/roles/:roleId
// @desc    Update role permissions
// @access  Private (Admin)
router.put('/roles/:roleId', auth, authorize('admin'), async (req, res) => {
  try {
    const { permissions, displayName, description, isActive } = req.body;

    const role = await Role.findByIdAndUpdate(
      req.params.roleId,
      { permissions, displayName, description, isActive },
      { new: true, runValidators: true }
    );

    if (!role) {
      return res.status(404).json({ message: 'Role not found' });
    }

    await logAudit(req.user.id, 'update', 'role', role._id, { roleName: role.name }, req);

    res.json({
      success: true,
      message: 'Role updated successfully',
      data: role
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   POST /api/security/check-permission
// @desc    Check if user has specific permission
// @access  Private
router.post('/check-permission', auth, async (req, res) => {
  try {
    const { resource, action } = req.body;

    if (!resource || !action) {
      return res.status(400).json({ message: 'Resource and action are required' });
    }

    const role = await Role.findOne({ name: req.user.role });
    
    if (!role) {
      return res.json({
        success: true,
        hasPermission: false,
        message: 'Role not found'
      });
    }

    const permission = role.permissions.find(p => p.resource === resource);
    const hasPermission = permission && permission.actions.includes(action);

    res.json({
      success: true,
      hasPermission,
      scope: permission ? permission.scope : null
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   POST /api/security/encrypt-data
// @desc    Encrypt sensitive data
// @access  Private (Admin/Doctor for medical data)
router.post('/encrypt-data', auth, authorize('admin', 'doctor'), async (req, res) => {
  try {
    const { data } = req.body;

    if (!data) {
      return res.status(400).json({ message: 'Data to encrypt is required' });
    }

    // Use AES-256-CBC encryption
    const algorithm = 'aes-256-cbc';
    const key = crypto.scryptSync(process.env.JWT_SECRET || 'secret', 'salt', 32);
    const iv = crypto.randomBytes(16);

    const cipher = crypto.createCipheriv(algorithm, key, iv);
    let encrypted = cipher.update(JSON.stringify(data), 'utf8', 'hex');
    encrypted += cipher.final('hex');

    await logAudit(req.user.id, 'create', 'encryption', null, { dataType: typeof data }, req);

    res.json({
      success: true,
      encrypted,
      iv: iv.toString('hex'),
      note: 'Store IV separately to decrypt later'
    });
  } catch (error) {
    res.status(500).json({ message: 'Encryption error', error: error.message });
  }
});

// @route   POST /api/security/decrypt-data
// @desc    Decrypt sensitive data
// @access  Private (Admin/Doctor for medical data)
router.post('/decrypt-data', auth, authorize('admin', 'doctor'), async (req, res) => {
  try {
    const { encrypted, iv } = req.body;

    if (!encrypted || !iv) {
      return res.status(400).json({ message: 'Encrypted data and IV are required' });
    }

    const algorithm = 'aes-256-cbc';
    const key = crypto.scryptSync(process.env.JWT_SECRET || 'secret', 'salt', 32);
    const ivBuffer = Buffer.from(iv, 'hex');

    const decipher = crypto.createDecipheriv(algorithm, key, ivBuffer);
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    await logAudit(req.user.id, 'read', 'decryption', null, {}, req);

    res.json({
      success: true,
      decrypted: JSON.parse(decrypted)
    });
  } catch (error) {
    res.status(500).json({ message: 'Decryption error', error: error.message });
  }
});

// @route   GET /api/security/suspicious-activity
// @desc    Detect suspicious activity patterns
// @access  Private (Admin)
router.get('/suspicious-activity', auth, authorize('admin'), async (req, res) => {
  try {
    const { days = 7 } = req.query;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(days));

    const logs = await AuditLog.find({ timestamp: { $gte: startDate } })
      .populate('user', 'name email role');

    // Detect patterns
    const suspiciousPatterns = [];

    // 1. Multiple failed login attempts
    const failedLogins = logs.filter(l => l.action === 'login' && l.status === 'failure');
    const failedByUser = {};
    failedLogins.forEach(log => {
      const userId = log.user ? log.user._id.toString() : 'unknown';
      failedByUser[userId] = (failedByUser[userId] || 0) + 1;
    });

    Object.entries(failedByUser).forEach(([userId, count]) => {
      if (count > 5) {
        suspiciousPatterns.push({
          type: 'Multiple Failed Logins',
          severity: 'high',
          userId,
          count,
          recommendation: 'Consider locking account or requiring password reset'
        });
      }
    });

    // 2. Unusual access times (late night/early morning)
    const unusualTimeAccess = logs.filter(log => {
      const hour = new Date(log.timestamp).getHours();
      return hour < 6 || hour > 22;
    });

    if (unusualTimeAccess.length > 10) {
      suspiciousPatterns.push({
        type: 'Unusual Access Times',
        severity: 'medium',
        count: unusualTimeAccess.length,
        recommendation: 'Review access logs for unauthorized activity'
      });
    }

    // 3. Rapid data access (potential data scraping)
    const userActionCounts = {};
    logs.forEach(log => {
      if (log.user) {
        const userId = log.user._id.toString();
        userActionCounts[userId] = (userActionCounts[userId] || 0) + 1;
      }
    });

    Object.entries(userActionCounts).forEach(([userId, count]) => {
      const actionsPerDay = count / parseInt(days);
      if (actionsPerDay > 500) {
        suspiciousPatterns.push({
          type: 'Excessive API Usage',
          severity: 'high',
          userId,
          actionsPerDay: Math.round(actionsPerDay),
          recommendation: 'Investigate potential data scraping or bot activity'
        });
      }
    });

    res.json({
      success: true,
      data: {
        period: `Last ${days} days`,
        totalAuditRecords: logs.length,
        suspiciousPatterns,
        alertLevel: suspiciousPatterns.some(p => p.severity === 'high') ? 'HIGH' : 
                    suspiciousPatterns.some(p => p.severity === 'medium') ? 'MEDIUM' : 'LOW'
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Export router
module.exports = router;
