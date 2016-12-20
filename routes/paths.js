const utils = require('./utils.js');

// operation: get paths

function showGetPaths(req, res) {
    res.render('getPaths', {'accountList': this.accountList});
};

function getPaths(req, res, next) {
    const source = this.accountList[req.body.sourceAccount];
    const destination = this.accountList[req.body.destinationAccount];
    var destinationAmount = {
        'currency': req.body.destinationCurrency,
        'value': req.body.destinationAmount
    }
    if (destinationAmount.currency != 'XRP') {
        destinationAmount.counterparty = this.accountList[req.body.destinationCounterparty].address;
    }

    const pathfind = {
        'source': {
            'address' : source.address
        },
        'destination': {
            'address': destination.address,
            'amount': destinationAmount
        }
    };
    var processedResult = new Object();
    console.log('getPaths');
    this.api.getPaths(pathfind).then(results => {
        processedResult.rawJSON = JSON.stringify(results, null, 2);
        processedResult.srcDstPairs = [];
        for (var i = 0; i < results.length; i++) {
            var pair = results[i];
            pair.source.account = this.accountMap.getNameByAddress(pair.source.address);
            pair.destination.account = this.accountMap.getNameByAddress(pair.destination.address);

            pair.source.maxAmount = utils.stringifyAmount(this.accountMap, pair.source.maxAmount);
            pair.destination.amount = utils.stringifyAmount(this.accountMap, pair.destination.amount);

            pair.pathsObject = JSON.parse(pair.paths);
            for (var j = 0; j < pair.pathsObject.length; j++) {
                var path = pair.pathsObject[j];
                for (var k = 0; k < path.length; k++) {
                    var step = path[k];
                    if (step.hasOwnProperty('account')) {
                        step.account = this.accountMap.getNameByAddress(step.account);
                    }
                    if (step.hasOwnProperty('issuer')) {
                        step.issuer = this.accountMap.getNameByAddress(step.issuer);
                    }
                }
            }

            processedResult.srcDstPairs.push(pair);
        }
        res.render('getPathsResult', {'accountList': this.accountList, 'result': processedResult});
    }).catch(err => {
        next(err);
    });
};

exports.showGetPaths = showGetPaths;
exports.getPaths = getPaths;