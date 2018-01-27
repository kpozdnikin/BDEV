import * as errors from '../../utils/errors';

export const addressSchema = {
    id: '/AddressSchema',
    type: 'object',
    properties: {
        appartment_number: {
            type: 'string',
            required: false
        },
        building_number: {
            type: 'string',
            required: false
        },
        building_name: {
            type: 'string',
            required: false
        },
        street: {
            type: 'string',
            required: true,
            messages: {
                required: errors.INVALID_STREET.message
            },
            codes: {
                required: errors.INVALID_STREET.code
            }
        },
        sub_street: {
            type: 'string',
            required: false
        },
        town: {
            type: 'string',
            required: true,
            messages: {
                required: errors.INVALID_TOWN.message
            },
            codes: {
                required: errors.INVALID_TOWN.code
            }
        },
        state: {
            type: 'string',
            required: false
        },
        postal_code: {
            type: 'string',
            required: true,
            messages: {
                required: errors.INVALID_POSTAL_CODE.message
            },
            codes: {
                required: errors.INVALID_POSTAL_CODE.code
            }
        },
        country: {
            type: 'string',
            required: true,
            messages: {
                required: errors.INVALID_COUNTRY.message
            },
            codes: {
                required: errors.INVALID_COUNTRY.code
            }
        }
    },

    additionalProperties: true
};

export const kycApplicantSchema = {
    id: '/KYCApplicantSchema',
    type: 'object',
    properties: {
        legal_first_name: {
            type: 'string',
            required: true,
            messages: {
                required: errors.FIRST_NAME_REQUIRED.message
            },
            codes: {
                required: errors.FIRST_NAME_REQUIRED.code
            }
        },
        legal_last_name: {
            type: 'string',
            required: true,
            messages: {
                required: errors.LAST_NAME_REQUIRED.message
            },
            codes: {
                required: errors.LAST_NAME_REQUIRED.code
            }
        },
        email: {
            type: 'string',
            format: 'email',
            required: true,
            messages: {
                required: errors.EMAIL_REQUIRED.message,
                format: errors.INVALID_EMAIL.message
            },
            codes: {
                required: errors.EMAIL_REQUIRED.code,
                format: errors.INVALID_EMAIL.code
            }
        },
        address: {
            $ref: '/AddressSchema'
        },
        dob: {
            type: 'string',
            pattern: '([12]\\d{3}-(0[1-9]|1[0-2])-(0[1-9]|[12]\\d|3[01]))',      // yyyy-mm-dd
            required: true,
            messages: {
                required: errors.DOB_REQUIRED.message,
                pattern: errors.INVALID_DOB.message
            },
            codes: {
                required: errors.DOB_REQUIRED.code,
                pattern: errors.INVALID_DOB.code
            }
        }
    },

    required: ['address'],

    additionalProperties: true
};

