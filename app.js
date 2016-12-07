// var express = require('express');
// var app = express();
// var path = require('path');

// app.use('/scripts', express.static(path.join(__dirname, 'scripts')));

// // viewed at http://localhost:8080
// app.get('/', function(req, res) {
//     res.sendFile(path.join(__dirname + '/index.html'));
// });

// app.listen(8080);

'use strict';
var express = require('express');
var routes = require('./routes');
var app = express();
var bodyParser = require('body-parser');

// parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: false }))

// parse application/json
app.use(bodyParser.json())

// use pug for templating
app.set('view engine', 'pug');
app.set('views', './views')

app.get('/', routes.displayServerList);
app.post('/', routes.connectToServer);
app.get('/main', routes.main);
app.get('/query/:commandIndex', routes.query);
app.post('/query/:commandIndex', routes.submitQuery);

app.get('/account/:address', routes.getAccountInfo);
app.get('/server', routes.getServerInfo);
app.get('/transaction/:id', routes.getTransaction);
app.get('/ledger', routes.getLedger);
app.get('/trustlines/:address', routes.getTrustlines);
app.get('/balances/:address', routes.getBalances);

app.listen(3000, () => {
    console.log('Example app listening on port 3000!')
});