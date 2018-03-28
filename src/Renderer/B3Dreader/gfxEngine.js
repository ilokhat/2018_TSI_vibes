import * as THREE from 'three';

const gfxEngine = {
    _zero: null,
    _camera: null,
    _scene: null,
    setCamera: function setCamera(camera) {
        this._camera = camera;
    },
    setScene: function setScene(scene) {
        this._scene = scene;
    },
    setZero: function setZero(z) {
        if (z instanceof THREE.Vector3) {
            this._zero = z;
        } else {
            if (z.CRS) this._crs = z.CRS;
            this._zero = new THREE.Vector3(z.x, z.z, z.y);
        }
    },
    getZeroAsVec3D: function getZeroAsVec3D() {
        return new THREE.Vector3(parseFloat(this._zero.x), parseFloat(this._zero.y), parseFloat(this._zero.z));
    },
    isMobileEnvironment: function isMobileEnvironment() {
        return false;
    },
    getCameraPosition: function getCameraPosition() {
        return this._camera.position.clone();
        // TODO : changer en camera target position
    },
    addToScene: function addToScene(obj) {
        this._scene.add(obj);
    },
    init: function init(view) {
        this.setCamera(view.camera);
        this.setScene(view.scene);
        this._referenceCrs = view.referenceCrs;
    },
};

export default gfxEngine;
