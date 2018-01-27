import * as errors from '../../utils/errors';

export const logoutSchema = {
  id: '/LogoutSchema',
  type: 'object',
  properties: {
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
