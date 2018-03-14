
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
var file = new File(parts, 'sample.obj') ;

describe('readFile()', function () {
  it("chargement d'un fichier obj", function () {
    chai.expect(  readFile(file) ).to.equal(0);

  });
});
var mesh ;

describe('loadVibes()', function () {
  it("fichier de style de type .vibes attendu", function () {
    chai.expect( function(){ loadVibes(f,mesh); } ).to.throw("fichier de type .vibes attendu");

  });
});




