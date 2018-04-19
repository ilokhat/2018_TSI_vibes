/* eslint no-eval: 0 */

/**
 * Generated On: april 2018
 * Class: Feature2MeshStyle
 * Description: Tool to apply 3D stylization on a mesh
 * project VIBES
 * author: Adouni, Bouchaour, Grégoire, Mathelier, Nino, Ouhabi, Schlegel
 */


import * as THREE from 'three';
// import savery from 'savery';
import MTLLoader from 'three-mtl-loader';
import Fetcher from '../Core/Scheduler/Providers/Fetcher';
// import { patchMaterialForLogDepthSupport } from '../Core/Scheduler/Providers/3dTiles_Provider';

var saveData;

// Classe Symbolizer
/**
 * @constructor
 * @param {GlobeView} view GlobeView where the element are
 * @param {THREE.Group[]} obj list of faces
 * @param {THREE.Group[]} edges list of edges (same order than obj)
 * @param {GuiTools} menu menu use for the simbolization
 * @param {number} nb symbolizer id number
 * @param {THREE.PointLight} light light for the scene
 * @param {THREE.Mesh} plane plan for the shadow
 * @param {function} saveDataInit function to initialise the save function
 * @param {ModelLoader} [bdTopo] the loader we
 */
function Symbolizer(view, obj, edges, menu, nb, light, plane, saveDataInit, bdTopo) {
    // Constructor
    this.obj = obj;
    this.edges = edges;
    this.bdTopo = bdTopo;
    this.view = view;
    this.menu = menu;
    this.menu.view = this.view;
    this.nb = nb;
    this.light = light;
    this.plane = plane;
    this.quads = this.view.scene.getObjectByName('quads');
    if (bdTopo) this.bdTopoStyle = bdTopo.bdTopoStyle;
    this.folder = null;
    saveData = saveDataInit();
}

// ******************** SAVING AND LOADING FUNCTIONALITIES ********************

/**
 * Apply one style to the object
 * @param {Object} style style to apply (format .vibes)
 * @param {Dat.gui.Folder} [folder] folder of the symbolyzer
 */
Symbolizer.prototype.applyStyle = function applyStyle(style, folder = null) {
    var i;
    var j;
    var k;
    var h;
    var l;
    /* for part style */
    if (!('edges' in style) && !('faces' in style) && style.type == 'MeshPhongMaterial') {
        for (l in folder.__folders.Faces.__folders) {
            if (Object.prototype.hasOwnProperty.call(folder.__folders.Faces.__folders, l)) {
                if (l == style.name) {
                    folder.__folders.Faces.__folders[l].__controllers[2].setValue(style.opacity);
                    folder.__folders.Faces.__folders[l].__controllers[3].setValue(rgb2hex(style.color.r * 255, style.color.g * 255, style.color.b * 255));
                    folder.__folders.Faces.__folders[l].__controllers[4].setValue(rgb2hex(style.emissive.r * 255, style.emissive.g * 255, style.emissive.b * 255));
                    folder.__folders.Faces.__folders[l].__controllers[5].setValue(rgb2hex(style.specular.r * 255, style.specular.g * 255, style.specular.b * 255));
                    folder.__folders.Faces.__folders[l].__controllers[6].setValue(style.shininess);
                }
            }
        }
    }
    else if (style.faces[0].name) {
        // Update GUI
        var count = 0;
        folder.__folders.Edges.__controllers[0].setValue(style.edges.color);
        folder.__folders.Edges.__controllers[1].setValue(style.edges.opacity);
        folder.__folders.Edges.__controllers[2].setValue(style.edges.width);
        folder.__folders.Edges.__controllers[3].setValue(style.edges.style);
        this._addStyleEdgeParams(style.edges.style, folder.__folders.Edges);
        for (k in folder.__folders.Faces.__folders) {
            if (Object.prototype.hasOwnProperty.call(folder.__folders.Faces.__folders, k)) {
                folder.__folders.Faces.__folders[k].__controllers[2].setValue(style.faces[count].opacity);
                folder.__folders.Faces.__folders[k].__controllers[3].setValue(style.faces[count].color);
                folder.__folders.Faces.__folders[k].__controllers[4].setValue(style.faces[count].emissive);
                folder.__folders.Faces.__folders[k].__controllers[5].setValue(style.faces[count].specular);
                folder.__folders.Faces.__folders[k].__controllers[6].setValue(style.faces[count].shininess);
                /* TODO: uptate for the Texture */
                /*
                if (style.faces[count].texture != null) {
                    this._addTextureRepetition(count, folder.__folders.Faces.__folders[k]);
                    folder.__folders.Faces.__folders[k].__controllers[8].setValue(style.faces[count].textureRepeat);
                }
                */
            }
            count++;
        }
        // Apply given style to each child
        this._changeOpacityEdge(style.edges.opacity);
        this._changeColorEdge(style.edges.color);
        this._changeWidthEdge(style.edges.width);
        this._changeStyleEdge(style.edges.style, folder.__folders.Edges);
        if (this.edges.length > 0) {
            // Edges
            // Speficic sketchy parameters
            if (style.edges.style === 'Sketchy') {
                this._createSketchyMaterial(style.edges.stroke, style.edges.color, style.edges.sketchyWidth, style.edges.threshold);
            }
            // Specific dashed parameters
            if (style.edges.style === 'Dashed') {
                this._changeDashSize(style.edges.dashSize);
                this._changeGapSize(style.edges.gapSize);
            }
            // Faces
            for (j = 0; j < this.obj[0].children.length; j++) {
                var name = this.obj[0].children[j].name;
                h = 0;
                while (h < style.faces.length && style.faces[h].name != name) {
                    h++;
                }
                if (h < style.faces.length) {
                    for (i = 0; i < this.obj.length; i++) {
                        this._changeOpacity(style.faces[h].opacity, i, j);
                        this._changeColor(style.faces[h].color, i, j);
                        this._changeEmissive(style.faces[h].emissive, i, j);
                        this._changeSpecular(style.faces[h].specular, i, j);
                        this._changeShininess(style.faces[h].shininess, i, j);
                    }
                    if (style.faces[h].texture != null) {
                        this._changeTexture(style.faces[h].texture, j, folder.__folders.Faces.__folders[style.faces[h].name]);
                        this._changeTextureRepetition(style.faces.textureRepeat, j);
                    }
                    // If the loaded style has no texture, we apply the function with en empty path to remove the existing texture
                    else {
                        this._changeTexture('./textures/', j, folder.__folders.Faces.__folders[style.faces[h].name]);
                    }
                }
            }
        }
        if (this.bdTopo) {
            h = 0;
            while (h < style.faces.length) {
                // BDTopo Faces
                if (style.faces[h].name == 'wall_faces') {
                    this._changeOpacity(style.faces[h].opacity, -10, 0);
                    this._changeColor(style.faces[h].color, -10, 0);
                    this._changeEmissive(style.faces[h].emissive, -10, 0);
                    this._changeSpecular(style.faces[h].specular, -10, 0);
                    this._changeShininess(style.faces[h].shininess, -10, 0);
                    // TODO: add uv on BDTopo
                    // if (style.faces[h].texture != null) this._changeTexture(style.faces[h].texture, 0, folder.__folders.Faces.__folders[style.faces[h].name]);
                } else if (style.faces[h].name == 'roof_faces') {
                    this._changeOpacity(style.faces[h].opacity, -10, 1);
                    this._changeColor(style.faces[h].color, -10, 1);
                    this._changeEmissive(style.faces[h].emissive, -10, 1);
                    this._changeSpecular(style.faces[h].specular, -10, 1);
                    this._changeShininess(style.faces[h].shininess, -10, 1);
                    // TODO: add uv on BDTopo
                    // if (style.faces[h].texture != null) this._changeTexture(style.faces[h].texture, 1, folder.__folders.Faces.__folders[style.faces[h].name]);
                }
                h++;
            }
        }
    }
    /* for the global style */
    else if (style.faces.length == 1) {
        // Update GUI
        folder.__folders.Edges.__controllers[0].setValue(style.edges.color);
        folder.__folders.Edges.__controllers[1].setValue(style.edges.opacity);
        folder.__folders.Edges.__controllers[2].setValue(style.edges.width);
        folder.__folders.Edges.__controllers[3].setValue(style.edges.style);
        this._addStyleEdgeParams(style.edges.style, folder.__folders.Edges);
        folder.__folders.Faces.__controllers[0].setValue(style.faces[0].opacity);
        folder.__folders.Faces.__controllers[1].setValue(style.faces[0].color);
        folder.__folders.Faces.__controllers[2].setValue(style.faces[0].emissive);
        folder.__folders.Faces.__controllers[3].setValue(style.faces[0].specular);
        folder.__folders.Faces.__controllers[4].setValue(style.faces[0].shininess);
        /* TODO: uptate for the Texture */
        /*
        if (style.faces[0].texture != null) {
            this._addTextureRepetitionAll(folder.__folders.Faces);
            folder.__folders.Faces.__controllers[6].setValue(style.faces[0].textureRepeat);
        }
        */
        this._changeOpacityEdge(style.edges.opacity);
        this._changeColorEdge(style.edges.color);
        this._changeWidthEdge(style.edges.width);
        this._changeStyleEdge(style.edges.style, folder.__folders.Edges);
        // Specific dashed parameters
        if (style.edges.style === 'Dashed') {
            this._changeGapSize(style.edges.gapSize);
            this._changeDashSize(style.edges.dashSize);
        }
        // Apply given style to all children
        if (this.edges.length > 0) {
            // Edges
            // Speficic sketchy parameters
            if (style.edges.style === 'Sketchy') {
                this._createSketchyMaterial(style.edges.stroke, style.edges.color, style.edges.sketchyWidth, style.edges.threshold);
            }
            // Faces
            for (i = 0; i < this.obj.length; i++) {
                for (j = 0; j < this.obj[i].children.length; j++) {
                    this._changeOpacity(style.faces[0].opacity, i, j);
                    this._changeColor(style.faces[0].color, i, j);
                    this._changeEmissive(style.faces[0].emissive, i, j);
                    this._changeSpecular(style.faces[0].specular, i, j);
                    this._changeShininess(style.faces[0].shininess, i, j);
                }
            }
            if (style.faces[0].texture != null) {
                this._changeTextureAll(style.faces[0].texture, folder.__folders.Faces);
                this._changeTextureRepetition(style.faces[0].textureRepeat, -1);
            }
            // If the loaded style has no texture, we apply the function with en empty path to remove the existing texture
            else {
                this._changeTextureAll('./textures/', folder.__folders.Faces);
            }
        }
        if (this.bdTopo) {
            // BDTopo Faces
            this._changeOpacity(style.faces[0].opacity, -10, 0);
            this._changeColor(style.faces[0].color, -10, 0);
            this._changeEmissive(style.faces[0].emissive, -10, 0);
            this._changeSpecular(style.faces[0].specular, -10, 0);
            this._changeShininess(style.faces[0].shininess, -10, 0);
            // TODO: add uv on BDTopo
            // if (style.faces[0].texture != null) this._changeTexture(style.faces[0].texture, 0, folder.__folders.Faces);
            this._changeOpacity(style.faces[0].opacity, -10, 1);
            this._changeColor(style.faces[0].color, -10, 1);
            this._changeEmissive(style.faces[0].emissive, -10, 1);
            this._changeSpecular(style.faces[0].specular, -10, 1);
            this._changeShininess(style.faces[0].shininess, -10, 1);
            // TODO: add uv on BDTopo
            // if (style.faces[0].texture != null) this._changeTexture(style.faces[0].texture, 1, folder.__folders.Faces);
        }
    }
};

