/**
 * RouteNode module.
 * @module RouteNode
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

/**
 * RouteNode
 * @constructor
 * @param {String} name - node name
 * @param {String} path - absolute path
 * @param {String} type - 'dir' or 'node'
 */
var RouteNode = function(name, path, type) {
    this.name = name;
    this.path = path;
    this.type = type;
    this.children = [];
    this.appPath = null;
    this.indexPath = null;
    this.router = null;
};

/**
 * Add child node.
 * @param {RouteNode} child - child node
 */
RouteNode.prototype.addChild = function(child) {
    this.children.push(child);
};

/**
 * Init RouteNode
 * @param  {Object} allMods
 */
RouteNode.prototype.init = function(allMods) {
    var node = this;

    if (node.type === 'dir') {
        if (node.appPath) {
            var appMod = require(node.appPath);
            var modsForApp = setMods(appMod.deps);
            node.router = express();
            appMod.def.call(node.router, modsForApp, routes);
        }
        else {
            node.router = express.Router();
            routes();
        }
    }
    else if (node.type === 'node') {
        node.router = express.Router();
        var nodeMod = require(node.path);
        var modsForNode = setMods(nodeMod.deps);
        nodeMod.def.call(node.router, modsForNode);
    }

    function setMods(deps) {
        var mods = {};
        if (deps) {
            for (var key in deps) {
                mods[key] = allMods[deps[key]];
            }
        }
        return mods;
    }

    function routes() {
        if (node.indexPath) {
            var indexMod = require(node.indexPath);
            var modsForIndex = setMods(indexMod.deps);
            indexMod.def.call(node.router, modsForIndex);
            for (var child of node.children) {
                child.init(allMods);
                node.router.use('/' + child.name, child.router);
            }
        }
    }
};

module.exports = RouteNode;
