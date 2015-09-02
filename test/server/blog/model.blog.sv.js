exports.name = 'model.blog';

exports.def = function(mods) {
    var blogs = ['test blog']
    return {
        find: function(index) {
            return blogs[index];
        }
    };
};
