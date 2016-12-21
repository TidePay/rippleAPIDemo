const tx = require('./transaction.js');
const utils = require('./utils.js')

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
    const pugParam = {
        'accountList': this.accountList,
        'orders': []
    }
    res.render('cancelOrder', pugParam);
};

function getOrders(req, res, next) {
    const account = this.accountList[req.body.accountIndex];

    this.api.getOrders(account.address).then(orders => {
        for (var i = 0; i < orders.length; i++) {
            var order = orders[i];
            order.specification.quantity = utils.stringifyAmount(this.accountMap, order.specification.quantity);
            order.specification.totalPrice = utils.stringifyAmount(this.accountMap, order.specification.totalPrice);
        }
        const pugParam = {
            'accountList': this.accountList,
            'orders': orders,
            'accountIndex': req.body.accountIndex,
            'accountName': account.name,
            'accountAddress': account.address
        };
        res.render('cancelOrder', pugParam);
    }).catch(err => {
        next(err);
    });
};

function cancelOrder(req, res, next) {
    const account = this.accountList[req.body.txAccountIndex];
    var orderCancellation = {
        'orderSequence': parseInt(req.body.cancelOrderSequence)
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

function handleCancelOrderAction(req, res, next) {
    if ('getOrders' in req.body) {
        getOrders.call(this, req, res, next);
    } else if ('cancelOrderSequence' in req.body) {
        cancelOrder.call(this, req, res, next);
    }
};

exports.showPlaceOrder = showPlaceOrder;
exports.placeOrder = placeOrder;
exports.showCancelOrder = showCancelOrder;
exports.handleCancelOrderAction = handleCancelOrderAction;