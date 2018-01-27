import * as errors from '../../utils/errors';

export const loginSchema = {
    id: '/LoginSchema',
    type: 'object',
  properties: {
    identifier: {
      type: 'string',
      required: true,
      messages: {
        required: errors.INVALID_LOGIN.message
      },
      codes: {
        required: errors.INVALID_LOGIN.code
      }
    },
    password: {
      type: 'string',
      required: true,
      messages: {
        required: errors.INVALID_LOGIN.message
      },
      codes: {
        required: errors.INVALID_LOGIN.code
      }
    }
  },
    additionalProperties: true
};
