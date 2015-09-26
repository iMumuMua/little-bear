exports.def = function(mods, routes) {
    this.use(function(req, res, next) {
        req.appMid = 'blog';
        next();
    });

    routes();
}