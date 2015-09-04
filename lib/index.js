/**
 * LittleBear web framework module
 * @module LittleBear
 * @author iMumu<imumu@foxmail.com>
 * @copyright iMumu
 */


/**
 * Module dependencies.
 * @private
 */

var fs = require('fs');
var path = require('path');

var express = require('express');
var Mod = require('./mod');


/**
 * LittleBear
 * @constructor
 * @example
 * var bear = new LittleBear({
 *     root: path.join(__dirname, 'server'),
 *     port: 3000
 * });
 * @param {Object} opts
 * @public
 */
var LittleBear = function(opts) {
    this._opts = opts;
    this.app = express();
    this._space = new Mod();

    this._init();
};

/**
 * Init routes and modules.
 * @private
 */
LittleBear.prototype._init = function() {
    var bear = this;
    bear._initDir('/', bear._opts.root, function(router) {
        bear.app.use(router);
        bear.app.use(LittleBear.static(bear._opts.root));
    });
    bear._space.runAll();
};

/**
 * Init directory.
 * @param {String} dirname
 * @param {String} dirpath
 * @param {Function} callback
 * @private
 */
LittleBear.prototype._initDir = function(dirName, dirPath, callback) {
    var bear = this;
    var fileNames = fs.readdirSync(dirPath);

    // init app.sv.js
    var index = fileNames.indexOf('app.sv.js');
    var app;
    if (index > -1) {
        app = express();
        var fileName = fileNames[index];
        var filePath = path.join(dirPath, fileName);
        bear._initFile(filePath, app, initRouterFiles);
        fileNames.splice(index, 1);
    }
    else {
        app = express.Router();
        initRouterFiles();
    }

    function initRouterFiles() {
        var total = 0, complete = 0;

        // init index.sv.js
        var index = fileNames.indexOf('index.sv.js');
        if (index > -1) {
            var fileName = fileNames[index];
            var filePath = path.join(dirPath, fileName);
            var indexRouter = express.Router();
            total += 1;
            bear._initFile(filePath, indexRouter, function() {
                app.use(indexRouter);
                complete += 1;
                initDirComplete();
            });
            fileNames.splice(index, 1);
        }

        // init other files
        fileNames.forEach(function(fileName) {
            if (isServerJs(fileName)) {
                var filePath = path.join(dirPath, fileName);
                var subRouter = express.Router();
                var name = getPureName(fileName);
                total += 1;
                bear._initFile(filePath, subRouter, function() {
                    app.use('/' + name, subRouter);
                    complete += 1;
                    initDirComplete(total, complete);
                });
            }
            else if (likeDir(fileName)) {
                var newDirPath = path.join(dirPath, fileName);
                total += 1;
                bear._initDir(fileName, newDirPath, function(subApp) {
                    app.use('/' + fileName, subApp);
                    complete += 1;
                    initDirComplete(total, complete);
                });
            }
        });
    }

    function initDirComplete(total, complete) {
        if (complete === total) {
            if (callback) {
                callback(app);
            }
        }
    }

};

/**
 * Init file.
 * @param {String} filePath - the absolute path of file
 * @param {Object} router
 * @param {Function} callback
 * @private
 */
LittleBear.prototype._initFile = function(filePath, router, callback) {
    var mod = require(filePath);
    if (!mod.name) {
        throw new Error('The module(' + filePath + ') must exports a name.');
    }
    if (!mod.deps) {
        mod.deps = {};
    }

    if (typeof mod.def !== 'function') {
        throw new Error('The module(' + filePath + ') must exports a def function.');
    }

    var def = function(mods) {
        var res = mod.def.call(router, mods);
        if (callback) {
            callback(res);
        }
        return res;
    };
    this._space.def(mod.name, mod.deps, def);
};

/**
 * Run app.
 * @returns {http.Server}
 * @public
 */
LittleBear.prototype.run = function() {
    return this.app.listen(this._opts.port);
};

/**
 * Static middleware.
 * @param {String} path - absolute path of the static directory
 * @returns {Object} static middleware
 * @public
 */
LittleBear.static = function(path) {
    var staticMiddleware = express.static(path);

    return function(req, res, next) {
        if (isPrivateUrl(req.url) || isServerJs(req.url)) {
            res.sendStatus(404);
        }
        else {
            staticMiddleware(req, res, next);
        }
    };
};

/**
 * Is a server js file?
 * @example
 * isServerJs('index.sv.js') // true
 * isServerJs('test.js') // false
 * isServerJs('other.css') // false
 *
 * @param {String} name - filename
 * @returns {Boolean}
 * @private
 */
function isServerJs(name) {
    return /.+\.sv\.js$/.test(name);
}

/**
 * Get file name exclude '.sv.js'.
 * @example
 * getPureName('index.sv.js') // 'index'
 *
 * @param {String} name - filename
 * @returns {String}
 * @private
 */
function getPureName(name) {
    return name.replace('.sv.js', '');
}

/**
 * Is the file or dir private?
 * @example
 * isPrivate('.git') // true
 * isPrivate('node_modules') // true
 * isPrivate('_test') // true
 * isPrivate('blog') // false
 *
 * @param {String} name - filename
 * @returns {Boolean}
 * @private
 */
function isPrivate(name) {
    return (name.indexOf('.') === 0 || name.indexOf('_') === 0 || name === 'node_modules');
}

/**
 * Does the filename look like a dir?
 * @example
 * likeDir('blog') // true
 * likeDir('blog.js') // false
 *
 * @param {String} name - filename
 * @returns {Boolean}
 * @private
 */
function likeDir(name) {
    return name.indexOf('.') === -1;
}

/**
 * Is a private url?
 * @example
 * isPrivateUrl('/blog/app.js') // false
 * isPrivateUrl('/blog/node_modules/test.js') // true
 *
 * @param {String} url
 * @returns {Boolean}
 * @private
 */
function isPrivateUrl(url) {
    var nodes = url.split('/');
    for (var node of nodes) {
        if (isPrivate(node)) {
            return true;
        }
    }
    return false;
}

module.exports = LittleBear;
