/**
 * A loader for 3D model of diverse formats
 */

import * as OBJLoader from 'three-obj-loader';
import * as THREE from 'three';
import Cartography3D from '../B3Dreader/Cartography3D';
import Feature2MeshStyle from './Feature2MeshStyle';
import FeatureProcessing from '../../Process/FeatureProcessing';

var _this;
OBJLoader(THREE);

function ModelLoader(view) {
    // Constructor
    this.view = view;
    this.model = [new THREE.Group(), new THREE.Group()];
    this.obj = new THREE.Group();
    this.checked = false;
    _this = this;
}

ModelLoader.prototype.loadOBJ = function loadOBJ(url, coord, rotateX, rotateY, rotateZ, scale, callback, menu) {
    // OBJ loader
    var loader = new THREE.OBJLoader();
    var promise = new Promise((resolve) => {
        var lines = new THREE.Group();
        loader.load(url, (obj) => {
            this._loadModel(obj, lines, coord, rotateX, rotateY, rotateZ, scale);
            resolve();
        });
    });
    promise.then(() => callback(this.model, menu));
};

function controleName(name, view) {
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

    // Create a PointLight and turn on shadows for the light
    var plight = new THREE.PointLight(0xffffff, 1, 0, 1);
    var coordLight = coord.clone();
    coordLight.setAltitude(coordLight.altitude() + 350);
    plight.position.copy(coordLight.as(this.view.referenceCrs).xyz());
    plight.position.y += 70;
    plight.updateMatrixWorld();
    plight.castShadow = true;            // default false
    // Set up shadow properties for the light
    plight.shadow.mapSize.width = 512;  // default
    plight.shadow.mapSize.height = 512; // default
    plight.shadow.camera.near = 0.5;       // default
    plight.shadow.camera.far = 5000;
    this.view.scene.add(plight);
    // Create a plane that receives shadows (but does not cast them)
    var planeID = this.view.mainLoop.gfxEngine.getUniqueThreejsLayer();
    var planeGeometry = new THREE.PlaneBufferGeometry(20, 20, 32, 32);
    // var planeMaterial = new THREE.MeshPhongMaterial({ color: 0xffffff, specular: 0xffffff, shininess: 0 });
    var planeMaterial = new THREE.ShadowMaterial({ side: THREE.DoubleSide, depthTest: false });
    planeMaterial.transparent = true;
    planeMaterial.opacity = 0.5;
    var plane = new THREE.Mesh(planeGeometry, planeMaterial);
    plane = this._placeModel(plane, coord, 0, 0, 0, scale);
    plane.position.y += 200;
    plane.receiveShadow = true;
    plane.traverse((obj) => { obj.layers.set(planeID); });
    this.view.camera.camera3D.layers.enable(planeID);
    plane.updateMatrixWorld();
    this.view.scene.add(plane);
    // Update coordinate of the object
    obj.updateMatrixWorld();
    // set & check name
    var name = controleName(obj.materialLibraries[0].substring(0, obj.materialLibraries[0].length - 4), this.view);
    obj.name = name.concat('_faces');
    lines.name = name.concat('_lines');
    // add to scene
    this.view.scene.add(obj);
    this.view.scene.add(lines);
    this.view.notifyChange(true);
    this.model = [obj, lines, plight, plane];
};

ModelLoader.prototype._placeModel = function placeModel(obj, coord, rotateX, rotateY, rotateZ, scale) {
    // Set object position
    obj.position.copy(coord.as(this.view.referenceCrs).xyz());
    // Aligns up vector with geodesic normal
    obj.lookAt(obj.position.clone().add(coord.geodesicNormal));
    // User rotates building to align with ortho image
    obj.rotateX(rotateX);
    obj.rotateY(rotateY);
    obj.rotateZ(rotateZ);
    obj.scale.set(scale, scale, scale);
    return obj;
};

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
            console.log(line);
            self.model[0].add(obj.children[i]);
            self.model[1].add(line);
        }
        _this.obj = obj;
    }
    // pour le dernier :
    if (islast) {
        var objID = self.view.mainLoop.gfxEngine.getUniqueThreejsLayer();
        self.model[0].traverse(obj => obj.layers.set(objID));
        self.view.camera.camera3D.layers.enable(objID);
        self.model[0].updateMatrixWorld();
        self.model[0].name = 'bati3D_faces';
        self.view.scene.add(self.model[0]);
        var linesID = self.view.mainLoop.gfxEngine.getUniqueThreejsLayer();
        self.model[1].traverse(lines => lines.layers.set(linesID));
        self.view.camera.camera3D.layers.enable(linesID);
        self.model[1].updateMatrixWorld();
        self.model[1].name = 'bati3D_lines';
        self.view.scene.add(self.model[1]);
        self.model[1].visible = false; 
        self.view.notifyChange(true);
        console.log('bati3D Loaded');
    }
};

