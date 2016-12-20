function stringifyAmount(accountMap, amount) {
    if (amount.currency != 'XRP' && amount.hasOwnProperty('counterparty')) {
        return amount.value + ' ' + amount.currency + '.' + accountMap.getNameByAddress(amount.counterparty);
    } else {
        return amount.value + ' ' + amount.currency;
    }
}

exports.stringifyAmount = stringifyAmount;