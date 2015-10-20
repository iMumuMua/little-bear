# little-bear
`little-bear` is a web framework that base on express.

[![Build Status](https://travis-ci.org/iMumuMua/little-bear.svg?branch=master)](https://travis-ci.org/iMumuMua/little-bear)

# Table of contents
* [Quick Start](#quick-start)
    - [Create a server directory](#create-a-server-directory)
    - [Run LittleBear app](#run-littlebear-app)
* [Server Directory](#server-directory)
    - [Static Files Middleware](#static-files-middleware)
    - [Nodejs Server Script File](#nodejs-server-script-file)
        + [Modularization](#modularization)
        + [Routes](#routes)
        + [app.sv.js](#app-sv-js)
* [API Reference](#api-reference)
    - [new LittleBear(opts)](#new-littlebear-opts)
    - [LittleBear.prototype.init()](#littlebear-proto-init)
    - [LittleBear.prototype.run(port)](#littlebear-proto-run-port)
    - [LittleBear.static(path)](#littbear-static-path)
* [Features](#features)
* [License](#license)

# Quick Start

## Create a server directory
A simple server looks like:
```
server/
├── theme.css
├── app.js
├── index.html
└── app.sv.js
```

app.sv.js:
```js
exports.def = function() {
    var path = require('path');

    this.get('/', function(req, res, next) {
        res.sendFile(path.join(__dirname, 'index.html'));
    });
};
```

index.html:
```html
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Hello, world!</title>
    <link rel="stylesheet" href="./theme.css">
</head>
<body>
    <h1>Hello, world!</h1>
    <script src="./app.js"></script>
</body>
</html>
```


## Run LittleBear app
Assuming that the project directory looks like:
```
project/
├── server/
└── app.js
```

app.js:
```js
var path = require('path');
var LittleBear = require('little-bear');

var bear = new LittleBear({
    root: path.join(__dirname, 'server')
});
bear.run(3000);
```

# Server Directory

## Static Files Middleware
You could use `LittleBear.static` middleware to serve static files:
```js
exports.def = function() {
    var LittleBear = require('little-bear');
    this.use(LittleBear.static(__dirname));
};
```

In static directory, all files are public **unless**:

1. `node_modules/` directory  
2. has prefix `.`, such as `.git/`, `.gitignore`  
3. has prefix `_`, such as `_views/`  
4. has suffix `.sv.js` or `.mod.js`  

## Nodejs Server Script File
The file that has suffix `.sv.js` or `.mod.js` will be treated as server script file, `LittleBear` will require and run it.

### Modularization
A server script file that has suffix `.mod.js` is a module, it must export `name` and `def`:
```js
exports.name = 'models.Article';

exports.def = function() {
    var Article = {};
    Article.find = function() {/*...*/};
    return Article;
};
```

If a module has dependencies, it should export `deps`:
```js
exports.name = 'someArticles';

exports.deps = {
    Article: 'models.Article'
};

exports.def = function(mods) {
    return mods.Article.find();
};
```

### Routes
LittleBear will set the routes automatically according to the file name.  
You could define routes in server script file that has suffix `.sv.js`. In these files, the context of `def` function is an instance of `express.Router` or `express.Application`.
```
server/
├── api/
│   ├── articles.sv.js
│   └── users.sv.js
├── blog/
│   └── index.sv.js
├── about.sv.js
└── index.sv.js
```

index.sv.js:
```js
exports.def = function() {
    // GET /
    this.get('/', function(req, res, next) {
        res.send('home');
    });
};
```

about.sv.js:
```js
exports.def = function() {
    // GET /about
    this.get('/', function(req, res, next) {
        res.send('about');
    });
};
```

api/articles.sv.js:
```js
exports.deps = {
    Article: 'models.Article'
};

exports.def = function(mods) {
    // GET /api/articles
    this.get('/', function(req, res, next) {
        res.json(mods.Article.find());
    });

    // GET /api/articles/:id
    this.get('/:id', function(req, res, next) {
        res.json({
            id: req.params.id
        });
    });
};
```

blog/index.sv.js:
```js
exports.def = function() {
    // GET /blog
    this.get('/', function(req, res, next) {
        res.send('blog');
    });
};
```

<a name="app-sv-js"></a>
### app.sv.js
If a directory has `app.sv.js` file, the directory will be mount as a sub app.  
The context of `def` function is an instance of `express.Application`.
```js
var LittleBear = require('little-bear');
exports.def = function(mods, routes) {
    this.engine('jade', require('jade').__express);
    this.set('views', rootPath);
    this.set('view engine', 'jade');

    routes(); // init routes, it must be called

    this.use(LittleBear.static(__dirname));

    this.use(function(err, req, res, next) {
        console.error(err.stack || err);
        res.sendStatus(500);
    });
};
```

# API Reference

<a name="new-littlebear-opts"></a>
## new LittleBear(opts)

__Arguments__

* opts: {Object} - Initial options.
    - root: {String} - The absolute path of server directory.

__Example__

```js
var bear = new LittleBear({
    root: path.join(__dirname, 'server')
});
```

<a name="littlebear-proto-init"></a>
## LittleBear.prototype.init()
Only init modules and routes.

__Return__

* {Promise}

__Example__

```js
var bear = new LittleBear(opts);
bear.init().then(function(app) {
    // app is an instance of express.Application
}).catch(console.error);
```

<a name="littlebear-proto-run-port"></a>
## LittleBear.prototype.run(port)
Init and run LittleBear app.

__Arguments__

* port: {Number} - The port number that LittleBear app will listen on.

__Example__

```js
var bear = new LittleBear(opts);
bear.run(3000);
```

<a name="littbear-static-path"></a>
## LittleBear.static(path)
Return a static server middleware.

__Arguments__

* path: {String} - The absolute path of static directory.

__Example__

In `app.sv.js`:
```js
var LittleBear = require('little-bear');
exports.def = function(mods, routes) {
    routes();
    this.use(LittleBear.static(__dirname));
};
```

# Features
* Test support

# License
[MIT](./LICENSE)