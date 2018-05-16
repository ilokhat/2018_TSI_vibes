/**
 * Generated On: april 2018
 * Class: ModelLoader
 * Description: A loader for 3D model of diverse formats (obj, bati3D, flux WFS BDTopo)
 * Project VIBES
 * Author: Adouni, Bouchaour, Grégoire, Mathelier, Nino, Ouhabi, Schlegel
 */

import * as THREE from 'three';
import Cartography3D from '../B3Dreader/Cartography3D';
import Feature2MeshStyle from './Feature2MeshStyle';
import FeatureProcessingBDTopo from '../../Process/FeatureProcessingBDTopo';

/**
 * A loader for 3D model of diverse formats (obj, bati3D, BDTopo WFS flux)
 *
 * @constructor
 * @param {GlobeView} view where the loaded webject will be added
 */
function ModelLoader(view) {
    // Constructor
    this.view = view;
    this.model = [new THREE.Group(), new THREE.Group()];
    this.checked = false;// if the BATI3D is loaded
    this.bdTopoVisibility = false;// BDTopo visibility
     // style applied to the BDTopo
    this.bdTopoStyle = {
        wall_faces: {
            texture: null,
            opacity: 1,
            color: '#ffffff',
            emissive: '#ffffff',
            specular: '#ffffff',
            shininess: 30,
            textureRepetition: 1,
        },
        roof_faces: {
            texture: null,
            opacity: 1,
            color: '#ffffff',
            emissive: '#ffffff',
            specular: '#ffffff',
            shininess: 30,
            textureRepetition: 1,
        },
        edges: {
            color: '#ffffff',
            opacity: 1,
            width: 1,
            style: 'Continuous',
            gapSize: null,
            dashSize: null,
        },
    };
}

// ********** OBJ **********

/**
 * Loader for an '.obj' file
 *
 * @param {url} url URL of the file
 * @param {Coordinates} coord Place of the object on the scene
 * @param {number} rotateX Rotation of the object around the x-axis
 * @param {number} rotateY Rotation of the object around the y-axis
 * @param {number} rotateZ Rotation of the object around the z-axis
 * @param {number} scale Scale applied to the object
 * @param {Function} callback Function run after the model creation callback([groupFaces, groupEdges], menu)
 * @param {GuiTools} [menu] Menu used for the callback
 */
ModelLoader.prototype.loadOBJ = function loadOBJ(url, coord, rotateX, rotateY, rotateZ, scale, callback, menu = null) {
    // OBJ loader
    var objLoader = new THREE.OBJLoader();
    var promise = new Promise((resolve) => {
        var lines = new THREE.Group();
        objLoader.load(url, (obj) => {
            this._loadModel(obj, lines, coord, rotateX, rotateY, rotateZ, scale);
            resolve();
        });
    });
    promise.then(() => callback(this.model, menu));
};

/**
 * Checks if the name is single and makes it single if needed
 *
 * @param {string} name Name to test
 * @param {GlobeView} view View where the name should be single
 * @return {string} name Single name
 * @memberOf ModelLoader
 */
function controlName(name, view) {
    var i = 1;
    var verif;
    var j;
    do {
        verif = true;
        for (j = 0; j < view.scene.children.length; j++) {
            var element = view.scene.children[j];
            if (element.name.split('_')[0] == name) {
                verif = false;
                name = name.split('-')[0].concat('-', ++i);
            }
        }
    } while (!verif);
    return name;
}

/**
 * Internal function uses to load the '.obj' object on the scene
 *
 * @param {THREE.Group} obj THREE.Group of THREE.Mesh containing the object faces
 * @param {THREE.Group} lines THREE.Group where the object lines will be stored
 * @param {Coordinates} coord Place of the object on the scene
 * @param {number} rotateX Rotation of the object around the x-axis
 * @param {number} rotateY Rotation of the object around the y-axis
 * @param {number} rotateZ Rotation of the object around the z-axis
 * @param {number} scale Scale applied to the object
 */
