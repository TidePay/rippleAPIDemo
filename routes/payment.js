const tx = require('./transaction.js');

// transaction operation: payment

function showMakePayment(req, res) {
    res.render('makePayment', {'accountList': this.accountList});
};

function makePayment(req, res, next) {
    const sourceAccount = this.accountList[req.body.sourceAccount];
    const destinationAccount = this.accountList[req.body.destinationAccount];
    var sourceMaxAmount = {
        'currency': req.body.sourceCurrency,
        'value': req.body.sourceMaxAmount
    };
    var destinationAmount = {
        'currency': req.body.destinationCurrency,
        'value': req.body.destinationAmount
    }
    if (sourceMaxAmount.currency != 'XRP') {
        sourceMaxAmount.counterparty = this.accountList[req.body.sourceCounterparty].address;
    }
    if (destinationAmount.currency != 'XRP') {
        destinationAmount.counterparty = this.accountList[req.body.destinationCounterparty].address;
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

    console.log('preparePayment');
    this.api.preparePayment(sourceAccount.address, payment, tx.instructions).then(prepared => {
        return tx.signAndSubmitTransaction(this.api, prepared, sourceAccount.secret);
    }).then(result => {
        res.render('transactionResult', result);
    }).catch(err => {
        next(err);
    });
};

exports.showMakePayment = showMakePayment;
exports.makePayment = makePayment;