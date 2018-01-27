const mongoose = require('mongoose');
const cron = require('node-cron');
const serverconfig = require('./../../config/config');
const config = require('./config');
var bc = require('./blockchain-api');
const bcModel = require('./../../api/models/blockchainstatus.model');
const addressModel = require('./../../api/models/blockchainaddresses.model');
const txModel = require('./../../api/models/transaction.model');
var Raven = require('raven');
var mutex = {};

function get_mutex() {
  try {
    var redis = require("redis");
    var client = redis.createClient(serverconfig.redis.port, serverconfig.redis.host);

    client.on('error', function (err) {
      console.log('redis error: ' + err);
      Raven.captureException(err);

      client.quit();
      mutex = require( 'node-mutex' ) || {};
    });

    client.on('ready', function() {
      console.log('redis is ready');
      client.quit();
      mutex = require( 'node-mutex' ) ({sleepTime: 1000, host: serverconfig.redis.host, port: serverconfig.redis.port});
    });
  } catch (e) {
    console.log('redis error: ' + e);
  }
};

get_mutex();

exports.start = async function () {
    startParsingJobs();
};

exports.stop = async function () {
    stopParsingJobs();
};

// Globals that control download state
var totalAddresses = 0;
var lastAddress = 0;
var batchSize = 100;
var parsingJob;

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


async function SaveTransaction(tx) {
    var existing = [];
    try {
        existing = await txModel.getOne(tx._id);
    } catch (e) {
        if (e.error.indexOf("Invalid transaction hash supplied") == -1)
            throw e;
    }

    if (existing.length == 0)
        await txModel.insertOne(tx);
}

async function DownloadETHTask(addr) {

    try {
        // Get last reading status
        var status = await bcModel.get('ETH' + addr);
        var lastItem = 0;

        if (status === false) {
            // First time for this address
            var statusUpdate = {_id: 'ETH' + addr, totalItems: 0, lastItem: '0'};
            await bcModel.set(statusUpdate);
        } else {
            lastItem = parseInt(status.lastItem);

        }

        var firstPage = lastItem; // first page to read
        var pageCount = 10;
        var failCount = 0;
        var totalPagesProcessed = 0;
        var hardLimit = 100;

        while (totalPagesProcessed < hardLimit) {
            console.log("Reading pages from " + lastItem + " to " + (lastItem+pageCount));

            try {
                // Read a batch of transactions
                var transactions = await bc.getETHTransactions(addr, firstPage, pageCount, config.etherscanApiKey);

                // Save to DB
                const len = transactions.length;
                console.log("Saving to DB");
                for (var i=0; i<len; i++) {
                    const tx = {
                        _id: transactions[i].hash, // Blockchain transactions hash
                        sender: '', // unknown
                        receiver: addr, // to address
                        date: new Date(transactions[i].time * 1000),
                        amount: transactions[i].amount,
                        currency: "ETH",
                        raw_data: transactions[i].raw_data,
                    };

                    // Save to DB
                    await SaveTransaction(tx);
                }

                // Update status
                lastItem += pageCount;
                totalPagesProcessed += pageCount;
                var statusUpdate = {_id: 'ETH' + addr, totalItems: 0, lastItem: lastItem.toString()};
                await bcModel.set(statusUpdate);
            } catch (e) {
                if (e.message.indexOf("End") != -1) { // Done, parsed all transactions
                    console.log('ETH download task finished');
                    return;
                }
                failCount++;
            }

            if (failCount > 10) return;
        }
    } catch (e) {
        console.log("Error in DownloadETHTask", e);
    }
}

