/**
 * LittleBear web framework module
 * @module LittleBear
 * @author iMumu<imumu@foxmail.com>
 * @copyright iMumu
 */

'use strict';

/**
 * Module dependencies.
 * @private
 */
var fs = require('fs');
var path = require('path');

var express = require('express');
var Mod = require('./mod');
var RouteNode = require('./route-node');


/**
 * LittleBear
 * @constructor
 * @example
 * var bear = new LittleBear({
 *     root: path.join(__dirname, 'server')
 * });
 * @param {Object} opts
 * @public
 */
var LittleBear = function(opts) {
    this.app = express();
    this._modSpace = new Mod();
    this._mods = null;
    this._rootNode = new RouteNode('/', opts.root, 'dir');
    this._modJs = [];
};

/**
 * Traverse dir and get all `sv.js` and `mod.js`.
 * @param {Object} node - routeTree node
 * @returns {Promise}
 */
LittleBear.prototype._walk = function(node) {
    var bear = this;
    var df = Promise.defer();
    fs.readdir(node.path, function(err, files) {
        if (err) df.reject(err);
        else readSuccess(files);
    });
    function readSuccess(files) {
        var total = files.length;
        var finish = 0;
        var tryToFinish = function() {
            finish += 1;
            if (finish === total) {
                df.resolve();
            }
        };
        files.forEach(function(file) {
            var filePath = path.join(node.path, file);
            fs.stat(filePath, function(err, stat) {
                if (err) df.reject(err);
                else statSuccess(stat);
            });
            function statSuccess(stat) {
                if (stat.isFile()) {
                    if (isServerJs(file)) {
                        if (file === 'app.sv.js') {
                            node.appPath = filePath;
                        }
                        else if (file === 'index.sv.js') {
                            node.indexPath = filePath;
                        }
                        else {
                            let child = new RouteNode(getPureName(file), filePath, 'node');
                            node.addChild(child);
                        }
                    }
                    else if (isModJs(file)) {
                        bear._modJs.push({
                            path: filePath
                        });
                    }
                    tryToFinish();
                }
                else if (stat.isDirectory()) {
                    let child = new RouteNode(file, filePath, 'dir');
                    node.addChild(child);
                    bear._walk(child)
                    .then(tryToFinish, df.reject);
                }
            }
        });
    }
    return df.promise;
};

/**
 * Init LittleBear app
 * @example
 * var bear = new LittleBear({root: './'});
 * bear.init().then(function(app) {
 *     // app is an instance of express.Application
 * });
 * @returns {Promise}
 */
LittleBear.prototype.init = function() {
    var bear = this;
    var df = Promise.defer();
    bear._walk(bear._rootNode)
    .then(function() {
        for (let modJs of bear._modJs) {
            let mod = require(modJs.path);
            if (!mod.deps) {
                mod.deps = {};
            }
            bear._modSpace.def(mod.name, mod.deps, mod.def);
        }
        bear._modSpace.runAll();
        return Promise.resolve(bear._modSpace.getMods());
    })
    .then(function(allMods) {
        bear._rootNode.init(allMods);
        bear.app.use(bear._rootNode.router);
        df.resolve(bear.app);
    })
    .catch(df.reject);

    return df.promise;
}

/**
 * Run app.
 * @param {Number} port
 * @public
 */
LittleBear.prototype.run = function(port) {
    this.init()
    .then(function(app) {
        app.listen(port);
        console.log('LittleBear app listen on', port);
    })
    .catch(function(err) {
        console.error(err.stack || err);
    });
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
        if (isPrivateUrl(req.url) || isServerJs(req.url) || isModJs(req.url)) {
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
 * Is a mod js file?
 * @example
 * isModJs('blog.mod.js') // true
 * isModJs('test.js') // false
 *
 * @param  {String} name - filename
 * @return {Boolean}
 * @private
 */
function isModJs(name) {
    return /.+\.mod\.js$/.test(name);
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
    for (let node of nodes) {
        if (isPrivate(node)) {
            return true;
        }
    }
    return false;
}

module.exports = LittleBear;
