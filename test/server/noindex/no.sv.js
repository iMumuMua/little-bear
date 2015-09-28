exports.def = function() {
    this.get('/', function(req, res, next) {
        res.sendStatus(200);
    });
};