import jwt from 'jsonwebtoken';
import User from '../models/userModel';
import {signupSchema} from './schemas/signupSchema';
import {loginSchema} from './schemas/loginSchema';
import {logoutSchema} from './schemas/logoutSchema';
import {getUserSchema} from './schemas/getUserSchema';
import {updateUserSchema} from './schemas/updateUserSchema';
import {verifyEmailSchema} from './schemas/verifyEmailSchema';
import {sendVerificationEmailSchema} from './schemas/sendVerificationEmailSchema';
import {forgotPasswordSchema} from './schemas/forgotPasswordSchema';
import {setPasswordSchema} from './schemas/setPasswordSchema';
import request from 'request';
import * as errors from '../../api/utils/errors';
import {checkDocumentAndIdentity} from "./kyc.controller";

var mailer = require('../../lib/mail_helper');

export function delay(req, res, next) {
    const timeout = 3000;

    setTimeout(function() {
        next()
    }, timeout)
}

export async function authenticated(req, res, next) {
    const {decoded, jwtError} = req;
    if (decoded && !jwtError) {
        try {
            const user = await User.findOne({_id: req.decoded._id});
            if (!user) {
                const error = errors.createError(errors.NO_USER_ASSOCIATED);
                return res.status(400).jsonWithResponseTime({ success: false, errors: [error] });
            }

            req.user = user;
            return next()
        } catch (e) {
            console.error('database error: ', e.message);
            var errorObject = errors.createError(errors.INTERNAL_SERVER_ERROR);
            return res.status(500).jsonWithResponseTime({success: false, errors: [errorObject]});
        }
    } else {
        const error = errors.createError(errors.INVALID_TOKEN);
        res.status(401).jsonWithResponseTime({success: false, errors: [error]})
    }
}

export async function login(req, res) {

  const validation = errors.schemaValidator(req.body, loginSchema);
  if (!validation.isValid) {
    var results = errors.createErrorsFromValidation(validation, false);
    return res.status(400).jsonWithResponseTime({success: false, errors: results});
  }

  try {
    const identifier = req.body.identifier;
    const where = require('validator').isEmail(identifier) ? {email: identifier} : {username: identifier};

    const user = await User.findOne(where);

    if (user && await user.comparePassword(req.body.password)) {
      const select = {
          username: user.username,
          first_name: user.first_name,
          last_name: user.last_name,
          phone_number: user.phone_number,
          email: user.email,
          email_verification: user.email_verification,
          roles: user.roles
      };
      return res.status(200).jsonWithResponseTime({success: true, auth_token: signJwt(user), user: select});
    } else {
      const error = {
        errorMessage: errors.INVALID_LOGIN.message,
        errorCode: errors.INVALID_LOGIN.code
      };
      return res.status(401).jsonWithResponseTime({success: false, errors: [error]});
    }
  } catch (err) {
    return res.status(500).jsonWithResponseTime({success: false, errors: err.message});
  }
}

export function logout(req, res) {

  const validation = errors.schemaValidator(req.body, logoutSchema);
  if (!validation.isValid) {
    var results = errors.createErrorsFromValidation(validation);
    return res.json(400, {success: false, errors: results});
  } else {
    if(config.app.mock) {
      var mock_data = {
        "response_time_ms": 0,
        "success": true,
        "auth_token": "logout_token"
      };

      return res.json(200, mock_data);
    } else {
      return res.json(400, 'Not found');
    }
  }
}

export function signup(req, res) {

  const validation = errors.schemaValidator(req.body, signupSchema);
  if (!validation.isValid) {
    var results = errors.createErrorsFromValidation(validation);
    return res.json(400, {success: false, errors: results});
  }

  const ivepSignupURL = config.ivep.host + req.url;

  const options = {
    url: ivepSignupURL,
    headers: {platform: 'ico'},
    form: req.body
  };

  options.headers.platform = 'ico';

  request.post(options, function(err, response, body) {
    if (err) {
      var errorObject = errors.createError(errors.INTERNAL_SERVER_ERROR);
      return res.status(500).jsonWithResponseTime({success: false, errors: [errorObject]});
    }

    const jsonBody = JSON.parse(response.body);
    const user = jsonBody.user;
    if(user) {

      AuditLogger.userDidSignUp(user);

      const options = {
        subject: 'Congratulations! You Successfully Signed Up!',
        user: user,
        template: 'signup_confirmation_email',
        landing_page_url: config.webapp.baseUrl + '/verify_email'
      };
      sendEmailWithAuthToken(options, function(err) {
        var status;

        if (err) {
          status = 'invalid';
          console.log('report: verification_email_send_error ' + user.email + ' ' + err);
        } else {
          status = 'pending';
          console.log('report: verification_email_sent ' + user.email);
        }

        const update = {
          "email_verification.email_status": status,
          "email_verification.email_status_updated_date": new Date()
        };

        User.updateOne({_id: user._id}, update, function(err, result) {
          if(err) console.log('report: update_email_verification_status_error: ', err);
        });

      });
    }

    res.writeHeader(response.statusCode, response.headers);
    res.end(body);
  });
}

