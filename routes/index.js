'use strict';

const RippleAPIDemo = require('./demo.js').RippleAPIDemo;
var demo = new RippleAPIDemo();

// middleware function to handle error
exports.handleError = function(err, req, res, next) {
    console.error(err);
    res.status(500);
    res.send(err.name + ': ' + err.message);
};

exports.displayServerList = (req, res) => demo.displayServerList(req, res);
exports.connectToServer = (req, res) => demo.connectToServer(req, res);
exports.disconnectServer = (req, res) => demo.disconnectServer(req, res);
exports.checkRippleConnection = (req, res, next) => demo.checkRippleConnection(req, res, next);

exports.main = (req, res) => demo.main(req, res);

exports.showAccountList = (req, res) => demo.showAccountList(req, res);
exports.addExistingAccount = (req, res) => demo.addExistingAccount(req, res);
exports.createAccount = (req, res) => demo.createAccount(req, res);

exports.queryAccount = (req, res, next) => demo.queryAccount(req, res, next);
exports.showQueryAccount = (req, res) => demo.showQueryAccount(req, res);

exports.showGetPaths = (req, res) => demo.showGetPaths(req, res);
exports.getPaths = (req, res, next) => demo.getPaths(req, res, next);

exports.showGetOrderbook = (req, res, next) => demo.showGetOrderbook(req, res, next);
exports.getOrderbook = (req, res) => demo.getOrderbook(req, res);

exports.showMakePayment = (req, res) => demo.showMakePayment(req, res);
exports.makePayment = (req, res, next) => demo.makePayment(req, res, next);

exports.showChangeSettings = (req, res) => demo.showChangeSettings(req, res);
exports.changeSettings = (req, res, next) => demo.changeSettings(req, res, next);

exports.showChangeTrustline = (req, res) => demo.showChangeTrustline(req, res);
exports.changeTrustline = (req, res, next) => demo.changeTrustline(req, res, next);

exports.showPlaceOrder = (req, res) => demo.showPlaceOrder(req, res);
exports.placeOrder = (req, res, next) => demo.placeOrder(req, res, next);
exports.showCancelOrder = (req, res) => demo.showCancelOrder(req, res);
exports.handleCancelOrderAction = (req, res, next) => demo.handleCancelOrderAction(req, res, next);

exports.query = (req, res) => demo.query(req, res);
exports.submitQuery = (req, res) => demo.submitQuery(req, res);

exports.getAccountInfo = (req, res, next) => demo.getAccountInfo(req, res, next);
exports.getServerInfo = (req, res, next) => demo.getServerInfo(req, res, next);
exports.getBalanceSheet = (req, res, next) => demo.getBalanceSheet(req, res, next);
exports.getTransaction = (req, res, next) => demo.getTransaction(req, res, next);
exports.getTransactions = (req, res, next) => demo.getTransactions(req, res, next);
exports.getLedger = (req, res, next) => demo.getLedger(req, res, next);
exports.getTrustlines = (req, res, next) => demo.getTrustlines(req, res, next);
exports.getBalances = (req, res, next) => demo.getBalances(req, res, next);
exports.getOrders = (req, res, next) => demo.getOrders(req, res, next);
exports.getSettings = (req, res, next) => demo.getSettings(req, res, next);