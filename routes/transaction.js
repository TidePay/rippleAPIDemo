// helper function to sign and submit a prepared transaction

const TRANSACTION_QUERY_RESULT_INTERVAL = 1000; // 1 second
const TRANSACTION_MAX_LEDGER_VERSION_OFFSET = 3;

function queryTransactionFinalResult(api, transactionID, ledgerVersionOptions) {
    console.log('Query transaction final result');

    return api.getTransaction(transactionID, ledgerVersionOptions).then(info => {
        return Promise.resolve(info.outcome);
    }).catch(err => {
        // transaction cannot be found, wait and query again
        if (err instanceof api.errors.PendingLedgerVersionError) {
            return new Promise((resolve, reject) => {
                setTimeout(() => {
                    queryTransactionFinalResult(api, transactionID, ledgerVersionOptions).then(outcome => {
                        resolve(outcome);
                    }).catch(err => {
                        reject(err);
                    });
                }, TRANSACTION_QUERY_RESULT_INTERVAL);
            });
        } else {
            return Promise.reject(err);
        }
    });
}

function signAndSubmitTransaction(api, preparedTransaction, accountSecret) {
    console.log('prepare:');
    console.log(preparedTransaction);
    console.log('sign');

    var result = new Object();

    var signed = api.sign(preparedTransaction.txJSON, accountSecret);
    result.transactionID = signed.id;
    console.log('Transaction ID: ' + signed.id);
    console.log('submit');

    return api.getLedgerVersion().then(ledgerVersion => {
        result.ledgerVersionOptions = {
            'minLedgerVersion': ledgerVersion,
            'maxLedgerVersion': preparedTransaction.instructions.maxLedgerVersion
        }
        return api.submit(signed.signedTransaction);
    }).then(submitted => {
        console.log('Preliminary result code: ' + submitted.resultCode);
        console.log('Preliminary result message: ' + submitted.resultMessage);
        result.preliminaryResultCode = submitted.resultCode;
        result.preliminaryResultMessage = submitted.resultMessage;

        // if transaction was not successfully submitted, return result immediately
        const codeCategory = result.preliminaryResultCode.substring(0,3);
        switch (codeCategory) {
            case 'tef':
            case 'tem':
            case 'tel':
                result.finalResult = 'Not in ledger.';
                return Promise.resolve(result);
            default:
                break;
        }

        // wait for the final result
        return new Promise((resolve, reject) => {
            setTimeout(() => {
                queryTransactionFinalResult(api, result.transactionID, result.ledgerVersionOptions).then(outcome => {
                    result.finalResult = JSON.stringify(outcome, null, 2);
                    resolve(result);
                }).catch(err => {
                    result.finalResult = '[' + err.name + '(' + err.message + ')]';
                    resolve(result);
                });
            }, TRANSACTION_QUERY_RESULT_INTERVAL);
        });
    }).catch(err => {
        return Promise.reject(err);
    });
};

const instructions = {
    'maxLedgerVersionOffset': TRANSACTION_MAX_LEDGER_VERSION_OFFSET
};

exports.signAndSubmitTransaction = signAndSubmitTransaction;
exports.instructions = instructions;