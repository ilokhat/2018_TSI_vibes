import * as THREE from 'three';
import clipMap from './clipMap';
import gfxEngine from './gfxEngine';
import dalleClasse from './dalleClasse';

/*
 * To manage Bati 3D layer
 * quocdinh dot nguyen at gmail dot com
 */

// GLOBAL VARIABLE

var _textureType = '.dds';

var requestAnimSelectionAlpha = (function select() {
    return window.requestAnimationFrame ||
    window.webkitRequestAnimationFrame ||
    window.mozRequestAnimationFrame ||
    window.oRequestAnimationFrame ||
    window.msRequestAnimationFrame ||
    function defaultFunction(callback, element) {
        window.setTimeout(callback, 1000 / 60);
    };
}());

// zone de travail; (EPSG:2153 = lambert94 ) / 500
var bbox = { xmin: 1286,
    xmax: 1315, // +1
    ymin: 13715,
    ymax: 13734, // +1
};
const Cartography3D = {
    intialized: false,
    opacity: 1,
    carte3Dactivated: false,
    grid: [],
    dalleSet: {},
    listDalles: [],
    scale: 500,
    zero: null,
    // zone de travail; EPSG:2153 = lambert94
    limitZone: {
        xmin: bbox.xmin * 500,
        xmax: bbox.xmax * 500,
        ymin: bbox.ymin * 500,
        ymax: bbox.ymax * 500,
    },
    videoGamesOn: false,
    dataURL: '',
    nbSeeds: 5,
    dateNow: null,
    timeLapse: null,
    counterAdded: false,
    arrTargets: [],
    iteration: 0,   // For updating loop
    light: new THREE.Vector3(0.0, -0.5, -1.0).normalize(),
    gridWeather: [],
    gridGeometry: null,
    textureType: 'dds',
    raycaster: new THREE.Raycaster(), // create once
    // grillMap
    gmap: null,

    generateGrid: function generateGrid() {
        this.grid = [];
        var nbdallesX = bbox.xmax - bbox.xmin + 1;
        var nbdallesY = bbox.ymax - bbox.ymin + 1;
        var i;
        for (i = 0; i < nbdallesX; i++) {
            this.grid[i] = [];
        }
        // on parcourt les lignes...
        for (i = 0; i < nbdallesX; i++) {
            // ... et dans chaque ligne, on parcourt les cellules
            for (var j = 0; j < nbdallesY; j++) {
                this.grid[i][j] = null;
            }
        }
    },

    isDataAvailable: function isDataAvailable(p) {
        /*
        console.log('isDataAvailable', (p.x > this.limitZone.xmin) && (p.x < this.limitZone.xmax) && (p.z > this.limitZone.ymin) && (p.z < this.limitZone.ymax));
        return (p.x > this.limitZone.xmin) && (p.x < this.limitZone.xmax) && (p.z > this.limitZone.ymin) && (p.z < this.limitZone.ymax);
        */
       return true;
    },

    setInitStatus: function setInitStatus(v) {
        this.intialized = v;
    }, 

    setVisibility: function setVisibility(v) {
        for (var dalle in this.listDalles) {
            if (Object.prototype.hasOwnProperty.call(this.listDalles, dalle)) {
                this.listDalles[dalle].setVisible(v);
            }
        }
    },

    loadAllDalles: function loadAllDalles() {
        for (var i = 0; i < this.grid.length; i++) {
            for (var j = 0; j < this.grid[i].length; j++) {
                var lat = (i + bbox.xmin) * 500;
                var lon = (j + bbox.ymin) * 500;
                var name = (i + bbox.xmin).toString().concat('-', (j + bbox.ymin).toString());
                var dalle = new dalleClasse();
                dalle.dataURL = this.dataURL;
                dalle.textureType = this.textureType;
                dalle.setDalleZeroPivot(new THREE.Vector3(lat + 250, lon + 250, 0));
                dalle.setNamePath(name);
                dalle.setLoDLevel(2);
                dalle.load();
                this.grid[i][j] = dalle;
                // empty texture cache
                this.dalleSet[name] = dalle;
                // add to Global listDalles
                this.listDalles.push(dalle);
            }
        }
    },
    initCarto3D: function initCarto3D(options) {
        this.dataURL = options.url;
        this.textureType = '.dds';
        console.log('this.textureType', this.textureType);
        _textureType = this.textureType;
        /*
        var pos = gfxEngine.getCameraPosition();
        console.log('pos', pos);
        */
        this.generateGrid();
        /*
        if (this.isDataAvailable(pos)) {
            this.loadDallesAroundPosition(pos);
            this.setInitStatus(true);
        }
        */
        // chargement de toutes les dalles possibles
        this.loadAllDalles();
        this.setInitStatus(true);
        this.setVisibility(!!options.visible);
    },
    isCartoInitialized: function isCartoInitialized() {
        return this.intialized;
    },
};

export default Cartography3D;
