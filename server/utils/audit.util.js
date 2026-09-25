const AuditLog = require('../models/AuditLog');

const createAuditLog = async ({
  actor,
  actorRole,
  action,
  resource,
  resourceId = null,
  metadata = {},
  req = null,
}) => {
  try {
    const log = new AuditLog({
      actor,
      actorRole,
      action,
      resource,
      resourceId,
      metadata: {
        ...metadata,
        ip: req ? req.ip : null,
        userAgent: req ? req.headers['user-agent'] : null,
      },
    });
    await log.save();
  } catch (err) {
    console.error('Audit log error:', err.message);
  }
};

module.exports = { createAuditLog };
