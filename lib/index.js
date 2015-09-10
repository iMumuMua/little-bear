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
 *     initBeforeRoutes: function(app) {
 *         app.engine('jade', require('jade').__express);
 *         app.set('views', rootPath);
 *         app.set('view engine', 'jade');
 *     },
 *     initAfterRoutes: function(app) {
 *         app.use(function(err, req, res, next) {});
 *     },
 *     serveStatic: true
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
    if (typeof this._opts.initBeforeRoutes === 'function') {
        this._opts.initBeforeRoutes(this.app);
    }

    var rootRouter = this._initDir('/', this._opts.root);
    this.app.use(rootRouter);

    if (this._opts.serveStatic) {
        this.app.use(LittleBear.static(this._opts.root));
    }

    if (typeof this._opts.initAfterRoutes === 'function') {
        this._opts.initAfterRoutes(this.app);
    }

    this._space.runAll();
};

/**
 * Init directory.
 * @param {String} dirname
 * @param {String} dirpath
 * @returns {Router} return dirRouter
 * @private
 */
LittleBear.prototype._initDir = function(dirName, dirPath) {
    var bear = this;
    var fileNames = fs.readdirSync(dirPath);

    var dirRouter = express.Router();

    // init index.sv.js
    var index = fileNames.indexOf('index.sv.js');
    if (index > -1) {
        var fileName = fileNames[index];
        var filePath = path.join(dirPath, fileName);
        var indexRouter = express.Router();
        dirRouter.use(indexRouter);
        bear._initFile(filePath, indexRouter);
        fileNames.splice(index, 1);
    }

    // init other files
    fileNames.forEach(function(fileName) {
        if (isServerJs(fileName)) {
            var filePath = path.join(dirPath, fileName);
            var subRouter = express.Router();
            var name = getPureName(fileName);
            dirRouter.use('/' + name, subRouter);
            bear._initFile(filePath, subRouter);
        }
        else if (likeDir(fileName)) {
            var newDirPath = path.join(dirPath, fileName);
            var stat = fs.statSync(newDirPath);
            if (stat.isDirectory()) {
                var subDirRouter = bear._initDir(fileName, newDirPath);
                dirRouter.use('/' + fileName, subDirRouter);
            }
        }
    });

    return dirRouter;
};

/**
 * Init file.
 * @param {String} filePath - the absolute path of file
 * @param {Object} router
 * @private
 */
LittleBear.prototype._initFile = function(filePath, router) {
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
        return mod.def.call(router, mods);
    };
    this._space.def(mod.name, mod.deps, def);
};

/**
 * Run app.
 * @param {Number} port
 * @returns {http.Server}
 * @public
 */
LittleBear.prototype.run = function(port) {
    return this.app.listen(port);
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
    for (var i = 0, len = nodes.length; i < len; i++) {
        var node = nodes[i];
        if (isPrivate(node)) {
            return true;
        }
    }
    return false;
}

module.exports = LittleBear;
