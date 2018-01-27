import * as errors from '../../utils/errors';

export const updateUserSchema = {
  id: '/UpdateUserInfoSchema',
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
    auth_token: {
      type: 'string',
      required: true,
      messages: {
        required: errors.TOKEN_REQUIRED.message,
      },
      codes: {
        required: errors.TOKEN_REQUIRED.code,
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
    },
    email: {
      type: 'string',
      required: false
    },
    new_username: {
      type: 'string',
      required: false,
      minLength: 3,
      messages: {
        minLength: errors.INVALID_USERNAME.message
      },
      codes: {
        minLength: errors.INVALID_USERNAME.code
      }
    },
    new_password: {
      type: 'string',
      required: false,
      pattern: "^(?=.{8,})(?=.*[A-Z])(?=.*[@#$%^&+=]).*$",  // min 8 char, min 1 capital, min 1 special char
      messages: {
        pattern: errors.INVALID_PASSWORD.message
      },
      codes: {
        pattern: errors.INVALID_PASSWORD.code
      }
    },
    current_password: {
      type: 'string',
      required: true,
      pattern: "^(?=.{8,})(?=.*[A-Z])(?=.*[@#$%^&+=]).*$",  // min 8 char, min 1 capital, min 1 special char
      messages: {
        required: errors.PASSWORD_REQUIRED.message,
        pattern: errors.INVALID_EXISTING_PASSWORD.message
      },
      codes: {
        required: errors.PASSWORD_REQUIRED.code,
        pattern: errors.INVALID_EXISTING_PASSWORD.code
      }
    }
  },
  additionalProperties: true
};
