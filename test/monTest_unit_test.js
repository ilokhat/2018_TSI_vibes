var itownsTesting = require('./itowns-testing.js');
var example = require('../examples/vibesTest.js');
var f = new File([""], "filename.text", {type: "text/plain"})

describe('readFile()', function () {
  it('fichier de type .obj attendu', function () {
    chai.expect( function(){ example.readFile(f); } ).to.throw("fichier de type .obj attendu");

  });
});
