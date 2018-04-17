/**
 * Edit On: april 2018
 * Class: clipMap
 * Description:  Part extracted from 'itowns-legacy' {@link https://github.com/iTowns/itowns-legacy}
 * project VIBES
 * author: Adouni, Bouchaour, Grégoire, Mathelier, Nino, Ouhabi, Schlegel
 */

import * as THREE from 'three';
import dalleClasse from './dalleClasse';

function clipMap(lon, lat, levels, scale, textureType, dataURL) {
    THREE.Object3D.call(this);
    this.levels = (levels !== undefined) ? levels : 4;
    this.list = [];
    this.textureType = textureType;
    this.createMapWithSingleTile(lon, lat, dataURL);
}

var LODs = {
    ORIGIN: 2,
    SECOND: 4,
    THIRD: 8,
    FOURTH: 16,
};

clipMap.prototype = {

    createTile: function createTile(lon, lat, x, y, lod, dataURL) {
        var name = (lon + x).toString().concat('-', (lat + y).toString());
        var dalle = new dalleClasse();
        dalle.dataURL = dataURL;
        dalle.setNamePath(name);
        dalle.setLoDLevel(lod);
        dalle.setTextureType(this.textureType);
        this.list.push(dalle);
    },

    createMapWithSingleTile: function createMapWithSingleTile(lon, lat, dataURL) {
        this.createTile(lon, lat, 0, 0, LODs.SECOND, dataURL);
    },

    getListTiles: function getListTiles() {
        return this.list;
    },
};

export default clipMap;
