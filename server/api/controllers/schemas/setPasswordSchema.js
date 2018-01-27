import * as errors from '../../utils/errors';

export const setPasswordSchema = {
    id: '/SetPasswordSchema',
    type: 'object',
    properties: {
        forgot_password_token: {
            type: 'string',
            required: true,
            messages: {
                required: errors.TOKEN_REQUIRED.message
            },
            codes: {
                required: errors.TOKEN_REQUIRED.code
            }
        },
        new_password: {
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
        }
    },

    additionalProperties: true
};