export function updateUser(req, res) {

  const validation = errors.schemaValidator(req.body, updateUserSchema);
  if (!validation.isValid) {
    var results = errors.createErrorsFromValidation(validation);
    return res.json(400, {success: false, errors: results});
  } else {
    if(config.app.mock) {
      var mock_data = {
        "response_time_ms": 0,
        "success": true,
        "auth_token": "updated_token",
        "user": {
          "username": "updated_username",
          "first_name": "updated_first_name",
          "last_name": "updated_last_name",
          "phone_number": "1234567890",
          "email": "user@example.com",
          "email_verification": {
            "email_status": "not_sent",
            "email_status_updated_date": "2018-01-04T19:24:04.711Z"
          },
          "roles": {
            "ico_investor": {
              "kyc_status": "unstarted",
              "applicant_id": "app_id",
              "usetech_investor": "usetech"
            },
            "ice_editor": {
              "status": "status"
            }
          }
        }
      };

      return res.json(200, mock_data);
    } else {
      return res.json(400, 'Not found');
    }
  }
}

export function verifyEmail(req, res) {

  const validation = errors.schemaValidator(req.body, verifyEmailSchema);
  if (!validation.isValid) {
    var results = errors.createErrorsFromValidation(validation);
    return res.status(400).jsonWithResponseTime({success: false, errors: results});
  }

  var token = req.body.verify_email_token;
  if (token) {

    var decoded_token = jwt.decode(token, config.jwt.secret);

    if(!decoded_token._id) {
      var errorObject = errors.createError(errors.INVALID_EMAIL_TOKEN, 'verify_email_token');
      return res.status(401).jsonWithResponseTime({success: false, errors: [errorObject]});
    }

    jwt.verify(token, config.jwt.secret, async function (err, decoded) {
      if (err) {
        console.log('report: verify_email_invalid_token');

        try {
          const user = await User.findOne({_id: decoded_token._id});
          if(user) {
            user.email_verification.email_status = 'invalid';
            user.email_verification.email_status_updated_date = new Date();
            await user.save();
          }

          var errorObject = errors.createError(errors.INVALID_EMAIL_TOKEN, 'verify_email_token');
          return res.status(401).jsonWithResponseTime({success: false, errors: [errorObject]});
        }
        catch(e) {
          internalServerError();
        }
      } else {

        try {
          const user = await User.findOne({_id: decoded._id});

          if (user) {
            user.email_verification.email_status = 'verified';
            user.email_verification.email_status_updated_date = new Date();
            await user.save();

            AuditLogger.userEmailVerified(user);

            const documentCheckNeeded = user.roles.ico_investor && user.roles.ico_investor.kyc_status === 'created_applicant';
            if (documentCheckNeeded) {
              await checkDocumentAndIdentity(user)
            }

            return res.status(200).jsonWithResponseTime({success: true});
          } else {
            var errorObject = errors.createError(errors.INVALID_EMAIL_TOKEN, 'verify_email_token');
            return res.status(401).jsonWithResponseTime({success: false, errors: [errorObject]}); //'The token has not been validated'
          }
        } catch (err) {
          var errorObject = errors.createError(errors.INTERNAL_SERVER_ERROR);
          return res.status(500).jsonWithResponseTime({success: false, errors: [errorObject]});
        }
      }
    });
  } else {
    console.log('report: verify_email_missing_token');
    var errorObject = errors.createError(errors.TOKEN_REQUIRED);
    return res.status(403).jsonWithResponseTime({success: false, errors: [errorObject]});
  }
}

function internalServerError(res) {
  var errorObject = errors.createError(errors.INVALID_TOKEN, 'auth_token');
  return res.status(401).jsonWithResponseTime({success: false, errors: [errorObject]});
}

