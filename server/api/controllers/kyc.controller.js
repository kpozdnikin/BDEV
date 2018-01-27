import {Validator} from 'jsonschema';
import * as errors from '../../api/utils/errors';
import request from 'request-promise';
import {addressSchema, kycApplicantSchema} from './schemas/kycApplicantSchema';
import {consentSchema} from './schemas/consentSchema';
import {signJwt} from './authentication';

const validator = new Validator;

const ONFIDO_AUTH_HEADER = { Authorization: 'Token token=' + config.onfido.api_token };

export async function createApplicant(req, res) {
    const validation = validateApplicant(req.body);
    if (!validation.isValid) {
        const errs = errors.createErrorsFromValidation(validation);
        return res.status(400).jsonWithResponseTime({success: false, errors: errs});
    }

    const applicant = {
        first_name: req.body.legal_first_name,
        last_name: req.body.legal_last_name,
        email: req.body.email,
        dob: req.body.dob,
        'addresses[][apartment_number]': req.body.address.appartment_number,
        'addresses[][state]': req.body.address.state,
        'addresses[][building_number]': req.body.address.building_number,
        'addresses[][street]': req.body.address.street,
        'addresses[][town]': req.body.address.town,
        'addresses[][postcode]': req.body.address.postal_code,
        'addresses[][country]': req.body.address.country
    };

    const applicationOptions = {
        method: 'POST',
        url: 'https://api.onfido.com/v2/applicants',
        headers: ONFIDO_AUTH_HEADER,
        form: applicant
    };

    try {
        const applicantBody = await request(applicationOptions);
        const applicantJsonBody = JSON.parse(applicantBody);

        const tokenOptions = {
            method: 'POST',
            url: 'https://api.onfido.com/v2/sdk_token',
            headers: ONFIDO_AUTH_HEADER,
            form: {
                applicant_id: applicantJsonBody.id,
                referrer: (req.headers['origin'] || config.webapp.baseUrl) + '/kyc_document'
            }
        };

        const tokenBody = await request(tokenOptions);
        const tokenJsonBody = JSON.parse(tokenBody);

        await didCreateApplicant(req.user, applicantJsonBody.id);

        return res.jsonWithResponseTime({
            success: true,
            auth_token: signJwt(req.user),
            applicant_id: tokenOptions.form.applicant_id,
            document_token: tokenJsonBody.token
        });

    } catch (e) {
        console.log('create_applicant_error: ', e.message);

        return res.status(400).jsonWithResponseTime({success: false, errors: parseKycErrors(e)});
    }
};

export async function consent(req, res) {

  const validation = errors.schemaValidator(req.body, consentSchema);
  if (!validation.isValid) {
    var results = errors.createErrorsFromValidation(validation);
    return res.status(400).jsonWithResponseTime({success: false, errors: results});
  }

  try {

    const certifiedInvestorStatus = (req.body.is_certified_investor === 'true') ? 'pending' : 'none';
    await verifyInvestor(req.user, certifiedInvestorStatus, req.body.usd_estimate);
    await didConsent(req.user);

    req.body.reviewed_documents.forEach(function (doc) {

      const options = {
        title: doc.title,
        url: doc.url,
        user_signature: req.body.signature,
        certified_investor_status: certifiedInvestorStatus,
        is_location_not_banned: req.body.is_location_not_banned
      };
      AuditLogger.kycConsentSaved(req.user, options);
    });

    const options = {
      user_signature: req.body.signature,
      certified_investor_status: certifiedInvestorStatus,
      is_location_not_banned: req.body.is_location_not_banned,
    };

    AuditLogger.kycConsentLocationBan(req.user, options);
    AuditLogger.kycConsentUSDEstimate(req.user, {usd_estimate: req.body.usd_estimate.replace(/,/g, '')});

    return res.status(200).jsonWithResponseTime({success: true});
  } catch (e) {
    console.error('database error: ', e.message);
    var errorObject = errors.createError(errors.INTERNAL_SERVER_ERROR);
    return res.status(500).jsonWithResponseTime({success: false, errors: [errorObject]});
  }

}

export async function createDocumentCheck(req, res) {
    const isEmailVerified = req.user.email_verification.email_status === 'verified';

    if (!isEmailVerified) {
        await didCreateDocument(req.user);

        return res.status(200).jsonWithResponseTime({ success: true, auth_token: signJwt(req.user)})
    }

    try {
        await checkDocumentAndIdentity(req.user);

        return res.status(200).jsonWithResponseTime({ success: true, auth_token: signJwt(req.user)})
    } catch (e) {
        console.log('create_document_error: ', e.message);

        res.status(500).jsonWithResponseTime({success: false, errors: [errors.createError(errors.GENERIC_ERROR)]})
    }
}

export async function checkDocumentAndIdentity(user) {
    const applicantId = user.roles.ico_investor.applicant_id;

    if (applicantId) {
        const url = 'https://api.onfido.com/v2/applicants/' + applicantId + '/checks';

        const options = {
            method: 'POST',
            url: url,
            headers: ONFIDO_AUTH_HEADER,
            form: {
                type: 'express',
                'reports[][name]': 'document',
                'reports[][name]': 'identity',
                'reports[][variant]': 'kyc'
            }
        };

        await request(options);

        await didCreateDocument(user);
    }
}

function validateApplicant(body) {
    validator.addSchema(addressSchema, '/AddressSchema');
    const validation = validator.validate(body, kycApplicantSchema);
    validation.isValid = !(validation.errors.length > 0);
    return validation;
}

async function verifyInvestor(user, status, estimate) {
    user.roles.ico_investor.certified_investor = status;
    user.roles.ico_investor.usd_estimate = estimate;

    await user.save();
}

async function didConsent(user) {
    user.roles.ico_investor.kyc_status = 'consented';

    await user.save();
}

async function didCreateApplicant(user, applicantId) {
    user.roles.ico_investor.applicant_id = applicantId;

    await user.save();
}

async function didCreateDocument(user) {

    const status = (user.email_verification.email_status === 'verified') ? 'pending' : 'created_applicant';

    user.roles.ico_investor.kyc_status = status;

    AuditLogger.kycStatusDidChange(user, 'kyc_' + status);

    await user.save();
}

function parseKycErrors(e) {
    var errs = [];
    const jsonError = JSON.parse(e.error).error;

    const addresses = jsonError.fields.addresses;

    if (addresses.length > 0) {
        errs.push(errors.createError(errors.INVALID_ADDRESS));
    }

    return errs
}
