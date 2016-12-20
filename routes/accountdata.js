const ACCOUNT_DATA_MAX_TRANSACTIONS = 10;

const utils = require('./utils.js');

var AccountData = function(name, address) {
    this.accountName = name;
    this.accountAddress = address;
    this.balances = [];
    this.transactions = [];
    this.orders = [];
    this.trustlines = [];
};

function showQueryAccount(req, res) {
    var pugParam = {
        'data': new AccountData(),
        'maxTransactions': ACCOUNT_DATA_MAX_TRANSACTIONS,
        'accountList': this.accountList
    };
    res.render('accountData', pugParam);
};

function processAccountBalances(accountMap, balances) {
    var processed = [];
    for (var i = 0; i < balances.length; i++) {
        var p = new Object();
        const b = balances[i];

        p.currency = b.currency;
        p.value = b.value;
        p.counterparty = accountMap.getNameByAddress(b.counterparty);

        processed.push(p);
    }
    return processed;
}

function processAccountTrustlines(accountMap, trustlines, account) {
    var processed = [];
    for (var i = 0; i < trustlines.length; i++) {
        var p = new Object();
        const t = trustlines[i];

        if (t.specification.limit == 0 && t.counterparty.limit == 0 && t.state.balance == 0) {
            continue;   // no trust lines between two parties
        }

        const counterparty = accountMap.getNameByAddress(t.specification.counterparty);

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

function processAccountTransactions(accountMap, transactions, account) {
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
                const sender = accountMap.getNameByAddress(s.source.address);
                const recipient = accountMap.getNameByAddress(s.destination.address);
                p.descriptions.push('Sender: ' + sender);
                p.descriptions.push('Recipient: ' + recipient);
                if (t.specification.source.maxAmount) {
                    p.descriptions.push('Src amount (max): ' + utils.stringifyAmount(accountMap, s.source.maxAmount));
                    p.descriptions.push('Dst amount: ' + utils.stringifyAmount(accountMap, s.destination.amount));
                } else {
                    p.descriptions.push('Src amount: ' + utils.stringifyAmount(accountMap, s.source.amount));
                    p.descriptions.push('Dst amount (min): ' + utils.stringifyAmount(accountMap, s.destination.minAmount));
                }
                break;
            case 'order':
                p.descriptions.push(s.direction + ' ' + utils.stringifyAmount(accountMap, s.quantity));
                p.descriptions.push('@ ' + utils.stringifyAmount(accountMap, s.totalPrice));
                break;
            case 'orderCancellation':
                p.descriptions.push('Cancel order: ' + s.orderSequence);
                break;
            case 'trustline':
                if (s.counterparty == account.address) {
                    const counterparty = accountMap.getNameByAddress(t.address);
                    p.descriptions.push('Gain trust from: ' + counterparty);
                } else {
                    const counterparty = accountMap.getNameByAddress(s.counterparty);
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
            accountChanges.accountName = accountMap.getNameByAddress(accountAddress);
            accountChanges.changes = [];

            for (var j = 0; j < changes.length; j++) {
                accountChanges.changes.push(utils.stringifyAmount(accountMap, changes[j]));
            }
            p.balanceChanges.push(accountChanges);
        }

        processed.push(p);
    }
    return processed;
}

function processAccountOrders(accountMap, orders, account) {
    var processed = [];
    for (var i = 0; i < orders.length; i++) {
        var p = JSON.parse(JSON.stringify(orders[i]));
        p.specification.quantity = utils.stringifyAmount(accountMap, p.specification.quantity);
        p.specification.totalPrice = utils.stringifyAmount(accountMap, p.specification.totalPrice);
        p.properties.maker = accountMap.getNameByAddress(p.properties.maker);
        
        processed.push(p);
    }
    return processed;
}

function queryAccount(req, res, next) {
    const account = this.accountList[req.body.account];
    var pugParam = {
        'data': new AccountData(account.name, account.address),
        'maxTransactions': ACCOUNT_DATA_MAX_TRANSACTIONS,
        'accountList': this.accountList
    };

    this.api.getBalances(account.address).then(balances => {
        pugParam.data.balances = processAccountBalances(this.accountMap, balances);
        return this.api.getTrustlines(account.address);
    }).then(trustlines => {
        pugParam.data.trustlines = processAccountTrustlines(this.accountMap, trustlines, account);
        var options = {'limit': ACCOUNT_DATA_MAX_TRANSACTIONS};
        return this.api.getTransactions(account.address, options);
    }).then(transactions => {
        pugParam.data.transactions = processAccountTransactions(this.accountMap, transactions, account);
        return this.api.getOrders(account.address);
    }).then(orders => {
        pugParam.data.orders = processAccountOrders(this.accountMap, orders, account);
        res.render('accountData', pugParam);
    }).catch(err => {
        pugParam.error = err;
        res.render('accountData', pugParam);
    });
}

exports.queryAccount = queryAccount;
exports.showQueryAccount = showQueryAccount;