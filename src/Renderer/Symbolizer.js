/* eslint no-eval: 0 */
/**
 * Tool to apply 3D stylization on a mesh
 */

import * as THREE from 'three';
import * as FILE from 'file-saver';
import Fetcher from '../Core/Scheduler/Providers/Fetcher';

// Classe Symbolizer

function Symbolizer(view, obj, edges, bdTopo, menu, nb, light, plane) {
    // Constructor
    this.obj = obj;
    this.edges = edges;
    this.quads = null;
    if (bdTopo != null) this.bdTopo = bdTopo.ForBuildings;
    this.view = view;
    this.menu = menu;
    this.menu.view = this.view;
    this.nb = nb;
    this.folder = null;
    this.light = light;
    this.plane = plane;
    if (bdTopo != null) this.bdTopoStyle = bdTopo.bdTopoStyle;
    this.applyStyle();
}

Symbolizer.prototype.applyStyle = function applyStyle(style = null, folder = null) {
    var i;
    var j;
    var k;
    var h;
    if (style && style.faces[0].name) {
        // Update GUI
        var count = 0;
        folder.__folders.Edges.__controllers[0].setValue(style.edges.color);
        folder.__folders.Edges.__controllers[1].setValue(style.edges.opacity);
        folder.__folders.Edges.__controllers[2].setValue(style.edges.width);
        for (k in folder.__folders.Faces.__folders) {
            if (Object.prototype.hasOwnProperty.call(folder.__folders.Faces.__folders, k)) {
                folder.__folders.Faces.__folders[k].__controllers[0].setValue(style.faces[count].opacity);
                folder.__folders.Faces.__folders[k].__controllers[1].setValue(style.faces[count].color);
                folder.__folders.Faces.__folders[k].__controllers[2].setValue(style.faces[count].emissive);
                folder.__folders.Faces.__folders[k].__controllers[3].setValue(style.faces[count].specular);
                folder.__folders.Faces.__folders[k].__controllers[4].setValue(style.faces[count].shininess);
            }
            count++;
        }
        // Apply given style to each child
        if (this.edges.length > 0) {
            // edges
            for (i = 0; i < this.edges.length; i++) {
                for (j = 0; j < this.edges[i].children.length; j++) {
                    this._changeOpacityEdge(style.edges.opacity, i, j);
                    this._changeColorEdge(style.edges.color, i, j);
                    this._changeWidthEdge(style.edges.width, i, j);
                }
            }
            // faces
            for (i = 0; i < this.obj.length; i++) {
                for (j = 0; j < this.obj[i].children.length; j++) {
                    var name = this.obj[i].children[j].name;
                    h = 0;
                    while (h < style.faces.length && style.faces[h].name != name) {
                        h++;
                    }
                    if (h < style.faces.length) {
                        this._changeOpacity(style.faces[h].opacity, i, j);
                        this._changeColor(style.faces[h].color, i, j);
                        this._changeEmissive(style.faces[h].emissive, i, j);
                        this._changeSpecular(style.faces[h].specular, i, j);
                        this._changeShininess(style.faces[h].shininess, i, j);
                        if (style.faces[h].texture != null) this._changeTexture(style.faces[h].texture, i, j, folder.__folders.Faces);
                    }
                }
            }
        }
        if (this.bdTopo) {
            h = 0;
            while (h < style.faces.length) {
                // edges' bdTopo
                this._changeOpacityEdge(style.edges.opacity, -10, 0);
                this._changeColorEdge(style.edges.color, -10, 0);
                this._changeWidthEdge(style.edges.width, -10, 0);
                // faces' bdTopo
                if (style.faces[h].name == 'wall_faces') {
                    this._changeOpacity(style.faces[h].opacity, -10, 0);
                    this._changeColor(style.faces[h].color, -10, 0);
                    this._changeEmissive(style.faces[h].emissive, -10, 0);
                    this._changeSpecular(style.faces[h].specular, -10, 0);
                    this._changeShininess(style.faces[h].shininess, -10, 0);
                    if (style.faces[h].texture != null) this._changeTexture(style.faces[h].texture, -10, 0, folder.__folders.Faces);
                } else if (style.faces[h].name == 'roof_faces') {
                    this._changeOpacity(style.faces[h].opacity, -10, 1);
                    this._changeColor(style.faces[h].color, -10, 1);
                    this._changeEmissive(style.faces[h].emissive, -10, 1);
                    this._changeSpecular(style.faces[h].specular, -10, 1);
                    this._changeShininess(style.faces[h].shininess, -10, 1);
                    if (style.faces[h].texture != null) this._changeTexture(style.faces[h].texture, -10, 1, folder.__folders.Faces);
                }
                h++;
            }
        }
    }
    else if (style && style.faces.length == 1) {
        // Update GUI
        folder.__folders.Edges.__controllers[0].setValue(style.edges.color);
        folder.__folders.Edges.__controllers[1].setValue(style.edges.opacity);
        folder.__folders.Edges.__controllers[2].setValue(style.edges.width);
        folder.__folders.Faces.__controllers[0].setValue(style.faces[0].opacity);
        folder.__folders.Faces.__controllers[1].setValue(style.faces[0].color);
        folder.__folders.Faces.__controllers[2].setValue(style.faces[0].emissive);
        folder.__folders.Faces.__controllers[3].setValue(style.faces[0].specular);
        folder.__folders.Faces.__controllers[4].setValue(style.faces[0].shininess);
        // Apply given style to all children
        if (this.edges.length > 0) {
            // edges
            for (i = 0; i < this.edges.length; i++) {
                for (j = 0; j < this.edges[i].children.length; j++) {
                    this._changeOpacityEdge(style.edges.opacity, i, j);
                    this._changeColorEdge(style.edges.color, i, j);
                    this._changeWidthEdge(style.edges.width, i, j);
                }
            }
            // faces
            for (i = 0; i < this.obj.length; i++) {
                for (j = 0; j < this.obj[i].children.length; j++) {
                    this._changeOpacity(style.faces[0].opacity, i, j);
                    this._changeColor(style.faces[0].color, i, j);
                    this._changeEmissive(style.faces[0].emissive, i, j);
                    this._changeSpecular(style.faces[0].specular, i, j);
                    this._changeShininess(style.faces[0].shininess, i, j);
                    if (style.faces.texture != null) this._changeTexture(style.faces.texture, i, j, folder.__folders.Faces);
                }
            }
        }
        if (this.bdTopo) {
            // edges' bdTopo
            this._changeOpacityEdge(style.edges.opacity, -10, 0);
            this._changeColorEdge(style.edges.color, -10, 0);
            this._changeWidthEdge(style.edges.width, -10, 0);
            // faces' bdTopo
            this._changeOpacity(style.faces[0].opacity, -10, 0);
            this._changeColor(style.faces[0].color, -10, 0);
            this._changeEmissive(style.faces[0].emissive, -10, 0);
            this._changeSpecular(style.faces[0].specular, -10, 0);
            this._changeShininess(style.faces[0].shininess, -10, 0);
            if (style.faces[0].texture != null) this._changeTexture(style.faces[0].texture, -10, 0, folder.__folders.Faces);
            this._changeOpacity(style.faces[0].opacity, -10, 1);
            this._changeColor(style.faces[0].color, -10, 1);
            this._changeEmissive(style.faces[0].emissive, -10, 1);
            this._changeSpecular(style.faces[0].specular, -10, 1);
            this._changeShininess(style.faces[0].shininess, -10, 1);
            if (style.faces[0].texture != null) this._changeTexture(style.faces[0].texture, -10, 1, folder.__folders.Faces);
        }
    }
};

// Callback functions (concrete stylization)

Symbolizer.prototype._changeOpacity = function changeOpacity(value, i, j) {
    // Update opacity with selected value
    if (i >= 0) {
        this.obj[i].children[j].material.opacity = value;
        this.obj[i].children[j].material.needsUpdate = true;
        this.view.notifyChange(true);
    } else if (this.bdTopo) {
        var name = j == 0 ? 'wall_faces' : 'roof_faces';
        var f = (parent) => {
            for (var i = 0; i < parent.children.length; i++) {
                if (parent.children[i].name == name) {
                    parent.children[i].material.opacity = value;
                    parent.children[i].material.needsUpdate = true;
                }
            }
        };
        this.bdTopoStyle[name].opacity = value;
        this.bdTopo(f);
    }
};

Symbolizer.prototype._changeOpacityEdge = function changeOpacityEdge(value, i, j) {
    // Update edge opacity with selected value
    if (i >= 0) {
        this.edges[i].children[j].material.opacity = value;
        this.edges[i].children[j].material.needsUpdate = true;
        this.view.notifyChange(true);
    } else if (this.bdTopo) {
        var f = (parent) => {
            for (var i = 0; i < parent.children.length; i++) {
                if (parent.children[i].name == 'wall_edges' || parent.children[i].name == 'roof_edges') {
                    parent.children[i].material.transparent = true;
                    parent.children[i].material.opacity = value;
                    parent.children[i].material.needsUpdate = true;
                }
            }
        };
        this.bdTopoStyle.edges.opacity = value;
        this.bdTopo(f);
    }
};

Symbolizer.prototype._changeColor = function changeColor(value, i, j) {
    // Update color with selected value
    if (i >= 0) {
        this.obj[i].children[j].material.color = new THREE.Color(value);
        this.obj[i].children[j].material.needsUpdate = true;
        this.view.notifyChange(true);
    } else if (this.bdTopo) {
        var name = j == 0 ? 'wall_faces' : 'roof_faces';
        var f = (parent) => {
            for (var i = 0; i < parent.children.length; i++) {
                if (parent.children[i].name == name) {
                    parent.children[i].material.color = new THREE.Color(value);
                    parent.children[i].material.needsUpdate = true;
                }
            }
        };
        this.bdTopoStyle[name].color = value;
        this.bdTopo(f);
    }
};

