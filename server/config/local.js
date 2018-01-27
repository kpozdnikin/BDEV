const config = {};

config.app = {
    port: 3000
};

config.db = {
    host: 'mongodb://localhost:27017/blockchain',
};

config.email = {
    host: process.env.EMAIL_HOST || 'box.blocksense.io',
    port: process.env.EMAIL_PORT || '587',
    fromAddress: process.env.EMAIL_FROM || 'dubtokens@blocksense.io',
    user: process.env.EMAIL_USER || 'dubtokens@blocksense.io',
    password: process.env.EMAIL_PASSWORD || 'sellMoreTokens',
    inviteLimit: parseInt(process.env.INVITE_LIMIT) || 10,
    rateLimit: parseInt(process.env.EMAIL_RATE_LIMIT) || 14,
    // TODO: put the not staging address here
    demoUrl: process.env.DEMO_URL || 'https://ivep-staging.dubdub.com/',
    inviteTokenEncryptionAlgorithm: 'aes-256-ctr'
};

config.jwt = {
    secret: process.env.JWT_SECRET || 'sellMoreTokens'
};

config.sentry = {
    dsn: process.env.SENTRY_DSN
};

module.exports = config;
