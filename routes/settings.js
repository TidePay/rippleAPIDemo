const tx = require('./transaction.js');

// transaction operation: settings

function showChangeSettings(req, res) {    
    res.render('changeSettings', {'accountList': this.accountList});
};

function changeSettings(req, res, next) {
    const account = this.accountList[req.body.account];
    const settings = {
        'defaultRipple': req.body.defaultRipple ? true : false
    };

    console.log('prepareSettings');
    this.api.prepareSettings(account.address, settings, tx.instructions).then(prepared => {
        return tx.signAndSubmitTransaction(this.api, prepared, account.secret);
    }).then(result => {
        res.render('transactionResult', result);
    }).catch(err => {
        next(err);
    });
};

exports.showChangeSettings = showChangeSettings;
exports.changeSettings = changeSettings;