Symbolizer.prototype._changeColorEdge = function changeColorEdge(value, i, j) {
    // Update edge color with selected value
    if (i >= 0) {
        this.edges[i].children[j].material.color = new THREE.Color(value);
        this.edges[i].children[j].material.needsUpdate = true;
        this.view.notifyChange(true);
    } else if (this.bdTopo) {
        var f = (parent) => {
            for (var i = 0; i < parent.children.length; i++) {
                if (parent.children[i].name == 'wall_edges' || parent.children[i].name == 'roof_edges') {
                    parent.children[i].material.color = new THREE.Color(value);
                    parent.children[i].material.needsUpdate = true;
                }
            }
        };
        this.bdTopoStyle.edges.color = value;
        this.bdTopo(f);
    }
};

Symbolizer.prototype._changeEmissive = function changeEmissive(value, i, j) {
    // Update edge width with selected value
    if (i >= 0) {
        this.obj[i].children[j].material.emissive = new THREE.Color(value);
        this.obj[i].children[j].material.needsUpdate = true;
        this.view.notifyChange(true);
    } else if (this.bdTopo) {
        var name = j == 0 ? 'wall_faces' : 'roof_faces';
        var f = (parent) => {
            for (var i = 0; i < parent.children.length; i++) {
                if (parent.children[i].name == name) {
                    parent.children[i].material.emissive = new THREE.Color(value);
                    parent.children[i].material.needsUpdate = true;
                }
            }
        };
        this.bdTopoStyle[name].emissive = value;
        this.bdTopo(f);
    }
};

Symbolizer.prototype._changeSpecular = function changeSpecular(value, i, j) {
    // Update specular with selected value
    if (i >= 0) {
        this.obj[i].children[j].material.specular = new THREE.Color(value);
        this.obj[i].children[j].material.needsUpdate = true;
        this.view.notifyChange(true);
    } else if (this.bdTopo) {
        var name = j == 0 ? 'wall_faces' : 'roof_faces';
        var f = (parent) => {
            for (var i = 0; i < parent.children.length; i++) {
                if (parent.children[i].name == name) {
                    parent.children[i].material.specular = new THREE.Color(value);
                    parent.children[i].material.needsUpdate = true;
                }
            }
        };
        this.bdTopoStyle[name].specular = value;
        this.bdTopo(f);
    }
};

Symbolizer.prototype._changeShininess = function changeShininess(value, i, j) {
    // Update shininess with selected value
    if (i >= 0) {
        this.obj[i].children[j].material.shininess = value;
        this.obj[i].children[j].material.needsUpdate = true;
        this.view.notifyChange(true);
    } else if (this.bdTopo) {
        var name = j == 0 ? 'wall_faces' : 'roof_faces';
        var f = (parent) => {
            for (var i = 0; i < parent.children.length; i++) {
                if (parent.children[i].name == name) {
                    parent.children[i].material.shininess = value;
                    parent.children[i].material.needsUpdate = true;
                }
            }
        };
        this.bdTopoStyle[name].shininess = value;
        this.bdTopo(f);
    }
};

Symbolizer.prototype._changeTexture = function changeTexture(chemin, i, j, folder) {
    // Add texture
    var name;
    if (chemin != './textures/') {
        // Checks if a texture repetition controller already exists
        var isTextured = false;
        for (let k = 0; k < folder.__controllers.length; k++) {
            if (folder.__controllers[k].property == 'textureRepetition') {
                isTextured = true;
            }
        }
        // If not, a texture repetition controller is added to the GUI
        if (!isTextured) {
            folder.add({ textureRepetition: 1 }, 'textureRepetition', 0.1, 5).name('Texture Repetition').onChange((value) => {
                this._changeTextureRepetition(value, i, j);
            });
        }
        // Create new texture
        var texture = new THREE.TextureLoader().load(chemin);
        texture.textureRepetition = THREE.RepeatWrapping;
        texture.wrapT = THREE.RepeatWrapping;
        // Save material properties
        if (i >= 0) {
            var meshshininess = this.obj[i].children[j].material.shininess;
            var meshspecular = this.obj[i].children[j].material.specular;
            var meshemissive = this.obj[i].children[j].material.emissive;
            var meshcolor = this.obj[i].children[j].material.color;
            var meshopacity = this.obj[i].children[j].material.opacity;
            // Create and apply new material
            this.obj[i].children[j].material = new THREE.MeshPhongMaterial({ side: THREE.DoubleSide, map: texture, color: meshcolor, emissive: meshemissive, specular: meshspecular, shininess: meshshininess, opacity: meshopacity, transparent: true });
            this.obj[i].children[j].material.needsUpdate = true;
            this.view.notifyChange(true);
        } else if (this.bdTopo) {
            name = j == 0 ? 'wall_faces' : 'roof_faces';
            var f = (parent) => {
                for (var j = 0; j < parent.children.length; j++) {
                    if (parent.children[j].name == name) {
                        var meshshininess = parent.children[j].material.shininess;
                        var meshspecular = parent.children[j].material.specular;
                        var meshemissive = parent.children[j].material.emissive;
                        var meshcolor = parent.children[j].material.color;
                        var meshopacity = parent.children[j].material.opacity;
                        // Create and apply new material
                        parent.children[j].material = new THREE.MeshPhongMaterial({ side: THREE.DoubleSide, map: texture, color: meshcolor, emissive: meshemissive, specular: meshspecular, shininess: meshshininess, opacity: meshopacity, transparent: true });
                        parent.children[j].material.needsUpdate = true;
                    }
                }
            };
            this.bdTopoStyle[name].texture = chemin;
            this.bdTopo(f);
        }
    }
    // Remove texture
    else {
        // Remove texture repetition controller from the GUI
        for (let k = 0; k < folder.__controllers.length; k++) {
            if (folder.__controllers[k].property == 'textureRepetition') {
                folder.remove(folder.__controllers[k]);
            }
        }
        // Set map attribute to null to remove the texture
        if (i >= 0) {
            this.obj[i].children[j].material.map = null;
            this.obj[i].children[j].material.needsUpdate = true;
            this.view.notifyChange(true);
        } else if (this.bdTopo) {
            name = j == 0 ? 'wall_faces' : 'roof_faces';
            var f2 = (parent) => {
                for (var j = 0; j < parent.children.length; j++) {
                    if (parent.children[j].name == name) {
                        parent.children[j].material.map = null;
                        parent.children[j].material.needsUpdate = true;
                    }
                }
            };
            this.bdTopoStyle[name].texture = chemin;
            this.bdTopo(f2);
        }
    }
};

Symbolizer.prototype._changeTextureAll = function changeTextureAll(chemin, i, folder) {
    // Add texture to all faces
    if (chemin != './textures/') {
        // Checks if a texture repetition controller already exists
        var isTextured = false;
        for (let k = 0; k < folder.__controllers.length; k++) {
            if (folder.__controllers[k].property == 'textureRepetition') {
                isTextured = true;
            }
        }
        // If not, a texture repetition controller is added to the GUI
        if (!isTextured) {
            folder.add({ textureRepetition: 1 }, 'textureRepetition', 0.1, 5).name('Texture Repetition').onChange((value) => {
                if (this.obj.length > 0) {
                    for (let j = 0; j < this.obj[i].children.length; j++) {
                        this._changeTextureRepetition(value, i, j);
                    }
                }
                this._changeTextureRepetition(value, -10, 0);
                this._changeTextureRepetition(value, -10, 1);
            });
        }
        // Create new texture
        if (i >= 0) {
            for (let j = 0; j < this.obj[i].children.length; j++) {
                var texture = new THREE.TextureLoader().load(chemin);
                texture.textureRepetition = THREE.RepeatWrapping;
                texture.wrapT = THREE.RepeatWrapping;
                // Save material properties
                var meshshininess = this.obj[i].children[j].material.shininess;
                var meshspecular = this.obj[i].children[j].material.specular;
                var meshemissive = this.obj[i].children[j].material.emissive;
                var meshcolor = this.obj[i].children[j].material.color;
                var meshopacity = this.obj[i].children[j].material.opacity;
                // Create and apply new material
                this.obj[i].children[j].material = new THREE.MeshPhongMaterial({ side: THREE.DoubleSide, map: texture, color: meshcolor, emissive: meshemissive, specular: meshspecular, shininess: meshshininess, opacity: meshopacity, transparent: true });
                this.obj[i].children[j].material.needsUpdate = true;
                this.view.notifyChange(true);
            }
        } else if (this.bdTopo) {
            var f = (parent) => {
                for (var j = 0; j < parent.children.length; j++) {
                    if (parent.children[j].name == 'wall_faces' || parent.children[j].name == 'roof_faces') {
                        var texture = new THREE.TextureLoader().load(chemin);
                        texture.textureRepetition = THREE.RepeatWrapping;
                        texture.wrapT = THREE.RepeatWrapping;
                        // Save material properties
                        var meshshininess = parent.children[j].material.shininess;
                        var meshspecular = parent.children[j].material.specular;
                        var meshemissive = parent.children[j].material.emissive;
                        var meshcolor = parent.children[j].material.color;
                        var meshopacity = parent.children[j].material.opacity;
                        // Create and apply new material
                        parent.children[j].material = new THREE.MeshPhongMaterial({ side: THREE.DoubleSide, map: texture, color: meshcolor, emissive: meshemissive, specular: meshspecular, shininess: meshshininess, opacity: meshopacity, transparent: true });
                        parent.children[j].material.needsUpdate = true;
                    }
                }
            };
            this.bdTopoStyle.wall_faces.texture = chemin;
            this.bdTopoStyle.roof_faces.texture = chemin;
            this.bdTopo(f);
        }
    }
    // Remove texture
    else {
        // Remove texture repetition controller from the GUI
        for (let k = 0; k < folder.__controllers.length; k++) {
            if (folder.__controllers[k].property == 'textureRepetition') {
                folder.remove(folder.__controllers[k]);
            }
        }
        // Set map attribute to null to remove the texture
        if (i >= 0) {
            for (let j = 0; j < this.obj[i].children.length; j++) {
                this.obj[i].children[j].material.map = null;
                this.obj[i].children[j].material.needsUpdate = true;
                this.view.notifyChange(true);
            }
        } else if (this.bdTopo) {
            var f2 = (parent) => {
                for (var j = 0; j < parent.children.length; j++) {
                    if (parent.children[j].name == 'wall_faces' || parent.children[j].name == 'roof_faces') {
                        parent.children[j].material.map = null;
                        parent.children[j].material.needsUpdate = true;
                    }
                }
            };
            this.bdTopoStyle.wall_faces.texture = chemin;
            this.bdTopoStyle.roof_faces.texture = chemin;
            this.bdTopo(f2);
        }
    }
};

