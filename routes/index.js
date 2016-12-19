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
    {name: 'Get Order Book', path: '/getOrderbook'},
    {name: 'Get Paths', path: '/getPaths'},
    {name: 'Make Payment', path: '/transaction/payment'},
    {name: 'Place Order', path: '/transaction/order'},
    {name: 'Change Settings', path: '/transaction/settings'},
    {name: 'Change Trustline', path: '/transaction/trustline'}
];

// custom classes
var AccountData = function(name, address) {
    this.accountName = name;
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
var accountAddressNameMap = new Object();

// helper function to get account name by its address
function getAccountNameByAddress(address) {
    if (accountAddressNameMap.hasOwnProperty(address)) {
        return accountAddressNameMap[address];
    } else {
        return address;
    }
};

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
                        var account = new Account(record.name, record.address, record.secret);
                        accountList.push(record);
                        accountAddressNameMap[record.address] = record.name;
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

// helper function to sign and submit a prepared transaction

const TRANSACTION_QUERY_RESULT_INTERVAL = 1000; // 1 second
const TRANSACTION_MAX_LEDGER_VERSION_OFFSET = 3;

function queryTransactionFinalResult(transactionID, ledgerVersionOptions) {
    console.log('Query transaction final result');

    return rapi.getTransaction(transactionID, ledgerVersionOptions).then(info => {
        return Promise.resolve(info.outcome);
    }).catch(err => {
        // transaction cannot be found, wait and query again
        if (err instanceof rapi.errors.PendingLedgerVersionError) {
            return new Promise((resolve, reject) => {
                setTimeout(() => {
                    queryTransactionFinalResult(transactionID, ledgerVersionOptions).then(outcome => {
                        resolve(outcome);
                    }).catch(err => {
                        reject(err);
                    });
                }, TRANSACTION_QUERY_RESULT_INTERVAL);
            });
        } else {
            return Promise.reject(err);
        }
    });
}

function signAndSubmitTransaction(preparedTransaction, accountSecret) {
    console.log('prepare:');
    console.log(preparedTransaction);
    console.log('sign');

    var result = new Object();

    var signed = rapi.sign(preparedTransaction.txJSON, accountSecret);
    result.transactionID = signed.id;
    console.log('Transaction ID: ' + signed.id);
    console.log('submit');

    return rapi.getLedgerVersion().then(ledgerVersion => {
        result.ledgerVersionOptions = {
            'minLedgerVersion': ledgerVersion,
            'maxLedgerVersion': preparedTransaction.instructions.maxLedgerVersion
        }
        return rapi.submit(signed.signedTransaction);
    }).then(submitted => {
        console.log('Preliminary result code: ' + submitted.resultCode);
        console.log('Preliminary result message: ' + submitted.resultMessage);
        result.preliminaryResultCode = submitted.resultCode;
        result.preliminaryResultMessage = submitted.resultMessage;

        // if transaction was not successfully submitted, return result immediately
        const codeCategory = result.preliminaryResultCode.substring(0,3);
        switch (codeCategory) {
            case 'tef':
            case 'tem':
            case 'tel':
                result.finalResult = 'Not in ledger.';
                return Promise.resolve(result);
            default:
                break;
        }

        // wait for the final result
        return new Promise((resolve, reject) => {
            setTimeout(() => {
                queryTransactionFinalResult(result.transactionID, result.ledgerVersionOptions).then(outcome => {
                    result.finalResult = JSON.stringify(outcome, null, 2);
                    return resolve(result);
                    //resolve(outcome);
                }).catch(err => {
                    reject(err);
                });
            }, TRANSACTION_QUERY_RESULT_INTERVAL);
        });
    }).catch(err => {
        return Promise.reject(err);
    });
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
        var i;
        for (i = 0; i < accountList.length; i++) {
            var account = accountList[i];
            str += JSON.stringify(accountList[i], null, 2);
            if (i < accountList.length - 1) {
                str += ',\n';
            }
        }
        fs.writeFileSync(ACCOUNT_FILE_PATH, str);
    } catch (err) {
        console.error(err);
        error = 'Account created (' + newAccount.address + ')' + ' but cannot write to file ' + ACCOUNT_FILE_PATH + ' - ' + err.message;
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
    const instructions = {
        'maxLedgerVersionOffset': TRANSACTION_MAX_LEDGER_VERSION_OFFSET
    };
    console.log('preparePayment');
    rapi.preparePayment(sourceAccount.address, payment, instructions).then(prepared => {
        return signAndSubmitTransaction(prepared, sourceAccount.secret);
    }).then(result => {
        const finalResult = JSON.parse(result.finalResult);

        var error;
        if (finalResult.result != 'tesSUCCESS') {
            error = 'Account is not created (' + finalResult.result + ').';
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

function processAccountBalances(balances) {
    var processed = [];
    for (var i = 0; i < balances.length; i++) {
        var p = new Object();
        const b = balances[i];

        p.currency = b.currency;
        p.value = b.value;
        p.counterparty = getAccountNameByAddress(b.counterparty);

        processed.push(p);
    }
    return processed;
}

function processAccountTrustlines(trustlines, account) {
    var processed = [];
    for (var i = 0; i < trustlines.length; i++) {
        var p = new Object();
        const t = trustlines[i];

        if (t.specification.limit == 0 && t.counterparty.limit == 0 && t.state.balance == 0) {
            continue;   // no trust lines between two parties
        }

        const counterparty = getAccountNameByAddress(t.specification.counterparty);

        p.currency = t.specification.currency;
        p.trustDetails = [];

        // grant
        if (t.specification.limit > 0 || t.state.balance > 0) {
            var trustDetail = new Object();
            trustDetail.direction = account.name + ' -> ' + counterparty;
            trustDetail.limit = t.specification.limit;
            if (t.specification.hasOwnProperty('authorized')) {
                trustDetail.authorized = t.specification.authorized;
            }
            if (t.specification.hasOwnProperty('frozen')) {
                trustDetail.frozen = t.specification.frozen;
            }
            if (t.specification.hasOwnProperty('qualityIn')) {
                trustDetail.qualityIn = t.specification.qualityIn;
            }
            if (t.specification.hasOwnProperty('qualityOut')) {
                trustDetail.qualityOut = t.specification.qualityOut;
            }
            if (t.specification.hasOwnProperty('ripplingDisabled')) {
                trustDetail.ripplingDisabled = t.specification.ripplingDisabled;
            }
            trustDetail.balance = t.state.balance > 0 ? t.state.balance : 0;

            p.trustDetails.push(trustDetail);
        }

        // gain
        if (t.counterparty.limit > 0 || t.state.balance < 0) {
            var trustDetail = new Object();
            trustDetail.direction = account.name + ' <- ' + counterparty;
            trustDetail.limit = t.counterparty.limit;
            if (t.counterparty.hasOwnProperty('authorized')) {
                trustDetail.authorized = t.counterparty.authorized;
            }
            if (t.counterparty.hasOwnProperty('frozen')) {
                trustDetail.frozen = t.counterparty.frozen;
            }
            if (t.counterparty.hasOwnProperty('ripplingDisabled')) {
                trustDetail.ripplingDisabled = t.counterparty.ripplingDisabled;
            }
            trustDetail.balance = t.state.balance < 0 ? t.state.balance : 0;

            p.trustDetails.push(trustDetail);
        }

        processed.push(p);
    }
    return processed;
}

function stringifyAmount(amount) {
    if (amount.currency != 'XRP' && amount.hasOwnProperty('counterparty')) {
        return amount.value + ' ' + amount.currency + '.' + getAccountNameByAddress(amount.counterparty);
    } else {
        return amount.value + ' ' + amount.currency;
    }
}

function processAccountTransactions(transactions, account) {
    var processed = [];
    for (var i = 0; i < transactions.length; i++) {
        var p = new Object();
        const t = transactions[i];
        const s = t.specification;
        p.id = t.id;
        p.ownerAddress = t.address;
        p.type = t.type;
        p.sequence = t.sequence;
        p.result = t.outcome.result;
        p.fee = t.outcome.fee;
        p.timestamp = t.outcome.timestamp;
        p.ledgerVersion = t.outcome.ledgerVersion;
        p.indexInLedger = t.outcome.indexInLedger;

        p.descriptions = [];
        switch (t.type) {
            case 'payment':
                const sender = getAccountNameByAddress(s.source.address);
                const recipient = getAccountNameByAddress(s.destination.address);
                p.descriptions.push('Sender: ' + sender);
                p.descriptions.push('Recipient: ' + recipient);
                if (t.specification.source.maxAmount) {
                    p.descriptions.push('Src amount (max): ' + stringifyAmount(s.source.maxAmount));
                    p.descriptions.push('Dst amount: ' + stringifyAmount(s.destination.amount));
                } else {
                    p.descriptions.push('Src amount: ' + stringifyAmount(s.source.amount));
                    p.descriptions.push('Dst amount (min): ' + stringifyAmount(s.destination.minAmount));
                }
                break;
            case 'order':
                p.descriptions.push(s.direction + ' ' + stringifyAmount(s.quantity));
                p.descriptions.push('@ ' + stringifyAmount(s.totalPrice));
                break;
            case 'orderCancellation':
                p.descriptions.push('Cancel order: ' + s.orderSequence);
                break;
            case 'trustline':
                if (s.counterparty == account.address) {
                    const counterparty = getAccountNameByAddress(t.address);
                    p.descriptions.push('Gain trust from: ' + counterparty);
                } else {
                    const counterparty = getAccountNameByAddress(s.counterparty);
                    p.descriptions.push('Grant trust to ' + counterparty);
                }
                p.descriptions.push('Limit: ' + s.limit + ' ' + s.currency);
                break;
            case 'settings':
                for (var prop in s) {
                    p.descriptions.push(prop + ': ' + s[prop]);
                }
                break;
        }

        p.balanceChanges = [];
        for (var accountAddress in t.outcome.balanceChanges) {
            const changes = t.outcome.balanceChanges[accountAddress];
            
            var accountChanges = new Object();
            accountChanges.accountName = getAccountNameByAddress(accountAddress);
            accountChanges.changes = [];

            for (var j = 0; j < changes.length; j++) {
                accountChanges.changes.push(stringifyAmount(changes[j]));
            }
            p.balanceChanges.push(accountChanges);
        }

        processed.push(p);
    }
    return processed;
}

function processAccountOrders(orders, account) {
    var processed = [];
    for (var i = 0; i < orders.length; i++) {
        var p = JSON.parse(JSON.stringify(orders[i]));
        p.specification.quantity = stringifyAmount(p.specification.quantity);
        p.specification.totalPrice = stringifyAmount(p.specification.totalPrice);
        p.properties.maker = getAccountNameByAddress(p.properties.maker);
        
        processed.push(p);
    }
    return processed;
}

exports.queryAccount = function(req, res, next) {
    const account = accountList[req.body.account];
    var pugParam = {
        'data': new AccountData(account.name, account.address),
        'maxTransactions': ACCOUNT_DATA_MAX_TRANSACTIONS,
        'accountList': accountList
    };
    rapi.getBalances(account.address).then(balances => {
        pugParam.data.balances = processAccountBalances(balances);
        return rapi.getTrustlines(account.address);
    }).then(trustlines => {
        pugParam.data.trustlines = processAccountTrustlines(trustlines, account);
        var options = {'limit': ACCOUNT_DATA_MAX_TRANSACTIONS};
        return rapi.getTransactions(account.address, options);
    }).then(transactions => {
        pugParam.data.transactions = processAccountTransactions(transactions, account);
        return rapi.getOrders(account.address);
    }).then(orders => {
        pugParam.data.orders = processAccountOrders(orders, account);
        res.render('accountData', pugParam);
    }).catch(err => {
        pugParam.error = err;
        res.render('accountData', pugParam);
    });
};

// operation: get paths

exports.showGetPaths = function(req, res) {
    res.render('getPaths', {'accountList': accountList});
};

exports.getPaths = function(req, res, next) {
    const source = accountList[req.body.sourceAccount];
    const destination = accountList[req.body.destinationAccount];
    var destinationAmount = {
        'currency': req.body.destinationCurrency,
        'value': req.body.destinationAmount
    }
    if (destinationAmount.currency != 'XRP') {
        destinationAmount.counterparty = accountList[req.body.destinationCounterparty].address;
    }

    const pathfind = {
        'source': {
            'address' : source.address
        },
        'destination': {
            'address': destination.address,
            'amount': destinationAmount
        }
    };
    var processedResult = new Object();
    console.log('getPaths');
    rapi.getPaths(pathfind).then(results => {
        processedResult.rawJSON = JSON.stringify(results, null, 2);
        processedResult.srcDstPairs = [];
        for (var i = 0; i < results.length; i++) {
            var pair = results[i];
            pair.source.account = getAccountNameByAddress(pair.source.address);
            pair.destination.account = getAccountNameByAddress(pair.destination.address);

            pair.source.maxAmount = stringifyAmount(pair.source.maxAmount);
            pair.destination.amount = stringifyAmount(pair.destination.amount);

            pair.pathsObject = JSON.parse(pair.paths);
            for (var j = 0; j < pair.pathsObject.length; j++) {
                var path = pair.pathsObject[j];
                for (var k = 0; k < path.length; k++) {
                    var step = path[k];
                    if (step.hasOwnProperty('account')) {
                        step.account = getAccountNameByAddress(step.account);
                    }
                    if (step.hasOwnProperty('issuer')) {
                        step.issuer = getAccountNameByAddress(step.issuer);
                    }
                }
            }

            processedResult.srcDstPairs.push(pair);
        }
        res.render('getPathsResult', {'accountList': accountList, 'result': processedResult});
    }).catch(err => {
        next(err);
    });
};

// operation: get order book

exports.showGetOrderbook = function(req, res, next) {
    res.render('getOrderbook', {'accountList': accountList});
};

exports.getOrderbook = function(req, res) {
    const account = accountList[req.body.accountIndex];
    var orderbookRequest = {
        'base': {
            'currency': req.body.baseCurrency
        },
        'counter': {
            'currency': req.body.counterCurrency
        }
    };
    if (orderbookRequest.base.currency != 'XRP') {
        orderbookRequest.base.counterparty = accountList[req.body.baseCounterpartyIndex].address;
    }
    if (orderbookRequest.counter.currency != 'XRP') {
        orderbookRequest.counter.counterparty = accountList[req.body.counterCounterpartyIndex].address;
    }
    rapi.getOrderbook(account.address, orderbookRequest).then(orderbook => {
        var result = {
            'rawJSON': JSON.stringify(orderbook, null, 2)
        };
        res.render('getOrderbookResult', {'accountList': accountList, 'result': result});
    });
};

// transaction operation: payment

exports.showMakePayment = function(req, res) {
    res.render('makePayment', {'accountList': accountList});
};

exports.makePayment = function(req, res, next) {
    const sourceAccount = accountList[req.body.sourceAccount];
    const destinationAccount = accountList[req.body.destinationAccount];
    var sourceMaxAmount = {
        'currency': req.body.sourceCurrency,
        'value': req.body.sourceMaxAmount
    };
    var destinationAmount = {
        'currency': req.body.destinationCurrency,
        'value': req.body.destinationAmount
    }
    if (sourceMaxAmount.currency != 'XRP') {
        sourceMaxAmount.counterparty = accountList[req.body.sourceCounterparty].address;
    }
    if (destinationAmount.currency != 'XRP') {
        destinationAmount.counterparty = accountList[req.body.destinationCounterparty].address;
    }

    var payment = {
        'source': {
            'address': sourceAccount.address,
            'maxAmount': sourceMaxAmount
        },
        'destination': {
            'address': destinationAccount.address,
            'amount': destinationAmount
        }
    };
    if (req.body.paths && req.body.paths != '') {
        payment.paths = req.body.paths;
    }
    const instructions = {
        'maxLedgerVersionOffset': TRANSACTION_MAX_LEDGER_VERSION_OFFSET
    };
    console.log('preparePayment');
    rapi.preparePayment(sourceAccount.address, payment, instructions).then(prepared => {
        return signAndSubmitTransaction(prepared, sourceAccount.secret);
    }).then(result => {
        res.render('transactionResult', result);
    }).catch(err => {
        next(err);
    });
};

// transaction operation: settings

exports.showChangeSettings = function(req, res) {
    res.render('changeSettings', {'accountList': accountList});
};

exports.changeSettings = function(req, res, next) {
    const account = accountList[req.body.account];
    const settings = {
        'defaultRipple': req.body.defaultRipple ? true : false
    };
    const instructions = {
        'maxLedgerVersionOffset': TRANSACTION_MAX_LEDGER_VERSION_OFFSET
    };
    console.log('prepareSettings');
    rapi.prepareSettings(account.address, settings, instructions).then(prepared => {
        return signAndSubmitTransaction(prepared, account.secret);
    }).then(result => {
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
    const account = accountList[req.body.account];
    const counterpartyAccount = accountList[req.body.counterpartyAccount];
    const trustline = {
        'currency': req.body.currency,
        'counterparty': counterpartyAccount.address,
        'limit': req.body.limit,
        'qualityIn': parseFloat(req.body.qualityIn),
        'qualityOut': parseFloat(req.body.qualityOut),
        'ripplingDisabled': req.body.ripplingDisabled ? true : false
    };
    const instructions = {
        'maxLedgerVersionOffset': TRANSACTION_MAX_LEDGER_VERSION_OFFSET
    };
    console.log('prepareSettings');
    rapi.prepareTrustline(account.address, trustline, instructions).then(prepared => {
        return signAndSubmitTransaction(prepared, account.secret);
    }).then(result => {
        res.render('transactionResult', result);
    }).catch(err => {
        next(err);
    });
};

// transaction operation: order

exports.showPlaceOrder = function(req, res) {
    res.render('placeOrder', {'accountList': accountList});
};

exports.placeOrder = function(req, res, next) {
    const account = accountList[req.body.accountIndex];
    var quantity = {
        'currency': req.body.quantityCurrency,
        'value': req.body.quantityAmount
    };
    var totalPrice = {
        'currency': req.body.priceCurrency,
        'value': req.body.priceAmount
    }
    if (quantity.currency != 'XRP') {
        const quantityCounterparty = accountList[req.body.quantityCounterpartyIndex];
        quantity.counterparty = quantityCounterparty.address;
    }
    if (totalPrice.currency != 'XRP') {
        const totalPriceCounterparty = accountList[req.body.priceCounterpartyIndex];
        totalPrice.counterparty = totalPriceCounterparty.address;
    }
    const order = {
        'direction': req.body.direction,
        'quantity': quantity,
        'totalPrice': totalPrice
    };
    const instructions = {
        'maxLedgerVersionOffset': TRANSACTION_MAX_LEDGER_VERSION_OFFSET
    };
    console.log('prepareOrder');
    rapi.prepareOrder(account.address, order, instructions).then(prepared => {
        return signAndSubmitTransaction(prepared, account.secret);
    }).then(result => {
        res.render('transactionResult', result);
    }).catch(err => {
        next(err);
    });
};