async function DownloadBTCTask(addr) {
    try {
        // Get last reading status
        var status = await bcModel.get('BTC' + addr);
        var btcTxCount = await bc.getBTCTransactionCount(addr);
        var lastItem = 0;

        if (status === false) {
            // First time for this address
            var statusUpdate = {_id: 'BTC' + addr, totalItems: btcTxCount, lastItem: '0'};
            await bcModel.set(statusUpdate);
        } else {
            lastItem = parseInt(status.lastItem);
        }
        console.log("BTC Transaction count: " + btcTxCount);

        var skip = lastItem;
        var limit = 10;
        var failCount = 0;

        while (skip < btcTxCount) {
            console.log("Reading from " + skip + " to " + (skip+10));

            try {
                // Read a batch of transactions
                var transactions = await bc.getBTCTransactions(addr, skip, limit);

                // Save to DB
                const len = transactions.length;
                console.log("Saving to DB");
                for (var i=0; i<len; i++) {
                    const tx = {
                        _id: transactions[i].hash, // Blockchain transactions hash
                        sender: '', // unknown
                        receiver: addr, // to address
                        date: new Date(transactions[i].time * 1000),
                        amount: transactions[i].amount,
                        currency: "BTC",
                        raw_data: transactions[i].raw_data,
                    };

                    // Save to DB
                    await SaveTransaction(tx);
                }

                // Update status
                lastItem += limit;
                skip = lastItem;
                var statusUpdate = {_id: 'BTC' + addr, totalItems: btcTxCount, lastItem: lastItem.toString()};
                await bcModel.set(statusUpdate);
            } catch (e) {
                failCount++;
            }

            if (failCount > 10) return;
        }
    } catch (e) {
        console.log("Error in DownloadBTCTask", e);
    }
    console.log('BTC download task finished');
}

async function DownloadBCHTask(addr) {
    try {
        // Get last reading status
        var status = await bcModel.get('BCH' + addr);
        var totalPageCount = await bc.getBCHPageCount(addr);
        var lastItem = 0;

        if (status === false) {
            // First time for this address
            var statusUpdate = {_id: 'BCH' + addr, totalItems: totalPageCount, lastItem: '0'};
            await bcModel.set(statusUpdate);
            console.log("BCH initial status set");
        } else {
            lastItem = parseInt(status.lastItem);
            console.log("BCH lastItem = " + lastItem);
        }
        console.log("BCH Page count: " + totalPageCount);

        var page = lastItem;
        var failCount = 0;

        while (page < totalPageCount) {
            console.log("Reading page " + page);

            try {
                // Read a batch of transactions
                var transactions = await bc.getBCHTransactions(addr, page);

                // Save to DB
                const len = transactions.length;
                console.log("Saving to DB");
                for (var i=0; i<len; i++) {
                    const tx = {
                        _id: transactions[i].hash, // Blockchain transactions hash
                        sender: '', // unknown
                        receiver: addr, // to address
                        date: new Date(transactions[i].time * 1000),
                        amount: transactions[i].amount,
                        currency: "BCH",
                        raw_data: transactions[i].raw_data,
                    };

                    // Save to DB
                    await SaveTransaction(tx);
                }

                // Update status
                page += 1;
                var statusUpdate = {_id: 'BCH' + addr, totalItems: totalPageCount, lastItem: page.toString()};
                await bcModel.set(statusUpdate);
            } catch (e) {
                failCount++;
            }

            if (failCount > 10) return;
        }
    } catch (e) {
        console.log("Error in DownloadBCHTask", e);
    }
    console.log('BCH download task finished');
}