Symbolizer.prototype._changeWidthEdge = function changeWidthEdge(value, i, j) {
    // Update edge width with selected value
    if (i >= 0) {
        this.edges[i].children[j].material.linewidth = value;
        this.edges[i].children[j].material.needsUpdate = true;
        this.view.notifyChange(true);
    } else if (this.bdTopo) {
        var f2 = (parent) => {
            for (var j = 0; j < parent.children.length; j++) {
                if (parent.children[j].name == 'wall_edges' || parent.children[j].name == 'roof_edges') {
                    parent.children[j].material.linewidth = value;
                    parent.children[j].material.needsUpdate = true;
                }
            }
        };
        this.bdTopoStyle.edges.width = value;
        this.bdTopo(f2);
    }
};

Symbolizer.prototype._addStyleEdgeParams = function _addStyleEdgeParams(value, folder) {
    var i;
    var j;
    var k;
    // Create or remove specific controllers according to the style chosen (sketchy, dashed, continuous)
    if (value === 'Sketchy') {
        // Initial GUI parameters
        var color = this.edges[0].children[0].material.color;
        var width = this.edges[0].children[0].material.linewidth;
        var threshold = 100.0;
        var stroke = 'dashed';
        // Checks if sketchy parameters controllers already exists
        var isSketchy = false;
        for (k = 0; k < folder.__controllers.length; k++) {
            if (folder.__controllers[k].property == 'sketchyThreshold') {
                isSketchy = true;
            }
        }
        // If not, these controllers are added to the GUI
        if (!isSketchy) {
            // Controller to change the threshold
            folder.add({ sketchyThreshold: 100.0 }, 'sketchyThreshold', 10.0, 200.0).name('Threshold').onChange((value) => {
                threshold = value;
                this._createSketchyMaterial(stroke, color, width, threshold);
            });
            // Controller to change the stroke
            folder.add({ sketchyStroke: 'dashed' }, 'sketchyStroke', ['dashed', 'brush', 'irregular', 'thick', 'two', 'wavy']).name('Stroke').onChange((value) => {
                stroke = value;
                this._createSketchyMaterial(stroke, color, width, threshold);
            });
            // Adapt color controller to sketchy edge
            folder.__controllers[0].onChange((value) => {
                color = new THREE.Color(value);
                this._createSketchyMaterial(stroke, color, width, threshold);
            });
            // Adapt width controller to sketchy edge
            folder.__controllers[2].__min = 10.0;
            folder.__controllers[2].__max = 100.0;
            folder.__controllers[2].onChange((value) => {
                width = value;
                this._createSketchyMaterial(stroke, color, width, threshold);
            });
        }
        // Remove dashed specific controllers grom the GUI
        for (k = 0; k < folder.__controllers.length; k++) {
            if (folder.__controllers[k].property == 'dashSize') {
                folder.remove(folder.__controllers[k]);
            }
            if (folder.__controllers[k].property == 'gapSize') {
                folder.remove(folder.__controllers[k]);
            }
        }
    }
    else {
        // Remove sketchy specific controllers from the GUI
        for (k = 0; k < folder.__controllers.length; k++) {
            if (folder.__controllers[k].property == 'sketchyThreshold') {
                folder.remove(folder.__controllers[k]);
            }
            if (folder.__controllers[k].property == 'sketchyStroke') {
                folder.remove(folder.__controllers[k]);
            }
        }
        // Readapt color and width controller to classic edge (continuous or dashed)
        folder.__controllers[0].onChange((value) => {
            for (i = 0; i < this.edges.length; i++) {
                for (j = 0; j < this.edges[i].children.length; j++) {
                    this._changeColorEdge(value, i, j);
                }
            }
        });
        folder.__controllers[2].__min = 0.0;
        folder.__controllers[2].__max = 5.0;
        folder.__controllers[2].onChange((value) => {
            for (i = 0; i < this.edges.length; i++) {
                for (j = 0; j < this.edges[i].children.length; j++) {
                    this._changeWidthEdge(value, i, j);
                }
            }
        });
        if (value === 'Dashed') {
            // Checks if dash size and gap size controllers already exist
            var isDashed = false;
            for (k = 0; k < folder.__controllers.length; k++) {
                if (folder.__controllers[k].property == 'dashSize') {
                    isDashed = true;
                }
            }
            // If not, add dashSize and gapSize controllers to the GUI
            if (!isDashed) {
                folder.add({ dashSize: 0.05 }, 'dashSize', 0.01, 0.5).name('Dash Size').onChange((value) => {
                    // Iteration over all the edges, to apply the changes everywhere
                    for (i = 0; i < this.edges.length; i++) {
                        for (j = 0; j < this.edges[i].children.length; j++) {
                            this._changeDashSize(value, i, j);
                        }
                    }
                });
                folder.add({ gapSize: 0.05 }, 'gapSize', 0.01, 0.5).name('Gap Size').onChange((value) => {
                    for (i = 0; i < this.edges.length; i++) {
                        for (j = 0; j < this.edges[i].children.length; j++) {
                            this._changeGapSize(value, i, j);
                        }
                    }
                });
            }
        }
        else {
            // Remove dashed specific controllers from the GUI
            for (k = 0; k < folder.__controllers.length; k++) {
                if (folder.__controllers[k].property == 'dashSize') {
                    folder.remove(folder.__controllers[k]);
                }
                if (folder.__controllers[k].property == 'gapSize') {
                    folder.remove(folder.__controllers[k]);
                }
            }
        }
    }
};

Symbolizer.prototype._changeStyleEdge = function changeStyleEdge(value, folder) {
    var oldOpacity;
    var oldColor;
    var oldWidth;
    // Save edges property (all edges have the same)
    if (this.edges.length != 0) {
        oldOpacity = this.edges[0].children[0].material.opacity;
        oldColor = this.edges[0].children[0].material.color;
        oldWidth = this.edges[0].children[0].material.linewidth;
    }
    else if (this.bdTopo) {
        oldOpacity = this.bdTopoStyle.edges.opacity;
        oldColor = this.bdTopoStyle.edges.color;
        oldWidth = this.bdTopoStyle.edges.width;
    }
    var i;
    var j;
    // Create new material
    var newMaterial;
    // Adapt the GUI
    this._addStyleEdgeParams(value, folder);
    if (value === 'Dashed') {
        // Create dashed material
        newMaterial = new THREE.LineDashedMaterial({
            color: oldColor,
            linewidth: oldWidth,
            opacity: oldOpacity,
            dashSize: 0.05,
            gapSize: 0.05,
        });
        // If quads (for sketchy edges) were created before, we hide them
        if (this.quads != null) {
            this.quads.traverse((child) => {
                child.visible = false;
            });
        }
        // Dashed material is applied to the edges
        for (i = 0; i < this.edges.length; i++) {
            for (j = 0; j < this.edges[i].children.length; j++) {
                // Compute line distances (necessary to apply dashed material)
                this.edges[i].children[j].computeLineDistances();
                // Apply new material
                this.edges[i].children[j].material = newMaterial;
                this.edges[i].children[j].material.needsUpdate = true;
                this.view.notifyChange(true);
            }
        }
        if (this.bdTopo) {
            var f1 = (parent) => {
                for (j = 0; j < parent.children.length; j++) {
                    if (parent.children[j].name == 'wall_edges' || parent.children[j].name == 'roof_edges') {
                        parent.children[j].computeLineDistances();
                        parent.children[j].material = newMaterial;
                        parent.children[j].material.needsUpdate = true;
                    }
                }
            };
            this.bdTopoStyle.edges.style = value;
            this.bdTopo(f1);
        }
    }
    else if (value === 'Sketchy') {
        // Initialize parameters to create the material
        var width = 30.0;
        var threshold = 100.0;
        var stroke = 'dashed';
        for (i = 0; i < this.edges.length; i++) {
            for (j = 0; j < this.edges[i].children.length; j++) {
                // Hide classic edges
                this.edges[i].children[j].material.visible = false;
            }
        }
        if (this.bdTopo) {
            var f2 = (parent) => {
                for (j = 0; j < parent.children.length; j++) {
                    if (parent.children[j].name == 'wall_edges' || parent.children[j].name == 'roof_edges') {
                        parent.children[j].material.visible = false;
                    }
                }
            };
            this.bdTopo(f2);
        }
        // Apply sketchy style
        this._createSketchyMaterial(stroke, oldColor, width, threshold);
    }
    else {
        // Create basic material
        newMaterial = new THREE.LineBasicMaterial({
            color: oldColor,
            linewidth: oldWidth,
            opacity: oldOpacity,
        });
        // If quads (for sketchy edges) were created before, we hide them
        if (this.quads != null) {
            this.quads.traverse((child) => {
                child.visible = false;
            });
        }
        for (i = 0; i < this.edges.length; i++) {
            for (j = 0; j < this.edges[i].children.length; j++) {
                // Apply new material
                this.edges[i].children[j].material = newMaterial;
                this.edges[i].children[j].material.needsUpdate = true;
                this.view.notifyChange(true);
            }
        }
        if (this.bdTopo) {
            var f3 = (parent) => {
                for (j = 0; j < parent.children.length; j++) {
                    if (parent.children[j].name == 'wall_edges' || parent.children[j].name == 'roof_edges') {
                        parent.children[j].computeLineDistances();
                        parent.children[j].material = newMaterial;
                        parent.children[j].material.needsUpdate = true;
                    }
                }
            };
            this.bdTopoStyle.edges.style = value;
            this.bdTopo(f3);
        }
    }
};

