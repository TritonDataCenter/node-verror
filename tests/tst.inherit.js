/*
 * tst.inherit.js: test that inheriting from VError and WError work as expected.
 */

var mod_assert = require('assert');
var mod_sys = require('util');

var mod_verror = require('../lib/verror');

var VError = mod_verror.VError;
var WError = mod_verror.WError;
var err, suberr;

function VErrorChild()
{
	VError.apply(this, Array.prototype.slice.call(arguments));
}

mod_sys.inherits(VErrorChild, VError);
VErrorChild.prototype.name = 'VErrorChild';


function WErrorChild()
{
	WError.apply(this, Array.prototype.slice.call(arguments));
}

mod_sys.inherits(WErrorChild, WError);
VErrorChild.prototype.name = 'WErrorChild';


suberr = new Error('root cause');
err = new VErrorChild(suberr, 'top');
mod_assert.ok(err instanceof Error);
mod_assert.ok(err instanceof VError);
mod_assert.ok(err instanceof VErrorChild);
mod_assert.equal(err.cause(), suberr);
mod_assert.equal(err.message, 'top: root cause');

suberr = new Error('root cause');
err = new WErrorChild(suberr, 'top');
mod_assert.ok(err instanceof Error);
mod_assert.ok(err instanceof WError);
mod_assert.ok(err instanceof WErrorChild);
mod_assert.equal(err.cause(), suberr);
mod_assert.equal(err.message, 'top');
