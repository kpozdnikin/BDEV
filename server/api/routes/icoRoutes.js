'use strict';

import {login, logout, signup, getOneUser, updateUser, verifyEmail, sendVerificationEmail, forgotPassword, setPassword, authenticated, delay} from '../controllers/authentication';

import * as ico from '../controllers/icoController';
import * as ver from '../controllers/versionController';
import * as transaction from '../controllers/transaction.controller';
import * as investor from '../controllers/investor.controller';
import * as kyc from '../controllers/kyc.controller';
import {getDashboard} from '../controllers/dashboardController';


module.exports = function (app) {

  app.route('/v1/login').post(delay, login);
  app.route('/v1/logout').post(logout);
  app.route('/v1/user').post(delay, signup);
  app.route('/v1/user/:username').get(authenticated, getOneUser);
  app.route('/v1/user/:username').put(updateUser);

  app.route('/v1/verify_email').post(verifyEmail);
  app.route('/v1/send_verification_email').post(sendVerificationEmail);

  app.route('/v1/forgot_password').post(delay, forgotPassword);
  app.route('/v1/set_password').post(delay, setPassword);

  app.route('/v1/kyc_consent').post(authenticated, kyc.consent);
  app.route('/v1/kyc_applicant').post(authenticated, kyc.createApplicant);
  app.route('/v1/kyc_documents').post(authenticated, kyc.createDocumentCheck);

  app.route('/v1/dashboard').get(authenticated, getDashboard);

  // todo: following endpoints still TBD in terms of naming
  app.route('/register').get(ico.list_registered_emails);
  app.route('/invite').get(ico.list_invited_emails);
  app.route('/version').get(ver.versionInfo);

  // @todo - use with middleWare syntax for authorization and other security "app.get('/api/investors', middlewareFunc, investor.getInvestors)"
  // transactions
  app.route('/api/transactions').get(transaction.getTransactions);
  app.route('/api/transactions/:transactionId').get(transaction.getOneTransaction);
  app.route('/api/transactions').post(transaction.insertOneTransaction);
  app.route('/api/transactions/:transactionId').put(transaction.updateOneTransaction);
  app.route('/api/transactions/:transactionId').delete(transaction.deleteOneTransaction);

  // investors
  app.route('/api/investors').get(investor.getInvestors);
  app.route('/api/investors/:investorId').get(investor.getOneInvestor);
  app.route('/api/investors').post(investor.insertOneInvestor);
  app.route('/api/investors/:investorId').put(investor.updateOneInvestor);
  app.route('/api/investors/:investorId').delete(investor.deleteOneInvestor);
};