/**
 * Apply a style on a particular part
 * @param {Object} style style to apply (type .vibe)
 * @param {Dat.gui.Folder} folder folder of the symbolyzer for the part 'j'
 * @param {number} j part position
 */
Symbolizer.prototype.applyStylePart = function applyStylePart(style, folder, j) {
    // update controllers
    folder.__controllers[2].setValue(style.faces[0].opacity);
    folder.__controllers[3].setValue(style.faces[0].color);
    folder.__controllers[4].setValue(style.faces[0].emissive);
    folder.__controllers[5].setValue(style.faces[0].specular);
    folder.__controllers[6].setValue(style.faces[0].shininess);
    // apply style
    if (this.obj.length > 0) {
        for (var i = 0; i < this.obj.length; i++) {
            this._changeOpacity(style.faces[0].opacity, i, j);
            this._changeColor(style.faces[0].color, i, j);
            this._changeEmissive(style.faces[0].emissive, i, j);
            this._changeSpecular(style.faces[0].specular, i, j);
            this._changeShininess(style.faces[0].shininess, i, j);
        }
        if (style.faces[0].texture != './textures/') {
            this._changeTexture(style.faces[0].texture, j, folder);
            this._changeTextureRepetition(style.faces[0].textureRepeat, j);
        }
        // If the loaded style has no texture, we apply the function with en empty path to remove the existing texture
        else {
            this._changeTexture('./textures/', j, folder);
        }
    }
    if (this.bdTopo) {
        // BDTopo Faces
        this._changeOpacity(style.faces[0].opacity, -10, j);
        this._changeColor(style.faces[0].color, -10, j);
        this._changeEmissive(style.faces[0].emissive, -10, j);
        this._changeSpecular(style.faces[0].specular, -10, j);
        this._changeShininess(style.faces[0].shininess, -10, j);
        // TODO: add uv on BDTopo
        // if (style.faces[0].texture != null) this._changeTexture(style.faces[0].texture, j, folder);
    }
};

/**
 * reader for the '.vibes'
 * @param {File} file
 * @param {Dat.gui.Folder} folder folder of the symbolyzer
 * @param {number} [j] optional part number to apply the style file
 * @returns {number} return 0 is the the read no fail
 */
Symbolizer.prototype._readVibes = function readVibes(file, folder, j = -100) {
    var reader = new FileReader();
    if (file.name.endsWith('.vibes')) {
        if (j == -100) {
            // apply for all object
            reader.addEventListener('load', () => this.applyStyle(JSON.parse(reader.result), folder), false);
        } else {
            // apply to one part of an object
            reader.addEventListener('load', () => this.applyStylePart(JSON.parse(reader.result), folder, j), false);
        }
        reader.readAsText(file);
        return 0;
    } else {
        throw new loadFileException('Unvalid format');
    }
};