export function sendVerificationEmail(req, res) {

  const validation = errors.schemaValidator(req.headers, sendVerificationEmailSchema);
  if (!validation.isValid) {
    var results = errors.createErrorsFromValidation(validation);
    return res.status(400).jsonWithResponseTime({success: false, errors: results});
  } else {

    var token = req.headers.auth_token;

    var decoded_token = jwt.decode(token, config.jwt.secret);
    if (!decoded_token || !decoded_token._id) {
      var errorObject = errors.createError(errors.INVALID_TOKEN, 'auth_token');
      return res.status(401).jsonWithResponseTime({success: false, errors: [errorObject]});
    }

    jwt.verify(token, config.jwt.secret, async function (err, decoded) {
      if (err) {
        console.log('report: send_verification_email_invalid_token');

        try {
          const user = await User.findOne({_id: decoded_token._id});

          if (user) {

            user.email_verification.email_status = 'invalid';
            user.email_verification.email_status_updated_date = new Date();
            await user.save();
          }

          var errorObject = errors.createError(errors.INVALID_EMAIL_TOKEN, 'verify_email_token');
          return res.status(401).jsonWithResponseTime({success: false, errors: [errorObject]}); //'The token has not been validated'

        } catch(e) {
          internalServerError();
        }
      } else {
        try {
          const user = await User.findOne({_id: decoded._id});
          if (user) {

            user.email_verification.email_status = 'verified';
            user.email_verification.email_status_updated_date = new Date();
            await user.save();

            const options = {
              subject: 'Verification Email',
              user: user,
              template: 'signup_confirmation_email',
              landing_page_url: config.webapp.baseUrl + '/verify_email'
            };

            if (user.email) {
              sendEmailWithAuthToken(options, function(err) {
                const report = err ?
                  'email_send_error' + user.email + ' ' + err :
                  'verification_email_sent';
                console.log('report: ', report);
              });

              res.status(200).jsonWithResponseTime({success:true});
            }
          } else {
            internalServerError();
          }
        } catch (err) {
          internalServerError();
        }
      }
    });
  }
}

export async function forgotPassword(req, res) {

  const validation = errors.schemaValidator(req.body, forgotPasswordSchema);
  if (!validation.isValid) {
    var results = errors.createErrorsFromValidation(validation);
    return res.status(400).jsonWithResponseTime({success: false, errors: results});
  } else {
    const email = req.body.email;

    try {
      const user = await User.findOne({email: email});

      if (!user) {
        AuditLogger.forgotPasswordEmailDidNotExist(email);
        return res.jsonWithResponseTime({success: true});
      }

      const options = {
        subject: 'Forgot your password?',
        user: user,
        template: 'forgot_password_email',
        landing_page_url: config.webapp.baseUrl + '/set_password'
      };
      sendEmailWithAuthToken(options, function(err) {
        const report = err ?
            'forgot_password_email_send_error' + email + ' ' + err :
            'forgot_password_sent';
        console.log('report: ', report);
      });

      AuditLogger.forgotPasswordEmailSent(email);
      return res.jsonWithResponseTime({success: true});
    } catch (e) {
      var errorObject = errors.createError(errors.INTERNAL_SERVER_ERROR);
      return res.status(500).jsonWithResponseTime({success: false, errors: [errorObject]});
    }
  }
}

export async function setPassword(req, res) {

  const validation = errors.schemaValidator(req.body, setPasswordSchema);
  if (!validation.isValid) {
    var results = errors.createErrorsFromValidation(validation);
    return res.status(400).jsonWithResponseTime({success: false, errors: results});
  }

  try {
    const user = await User.findOne({_id: req.decoded._id});
    if (!user) {
      const error = errors.createError(errors.NO_USER_ASSOCIATED);
      return res.status(400).jsonWithResponseTime({success: false, errors: [error]});
    }

    user.password = req.body.new_password;
    await user.save();
    return res.jsonWithResponseTime({success: true});
  } catch (e) {
    console.error('database error: ', e.message);
    var errorObject = errors.createError(errors.INTERNAL_SERVER_ERROR);
    return res.status(500).jsonWithResponseTime({success: false, errors: [errorObject]});
  }
}

export function getOneUser(req, res) {
    const validation = errors.schemaValidator(req.params, getUserSchema);
    if (!validation.isValid) {
        var results = errors.createErrorsFromValidation(validation);
        return res.status(400).jsonWithResponseTime({success: false, errors: results});
    }

    if (req.user.username.toLowerCase() !== req.params.username.toLowerCase()) {
        const error = errors.createError(errors.USER_ACCESS_DENIED);
        return res.status(401).jsonWithResponseTime({success: false, errors: [error]});
    }

    const select = {
        username: req.user.username,
        first_name: req.user.first_name,
        last_name: req.user.last_name,
        phone_number: req.user.phone_number,
        email: req.user.email,
        email_verification: req.user.email_verification,
        roles: req.user.roles
    };

    return res.status(200).jsonWithResponseTime({success: true, auth_token: signJwt(req.user), user: select});
}

export function signJwt(user) {
  const payload = {
    _id: user._id,
    type: 'User'
  };
  return jwt.sign(payload, config.jwt.secret, {
    expiresIn: 60 * 60 * 24 // expires in 24 hours
  });
}

function sendEmailWithAuthToken(options, callback) {
  const token = signJwt(options.user);
  mailer.mailer.sendMail({
    from: config.email.fromAddress,
    to: options.user.email,
    subject: options.subject,
    template: options.template, //Name email file template
    context: {token, landingPageUrl: options.landing_page_url}
  }, callback);
}

