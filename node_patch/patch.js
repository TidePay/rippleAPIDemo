function prompt(question, callback) {
  process.stdin.resume();
  process.stdout.write(question);

  process.stdin.once('data', function(data) {
    callback(data.toString().trim());
    process.stdin.pause();
  });
}

const question = 'Would you like to patch for ripple address (y/n)? ';
prompt(question, function(input) {
  if (input === 'y' || input === 'Y') {
    const patch0 = require('./patch0');
    const patch1 = require('./patch1');
    const patch2 = require('./patch2');
  }
});
