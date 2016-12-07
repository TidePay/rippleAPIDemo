'use strict';
var request = require('request');

const RippleAPI = require('ripple-lib').RippleAPI;
var rapi;

const HOST_URL = 'http://localhost:3000';   // TODO: use req.hostname to get this

// list of rippled websocket
var serverList = [
    {name: 'Public rippled server', websocket: 'wss://s1.ripple.com'},          // Public rippled server hosted by Ripple, Inc.
    {name: 'Ripple test net', websocket: 'wss://s.altnet.rippletest.net:51233'} // Ripple test net
];

// list of query commands
var commandList = [
    {name: 'getAccountInfo', command: 'account', params: ['address']},
    {name: 'getServerInfo', command: 'server', params: []},
    {name: 'getTransaction', command: 'transaction', params: ['id']},
    {name: 'getLedger', command: 'ledger', params: []},
    {name: 'getTrustlines', command: 'trustlines', params: ['address']},
    {name: 'getBalances', command: 'balances', params: ['address']}
];

exports.displayServerList = function(req, res) {
    if (!rapi) {
        res.render('server', {servers: serverList})
    } else {
        res.redirect('/main');
    }
};

exports.connectToServer = function(req, res) {
    if (!rapi) {
        rapi = new RippleAPI({server: req.body.server});

        rapi.connect().then(() => {
            console.log('Connected to ' + req.body.server);
            res.redirect('/main');
        }).catch(err => {
            res.send('Cannot connect to ' + req.body.server + '!');
        });
    }
};

exports.main = function(req, res) {
    if (rapi.isConnected()) {
        res.render('main', {commands: commandList});
    } else {
        res.send('Not yet connected to rippled server.');
    }
};

exports.query = function(req, res) {
    var command = commandList[req.params.commandIndex];
    console.log('query: ' + command.name);
    res.render('query', {hostURL: HOST_URL, command: command});
};

exports.submitQuery = function(req, res) {
    var commandIndex = parseInt(req.params.commandIndex);
    var command = commandList[commandIndex];

    var url = HOST_URL + '/' + command.command;
    var i;
    for (i = 0; i < command.params.length; i++) {
        url += '/';
        url += req.body[command.params[i]];
    }
    console.log("submit query: " + url);

    request(url, function(error, response, body) {
        if (!error) {
            if (response.statusCode == 200) {
                var bodyObject = JSON.parse(body);
                var bodyStr = JSON.stringify(bodyObject, null, '\t');
                var responseStr = response.statusCode + ' ' + response.statusMessage;
                res.render('query', {hostURL: HOST_URL, command: command, result: bodyStr, response: responseStr});
            } else {
                var responseStr = response.statusCode + ' ' + response.statusMessage;
                res.render('query', {hostURL: HOST_URL, command: command, result: response.body, response: responseStr});
            }
        } else {
            console.error(error);
            res.render('query', {hostURL: HOST_URL, command: command, response: error});
        }
    });
};

// wrapper functions to RippleAPI

exports.getAccountInfo = function(req, res) {
    console.log('getAccountInfo: ' + req.params.address);
    rapi.getAccountInfo(req.params.address).then(info => {
        res.send(info);
    }).catch((error) => {
        console.error(error);
        res.status(404).send(error.name + ': ' + error.message);
    });
};

exports.getServerInfo = function(req, res) {
    console.log('getServerInfo');
    rapi.getServerInfo().then(info => {
        res.send(info);
    }).catch((err) => {
        console.error(error);
        res.status(500).send(error.name + ': ' + error.message);
    });
};

exports.getTransaction = function(req, res) {
    console.log('getTransaction');
    rapi.getTransaction(req.params.id).then(info => {
        res.send(info);
    }).catch((err) => {
        console.error(err);
        res.status(404).send(err.name + ': ' + err.message);
    });
};

exports.getLedger = function(req, res) {
    console.log('getLedger');
    rapi.getLedger().then(info => {
        res.send(info);
    });
    // TODO: error handling
};

exports.getTrustlines = function(req, res) {
    console.log('getTrustlines: ' + req.params.address);
    rapi.getTrustlines(req.params.address).then(info => {
        res.send(info);
    });
    // TODO: error handling
};

exports.getBalances = function(req, res) {
    console.log('getBalances: ' + req.params.address);
    rapi.getBalances(req.params.address).then(info => {
        res.send(info);
    });
    // TODO: error handling
};