var VError = require('../lib/verror');

var err1 = new VError('something bad happened');
/* ... */
var err2 = new VError({
    'name': 'ConnectionError',
    'cause': err1,
    'info': {
        'errno': 'ECONNREFUSED',
        'remote_ip': '127.0.0.1',
        'port': 215
    }
}, 'failed to connect to "%s:%d"', '127.0.0.1', 215);

console.log(err2.message);
console.log(err2.name);
console.log(err2.info());
console.log(err2.stack);
