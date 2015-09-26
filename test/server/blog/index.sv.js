exports.deps = {
    Blog: 'models.Blog'
};

exports.def = function(mods) {
    this.get('/', function(req, res, next) {
        res.send(mods.Blog.find(0));
    });
};
