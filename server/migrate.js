require('./lib/config_loader');
const migrator = require('./lib/migrator');
const mongoose = require('mongoose');

var mongooseOptions = {
  useMongoClient: true,
  user: config.db.user,
  pass: config.db.password
};

mongoose.connect(config.db.host, mongooseOptions);

migrator.runMigration();
