import * as errors from '../../utils/errors';

export const consentSchema = {
  id: '/ConsentSchema',
  type: 'object',
  properties: {
    reviewed_documents: {
      type: 'array',
      items: [
        {
          type: 'object',
          properties: {
            title: {
              type: 'string'
            },
            url: {
              type: 'string'
            }
          },
          required: ['title', 'url'],
          additionalProperties: false
        }
      ],
      required: true,
      messages: {
        required: errors.REVIEWED_DOCUMNETS_REQUIRED.message,
        type: errors.DATA_TYPE_ERROR.message
      },
      codes: {
        required: errors.REVIEWED_DOCUMNETS_REQUIRED.code,
        type: errors.DATA_TYPE_ERROR.code
      }
    },
    usd_estimate: {
      type: 'string',
      required: true,
      pattern: '^[0-9,\.]+$',
      messages: {
        required: errors.USD_ESTIMATE_REQUIRED.message,
        type: errors.DATA_TYPE_ERROR.message,
        pattern: errors.DATA_TYPE_ERROR.message
      },
      codes: {
        required: errors.USD_ESTIMATE_REQUIRED.code,
        type: errors.DATA_TYPE_ERROR.code,
        pattern: errors.DATA_TYPE_ERROR.code
      }
    },
    is_location_not_banned: {
      enum: ["true"],
      required: true,
      messages: {
        required: errors.INVALID_KYC_LOCATION.message,
        enum: errors.DATA_TYPE_ERROR.message
      },
      codes: {
        required: errors.INVALID_KYC_LOCATION.code,
        enum: errors.DATA_TYPE_ERROR.code
      }
    },
    is_certified_investor: {
      enum: ["true", "false"],
      required: true,
      messages: {
        required: errors.CERTIFIED_INVESTOR_REQUIRED.message,
        enum: errors.DATA_TYPE_ERROR.message
      },
      codes: {
        required: errors.CERTIFIED_INVESTOR_REQUIRED.code,
        enum: errors.DATA_TYPE_ERROR.code
      }
    },
    signature: {
      type: 'string',
      required: true,
      minLength: 2,
      messages: {
        required: errors.KYC_SIGNATURE_REQUIRED.message,
        minLength: errors.INVALID_KYC_SIGNATURE_LENGTH.message
      },
      codes: {
        required: errors.KYC_SIGNATURE_REQUIRED.code,
        minLength: errors.INVALID_KYC_SIGNATURE_LENGTH.code
      }
    },
  },
  additionalProperties: true
};
