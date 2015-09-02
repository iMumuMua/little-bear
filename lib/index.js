var fs = require('fs');
var path = require('path');

var express = require('express');
var Mod = require('./mod');

/**
 * LittleBear constructor
 * @example
 * var bear = new LittleBear({
 *     root: path.join(__dirname, 'server'),
 *     port: 3000
 * });
 * @param {Object} opts
 **/
var LittleBear = function(opts) {
    this._opts = opts;
    this.app = express();
    this._space = new Mod();

    this._init();
};

LittleBear.prototype._init = function() {
    var router = this._initDir('/', this._opts.root);
    this._space.runAll();
    this.app.use(router);
    this.app.use(LittleBear.static(this._opts.root));
};

LittleBear.prototype._initDir = function(dirName, dirPath) {
    var bear = this;
    var fileNames = fs.readdirSync(dirPath);
    var router = express.Router();

    // 如果存在index.sv.js，先对其初始化
    var index = fileNames.indexOf('index.sv.js');
    if (index > -1) {
        var fileName = fileNames[index];
        var filePath = path.join(dirPath, fileName);
        var indexRouter = express.Router();
        bear._initFile(filePath, indexRouter);
        router.use(indexRouter);
        fileNames.splice(index, 1);
    }

    fileNames.forEach(function(fileName) {
        if (isServerJs(fileName)) {
            var filePath = path.join(dirPath, fileName);
            var subRouter = express.Router();
            bear._initFile(filePath, subRouter);

            var name = getPureName(fileName);
            router.use('/' + name, subRouter);
        }
        else if (likeDir(fileName)) {
            var newDirPath = path.join(dirPath, fileName);
            var subRouter = bear._initDir(fileName, newDirPath);
            router.use('/' + fileName, subRouter);
        }
    });

    return router;
};

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

function isServerJs(name) {
    return /.+\.sv\.js$/.test(name);
}

function getPureName(name) {
    return name.replace('.sv.js', '');
}

function isPrivate(name) {
    return (name.indexOf('.') === 0 || name.indexOf('_') === 0 || name === 'node_modules');
}

function likeDir(name) {
    return name.indexOf('.') === -1;
}

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
