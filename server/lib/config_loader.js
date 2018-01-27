
global.config = loadConfig();

function loadConfig() {
    if (process.env.NODE_ENV === 'local' || process.env.NODE_ENV === 'localhost') {
        return require('../config/local')
    }
    return require('../config/config')
}
