'use strict';
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const migrationSchema = new Schema({
    name: {
        type: String,
        unique: true,
        required: true
    },
    status: {
        type: String,
        enum: ['pending','failed','completed'],
        default: 'pending'
    },
    runCount: {
        type: Number,
        default: 1
    },
    message: {
        type: String,
    },
    Created_date: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Migration', migrationSchema);
