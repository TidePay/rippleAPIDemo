const tx = require('./transaction.js');
var fs = require('fs');

const ACCOUNT_FILE_PATH = 'account.txt';

var Account = function(name, address, secret) {
    this.name = name;
    this.address = address;
    this.secret = secret;
};

var AccountMap = function() {
    this.getNameByAddress = (address) => {
        if (this.hasOwnProperty(address)) {
            return this[address];
        } else {
            return address;
        }
    };
};

// operation: manager accounts

function loadAccountFromFile(path) {
    return new Promise((resolve, reject) => {
        
        // read ACCOUNT_FILE_PATH
        fs.readFile(ACCOUNT_FILE_PATH, (err, data) => {
            if (err) {
                reject(err);
            } else {
                var result = {
                    'list': [],
                    'map': new AccountMap()
                }
                var splittedData = data.toString().split('},');
                for (var i = 0; i < splittedData.length; i++) {
                    var str = splittedData[i].replace(/\r?\n/g, '');
                    if (i < splittedData.length - 1) {
                        str += '}';
                    }
                    var record = JSON.parse(str);
                    var account = new Account(record.name, record.address, record.secret);
                    result.list.push(record);
                    result.map[record.address] = record.name;
                }
                resolve(result);
            }
        });
    });
}

function showAccountList(req, res) {
    res.render('accountList', {'accounts': this.accountList});
};

function checkAccountExistence(accountList, newAccount) {
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

function addAccountToList(accountList, newAccount) {
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

function addExistingAccount(req, res) {
    var newAccount = new Account(req.body.name, req.body.address, req.body.secret);
    var error = checkAccountExistence(this.accountList,newAccount);
    if (!error) {
         error = addAccountToList(this.accountList, newAccount);
    }
    res.render('accountList', {'accounts': this.accountList, 'errorMessage': error});
};

function createAccount(req, res) {
    // generate address
    var newAddress = this.api.generateAddress();

    var newAccount = new Account(req.body.newAccountName, newAddress.address, newAddress.secret);
    var error = checkAccountExistence(this.accountList, newAccount);
    if (error) {
        res.render('accountList', {'accounts': this.accountList, 'errorMessage': error});
        return;
    }

    // send payment to new account
    const sourceAccount = this.accountList[req.body.sourceAccount];
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

    console.log('preparePayment');
    this.api.preparePayment(sourceAccount.address, payment, tx.instructions).then(prepared => {
        return tx.signAndSubmitTransaction(this.api, prepared, sourceAccount.secret);
    }).then(result => {
        const finalResult = JSON.parse(result.finalResult);

        var error;
        if (finalResult.result != 'tesSUCCESS') {
            error = 'Account is not created (' + finalResult.result + ').';
        } else {
            error = addAccountToList(this.accountList, newAccount);
        }
        res.render('accountList', {'accounts': this.accountList, 'errorMessage': error});
    }).catch(err => {
        var error = 'Failed to create account (' + err.name + ': ' + err.message + ')';
        res.render('accountList', {'accounts': this.accountList, 'errorMessage': error});       
    });
};

function generateAddress(req, res) {
    // generate address
    var newAddress = this.api.generateAddress();

    res.render('accountList', {'accounts': this.accountList, 'generatedAddress': newAddress});
};

exports.AccountMap = AccountMap;
exports.loadAccountFromFile = loadAccountFromFile;
exports.showAccountList = showAccountList;
exports.addExistingAccount = addExistingAccount;
exports.createAccount = createAccount;
exports.generateAddress = generateAddress;