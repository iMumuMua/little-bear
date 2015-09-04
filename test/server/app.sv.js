exports.name = 'app';

exports.def = function(mods) {
    var app = this;

    app.use(function(req, res, next) {
        req.appMid = 'app';
        next();
    });

};
