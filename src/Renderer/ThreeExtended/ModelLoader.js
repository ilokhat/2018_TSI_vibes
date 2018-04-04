/**
 * A loader for 3D model of diverse formats
 */

import * as OBJLoader from 'three-obj-loader';
import * as THREE from 'three';
import Cartography3D from '../B3Dreader/Cartography3D';

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
    this.view.scene.add(obj);
    this.view.scene.add(lines);
    this.view.notifyChange(true);
    this.model = [obj, lines];
    _this.model = [obj, lines];
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
            obj.children[i].visible = false;
            self.model[0].add(obj);
            // Extract edges
            var edges = new THREE.EdgesGeometry(obj.children[i].geometry);
            var line = new THREE.LineSegments(edges, new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true }));
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
        self.view.scene.add(self.model[0]);
        var linesID = self.view.mainLoop.gfxEngine.getUniqueThreejsLayer();
        self.model[1].traverse(lines => lines.layers.set(linesID));
        self.view.camera.camera3D.layers.enable(linesID);
        self.model[1].updateMatrixWorld();
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
    for (var i = 0; i < _this.model.length; i++) {
         _this.model[i].visible = v;
    } 
    for (var j = 0; j < _this.obj.children.length; j++) {
             _this.obj.children[j].visible = v;
        }
    self.notifyChange(true);
};

export default ModelLoader;
