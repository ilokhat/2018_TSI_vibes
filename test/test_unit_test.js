// import symbolizer from '../src/Renderer/Symbolizer';
/* global  describe, it */
// assert,
// var itownsTesting = require('./itowns-testing.js');
// eslint-disable-next-line import/no-dynamic-require
var TileMesh = require(`${process.env.PWD}/lib/Core/TileMesh.js`).default;
// var THREE = require('three');
// var example = require('../examples/vibesTest.js');

var fnsetTextureElevation = TileMesh.prototype.setTextureElevation;
var maxDiffNodeLevelElevationZoom = 0;
TileMesh.prototype.setTextureElevation = function setTextureElevation(elevation) {
    fnsetTextureElevation.bind(this)(elevation);
    maxDiffNodeLevelElevationZoom = Math.max(maxDiffNodeLevelElevationZoom, this.level - elevation.texture.coords.zoom);
};

/*
function initialStateTest() {
    assert.equal(itownsTesting.counters.displayed_at_level[2], 26);

    // cant' write this because it's using PM textures
    // var orthoFetchCount = itownsTesting.counters.fetch.filter(u => u.indexOf('ORTHO') >= 0).length;
    // assert.ok(orthoFetchCount <= itownsTesting.counters.visible_at_level[1] + itownsTesting.counters.visible_at_level[2]);
}
*/

describe('Symbilizer', function () {
    it('coucou', () => {
    });
});
