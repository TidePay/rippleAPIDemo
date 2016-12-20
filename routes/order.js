const tx = require('./transaction.js');

// transaction operation: place order

function showPlaceOrder(req, res) {
    res.render('placeOrder', {'accountList': this.accountList});
};

function placeOrder(req, res, next) {
    const account = this.accountList[req.body.accountIndex];
    var quantity = {
        'currency': req.body.quantityCurrency,
        'value': req.body.quantityAmount
    };
    var totalPrice = {
        'currency': req.body.priceCurrency,
        'value': req.body.priceAmount
    }
    if (quantity.currency != 'XRP') {
        const quantityCounterparty = this.accountList[req.body.quantityCounterpartyIndex];
        quantity.counterparty = quantityCounterparty.address;
    }
    if (totalPrice.currency != 'XRP') {
        const totalPriceCounterparty = this.accountList[req.body.priceCounterpartyIndex];
        totalPrice.counterparty = totalPriceCounterparty.address;
    }
    var order = {
        'direction': req.body.direction,
        'quantity': quantity,
        'totalPrice': totalPrice
    };
    switch (req.body.orderOption) {
        case 'FOK':
            order.fillOrKill = true;
            break;
        case 'IOC':
            order.immediateOrCancel = true;
            break;
        case 'none':
        default:
            break;
    }
    if (req.body.passive) {
        order.passive = true;
    }

    console.log('prepareOrder');
    this.api.prepareOrder(account.address, order, tx.instructions).then(prepared => {
        return tx.signAndSubmitTransaction(this.api, prepared, account.secret);
    }).then(result => {
        res.render('transactionResult', result);
    }).catch(err => {
        next(err);
    });
};

// transaction operation: cancel order

function showCancelOrder(req, res) {
    res.render('cancelOrder', {'accountList': this.accountList});
};

function cancelOrder(req, res, next) {
    const account = this.accountList[req.body.accountIndex];
    var orderCancellation = {
        'orderSequence': parseInt(req.body.orderSequence)
    };

    console.log('prepareOrderCancellation');
    this.api.prepareOrderCancellation(account.address, orderCancellation, tx.instructions).then(prepared => {
        return tx.signAndSubmitTransaction(this.api, prepared, account.secret);
    }).then(result => {
        res.render('transactionResult', result);
    }).catch(err => {
        next(err);
    });
};

exports.showPlaceOrder = showPlaceOrder;
exports.placeOrder = placeOrder;
exports.showCancelOrder = showCancelOrder;
exports.cancelOrder = cancelOrder;