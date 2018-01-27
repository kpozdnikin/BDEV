const http = require('http');
const https = require('https');
const delay = require('delay');

//export { default as getBTCTransactions };
exports.getETHTransactions = async function (addr, offset, limit) {
    return getETHTransactions(addr, offset, limit);
};
exports.getBTCTransactionCount = async function (addr) {
    return getBTCTransactionCount(addr);
};
exports.getBTCTransactions = async function (addr, offset, limit) {
    return getBTCTransactions(addr, offset, limit);
};
exports.getBCHPageCount = async function (addr) {
    return getBCHPageCount(addr);
};
exports.getBCHTransactions = async function (addr, page) {
    return getBCHTransactions(addr, page);
};
exports.getLTCTransactions = async function (addr, beforeTxHash, apiKey) {
    return getLTCTransactions(addr, beforeTxHash, apiKey);
};

const ethBaseUrl = 'https://api.etherscan.io/api?module=account&action=txlist';
const btcBaseUrl = 'https://blockchain.info/rawaddr/';
const bchBaseUrl = 'https://bitcoincash.blockexplorer.com/api/txs';
const ltcBaseUrl = 'https://block.io/api/v2/get_transactions/';

/**
* Returns array of incoming IVEP transactions for a BTC address
* Allows paging
*
* IVEP transaction is different than BTC transaction. One BTC transaction
* may contain 0 to many IVEP transactions.
*
* IVEP Transaction object schema:
*
* ┬[transactions]
* |├─hash      // tx hash (not unique)
* |├─nonce     // input nonce, (hash, nonce) is a unique pair
* │├─address   // address
* │├─amount    // Satoshi value received
* │├─timestamp // sync timestamp
* │├─source    // tx source: (BTC | BCH | LTC | ETH | USD | CAD |
* │└─raw_data  // tx raw data as json object
*
* @param addr - address to search
* @param firstPage - first page to return
* @param pageCount - how many pages to return
* @param apiKey - API key for etherscan
*/
async function getETHTransactions(addr, firstPage, pageCount, apiKey) {
    let url = ethBaseUrl + '&address=' + addr + '&startblock=0&endblock=99999999' + '&page=' + firstPage + '&offset=' + pageCount + '&sort=asc&apikey=' + apiKey;
    let retArray = [];
    var index = 0;
    var res = '';

    res = await doRequest(url);

    if (res.message == "No transactions found")
        throw new Error("End");

    if (res != '') {
        // Parse transactions
        if (res.result) {
            const txlen = res.result.length;
            for (var i = 0; i < txlen; i++) {
                if (res.result[i].to == addr) {
                    const transaction = {
                        hash: res.result[i].hash,
                        nonce: res.result[i].nonce,
                        address: res.result[i].from,
                        amount: res.result[i].value,
                        timestamp: res.result[i].timeStamp,
                        source: 'ETH',
                        raw_data: res.result[i],
                    };
                    retArray[index] = transaction;
                    index += 1;
                }
            }
            return retArray;
        }
    }

    throw new Error("Request error");
}

/**
* Return total transaction count for a given BTC address
*/
async function getBTCTransactionCount(addr) {
    let url = btcBaseUrl + addr + '?format=json&offset=0&limit=1';
    const res = await doRequest(url);
    if (res != '') {
        // save total number of transactions
        if (res.n_tx) {
            return res.n_tx;
        }
    }
    throw new Error('Request error: Empty response');
}


/**
* Returns array of incoming IVEP transactions for a BTC address
* Allows paging
*
* IVEP transaction is different than BTC transaction. One BTC transaction
* may contain 0 to many IVEP transactions.
*
* IVEP Transaction object schema:
*
* ┬[transactions]
* |├─hash      // tx hash (not unique)
* |├─nonce     // input nonce, (hash, nonce) is a unique pair
* │├─address   // address
* │├─amount    // Satoshi value received
* │├─timestamp // sync timestamp
* │├─source    // tx source: (BTC | BCH | LTC | ETH | USD | CAD |
* │└─raw_data  // tx raw data as json object
*
* @param addr - address to search
* @param offset - how many BTC transactions to skip in the search
* @param limit - how many BTC transactions to parse
*/
async function getBTCTransactions(addr, offset, limit) {
    let url = btcBaseUrl + addr + '?format=json&offset=' + offset + '&limit=' + limit;
    let retArray = [];
    var index = 0;
    var res = '';
    var requestFinished = false;

    while (!requestFinished) {
        try {
            res = await doRequest(url);
            requestFinished = true;
        } catch (e) {
            if (e.toString().indexOf("Maximum concurrent requests for this endpoint reached.") != -1) {
                // Delay and repeat
                console.log('Maximum concurrent requests for this endpoint reached... Waiting 5 seconds...');
                await delay(5000);
                console.log('Continue');
            } else {
                requestFinished = true; // failure
            }
        }
    }

    if (res != '') {
        // Parse transactions
        if (res.txs) {
            const txlen = res.txs.length;
            for (var i = 0; i < txlen; i++) {
                if (res.txs[i].out) {

                    // Iterate all "out"'s in this transaction. Each out with matching "to" address will be one transaction in the result
                    const outlen = res.txs[i].out.length;
                    for (var j = 0; j < outlen; j++) {
                        if (res.txs[i].out[j].addr == addr) {
                            const transaction = {
                                hash: res.txs[i].hash,
                                nonce: res.txs[i].out[j].n,
                                address: res.txs[i].out[j].addr,
                                amount: res.txs[i].out[j].value,
                                timestamp: res.txs[i].time,
                                source: 'BTC',
                                raw_data: res.txs[i],
                            };
                            retArray[index] = transaction;
                            index += 1;
                        }
                    }
                }
            }
            return retArray;
        }
    }

    throw new Error("Request error");
}


