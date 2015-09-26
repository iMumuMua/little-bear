exports.name = 'models.Blog';

exports.def = function(mods) {
    var blogs = ['test blog']
    return {
        find: function(index) {
            return blogs[index];
        }
    };
};