Symbolizer.prototype._createSketchyMaterial = function createSketchyMaterial(stroke, color, width, threshold) {
    // Create shaders to render sketchy edges
    var vertex =
    `
    attribute vec3  position2;
    uniform   vec2  resolution;
    uniform   float thickness;
    uniform   float texthreshold;
    varying   vec3 v_uv;
    varying   float choixTex;

    void main() {

        // Calcul positions ECRAN des sommets de l'arête
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0);
        vec4 Position2 = projectionMatrix * modelViewMatrix * vec4(position2,1.0);

        vec2 dir = (gl_Position.xy/gl_Position.w - Position2.xy/Position2.w) * resolution;

        // Choix texture selon taille écran de l'arête
        if (length(dir) < texthreshold){
            choixTex = 1.0;
        } else {
            choixTex = 1.0;
        }

        // Calcul des normales
        vec2 normal = normalize(dir);
        normal = uv.x * uv.y * vec2(-normal.y, normal.x);

        // Déplacement points pour faire un quad (largeur selon taille écran : rapport longueur largeur constant)
        gl_Position.xy += ((length(dir)/thickness) * normal * 0.5) * (gl_Position.w / resolution);

        gl_Position.z =  -gl_Position.w;

        v_uv = vec3(uv,1.) * gl_Position.w;

    }
    `;
    var fragment =
    `
    varying vec3  v_uv;
    varying float choixTex;
    uniform sampler2D texture1;
    uniform sampler2D texture2;
    uniform vec3 color;
    
    void main() {

        vec2 uv = v_uv.xy/v_uv.z;
        vec4 baseColor;

        // Détermination textures (choisie dans le vertex shader)
        if (choixTex == 1.0){
            baseColor = texture2D(texture1, (uv+1.)*0.5);   
        } else {
            baseColor = texture2D(texture2, (uv+1.)*0.5);   
        }

        //if ( baseColor.a < 0.3 ) discard;
        // Application de la texture
        gl_FragColor = vec4(baseColor.a*baseColor.xyz,baseColor.a)+vec4(color,0.0);

    }
    `;
    // Initializations
    var texture1;
    var texture2;
    var loader = new THREE.TextureLoader();
    var path1 = './strokes/'.concat(stroke).concat('_small.png');
    var path2 = './strokes/'.concat(stroke).concat('.png');
    // Load textures
    loader.load(
        path1,
        (t1) => {
            // Save texture 1
            texture1 = t1;
            loader.load(
                path2,
                (t2) => {
                    // Save texture 2
                    texture2 = t2;
                    // Create shader material
                    var material = new THREE.ShaderMaterial({
                        uniforms: {
                            texthreshold: { value: threshold },
                            thickness: { value: width },
                            resolution: { value: new THREE.Vector2(window.innerWidth, window.innerHeight) },
                            texture1: { type: 't', value: texture1 },
                            texture2: { type: 't', value: texture2 },
                            color: { type: 'v3', value: [color.r, color.g, color.b] },
                        },
                        vertexShader: vertex,
                        fragmentShader: fragment,
                    });
                    material.transparent = true;
                    material.polygonOffset = true;
                    material.polygonOffsetUnits = -150.0;
                    // Quad group initialization
                    var quadGroup = new THREE.Group();
                    // If the quads are not created we create them
                    if (this.quads == null) {
                        // Iteration over the edges
                        for (var i = 0; i < this.edges.length; i++) {
                            for (var j = 0; j < this.edges[i].children.length; j++) {
                                // Position of the edges
                                var edgePos = this.edges[i].children[j].geometry.getAttribute('position').array;
                                // Iteration over the array of positions to isolate each edge
                                for (var k = 0; k < edgePos.length - 5; k += 6) {
                                    // Create quads from the edge
                                    var pt1 = new THREE.Vector3(edgePos[k], edgePos[k + 1], edgePos[k + 2]);
                                    var pt2 = new THREE.Vector3(edgePos[k + 3], edgePos[k + 4], edgePos[k + 5]);
                                    var quadGeom = createQuad(pt1, pt2);
                                    // Apply sketchy material to the quad
                                    var quadMesh = new THREE.Mesh(quadGeom, material);
                                    quadMesh.visible = true;
                                    quadMesh.material.needsUpdate = true;
                                    // Add quad to the group
                                    quadGroup.add(quadMesh);
                                }
                                this.quads = quadGroup;
                            }
                            // Name the group after the layer
                            if (this.obj.length > 0) {
                                quadGroup.name = 'quads_'.concat(this.obj[0].name.split('_')[0]);
                            }
                            else if (this.bdTopo) {
                                quadGroup.name = 'quads_bdTopo';
                            }
                            // Set group position
                            quadGroup.position.copy(this.obj[i].position);
                            quadGroup.rotation.copy(this.obj[i].rotation);
                            quadGroup.scale.copy(this.obj[i].scale);
                            quadGroup.updateMatrixWorld();
                        }
                    }
                    // Else, we apply the material on the existing quads
                    else {
                        this.quads.traverse((child) => {
                            child.visible = true;
                            child.material = material;
                            child.material.needsUpdate = true;
                        });
                    }
                    // Add the group of quads to the scene
                    this.view.scene.add(quadGroup);
                    this.view.notifyChange(true);
                });
        });
};

Symbolizer.prototype._changeDashSize = function changeDashSize(value, i, j) {
    if (i >= 0) {
        this.edges[i].children[j].material.dashSize = value;
        this.edges[i].children[j].material.needsUpdate = true;
        this.view.notifyChange(true);
    } else if (this.bdTopo) {
        var f2 = (parent) => {
            for (var j = 0; j < parent.children.length; j++) {
                if (parent.children[j].name == 'wall_edges' || parent.children[j].name == 'roof_edges') {
                    parent.children[j].material.dashSize = value;
                    parent.children[j].material.needsUpdate = true;
                }
            }
        };
        this.bdTopoStyle.edges.dashSize = value;
        this.bdTopo(f2);
    }
};

Symbolizer.prototype._changeGapSize = function changeGapSize(value, i, j) {
    if (i >= 0) {
        this.edges[i].children[j].material.gapSize = value;
        this.edges[i].children[j].material.needsUpdate = true;
        this.view.notifyChange(true);
    } else if (this.bdTopo) {
        var f2 = (parent) => {
            for (var j = 0; j < parent.children.length; j++) {
                if (parent.children[j].name == 'wall_edges' || parent.children[j].name == 'roof_edges') {
                    parent.children[j].material.gapSize = value;
                    parent.children[j].material.needsUpdate = true;
                }
            }
        };
        this.bdTopoStyle.edges.gapSize = value;
        this.bdTopo(f2);
    }
};

Symbolizer.prototype._changeTextureRepetition = function _changeTextureRepetition(value, i, j) {
    if (i >= 0) {
        this.obj[i].children[j].material.map.repeat.set(value, value);
        this.obj[i].children[j].material.needsUpdate = true;
        this.view.notifyChange(true);
    } else if (this.bdTopo) {
        var f2 = (parent) => {
            for (var j = 0; j < parent.children.length; j++) {
                if (parent.children[j].name == 'wall_faces' || parent.children[j].name == 'roof_faces') {
                    parent.children[j].material.map.repeat.set(value, value);
                    parent.children[j].material.needsUpdate = true;
                }
            }
        };
        this.bdTopoStyle.edges.textureRepetition = value;
        this.bdTopo(f2);
    }
};


