const mongoose = require('mongoose');
const cron = require('node-cron');
const serverconfig = require('./../../config/config');
const addressModel = require('./../../api/models/blockchainaddresses.model');


// mongo db connection
const db = mongoose.connection;
var mongooseOptions = { useMongoClient: true,
                        user: serverconfig.db.user,
                        pass: serverconfig.db.password
                      };
var connection = mongoose.connect(serverconfig.db.host, mongooseOptions, function() {
  if (process.env.NODE_ENV === 'develop') {
    console.log("Develop environment detected");
  }
});

db.on('connected', function() {
	console.log("Database connected successfully at " + serverconfig.db.host);
});

db.on('error', function(err){
  console.log("Mongoose default connection has occured " + err + " error");
});

db.on('disconnected', function(){
  console.log("Mongoose default connection is disconnected");
});

process.on('SIGINT', function(){
    db.close(function(){
        console.log("Mongoose default connection is disconnected due to application termination");
        process.exit(0)
    });
});
mongoose.Promise = global.Promise;


async function main() {
    var addresses = [
        {currency: "ETH", address: '0xde0b295669a9fd93d5f28d9ec85e40f4cb697bae', used: true},
        {currency: "BTC", address: '12v7iJGeyFau5WtdHJLgwEDQfpSi887cvj', used: true},
        {currency: "BCH", address: '1JN8ZRMxALcX4FL7QazE7byrKEQwYc9zsL', used: true},
        {currency: "LTC", address: 'LVXXmgcVYBZAuiJM3V99uG48o3yG89h2Ph', used: true},
    ];

    await addressModel.addMultiple(addresses);
    process.exit();
}


main();
