# little-bear
`little-bear` is a web framework that base on express.

# Table of contents
* [Quick Start](#quick-start)
    - [Create a server directory](#create-a-server-directory)
    - [Run LittleBear app](#run-littlebear-app)
* [Server Directory](#server-directory)
    - [Static Files Server](#static-files-server)
    - [Nodejs Server Script File](#nodejs-server-script-file)
        + [Modularization](#modularization)
        + [Routes](#routes)
* [Classic Website Server](#classic-website-server)
* [API Reference](#api-reference)
    - [new LittleBear(opts)](#new-littlebear-opts)
    - [LittleBear.prototype.run(port)](#littlebear-proto-run-port)
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
└── index.sv.js
```

index.sv.js:
```js
exports.name = 'home';

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

## Static Files Server
In LittleBear server directory, all files are public **unless**:
1. `node_modules/` directory
2. has prefix `.`, such as `.git/`, `.gitignore`
3. has prefix `_`, such as `_views/`

## Nodejs Server Script File
The file that has suffix `.sv.js` will be treated as server script file, `LittleBear` will require and run it.

### Modularization
A server script file is a module, it must export `name` and `def`:
```js
exports.name = 'models.article';

exports.def = function() {
    var Article = function() {/*...*/};
    return Article;
};
```

If a module has dependencies, it should export `deps`:
```js
exports.name = 'api.articles';

exports.deps = {
    Article: 'models.article'
};

exports.def = function(mods) {
    mods.Article.doSomething();
};
```

### Routes
LittleBear will set the routes automatically according to the file name.
Each server script `def` function's context is an instance of `express.Router`.
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
exports.name = 'home';
exports.def = function() {
    // GET /
    this.get('/', function(req, res, next) {
        res.send('home');
    });
};
```

about.sv.js:
```js
exports.name = 'about';
exports.def = function() {
    // GET /about
    this.get('/', function(req, res, next) {
        res.send('about');
    });
};
```

api/articles.sv.js:
```js
exports.name = 'articles';
exports.def = function() {
    // GET /api/articles
    this.get('/', function(req, res, next) {
        res.send('articles');
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
exports.name = 'blog';
exports.def = function() {
    // GET /blog
    this.get('/', function(req, res, next) {
        res.send('blog');
    });
};
```

# Classic Website Server
```
server/
├── api/
│   ├── articles.sv.js
│   └── users.sv.js
├── _views/
│   ├── articles.jade
│   └── index.jade
├── assets/
│   ├── js/
|   |   └── app.js
|   └── css/
│       └── theme.css
├── blog/
│   ├── js/
|   |   └── blog.js
|   ├── css/
│   |   └── blog.css
|   └── index.sv.js
└── index.sv.js
```

# API Reference

<a name="new-littlebear-opts"></a>
## new LittleBear(opts)

__Arguments__

* opts: {Object} - Initial options.
    - root: {String} - The absolute path of server directory.
    - initBeforeRoutes: {Function} - Init app before setting routes.
    - initAfterRoutes: {Function} - Init app after setting routes.
    - serveStatic: {Boolean} - If `true`, LittleBear will serve static files.

__Example__

```js
var bear = new LittleBear({
    root: path.join(__dirname, 'server'),
    initBeforeRoutes: function(app) {
        app.engine('jade', require('jade').__express);
        app.set('views', rootPath);
        app.set('view engine', 'jade');
    },
    initAfterRoutes: function(app) {
        app.use(function(err, req, res, next) {
            res.status(500).send(err.message);
        });
    },
    serveStatic: true
});
```

<a name="littlebear-proto-run-port"></a>
## LittleBear.prototype.run(port)

__Arguments__

* port: {Number} - The port number that LittleBear app will listen on.

__Example__

```js
var bear = new LittleBear(opts);
bear.run(3000);
```

# Features
* Test support

# License
[MIT](./LICENSE)