'use strict';

var mongoose = require('mongoose'),
    crypto = require('crypto'),
    RegisteredEmail = mongoose.model('RegisteredEmail'),
    InvitedEmail = mongoose.model('InvitedEmail'),
    mailer = require('../../lib/mail_helper'),
    jwt = require('jsonwebtoken');

exports.add_registered_email = async function (req, res) {
    var validToken = false;
    var token = req.body.token || req.query.token || req.headers['x-access-token'];
    if (token) {
        jwt.verify(token, config.jwt.secret, function (err, decoded) {
            if (err) {
                console.log('report: register_invalid_token');
                return res.status(401).json({success: false, message: 'Failed to authenticate token'});
            } else {
                if (!decoded.validated) {
                    return res.json(401, {success: false, message: 'The token has not been validated'})
                }
                // if everything is good, save to request for use in other routes
                validToken = true;
                req.decoded = decoded;
                //next();
            }
        });
    } else {
        // if there is no token return an error
        console.log('report: register_missing_token');
        return res.status(403).send({
            success: false,
            message: 'No token provided'
        });
    }
    if (validToken) {
        var new_registered_email = RegisteredEmail(req.body);
        var email_recipient = req.body.email;

        const invitations = await InvitedEmail.find({email: email_recipient}).sort({Created_date: 1});
        if (invitations.length >= 1) {
            new_registered_email = RegisteredEmail({email: email_recipient, referrer: invitations[0].referrer})
        }

        InvitedEmail.find({referrer: email_recipient}).count((err, count) => {

            if (err) {
                return res.json(500, {message: 'Internal error'})
            }

            const remainingInvite = config.email.inviteLimit - count;

            new_registered_email.save(async function (err, email) {
                const newToken = await resignJWTwithEmail(req.decoded, config.jwt.secret, email_recipient);
                if (err) {
                    if (err.name === 'MongoError' && err.code === 11000) {
                        res.status(409);
                        res.json({
                            message: 'That email is already registered',
                            remainingInvite: remainingInvite,
                            token: newToken
                        });
                        console.log('report: register_email_duplicate ' + email_recipient);
                    } else if (err.name === 'ValidationError') {
                        console.error(err);
                        res.status(400);
                        res.json({message: 'That is not a valid email address'});
                        console.log('report: register_email_invalid ' + email_recipient);
                    }
                } else {
                    console.log('report: register_email ' + email_recipient);
                    mailer.mailer.sendMail({
                        from: config.email.fromAddress,
                        to: email_recipient,
                        subject: 'You are Registered for a 10% dubtoken Bonus!',
                        template: 'confirmation_email', //Name email file template
                        context: {}
                    }, async function (err, response) {

                        if (err) {
                            console.log('report: register_email_send_error ' + email_recipient + ' ' + err);
                            res.status(500);
                            res.send({message: 'Error sending email, please try again later'});
                        } else {
                            console.log('report: register_email_sent ' + email_recipient);
                            res.status(201);
                            res.json({
                                token: newToken,
                                message: 'A confirmation email has been sent successfuly to your inbox',
                                remainingInvite: remainingInvite
                            });
                        }
                    });
                }
            });
        });
    }
};

exports.register_with_invite_token = async function (req, res) {
    let inviteToken;
    try {
        inviteToken = decryptInviteToken(req.body.inviteToken);
    } catch (err) {
        res.json(401, {message: 'you need to provide a valid invite token'});
        return;
    }

    const invitation = await InvitedEmail.findOne(inviteToken);

    if (!invitation) {
        res.json(500, {message: "cannot find invite"});
        return;
    }

    if (invitation.validated) {
        res.json(401, {
            message: "The invitation as already been accepted",
            data: inviteToken
        });
        return;
    }
    invitation.validated = true;
    await invitation.save();

    res.json(201, {
        message: 'The invitation has been successfully accepted',
        invitation
    });
    console.log('report: validated invite ' + inviteToken.email);
};

