const fs = require('fs');
const path = require('path');

let patchTarget;

patchTarget = path.resolve(__dirname, '../node_modules/ripple-lib/dist/npm/common/schemas/objects/address.json');
console.log('Patching ' + patchTarget);

// ripple-lib/dist/npm/common/schemas/objects/address.json
// "^r[1-9A-HJ-NP-Za-km-z]{25,34}$" => "^t[1-9A-HJ-NP-Za-km-z]{25,34}$"

fs.readFile(patchTarget, 'utf8', function (err,data) {
  if (err) {
    return console.log(err);
  }
  const result = data.replace("^r[1-9A-HJ-NP-Za-km-z]{25,34}$", "^t[1-9A-HJ-NP-Za-km-z]{25,34}$");

  fs.writeFile(patchTarget, result, 'utf8', function (err) {
     if (err) return console.log(err);
  });
});
