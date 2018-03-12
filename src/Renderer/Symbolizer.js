/**
 * Tool to apply 3D stylization on a mesh
 */

import * as THREE from 'three';
// import VIBESParser;

// Class Symbolizer

function Symbolizer(view, obj, menu) {
    // Constructor
    this.obj = obj;
    this.view = view;
    this.menu = menu;
    this.menu.view = this.view;
}

Symbolizer.prototype.sayHello = function sayHello() {
    return 'Coucou';
};

Symbolizer.prototype.readVIBES = function readVIBES() {
    var materials = [];
    return materials;
};

Symbolizer.prototype.applyStyle = function applyStyle(style = null) {
    if (style == null) {
        // default style
    }
    else {
        // apply given style
    }
};

// Callback functions (concrete stylization)

Symbolizer.prototype._changeOpacity = function changeOpacity(value, index) {
    this.obj.children[index].material.opacity = value;
    this.obj.children[index].material.needsUpdate = true;
    this.view.notifyChange(true);
};

Symbolizer.prototype._changeColor = function changeColor(value, index) {
    this.obj.children[index].material.color = new THREE.Color(value);
    this.obj.children[index].material.needsUpdate = true;
    this.view.notifyChange(true);
};

Symbolizer.prototype._changeEmissive = function changeEmissive(value, index) {
    this.obj.children[index].material.emissive = new THREE.Color(value);
    this.obj.children[index].material.needsUpdate = true;
    this.view.notifyChange(true);
};

Symbolizer.prototype._changeSpecular = function changeSpecular(value, index) {
    this.obj.children[index].material.specular = new THREE.Color(value);
    this.obj.children[index].material.needsUpdate = true;
    this.view.notifyChange(true);
};

Symbolizer.prototype._changeShininess = function changeShininess(value, index) {
    this.obj.children[index].material.shininess = value;
    this.obj.children[index].material.needsUpdate = true;
    this.view.notifyChange(true);
};

// Menu management

Symbolizer.prototype._addOpacity = function addOpacity(folder, index) {
    folder.add({ opacity: 1 }, 'opacity', 0, 1).name('opacity').onChange(value => this._changeOpacity(value, index));
};

Symbolizer.prototype._addColor = function addColor(folder, index) {
    folder.addColor({ color: '#ffae23' }, 'color').name('color').onChange(value => this._changeColor(value, index));
};

Symbolizer.prototype._addEmissive = function addEmissive(folder, index) {
    folder.addColor({ emissive: '#ffae23' }, 'emissive').name('emissive').onChange(value => this._changeEmissive(value, index));
};


Symbolizer.prototype._addSpecular = function addSpecular(folder, index) {
    folder.addColor({ specular: '#ffae23' }, 'specular').name('specular').onChange(value => this._changeSpecular(value, index));
};

Symbolizer.prototype._addShininess = function addShininess(folder, index) {
    folder.add({ shininess: 30 }, 'shininess', 0, 100).name('shininess').onChange(value => this._changeShininess(value, index));
};

Symbolizer.prototype.initGui = function addToGUI() {
    var parentFolder = this.menu.gui.addFolder(this.obj.materialLibraries[0].substring(0, this.obj.materialLibraries[0].length - 4));
    for (var i = 0; i < this.obj.children.length; i++) {
        var folder = parentFolder.addFolder(this.obj.children[i].name);
        this._addOpacity(folder, i);
        this._addColor(folder, i);
        this._addEmissive(folder, i);
        this._addSpecular(folder, i);
        this._addShininess(folder, i);
    }
};

Symbolizer.prototype._addOpacityAll = function addOpacityAll(folder) {
    folder.add({ opacity: 1 }, 'opacity', 0, 1).name('opacity').onChange((value) => {
        for (var index = 0; index < this.obj.children.length; index++) {
            this._changeOpacity(value, index);
        }
    });
};

Symbolizer.prototype._addColorAll = function addColorAll(folder) {
    folder.addColor({ color: '#ffae23' }, 'color').name('color').onChange((value) => {
        for (var index = 0; index < this.obj.children.length; index++) {
            this._changeColor(value, index);
        }
    });
};

Symbolizer.prototype._addEmissiveAll = function addEmissiveAll(folder) {
    folder.addColor({ emissive: '#ffae23' }, 'emissive').name('emissive').onChange((value) => {
        for (var index = 0; index < this.obj.children.length; index++) {
            this._changeEmissive(value, index);
        }
    });
};


Symbolizer.prototype._addSpecularAll = function addSpecularAll(folder) {
    folder.addColor({ specular: '#ffae23' }, 'specular').name('specular').onChange((value) => {
        for (var index = 0; index < this.obj.children.length; index++) {
            this._changeSpecular(value, index);
        }
    });
};

Symbolizer.prototype._addShininessAll = function addShininessAll(folder) {
    folder.add({ shininess: 30 }, 'shininess', 0, 100).name('shininess').onChange((value) => {
        for (var index = 0; index < this.obj.children.length; index++) {
            this._changeShininess(value, index);
        }
    });
};

Symbolizer.prototype.initGuiAll = function addToGUI() {
    var folder = this.menu.gui.addFolder(this.obj.materialLibraries[0].substring(0, this.obj.materialLibraries[0].length - 4));
    this._addOpacityAll(folder);
    this._addColorAll(folder);
    this._addEmissiveAll(folder);
    this._addSpecularAll(folder);
    this._addShininessAll(folder);
};

export default Symbolizer;
