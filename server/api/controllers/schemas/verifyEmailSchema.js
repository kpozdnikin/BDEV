import * as errors from '../../utils/errors';

export const verifyEmailSchema = {
  id: '/VerifyEmailSchema',
  type: 'object',
  properties: {
    verify_email_token: {
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
