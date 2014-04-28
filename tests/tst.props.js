/*
 * Tests the way properties are inherited with nested errors.
 */

var mod_assert = require('assert');
var mod_fs = require('fs');
var mod_verror = require('../lib/verror');

var VError = mod_verror.VError;

var err1, err2, err3;

/* base case using "options" to specify cause */
err1 = new Error('bad');
err2 = new VError({
    'cause': err1
}, 'worse');
mod_assert.equal(err2.cause(), err1);
mod_assert.equal(err2.message, 'worse: bad');

/* simple property propagation using old syntax */
err1 = new Error('bad');
err1.name = 'MyError';
err1.errno = 'EDEADLK';
err2 = new VError(err1, 'worse');
mod_assert.equal(err1.name, 'MyError');
mod_assert.equal(err2.cause(), err1);
mod_assert.equal(err2.message, 'worse: bad');
mod_assert.equal(err2.errno, 'EDEADLK');
mod_assert.equal(err2.name, 'VError');

/* more complex propagation */
err1 = new Error('bad');
err1.name = 'MyError';
err1.errno = 'EDEADLK';
err2 = new VError({
    'cause': err1,
    '_cause': 'ignoreme',
    'stack': 'garbage',
    'message': 'junk',
    'syscall': 'portfs',
    'name': 'MyPortfsError'
}, 'worse');
mod_assert.equal(err1.name, 'MyError');

mod_assert.equal(err2.name, 'MyPortfsError');
mod_assert.equal(err2.cause(), err1);
mod_assert.equal(err2.message, 'worse: bad');
mod_assert.equal(err2.errno, 'EDEADLK');
mod_assert.equal(err2.syscall, 'portfs');
mod_assert.ok(err2._cause !== 'ignoreme');
mod_assert.ok(/    at /.test(err2.stack));

/* add a third-level to the chain */
err3 = new VError({
    'cause': err2,
    'name': 'BigError',
    'remote_ip': '127.0.0.1'
}, 'what next');
mod_assert.equal(err3.name, 'BigError');
mod_assert.equal(err3.remote_ip, '127.0.0.1');
mod_assert.equal(err3.cause(), err2);
mod_assert.equal(err3.message, 'what next: worse: bad');
mod_assert.equal(err3.errno, 'EDEADLK');
mod_assert.equal(err3.syscall, 'portfs');

/* test with built-in Node errors */
try {
	err1 = null;
	mod_fs.readFileSync('./nonexistent-file');
} catch (err) {
	err1 = err;
}

mod_assert.ok(err1 !== null);
mod_assert.equal(err1.code, 'ENOENT');
mod_assert.equal(err1.path, './nonexistent-file');
mod_assert.equal(err1.syscall, 'open');

err2 = new VError(err1, 'example error');
mod_assert.equal(err2.code, 'ENOENT');
mod_assert.equal(err2.path, './nonexistent-file');
mod_assert.equal(err2.syscall, 'open');

/* test overriding inherited properties */
err3 = new VError({
    'cause': err2,
    'syscall': 'my_syscall'
}, 'extra error');
mod_assert.equal(err3.message,
    'extra error: example error: ENOENT, no such file or ' +
    'directory \'./nonexistent-file\'');
mod_assert.equal(err3.code, 'ENOENT');
mod_assert.equal(err3.path, './nonexistent-file');
mod_assert.equal(err3.syscall, 'my_syscall');
console.log('test passed');
