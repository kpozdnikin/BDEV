const mongoose = require('mongoose');
const q = require('q');

const Schema = mongoose.Schema;

const listOfCurrencies = ["BTC", "BCH", "LTC", "ETH", "USD", "CAD"];

const walletSchema = new Schema({
  address: String,
  currency: { type: String, enum: listOfCurrencies, default: listOfCurrencies[0] },
});

//To use our schema definition, we need to convert our schema into a Model we can work with
const Wallet = mongoose.model('wallets', walletSchema);

//Initlizing interface object of this model.
const walletModel = {};

//function to get wallets listings
walletModel.get = function(skip, limit){
  var results = q.defer();
  skip = parseInt(skip) || 0;
  limit = parseInt(limit) || 999999999;
  console.log('walletModel');
  Wallet.find({}, function(err, dbWallet) {
    if (err){
      results.reject(err);
    }
    results.resolve(dbWallet);
  }).skip(skip).limit(limit);
  return results.promise;
};

// Get single wallet by its address.
walletModel.getOne = function(address){
  var results = q.defer();

  if(!address){
    results.reject({ status:'error', error:'Wallet address not supplied.' });
  }
  Wallet.findOne({ address: address }, function(err, dbWallet) {
    if (err){
      results.reject(err);
    }

    if(dbWallet){
      results.resolve(dbWallet);
    } else{
      results.reject({status:'error', error:'Invalid wallet address supplied.'});
    }
  });
  return results.promise;
};

// Insert wallet into database
walletModel.insertOne = function(wallet){
  var results = q.defer();
  var error = checkInputError(wallet);
  if(error){
    results.reject({ status:'error', error:error });
  }
  var wallets = [];
  // Insert wallets
  if(!error){
    wallets.push(wallet);
    Wallet.collection.insert(wallets, function(err, dbWallet) {
      if(err){
        console.log('error occured in populating database');
        console.log(err);
      }
      else{
        // console.log('wallet inserted');
        results.resolve(dbWallet);
      }
    });
  }
  return results.promise;
};

// update wallets
walletModel.updateOne = function(wallet) {
  var results = q.defer();
  var error = checkInputError(wallet);

  if(error){
    results.reject({ status:'error', error:error });
  }

  // find and update wallet
  if(!error) {
    Wallet.findOne({ address: wallet.address}, function (err, dbWallet) {
      if (err) {
        return results.reject(err);
      }
      for (let k in dbWallet) dbWallet[k] = dbWallet[k];
      dbWallet.save();
      results.resolve(dbWallet);
    });
  }
  else{
    results.reject(err);
  }
  return results.promise;
};

//delete wallet
walletModel.delete = function(address){
  var results = q.defer();
  var error = false;
  if(!address){
    results.reject({ status:'error', error:error });
    error = true;
  }
  if(!error){
    console.log(address);
    Wallet.findOne({ address:address }, function(err, dbWallet) {
      if (err){
        results.reject(err);
      }
      dbWallet.remove();
      results.resolve(dbWallet);
    });
  }
  return results.promise;
};

walletModel.seed = function(data) {
  const wallets = [
    {
      address: '0xb794F5eA0ba39494cE839613fffBA74279579268',
      currency: 'BTC',
    },
    {
      address: '0xe50365f5d679cb98a1dd62d6f6e58e59321bcddf',
      currency: 'ETH',
    }
  ];

  walletModel.collection.insert(wallets, function(err, dbWallets) {
    if(err){
      console.log('error occured in populating database');
      console.log(err);
    }
    else{
      console.log('Wallets table populated.', dbWallets.length);
    }
  });
};

//check input validation
function checkInputError(wallet) {
  return false;
}


module.exports = walletModel;
