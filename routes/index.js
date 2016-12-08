'use strict';
var request = require('request');

const RippleAPI = require('ripple-lib').RippleAPI;
var rapi;

const HOST_URL = 'http://localhost:3000';   // TODO: use req.hostname to get this

// list of rippled websocket
var serverList = [
    {name: 'Public rippled server', websocket: 'wss://s1.ripple.com'},          // Public rippled server hosted by Ripple, Inc.
    {name: 'Ripple test net', websocket: 'wss://s.altnet.rippletest.net:51233'} // Ripple test net
];

// list of query commands
var commandList = [
    {name: 'getAccountInfo', command: 'account', params: ['address']},
    {name: 'getServerInfo', command: 'server', params: []},
    {name: 'getTransaction', command: 'transaction', params: ['id']},
    {name: 'getTransactions', command: 'transactions', params: ['address']},
    {name: 'getLedger', command: 'ledger', params: []},
    {name: 'getTrustlines', command: 'trustlines', params: ['address']},
    {name: 'getBalances', command: 'balances', params: ['address']},
    {name: 'getOrders', command: 'orders', params: ['address']}
];

var operationList = [
    {name: 'Get Account Data', path: '/queryAccount'},
    {name: 'Make Payment', path: '/makePayment'}
];

exports.displayServerList = function(req, res) {
    if (!rapi) {
        res.render('server', {servers: serverList})
    } else {
        res.redirect('/main');
    }
};

// callback function when a new ledger version is validated on the connected server
function onValidatedLedger(ledger) {
    console.log('!!!Validated ledger!!!');
    console.log(JSON.stringify(ledger, null, 2));
};

exports.connectToServer = function(req, res) {
    if (!rapi) {
        rapi = new RippleAPI({server: req.body.server});

        rapi.connect().then(() => {
            console.log('Connected to ' + req.body.server);
            res.redirect('/main');
        }).catch(err => {
            res.send('Cannot connect to ' + req.body.server + '!');
        });

        // listen to ledger event
        //rapi.on('ledger', onValidatedLedger);
    }
};

exports.main = function(req, res) {
    if (rapi && rapi.isConnected()) {
        res.render('main', {commands: commandList, operations: operationList});
    } else {
        res.send('Not yet connected to rippled server.');
    }
};

exports.query = function(req, res) {
    var command = commandList[req.params.commandIndex];
    console.log('query: ' + command.name);
    res.render('query', {hostURL: HOST_URL, command: command});
};

exports.submitQuery = function(req, res) {
    var commandIndex = parseInt(req.params.commandIndex);
    var command = commandList[commandIndex];

    var url = HOST_URL + '/q/' + command.command;
    var i;
    for (i = 0; i < command.params.length; i++) {
        url += '/';
        url += req.body[command.params[i]];
    }
    console.log("submit query: " + url);

    request(url, function(error, response, body) {
        if (!error) {
            if (response.statusCode == 200) {
                var bodyObject = JSON.parse(body);
                var bodyStr = JSON.stringify(bodyObject, null, '\t');
                var responseStr = response.statusCode + ' ' + response.statusMessage;
                res.render('query', {hostURL: HOST_URL, command: command, result: bodyStr, response: responseStr});
            } else {
                var responseStr = response.statusCode + ' ' + response.statusMessage;
                res.render('query', {hostURL: HOST_URL, command: command, result: response.body, response: responseStr});
            }
        } else {
            console.error(error);
            res.render('query', {hostURL: HOST_URL, command: command, response: error});
        }
    });
};

// wrapper functions to RippleAPI

exports.getAccountInfo = function(req, res, next) {
    console.log('getAccountInfo: ' + req.params.address);
    rapi.getAccountInfo(req.params.address).then(info => {
        res.send(info);
    }).catch(err => {
        next(err);
    });
};

