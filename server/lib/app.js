let env = require('dotenv').config();
env = require('dotenv-parse-variables')(env.parsed);
const {command, args} = require('command-line-commands')(['current', 'fetch', 'set', 'help']);
const client = new (require('./coinbase-client'))(env.COINBASE_API_BASE_URL, env.COINBASE_API_KEY, env.COINBASE_API_SECRET);

function filterRates(rates) {
    return Object.keys(rates).reduce(function(obj, key) {
        if(env.DISPLAY_RATES_FOR.some((c) => c === key))
            obj[key] = parseFloat(rates[key]);

        return obj;
        }, {});
}

function displayHelp() {
    throw new Error("Not implemented");
}

async function fetchCourses() {
    console.log(filterRates((await client.getExchangeRates(commandLineArgs.currency)).data.rates));
}

function displayCourses() {
    throw new Error("Not implemented");
}

function setCourses() {
    throw new Error("Not implemented");
}

async function main() {
    switch (command) {
        case "help":
            displayHelp();
            break;
        case "fetch":
            fetchCourses();
            break;
        case "set":
            console.log(command);
            break;
        default:
            console.log(`Unknow command: <${command}}>`);
            break;
    }
}

main();
