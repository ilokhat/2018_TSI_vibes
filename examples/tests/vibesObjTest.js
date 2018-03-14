var vibesObj = require("../vibesObj.js");
var assert = require('assert');

describe('add', function(){
    it('should work', function(){
        var result = vibesObj.ajout(5,6);
        assert.equal(result, 11);
    });
}); 