exports.getServerInfo = function(req, res, next) {
    console.log('getServerInfo');
    rapi.getServerInfo().then(info => {
        res.send(info);
    }).catch(err => {
        next(err);
    });
};

exports.getTransaction = function(req, res, next) {
    console.log('getTransaction');
    rapi.getTransaction(req.params.id).then(info => {
        res.send(info);
    }).catch(err => {
        next(err);
    });
};

exports.getTransactions = function(req, res, next) {
    console.log('getTransactions');
    rapi.getTransactions(req.params.address).then(info => {
        res.send(info);
    }).catch(err => {
        next(err);
    });
};

exports.getLedger = function(req, res, next) {
    console.log('getLedger');
    rapi.getLedger().then(info => {
        res.send(info);
    }).catch(err => {
        next(err);
    });
};

exports.getTrustlines = function(req, res, next) {
    console.log('getTrustlines: ' + req.params.address);
    rapi.getTrustlines(req.params.address).then(info => {
        res.send(info);
    }).catch(err => {
        next(err);
    });
};

exports.getBalances = function(req, res, next) {
    console.log('getBalances: ' + req.params.address);
    rapi.getBalances(req.params.address).then(info => {
        res.send(info);
    }).catch(err => {
        next(err);
    });
};

exports.getOrders = function(req, res, next) {
    rapi.getOrders(req.params.address).then(info => {
        res.send(info);
    }).catch(err => {
        next(err);
    });
}

// middleware function to handle error

exports.handleError = function(err, req, res, next) {
    console.error(err);
    res.status(500);
    res.send(err.name + ': ' + err.message);
};

// middleware function to check ripple connection

exports.checkRippleConnection = function(req, res, next) {
    if (rapi && rapi.isConnected()) {
        next();
    } else {
        res.status(400);
        res.send('Not yet connected to ripple server.');
    }
};

exports.showQueryAccount = function(req, res) {
    var accountObject = new Object();
    accountObject.balances = [];
    accountObject.transactions = [];
    accountObject.orders = [];
    accountObject.trustlines = [];
    res.render('accountData', accountObject);
};

exports.queryAccount = function(req, res, next) {
    var address = req.body.address;
    var accountObject = new Object();
    accountObject.accountAddress = address;
    rapi.getBalances(address).then(info => {
        accountObject.balances = info;
        return rapi.getTransactions(address);
    }).then(transactions => {
        accountObject.transactions = transactions;
        return rapi.getOrders(address);
    }).then(info => {
        accountObject.orders = info;
        return rapi.getTrustlines(address);
    }).then(info => {
        accountObject.trustlines = info;

        console.log(accountObject);
        res.render('accountData', accountObject);
    }).catch(err => {
        next(err);
    });
};

exports.showMakePayment = function(req, res) {
    res.render('makePayment');
};

exports.makePayment = function(req, res, next) {
    const address = req.body.sourceAddress;
    const secret = req.body.sourceSecret;
    const payment = {
        'source': {
            'address': req.body.sourceAddress,
            'maxAmount': {
                'currency': req.body.currency,
                'value': req.body.amount
            }
        },
        'destination': {
            'address': req.body.destinationAddress,
            'amount': {
                'currency': req.body.currency,
                'value': req.body.amount
            }
        }
    };
    var result = new Object();
    console.log('preparePayment');
    rapi.preparePayment(address, payment).then(prepared => {
        console.log('sign');
        return rapi.sign(prepared.txJSON, secret);
    }).then(signed => {
        result.transactionID = signed.id;
        console.log('Transaction ID: ' + signed.id);
        console.log('submit');
        return rapi.submit(signed.signedTransaction);
    }).then(submitted => {
        console.log('Result code: ' + submitted.resultCode);
        console.log('Result message: ' + submitted.resultMessage);
        result.resultCode = submitted.resultCode;
        result.resultMessage = submitted.resultMessage;
        res.render('makePaymentResult', result);
    }).catch(err => {
        next(err);
    });
};