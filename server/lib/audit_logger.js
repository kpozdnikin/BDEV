const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const auditLogSchema = new Schema({
    category: {
        type: String,
        enum: [
            'financial_transaction',
            'system',
            'user_event',
            'error'],
        required: true },
    timestamp: {
        type: Date,
        default: Date.now },
    event: {
        type: String,
        enum: [
            'user_sign_up',
            'password_reset_triggered',
            'manual_check_triggered',
            'forgot_password_email_sent',
            'forgot_password_no_email',
            'email_verified',
            'kyc_initiated',
            'kyc_updated',
            'kyc_approved',
            'kyc_failed',
            'kyc_consented',
            'kyc_created_applicant',
            'kyc_pending',
            'consent_location_ban',
            'usd_estimate'],
        required: true },
    description: String,
    user: {
        username: String,
        user_id: String
    },
    is_dashboard_entry: Boolean,
    related_objects: {},
    reviewed_documents: {
      signature: String,
      title: String,
      url: String
    },
    signature: String,
    usd_estimate: {
      type: Number,
      validate: function(usd_estimate) {
        return /^[0-9\.]+$/.test(usd_estimate);
      }
    },
    certified_investor: String
});

auditLogSchema.index({ timestamp: 1, event: 1});

auditLogSchema.pre('save', function(next) {
    const log = this;
    console.log('audit_log: ', log);

    next();
});

const AuditLog = mongoose.model('AuditLog', auditLogSchema);

const AuditLogger = {};

global.AuditLogger = AuditLogger;

AuditLogger.userDidSignUp = function(user) {
    const log = AuditLog({
        category: 'user_event',
        event: 'user_sign_up',
        description: 'User has signed up',
        user: {
            username: user.username,
            user_id: user._id
        },
        is_dashboard_entry: true
    });

    saveAndValidate(log);
};

AuditLogger.userEmailVerified = function(user) {
  const log = AuditLog({
    category: 'user_event',
    event: 'email_verified',
    description: 'User email ' + user.email + ' has been verified.',
    user: {
      username: user.username,
      user_id: user.id
    },
    is_dashboard_entry: true
  });

  saveAndValidate(log);
};

AuditLogger.forgotPasswordEmailDidNotExist = function(email) {
  const log = AuditLog({
    category: 'user_event',
    event: 'forgot_password_no_email',
    description: 'User forgot password - the email ' + email + ' does not exist',
    is_dashboard_entry: false
  });

  saveAndValidate(log);
};

AuditLogger.forgotPasswordEmailSent = function(email) {
  const log = AuditLog({
    category: 'user_event',
    event: 'forgot_password_email_sent',
    description: 'User forgot password - email sent to ' + email,
    is_dashboard_entry: true
  });

  saveAndValidate(log);
};

AuditLogger.kycConsentSaved = function(user, options) {
  const log = AuditLog({
    category: 'user_event',
    event: 'kyc_consented',
    description: 'Consent saved.',
    user: {
      username: user.username,
      user_id: user.id
    },
    reviewed_documents: {
      signature: options.user_signature,
      title: options.title,
      url: options.url
    },
    certified_investor: options.certified_investor_status,
    is_dashboard_entry: true
  });

  saveAndValidate(log);
};

AuditLogger.kycConsentLocationBan = function(user, options) {
  const log = AuditLog({
    category: 'user_event',
    event: 'consent_location_ban',
    description: 'Consent location ban status saved as ' + options.is_location_not_banned,
    user: {
      username: user.username,
      user_id: user.id
    },
    signature: options.user_signature,
    certified_investor: options.certified_investor_status,
    is_dashboard_entry: true
  });

  saveAndValidate(log);
};

AuditLogger.kycConsentUSDEstimate = function(user, options) {
  const log = AuditLog({
    category: 'user_event',
    event: 'usd_estimate',
    description: 'Consent estimated contribution value of ' + options.usd_estimate + ' saved.',
    user: {
      username: user.username,
      user_id: user.id
    },
    usd_estimate: options.usd_estimate,
    signature: options.user_signature,
    certified_investor: options.certified_investor_status,
    is_dashboard_entry: true
  });

  saveAndValidate(log);
};

AuditLogger.kycStatusDidChange = function(user, status) {
    const log = AuditLog({
        category: 'user_event',
        event: status,
        description: 'User KYC status changed to ' + status,
        user: {
            username: user.username,
            user_id: user._id
        },
        is_dashboard_entry: true
    });

    saveAndValidate(log);
};

AuditLogger.getLogs = async function(user) {
    return await AuditLog.find({'user.user_id': user._id, is_dashboard_entry: true });
};

function saveAndValidate(log) {
    log.save(function(err) {
        if(err) {
            console.log(err);
        }
    });
}
