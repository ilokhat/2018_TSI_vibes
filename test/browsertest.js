/* global itowns, describe, it */
var chai;
var assert = chai.assert;
var expect = chai.expect;
var parts;

var manager = itowns.LayerManager.prototype;
var symbolizer = itowns.Symbolizer.prototype;

var f = new File([''], 'filename.text', { type: 'text/plain' });

describe('LayerManager._readFile()', function () {
    it('Expected .obj or .gibes file', function () {
        chai.expect(function () { manager._readFile(f); }).to.throw('Unvalid format');
    });
    it('the file loaded is not .obj', function () {
        assert.notTypeOf(f, '.obj');
    });
    it('the file loaded is not .gibes', function () {
        assert.notTypeOf(f, '.gibes');
    });
});

parts = [
    new Blob(['v 0.123 0.234 0.345 1.0'], { type: 'text/plain' }),
    new Uint16Array([33]),
];
var f1 = new File(parts, 'file.obj');

describe('LayerManager._readFile()', function () {
    it('file loaded should be a file.obj', function () {
        expect(f1).to.have.property('name', 'file.obj');
    });
    it('.obj file loaded successfully', function () {
        chai.expect(manager._readFile(f1)).to.equal(0);
    });
});

parts = [
    new Blob(['{"name":"croutitower","coordX":4202010,"coordY":178050,"coordZ":4779009,"rotateX":-3.093,"rotateY":0.851,"rotateZ":-1.634,"scale":300}'], { type: 'text/plain' }),
    new Uint16Array([33]),
];
var f2 = new File(parts, 'sample.obj');

describe('LayerManager._readFile()', function () {
    it('file loaded should not be empty', function () {
        expect(f2).not.to.be.a('');
    });
    it('.gibes file loaded successfully', function () {
        chai.expect(manager._readFile(f2)).to.equal(0);
    });
});

var folder;

describe('symbolizer.readVibes()', function () {
    it('Expected .vibes file ', function () {
        chai.expect(function () { symbolizer._readVibes(f, folder); }).to.throw('Unvalid format');
    });
});

parts = [
    new Blob(['{"edges":{"opacity":0.4124241147981423,"color":0,"width":5},"faces":[{"name":"Tower1_Tower_Fence_posts_Tube_4","opacity":0.5836138769686149,"color":4947287,"emissive":4428373,"specular":4428373,"shininess":30,"texture":null}]}'], { type: 'text/plain' }),
    new Uint16Array([33]),
];
var f3 = new File(parts, 'sample.vibes');
describe('symbolizer.readVibes()', function () {
    it('.vibes file loaded successfully', function () {
        chai.expect(symbolizer._readVibes(f3, folder)).to.equal(0);
    });
});