Symbolizer.prototype._saveVibes = function saveVibes() {
    // Initiate stylesheet with edge style and an empty list for face style
    var vibes;
    var name;
    if (this.obj.length > 0) {
        name = this.obj[0].name.split('_')[0];
        vibes = {
            edges: {
                opacity: this.edges[0].children[0].material.opacity,
                color: this.edges[0].children[0].material.color,
                width: this.edges[0].children[0].material.linewidth,
            },
            faces: [],
        };
        // Iteration over the children of each object (they all have the same)
        for (var i = 0; i < this.obj[0].children.length; i++) {
            // Get the texture path
            var textureUse = null;
            // Checks if the mesh has a texture
            if (this.obj[0].children[i].material.map != null) {
                var textureUsetab = this.obj[0].children[i].material.map.image.src.split('/');
                var j = 0;
                while (j < textureUsetab.length && textureUsetab[j] != 'textures') j++;
                textureUse = '.';
                while (j < textureUsetab.length) {
                    textureUse = textureUse.concat('/', textureUsetab[j]);
                    j++;
                }
            }
            // Push each face style in the list
            vibes.faces.push({
                name: this.obj[0].children[i].name,
                opacity: this.obj[0].children[i].material.opacity,
                color: '#'.concat(this.obj[0].children[i].material.color.getHexString()),
                emissive: '#'.concat(this.obj[0].children[i].material.emissive.getHexString()),
                specular: '#'.concat(this.obj[0].children[i].material.specular.getHexString()),
                shininess: this.obj[0].children[i].material.shininess,
                texture: textureUse,
            });
        }
        if (this.bdTopo) {
            vibes.faces.push({
                name: 'wall_faces',
                opacity: this.bdTopoStyle.wall_faces.opacity,
                color: this.bdTopoStyle.wall_faces.color,
                emissive: this.bdTopoStyle.wall_faces.emissive,
                specular: this.bdTopoStyle.wall_faces.specular,
                shininess: this.bdTopoStyle.wall_faces.shininess,
                texture: this.bdTopoStyle.wall_faces.texture,
            });
            vibes.faces.push({
                name: 'roof_faces',
                opacity: this.bdTopoStyle.roof_faces.opacity,
                color: this.bdTopoStyle.roof_faces.color,
                emissive: this.bdTopoStyle.roof_faces.emissive,
                specular: this.bdTopoStyle.roof_faces.specular,
                shininess: this.bdTopoStyle.roof_faces.shininess,
                texture: this.bdTopoStyle.roof_faces.texture,
            });
        }
    } else if (this.bdTopo) {
        name = 'bdTopo';
        vibes = {
            edges: {
                opacity: this.bdTopoStyle.edges.opacity,
                color: this.bdTopoStyle.edges.color,
                width: this.bdTopoStyle.edges.width,
            },
            faces: [
                {
                    name: 'wall_faces',
                    opacity: this.bdTopoStyle.wall_faces.opacity,
                    color: this.bdTopoStyle.wall_faces.color,
                    emissive: this.bdTopoStyle.wall_faces.emissive,
                    specular: this.bdTopoStyle.wall_faces.specular,
                    shininess: this.bdTopoStyle.wall_faces.shininess,
                    texture: this.bdTopoStyle.wall_faces.texture,
                }, {
                    name: 'roof_faces',
                    opacity: this.bdTopoStyle.roof_faces.opacity,
                    color: this.bdTopoStyle.roof_faces.color,
                    emissive: this.bdTopoStyle.roof_faces.emissive,
                    specular: this.bdTopoStyle.roof_faces.specular,
                    shininess: this.bdTopoStyle.roof_faces.shininess,
                    texture: this.bdTopoStyle.roof_faces.texture,
                },
            ],
        };
    }
    var blob = new Blob([JSON.stringify(vibes)], { type: 'text/plain;charset=utf-8' });
    // model[0].name.split('_')[0]
    FILE.saveAs(blob, name.concat('_partie.vibes'));
};

Symbolizer.prototype._saveVibesAll = function saveVibesAll() {
    var vibes;
    var name;
    if (this.obj.length > 0) {
        name = this.obj[0].name.split('_')[0];
        vibes = {
            edges: {
                opacity: this.edges[0].children[0].material.opacity,
                color: this.edges[0].children[0].material.color,
                width: this.edges[0].children[0].material.linewidth,
            },
            faces: [] };
        // Get the texture path
        var textureUse = null;
        // Checks if the mesh has a texture
        if (this.obj[0].children[0].material.map != null) {
            var textureUsetab = this.obj[0].children[0].material.map.image.src.split('/');
            var j = 0;
            while (j < textureUsetab.length && textureUsetab[j] != 'textures') j++;
            textureUse = '.';
            while (j < textureUsetab.length) {
                textureUse = textureUse.concat('/', textureUsetab[j]);
                j++;
            }
        }
        vibes.faces.push({
            opacity: this.obj[0].children[0].material.opacity,
            color: '#'.concat(this.obj[0].children[0].material.color.getHexString()),
            emissive: '#'.concat(this.obj[0].children[0].material.emissive.getHexString()),
            specular: '#'.concat(this.obj[0].children[0].material.specular.getHexString()),
            shininess: this.obj[0].children[0].material.shininess,
            texture: textureUse,
        });
    } else if (this.bdTopo) {
        name = 'bdTopo';
        vibes = {
            edges: {
                opacity: this.bdTopoStyle.edges.opacity,
                color: this.bdTopoStyle.edges.color,
                width: this.bdTopoStyle.edges.width,
            },
            faces: [
                {
                    opacity: this.bdTopoStyle.wall_faces.opacity,
                    color: this.bdTopoStyle.wall_faces.color,
                    emissive: this.bdTopoStyle.wall_faces.emissive,
                    specular: this.bdTopoStyle.wall_faces.specular,
                    shininess: this.bdTopoStyle.wall_faces.shininess,
                    texture: this.bdTopoStyle.wall_faces.texture,
                },
            ],
        };
    }
    var blob = new Blob([JSON.stringify(vibes)], { type: 'text/plain;charset=utf-8' });
    FILE.saveAs(blob, name.concat('_globale.vibes'));
};

Symbolizer.prototype._saveGibesAll = function saveGibesAll() {
    var gibes = {
        name: this.obj[0].materialLibraries[0].substring(0, this.obj[0].materialLibraries[0].length - 4),
        coordX: this.obj[0].position.x,
        coordY: this.obj[0].position.y,
        coordZ: this.obj[0].position.z,
        rotateX: this.obj[0].rotation.x,
        rotateY: this.obj[0].rotation.y,
        rotateZ: this.obj[0].rotation.z,
        scale: this.obj[0].scale.x,
    };
    var blob = new Blob([JSON.stringify(gibes)], { type: 'text/plain; charset=utf-8' });
    FILE.saveAs(blob, this.obj[0].materialLibraries[0].substring(0, this.obj[0].materialLibraries[0].length - 4).concat('.gibes'));
};


Symbolizer.prototype._readVibes = function readVibes(file, folder) {
    var reader = new FileReader();
    if (file.name.endsWith('.vibes')) {
        reader.addEventListener('load', () => this.applyStyle(JSON.parse(reader.result), folder), false);
        reader.readAsText(file);
        return 0;
    } else {
        throw new loadFileException('Unvalid format');
    }
};

// Menu management

Symbolizer.prototype._addOpacity = function addOpacity(folder, j) {
    var initialOpacity;
    if (this.obj.length > 0 && j > 0) {
        initialOpacity = this.obj[0].children[j].material.opacity;
        folder.add({ opacity: initialOpacity }, 'opacity', 0, 1).name('Opacity').onChange((value) => {
            // Iteration over the list of objects
            for (var i = 0; i < this.obj.length; i++) {
                this._changeOpacity(value, i, j);
            }
        });
    } else if (this.bdTopo && j < 0) {
        //  ['wall_faces': -10, 'roof_faces' = -20];
        var name = j == -10 ? 'wall_faces' : 'roof_faces';
        initialOpacity = this.bdTopoStyle[name].opacity;
        folder.add({ opacity: initialOpacity }, 'opacity', 0, 1).name('Opacity').onChange((value) => {
            // Iteration over the list of objects
            this._changeOpacity(value, -10, j / -10 - 1);
        });
    }
};

Symbolizer.prototype._addColor = function addColor(folder, j) {
    var initialColor;
    if (this.obj.length > 0 && j > 0) {
        initialColor = '#'.concat(this.obj[0].children[j].material.color.getHexString());
        folder.addColor({ color: initialColor }, 'color').name('Color').onChange((value) => {
            for (var i = 0; i < this.obj.length; i++) {
                this._changeColor(value, i, j);
            }
        });
    } else if (this.bdTopo && j < 0) {
        //  ['wall_faces': -10, 'roof_faces' = -20];
        var name = j == -10 ? 'wall_faces' : 'roof_faces';
        initialColor = this.bdTopoStyle[name].color;
        folder.addColor({ color: initialColor }, 'color').name('Color').onChange((value) => {
            this._changeColor(value, -10, j / -10 - 1);
        });
    }
};

Symbolizer.prototype._addEmissive = function addEmissive(folder, j) {
    var initialEmissive;
    if (this.obj.length > 0 && j > 0) {
        initialEmissive = '#'.concat(this.obj[0].children[j].material.emissive.getHexString());
        folder.addColor({ emissive: initialEmissive }, 'emissive').name('Emissive').onChange((value) => {
            for (var i = 0; i < this.obj.length; i++) {
                this._changeEmissive(value, i, j);
            }
        });
    } else if (this.bdTopo && j < 0) {
        //  ['wall_faces': -10, 'roof_faces' = -20];
        var name = j == -10 ? 'wall_faces' : 'roof_faces';
        initialEmissive = this.bdTopoStyle[name].emissive;
        folder.addColor({ emissive: initialEmissive }, 'emissive').name('Emissive').onChange((value) => {
            this._changeEmissive(value, -10, j / -10 - 1);
        });
    }
};


Symbolizer.prototype._addSpecular = function addSpecular(folder, j) {
    var initialSpecular;
    if (this.obj.length > 0 && j > 0) {
        initialSpecular = '#'.concat(this.obj[0].children[j].material.specular.getHexString());
        folder.addColor({ specular: initialSpecular }, 'specular').name('Specular').onChange((value) => {
            for (var i = 0; i < this.obj.length; i++) {
                this._changeSpecular(value, i, j);
            }
            this._changeSpecular(value, -10, 0);
        });
    } else if (this.bdTopo && j < 0) {
        //  ['wall_faces': -10, 'roof_faces' = -20];
        var name = j == -10 ? 'wall_faces' : 'roof_faces';
        initialSpecular = this.bdTopoStyle[name].specular;
        folder.addColor({ specular: initialSpecular }, 'specular').name('Specular').onChange((value) => {
            this._changeSpecular(value, -10, 0);
        });
    }
};

Symbolizer.prototype._addShininess = function addShininess(folder, j) {
    var initialShininess;
    if (this.obj.length > 0 && j > 0) {
        initialShininess = this.obj[0].children[j].material.shininess;
        folder.add({ shininess: initialShininess }, 'shininess', 0, 100).name('Shininess').onChange((value) => {
            for (var i = 0; i < this.obj.length; i++) {
                this._changeShininess(value, i, j);
            }
            this._changeShininess(value, -10, 0);
        });
    } else if (this.bdTopo && j < 0) {
        //  ['wall_faces': -10, 'roof_faces' = -20];
        var name = j == -10 ? 'wall_faces' : 'roof_faces';
        initialShininess = this.bdTopoStyle[name].shininess;
        folder.add({ shininess: initialShininess }, 'shininess', 0, 100).name('Shininess').onChange((value) => {
            this._changeShininess(value, -10, 0);
        });
    }
};