/**
 * save the style apply for each part
 */
Symbolizer.prototype._saveVibes = function saveVibes() {
    // Initiate stylesheet with edge style and an empty list for face style
    var vibes;
    var name;
    if (this.obj.length > 0) {
        name = this.obj[0].name.split('_')[0];
        vibes = {
            edges: {
                opacity: this.edges[0].children[0].material.opacity,
                color: '#'.concat(this.edges[0].children[0].material.color.getHexString()),
                width: this.edges[0].children[0].material.linewidth,
            },
            faces: [],
        };
        // Save edge style
        if (this.edges[0].children[0].material.visible) {
            if (this.edges[0].children[0].material.isLineDashedMaterial) {
                // Dashed
                vibes.edges.style = 'Dashed';
                vibes.edges.dashSize = this.edges[0].children[0].material.dashSize;
                vibes.edges.gapSize = this.edges[0].children[0].material.gapSize;
            }
            else {
                // Continuous
                vibes.edges.style = 'Continuous';
            }
        }
        else {
            // Sketchy
            vibes.edges.style = 'Sketchy';
            vibes.edges.color = this.quads.children[0].children[0].material.uniforms.color.value;
            vibes.edges.threshold = this.quads.children[0].children[0].material.uniforms.texthreshold.value;
            vibes.edges.sketchyWidth = this.quads.children[0].children[0].material.uniforms.thickness.value;
            var edgeTexturePath = this.quads.children[0].children[0].material.uniforms.texture2.value.image.src.split('/');
            vibes.edges.stroke = edgeTexturePath[edgeTexturePath.length - 1].split('.')[0];
        }
        // Iteration over the children of each object (they all have the same children)
        for (var i = 0; i < this.obj[0].children.length; i++) {
            // Initialize texture path
            var texturePath = null;
            var textureRepetition = null;
            // Checks if the mesh has a texture
            if (this.obj[0].children[i].material.map != null) {
                // Get texture path
                var texturePathTab = this.obj[0].children[i].material.map.image.src.split('/');
                var j = 0;
                while (j < texturePathTab.length && texturePathTab[j] != 'textures') j++;
                texturePath = '.';
                while (j < texturePathTab.length) {
                    texturePath = texturePath.concat('/', texturePathTab[j]);
                    j++;
                }
                // Get texture repetition
                textureRepetition = this.obj[0].children[i].material.map.repeat.x;
            }
            // Push each face style in the list
            vibes.faces.push({
                name: this.obj[0].children[i].name,
                opacity: this.obj[0].children[i].material.opacity,
                color: '#'.concat(this.obj[0].children[i].material.color.getHexString()),
                emissive: '#'.concat(this.obj[0].children[i].material.emissive.getHexString()),
                specular: '#'.concat(this.obj[0].children[i].material.specular.getHexString()),
                shininess: this.obj[0].children[i].material.shininess,
                texture: texturePath,
                textureRepeat: textureRepetition,
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
                style: this.bdTopoStyle.edges.style,
                gapSize: this.bdTopoStyle.edges.gapSize,
                dashSize: this.bdTopoStyle.edges.dashSize,
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
    // var blob = new Blob([JSON.stringify(vibes)], { type: 'text/plain;charset=utf-8' });
    saveData(vibes, name.concat('_partie.vibes'));
};

/**
 * save the style apply overall
 * @param {number} [target=0] part position for the reference style
 */
Symbolizer.prototype._saveVibesAll = function saveVibesAll(target = 0) {
    var vibes;
    var name;
    if (this.obj.length > 0) {
        name = this.obj[0].name.split('_')[0];
        vibes = {
            edges: {
                opacity: this.edges[0].children[0].material.opacity,
                color: '#'.concat(this.edges[0].children[0].material.color.getHexString()),
                width: this.edges[0].children[0].material.linewidth,
            },
            faces: [] };
        // Save edge style
        if (this.edges[0].children[0].material.visible) {
            if (this.edges[0].children[0].material.isLineDashedMaterial) {
                // Dashed
                vibes.edges.style = 'Dashed';
                vibes.edges.dashSize = this.edges[0].children[0].material.dashSize;
                vibes.edges.gapSize = this.edges[0].children[0].material.gapSize;
            }
            else {
                // Continuous
                vibes.edges.style = 'Continuous';
            }
        }
        else {
            // Sketchy
            vibes.edges.style = 'Sketchy';
            vibes.edges.threshold = this.quads.children[0].children[0].material.uniforms.texthreshold.value;
            vibes.edges.sketchyWidth = this.quads.children[0].children[0].material.uniforms.thickness.value;
            var edgeTexturePath = this.quads.children[0].children[0].material.uniforms.texture2.value.image.src.split('/');
            vibes.edges.stroke = edgeTexturePath[edgeTexturePath.length - 1].split('.')[0];
        }
        var texturePath = null;
        var textureRepetition = null;
        // Checks if the mesh has a texture
        if (this.obj[0].children[target].material.map != null) {
            // Get texture path
            var texturePathTab = this.obj[0].children[target].material.map.image.src.split('/');
            var j = 0;
            while (j < texturePathTab.length && texturePathTab[j] != 'textures') j++;
            texturePath = '.';
            while (j < texturePathTab.length) {
                texturePath = texturePath.concat('/', texturePathTab[j]);
                j++;
            }
            // Get texture repetition
            textureRepetition = this.obj[0].children[target].material.map.repeat.x;
        }
        vibes.faces.push({
            opacity: this.obj[0].children[target].material.opacity,
            color: '#'.concat(this.obj[0].children[target].material.color.getHexString()),
            emissive: '#'.concat(this.obj[0].children[target].material.emissive.getHexString()),
            specular: '#'.concat(this.obj[0].children[target].material.specular.getHexString()),
            shininess: this.obj[0].children[target].material.shininess,
            texture: texturePath,
            textureRepeat: textureRepetition,
        });
    } else if (this.bdTopo) {
        name = 'bdTopo';
        var nameEl = target == 0 ? 'wall_faces' : 'roof_faces';
        vibes = {
            edges: {
                opacity: this.bdTopoStyle.edges.opacity,
                color: this.bdTopoStyle.edges.color,
                width: this.bdTopoStyle.edges.width,
                style: this.bdTopoStyle.edges.style,
                gapSize: this.bdTopoStyle.edges.gapSize,
                dashSize: this.bdTopoStyle.edges.dashSize,
            },
            faces: [
                {
                    opacity: this.bdTopoStyle[nameEl].opacity,
                    color: this.bdTopoStyle[nameEl].color,
                    emissive: this.bdTopoStyle[nameEl].emissive,
                    specular: this.bdTopoStyle[nameEl].specular,
                    shininess: this.bdTopoStyle[nameEl].shininess,
                    texture: this.bdTopoStyle[nameEl].texture,
                },
            ],
        };
    }
    saveData(vibes, name.concat('_globale.vibes'));
};

/**
 * Add the save button for each part'.vibes' and '.gibes'
 * @param {Dat.gui.Folder} folder folder of the symbolyzer
 */
Symbolizer.prototype._addSave = function addSave(folder) {
    folder.add({ save: () => this._saveVibes() }, 'save').name('Save style');
};
/**
 * Add the load button for the '.vibes'
 * @param {Dat.gui.Folder} folder folder of the symbolyzer
 */
Symbolizer.prototype._addLoad = function addLoad(folder) {
    folder.add({ load: () => {
        var button = document.createElement('input');
        button.setAttribute('type', 'file');
        button.addEventListener('change', () => this._readVibes(button.files[0], folder), false);
        button.click();
    } }, 'load').name('Load style');
};

/**
 * Add the 'Load MTL' button
 * @param {Dat.gui.Folder} folder folder of the symbolyzer
 */
Symbolizer.prototype._addLoadMTL = function addLoadMTL(folder) {
    // Create 'Load MTL' button
    folder.add({ symbolizer: () => {
        var button = document.createElement('input');
        button.setAttribute('type', 'file');
        button.addEventListener('change', () => {
            var mtlLoader = new MTLLoader();
            mtlLoader.load('models/'.concat(button.files[0].name.split('.')[0]).concat('/').concat(button.files[0].name), (materials) => {
                materials.preload();
               // this.loader.laodObj3d.setMaterials(materials);
                this.obj.forEach((layer) => {
                    if (layer.name.split('_')[0] == button.files[0].name.split('.')[0]) {
                        layer.children.forEach((child) => {
                            if (materials.materials[child.name] != undefined) {
                                child.material = materials.materials[child.name];
                                this.applyStyle(child.material, folder);
                            }
                        });
                        this.view.notifyChange(true);
                    }
                });
            });
        }, false);
        button.click();
    },
    }, 'symbolizer').name('Load MTL file');
};

/**
 * Add the save button for the '.gibes' and  the global style '.vibes'
 * @param {Dat.gui.Folder} folder folder of the symbolyzer
 */
Symbolizer.prototype._addSaveAll = function addSave(folder) {
    folder.add({ save: () => this._saveVibesAll() }, 'save').name('Save style');
    folder.add({ saveGibe: () => this._saveGibesAll() }, 'saveGibe').name('Save position');
};

/**
 * Add the save and load '.vibes' button for one part style
 * @param {Dat.gui.Folder} folder folder of the symbolyzer
 * @param {number} j part position
 */
Symbolizer.prototype._addSaveLoadPart = function addSaveLoadPart(folder, j) {
    folder.add({ save: () => this._saveVibesAll(j) }, 'save').name('Save part style');
    folder.add({ load: () => {
        var button = document.createElement('input');
        button.setAttribute('type', 'file');
        button.addEventListener('change', () => this._readVibes(button.files[0], folder, j), false);
        button.click();
    } }, 'load').name('Load part style');
};

// ******************** EDGE STYLIZATION ********************

// *** EDGE OPACITY ***

/**
 * change the edges opacity
 * @param {number} value opacity value
 */
Symbolizer.prototype._changeOpacityEdge = function changeOpacityEdge(value) {
    // Update edge opacity with selected value
    for (var i = 0; i < this.edges.length; i++) {
        for (var j = 0; j < this.edges[i].children.length; j++) {
            this.edges[i].children[j].material.opacity = value;
            this.edges[i].children[j].material.needsUpdate = true;
        }
    }
    this.view.notifyChange(true);
    if (this.bdTopo) {
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
        this.bdTopo.ForBuildings(f);
    }
};

/**
 * add the edges opacity menu controller
 * @param {Dat.gui.Folder} folder folder of the symbolyzer
 */
Symbolizer.prototype._addOpacityEdgeAll = function addOpacityEdgeAll(folder) {
    var initialOpacity;
    if (this.edges.length > 0) {
        initialOpacity = this.edges[0].children[0].material.opacity;
    } else if (this.bdTopo) {
        initialOpacity = this.bdTopoStyle.edges.opacity;
    }
    folder.add({ opacity: initialOpacity }, 'opacity', 0, 1).name('Edge opacity').onChange((value) => {
        this._changeOpacityEdge(value);
    });
};

// *** EDGE COLOR ***

/**
 * change the edges color
 * @param {HexColor} value color value
 */
Symbolizer.prototype._changeColorEdge = function changeColorEdge(value) {
    // Update edge color with selected value
    for (var i = 0; i < this.edges.length; i++) {
        for (var j = 0; j < this.edges[i].children.length; j++) {
            this.edges[i].children[j].material.color = new THREE.Color(value);
            this.edges[i].children[j].material.needsUpdate = true;
        }
    }
    this.view.notifyChange(true);
    if (this.bdTopo) {
        var f = (parent) => {
            for (var i = 0; i < parent.children.length; i++) {
                if (parent.children[i].name == 'wall_edges' || parent.children[i].name == 'roof_edges') {
                    parent.children[i].material.color = new THREE.Color(value);
                    parent.children[i].material.needsUpdate = true;
                }
            }
        };
        this.bdTopoStyle.edges.color = value;
        this.bdTopo.ForBuildings(f);
    }
};
/**
 * add the edges color menu controller
 * @param {Dat.gui.Folder} folder folder of the symbolyzer
 */
Symbolizer.prototype._addColorEdgeAll = function addColorEdgeAll(folder) {
    var initialColor;
    if (this.edges.length > 0) {
        initialColor = '#'.concat(this.edges[0].children[0].material.color.getHexString());
    } else if (this.bdTopo) {
        initialColor = this.bdTopoStyle.edges.color;
    }
    folder.addColor({ color: initialColor }, 'color').name('Edge color').onChange((value) => {
        this._changeColorEdge(value);
    });
};

// *** EDGE WIDTH ***

/**
 * change the edges width
 * @param {number} value width value
 */
Symbolizer.prototype._changeWidthEdge = function changeWidthEdge(value) {
    // Update edge width with selected value
    for (var i = 0; i < this.edges.length; i++) {
        for (var j = 0; j < this.edges[i].children.length; j++) {
            this.edges[i].children[j].material.linewidth = value;
            this.edges[i].children[j].material.needsUpdate = true;
        }
    }
    this.view.notifyChange(true);
    if (this.bdTopo) {
        var f2 = (parent) => {
            for (var j = 0; j < parent.children.length; j++) {
                if (parent.children[j].name == 'wall_edges' || parent.children[j].name == 'roof_edges') {
                    parent.children[j].material.linewidth = value;
                    parent.children[j].material.needsUpdate = true;
                }
            }
        };
        this.bdTopoStyle.edges.width = value;
        this.bdTopo.ForBuildings(f2);
    }
};

/**
 * add the edges width menu controller
 * @param {Dat.gui.Folder} folder folder of the symbolyzer
 */
Symbolizer.prototype._addWidthEdgeAll = function addWidthEdgeAll(folder) {
    var initialWidth;
    if (this.edges.length > 0) {
        initialWidth = this.edges[0].children[0].material.linewidth;
    }
    else if (this.bdTopo) {
        initialWidth = this.bdTopoStyle.edges.width;
    }
    folder.add({ width: initialWidth }, 'width', 0, 5).name('Edge width').onChange((value) => {
        this._changeWidthEdge(value);
    });
};

// *** EDGE STYLE (continuous, dashed, sketchy) ***

/**
 * change the edges dash size
 * @param {number} value dash size value
 */
Symbolizer.prototype._changeDashSize = function changeDashSize(value) {
    var i;
    var j;
    if (this.obj.length > 0) {
        for (i = 0; i < this.edges.length; i++) {
            for (j = 0; j < this.edges[i].children.length; j++) {
                this.edges[i].children[j].material.dashSize = value;
                this.edges[i].children[j].material.needsUpdate = true;
            }
        }
        this.view.notifyChange(true);
    }
    if (this.bdTopo) {
        var f2 = (parent) => {
            for (j = 0; j < parent.children.length; j++) {
                if (parent.children[j].name == 'wall_edges' || parent.children[j].name == 'roof_edges') {
                    parent.children[j].material.dashSize = value;
                    parent.children[j].material.needsUpdate = true;
                }
            }
        };
        this.bdTopoStyle.edges.dashSize = value;
        this.bdTopo.ForBuildings(f2);
    }
};

/**
 * change the edges dash gap size
 * @param {number} value dash gap size value
 */
Symbolizer.prototype._changeGapSize = function changeGapSize(value) {
    var i;
    var j;
    if (this.obj.length > 0) {
        for (i = 0; i < this.edges.length; i++) {
            for (j = 0; j < this.edges[i].children.length; j++) {
                this.edges[i].children[j].material.gapSize = value;
                this.edges[i].children[j].material.needsUpdate = true;
            }
        }
        this.view.notifyChange(true);
    }
    if (this.bdTopo) {
        var f2 = (parent) => {
            for (j = 0; j < parent.children.length; j++) {
                if (parent.children[j].name == 'wall_edges' || parent.children[j].name == 'roof_edges') {
                    parent.children[j].material.gapSize = value;
                    parent.children[j].material.needsUpdate = true;
                }
            }
        };
        this.bdTopoStyle.edges.gapSize = value;
        this.bdTopo.ForBuildings(f2);
    }
};

/**
 * add the edges line style menu controllers
 * @param {string} value line type ['Sketchy'|'Dashed'|'Continuous']
 * @param {Dat.gui.Folder} folder folder of the symbolyzer
 */
Symbolizer.prototype._addStyleEdgeParams = function _addStyleEdgeParams(value, folder) {
    var k;
    // Create or remove specific controllers according to the style chosen (sketchy, dashed, continuous)
    if (value === 'Sketchy') {
        // Initial GUI parameters
        var color;
        var width;
        var threshold;
        var stroke;
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
                color = this.quads.children[0].children[0].material.uniforms.color.value;
                width = this.quads.children[0].children[0].material.uniforms.thickness.value;
                var edgeTexturePath = this.quads.children[0].children[0].material.uniforms.texture2.value.image.src.split('/');
                stroke = edgeTexturePath[edgeTexturePath.length - 1].split('.')[0];
                this._createSketchyMaterial(stroke, color, width, threshold);
            });
            // Controller to change the stroke
            folder.add({ sketchyStroke: 'dashed' }, 'sketchyStroke', ['dashed', 'brush', 'irregular', 'thick', 'two', 'wavy']).name('Stroke').onChange((value) => {
                stroke = value;
                color = this.quads.children[0].children[0].material.uniforms.color.value;
                width = this.quads.children[0].children[0].material.uniforms.thickness.value;
                threshold = this.quads.children[0].children[0].material.uniforms.texthreshold.value;
                this._createSketchyMaterial(stroke, color, width, threshold);
            });
            // Adapt color controller to sketchy edge
            folder.__controllers[0].onChange((value) => {
                color = new THREE.Color(value);
                width = this.quads.children[0].children[0].material.uniforms.thickness.value;
                threshold = this.quads.children[0].children[0].material.uniforms.texthreshold.value;
                var edgeTexturePath = this.quads.children[0].children[0].material.uniforms.texture2.value.image.src.split('/');
                stroke = edgeTexturePath[edgeTexturePath.length - 1].split('.')[0];
                this._createSketchyMaterial(stroke, color, width, threshold);
                // Keeps the normal behavior with BD Topo
                if (this.bdTopo) {
                    this._changeColorEdge(color);
                }
            });
            // Adapt width controller to sketchy edge
            folder.__controllers[2].__min = 10.0;
            folder.__controllers[2].__max = 100.0;
            folder.__controllers[2].onChange((value) => {
                width = value;
                color = this.quads.children[0].children[0].material.uniforms.color.value;
                threshold = this.quads.children[0].children[0].material.uniforms.texthreshold.value;
                var edgeTexturePath = this.quads.children[0].children[0].material.uniforms.texture2.value.image.src.split('/');
                stroke = edgeTexturePath[edgeTexturePath.length - 1].split('.')[0];
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
            this._changeColorEdge(value);
        });
        folder.__controllers[2].__min = 0.0;
        folder.__controllers[2].__max = 5.0;
        folder.__controllers[2].onChange((value) => {
            this._changeWidthEdge(value);
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
                folder.add({ dashSize: 0.05 }, 'dashSize', 0.01, 1).name('Dash Size').onChange((value) => {
                    this._changeDashSize(value);
                });
                folder.add({ gapSize: 0.05 }, 'gapSize', 0.01, 1).name('Gap Size').onChange((value) => {
                    this._changeGapSize(value);
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

/**
 * change the edges line style
 * @param {string} value line type ['Sketchy'|'Dashed'|'Continuous']
 * @param {Dat.gui.Folder} folder folder of the symbolyzer
 */
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
            this.bdTopo.ForBuildings(f1);
        }
    }
    else if (value === 'Sketchy') {
        // Initialize parameters to create the material
        var width = 30.0;
        var threshold = 100.0;
        var stroke = 'dashed';
        // Hide classic edges
        for (i = 0; i < this.edges.length; i++) {
            for (j = 0; j < this.edges[i].children.length; j++) {
                this.edges[i].children[j].material.visible = false;
            }
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
            this.bdTopo.ForBuildings(f3);
        }
    }
    // Adapt the GUI
    this._addStyleEdgeParams(value, folder);
};

/**
 * create the sketchy material
 * @param {string} stroke sketchy image name
 * @param {HexColor} color edge color
 * @param {number} width ???
 * @param {number} threshold limit width between the small and normal image apply
 */
Symbolizer.prototype._createSketchyMaterial = function createSketchyMaterial(stroke, color, width, threshold) {
    // Initializations
    var texture1;
    var texture2;
    var loader = new THREE.TextureLoader();
    var path1 = './strokes/'.concat(stroke).concat('_small.png');
    var path2 = './strokes/'.concat(stroke).concat('.png');
    // If the quads are not created we create them
    if (this.quads == undefined) {
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
                choixTex = 2.0;
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
                        // patchMaterialForLogDepthSupport(material);
                        // Quad groups initialization
                        this.quads = new THREE.Group();
                        this.quads.name = 'quads';
                        // Iteration over the edges
                        for (var i = 0; i < this.edges.length; i++) {
                            // Sub-group of quads (one for each layer)
                            var quadGroup = new THREE.Group();
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
                            }
                            // Name the group after the layer
                            quadGroup.name = 'quads_'.concat(this.obj[0].name.split('_')[0]);
                            // Set group position
                            quadGroup.position.copy(this.obj[i].position);
                            quadGroup.rotation.copy(this.obj[i].rotation);
                            quadGroup.scale.copy(this.obj[i].scale);
                            quadGroup.updateMatrixWorld();
                            // Add the group to the general group
                            this.quads.add(quadGroup);
                        }

                        // Add the group of quads to the scene
                        this.view.scene.add(this.quads);
                    });
            });
    }
    // Else, we apply the material on the existing quads
    else {
        this.quads.traverse((child) => {
            child.visible = true;
        });
        this.quads.children.forEach((subGroup) => {
            subGroup.children.forEach((child) => {
                child.visible = true;
                child.material.uniforms.color.value = color;
                child.material.uniforms.thickness.value = width;
                child.material.uniforms.texthreshold.value = threshold;
                loader.load(
                    path1,
                    (t1) => {
                        texture1 = t1;
                        loader.load(
                            path2,
                            (t2) => {
                                texture2 = t2;
                                child.material.uniforms.texture1.value = texture1;
                                child.material.uniforms.texture2.value = texture2;
                            });
                    });
                child.material.needsUpdate = true;
            });
        });
    }
    this.view.notifyChange(true);
};