/**
* Returns total number of transaction pages for a given BCH address
*/
async function getBCHPageCount(addr) {
    let url = bchBaseUrl + '?address=' + addr + '&pageNum=0';

    const res = await doRequest(url);
    if (res != '') {
        // save total number of pages
        if (res.pagesTotal) {
            return res.pagesTotal;
        }
    }

    throw new Error('Request error: Empty response');
}

/**
* Returns array of incoming IVEP transactions for a BCH address
* Allows paging
*
* IVEP transaction is different than BCH transaction. One BCH transaction
* may contain 0 to many IVEP transactions.
*
* IVEP Transaction object schema:
*
* ┬[transactions]
* |├─hash      // tx hash (not unique)
* |├─nonce     // input nonce, (hash, nonce) is a unique pair
* │├─address   // address
* │├─amount    // Satoshi value received
* │├─timestamp // sync timestamp
* │├─source    // tx source: (BTC | BCH | LTC | ETH | USD | CAD |
* │└─raw_data  // tx raw data as json object
*
* @param addr - address to search
* @param page - page number
*/
async function getBCHTransactions(addr, page) {
    let url = bchBaseUrl + '?address=' + addr + '&pageNum=' + page;
    let retArray = [];
    var index = 0;

    const res = await doRequest(url);
    if (res != '') {
        // Parse transactions
        if (res.txs) {
            const txlen = res.txs.length;
            for (var i = 0; i < txlen; i++) {
                if (res.txs[i].vout) {

                    // Iterate all "out"'s in this transaction. Each out with matching "to" address will be one transaction in the result
                    const outlen = res.txs[i].vout.length;
                    for (var j = 0; j < outlen; j++) {
                        if (res.txs[i].vout[j].scriptPubKey.addresses.length != 1)
                            throw new Error('More than one recipient, cant resolve.');

                        if (res.txs[i].vout[j].scriptPubKey.addresses[0] == addr) {
                            const transaction = {
                                hash: res.txs[i].txid,
                                nonce: res.txs[i].vout[j].n,
                                address: addr,
                                amount: res.txs[i].vout[j].value,
                                timestamp: res.txs[i].time,
                                source: 'BCH',
                                raw_data: res.txs[i],
                            };
                            retArray[index] = transaction;
                            index += 1;
                        }
                    }
                }
            }
        }
        return retArray;
    }
    throw new Error('Request error: Empty response');
}


/**
* Returns array of up to 25 incoming IVEP transactions for an LTC address
* that come after beforeTxHash transaction
*
* IVEP transaction is different than LTC transaction. One LTC transaction
* may contain 0 to many IVEP transactions.
*
* IVEP Transaction object schema:
*
* ┬[transactions]
* |├─hash      // tx hash (not unique)
* |├─nonce     // input nonce, (hash, nonce) is a unique pair
* │├─address   // address - sender address (for LTC)
* │├─amount    // Satoshi value received
* │├─timestamp // sync timestamp
* │├─source    // tx source: (BTC | BCH | LTC | ETH | USD | CAD |
* │└─raw_data  // tx raw data as json object
*
* @param addr - address to search
* @param apiKey - API key for block.io
* @param beforeTxHash - hash of last transaction received in previous call of this method
*/
async function getLTCTransactions(addr, apiKey, beforeTxHash) {
    let url = ltcBaseUrl + '?api_key=' + apiKey + '&type=received&addresses=' + addr + (typeof beforeTxHash === "undefined" ? '' : '&before_tx=' + beforeTxHash);

    let retArray = [];
    var index = 0;

    const res = await doRequest(url);
    if (res != '') {

        // Parse transactions
        if (res.data && res.data.txs) {
            const txlen = res.data.txs.length;
            for (var i = 0; i < txlen; i++) {

                if (res.data.txs[i].senders.length != 1)
                    throw new Error('More than one sender, cant resolve.');

                if (res.data.txs[i].amounts_received) {
                    if (res.data.txs[i].amounts_received[0].recipient == addr) {
                        const transaction = {
                            hash: res.data.txs[i].txid,
                            nonce: 0,
                            address: res.data.txs[i].senders[0],
                            amount: res.data.txs[i].amounts_received[0].amount,
                            timestamp: res.data.txs[i].time,
                            source: 'LTC',
                            raw_data: res.data.txs[i],
                        };
                        retArray[index] = transaction;
                        index += 1;
                    }
                }
            }
        }

        // bloc.io free account only allows 3 requests per second
        await delay(334);

        return retArray;
    }

    throw new Error('Request error: Empty response');
}

function doRequest(url) {
    return new Promise((resolve, reject) => {
        let req = https.get(url, (res) => {
            let response = '';
            res.on('data', (chunk) => {
                response += chunk;
            });
            res.on('end', () => {
                try {
                    resolve(JSON.parse(response));
                } catch (e) {
                    reject(e);
                }

            });
            req.end();
            req.on('error', err => {
                reject(err);
            });
        });
    });
}
