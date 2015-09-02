exports.name = 'blog';

exports.deps = {
    Blog: 'model.blog'
};

exports.def = function(mods) {
    this.get('/', function(req, res, next) {
        res.send(mods.Blog.find(0));
    });
};