/**
 * add the edges line style menu controller
 * @param {Dat.gui.Folder} folder folder of the symbolyzer
 */
Symbolizer.prototype._addStyleEdgeAll = function addStyleEdgeAll(folder) {
    folder.add({ style: 'Continuous' }, 'style', ['Continous', 'Dashed', 'Sketchy']).name('Edge style').onChange((value) => {
        this._changeStyleEdge(value, folder);
    });
};

// ******************** FACE STYLIZATION ********************

// *** OPACITY ***

/**
 * change the face opacity
 * @param {number} value face opacity value
 * @param {number} i object place
 * @param {number} j sub-object place
 */
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
        this.bdTopo.ForBuildings(f);
    }
};
/**
 * add the face opacity menu controller for one part
 * @param {Dat.gui.Folder} folder folder of the symbolyzer for one part
 * @param {number} j sub-object place
 */
Symbolizer.prototype._addOpacity = function addOpacity(folder, j) {
    var initialOpacity;
    if (this.obj.length > 0 && j >= 0) {
        initialOpacity = this.obj[0].children[j].material.opacity;
        folder.add({ opacity: initialOpacity }, 'opacity', 0, 1).name('Opacity').onChange((value) => {
            // Iteration over the list of objects
            for (var i = 0; i < this.obj.length; i++) {
                this._changeOpacity(value, i, j);
            }
        });
    }
    else if (this.bdTopo && j < 0) {
        var name = j == -10 ? 'wall_faces' : 'roof_faces';
        initialOpacity = this.bdTopoStyle[name].opacity;
        folder.add({ opacity: initialOpacity }, 'opacity', 0, 1).name('Opacity').onChange((value) => {
            // Iteration over the list of objects
            this._changeOpacity(value, -10, j / -10 - 1);
        });
    }
};
/**
 * add the face opacity menu controller for overall
 * @param {Dat.gui.Folder} folder folder of the symbolyzer for all faces
 */
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

