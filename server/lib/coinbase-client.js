const crypto = require('crypto');
const got = require('got');
const queryString = require('query-string');
var urljoin = require('url-join');

class CoinbaseClient {
    constructor(url, apiKey, apiSecret) {
        if(!url || !apiKey || !apiSecret)
            throw new Error(`Invalid configuration. Params supplied: url <${url || ""}>, apiKey <${apiKey || ""}>, apiSecret <${apiSecret || ""}>`);

        this._url = url;
        this._apiKey = apiKey;
        this._apiSecret = apiSecret;
    }

    _createSignature(timestamp, method, path, body) {
        return crypto.createHash('sha256').update(`${timestamp}${method}${path}${body || ""}`);
    }

    async getExchangeRates(currency, callback) {
        const relativePath = "exchange-rates";

        const timestamp = Date.now;
        const args = {
            headers: {
                "CB-ACCESS-KEY": this._apiKey,
                "CB-ACCESS-TIMESTAMP": timestamp,
                "CB-ACCESS-SIGN": this._createSignature(timestamp, "GET", relativePath),
                "CB-VERSION": "2017-12-13"
            }
        };

        const response = await got.get(urljoin(this._url, relativePath, `?${queryString.stringify({currency})}`), args);

        return JSON.parse(response.body || "");
    }
}

module.exports = CoinbaseClient;
