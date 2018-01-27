'use strict';
const mongoose = require('mongoose');
const validator = require('validator');
const Schema = mongoose.Schema;

const registeredEmailSchema = new Schema({
    email: {
        type: String,
        trim: true,
        lowercase: true,
        unique: true,
        required: 'Email address is required',
        validate: [validator.isEmail, 'invalid email']
    },
    referrer: {
        type: String,
        trim: true,
        lowercase: true,
        validate: [validator.isEmail, 'invalid email']
    },
    Created_date: {
        type: Date,
        default: Date.now
    }
});

const invitedEmailSchema = new Schema({
    email: {
        type: String,
        trim: true,
        lowercase: true,
        required: 'Email address is required',
        validate: [validator.isEmail, 'invalid email']
    },
    Created_date: {
        type: Date,
        default: Date.now
    },
    referrer: {
        type: String,
        trim: true,
        lowercase: true,
        required: 'Referrer address is required',
        validate: [validator.isEmail, 'invalid email']
    },
    validated: {
        type: Boolean,
        default: false
    }
});

invitedEmailSchema.index({email: 1, referrer: 1}, {unique: true});

module.exports = mongoose.model('InvitedEmail', invitedEmailSchema),
    mongoose.model('RegisteredEmail', registeredEmailSchema);

