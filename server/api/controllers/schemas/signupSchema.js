import * as errors from '../../utils/errors';

export const signupSchema = {
  id: '/SignupSchema',
  type: 'object',
  properties: {
    username: {
      type: 'string',
      required: true,
      minLength: 3,
      messages: {
        required: errors.USERNAME_REQUIRED.message,
        minLength: errors.INVALID_USERNAME.message
      },
      codes: {
        required: errors.USERNAME_REQUIRED.code,
        minLength: errors.INVALID_USERNAME.code
      }
    },
    email: {
      type: 'string',
      required: true,
      format: 'email',
      messages: {
        required: errors.EMAIL_REQUIRED.message,
        format: errors.INVALID_EMAIL.message
      },
      codes: {
        required: errors.EMAIL_REQUIRED.code,
        format: errors.INVALID_EMAIL.code
      }
    },
    password: {
      type: 'string',
      required: true,
      pattern: "^([\x20-\x7E]{8,})*$",  // min 8 char, ASCII equivalent character range: 32 - 126, "alphanumeric + (space), !, ", #, $, %, &, ', (, ), *, +, ,, -, ., /, :, ;, <, =, >, ?, @, ], \, [, ^, _, `, }, {, |, ~"
      messages: {
          required: errors.PASSWORD_REQUIRED.message,
          pattern: errors.INVALID_PASSWORD.message
      },
      codes: {
          required: errors.PASSWORD_REQUIRED.code,
          pattern: errors.INVALID_PASSWORD.code
      }
    },
    first_name: {
      type: 'string',
      required: false
    },
    last_name: {
      type: 'string',
      required: false
    },
    phone_number: {
      type: 'string',
      required: false
    }
  },
  additionalProperties: true
};
