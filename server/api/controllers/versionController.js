const fs = require('fs');
const appVersion = require(process.cwd() + '/package.json')['version'];

exports.versionInfo = function(req, res) {
    res.write('NODE_ENV=' + process.env.NODE_ENV + '\n\n');
    fs.readFile(process.cwd() + '/version', function(error, data) {
        if(!error) {
            res.write(data);
        } else {
            res.write(appVersion + '\n');
        }

        return res.end();
    });
};
