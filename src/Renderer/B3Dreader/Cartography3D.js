/**
 * Edit On: april 2018
 * Class: Cartography3D
 * Description:  Part extracted from 'itowns-legacy' {@link https://github.com/iTowns/itowns-legacy}
 * Project VIBES
 * Author: Adouni, Bouchaour, Grégoire, Mathelier, Nino, Ouhabi, Schlegel
 */

import * as THREE from 'three';
import clipMap from './clipMap';

// GLOBAL VARIABLE
var _textureType = '.dds';

// END OF OBJECT CLASSS
var bbox = {
    xmin: 1302,
    xmax: 1304,
    ymin: 13722,
    ymax: 13724,
};
/** @module Cartography3D */
const Cartography3D = {
    intialized: false,
    opacity: 1,
    carte3Dactivated: false,
    grid: [],
    dalleSet: {},
    listDalles: [],
    scale: 500,
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

    // ____________ fonctions __________________


    // création d'une grille pour toutes les dalles de la limiteZone
    /**
     * Makes the tile grid for the limitZone
     * @function generateGrid
     */
    generateGrid: function generateGrid() {
        this.grid = [];
        var nbdallesX = bbox.xmax - bbox.xmin;
        var nbdallesY = bbox.ymax - bbox.ymin;
        // on parcourt les lignes...
        for (var i = 0; i < nbdallesX; i++) {
            this.grid[i] = [];
            // ... et dans chaque ligne, on parcourt les cellules
            for (var j = 0; j < nbdallesY; j++) {
                this.grid[i][j] = null;
            }
        }
    },

    // initialisation de la visualisation
    /**
     * Function for initialize the BATI3D loading
     * @function initCarto3D
     * @param {Object} options
     * @param {function} doAfter callback function run after the Bati3D tile creation (doAfter(objCreated, islast, ModelLoader))
     * @param {ModelLoader} modelLoader ModelLoader use for load the Bati3D
     */
    initCarto3D: function initCarto3D(options, doAfter, modelLoader) {
        this.dataURL = options.url;
        this.textureType = '.dds';
        this.doAfter = doAfter;
        this.modelLoader = modelLoader;
        _textureType = this.textureType;
        this.generateGrid();
        // on parcour chaque case de la grille
        for (var i = 0; i < this.grid.length; i++) {
            for (var j = 0; j < this.grid[i].length; j++) {
                var pos = new THREE.Vector3((i + bbox.xmin) * 500 + 250, 0, (j + bbox.ymin) * 500 + 250);
                // si la donnée dans la zone de travail on charge la dalle
                if (this.isDataAvailable(pos)) {
                    this.loadDallesAroundPosition(pos, (i == this.grid.length - 1 && j == this.grid[i].length - 1));
                    this.setInitStatus(true);
                }
            }
        }
        this.setVisibility(!!options.visible);
    },

    // change variable test initialisation
    /**
     * Change the initialization status of the Cartography3D
     * @function setInitStatus
     * @param {boolean} v Initialization status
     */
    setInitStatus: function setInitStatus(v) {
        this.intialized = v;
    },

    // return variable test initialisation
    /**
     * Returns true if the Cartography3D is initialized
     * @function isCartoInitialized
     * @returns {boolean} The initialization status of the Cartography3D
     */
    isCartoInitialized: function isCartoInitialized() {
        return this.intialized;
    },

    // change visibilité des dalles
    /**
     * Changes the tile visibility
     * @function setVisibility
     * @param {boolean} v True if it is visible
     */
    setVisibility: function setVisibility(v) {
        for (var dalle in this.listDalles) {
            if (Object.prototype.hasOwnProperty.call(this.listDalles, dalle)) {
                this.listDalles[dalle].setVisible(v);
            }
        }
    },

    // chargement des dalles autout d'une position
    /**
     * Load tiles around a position
     * @function loadDallesAroundPosition
     * @param {Object} p Tile position ({x: 651000, y: 6861000})
     * @param {boolean} islast True if it is tha last tile to load
     */
    loadDallesAroundPosition: function loadDallesAroundPosition(p, islast) {
        var lon = Math.floor(p.x / this.scale);
        var lat = Math.floor(p.z / this.scale);
        var map = new clipMap(lon, lat, 1, 1, _textureType, this.dataURL);
        this.listDalles = map.getListTiles();
        for (var i = 0; i < this.listDalles.length; i++) {
            if (this.dalleSet[this.listDalles[i].name] === undefined) {
                var currentDalle = this.listDalles[i];
                var currentDalleNameSplit = this.listDalles[i].name.split('-');
                var currentDalleXinGrid = currentDalleNameSplit[0] - bbox.xmin;
                var currentDalleYinGrid = currentDalleNameSplit[1] - bbox.ymin;
                this.grid[currentDalleXinGrid][currentDalleYinGrid] = currentDalle;
                if (!this.using3DS) {
                    this.listDalles[i].doAfter = this.doAfter;
                    this.listDalles[i].modelLoader = this.modelLoader;
                    this.listDalles[i].isLast = islast;
                    this.listDalles[i].load();
                }
            }
        }
    },

    // donne si le point p est dans la zone de travail
    /**
     * Check if the point if on the limitZone
     * @function isDataAvailable
     * @param {object} p Point to test
     * @returns {boolean} True if the point is on the limitZone
     */
    isDataAvailable: function isDataAvailable(p) {
        return (p.x > this.limitZone.xmin) && (p.x < this.limitZone.xmax) && (p.z > this.limitZone.ymin) && (p.z < this.limitZone.ymax);
    },
};

export default Cartography3D;
