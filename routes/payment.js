const tx = require('./transaction.js');

// transaction operation: payment

function showMakePayment(req, res) {
    res.render('makePayment', {'accountList': this.accountList});
};

function makePayment(req, res, next) {
    const sourceAccount = this.accountList[req.body.sourceAccount];
    const destinationAddress = req.body.destinationAccountAddress !== '' ? req.body.destinationAccountAddress : this.accountList[req.body.destinationAccount].address;
    var sourceMaxAmount = {
        'currency': req.body.sourceCurrency,
        'value': req.body.sourceMaxAmount
    };
    var destinationAmount = {
        'currency': req.body.destinationCurrency !== '' ? req.body.destinationCurrency : req.body.sourceCurrency,
        'value': req.body.destinationAmount !== '' ? req.body.destinationAmount : req.body.sourceMaxAmount
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
            'address': destinationAddress,
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