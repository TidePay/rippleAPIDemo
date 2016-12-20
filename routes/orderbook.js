const utils = require('./utils.js');

var OrderbookResult = function(accountMap, orderbook, error) {
    this.bids = [];
    this.asks = [];

    if (orderbook !== null) {
        this.rawJSON = JSON.stringify(orderbook, null, 2);

        // bids
        var i;
        for (i = 0; i < orderbook.bids.length; i++) {
            var p = new Object();
            const b = orderbook.bids[i];
            p.quantity = utils.stringifyAmount(accountMap, b.specification.quantity);
            p.totalPrice = utils.stringifyAmount(accountMap, b.specification.totalPrice);
            p.maker = accountMap.getNameByAddress(b.properties.maker);
            p.sequence = b.properties.sequence;
            p.makerExchangeRate = b.properties.makerExchangeRate;
            this.bids.push(p);
        }

        // asks
        for (i = 0; i < orderbook.asks.length; i++) {
            var p = new Object();
            const a = orderbook.asks[i];
            p.quantity = utils.stringifyAmount(accountMap, a.specification.quantity);
            p.totalPrice = utils.stringifyAmount(accountMap, a.specification.totalPrice);
            p.maker = accountMap.getNameByAddress(a.properties.maker);
            p.sequence = a.properties.sequence;
            p.makerExchangeRate = a.properties.makerExchangeRate;
            this.asks.push(p);
        }
    } else {
        this.errorMessage = '[' + error.name + '(' + error.message + ')]';
    }
}

// operation: get order book

function showGetOrderbook(req, res, next) {
    res.render('getOrderbook', {'accountList': this.accountList});
};

function getOrderbook(req, res) {
    const account = this.accountList[req.body.accountIndex];
    var orderbookRequest = {
        'base': {
            'currency': req.body.baseCurrency
        },
        'counter': {
            'currency': req.body.counterCurrency
        }
    };
    if (orderbookRequest.base.currency != 'XRP') {
        orderbookRequest.base.counterparty = this.accountList[req.body.baseCounterpartyIndex].address;
    }
    if (orderbookRequest.counter.currency != 'XRP') {
        orderbookRequest.counter.counterparty = this.accountList[req.body.counterCounterpartyIndex].address;
    }
    this.api.getOrderbook(account.address, orderbookRequest).then(orderbook => {
        const result = new OrderbookResult(this.accountMap, orderbook);
        res.render('getOrderbookResult', {'result': result});
    }).catch(err => {
        const result = new OrderbookResult(this.accountMap, null, err);
        res.render('getOrderbookResult', {'result': result});
    });
};

exports.showGetOrderbook = showGetOrderbook;
exports.getOrderbook = getOrderbook;