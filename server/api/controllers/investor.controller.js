const url = require('url');
const investorModel = require('./../models/investor.model');
const investor = {};

// controller that handles investor listings.
investor.getInvestors = function(req, res) {
  const skip = req.query.skip;
  const limit = req.query.limit;
  console.log('controller');
  const investorData = investorModel.get(skip, limit);
  investorData.then((data) => {
    console.log('data = ', data);
    var response = {};
    response.status = 'success';
    response.data = data;
    res.send(response);
  }, (err) => {
    console.log('error while fetching investor list', err);
    res.status(400);
    res.send(err);
  });
};

// controller that handles single investor.
investor.getOneInvestor = function (req, res) {
  const investorId = req.params.investorId;
  console.log('investorId = ', investorId);
  const investorData = investorModel.getOne(investorId);
  return investorData.then((data) =>{
    const response = {};
    response.status = 'success';
    response.data = data;
    res.send(response);
  }, (err) => {
    console.log('error while getting investor by hash', err);
    res.status(400);
    res.send(err);
  });
};
// controller that add single investor.
investor.insertOneInvestor = function(req, res){
  const investor = req.body;
  const investorData = investorModel.insertOne(investor);
  return investorData.then((data) => {
    const response = {};
    response.status = 'success';
    response.data = data;
    res.send(response);
  }, (err) => {
    console.log('error while inserting investor', err);
    res.status(400);
    res.send(err);
  });
};

// controller that update single investor.
investor.updateOneInvestor = function(req, res){
  const investor = req.body;
  const investorData = investorModel.updateOne(investor);
  return investorData.then((data) => {
    const response = {};
    response.status = 'success';
    response.data = data;
    res.send(response);
  }, (err) => {
    console.log('error while updating investor', err);
    res.status(400);
    res.send(err);
  });
};

// controller that delete single investor.
investor.deleteOneInvestor = function(req, res){
  const investorId = req.query.investorId;
  const investorData = investorModel.delete(investorId);
  return investorData.then((data) => {
    var response = {};
    response.status = 'success';
    response.data = data;
    res.send(response);
  }, (err) => {
    console.log('error while deleting investor', err);
    res.status(400);
    res.send(err);
  });
};

module.exports = investor;