Symbolizer.prototype._addTexture = function addTexture(folder, j) {
    Fetcher.json('./textures/listeTexture.json').then((listTextures) => {
        if (listTextures) {
            listTextures[''] = '';
            folder.add({ texture: '' }, 'texture', listTextures).onChange((value) => {
                for (var i = 0; i < this.obj.length; i++) {
                    this._changeTexture('./textures/'.concat(value), i, j, folder);
                }
                this._changeTexture('./textures/'.concat(value), -10, 0, folder);
            }).name('Texture');
        }
    });
};

// More parameters...

Symbolizer.prototype._addSave = function addSave(folder) {
    folder.add({ save: () => this._saveVibes() }, 'save').name('Save style');
    folder.add({ saveGibe: () => this._saveGibesAll() }, 'saveGibe').name('Save position');
};

Symbolizer.prototype._addLoad = function addLoad(folder) {
    folder.add({ load: () => {
        var button = document.createElement('input');
        button.setAttribute('type', 'file');
        button.addEventListener('change', () => this._readVibes(button.files[0], folder), false);
        button.click();
    } }, 'load').name('Load style');
};

Symbolizer.prototype.initGui = function addToGUI() {
    // We check if the objects of the list have the same structure
    if (this._checkStructure()) {
        // If the structure is similar, we create a folder for the symbolizer
        var parentFolder = this.menu.gui.addFolder('Symbolizer '.concat(this.nb));
        this.folder = parentFolder;
        this._addSave(parentFolder);
        this._addLoad(parentFolder);
        var positionFolder = parentFolder.addFolder('Position');
        this._addResetPosition(positionFolder);
        this._addRotationsAll(positionFolder);
        this._addScaleAll(positionFolder);
        this._addMoveobjcoordAll(positionFolder);
        this._addPositionAll(positionFolder);
        var edgesFolder = parentFolder.addFolder('Edges');
        this._addColorEdgeAll(edgesFolder);
        this._addOpacityEdgeAll(edgesFolder);
        this._addWidthEdgeAll(edgesFolder);
        this._addStyleEdgeAll(edgesFolder);
        // Iteration over the children of each object (for ex. roof / wall)
        // (We previously checked that each object in the list has the same structure)
        var facesFolder = parentFolder.addFolder('Faces');
        var j;
        var folder;
        if (this.obj.length > 0) {
            for (j = 0; j < this.obj[0].children.length; j++) {
                // We create a folder for each child
                folder = facesFolder.addFolder(this.obj[0].children[j].name);
                this._addOpacity(folder, j);
                this._addColor(folder, j);
                this._addEmissive(folder, j);
                this._addSpecular(folder, j);
                this._addShininess(folder, j);
                this._addTexture(folder, j);
            }
        } else if (this.bdTopo) {
            var nameL = ['wall', 'roof'];
            for (var i = 0; i < 2; i++) {
                j = (i + 1) * -10;
                folder = facesFolder.addFolder(nameL[i]);
                this._addOpacity(folder, j);
                this._addColor(folder, j);
                this._addEmissive(folder, j);
                this._addSpecular(folder, j);
                this._addShininess(folder, j);
                this._addTexture(folder, j);
            }
        }
        if (this.light != null) {
            var lightFolder = parentFolder.addFolder('Light');
            this._addColorLight(lightFolder);
            this._addMoveLight(lightFolder);
        }
    }
    else {
        this.initGuiAll();
    }
};

Symbolizer.prototype._addResetPosition = function addResetPosition(folder) {
    if (this.obj.length > 0 && (this.obj[0].name != 'bati3D_faces' || this.obj.length > 1)) {
        // Get initial values
        var initialRotateX = this.obj[0].rotation.x;
        var initialRotateY = this.obj[0].rotation.y;
        var initialRotateZ = this.obj[0].rotation.z;
        var initialScale = this.obj[0].scale.x;
        var initialPositionX = this.obj[0].position.x;
        var initialPositionY = this.obj[0].position.y;
        var initialPositionZ = this.obj[0].position.z;
        // Add a button to reset all initial parameters
        folder.add({ resetPosition: () => {
            // Reset GUI
            folder.__controllers[1].setValue(initialRotateX);
            folder.__controllers[2].setValue(initialRotateY);
            folder.__controllers[3].setValue(initialRotateZ);
            folder.__controllers[4].setValue(initialScale);
            folder.__controllers[5].setValue(initialPositionX);
            folder.__controllers[6].setValue(initialPositionY);
            folder.__controllers[7].setValue(initialPositionZ);
            folder.__controllers[8].setValue(initialPositionX);
            folder.__controllers[9].setValue(initialPositionY);
            folder.__controllers[10].setValue(initialPositionZ);
            // Reset parameters
            for (var i = 0; i < this.obj.length; i++) {
                this.obj[i].rotation.x = initialRotateX;
                this.edges[i].rotation.x = initialRotateX;
                this.obj[i].rotation.y = initialRotateY;
                this.edges[i].rotation.y = initialRotateY;
                this.obj[i].rotation.z = initialRotateZ;
                this.edges[i].rotation.z = initialRotateZ;
                this.obj[i].scale.set(initialScale, initialScale, initialScale);
                this.edges[i].scale.set(initialScale, initialScale, initialScale);
                this.obj[i].position.x = initialPositionX;
                this.edges[i].position.x = initialPositionX;
                this.obj[i].position.y = initialPositionY;
                this.edges[i].position.y = initialPositionY;
                this.obj[i].position.z = initialPositionZ;
                this.edges[i].position.z = initialPositionZ;
                this.obj[i].updateMatrixWorld();
                this.edges[i].updateMatrixWorld();
                // Reset quads position if they exist
                if (this.quads != null) {
                    this.quads.position.copy(this.obj[i].position);
                    this.quads.rotation.copy(this.obj[i].rotation);
                    this.quads.scale.copy(this.obj[i].scale);
                    this.quads.updateMatrixWorld();
                }
            }
            this.view.notifyChange(true);
        },
        }, 'resetPosition').name('Reset position');
    }
};

Symbolizer.prototype._addScaleAll = function addScaleAll(folder) {
    if (this.obj.length > 0 && (this.obj[0].name != 'bati3D_faces' || this.obj.length > 1)) {
        // Initial GUI value
        var initialScale = this.obj[0].scale.x;
        // Add controller for scaling objects
        folder.add({ scale: initialScale }, 'scale', 0.1, 1000, 0.01).name('Scale').onChange((value) => {
            for (var i = 0; i < this.obj.length; i++) {
                if (this.obj[i].name != 'bati3D_faces') {
                    // Scale objects and edges
                    this.obj[i].scale.set(value, value, value);
                    this.edges[i].scale.set(value, value, value);
                    this.obj[i].updateMatrixWorld();
                    this.edges[i].updateMatrixWorld();
                    // Scale quads if they exist
                    if (this.quads != null) {
                        this.quads.scale.copy(this.obj[i].scale);
                        this.quads.updateMatrixWorld();
                    }
                }
            }
            this.view.notifyChange(true);
        });
    }
};

Symbolizer.prototype._addMoveobjcoordAll = function addMoveobjcoordAll(folder) {
    if (this.obj.length > 0 && (this.obj[0].name != 'bati3D_faces' || this.obj.length > 1)) {
        var prevValueX = 0;
        var prevValueY = 0;
        var prevValueZ = 0;
        // Add controller for X translation
        folder.add({ MovecoordX: 0 }, 'MovecoordX', -50, 50, 0.1).name('Translation X').onChange((value) => {
            for (var i = 0; i < this.obj.length; i++) {
                if (this.obj[i].name != 'bati3D_faces') {
                    // Translate object and edges
                    this.obj[i].translateX(value - prevValueX);
                    this.edges[i].translateX(value - prevValueX);
                    // Save previous value
                    prevValueX = value;
                    this.obj[i].updateMatrixWorld();
                    this.edges[i].updateMatrixWorld();
                    // Translate quads if they exist
                    if (this.quads != null) {
                        this.quads.position.copy(this.obj[i].position);
                        this.quads.updateMatrixWorld();
                    }
                }
            }
            this.view.notifyChange(true);
        });
        // Add controller for Y translation
        folder.add({ MovecoordY: 0 }, 'MovecoordY', -50, 50, 0.1).name('Translation Y').onChange((value) => {
            for (var i = 0; i < this.obj.length; i++) {
                if (this.obj[i].name != 'bati3D_faces') {
                    // Translate object and edges
                    this.obj[i].translateZ(value - prevValueY);
                    this.edges[i].translateZ(value - prevValueY);
                    // Save previous value
                    prevValueY = value;
                    this.obj[i].updateMatrixWorld();
                    this.edges[i].updateMatrixWorld();
                    // Translate quads if they exist
                    if (this.quads != null) {
                        this.quads.position.copy(this.obj[i].position);
                        this.quads.updateMatrixWorld();
                    }
                }
            }
            this.view.notifyChange(true);
        });
        // Add controller for Z translation
        folder.add({ MovecoordZ: 0 }, 'MovecoordZ', -50, 50, 0.1).name('Translation Z').onChange((value) => {
            for (var i = 0; i < this.obj.length; i++) {
                if (this.obj[i].name != 'bati3D_faces') {
                    // Translate object and edges
                    this.obj[i].translateY(value - prevValueZ);
                    this.edges[i].translateY(value - prevValueZ);
                    // Save previous value
                    prevValueZ = value;
                    this.obj[i].updateMatrixWorld();
                    this.edges[i].updateMatrixWorld();
                    // Translate quads if they exist
                    if (this.quads != null) {
                        this.quads.position.copy(this.obj[i].position);
                        this.quads.updateMatrixWorld();
                    }
                }
            }
            this.view.notifyChange(true);
        });
    }
};