ModelLoader.prototype._loadModel = function loadModel(obj, lines, coord, rotateX, rotateY, rotateZ, scale) {
    var objID = this.view.mainLoop.gfxEngine.getUniqueThreejsLayer();
    obj = this._placeModel(obj, coord, rotateX, rotateY, rotateZ, scale);

    // Set camera layer not to disturb the picking
    obj.traverse(obj => obj.layers.set(objID));
    this.view.camera.camera3D.layers.enable(objID);
    this.view.notifyChange(true);

    for (var i = 0; i < obj.children.length; i++) {
        // Material initialization
        var material = new THREE.MeshPhongMaterial({ color: 0xffffff });
        obj.children[i].material = material;
        obj.children[i].material.transparent = true;
        obj.children[i].castShadow = true;
        obj.children[i].material.side = THREE.DoubleSide;

        // Extract edges
        var edges = new THREE.EdgesGeometry(obj.children[i].geometry);
        var line = new THREE.LineSegments(edges, new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true }));
        lines.add(line);
    }
    lines = this._placeModel(lines, coord, rotateX, rotateY, rotateZ, scale);
    lines.updateMatrixWorld();

    var linesID = this.view.mainLoop.gfxEngine.getUniqueThreejsLayer();
    lines.traverse(lines => lines.layers.set(linesID));
    this.view.camera.camera3D.layers.enable(linesID);

    // Update coordinate of the object
    obj.updateMatrixWorld();
    // set & check name
    var name = controlName(obj.materialLibraries[0].substring(0, obj.materialLibraries[0].length - 4), this.view);
    obj.name = name.concat('_faces');
    lines.name = name.concat('_lines');
    // add to scene
    this.view.scene.add(obj);
    this.view.scene.add(lines);
    this.view.notifyChange(true);
    this.model = [obj, lines];
};

/**
 * Applies rotations and scaling on a group and geolocalize it
 *
 * @param {THREE.Group} obj THREE.Group to which we want to apply the parameters
 * @param {Coordinates} coord Place of the object on the scene
 * @param {number} rotateX Rotation of the object around the x-axis
 * @param {number} rotateY Rotation of the object around the y-axis
 * @param {number} rotateZ Rotation of the object around the z-axis
 * @param {number} scale Scale applied to the object
 * @returns {THREE.Group} obj object with the parameter apply
 */
ModelLoader.prototype._placeModel = function placeModel(obj, coord, rotateX, rotateY, rotateZ, scale) {
    // Set object position
    obj.position.copy(coord.as(this.view.referenceCrs).xyz());
    // Aligns up vector with geodesic normal
    obj.lookAt(obj.position.clone().add(coord.geodesicNormal));
    // User rotates building to align with ortho image
    obj.rotation.x = rotateX;
    obj.rotation.y = rotateY;
    obj.rotation.z = rotateZ;
    obj.scale.set(scale, scale, scale);
    return obj;
};

// ********** BATI3D **********

/**
 * callback for the Bati3D loader
 *
 * @param {THREE.Group} obj Object's faces
 * @param {boolean} islast True if it is the last tile
 * @param {ModelLoader} self Current ModelLoader instance (self = this)
 */
ModelLoader.prototype.doAfter = function doAfter(obj, islast, self) {
    if (obj != null) {
        for (var i = 0; i < obj.children.length; i++) {
            // Material initialization
            obj.children[i].material.transparent = true;
            obj.children[i].castShadow = true;
            // Extract edges
            var edges = new THREE.EdgesGeometry(obj.children[i].geometry);
            var line = new THREE.LineSegments(edges, new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true }));
            //
            self.model[0].add(obj.children[i]);
            self.model[1].add(line);
        }
    }
    // for the last:
    if (islast) {
        var objID = self.view.mainLoop.gfxEngine.getUniqueThreejsLayer();
        self.model[0].traverse(obj => obj.layers.set(objID));
        self.view.camera.camera3D.layers.enable(objID);
        self.model[0].updateMatrixWorld();
        self.model[0].name = 'bati3D_faces';
        self.model[0].visible = false;
        self.view.scene.add(self.model[0]);
        var linesID = self.view.mainLoop.gfxEngine.getUniqueThreejsLayer();
        self.model[1].traverse(lines => lines.layers.set(linesID));
        self.view.camera.camera3D.layers.enable(linesID);
        self.model[1].updateMatrixWorld();
        self.model[1].name = 'bati3D_lines';
        self.view.scene.add(self.model[1]);
        self.model[1].visible = false;
        self.view.notifyChange(true);
    }
};

