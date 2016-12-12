'use strict';
var request = require('request');
var fs = require('fs');

const RippleAPI = require('ripple-lib').RippleAPI;
var rapi;

const HOST_URL = 'http://localhost:3000';   // TODO: use req.hostname to get this
const ACCOUNT_DATA_MAX_TRANSACTIONS = 10;
const ACCOUNT_FILE_PATH = 'account.txt';

// list of rippled websocket
var serverList = [
    {name: 'Public rippled server 1 - General purpose', websocket: 'wss://s1.ripple.com'},  // Public rippled server hosted by Ripple, Inc. (general purpose server)
    {name: 'Public rippled server 2 - Full history', websocket: 'wss://s2.ripple.com'},     // Public rippled server hosted by Ripple, Inc. (full-history server)
    {name: 'Ripple test net', websocket: 'wss://s.altnet.rippletest.net:51233'}             // Ripple test net
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
    {name: 'getOrders', command: 'orders', params: ['address']},
    {name: 'getSettings', command: 'settings', params: ['address']}
];

var operationList = [
    {name: 'Manage Accounts', path: '/manageAccounts'},
    {name: 'Get Account Data', path: '/queryAccount'},
    {name: 'Make Payment', path: '/transaction/payment'},
    {name: 'Change Settings', path: '/transaction/settings'},
    {name: 'Change Trustline', path: '/transaction/trustline'}
];

// custom classes
var AccountData = function(address) {
    this.accountAddress = address;
    this.balances = [];
    this.transactions = [];
    this.orders = [];
    this.trustlines = [];
};

var Account = function(name, address, secret) {
    this.name = name;
    this.address = address;
    this.secret = secret;
};

var accountList = [];

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

            // read ACCOUNT_FILE_PATH
            fs.readFile(ACCOUNT_FILE_PATH, function(err, data) {
                if (err) {
                    console.error(err);
                } else {
                    var accountData = data.toString().split('},');
                    var i;
                    for (i = 0; i < accountData.length; i++) {
                        var str = accountData[i].replace(/\r?\n/g, '');
                        if (i < accountData.length - 1) {
                            str += '}';
                        }
                        var record = JSON.parse(str);
                        accountList.push(record);
                    }
                }
                res.redirect('/main');
            });

            // listen to ledger event
            //rapi.on('ledger', onValidatedLedger);

        }).catch(err => {
            console.log(err);
            res.send('Cannot connect to ' + req.body.server + '!');
        });
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
    const address = req.params.address;
    var options;
    if (req.query.limit) {
        options = new Object();
        options.limit = parseInt(req.query.limit);
    }
    rapi.getTransactions(address, options).then(info => {
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
};

exports.getSettings = function(req, res, next) {
    rapi.getSettings(req.params.address).then(info => {
        res.send(info);
    }).catch(err => {
        next(err);
    });
};

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

// operation: manager accounts

exports.showAccountList = function(req, res) {
    res.render('accountList', {'accounts': accountList});
};

function checkAccountExistence(newAccount) {
    var error;
    var i;
    for (i = 0; i < accountList.length; i++) {
        var account = accountList[i];
        if (account.name == newAccount.name) {
            error = 'Name already exists';
            break;
        }
        if (account.address == newAccount.address) {
            error = 'Address already exists';
            break;
        }
    }
    return error;
}

function addAccountToList(newAccount) {
    var error;
    accountList.push(newAccount);

    // write to ACCOUNT_FILE_PATH
    try {
        var str = '';
        for (i = 0; i < accountList.length; i++) {
            var account = accountList[i];
            str += JSON.stringify(accountList[i], null, 2);
            if (i < accountList.length - 1) {
                str += ',\n';
            }
        }
        fs.writeFileSync(ACCOUNT_FILE_PATH, str);
    } catch (err) {
        error = 'Account created (' + newAccount.address + ')' + ' but cannot write to file ' + ACCOUNT_FILE_PATH + '.';
    }
    return error;
};

exports.addExistingAccount = function(req, res) {
    var newAccount = new Account(req.body.name, req.body.address, req.body.secret);
    var error = checkAccountExistence(newAccount);
    if (!error) {
         error = addAccountToList(newAccount);
    }
    res.render('accountList', {'accounts': accountList, 'errorMessage': error});
};

exports.createAccount = function(req, res) {
    // generate address
    var newAddress = rapi.generateAddress();

    var newAccount = new Account(req.body.newAccountName, newAddress.address, newAddress.secret);
    var error = checkAccountExistence(newAccount);
    if (error) {
        res.render('accountList', {'accounts': accountList, 'errorMessage': error});
        return;
    }

    // send payment to new account
    const sourceAccount = accountList[req.body.sourceAccount];
    const currency = 'XRP';
    const amount = req.body.newAccountAmount;
    const payment = {
        'source': {
            'address': sourceAccount.address,
            'maxAmount': {
                'currency': currency,
                'value': amount
            }
        },
        'destination': {
            'address': newAccount.address,
            'amount': {
                'currency': currency,
                'value': amount
            }
        }
    };
    var result = new Object();
    console.log('preparePayment');
    rapi.preparePayment(sourceAccount.address, payment).then(prepared => {
        console.log('prepare:');
        console.log(prepared);
        console.log('sign');
        return rapi.sign(prepared.txJSON, sourceAccount.secret);
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

        var error;
        if (result.resultCode != 'tesSUCCESS') {
            error = 'Account is not created (' + result.resultCode + ': ' + result.resultMessage + ').';
        } else {
            error = addAccountToList(newAccount);
        }
        res.render('accountList', {'accounts': accountList, 'errorMessage': error});
    }).catch(err => {
        var error = 'Failed to create account (' + err.name + ': ' + err.message + ')';
        res.render('accountList', {'accounts': accountList, 'errorMessage': error});       
    });
};

// operation: query account data

exports.showQueryAccount = function(req, res) {
    var pugParam = {
        'data': new AccountData(),
        'maxTransactions': ACCOUNT_DATA_MAX_TRANSACTIONS,
        'accountList': accountList
    };
    res.render('accountData', pugParam);
};

exports.queryAccount = function(req, res, next) {
    const address = req.body.address ? req.body.address : accountList[req.body.account].address;
    var pugParam = {
        'data': new AccountData(address),
        'maxTransactions': ACCOUNT_DATA_MAX_TRANSACTIONS,
        'accountList': accountList
    };
    rapi.getBalances(address).then(info => {
        pugParam.data.balances = info;
        var options = {'limit': ACCOUNT_DATA_MAX_TRANSACTIONS};
        return rapi.getTransactions(address, options);
    }).then(transactions => {
        pugParam.data.transactions = transactions;
        return rapi.getOrders(address);
    }).then(info => {
        pugParam.data.orders = info;
        return rapi.getTrustlines(address);
    }).then(info => {
        pugParam.data.trustlines = info;
        res.render('accountData', pugParam);
    }).catch(err => {
        pugParam.error = err;
        res.render('accountData', pugParam);
    });
};

// transaction operation: payment

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
                'currency': req.body.sourceCurrency,
                'value': req.body.sourceMaxAmount
            }
        },
        'destination': {
            'address': req.body.destinationAddress,
            'amount': {
                'currency': req.body.destinationCurrency,
                'value': req.body.destinationAmount
            }
        }
    };
    if (req.body.sourceCurrency != 'XRP' && req.body.sourceCounterparty) {
        payment.source.maxAmount.counterparty = req.body.sourceCounterparty;
    }
    if (req.body.destinationCurrency != 'XRP' && req.body.destinationCounterparty) {
        payment.destination.amount.counterparty = req.body.destinationCounterparty;
    }
    var result = new Object();
    console.log('preparePayment');
    rapi.preparePayment(address, payment).then(prepared => {
        console.log('prepare:');
        console.log(prepared);
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
        res.render('transactionResult', result);
    }).catch(err => {
        next(err);
    });
};

