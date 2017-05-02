const fs = require('fs');
const path = require('path');

let patchTarget;

patchTarget = path.resolve(__dirname, '../node_modules/ripple-binary-codec/distrib/npm/types/account-id.js');
console.log('Patching ' + patchTarget);

// ripple-binary-codec/distrib/npm/types/account-id.js
// "/^r/" => "/^t/"

fs.readFile(patchTarget, 'utf8', function (err,data) {
  if (err) {
    return console.log(err);
  }
  const result = data.replace("/^r/", "/^t/");

  fs.writeFile(patchTarget, result, 'utf8', function (err) {
     if (err) return console.log(err);
  });
});