/**
* Read all (new) LTC transactions to an address
*
* Because block.io only allows reading transactions _before_ a transaction hash, i.e.
* older than certain transaction, fragmets of new transactions may remain unread, so
* the best approach is to read all transactions and check which ones are in the DB
* to avoid duplicates
*
* @param addr - address to query
*/
async function DownloadLTCTask(addr) {
    try {
        // Get last reading status
        var status = await bcModel.get('LTC' + addr);
        var lastItem = 0;

        if (status === false) {
            // First time for this address
            var statusUpdate = {_id: 'LTC' + addr, totalItems: 0, lastItem: ''};
            await bcModel.set(statusUpdate);
            console.log("LTC initial status set");
        } else {
            lastItem = status.lastItem;
            console.log("LTC lastItem = " + lastItem);
        }

        var failCount = 0;

        var lastReadTransactions = 2; // Last is always read, so lastReadTransactions will be euqual to 1 after the last iteration
        while (lastReadTransactions > 1) {
            console.log("Reading transactions before " + lastItem);

            try {
                // Read a batch of transactions
                var transactions = [];
                if (lastItem.length > 0) {
                    transactions = await bc.getLTCTransactions(addr, config.blockIoApiKeyLTC, lastItem);
                } else {
                    transactions = await bc.getLTCTransactions(addr, config.blockIoApiKeyLTC);
                }
                lastReadTransactions = transactions.length;

                console.log("LTC lastReadTransactions = " + lastReadTransactions);

                // Save to DB
                const len = transactions.length;
                console.log("Saving to DB");
                for (var i=0; i<len; i++) {
                    const tx = {
                        _id: transactions[i].hash, // Blockchain transactions hash
                        sender: transactions[i].address, //
                        receiver: addr, // to address
                        date: new Date(transactions[i].time * 1000),
                        amount: transactions[i].amount,
                        currency: "LTC",
                        raw_data: transactions[i].raw_data,
                    };

                    // Save to DB
                    await SaveTransaction(tx);
                }

                // Update status
                var statusUpdate = {_id: 'LTC' + addr, totalItems: 0, lastItem: lastItem};
                if (transactions.length > 0) {
                    lastItem = transactions[transactions.length-1].hash;
                    statusUpdate.lastItem = transactions[transactions.length-1].hash;
                }

                // If we are at the end, start over next time. See the comment in the method description
                if (lastReadTransactions == 1) {
                    statusUpdate.lastItem = '';
                }
                await bcModel.set(statusUpdate);
            } catch (e) {
                failCount++;
                console.log("Error, increasing fail count: ", e);
            }

            if (failCount > 10) return;
        }
    } catch (e) {
        console.log("Error in DownloadLTCTask", e);
    }
    console.log('LTC download task finished');
}

async function batchDownloadTask() {

  // Do not allow concurrent batch tasks
  if(mutex.lock) {
    mutex.lock('batchDownloadTaskKey', async function (err, unlock) {

      try {
        if (err) {
          console.error(err);
          console.error('Unable to acquire lock');

        }

        // synchronized code block
        if (totalAddresses == 0) {
          totalAddresses = await addressModel.getCount();
          console.log('Address count: ' + totalAddresses);
        }

        if (totalAddresses > 0) {
          var addressBatch = await addressModel.readBatch(lastAddress, batchSize);
          lastAddress += batchSize;

          // Check if we went through the full list and need to restart
          // next time when this method is called
          if (lastAddress >= totalAddresses) {
            lastAddress = 0;
            totalAddresses = 0;
          }

          // Start download tasks
          var len = addressBatch.length;
          console.log('Starting download tasks for ' + len + ' addresses');
          var tasks = []
          for (var i = 0; i < len; i++) {
            switch (addressBatch[i].currency) {
              case "ETH":
                tasks.push(DownloadETHTask(addressBatch[i].address));
                break;
              case "BTC":
                tasks.push(DownloadBTCTask(addressBatch[i].address));
                break;
              case "BCH":
                tasks.push(DownloadBCHTask(addressBatch[i].address));
                break;
              case "LTC":
                tasks.push(DownloadLTCTask(addressBatch[i].address));
                break;
            }
          }
          console.log('Download tasks: ' + tasks.length);
          await Promise.all(tasks);
          console.log('All download tasks finished');
        }
      } catch (e) {
        console.log('Error in batchDownloadTask: ', e);
      } finally {
        unlock();
      }
    });
  }
}

async function startParsingJobs() {
    console.log('Running blockchain batch parsers now and then every 5 minutes');

    await batchDownloadTask();
    parsingJob = cron.schedule('*/5 * * * *', function(){
        batchDownloadTask();
    }, false);
    parsingJob.start();
}

function stopParsingJobs() {
    parsingJob.stop();
    parsingJob.destroy();
    console.log('Parsing jobs stopped');
}

async function test() {
    await DownloadETHTask('0xde0b295669a9fd93d5f28d9ec85e40f4cb697bae');
    process.exit();
}

//test();
startParsingJobs();
