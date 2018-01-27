const url = require('url');
const transactionModel = require('./../models/transaction.model');
const transactions = {};

// controller that handles transactions listings.
transactions.getTransactions = function(req, res) {
  const skip = req.query.skip;
  const limit = req.query.limit;
  console.log('controller');
  const transactionsData = transactionModel.get(skip, limit);
  transactionsData.then((data) => {
    console.log('data = ', data);
    var response = {};
    response.status = 'success';
    response.data = data;
    res.send(response);
  }, (err) => {
    console.log('error while fetching transactions list', err);
    res.status(400);
    res.send(err);
  });
};

// controller that handles single transaction.
transactions.getOneTransaction = function (req, res) {
  const transactionId = req.params.transactionId;
  console.log('transactionId = ', transactionId);
  const transactionsData = transactionModel.getOne(transactionId);
  return transactionsData.then((data) =>{
    const response = {};
    response.status = 'success';
    response.data = data;
    res.send(response);
  }, (err) => {
    console.log('error while getting transaction by hash', err);
    res.status(400);
    res.send(err);
  });
};
// controller that add single transaction.
transactions.insertOneTransaction = function(req, res){
  const transaction = req.body;
  const transactionsData = transactionModel.insertOne(transaction);
  return transactionsData.then((data) => {
    const response = {};
    response.status = 'success';
    response.data = data;
    res.send(response);
  }, (err) => {
    console.log('error while inserting transaction', err);
    res.status(400);
    res.send(err);
  });
};

// controller that update single transaction.
transactions.updateOneTransaction = function(req, res){
  const transaction = req.body;
  const transactionsData = transactionModel.updateOne(transaction);
  return transactionsData.then((data) => {
    const response = {};
    response.status = 'success';
    response.data = data;
    res.send(response);
  }, (err) => {
    console.log('error while updating transaction', err);
    res.status(400);
    res.send(err);
  });
};

// controller that delete single transaction.
transactions.deleteOneTransaction = function(req, res){
  const transactionId = req.query.transactionId;
  const transactionsData = transactionModel.delete(transactionId);
  return transactionsData.then((data) => {
    var response = {};
    response.status = 'success';
    response.data = data;
    res.send(response);
  }, (err) => {
    console.log('error while deleting transaction', err);
    res.status(400);
    res.send(err);
  });
};

module.exports = transactions;
