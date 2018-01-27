const mongoose = require('mongoose');
var q = require('q');
var path = require("path");

const Schema = mongoose.Schema;

const blockchainStatusDataModel = {
    _id: '', // Blockchain ID (BTC. BCH, LTC, ETH, ...)
    totalItems: '', // Total items if known (pages, transactions, etc...)
    lastItem: '', // Id of last item read (page, txid, tx number, etc...)
};

const blockchainStatusSchema = new Schema({
    _id: String,
    totalItems: String,
    lastItem: String,
});


//To use our schema definition, we need to convert our blogSchema into a Model we can work with
const BlockchainStatus = mongoose.model('blockchainstatus', blockchainStatusSchema);

//Initlizing interface object of this model.
const blockchainStatusModel = {};

//function to get blockchain status
blockchainStatusModel.get = function(id) {
    var results = q.defer();
    BlockchainStatus.find({_id: id}, function(err, bcRecords) {
        if (err) {
            results.reject(err);
        } else {
            if (bcRecords.length > 0) {
                results.resolve(bcRecords[0]);
            } else {
                results.resolve(false);
            }
        }

    });
    return results.promise;
};

// Insert blockchain status into database
blockchainStatusModel.set = function(bcRecord) {
    var results = q.defer();
    var recordsToInsert = [];
    // Insert record
    recordsToInsert.push(bcRecord);
    BlockchainStatus.collection.update({_id: bcRecord._id}, bcRecord, {upsert: true}, function(err, bcRecord) {
        if(err) {
            console.log('error in blockchainStatusModel.insertOne');
            console.log(err);
        } else {
            results.resolve(bcRecord);
        }
    });

    return results.promise;
};

module.exports = blockchainStatusModel;
