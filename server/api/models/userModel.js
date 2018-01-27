import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import promisify from 'promisify-native';
import validator from 'validator';

const saltWorkFactor = 10;

const UserSchema = mongoose.Schema({
    username: {
        type: String,
        required: true,
        minlength: 2,
        index: { unique: true }
    },
    email: {
        type: String,
        unique: true,
        required: true,
        validate: [validator.isEmail, 'invalid email']
    },
    email_verification: {
        email_status: {
            type: String,
            enum: ['not_sent', 'pending', 'invalid', 'verified'],
            default: 'not_sent'
        },
        email_status_updated_date: Date
    },
    password: {
        type: String,
        required: true
    },
    first_name: String,
    last_name: String,
    phone_number: String,
    roles: {
        ico_investor: {
          kyc_status: {
            type: String,
            required: true,
            enum: ['unstarted', 'consented', 'created_applicant', 'pending', 'manual_check', 'failed', 'verified', 'rejected'],
            default: 'unstarted'
          },
          applicant_id: String,
          usetech_investor: String,
          certified_investor: {
            type: String,
            enum: ['none', 'pending', 'verified', 'rejected'],
            default: 'none'
          },
          usd_estimate: String
        },
        ico_editor: {
            type: String, //TODO
            kyc_status: String,
            applicant_id: String
        }
    },
    createdAt: Date,
    lastUpdate: Date
});

UserSchema.pre('save', function (next) {
    const user = this;
    user.lastUpdate = new Date();

    if (!user.isModified('password')) return next();

    bcrypt.genSalt(saltWorkFactor, (err, salt) => {
        if (err) return next(err);

        bcrypt.hash(user.password, salt, (err, hash) => {
            if (err) return next(err);

            user.password = hash;
            next();
        });
    });
});

UserSchema.methods.comparePassword = async function (candidatePassword, cb) {
    const user = this;
    const compareHash = promisify(bcrypt.compare);
    return await compareHash(candidatePassword, user.password);
};

export default mongoose.model('User', UserSchema);