/**
 * Loader for the Bati3D tiles
*/
ModelLoader.prototype.loadBati3D = function loadBati3D() {
    // options for the path and the visibility
    var options = {
        buildings: { url: './models/Buildings3D/', visible: true },
    };
    // Bati3D tiles creation
    if (!Cartography3D.isCartoInitialized()) {
        Cartography3D.initCarto3D(options.buildings, this.doAfter, this);
    }
};

/**
 * Changes the BATI3D visibility
 *
 * @param {ModelLoader} self Current ModelLoader
 * @param {boolean} v BATI3D visibility
 */
ModelLoader.prototype._setVisibility = function _setVisibility(self, v) {
    var bati3D_faces = self.scene.getObjectByName('bati3D_faces');
    var bati3D_lines = self.scene.getObjectByName('bati3D_lines');
    if (bati3D_faces != undefined && bati3D_lines != undefined) {
        self.scene.getObjectByName('bati3D_faces').visible = v;
        self.scene.getObjectByName('bati3D_lines').visible = v;
        self.notifyChange(true);
    }
};

// ********** BDTOPO **********

/**
 * Extraction of the building's altitude
 *
 * @param {Object} properties Building properties
 * @returns {number} Building's altitude
 * @memberOf ModelLoader
 */
function altitudeBuildings(properties) {
    return properties.z_min - properties.hauteur;
}

/**
 * Extraction of the building's height
 *
 * @param {Object} properties Building properties
 * @returns {number} Building's height
 * @memberOf ModelLoader
 */
function extrudeBuildings(properties) {
    return properties.hauteur;
}

/**
 * Acceptance criteria for the features
 *
 * @param {Object} properties Building properties
 * @returns {boolean} True if the feature is accepted
 * @memberOf ModelLoader
 */
function acceptFeature(properties) {
    return !!properties.hauteur;
}

/**
 * BDTopo loader
 */
ModelLoader.prototype.loadBDTopo = function loadBDTopo() {
    // add the bdTopo on the scene
    var a = this.view.addLayer({
        type: 'geometry',
        update: FeatureProcessingBDTopo.update,
        convert: Feature2MeshStyle.convert({
            altitude: altitudeBuildings,
            extrude: extrudeBuildings,
            style: this.bdTopoStyle }),
        filter: acceptFeature,
        url: 'https://wxs.ign.fr/72hpsel8j8nhb5qgdh07gcyp/geoportail/wfs?',
        networkOptions: { crossOrigin: 'anonymous' },
        protocol: 'wfs',
        version: '2.0.0',
        id: 'WFS Buildings',
        typeName: 'BDTOPO_BDD_WLD_WGS84G:bati_remarquable,BDTOPO_BDD_WLD_WGS84G:bati_indifferencie,BDTOPO_BDD_WLD_WGS84G:bati_industriel',
        level: 14,
        projection: 'EPSG:4326',
        ipr: 'IGN',
        visible: false,
        options: {
            mimetype: 'json',
        },
    }, this.view.tileLayer);
    // after the BDTopo loader
    a.then(this.bDTopoLoaded = true);
};

/**
 * Applies the callback for each tile
 *
 * @param {Function} callback Callback function
 * @example
 *  callback = (parentGroup) => console.log(parentGroup);
 *  with the parentGroup composed of meshes wall_faces, roof_faces, wall_edges, roof_edges
 */
ModelLoader.prototype.ForBuildings = function ForBuildings(callback) {
    // For all globe tile meshes we look for tile at level 14 on which building meshes are attached.
    var a = element => traverseElement(element, callback);
    for (var i = 0; i < this.view.wgs84TileLayer.level0Nodes.length; ++i) {
        this.view.wgs84TileLayer.level0Nodes[i].traverse(a);
    }
    this.view.notifyChange(true);
};

/**
 * Internal function for ForBuildings
 *
 * @param {Object} element Element traversed
 * @param {function} callback Callback function
 * @memberOf Symbolizer
 */
function traverseElement(element, callback) {
    if (element.level != undefined && element.level <= 14) {
        // console.log(element);
        for (var c = 0; c < element.children.length; ++c) {
            if (element.children[c].type == 'Group') {
                var parent = element.children[c];
                callback(parent);
            }
        }
    }
}

export default ModelLoader;
