var Mod = require('../lib/mod');

var testSpace = new Mod();

var hasRun = {
    a: false,
    b: false,
    c: false,
    d: false
};

testSpace.def('a', function() {
    hasRun.a = true;
    return function() {
        return 'mod a';
    };
});

testSpace.def('b', {
    A: 'a'
}, function(mods) {
    hasRun.b = true;
    mods.A().should.equal('mod a');
    return mods.A() + ' and mod b';
});

testSpace.def('c', function() {
    hasRun.c = true;
    return 'mod c';
});

testSpace.def('d', {
    B: 'b',
    C: 'c'
}, function(mods) {
    hasRun.d = true;
    mods.B.should.equal('mod a and mod b');
    mods.C.should.equal('mod c');
});

describe('mod', function() {
    it('should run all mods', function(done) {
        testSpace.runAll();
        for (var key in hasRun) {
            hasRun[key].should.be.true;
        }
        done();
    });

    it('should run one mod', function(done) {
        var modB = testSpace.runMod('b');
        modB.should.equal('mod a and mod b');
        done();
    });
});
