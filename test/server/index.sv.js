exports.def = function(mods) {

    this.use(function(req, res, next) {
        req.testMid = 'test';
        next();
    });

    this.get('/', function(req, res, next) {
        res.send('home');
    });

    this.get('/app', function(req, res, next) {
        res.send(req.appMid);
    });

    this.get('/error', function(req, res, next) {
        next(new Error('test error'));
    });

};
