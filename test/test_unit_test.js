import symbolizer from '../src/Renderer/Symbolizer.js';
/* global itowns, assert, describe, it */
var itownsTesting = require('./itowns-testing.js');
// eslint-disable-next-line import/no-dynamic-require

var TileMesh = require(`${process.env.PWD}/lib/Core/TileMesh.js`).default;
var THREE = require('three');

var fnsetTextureElevation = TileMesh.prototype.setTextureElevation;
var maxDiffNodeLevelElevationZoom = 0;
TileMesh.prototype.setTextureElevation = function setTextureElevation(elevation) {
    fnsetTextureElevation.bind(this)(elevation);
    maxDiffNodeLevelElevationZoom = Math.max(maxDiffNodeLevelElevationZoom, this.level - elevation.texture.coords.zoom);
};

var example = require('../examples/vibesTest.js');

function initialStateTest() {
    assert.equal(itownsTesting.counters.displayed_at_level[2], 26);

    // cant' write this because it's using PM textures
    // var orthoFetchCount = itownsTesting.counters.fetch.filter(u => u.indexOf('ORTHO') >= 0).length;
    // assert.ok(orthoFetchCount <= itownsTesting.counters.visible_at_level[1] + itownsTesting.counters.visible_at_level[2]);
}

describe('Symbilizer', function () {

  it('coucou', () => {


  });


});
