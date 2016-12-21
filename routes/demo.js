const RippleAPI = require('ripple-lib').RippleAPI;

var manageAccount = require('./manageaccount.js');
var accountData = require('./accountdata.js');
var paths = require('./paths.js');
var orderbook = require('./orderbook.js');
var payment = require('./payment.js');
var settings = require('./settings.js');
var trustline = require('./trustline.js');
var order = require('./order.js');
var apiquery = require('./apiquery.js');
var wrap = require('./wrap.js');

// list of rippled websocket
var serverList = [
    {name: 'Public rippled server 1 - General purpose', websocket: 'wss://s1.ripple.com'},  // Public rippled server hosted by Ripple, Inc. (general purpose server)
    {name: 'Public rippled server 2 - Full history', websocket: 'wss://s2.ripple.com'},     // Public rippled server hosted by Ripple, Inc. (full-history server)
    {name: 'Ripple test net', websocket: 'wss://s.altnet.rippletest.net:51233'}             // Ripple test net
];

var operationList = [
    {name: 'Manage Accounts', path: '/manageAccounts'},
    {name: 'Get Account Data', path: '/queryAccount'},
    {name: 'Get Order Book', path: '/getOrderbook'},
    {name: 'Get Paths', path: '/getPaths'},
    {name: 'Make Payment', path: '/transaction/payment'},
    {name: 'Place Order', path: '/transaction/order'},
    {name: 'Cancel Order', path: '/transaction/orderCancel'},
    {name: 'Change Settings', path: '/transaction/settings'},
    {name: 'Change Trustline', path: '/transaction/trustline'}
];

function displayServerList(req, res) {
    if (!this.api) {
        res.render('server', {servers: serverList})
    } else {
        res.redirect('/main');
    }
};

function connectToServer(req, res) {
    if (!this.api) {
        this.api = new RippleAPI({server: req.body.server});
        this.api.connect().then(() => {
            console.log('Connected to ' + req.body.server);

            this.loadAccountFromFile().then(result => {
                this.accountList = result.list;
                this.accountMap = result.map;
                res.redirect('/main');
            }).catch(err => {
                console.error(err);
            });

            // listen to ledger event
            // this.api.on('ledger', onValidatedLedger);
        }).catch(err => {
            console.log(err);
            res.send('Cannot connect to ' + req.body.server + '!');
        });
    }
};

function main(req, res) {
    if (this.api && this.api.isConnected()) {
        res.render('main', {commands: apiquery.commandList, operations: operationList});
    } else {
        res.send('Not yet connected to rippled server.');
    }
};

// middleware function to check ripple connection
function checkRippleConnection(req, res, next) {
    if (this.api && this.api.isConnected()) {
        next();
    } else {
        res.status(400);
        res.send('Not yet connected to ripple server.');
    }
};

// callback function when a new ledger version is validated on the connected server
function onValidatedLedger(ledger) {
    console.log('!!!Validated ledger!!!');
    console.log(JSON.stringify(ledger, null, 2));
};

var RippleAPIDemo = function() {
    this.api = null;
    this.accountList = [];
    this.accountMap = new manageAccount.AccountMap();
}

RippleAPIDemo.prototype.displayServerList = displayServerList;
RippleAPIDemo.prototype.connectToServer = connectToServer;
RippleAPIDemo.prototype.checkRippleConnection = checkRippleConnection;

RippleAPIDemo.prototype.main = main;

RippleAPIDemo.prototype.loadAccountFromFile = manageAccount.loadAccountFromFile;
RippleAPIDemo.prototype.showAccountList = manageAccount.showAccountList;
RippleAPIDemo.prototype.addExistingAccount = manageAccount.addExistingAccount;
RippleAPIDemo.prototype.createAccount = manageAccount.createAccount;

RippleAPIDemo.prototype.queryAccount = accountData.queryAccount;
RippleAPIDemo.prototype.showQueryAccount = accountData.showQueryAccount;

RippleAPIDemo.prototype.showGetPaths = paths.showGetPaths;
RippleAPIDemo.prototype.getPaths = paths.getPaths;

RippleAPIDemo.prototype.showGetOrderbook = orderbook.showGetOrderbook;
RippleAPIDemo.prototype.getOrderbook = orderbook.getOrderbook;

RippleAPIDemo.prototype.showMakePayment = payment.showMakePayment;
RippleAPIDemo.prototype.makePayment = payment.makePayment;

RippleAPIDemo.prototype.showChangeSettings = settings.showChangeSettings;
RippleAPIDemo.prototype.changeSettings = settings.changeSettings;

RippleAPIDemo.prototype.showChangeTrustline = trustline.showChangeTrustline;
RippleAPIDemo.prototype.changeTrustline = trustline.changeTrustline;

RippleAPIDemo.prototype.showPlaceOrder = order.showPlaceOrder;
RippleAPIDemo.prototype.placeOrder = order.placeOrder;
RippleAPIDemo.prototype.showCancelOrder = order.showCancelOrder;
RippleAPIDemo.prototype.handleCancelOrderAction = order.handleCancelOrderAction;

RippleAPIDemo.prototype.query = apiquery.query;
RippleAPIDemo.prototype.submitQuery = apiquery.submitQuery;

RippleAPIDemo.prototype.getAccountInfo = wrap.getAccountInfo;
RippleAPIDemo.prototype.getServerInfo = wrap.getServerInfo;
RippleAPIDemo.prototype.getTransaction = wrap.getTransaction;
RippleAPIDemo.prototype.getTransactions = wrap.getTransactions;
RippleAPIDemo.prototype.getLedger = wrap.getLedger;
RippleAPIDemo.prototype.getTrustlines = wrap.getTrustlines;
RippleAPIDemo.prototype.getBalances = wrap.getBalances;
RippleAPIDemo.prototype.getOrders = wrap.getOrders;
RippleAPIDemo.prototype.getSettings = wrap.getSettings;

exports.RippleAPIDemo = RippleAPIDemo;