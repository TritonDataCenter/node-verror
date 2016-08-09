var MultiError = require('../lib/verror').MultiError;

var err = new MultiError([
    new Error('failed to resolve DNS name "abc.example.com"'),
    new Error('failed to resolve DNS name "def.example.com"')
]);
console.error(err.message);
