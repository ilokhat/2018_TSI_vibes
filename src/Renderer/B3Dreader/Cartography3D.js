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
    paris: {
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
        var leftBottomCornerGrid = new THREE.Vector3(bbox.xmin * 500, 0, bbox.ymin * 500);
        this.sceneleftBottomCornerGrid = new THREE.Vector3().subVectors(leftBottomCornerGrid, this.zero);
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
        console.log('isDataAvailable', (p.x > this.paris.xmin) && (p.x < this.paris.xmax) && (p.z > this.paris.ymin) && (p.z < this.paris.ymax));
        return (p.x > this.paris.xmin) && (p.x < this.paris.xmax) && (p.z > this.paris.ymin) && (p.z < this.paris.ymax);
    },

    loadDallesAroundPosition: function loadDallesAroundPosition(p, zero) {
        console.log('loadDallesAroundPosition :'.concat(p));
        var lon = Math.floor(p.x / this.scale);
        var lat = Math.floor(p.z / this.scale);
        var map = new clipMap(lon, lat, 1, 1, _textureType);
        this.listDalles = map.getListTiles();
        for (var i = 0; i < this.listDalles.length; i++) {
            if (this.dalleSet[this.listDalles[i].name] === undefined) {
                var currentDalle = this.listDalles[i];
                var currentDalleNameSplit = this.listDalles[i].name.split('-');
                var currentDalleXinGrid = currentDalleNameSplit[0] - bbox.xmin;
                var currentDalleYinGrid = currentDalleNameSplit[1] - bbox.ymin;
                this.grid[currentDalleXinGrid][currentDalleYinGrid] = currentDalle;
                this.listDalles[i].setDalleZeroPivot(zero);
                if (!this.using3DS) {
                    this.listDalles[i].load();
                }
            }
        }
        this.checkWhatToLoad();   // Then launch auto update
        // call update LOD texture here
        // this.updateLODTextureInClipMap(listDalles);
    },

    // List dalle around position and check if already loaded or not
    createDalleListAroundPosition: function createDalleListAroundPosition(lon, lat) {
        var list = [];
        var x = [0, 1];
        var y = [0, 1];
        for (var i = 0; i < x.length; i++) {
            for (var j = 0; j < y.length; j++) {
                if (this.grid[lon + x[i] - bbox.xmin][lat + y[j] - bbox.ymin] == null) {
                    this.grid[lon + x[i] - bbox.xmin][lat + y[j] - bbox.ymin] = {};
                    var name = (lon + x[i]).toString().concat('-', (lat + y[j]).toString());
                    list.push(name);
                }
            }
        }
        return list;
    },

    // with Alex changes
    loadDallesAtPosition: function loadDallesAtPosition(lon, lat) {
        console.log('loadDallesAtPosition', lon, lat);
        var dalle = null;
        var listDalles = this.createDalleListAroundPosition(lon, lat);
        for (var i = 0; i < listDalles.length; i++) {
            var name = listDalles[i];
            if (this.dalleSet[name] === undefined) {
                dalle = new dalleClasse();
                dalle.dataURL = this.dataURL;
                dalle.textureType = this.textureType;
                dalle.setDalleZeroPivot(gfxEngine.getZeroAsVec3D());
                dalle.setNamePath(name);
                dalle.setLoDLevel(2);
                dalle.load();
                this.grid[lon - bbox.xmin][lat - bbox.ymin] = dalle;
                // empty texture cache
                this.dalleSet[name] = dalle;
                // add to Global listDalles
                this.listDalles.push(dalle);
            }
        }
    },

    checkWhatToLoad: function checkWhatToLoad() {
        this.iteration++;
        if (this.iteration % 30 == 0 && this.opacity == 1) {
            var pLook = this.getDalleXYFromCamDirection();
            if (pLook.x != -9999 && this.grid[pLook.x][pLook.z] == null) {
                var lon = bbox.xmin + pLook.x;
                var lat = bbox.ymin + pLook.z;
                this.loadDallesAtPosition(lon, lat);
            }
        }
        requestAnimSelectionAlpha(this.checkWhatToLoad.bind(this));
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

    initCarto3D: function initCarto3D(options) {
        this.dataURL = options.url;
        this.zero = gfxEngine.getZeroAsVec3D();
        this.textureType = gfxEngine.isMobileEnvironment() ? '.jpg' : '.dds';
        console.log('this.textureType', this.textureType);
        _textureType = this.textureType;
        var pos = gfxEngine.getCameraPosition();
        console.log('pos', pos);
        this.generateGrid();
        if (this.isDataAvailable(pos.add(this.zero))) {
            this.loadDallesAroundPosition(pos, this.zero);
            this.setInitStatus(true);
        }
        this.setVisibility(!!options.visible);
    },
    isCartoInitialized: function isCartoInitialized() {
        return this.intialized;
    },
};

export default Cartography3D;
