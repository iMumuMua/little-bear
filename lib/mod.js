/**
 * Mod module.
 * @module Mod
 * @author iMumu<imumu@foxmail.com>
 * @copyright iMumu
 */

'use strict';

/**
 * Mod
 * @constructor
 */
var Mod = function() {
    this.modules = [];
};

/**
 * Define a module.
 * @example
 * var mod = new Mod();
 * mod.def('LittleBear', {
 *     express: 'express'
 * }, function(mods) {
 *     var app = mods.express();
 * });
 *
 * @param {String} name - module name
 * @param {Object} deps - module dependencies
 * @param {Function} fn - module define function
 */
Mod.prototype.def = function(name, deps, fn) {
    var _deps, _fn;
    if (typeof deps === 'function') {
        _fn = deps;
    }
    else {
        _deps = deps;
        _fn = fn;
    }

    this.modules.push({
        name: name,
        deps: _deps ? _deps : {},
        fn: _fn
    });
};

/**
 * Get all modules
 * @return {Object} modules map
 */
Mod.prototype.getMods = function() {
    var mods = {};
    for (let mod of this.modules) {
        mods[mod.name] = mod.done;
    }
    return mods;
};

/**
 * Run all modules
 */
Mod.prototype.runAll = function() {
    for (let mod of this.modules) {
        if (!mod.done) {
            this.runMod(mod.name);
        }
    }
};

/**
 * Run a module
 * @param {String} name - module name
 */
Mod.prototype.runMod = function(name) {
    var mod = getMod(name, this.modules);
    if (!mod) {
        throw new Error(`Can not load module "${name}".`);
    }
    if (typeof mod.done === 'undefined') {
        var mods = {};
        for (let key in mod.deps) {
            mods[key] = this.runMod(mod.deps[key]);
        }
        try {
            mod.done = mod.fn.call(null, mods);
            if (typeof mod.done === 'undefined') {
                mod.done = null;
            }
        }
        catch (e) {
            console.log(`Run module "${name}" failed:`);
            console.log(e.stack);
        }
    }
    return mod.done;
};

/**
 * Get module from modules by name
 * @param {String} name - module name
 * @param {Array<Object>} mods
 * @private
 */
function getMod(name, mods) {
    for (let mod of mods) {
        if (name === mod.name) {
            return mod;
        }
    }
}

module.exports = Mod;

