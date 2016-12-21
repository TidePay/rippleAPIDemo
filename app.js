'use strict';
var express = require('express');
var routes = require('./routes');
var app = express();
var bodyParser = require('body-parser');

// parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: false }));

// parse application/json
app.use(bodyParser.json());

// use pug for templating
app.set('view engine', 'pug');
app.set('views', './views')

app.get('/', routes.displayServerList);
app.post('/', routes.connectToServer);
app.get('/main', routes.main);
app.get('/query/:commandIndex', routes.query);
app.post('/query/:commandIndex', routes.submitQuery);

app.use('/q', routes.checkRippleConnection);
app.get('/q/account/:address', routes.getAccountInfo);
app.get('/q/server', routes.getServerInfo);
app.get('/q/transaction/:id', routes.getTransaction);
app.get('/q/transactions/:address', routes.getTransactions);
app.get('/q/ledger', routes.getLedger);
app.get('/q/trustlines/:address', routes.getTrustlines);
app.get('/q/balances/:address', routes.getBalances);
app.get('/q/orders/:address', routes.getOrders);
app.get('/q/settings/:address', routes.getSettings);

app.get('/manageAccounts', routes.showAccountList);
app.post('/manageAccounts/addExisting', routes.addExistingAccount);
app.post('/manageAccounts/create', routes.createAccount);
app.get('/queryAccount', routes.showQueryAccount);
app.post('/queryAccount', routes.queryAccount);
app.get('/getPaths', routes.showGetPaths);
app.post('/getPaths', routes.getPaths);
app.get('/getOrderbook', routes.showGetOrderbook);
app.post('/getOrderbook', routes.getOrderbook);
app.get('/transaction/payment', routes.showMakePayment);
app.post('/transaction/payment', routes.makePayment);
app.get('/transaction/settings', routes.showChangeSettings);
app.post('/transaction/settings', routes.changeSettings);
app.get('/transaction/trustline', routes.showChangeTrustline);
app.post('/transaction/trustline', routes.changeTrustline);
app.get('/transaction/order', routes.showPlaceOrder);
app.post('/transaction/order', routes.placeOrder);
app.get('/transaction/orderCancel', routes.showCancelOrder);
app.post('/transaction/orderCancel', routes.handleCancelOrderAction);

app.use(routes.handleError);

app.listen(3000, () => {
    console.log('Example app listening on port 3000!')
});

process.on('SIGTERM',function() {
    console.log("caught sigterm");
    process.exit();
});
process.on('SIGINT',function() {
    console.log("caught sigint");
    process.exit();
});
process.on('exit',function() {
    console.log("Shutting down.");
    // exit code (release resource)

    console.log("Done");
});
