function toBoolean(value) {
    switch (value) {
        case 'true': return true;
        case 'false': return false;
        default: return undefined;
    }
}

function toInteger(value) {
    return parseInt(value, 10);
}

function toString(value) {
    return value;
}

function toStringArray(value) {
    return Array.isArray(value) ? value : [value];
}

function getOptions(qs, mapping) {
    const json = {};
    Object.keys(qs).forEach((key) => {
        const toFunc = mapping[key];
        const value = toFunc ? toFunc(qs[key]) : undefined;
        if (value !== undefined) {
            json[key] = value;
        }
    });
    return Object.keys(json).length > 0 ? json : undefined;
}

exports.getAccountInfo = function(req, res, next) {
    console.log('getAccountInfo: ' + req.params.address);
    const mapping = {
        ledgerVersion: toInteger,
    };
    const options = getOptions(req.query, mapping);
    this.api.getAccountInfo(req.params.address, options).then(info => {
        res.send(info);
    }).catch(err => {
        next(err);
    });
};

exports.getServerInfo = function(req, res, next) {
    console.log('getServerInfo');
    this.api.getServerInfo().then(info => {
        res.send(info);
    }).catch(err => {
        next(err);
    });
};

exports.getBalanceSheet = function(req, res, next) {
    console.log('getBalanceSheet');
    const mapping = {
        excludeAddresses: toStringArray,
        ledgerVersion: toInteger,
    };
    const options = getOptions(req.query, mapping);
    this.api.getBalanceSheet(req.params.address, options).then(info => {
        res.send(info);
    }).catch(err => {
        next(err);
    });
};

exports.getTransaction = function(req, res, next) {
    console.log('getTransaction');
    const mapping = {
        maxLedgerVersion: toInteger,
        minLedgerVersion: toInteger,
    };
    const options = getOptions(req.query, mapping);
    this.api.getTransaction(req.params.id, options).then(info => {
        res.send(info);
    }).catch(err => {
        next(err);
    });
};

exports.getTransactions = function(req, res, next) {
    console.log('getTransactions');
    const address = req.params.address;
    const mapping = {
        limit: toInteger,
        counterparty: toString,
        earliestFirst: toBoolean,
        excludeFailures: toBoolean,
        initiated: toBoolean,
        maxLedgerVersion: toInteger,
        minLedgerVersion: toInteger,
        start: toString,
        types: toStringArray,
    };
    const options = getOptions(req.query, mapping);
    this.api.getTransactions(address, options).then(info => {
        res.send(info);
    }).catch(err => {
        next(err);
    });
};

exports.getLedger = function(req, res, next) {
    console.log('getLedger');
    const mapping = {
        includeAllData: toBoolean,
        includeState: toBoolean,
        includeTransactions: toBoolean,
        ledgerVersion: toInteger,
    }
    const options = getOptions(req.query, mapping);
    this.api.getLedger(options).then(info => {
        res.send(info);
    }).catch(err => {
        next(err);
    });
};

exports.getTrustlines = function(req, res, next) {
    console.log('getTrustlines: ' + req.params.address);
    const mapping = {
        counterparty: toString,
        currency: toString,
        ledgerVersion: toInteger,
        limit: toInteger,
    };
    const options = getOptions(req.query, mapping);
    this.api.getTrustlines(req.params.address, options).then(info => {
        res.send(info);
    }).catch(err => {
        next(err);
    });
};

exports.getBalances = function(req, res, next) {
    console.log('getBalances: ' + req.params.address);
    const mapping = {
        counterparty: toString,
        currency: toString,
        ledgerVersion: toInteger,
        limit: toInteger,
    };
    const options = getOptions(req.query, mapping);
    this.api.getBalances(req.params.address, options).then(info => {
        res.send(info);
    }).catch(err => {
        next(err);
    });
};

exports.getOrders = function(req, res, next) {
    const mapping = {
        ledgerVersion: toInteger,
        limit: toInteger,
    };
    const options = getOptions(req.query, mapping);
    this.api.getOrders(req.params.address, options).then(info => {
        res.send(info);
    }).catch(err => {
        next(err);
    });
};

exports.getSettings = function(req, res, next) {
    const mapping = {
        ledgerVersion: toInteger,
    };
    const options = getOptions(req.query, mapping);
    this.api.getSettings(req.params.address, options).then(info => {
        res.send(info);
    }).catch(err => {
        next(err);
    });
};