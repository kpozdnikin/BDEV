import * as errors from '../../utils/errors';

export const getUserSchema = {
  id: '/GetUserInfoSchema',
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
    }
  },
  additionalProperties: true
};
