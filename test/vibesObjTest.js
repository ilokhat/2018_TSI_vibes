var symbolizer = itowns.Symbolizer.prototype ;
var f = new File([""], "filename.text", {type: "text/plain"})

describe('readFile()', function () {
  it('fichier de type .obj attendu', function () {
    chai.expect( function(){ readFile(f); } ).to.throw("fichier de type .obj attendu");

  });
});

var parts = [
  new Blob(['v 0.123 0.234 0.345 1.0'], {type: 'text/plain'}),

  new Uint16Array([33])
];
var f1 = new File(parts, 'sample.obj') ;

describe('readFile()', function () {
  it("chargement d'un fichier obj", function () {
    chai.expect(  readFile(f1) ).to.equal(0);

  });
});



var mesh ;

describe('symbolizer.readVibes()', function () {
  it("fichier de style de type .vibes attendu", function () {
    chai.expect( function(){ symbolizer._readVibes(f,mesh); } ).to.throw("fichier de type .vibes attendu");

  });
});


var parts = [
  new Blob(['{"edges":{"opacity":0.4124241147981423,"color":0,"width":5},"faces":[{"name":"Tower1_Tower_Fence_posts_Tube_4","opacity":0.5836138769686149,"color":4947287,"emissive":4428373,"specular":4428373,"shininess":30,"texture":null}]}'], {type: 'text/plain'}),

  new Uint16Array([33])
];
var f2 = new File(parts, 'sample.vibes') ;
describe('symbolizer.readVibes()', function () {
  it("chargement d'un fichier de style vibes", function () {
    chai.expect(   symbolizer._readVibes(f2,mesh) ).to.equal(0);

  });
});

