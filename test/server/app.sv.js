exports.deps = {
    Blog: 'models.Blog'
};

exports.def = function(mods, routes) {
    var LittleBear = require('../../lib');

    this.use(function(req, res, next) {
        req.appMid = mods.Blog.find(0);
        next();
    });

    routes();

    this.use(LittleBear.static(__dirname));

    this.use(function(err, req, res, next) {
        res.status(500).send(err.message);
    });
}