exports.name = 'about';

exports.def = function(mods) {
    
    this.get('/', function(req, res, next) {
        res.send(req.testMid);
    });

};
