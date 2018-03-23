import * as THREE from 'three';
import dalleClasse from './dalleClasse';

function clipMap(lon, lat, levels, scale, textureType) {
    THREE.Object3D.call(this);
    this.levels = (levels !== undefined) ? levels : 4;
    this.scale = (scale !== undefined) ? scale : 1;
    this.list = [];
    this.textureType = textureType;
    this.createMapWithSingleTile(lon, lat);
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

    createMap: function createMap(lon, lat) {
        var nbDallesCote = 2;
        if (this.textureType == '.jpg') nbDallesCote = 2;
        for (var i = -nbDallesCote / 2 + 1; i < nbDallesCote / 2 + 1; ++i) {
            for (var j = -nbDallesCote / 2; j < nbDallesCote / 2; ++j) {
                if (this.textureType == '.jpg') {
                    this.createTile(lon, lat, i, j, LODs.SECOND);
                } else if (Math.abs(i) < 1) {
                    this.createTile(lon, lat, i, j, LODs.ORIGIN);
                } else if (Math.abs(i) < 3) {
                    this.createTile(lon, lat, i, j, LODs.ORIGIN);
                } else {
                    this.createTile(lon, lat, i, j, LODs.THIRD);
                }
            }
        }
    },

    createMapWithSingleTile: function createMapWithSingleTile(lon, lat) {
        this.createTile(lon, lat, 0, 0, LODs.SECOND);
    },

    getListTiles: function getListTiles() {
        return this.list;
    },
};

export default clipMap;
