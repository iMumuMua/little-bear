var Mod = function() {
    this.modules = [];
};

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

Mod.prototype.runAll = function() {
    for (var mod of this.modules) {
        if (!mod.done) {
            this.runMod(mod.name);
        }
    }
};

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

function getMod(name, mods) {
    for (var mod of mods) {
        if (name === mod.name) {
            return mod;
        }
    }
}

module.exports = Mod;