Symbolizer.prototype._addMoveLight = function addMoveLight(folder) {
    var prevValueX = 0;
    var prevValueY = 0;
    var prevValueZ = 0;
    // Add controller for X translation of light
    folder.add({ MovecoordX: 0 }, 'MovecoordX', -50, 50, 0.1).name('Translation X').onChange((value) => {
        this.light.position.x += value - prevValueX;
        prevValueX = value;
        this.light.updateMatrixWorld();
        this.view.notifyChange(true);
    });
    // Add controller for Y translation of light
    folder.add({ MovecoordY: 0 }, 'MovecoordY', -50, 50, 0.1).name('Translation Y').onChange((value) => {
        this.light.position.y += value - prevValueY;
        prevValueY = value;
        this.light.updateMatrixWorld();
        this.view.notifyChange(true);
    });
    // Add controller for Z translation of light
    folder.add({ MovecoordZ: 0 }, 'MovecoordZ', -50, 50, 0.1).name('Translation Z').onChange((value) => {
        this.light.position.z += value - prevValueZ;
        prevValueZ = value;
        this.light.updateMatrixWorld();
        this.view.notifyChange(true);
    });
};

Symbolizer.prototype._addRotationsAll = function addRotationsAll(folder) {
    if (this.obj.length > 0 && (this.obj[0].name != 'bati3D_faces' || this.obj.length > 1)) {
        // Initial GUI value
        var initialRotateX = this.obj[0].rotation.x;
        var initialRotateY = this.obj[0].rotation.y;
        var initialRotateZ = this.obj[0].rotation.z;
        var prevValueX = 0;
        var prevValueY = 0;
        var prevValueZ = 0;
        // Add controller for X rotation
        folder.add({ rotationX: initialRotateX }, 'rotationX', -Math.PI, Math.PI, Math.PI / 100).name('Rotation X').onChange((value) => {
            for (var i = 0; i < this.obj.length; i++) {
                if (this.obj[i].name != 'bati3D_faces') {
                    // Rotate object and edges
                    this.obj[i].rotateX(value - prevValueX);
                    this.edges[i].rotateX(value - prevValueX);
                    // Save previous value
                    prevValueX = value;
                    this.obj[i].updateMatrixWorld();
                    this.edges[i].updateMatrixWorld();
                    // Rotate quads if they exist
                    if (this.quads != null) {
                        this.quads.rotation.copy(this.obj[i].rotation);
                        this.quads.updateMatrixWorld();
                    }
                }
            }
            this.view.notifyChange(true);
        });
        // Add controller for Y rotation
        folder.add({ rotationY: initialRotateY }, 'rotationY', -Math.PI, Math.PI, Math.PI / 100).name('Rotation Y').onChange((value) => {
            for (var i = 0; i < this.obj.length; i++) {
                if (this.obj[i].name != 'bati3D_faces') {
                    // Rotate object and edges
                    this.obj[i].rotateY(value - prevValueY);
                    this.edges[i].rotateY(value - prevValueY);
                    // Save previous value
                    prevValueY = value;
                    this.obj[i].updateMatrixWorld();
                    this.edges[i].updateMatrixWorld();
                    // Rotate quads if they exist
                    if (this.quads != null) {
                        this.quads.rotation.copy(this.obj[i].rotation);
                        this.quads.updateMatrixWorld();
                    }
                }
            }
            this.view.notifyChange(true);
        });
        // Add controller for Z rotation
        folder.add({ rotationZ: initialRotateZ }, 'rotationZ', -Math.PI, Math.PI, Math.PI / 100).name('Rotation Z').onChange((value) => {
            for (var i = 0; i < this.obj.length; i++) {
                if (this.obj[i].name != 'bati3D_faces') {
                    // Rotate object and edges
                    this.obj[i].rotateZ(value - prevValueZ);
                    this.edges[i].rotateZ(value - prevValueZ);
                    // Save previous value
                    prevValueZ = value;
                    this.obj[i].updateMatrixWorld();
                    this.edges[i].updateMatrixWorld();
                    // Rotate quads if they exist
                    if (this.quads != null) {
                        this.quads.rotation.copy(this.obj[i].rotation);
                        this.quads.updateMatrixWorld();
                    }
                }
            }
            this.view.notifyChange(true);
        });
    }
};

Symbolizer.prototype._addOpacityAll = function addOpacityAll(folder) {
    var initialOpacity;
    if (this.obj.length > 0) {
        initialOpacity = this.obj[0].children[0].material.opacity;
        folder.add({ opacity: initialOpacity }, 'opacity', 0, 1).name('Opacity').onChange((value) => {
            // Iteration over the list of objects
            for (var i = 0; i < this.obj.length; i++) {
                // Iteration over the children of each object
                for (var j = 0; j < this.obj[i].children.length; j++) {
                    this._changeOpacity(value, i, j);
                }
            }
            this._changeOpacity(value, -10, 0);
            this._changeOpacity(value, -10, 1);
        });
    } else if (this.bdTopo) {
        initialOpacity = this.bdTopoStyle.wall_faces.opacity;
        folder.add({ opacity: initialOpacity }, 'opacity', 0, 1).name('Opacity').onChange((value) => {
            // Iteration over the list of objects
            this._changeOpacity(value, -10, 0);
            this._changeOpacity(value, -10, 1);
        });
    }
};

Symbolizer.prototype._addPositionAll = function addPositionAll(folder) {
    if (this.obj.length > 0 && (this.obj[0].name != 'bati3D_faces' || this.obj.length > 1)) {
        // Initial GUI value
        var initialX = this.obj[0].position.x;
        var initialY = this.obj[0].position.y;
        var initialZ = this.obj[0].position.z;
        let X = initialX;
        let Y = initialY;
        let Z = initialZ;
        // vector to store the new coordinates
        var vectCoord = new THREE.Vector3();
        // Controller for position on X
        folder.add({ longitude: initialX }, 'longitude').name('Position X').onChange((value) => {
            X = value;
            vectCoord.set(X, Y, Z);
            this._changeCoordinates(vectCoord);
        });
        // Controller for position on Y
        folder.add({ latitude: initialY }, 'latitude').name('Position Y').onChange((value) => {
            Y = value;
            vectCoord.set(X, Y, Z);
            this._changeCoordinates(vectCoord);
        });
        // Controller for position on Z
        folder.add({ altitude: initialZ }, 'altitude').name('Position Z').onChange((value) => {
            Z = value;
            vectCoord.set(X, Y, Z);
            this._changeCoordinates(vectCoord);
        });
    }
};

Symbolizer.prototype._changeCoordinates = function changeCoordinates(vectCoord) {
    if (this.obj.length > 0 && (this.obj[0].name != 'bati3D_faces' || this.obj.length > 1)) {
        for (var i = 0; i < this.obj.length; i++) {
            if (this.obj[0].name != 'bati3D_faces') {
                // Modification of object and edges position
                this.obj[i].position.copy(vectCoord);
                this.edges[i].position.copy(vectCoord);
                this.obj[i].updateMatrixWorld();
                this.edges[i].updateMatrixWorld();
                // Modification of quads position if they exist
                if (this.quads != null) {
                    this.quads.position.copy(this.obj[i].position);
                    this.quads.updateMatrixWorld();
                }
            }
        }
        this.view.controls.setCameraTargetPosition(this.obj[0].position, false);
        this.view.notifyChange(true);
    }
};

Symbolizer.prototype._addOpacityEdgeAll = function addOpacityEdgeAll(folder) {
    var initialOpacity;
    if (this.edges.length > 0) {
        initialOpacity = this.edges[0].children[0].material.opacity;
        folder.add({ opacity: initialOpacity }, 'opacity', 0, 1).name('Edge opacity').onChange((value) => {
            for (var i = 0; i < this.edges.length; i++) {
                for (var j = 0; j < this.edges[i].children.length; j++) {
                    this._changeOpacityEdge(value, i, j);
                }
            }
            this._changeOpacityEdge(value, -10, 0);
            this._changeOpacityEdge(value, -10, 1);
        });
    } else if (this.bdTopo) {
        initialOpacity = this.bdTopoStyle.edges.opacity;
        folder.add({ opacity: initialOpacity }, 'opacity', 0, 1).name('Edge opacity').onChange((value) => {
            this._changeOpacityEdge(value, -10, 0);
            this._changeOpacityEdge(value, -10, 1);
        });
    }
};

Symbolizer.prototype._addColorAll = function addColorAll(folder) {
    var initialColor;
    if (this.obj.length > 0) {
        initialColor = '#'.concat(this.obj[0].children[0].material.color.getHexString());
        folder.addColor({ color: initialColor }, 'color').name('Color').onChange((value) => {
            for (var i = 0; i < this.obj.length; i++) {
                for (var j = 0; j < this.obj[i].children.length; j++) {
                    this._changeColor(value, i, j);
                }
            }
            this._changeColor(value, -10, 0);
            this._changeColor(value, -10, 1);
        });
    } else if (this.bdTopo) {
        initialColor = this.bdTopoStyle.wall_faces.color;
        folder.addColor({ color: initialColor }, 'color').name('Color').onChange((value) => {
            this._changeColor(value, -10, 0);
            this._changeColor(value, -10, 1);
        });
    }
};

