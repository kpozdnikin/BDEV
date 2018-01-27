import * as errors from '../../utils/errors';

export const sendVerificationEmailSchema = {
  id: '/SendVerificationEmailSchema',
  type: 'object',
  properties: {
    username: {
      type: 'string',
      required: false
    },
    auth_token: {
      type: 'string',
      required: true,
      messages: {
        required: errors.TOKEN_REQUIRED.message
      },
      codes: {
        required: errors.TOKEN_REQUIRED.code
      }
    }
  },
  additionalProperties: true
};
