import * as errors from '../../utils/errors';

export const forgotPasswordSchema = {
  id: '/ForgotPasswordSchema',
  type: 'object',
  properties: {
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
    }
  },
  additionalProperties: true
};