// transaction operation: settings

exports.showChangeSettings = function(req, res) {
    res.render('changeSettings');
};

exports.changeSettings = function(req, res, next) {
    const address = req.body.address;
    const secret = req.body.secret;
    const settings = {
        'defaultRipple': req.body.defaultRipple ? true : false
    };
    var result = new Object();
    console.log('prepareSettings');
    rapi.prepareSettings(address, settings).then(prepared => {
        console.log('prepare:');
        console.log(prepared);
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
        res.render('transactionResult', result);
    }).catch(err => {
        next(err);
    });
};

// transaction operation: trustline

exports.showChangeTrustline = function(req, res) {
    res.render('changeTrustline', {'accountList': accountList});
};

exports.changeTrustline = function(req, res, next) {
    const address = req.body.address ? req.body.address : accountList[req.body.account].address;
    const secret = req.body.secret ? req.body.address : accountList[req.body.account].secret;
    const trustline = {
        'currency': req.body.currency,
        'counterparty': req.body.counterparty ? req.body.counterparty : accountList[req.body.counterpartyAccount].address,
        'limit': req.body.limit
    };
    var result = new Object();
    console.log('prepareSettings');
    rapi.prepareTrustline(address, trustline).then(prepared => {
        console.log('prepare:');
        console.log(prepared);
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
        res.render('transactionResult', result);
    }).catch(err => {
        next(err);
    });
};

// transaction operation: order

exports.showChangeOrder = function(req, res) {
    res.render('changeSettings');
};

exports.changeOrder = function(req, res, next) {
    const address = req.body.address;
    const secret = req.body.secret;
    const settings = {
        'defaultRipple': req.body.defaultRipple ? true : false
    };
    var result = new Object();
    console.log('prepareSettings');
    rapi.prepareSettings(address, settings).then(prepared => {
        console.log('prepare:');
        console.log(prepared);
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
        res.render('transactionResult', result);
    }).catch(err => {
        next(err);
    });
};