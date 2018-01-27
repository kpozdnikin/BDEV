var express = require('express'),
    app = express(),
    mongoose = require('mongoose'),
    bodyParser = require('body-parser'),
    cors = require('cors'),
    blockchainParser = require('./services/transactions-monitor/blockchainParser');

require('./lib/config_loader');
require('./lib/mail_helper');
require('./lib/audit_logger');
require('./api/models/icoModel');

import jwtMiddleware from './middlewares/jwtMiddleware';
import responseTimeMiddleware from './middlewares/responseTimeMiddleware';

if (config.sanityCheck) {
    try {
        config.sanityCheck()
    } catch (e) {
        console.log(e.message);
        process.exit(1)
    }
}
// mongoose instance connection url connection
mongoose.Promise = global.Promise;

// morgan basic request logging
var morgan = require('morgan');

var mongooseOptions = { useMongoClient: true,
                        user: config.db.user,
                        pass: config.db.password
                      };

if (process.env.DOCKER_COMPOSE) {
    console.log('Docker compose environment detected');
    mongooseOptions = { useMongoClient: true}
}

var connection = mongoose.connect(config.db.host, mongooseOptions, function() {
  if (process.env.NODE_ENV === 'development') {
    console.log("Develop environment detected");
  }
});

mongoose.connection.on('connected', function() {
	console.log("Database connected successfully");
});

mongoose.connection.on('error', function(err) {
  console.error("Mongoose default connection has occured " + err + " error");
});

mongoose.connection.on('disconnected', function(){
  console.error("Mongoose default connection is disconnected");
});

process.on('SIGINT', function(){
  mongoose.connection.close(function() {
    console.log("Mongoose default connection is disconnected due to application termination");
    process.exit(0);
  });
});


//static file folder
app.use(express.static('public'))


//sentry

var Raven = require('raven');

// Must configure Raven before doing anything else with it
Raven.config(config.sentry.dsn).install();

// The request handler must be the first middleware on the app
app.use(Raven.requestHandler());

// The error handler must be before any other error middleware
app.use(Raven.errorHandler());


// Start blockchain parsing scheduler
blockchainParser.start();


//CORS for all domains (*)
app.use(cors());
app.use(morgan('combined'));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

//custom middleware
app.use(jwtMiddleware);
app.use(responseTimeMiddleware);

var routes = require('./api/routes/icoRoutes'); //importing route
routes(app); //register the route

app.use(function(req, res) {
  res.status(404).send({url: req.originalUrl + ' not found'});
});

app.listen(config.app.port);

console.log('ico RESTful API server started on: ' + config.app.port);
