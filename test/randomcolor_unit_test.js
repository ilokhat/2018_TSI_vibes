var assert = require('chai').assert
import { getRandomColor } from '../src/Renderer/Symbolizer'
describe("random color",function() {
it("should return a string",function() {
    assert.typeOf(getRandomColor(),'string');
});
});
