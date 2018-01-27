const config = {};

config.app = {
    port: process.env.PORT,
    mock: true
};

config.webapp = {
    baseUrl: process.env.ICO_WEB_HOST
};

config.ivep = {
    host: process.env.IVEP_API_HOST
};

config.db = {
    host: process.env.MONGO_DB,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD
};

config.redis = {
    host: process.env.REDIS_DB,
    port: process.env.REDIS_PORT
};

config.onfido = {
    api_token: process.env.ONFIDO_API_TOKEN
};

config.email = {
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT,
    fromAddress: process.env.EMAIL_FROM,
    user: process.env.EMAIL_USER,
    password: process.env.EMAIL_PASSWORD,
    inviteLimit: parseInt(process.env.INVITE_LIMIT),
    rateLimit: parseInt(process.env.EMAIL_RATE_LIMIT),
    inviteTokenEncryptionAlgorithm: 'aes-256-ctr'
};

config.jwt = {
    secret: process.env.JWT_SECRET
};

config.sentry = {
    dsn: process.env.SENTRY_DSN
};

module.exports = config;

module.exports.sanityCheck = function() {
    if (!process.env.ICO_WEB_HOST) throw { message: "ICO_WEB_HOST required!" };
    if (!process.env.NODE_ENV) throw { message: "NODE_ENV required!" };
    if (!process.env.PORT) throw { message: "PORT required!" };
    if (!process.env.MONGO_DB) throw { message: "MONGO_DB required!" };
    if (!process.env.DB_USER) throw { message: "DB_USER required!" };
    if (!process.env.REDIS_DB) throw { message: "REDIS_DB required!" };
    if (!process.env.REDIS_PORT) throw { message: "REDIS_PORT required!" };
    if (!process.env.ONFIDO_API_TOKEN) throw { message: "ONFIDO_API_TOKEN required" };
    if (!process.env.SENTRY_DSN) throw { message: "SENTRY_DSN required!" };
    if (!process.env.DB_PASSWORD) throw { message: "DB_PASSWORD required!" };
    if (!process.env.IVEP_API_HOST) throw { message: "IVEP_API_HOST required!"};
    if (!process.env.EMAIL_HOST) throw { message: "EMAIL_HOST required!" };
    if (!process.env.EMAIL_PORT) throw { message: "EMAIL_PORT required!" };
    if (!process.env.EMAIL_FROM) throw { message: "EMAIL_FROM required!" };
    if (!process.env.EMAIL_USER) throw { message: "EMAIL_USER required!" };
    if (!process.env.EMAIL_PASSWORD) throw { message: "EMAIL_PASSWORD required!" };
    if (!process.env.INVITE_LIMIT) throw { message: "INVITE_LIMIT required!" };
    if (!process.env.EMAIL_RATE_LIMIT) throw { message: "EMAIL_RATE_LIMIT required!" };
    if (!process.env.JWT_SECRET) throw { message: "JWT_SECRET required!" };
};