exports.add_invited_email = function (req, res) {
    var validToken = false;
    var token = req.body.token || req.query.token || req.headers['x-access-token'];
    if (token) {
        jwt.verify(token, config.jwt.secret, function (err, decoded) {
            if (err) {
                console.log('report: invite_invalid_token');
                return res.status(401).json({success: false, message: 'Failed to authenticate token'});
            } else {
                if (!decoded.email) {
                    res.json(401, {message: 'You cannot invite without registering your email'});
                    validToken = false;
                    return;
                }
                // if everything is good, save to request for use in other routes
                validToken = true;
                req.decoded = decoded;
                //next();
            }
        });
    } else {
        // if there is no token return an error
        console.log('report: invite_missing_token');
        return res.status(403).send({
            success: false,
            message: 'No token provided'
        });
    }
    if (validToken) {
        const email_recipient = req.body.email;
        const referrer = req.decoded.email;
        const new_invitation_email = InvitedEmail({email: email_recipient, referrer: referrer});

        InvitedEmail.find({referrer: referrer}).count((err, count) => {
            const remaining_invite = config.email.inviteLimit - count;
            if (err) {
                console.error(err);
                res.json(501, {
                    message: 'internal error',
                    remainingInvite: remaining_invite
                });
            } else if (remaining_invite <= 0) {
                res.json(409, {
                    message: 'You cannot invite more than ' + config.email.inviteLimit + ' persons',
                    remainingInvite: remaining_invite
                })
            } else if (email_recipient === referrer) {
                res.json(400, {
                    message: 'You can\'t invite yourself',
                    remainingInvite: remaining_invite
                })
            } else {
                new_invitation_email.save(function (err, email) {
                    if (err) {
                        if (err.name === 'MongoError' && err.code === 11000) {
                            console.log('report: invite_duplicate ' + email_recipient);
                            res.status(409);
                            res.json({
                                message: 'An invitation has already been sent to that address',
                                remainingInvite: remaining_invite
                            });
                        } else if (err.name === 'ValidationError') {
                            console.log('report: invite_invalid_email ' + email_recipient);
                            res.status(400);
                            res.json({
                                message: 'That is not a valid email address',
                                remainingInvite: remaining_invite
                            });
                        }
                    } else {
                        const tokenPayload = {
                            referrer, email: email_recipient
                        };
                        const token = encryptInviteToken(tokenPayload);
                        mailer.mailer.sendMail({
                            from: config.email.fromAddress,
                            to: email_recipient,
                            subject: 'You have been invited by ' + referrer,
                            template: 'invite_email', //Name email file template
                            context: { // pass variables to template
                                referrer, token, demoUrl: config.email.demoUrl
                            }
                        }, function (err, response) {

                            if (err) {
                                console.log('report: invite_error_sending ' + email_recipient);
                                res.status(501);
                                res.json({
                                    message: 'Error sending email, please contact us at...',
                                    remainingInvite: remaining_invite
                                });
                                console.error(err);
                            } else {
                                console.log('report: invite_sent ' + email_recipient + ' from ' + referrer);
                                res.status(201);
                                res.json({
                                    message: 'Email has been successfully sent to ' + email_recipient,
                                    remainingInvite: remaining_invite - 1
                                });
                            }
                        });
                    }
                });
            }
        });
    }
};

exports.list_registered_emails = function (req, res) {
    RegisteredEmail.find({}, function (err, email) {
        if (err)
            res.send(err);
        res.json(email);
        console.log(email);
    });
};

exports.list_invited_emails = function (req, res) {
    InvitedEmail.find({}, function (err, email) {
        if (err)
            res.send(err);
        res.json(email);
        console.log(email);
    });
};

function signJWTwithMetric(metrics, secret, validated = false, email = null) {
    const metricsHash = hashMetrics(metrics);
    const payload = {metricsHash, validated, email};
    return jwt.sign(payload, secret, {
        expiresIn: 60 * 30 // expires in 30 minutes
    });
}

function resignJWTwithEmail(token, secret, email) {
    return signJWTwithMetric(token.metricsHash, secret, token.validated, email);
}

function encryptInviteToken(payload) {
    const cipher = crypto.createCipher(config.email.inviteTokenEncryptionAlgorithm, config.email.password);
    let crypted = cipher.update(JSON.stringify(payload), 'utf8', 'hex');
    crypted += cipher.final('hex');
    return crypted;
}

function decryptInviteToken(token) {
    const decipher = crypto.createDecipher(config.email.inviteTokenEncryptionAlgorithm, config.email.password);
    let dec = decipher.update(token, 'hex', 'utf8');
    dec += decipher.final('utf8');
    return JSON.parse(dec);
}

function hashMetrics(metrics) {
    const string = JSON.stringify(metrics);
    return crypto.createHash('md5').update(string).digest('hex');
}

async function getRemaininginvite(email) {
    const count = await InvitedEmail.find({referrer: email}).count();
    return config.email.inviteLimit - count;
}
