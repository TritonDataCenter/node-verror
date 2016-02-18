var sprintf = require('extsprintf').sprintf;
var VError = require('../lib/verror');

/* err1 is used just to make sure this works with Error as the root cause */
var err1 = new Error('unknown failure');

/* err2 represents an ENOENT from open(2). */
var err2 = new VError({
    'cause': err1,
    'errno': 'ENOENT',
    'syscall': 'open',
    'filename': '/etc/my_config.json'
}, 'no such file or directory');

/*
 * err3 represents a higher-level error, like a failure to load configuration
 * *because* we failed to open the configuration file.
 */
var err3 = new VError({
    'name': 'InitError',
    'cause': err2
}, 'failed to load configuration');

console.log('TOP-LEVEL ERROR');
dump(err3);

function dump(err)
{
	var props = Object.keys(err).sort();
	var prop, i;

	/*
	 * Properties of the base class Error cannot be enumerated with
	 * Object.keys(), so just hardcode those.
	 */
	if (props.length === 0 && err.constructor == Error)
		props = [ 'message' ];

	/*
	 * "name" is not always reported.
	 */
	if (props.indexOf('name') == -1)
		props.unshift('name');

	console.log('%s',
	    sprintf('%15s: %s', 'constructor', err.constructor.name));
	for (i = 0; i < props.length; i++) {
		prop = props[i];

		if (prop != 'name' && !err.hasOwnProperty(prop))
			continue;

		if (prop == '_cause')
			continue;

		console.log('%s', sprintf('%15s: %s', prop, err[prop]));
	}

	console.log('%s', sprintf('%15s: %s', 'toString', err.toString()));

	var cause = err.cause ? err.cause() : null;
	if (cause) {
		console.log('\nCAUSED BY:');
		dump(cause);
	}
}
