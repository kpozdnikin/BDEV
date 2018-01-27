import {Validator} from 'jsonschema';

const validator = new Validator;

const errors = {
  GENERIC_ERROR: {
    code: 1000,
    message: "Unspecified Error"
  },
  USER_ACCESS_DENIED: {
    code: 1001,
    message: "User account has been locked"
  },
  DATA_TYPE_ERROR: {
    code: 1002,
    message: "Data type is not correct"
  },
  INTERNAL_SERVER_ERROR: {
    code: 1003,
    message: "Internal server error"
  },
  INVALID_LOGIN: {
    code: 1011,
    message: "Invalid combination of email/username and password"
  },
  EMAIL_CONFIRMATION_REQUIRED: {
    code: 1012,
    message: "Email address confirmation required"
  },
  PASSWORD_RESET_PENDING: {
    code: 1013,
    message: "Password reset pending"
  },
  USERNAME_EXISTS: {
    code: 1014,
    message: "Username already exists"
  },
  EMAIL_EXISTS: {
    code: 1015,
    message: "Email already in use"
  },
  NO_USER_ASSOCIATED: {
    code: 1016,
    message: "No user is associated with this email"
  },
  EMAIL_TIMEOUT: {
    code: 1017,
    message: "Please wait n minutes to make another request of verification email"
  },
  INVALID_VERIFICATION_LINK: {
    code: 1018,
    message: "The verification link is invalid or expired"
  },
  INVALID_NAME_LENGTH: {
    code: 1200,
    message: "Name must be longer that 1 character"
  },
  INVALID_NAME_FORMAT: {
    code: 1201,
    message:"Should only contain alphanumeric characters or spaces."
  },
  INVALID_USERNAME: {
    code: 1202,
    message: "Username cannot have any space, and needs to be at least 3 characters long and must be unique"
  },
  INVALID_EMAIL: {
    code: 1203,
    message: "Invalid Email"
  },
  INVALID_PASSWORD: {
    code: 1204,
    message: "Password needs to be at least 8 characters long"
  },
  USERNAME_REQUIRED: {
    code: 1019,
    message: "Username Required"
  },
  PASSWORD_REQUIRED: {
    code: 1020,
    message: "Password Required"
  },
  EMAIL_REQUIRED: {
    code: 1021,
    message: "Email Required"
  },
  INVALID_EXISTING_PASSWORD: {
    code: 1022,
    message: "Invalid Existing Password"
  },
  TOKEN_REQUIRED: {
    code: 1023,
    message: "Token Required"
  },
  INVALID_EMAIL_TOKEN: {
    code: 1024,
    message: "Invalid Email Token"
  },
  INVALID_TOKEN: {
    code: 1025,
    message: "Invalid Token"
  },
  INVALID_ADDRESS: {
    code: 1209,
    message: "Please enter a valid address"
  },
  INVALID_COUNTRY: {
    code: 1210,
    message: "Please enter a valid country"
  },
  INVALID_STATE: {
    code: 1220,
    message: "Please enter a valid state"
  },
  INVALID_CITY: {
    code: 1211,
    message: "Please enter a valid city"
  },
  INVALID_POSTAL_CODE: {
    code: 1212,
    message: "Please enter a valid postal code"
  },
  FIRST_NAME_REQUIRED: {
    code: 1213,
    message: "First name required"
  },
  LAST_NAME_REQUIRED: {
    code: 1214,
    message: "Last name required"
  },
  INVALID_DOB: {
    code: 1215,
    message: "Please enter a valid date of birth"
  },
  DOB_REQUIRED: {
    code: 1216,
    message: "Date of birth required"
  },
  INVALID_STREET: {
    code: 1217,
    message: "Please enter a valid street"
  },
  INVALID_TOWN: {
    code: 1218,
    message: "Please enter a valid town"
  },
  INVALID_KYC_LOCATION: {
    code: 1301,
    message: "Unfortunately participation from your location is currently not available, please sign up for our newsletter to get updates about the project."
  },
  KYC_SIGNATURE_REQUIRED: {
    code: 1303,
    message: "Signature required"
  },
  CERTIFIED_INVESTOR_REQUIRED: {
    code: 1304,
    message: "You need to be a certified participant"
  },
  USD_ESTIMATE_REQUIRED: {
    code: 1305,
    message: "Estimated Contribution Required"
  },
  INVALID_USD_ESTIMATE: {
    code: 1306,
    message: "Minimum contribution requirement has not been met"
  },
  REVIEWED_DOCUMNETS_REQUIRED: {
    code: 1307,
    message: "Documents need to be reviewed"
  },
  INVALID_KYC_SIGNATURE_LENGTH: {
    code: 1308,
    message: "Signature must be longer that 1 character"
  }
};

module.exports = errors;

module.exports.createErrorsFromValidation = function (validation, passParameter = true) {
  return validation.errors.map(function (error) {
    var returnError = {
      errorMessage: error.schema.messages[error.name],
      errorCode: error.schema.codes[error.name]
    };
    if(passParameter === true) {
      returnError.parameter = error.property.split('.')[1] || error.argument;
    }
    return returnError;
  });
};

module.exports.createError = function (error, parameterName = '') {
  var returnError = {
      errorMessage: error.message,
      errorCode: error.code
  };

  if(parameterName.length > 0) {
    returnError.parameter = parameterName;
  }

  return returnError;
}

module.exports.schemaValidator = function(body, schema) {
  const validation = validator.validate(body, schema);
  validation.isValid = !(validation.errors.length > 0);
  return validation;
}
