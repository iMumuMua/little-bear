exports.name = 'home';

exports.def = function(mods) {

    this.use(function(req, res, next) {
        req.testMid = 'test';
        next();
    });
    
    this.get('/', function(req, res, next) {
        res.send('home');
    });

    
};
