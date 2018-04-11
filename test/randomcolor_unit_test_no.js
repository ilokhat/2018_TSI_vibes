import { getRandomColor } from '../src/Renderer/Symbolizer';

var assert = require('chai').assert;

/* global describe, it */

describe('random color', function () {
    it('should return a string', function () {
        assert.typeOf(getRandomColor(), 'string');
    });
});
