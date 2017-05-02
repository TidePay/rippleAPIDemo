const fs = require('fs');
const path = require('path');

let patchTarget;

patchTarget = path.resolve(__dirname, '../node_modules/ripple-address-codec/src/index.js');
console.log('Patching ' + patchTarget);

// ripple-address-codec/src/index.js
// defaultAlphabet: 'ripple', => defaultAlphabet: 'tidepay',
//+ alphabets = {tidepay: 'tpshnaf39wBUDNEGxHJyKLM4PQzRST7VWXYZ2bcdeCg65jkm8oFqi1ruvA'},

fs.readFile(patchTarget, 'utf8', function (err,data) {
  if (err) {
    return console.log(err);
  }
  const result = data.replace("defaultAlphabet: 'ripple',", "defaultAlphabet: 'tidepay',\n  alphabets: {tidepay: 'tpshnaf39wBUDNEGxHJyKLM4PQzRST7VWXYZ2bcdeCg65jkm8oFqi1ruvA'},");

  fs.writeFile(patchTarget, result, 'utf8', function (err) {
     if (err) return console.log(err);
  });
});