ModelLoader.prototype.loadBati3D = function loadBati3D() {
    var options = {
        buildings: { url: './models/Buildings3D/', visible: true },
    };
    if (!Cartography3D.isCartoInitialized()) {
        Cartography3D.initCarto3D(options.buildings, this.doAfter, this);
    }
};

ModelLoader.prototype._setVisibility = function _setVisibility(self, v) {
    
    self.scene.getObjectByName('bati3D_faces').visible = v;
    self.scene.getObjectByName('bati3D_lines').visible = v;
    self.notifyChange(true);
};

function colorBuildings(properties) {
    return new THREE.Color(0x00eeee);
}

function altitudeBuildings(properties) {
    return properties.z_min - properties.hauteur;
}

function extrudeBuildings(properties) {
    return properties.hauteur;
}

function acceptFeature(properties) {
    return !!properties.hauteur;
}

ModelLoader.prototype.loadBDTopo = function loadBDTopo() {
    var self = this;
    var a = this.view.addLayer({
        type: 'geometry',
        update: FeatureProcessing.update,
        convert: Feature2MeshStyle.convert({
            color: colorBuildings,
            altitude: altitudeBuildings,
            extrude: extrudeBuildings }),
        filter: acceptFeature,
        url: 'http://wxs.ign.fr/72hpsel8j8nhb5qgdh07gcyp/geoportail/wfs?',
        networkOptions: { crossOrigin: 'anonymous' },
        protocol: 'wfs',
        version: '2.0.0',
        id: 'WFS Buildings',
        typeName: 'BDTOPO_BDD_WLD_WGS84G:bati_remarquable,BDTOPO_BDD_WLD_WGS84G:bati_indifferencie,BDTOPO_BDD_WLD_WGS84G:bati_industriel',
        level: 14,
        projection: 'EPSG:4326',
        ipr: 'IGN',
        options: {
            mimetype: 'json',
        },
    }, this.view.tileLayer);
    a.then(this.bDTopoLoaded = true);
    setTimeout(() => self.ForBuildings(calleback), 1000);
};

ModelLoader.prototype.ForBuildings = function ForBuildings(calleback) {
    // For all globe tile meshes we look for tile at level 14 on which building meshes are attached.
    for (var i = 0; i < this.view.wgs84TileLayer.level0Nodes.length; ++i) {
        this.view.wgs84TileLayer.level0Nodes[i].traverse(element => this.traverseElement(element, calleback));
    }
    this.view.notifyChange(true);
};

ModelLoader.prototype.traverseElement = function traverseElement(element, calleback) {
    if (element.level != undefined && element.level <= 14) {
        // console.log(element);
        for (var c = 0; c < element.children.length; ++c) {
            if (element.children[c].type == 'Group') {
                var parent = element.children[c];
                calleback(parent);
            }
        }
    }
};

function calleback(group) {
    var mesh;
    var i;
    /* for (i = 0; i < group.children.length; i++) {
        mesh = group.children[i];
        // change couleur toit
        if (mesh.name == 'roof_faces') {
            mesh.material = new THREE.MeshPhongMaterial({ color: 0x2240d1, emissive: 0x2240d1, specular: 0x2240d1, shininess: 30 });
            mesh.material.transparent = true;
            mesh.castShadow = true;
            mesh.material.side = THREE.DoubleSide;
            mesh.material.needsUpdate = true;
        }
    }
    */
    group.visible = true;
}

export default ModelLoader;
