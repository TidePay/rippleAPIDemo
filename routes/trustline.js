const tx = require('./transaction.js');

// transaction operation: trustline

function showChangeTrustline(req, res) {    
    res.render('changeTrustline', {'accountList': this.accountList});
};

function changeTrustline(req, res, next) {
    const account = this.accountList[req.body.account];
    const counterpartyAccount = this.accountList[req.body.counterpartyAccount];
    const trustline = {
        'currency': req.body.currency,
        'counterparty': counterpartyAccount.address,
        'limit': req.body.limit,
        'qualityIn': parseFloat(req.body.qualityIn),
        'qualityOut': parseFloat(req.body.qualityOut),
        'ripplingDisabled': req.body.ripplingDisabled ? true : false,
        'frozen': req.body.frozen ? true : false,
    };

    console.log('prepareSettings');
    this.api.prepareTrustline(account.address, trustline, tx.instructions).then(prepared => {
        return tx.signAndSubmitTransaction(this.api, prepared, account.secret);
    }).then(result => {
        res.render('transactionResult', result);
    }).catch(err => {
        next(err);
    });
};

exports.showChangeTrustline = showChangeTrustline;
exports.changeTrustline = changeTrustline;