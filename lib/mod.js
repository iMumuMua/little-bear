/**
 * Mod module.
 * @module Mod
 * @author iMumu<imumu@foxmail.com>
 * @copyright iMumu
 */

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
 * Run all modules
 */
Mod.prototype.runAll = function() {
    var self = this;
    this.modules.forEach(function(mod) {
        if (!mod.done) {
            self.runMod(mod.name);
        }
    });
};

/**
 * Run a module
 * @param {String} name - module name
 */
Mod.prototype.runMod = function(name) {
    var mod = getMod(name, this.modules);
    if (typeof mod.done === 'undefined') {
        var mods = {};
        for (var key in mod.deps) {
            mods[key] = this.runMod(mod.deps[key]);
        }
        try {
            mod.done = mod.fn.call(null, mods);
            if (typeof mod.done === 'undefined') {
                mod.done = null;
            }
        }
        catch (e) {
            console.log(e.stack);
        }
    }
    return mod.done;
};

/**
 * get module from modules by name
 * @param {String} name - module name
 * @param {Array<Object>} mods
 * @private
 */
function getMod(name, mods) {
    for (var i = 0, len = mods.length; i < len; i++) {
        var mod = mods[i];
        if (name === mod.name) {
            return mod;
        }
    }
}

module.exports = Mod;

