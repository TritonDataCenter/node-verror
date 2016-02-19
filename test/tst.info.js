/*
 * tst.info.js: tests the way informational properties are inherited with nested
 * errors.
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
mod_assert.deepEqual(err2.info(), {});

/* simple info usage */
err1 = new VError({
    'name': 'MyError',
    'info': {
	'errno': 'EDEADLK',
	'anobject': { 'hello': 'world' }
    }
}, 'bad');
mod_assert.equal(err1.name, 'MyError');
mod_assert.deepEqual(err1.info(), {
    'errno': 'EDEADLK',
    'anobject': { 'hello': 'world' }
});

/* simple property propagation using old syntax */
err2 = new VError(err1, 'worse');
mod_assert.equal(err2.cause(), err1);
mod_assert.equal(err2.message, 'worse: bad');
mod_assert.deepEqual(err2.info(), {
    'errno': 'EDEADLK',
    'anobject': { 'hello': 'world' }
});

/* one property override */
err2 = new VError({
    'cause': err1,
    'info': {
	'anobject': { 'hello': 'moon' }
    }
}, 'worse');
mod_assert.equal(err2.cause(), err1);
mod_assert.equal(err2.message, 'worse: bad');
mod_assert.deepEqual(err2.info(), {
    'errno': 'EDEADLK',
    'anobject': { 'hello': 'moon' }
});

/* add a third-level to the chain */
err3 = new VError({
    'cause': err2,
    'name': 'BigError',
    'info': {
	'remote_ip': '127.0.0.1'
    }
}, 'what next');
mod_assert.equal(err3.name, 'BigError');
mod_assert.equal(err3.info().remote_ip, '127.0.0.1');
mod_assert.equal(err3.cause(), err2);
mod_assert.equal(err3.message, 'what next: worse: bad');
mod_assert.equal(err3.info().errno, 'EDEADLK');
mod_assert.deepEqual(err3.info().anobject, { 'hello': 'moon' });

console.log('test passed');
