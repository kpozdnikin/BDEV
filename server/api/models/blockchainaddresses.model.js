const mongoose = require('mongoose');
var q = require('q');
var path = require("path");

const Schema = mongoose.Schema;
const listOfCurrencies = ["BTC", "BCH", "LTC", "ETH", "USD", "CAD"];

const blockchainAddressesDataModel = {
    currency: '', // Blockchain ID (BTC. BCH, LTC, ETH, ...)
    address: '', // Address to scan
    used: false, // Indicates if the address has been assigned to a user or a purpose
};

const blockchainAddressesSchema = new Schema({
    currency: { type: String, enum: listOfCurrencies },
    address: String,
    used: Boolean,
});


// To use our schema definition, we need to convert our blogSchema into a Model we can work with
const BlockchainAddresses = mongoose.model('blockchainaddresses', blockchainAddressesSchema);

// Initlizing interface object of this model.
const blockchainAddressesModel = {};

// function to get the total count of addresses
blockchainAddressesModel.getCount = function() {
    var results = q.defer();
    BlockchainAddresses.count({used: true}, function(err, count) {
        if (err) {
            results.reject(err);
        } else {
            results.resolve(count);
        }
    });
    return results.promise;
};

// function to get a batch of blockchain addresses
blockchainAddressesModel.readBatch = function(skip, limit) {
    var results = q.defer();
    BlockchainAddresses.find({used: true}, function(err, addrRecords) {
        if (err) {
            results.reject(err);
        } else {
            if (addrRecords.length > 0) {
                results.resolve(addrRecords);
            } else {
                results.resolve(false);
            }
        }

    }).sort('address').skip(skip).limit(limit);
    return results.promise;
};

// Insert one blockchain address into database
blockchainAddressesModel.addSingle = function(addrRecord) {
    var results = q.defer();
    var recordsToInsert = [];
    // Insert record
    recordsToInsert.push(addrRecord);
    BlockchainAddresses.collection.insert(addrRecord, function(err, newRecord) {
        if(err) {
            console.log('error in blockchainAddressesModel.addSingle');
            console.log(err);
        } else {
            results.resolve(newRecord);
        }
    });

    return results.promise;
};

// Insert blockchain addresses into database
blockchainAddressesModel.addMultiple = function(recordsToInsert) {
    var results = q.defer();
    BlockchainAddresses.collection.insert(recordsToInsert, function(err, newRecord) {
        if(err) {
            console.log('error in blockchainAddressesModel.addMultiple');
            console.log(err);
        } else {
            results.resolve(newRecord);
        }
    });

    return results.promise;
};

module.exports = blockchainAddressesModel;
