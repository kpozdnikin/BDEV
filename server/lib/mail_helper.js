'use strict';

const nodemailer = require('nodemailer');
const mailerhbs = require('nodemailer-express-handlebars');

const mailer = nodemailer.createTransport({
    pool: true,
    host: config.email.host,
    port: config.email.port,
    direct: true, //talk to MX instead of MTA
    requireTLS: true,
    rateDelta: 1000,
    rateLimit: config.email.rateLimit,

    auth: {
        user: config.email.user,
        pass: config.email.password,
    },
    tls: {
        rejectUnauthorized: false //Avoid aborting due to self-signed certificates
    }

});

mailer.use('compile', mailerhbs({
    viewEngine: {
        extname: '.hbs',
        layoutsDir: __dirname + '/email_templates',
    },
    viewPath: __dirname + '/email_templates', //Path to email template folder
    extName: '.hbs' //extendtion of email template
}));

module.exports = {mailer: mailer};