// *** COLOR (color, emissive, specular) ***

/**
 * change the face color
 * @param {HexColor} value face color value
 * @param {number} i object place
 * @param {number} j sub-object place
 */
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
        this.bdTopo.ForBuildings(f);
    }
};

/**
 * add the face color menu controller for one part
 * @param {Dat.gui.Folder} folder folder of the symbolyzer for one part
 * @param {number} j sub-object place
 */
Symbolizer.prototype._addColor = function addColor(folder, j) {
    var initialColor;
    if (this.obj.length > 0 && j >= 0) {
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

/**
 * add the face color menu controller for overall
 * @param {Dat.gui.Folder} folder folder of the symbolyzer for all faces
 */
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

/**
 * change the face emissive color
 * @param {HexColor} value face emissive color value
 * @param {number} i object place
 * @param {number} j sub-object place
 */
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
        this.bdTopo.ForBuildings(f);
    }
};

/**
 * add the face emissive color menu controller for one part
 * @param {Dat.gui.Folder} folder folder of the symbolyzer for one part
 * @param {number} j sub-object place
 */
Symbolizer.prototype._addEmissive = function addEmissive(folder, j) {
    var initialEmissive;
    if (this.obj.length > 0 && j >= 0) {
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

/**
 * add the face emissive color menu controller for overall
 * @param {Dat.gui.Folder} folder folder of the symbolyzer for all faces
 */
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

/**
 * change the face specular color
 * @param {HexColor} value face specular color value
 * @param {number} i object place
 * @param {number} j sub-object place
 */
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
        this.bdTopo.ForBuildings(f);
    }
};

