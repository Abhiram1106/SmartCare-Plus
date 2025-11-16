const mongoose = require('mongoose');

const roleSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
    enum: ['admin', 'doctor', 'patient', 'receptionist', 'nurse', 'lab_technician']
  },
  displayName: {
    type: String,
    required: true
  },
  permissions: [{
    resource: {
      type: String,
      required: true
      // e.g., 'appointments', 'users', 'payments', 'prescriptions', 'ehr', 'analytics'
    },
    actions: [{
      type: String,
      enum: ['create', 'read', 'update', 'delete', 'approve', 'export']
    }],
    scope: {
      type: String,
      enum: ['all', 'own', 'department', 'assigned'],
      default: 'own'
      // 'all': can access all records
      // 'own': can only access their own records
      // 'department': can access records in their department
      // 'assigned': can access records assigned to them
    }
  }],
  isActive: {
    type: Boolean,
    default: true
  },
  description: {
    type: String
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Pre-save hook to update timestamp
roleSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('Role', roleSchema);
