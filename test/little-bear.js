var LittleBear = require('../lib/index.js');
var request = require('supertest');
var path = require('path');

var bear = new LittleBear({
    root: path.join(__dirname, 'server')
});

describe('app', function() {
    var app;

    before(function(done) {
        bear.init().then(function(bearApp) {
            app = bearApp;
            done();
        }).catch(done);
    });

    it('should get /', function(done) {
        request(app)
            .get('/')
            .expect(200)
            .expect('home')
            .end(done);
    });

    it('should get /app', function(done) {
        request(app)
            .get('/app')
            .expect(200)
            .expect('test blog')
            .end(done);
    });

    it('should get /about', function(done) {
        request(app)
            .get('/about')
            .expect(200)
            .expect('test')
            .end(done);
    });

    it('should get /error 500 and receive error message', function(done) {
        request(app)
            .get('/error')
            .expect(500)
            .expect('test error')
            .end(done);
    });

    it('should get /blog', function(done) {
        request(app)
            .get('/blog')
            .expect(200)
            .expect('test blog')
            .end(done);
    });

    it('should get /blog/public.js', function(done) {
        request(app)
            .get('/blog/public.js')
            .expect(200)
            .expect('// for test\n')
            .end(done);
    });

    it('should not get /_private/private.js', function(done) {
        request(app)
            .get('/_private/private.js')
            .expect(404)
            .end(done);
    });

    it('should get /noindex/no', function(done) {
        request(app)
            .get('/noindex/no')
            .expect(200)
            .end(done);
    });

});