/**
 * add the face specular color menu controller for one part
 * @param {Dat.gui.Folder} folder folder of the symbolyzer for one part
 * @param {number} j sub-object place
 */
Symbolizer.prototype._addSpecular = function addSpecular(folder, j) {
    var initialSpecular;
    if (this.obj.length > 0 && j >= 0) {
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

/**
 * add the face specular color menu controller for overall
 * @param {Dat.gui.Folder} folder folder of the symbolyzer for all faces
 */
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

// *** SHININESS ***

/**
 * change the face shininess
 * @param {number} value face shininess value
 * @param {number} i object place
 * @param {number} j sub-object place
 */
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
        this.bdTopo.ForBuildings(f);
    }
};

/**
 * add the face shininess menu controller for one part
 * @param {Dat.gui.Folder} folder folder of the symbolyzer for one part
 * @param {number} j sub-object place
 */
Symbolizer.prototype._addShininess = function addShininess(folder, j) {
    var initialShininess;
    if (this.obj.length > 0 && j >= 0) {
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
/**
 * add the face shininess menu controller for overall
 * @param {Dat.gui.Folder} folder folder of the symbolyzer for all faces
 */
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

// *** FACE TEXTURATION ***

/**
 * change the face texture reapeatition
 * @param {number} value face texture reapeatition value
 * @param {number} m sub-object place or -1 for all
 */
Symbolizer.prototype._changeTextureRepetition = function _changeTextureRepetition(value, m) {
    var i;
    var j;
    if (this.obj.length > 0) {
        for (i = 0; i < this.obj.length; i++) {
            if (m != -1) {
                this.obj[i].children[m].material.map.repeat.set(value, value);
                this.obj[i].children[m].material.needsUpdate = true;
            }
            else {
                for (j = 0; j < this.obj[i].children.length; j++) {
                    this.obj[i].children[j].material.map.repeat.set(value, value);
                    this.obj[i].children[j].material.needsUpdate = true;
                }
            }
        }
        this.view.notifyChange(true);
    }
    /*
    // TODO: add uv on BDTopo
    if (this.bdTopo) {
        var f2 = (parent) => {
            for (j = 0; j < parent.children.length; j++) {
                if (parent.children[j].name == 'wall_faces' || parent.children[j].name == 'roof_faces') {
                    parent.children[j].material.map.repeat.set(value, value);
                    parent.children[j].material.needsUpdate = true;
                }
            }
        };
        this.bdTopoStyle.edges.textureRepetition = value;
        this.bdTopo.ForBuildings(f2);
    }
    */
};

/**
 * add the face texture reapeatition menu controller for one part
 * @param {number} j sub-object place
 * @param {Dat.gui.Folder} folder folder of the symbolyzer for one part
 */
Symbolizer.prototype._addTextureRepetition = function addTextureRepetition(j, folder) {
    // Checks if a texture repetition controller already exists
    var isTextured = false;
    for (var k = 0; k < folder.__controllers.length; k++) {
        if (folder.__controllers[k].property == 'textureRepetition') {
            isTextured = true;
        }
    }
    // If not, a texture repetition controller is added to the GUI
    if (!isTextured) {
        folder.add({ textureRepetition: 1 }, 'textureRepetition', 0.1, 10).name('Texture Repetition').onChange((value) => {
            if (this.obj.length > 0) {
                this._changeTextureRepetition(value, j);
            }
            /*
            // TODO: add uv on BDTopo
            if (this.bdTopo) {
                this._changeTextureRepetition(value, 0);
                this._changeTextureRepetition(value, 1);
            }
            */
        });
    }
};

/**
 * change the face texture for one part
 * @param {string} chemin face texture value
 * @param {number} j sub-object place
 * @param {Dat.gui.Folder} folder folder of the symbolyzer for one part
 */
Symbolizer.prototype._changeTexture = function changeTexture(chemin, j, folder) {
    var i;
    var k;
    // Add texture
    // var name;
    if (chemin != './textures/') {
        this._addTextureRepetition(j, folder);
        // Create new texture
        var texture = new THREE.TextureLoader().load(chemin);
        texture.wrapS = THREE.RepeatWrapping;
        texture.wrapT = THREE.RepeatWrapping;
        // Save material properties
        if (this.obj.length > 0) {
            for (i = 0; i < this.obj.length; i++) {
                // Save previous values
                var meshshininess = this.obj[i].children[j].material.shininess;
                var meshspecular = this.obj[i].children[j].material.specular;
                var meshemissive = this.obj[i].children[j].material.emissive;
                var meshcolor = this.obj[i].children[j].material.color;
                var meshopacity = this.obj[i].children[j].material.opacity;
                // Create and apply new material
                this.obj[i].children[j].material = new THREE.MeshPhongMaterial({ side: THREE.DoubleSide, map: texture, color: meshcolor, emissive: meshemissive, specular: meshspecular, shininess: meshshininess, opacity: meshopacity, transparent: true });
                this.obj[i].children[j].material.needsUpdate = true;
            }
            this.view.notifyChange(true);
        }
        /*
        // TODO: add uv on BDTopo
        if (this.bdTopo) {
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
            this.bdTopo.ForBuildings(f);
        }
        */
    }
    // Remove texture
    else {
        // Remove texture repetition controller from the GUI
        for (k = 0; k < folder.__controllers.length; k++) {
            if (folder.__controllers[k].property == 'textureRepetition') {
                folder.remove(folder.__controllers[k]);
            }
        }
        // Set map attribute to null to remove the texture
        if (this.obj.length > 0) {
            for (i = 0; i < this.obj.length; i++) {
                this.obj[i].children[j].material.map = null;
                this.obj[i].children[j].material.needsUpdate = true;
            }
            this.view.notifyChange(true);
        }
        /*
        // TODO: add uv on BDTopo
        if (this.bdTopo) {
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
            this.bdTopo.ForBuildings(f2);
        }
        */
    }
};

/**
 * add the face texture repetition menu controller for overall
 * @param {Dat.gui.Folder} folder folder of the symbolyzer for all faces
 */
Symbolizer.prototype._addTextureRepetitionAll = function addTextureRepetitionAll(folder) {
    // Checks if a texture repetition controller already exists
    var isTextured = false;
    for (var k = 0; k < folder.__controllers.length; k++) {
        if (folder.__controllers[k].property == 'textureRepetition') {
            isTextured = true;
        }
    }
    // If not, a texture repetition controller is added to the GUI
    if (!isTextured) {
        folder.add({ textureRepetition: 1 }, 'textureRepetition', 0.1, 10).name('Texture Repetition').onChange((value) => {
            if (this.obj.length > 0) {
                this._changeTextureRepetition(value, -1);
            }
            /*
            // TODO: add uv on BDTopo
            if (this.bdTopo) {
                this._changeTextureRepetition(value, 0);
                this._changeTextureRepetition(value, 1);
            }
            */
        });
    }
};

/**
 * change the face texture for overall
 * @param {string} chemin face texture value
 * @param {Dat.gui.Folder} folder folder of the symbolyzer for one part
 */
Symbolizer.prototype._changeTextureAll = function changeTextureAll(chemin, folder) {
    var i;
    var j;
    var k;
    // Add texture to all faces
    if (chemin != './textures/') {
        // Checks if a texture repetition controller already exists
        this._addTextureRepetitionAll(folder);
        // Create new texture
        if (this.obj.length > 0) {
            for (i = 0; i < this.obj.length; i++) {
                for (j = 0; j < this.obj[i].children.length; j++) {
                    var texture = new THREE.TextureLoader().load(chemin);
                    texture.wrapS = THREE.RepeatWrapping;
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
            }
        }
        /*
        // TODO: add uv on BDTopo
        else if (this.bdTopo) {
            var f = (parent) => {
                for (j = 0; j < parent.children.length; j++) {
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
            this.bdTopo.ForBuildings(f);
        }
        */
    }
    // Remove texture
    else {
        // Remove texture repetition controller from the GUI
        for (k = 0; k < folder.__controllers.length; k++) {
            if (folder.__controllers[k].property == 'textureRepetition') {
                folder.remove(folder.__controllers[k]);
            }
        }
        // Set map attribute to null to remove the texture
        if (this.obj.length > 0) {
            for (i = 0; i < this.obj.length; i++) {
                for (j = 0; j < this.obj[i].children.length; j++) {
                    this.obj[i].children[j].material.map = null;
                    this.obj[i].children[j].material.needsUpdate = true;
                    this.view.notifyChange(true);
                }
            }
        }
        /*
        // TODO: add uv on BDTopo
        else if (this.bdTopo) {
            var f2 = (parent) => {
                for (j = 0; j < parent.children.length; j++) {
                    if (parent.children[j].name == 'wall_faces' || parent.children[j].name == 'roof_faces') {
                        parent.children[j].material.map = null;
                        parent.children[j].material.needsUpdate = true;
                    }
                }
            };
            this.bdTopoStyle.wall_faces.texture = chemin;
            this.bdTopoStyle.roof_faces.texture = chemin;
            this.bdTopo.ForBuildings(f2);
        }
        */
    }
};

/**
 * add the face texture menu controller for one part
 * @param {Dat.gui.Folder} folder folder of the symbolyzer for one part
 * @param {number} j sub-object place
 */
Symbolizer.prototype._addTexture = function addTexture(folder, j) {
    Fetcher.json('./textures/listeTexture.json').then((listTextures) => {
        if (listTextures) {
            listTextures[''] = '';
            folder.add({ texture: '' }, 'texture', listTextures).onChange((value) => {
                this._changeTexture('./textures/'.concat(value), j, folder);
            }).name('Texture');
        }
    });
};

/**
 * add the face texture menu controller for overall
 * @param {Dat.gui.Folder} folder folder of the symbolyzer for all parts
 */
Symbolizer.prototype._addTextureAll = function addTextureAll(folder) {
    Fetcher.json('./textures/listeTexture.json').then((listTextures) => {
        if (listTextures) {
            listTextures[''] = '';
            folder.add({ texture: '' }, 'texture', listTextures).onChange((value) => {
                this._changeTextureAll('./textures/'.concat(value), folder);
            }).name('Texture');
        }
    });
};

// ******************** GUI INITIALIZATION ********************

/**
 * Use for controle if we can symbolyze objects by part
 * @returns {boolean} if we can symbolyze objects by part
 */
Symbolizer.prototype._checkStructure = function checkStructure() {
    var i;
    if (this.bdTopo && this.obj.length > 0 && this.obj[0].children.length != 2) return false;
    // We check if the objects have the same number of children
    for (i = 1; i < this.obj.length; i++) {
        if (this.obj[i].children.length != this.obj[0].children.length) {
            // If one object has a different number of children, the function returns false
            return false;
        }
    }
    return true;
};

/** creat a symbolyzer menu for symbolyze each part */
Symbolizer.prototype.initGui = function addToGUI() {
    // We check if the objects of the list have the same structure
    if (this._checkStructure()) {
        // If the structure is similar, we create a folder for the symbolizer
        var parentFolder = this.menu.gui.addFolder('Symbolizer '.concat(this.nb));
        this.folder = parentFolder;
        this.folder.open();
        this._addSave(parentFolder);
        this._addLoad(parentFolder);
        this._addLoadMTL(parentFolder);
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
                this._addSaveLoadPart(folder, j);
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
                this._addSaveLoadPart(folder, i);
                this._addOpacity(folder, j);
                this._addColor(folder, j);
                this._addEmissive(folder, j);
                this._addSpecular(folder, j);
                this._addShininess(folder, j);
                // TODO: add uv on BDTopo
                // this._addTexture(folder, j);
            }
        }
        if (this.light != null) {
            var lightFolder = parentFolder.addFolder('Light');
            if (this.plane != null) { this._addShades(lightFolder); }
            this._addColorLight(lightFolder);
            this._addMoveLight(lightFolder);
        }
    }
    else {
        this.initGuiAll();
    }
};

/** creat a symbolyzer menu for symbolyze overall object(s) */
Symbolizer.prototype.initGuiAll = function addToGUI() {
    // var folder = this.menu.gui.addFolder(this.obj.materialLibraries[0].substring(0, this.obj.materialLibraries[0].length - 4));
    var folder = this.menu.gui.addFolder('Symbolizer '.concat(this.nb));
    this.folder = folder;
    this.folder.open();
    this._addSaveAll(folder);
    this._addLoad(folder);
    var edgesFolder = folder.addFolder('Edges');
    this._addColorEdgeAll(edgesFolder);
    this._addOpacityEdgeAll(edgesFolder);
    this._addWidthEdgeAll(edgesFolder);
    this._addStyleEdgeAll(edgesFolder);
    var facesFolder = folder.addFolder('Faces');
    if (this.obj.length != 0) this._addTextureAll(facesFolder);
    this._addOpacityAll(facesFolder);
    this._addColorAll(facesFolder);
    this._addEmissiveAll(facesFolder);
    this._addSpecularAll(facesFolder);
    this._addShininessAll(facesFolder);
    if (this.light != null) {
        var lightFolder = folder.addFolder('Light');
        if (this.plane != null) { this._addShades(lightFolder); }
        this._addColorLight(lightFolder);
        this._addMoveLight(lightFolder);
    }
};


// ******************** ENVIRONMENT ********************

/**
 * add a light move menu controller
 * @param {Dat.gui.Folder} folder folder of the symbolyzer for all parts
 */
Symbolizer.prototype._addMoveLight = function addMoveLight(folder) {
    var prevValueX = 0;
    var prevValueY = 0;
    var prevValueZ = 0;
    // Add controller for X translation of light
    folder.add({ MovecoordX: 0 }, 'MovecoordX', -1000, 1000, 1).name('Translation X').onChange((value) => {
        this.light.position.x += value - prevValueX;
        prevValueX = value;
        this.light.updateMatrixWorld();
        this.view.notifyChange(true);
    });
    // Add controller for Y translation of light
    folder.add({ MovecoordY: 0 }, 'MovecoordY', -1000, 1000, 1).name('Translation Y').onChange((value) => {
        this.light.position.y += value - prevValueY;
        prevValueY = value;
        this.light.updateMatrixWorld();
        this.view.notifyChange(true);
    });
    // Add controller for Z translation of light
    folder.add({ MovecoordZ: 0 }, 'MovecoordZ', -1000, 1000, 1).name('Translation Z').onChange((value) => {
        this.light.position.z += value - prevValueZ;
        prevValueZ = value;
        this.light.updateMatrixWorld();
        this.view.notifyChange(true);
    });
};

/**
 * add a light color menu controller
 * @param {Dat.gui.Folder} folder folder of the symbolyzer for all parts
 */
Symbolizer.prototype._addColorLight = function addColorLight(folder) {
    folder.addColor({ color: 0xffffff }, 'color').name('Color').onChange((value) => {
        this.light.color = new THREE.Color(value);
        this.view.notifyChange(true);
    });
};

/**
 * add a shadow menu controller
 * @param {Dat.gui.Folder} folder folder of the symbolyzer for all parts
 */
Symbolizer.prototype._addShades = function addShades(folder) {
    folder.add({ shades: this.plane.visible }, 'shades').name('Display shades').onChange((checked) => {
        this.plane.visible = checked;
        this.view.notifyChange(true);
    });
};

/*
function getRandomColor() {
    var letters = '0123456789ABCDEF';
    var color = '#';
    for (var i = 0; i < 6; i++) {
        color += letters[Math.floor(Math.random() * 16)];
    }
    return color;
}
*/

/**
 * function for the file exception
 * @param {string} message message
 * @memberOf Symbolizer
 */
function loadFileException(message) {
    this.message = message;
    this.name = 'loadFileException';
}

function rgb2hex(r, g, b) {
    return '#'.concat(('0'.concat(r.toString(16))).slice(-2)).concat(('0'.concat(g.toString(16))).slice(-2)).concat(('0'.concat(b.toString(16))).slice(-2));
}

/*
function getSourceSynch(url) {
    var req = new XMLHttpRequest();
    req.open('GET', url, false);
    req.send();
    return req.responseText;
}
*/

/**
 * initialize the edges between tow point for the quad
 * @param {THREE.Vector3} pt1 first point
 * @param {THREE.Vector3} pt2 second point
 * @returns {THREE.BufferGeometry} edges between tow point for the quad
 * @memberOf Symbolizer
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
