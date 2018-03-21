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


describe("symbolizer.zero()",function() {
  console.log("eeeeeeeeeeee", itowns.Symbolizer);
it("example test unitaire symbolizer",function() {
  chai.expect(  symbolizer.zero(5) ).to.equal(0);
});
});
var mesh ;
/*
describe('readVibes()', function () {
  it("fichier de style de type .vibes attendu", function () {
    chai.expect( function(){ readVibes(f,mesh); } ).to.throw("fichier de type .vibes attendu");

  });
});

describe('loadVibes()', function () {
  it("chargement d'un fichier de style vibes", function () {
    chai.expect( function(){ loadVibes(f,mesh); } ).to.throw("fichier de type .vibes attendu");

  });
});

var parts = [
  new Blob(['{"styles":[{"name":"Tower1_Tower_Fence_posts_Tube_4","opacity":1,"color":10425568,"emissive":10425568,"specular":10425568,"shininess":30,"colorEdges":0,"opacityEdges":1},{"name":"Tower1_window","opacity":1,"color":523217,"emissive":523217,"specular":523217,"shininess":30,"colorEdges":0,"opacityEdges":1},{"name":"Tower1_Tower_Fence_posts_Tube_6","opacity":1,"color":4037179,"emissive":4037179,"specular":4037179,"shininess":30,"colorEdges":0,"opacityEdges":1},{"name":"Tower1_Tower_Fence_posts_Tube_2","opacity":1,"color":14269523,"emissive":14269523,"specular":14269523,"shininess":30,"colorEdges":0,"opacityEdges":1},{"name":"Material.007","opacity":1,"color":15843252,"emissive":15843252,"specular":15843252,"shininess":30,"colorEdges":0,"opacityEdges":1},{"name":"Material.008","opacity":1,"color":900550,"emissive":900550,"specular":900550,"shininess":30,"colorEdges":0,"opacityEdges":1},{"name":"Material.006","opacity":1,"color":2815647,"emissive":2815647,"specular":2815647,"shininess":30,"colorEdges":0,"opacityEdges":1},{"name":"Tower1_Tower_Fence_posts_Tube_7","opacity":1,"color":16715575,"emissive":16715575,"specular":16715575,"shininess":30,"colorEdges":0,"opacityEdges":1},{"name":"Material.005","opacity":1,"color":3529302,"emissive":3529302,"specular":3529302,"shininess":30,"colorEdges":0,"opacityEdges":1},{"name":"Tower1_Tower","opacity":1,"color":15213721,"emissive":15213721,"specular":15213721,"shininess":30,"colorEdges":0,"opacityEdges":1},{"name":"Tower1_Tower_Fence_posts_Tube_5","opacity":1,"color":15325563,"emissive":15325563,"specular":15325563,"shininess":30,"colorEdges":0,"opacityEdges":1},{"name":"Tower1_Tower_Fence_posts_Tube_1","opacity":1,"color":10671342,"emissive":10671342,"specular":10671342,"shininess":30,"colorEdges":0,"opacityEdges":1},{"name":"Tower1_Tower_Fence_posts_Tube","opacity":1,"color":15927377,"emissive":15927377,"specular":15927377,"shininess":30,"colorEdges":0,"opacityEdges":1},{"name":"Tower1_Tower_Fence_posts_Tube_3","opacity":1,"color":5530002,"emissive":5530002,"specular":5530002,"shininess":30,"colorEdges":0,"opacityEdges":1}]}'], {type: 'text/plain'}),
  
  new Uint16Array([33])
];
var f2 = new File(parts, 'sample.vibes') ;
describe('loadVibes()', function () {
  it("chargement d'un fichier vibes", function () {
    chai.expect(  loadVibes(f2,mesh) ).to.equal(0);

  });
});
*/