Symbolizer.prototype._addColorEdgeAll = function addColorEdgeAll(folder) {
    var initialColor;
    if (this.edges.length > 0) {
        initialColor = '#'.concat(this.edges[0].children[0].material.color.getHexString());
        folder.addColor({ color: initialColor }, 'color').name('Edge color').onChange((value) => {
            for (var i = 0; i < this.edges.length; i++) {
                for (var j = 0; j < this.edges[i].children.length; j++) {
                    this._changeColorEdge(value, i, j);
                }
            }
            this._changeColorEdge(value, -10, 0);
            this._changeColorEdge(value, -10, 1);
        });
    } else if (this.bdTopo) {
        initialColor = this.bdTopoStyle.edges.color;
        folder.addColor({ color: initialColor }, 'color').name('Edge color').onChange((value) => {
            this._changeColorEdge(value, -10, 0);
            this._changeColorEdge(value, -10, 1);
        });
    }
};

Symbolizer.prototype._addEmissiveAll = function addEmissiveAll(folder) {
    var initialEmissive;
    if (this.obj.length > 0) {
        initialEmissive = '#'.concat(this.obj[0].children[0].material.emissive.getHexString());
        folder.addColor({ emissive: initialEmissive }, 'emissive').name('Emissive').onChange((value) => {
            for (var i = 0; i < this.obj.length; i++) {
                for (var j = 0; j < this.obj[i].children.length; j++) {
                    this._changeEmissive(value, i, j);
                }
            }
            this._changeEmissive(value, -10, 0);
            this._changeEmissive(value, -10, 1);
        });
    } else if (this.bdTopo) {
        initialEmissive = this.bdTopoStyle.wall_faces.emissive;
        folder.addColor({ emissive: initialEmissive }, 'emissive').name('Emissive').onChange((value) => {
            this._changeEmissive(value, -10, 0);
            this._changeEmissive(value, -10, 1);
        });
    }
};


Symbolizer.prototype._addSpecularAll = function addSpecularAll(folder) {
    var initialSpecular;
    if (this.obj.length > 0) {
        initialSpecular = '#'.concat(this.obj[0].children[0].material.specular.getHexString());
        folder.addColor({ specular: initialSpecular }, 'specular').name('Specular').onChange((value) => {
            for (var i = 0; i < this.obj.length; i++) {
                for (var j = 0; j < this.obj[i].children.length; j++) {
                    this._changeSpecular(value, i, j);
                }
            }
            this._changeSpecular(value, -10, 0);
            this._changeSpecular(value, -10, 1);
        });
    } else if (this.bdTopo) {
        initialSpecular = this.bdTopoStyle.wall_faces.specular;
        folder.addColor({ specular: initialSpecular }, 'specular').name('Specular').onChange((value) => {
            this._changeSpecular(value, -10, 0);
            this._changeSpecular(value, -10, 1);
        });
    }
};

Symbolizer.prototype._addShininessAll = function addShininessAll(folder) {
    var initialShininess;
    if (this.obj.length > 0) {
        initialShininess = this.obj[0].children[0].material.shininess;
        folder.add({ shininess: initialShininess }, 'shininess', 0, 100).name('Shininess').onChange((value) => {
            for (var i = 0; i < this.obj.length; i++) {
                for (var j = 0; j < this.obj[i].children.length; j++) {
                    this._changeShininess(value, i, j);
                }
            }
            this._changeShininess(value, -10, 0);
            this._changeShininess(value, -10, 1);
        });
    } else if (this.bdTopo) {
        initialShininess = this.bdTopoStyle.wall_faces.shininess;
        folder.add({ shininess: initialShininess }, 'shininess', 0, 100).name('Shininess').onChange((value) => {
            this._changeShininess(value, -10, 0);
            this._changeShininess(value, -10, 1);
        });
    }
};

Symbolizer.prototype._addWidthEdgeAll = function addWidthEdgeAll(folder) {
    var initialWidth;
    if (this.edges.length > 0) {
        initialWidth = this.edges[0].children[0].material.linewidth;
        folder.add({ width: initialWidth }, 'width', 0, 5).name('Edge width').onChange((value) => {
            for (var i = 0; i < this.edges.length; i++) {
                for (var j = 0; j < this.edges[i].children.length; j++) {
                    this._changeWidthEdge(value, i, j);
                }
            }
            this._changeWidthEdge(value, -10, 0);
            this._changeWidthEdge(value, -10, 1);
        });
    } else if (this.bdTopo) {
        initialWidth = this.bdTopoStyle.edges.width;
        folder.add({ width: initialWidth }, 'width', 0, 5).name('Edge width').onChange((value) => {
            this._changeWidthEdge(value, -10, 0);
            this._changeWidthEdge(value, -10, 1);
        });
    }
};

Symbolizer.prototype._addStyleEdgeAll = function addStyleEdgeAll(folder) {
    folder.add({ style: 'Continuous' }, 'style', ['Continous', 'Dashed', 'Sketchy']).name('Edge style').onChange((value) => {
        this._changeStyleEdge(value, folder);
    });
};

Symbolizer.prototype._addTextureAll = function addTextureAll(folder) {
    Fetcher.json('./textures/listeTexture.json').then((listTextures) => {
        if (listTextures) {
            listTextures[''] = '';
            folder.add({ texture: '' }, 'texture', listTextures).onChange((value) => {
                for (var i = 0; i < this.obj.length; i++) {
                    this._changeTextureAll('./textures/'.concat(value), i, folder);
                }
                this._changeTextureAll('./textures/'.concat(value), -10, folder);
                this._changeTextureAll('./textures/'.concat(value), -20, folder);
            }).name('Texture');
        }
    });
};

Symbolizer.prototype._addSaveAll = function addSave(folder) {
    folder.add({ save: () => this._saveVibesAll() }, 'save').name('Save style');
    folder.add({ saveGibe: () => this._saveGibesAll() }, 'saveGibe').name('Save position');
};

Symbolizer.prototype.initGuiAll = function addToGUI() {
    // var folder = this.menu.gui.addFolder(this.obj.materialLibraries[0].substring(0, this.obj.materialLibraries[0].length - 4));
    var folder = this.menu.gui.addFolder('Symbolizer '.concat(this.nb));
    this.folder = folder;
    this._addSaveAll(folder);
    this._addLoad(folder);
    if (this.plane != null) this._addShades(folder);
    var positionFolder = folder.addFolder('Position');
    this._addResetPosition(positionFolder);
    this._addRotationsAll(positionFolder);
    this._addScaleAll(positionFolder);
    this._addMoveobjcoordAll(positionFolder);
    this._addPositionAll(positionFolder);
    var edgesFolder = folder.addFolder('Edges');
    this._addColorEdgeAll(edgesFolder);
    this._addOpacityEdgeAll(edgesFolder);
    this._addWidthEdgeAll(edgesFolder);
    this._addStyleEdgeAll(edgesFolder);
    var facesFolder = folder.addFolder('Faces');
    this._addTextureAll(facesFolder);
    this._addOpacityAll(facesFolder);
    this._addColorAll(facesFolder);
    this._addEmissiveAll(facesFolder);
    this._addSpecularAll(facesFolder);
    this._addShininessAll(facesFolder);
    if (this.light != null) {
        var lightFolder = folder.addFolder('Light');
        this._addColorLight(lightFolder);
        this._addMoveLight(lightFolder);
    }
};

Symbolizer.prototype._addColorLight = function addColorLight(folder) {
    folder.addColor({ color: 0xffffff }, 'color').name('Color').onChange((value) => {
        this.light.color = new THREE.Color(value);
        this.view.notifyChange(true);
    });
};

Symbolizer.prototype._addShades = function addShades(folder) {
    folder.add({ shades: this.plane.visible }, 'shades').name('Display shades').onChange((checked) => {
        this.plane.visible = checked;
        this.view.notifyChange(true);
    });
};

Symbolizer.prototype._checkStructure = function checkStructure() {
    var i;
    if (this.bdTopo && this.obj.length > 0 && this.obj[0].children.length != 2) return false;
    // We check if the objects have the same number of children
    for (i = 0; i < this.obj.length; i++) {
        if (this.obj[i].children.length != this.obj[0].children.length) {
            // If one object has a different number of children, the function returns false
            return false;
        }
    }
    return true;
};


function getRandomColor() {
    var letters = '0123456789ABCDEF';
    var color = '#';
    for (var i = 0; i < 6; i++) {
        color += letters[Math.floor(Math.random() * 16)];
    }
    return color;
}

function loadFileException(message) {
    this.message = message;
    this.name = 'loadFileException';
}

/*
function getSourceSynch(url) {
    var req = new XMLHttpRequest();
    req.open('GET', url, false);
    req.send();
    return req.responseText;
}
*/

function createQuad(pt1, pt2) {
    // Définition propre a chaque géométrie
    var geometry = new THREE.BufferGeometry();
    // les 6 points
    var vertices = new Float32Array([
        pt1.x, pt1.y, pt1.z, // -1
        pt2.x, pt2.y, pt2.z, // -1
        pt2.x, pt2.y, pt2.z, //  1
        pt2.x, pt2.y, pt2.z, //  1
        pt1.x, pt1.y, pt1.z, //  1
        pt1.x, pt1.y, pt1.z]);
    // pour chacun des six points, le point opposé correspondant
    var vertices2 = new Float32Array([
        pt2.x, pt2.y, pt2.z,
        pt1.x, pt1.y, pt1.z,
        pt1.x, pt1.y, pt1.z,
        pt1.x, pt1.y, pt1.z,
        pt2.x, pt2.y, pt2.z,
        pt2.x, pt2.y, pt2.z]);
    geometry.addAttribute('position', new THREE.BufferAttribute(vertices, 3));
    geometry.addAttribute('position2', new THREE.BufferAttribute(vertices2, 3));
    var uv = new Float32Array([
        -1, -1,
        1, -1,
        1, 1,

        1, 1,
        -1, 1,
        -1, -1]);
    geometry.addAttribute('uv', new THREE.BufferAttribute(uv, 2));
    return geometry;
}

export default Symbolizer;
