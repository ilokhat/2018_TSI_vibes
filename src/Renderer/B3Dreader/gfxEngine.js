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
            this._zero = new THREE.Vector3(z.x, z.y, z.z);
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
    },
    addToScene: function addToScene(obj) {
        this._scene.add(obj);
    },
};

export default gfxEngine;
