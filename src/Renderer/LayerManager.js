/**
 * Tool to manage layers in Vibes project
 */

import * as THREE from 'three';

var _this;
var saveData;

function LayerManager(view, doc, menu, coord, rotateX, rotateY, rotateZ, scale, loader, symbolizer, saveDataInit) {
    // Constructor
    this.view = view;
    this.document = doc;
    this.menu = menu;
    this.coord = coord;
    this.coordCRS = coord.as('EPSG:4326');
    this.rotateX = rotateX;
    this.rotateY = rotateY;
    this.rotateZ = rotateZ;
    this.scale = scale;
    this.listLayers = [];
    this.listControllers = [];
    this.nbSymbolizer = 0;
    this.guiInitialized = false;
    this.loader = loader;
    this.symbolizer = symbolizer;
    this.symbolizerInit = null;
    this.light = null;
    this.plane = null;
    saveData = saveDataInit();
    _this = this;
}

var hideBDTopo = (parent) => { parent.visible = false; };

var buttons = {};
var folders = {};

// ********** GUI INITIALIZATION **********

LayerManager.prototype.initListener = function initListener() {
    // Gui initialization
    folders.layerFolder = this.menu.gui.addFolder('Layers');
    folders.layerFolder.open();
    folders.positionFolder = this.menu.gui.addFolder('Positions');
    folders.positionFolder.open();
    manageCamera();
    createBati3dBtn();
    createBdTopoBtn();
    // Check key press listeners
    this.document.addEventListener('keypress', _this.checkKeyPress, false);
    this.document.addEventListener('keypress', _this.checkKeyPress, false);
    // Drag and drop listeners
    this.document.addEventListener('click', _this.picking, false);
    this.document.addEventListener('drop', _this.documentDrop, false);
    var prevDefault = e => e.preventDefault();
    this.document.addEventListener('dragenter', prevDefault, false);
    this.document.addEventListener('dragover', prevDefault, false);
    this.document.addEventListener('dragleave', prevDefault, false);
};

LayerManager.prototype.documentDrop = function documentDrop(e) {
    e.preventDefault();
    var file = e.dataTransfer.files[0];
    _this._readFile(file);
};

LayerManager.prototype._readFile = function readFile(file) {
    // Read the file dropped and actually load the object
    var reader = new FileReader();
    // Load .OBJ file
    if (file.name.endsWith('.obj')) {
        reader.addEventListener('load', () => {
            // Load object
            _this.loader.loadOBJ(reader.result, _this.coordCRS, _this.rotateX, _this.rotateY, _this.rotateZ, _this.scale, _this.handleLayer, _this.menu);
            _this.view.controls.setCameraTargetGeoPositionAdvanced({ longitude: _this.coordCRS.longitude(), latitude: _this.coordCRS.latitude(), zoom: 15, tilt: 30, heading: 30 }, true);
        }, false);
            // Create a PointLight and turn on shadows for the light
        this.light = new THREE.PointLight(0xffffff, 1, 0, 1);
        var coordLight = this.coord.clone();
        coordLight.setAltitude(coordLight.altitude() + 350);
        this.light.position.copy(coordLight.as(this.view.referenceCrs).xyz());
        this.light.position.y += 70;
        this.light.updateMatrixWorld();
        this.light.castShadow = true;            // default false
        // Set up shadow properties for the light
        this.light.shadow.mapSize.width = 512;  // default
        this.light.shadow.mapSize.height = 512; // default
        this.light.shadow.camera.near = 0.5;       // default
        this.light.shadow.camera.far = 5000;
        this.view.scene.add(this.light);
        // Create a plane that receives shadows (but does not cast them)
        var planeID = this.view.mainLoop.gfxEngine.getUniqueThreejsLayer();
        var planeGeometry = new THREE.PlaneBufferGeometry(2000, 2000, 32, 32);
        var planeMaterial = new THREE.ShadowMaterial({ side: THREE.DoubleSide, depthTest: false });
        // var planeMaterial = new THREE.MeshBasicMaterial({ side: THREE.DoubleSide, depthTest: false });
        planeMaterial.transparent = true;
        planeMaterial.opacity = 0.5;
        this.plane = new THREE.Mesh(planeGeometry, planeMaterial);
        this.plane.position.copy(this.coord.as(this.view.referenceCrs).xyz());
        this.plane.lookAt(this.plane.position.clone().add(this.coord.geodesicNormal));
        this.plane.receiveShadow = true;
        this.plane.traverse((obj) => { obj.layers.set(planeID); });
        this.view.camera.camera3D.layers.enable(planeID);
        this.plane.updateMatrixWorld();
        this.view.scene.add(this.plane);
        reader.readAsDataURL(file);

        return 0;
    }
    // Load geolocation file
    else if (file.name.endsWith('.gibes')) {
        reader.addEventListener('load', () => {
            var json = JSON.parse(reader.result);
            _this.listLayers.forEach((layer) => {
                // Position parameters
                var coordX = json.coordX;
                var coordY = json.coordY;
                var coordZ = json.coordZ;
                _this.rotateX = json.rotateX;
                _this.rotateY = json.rotateY;
                _this.rotateZ = json.rotateZ;
                _this.scale = json.scale;
                // Moving object
                var vectCoord = new THREE.Vector3().set(coordX, coordY, coordZ);
                _this.coord.set('EPSG:4978', vectCoord);
                var newCRS = _this.coord.as('EPSG:4326');
                var coordLight = newCRS.clone();
                coordLight.setAltitude(newCRS.altitude() + 350);
                this.light.position.copy(coordLight.as(this.view.referenceCrs).xyz());
                this.light.position.y += 50;
                this.plane.position.copy(newCRS.as(this.view.referenceCrs).xyz());
                this.plane.visible = false;
                this.plane.updateMatrixWorld();
                this.light.updateMatrixWorld();
                _this.loader._loadModel(layer[0], layer[1], newCRS, _this.rotateX, _this.rotateY, _this.rotateZ, _this.scale);
                _this.view.controls.setCameraTargetGeoPositionAdvanced({ longitude: newCRS.longitude(), latitude: newCRS.latitude(), zoom: 15, tilt: 30, heading: 30 }, true);
            });
        });
        reader.readAsText(file);
        return 0;
    // Load stylesheet
    } else if (file.name.endsWith('.vibes')) {
        reader.addEventListener('load', () => {
            _this.listLayers.forEach((/* layer */) => {
                var name;
                if (file.name.split('.')[0].split('_')[1] == 'globale') {
                    name = _this.initSymbolizer(false);
                    _this.symbolizerInit._readVibes(file, _this.menu.gui.__folders[name]);
                } else if (file.name.split('.')[0].split('_')[1] == 'partie') {
                    name = _this.initSymbolizer(true);
                    _this.symbolizerInit._readVibes(file, _this.menu.gui.__folders[name]);
                }
            });
        });
        reader.readAsText(file);
    }
    // Other format
    else {
        throw new loadFileException('Unvalid format');
    }
};

// ********** LAYER HANDLERS **********

LayerManager.prototype.handleLayer = function handleLayer(model) {
    // Add a checkbox to the GUI, named after the layer
    var name = model[0].name.split('_')[0];
    var controller = folders.layerFolder.add({ Layer: false, Name: name }, 'Layer').name(name.split('-').join(' ')).onChange((checked) => {
        if (checked) {
            // Add layer and controller to the list
            _this.listLayers.push(model);
            _this.listControllers.push(controller);
            // Creates buttons to start symbolizers
            if (!_this.guiInitialized) {
                _this.guiInitialize();
                _this.initPositions();
            }
        }
        else {
            // Remove layer controller from the list
            removeFromList(_this.listLayers, model);
            removeFromList(_this.listControllers, controller);
            // If there is no more layers, clean the GUI
            if (_this.listLayers.length == 0) {
                _this._cleanGUI();
            }
        }
    });
};

LayerManager.prototype.handleBdTopo = function handleBdTopo() {
    // Add a checkbox to the GUI, named after the layer
    var name = 'BDTopo';
    var controller = folders.layerFolder.add({ Layer: false, Name: name }, 'Layer').name('BDTopo').onChange((checked) => {
        if (checked) {
            // Add layer and controller to the list
            _this.listLayers.push('BDTopo');
            _this.listControllers.push(controller);
            // Creates buttons to start symbolizers
            if (!_this.guiInitialized) {
                _this.guiInitialize();
            }
        }
        else {
            // Remove layer controller from the list
            removeFromList(_this.listLayers, 'BDTopo');
            removeFromList(_this.listControllers, controller);
            // If there is no more layers, clean the GUI
            if (_this.listLayers.length == 0) {
                _this._cleanGUI();
            }
        }
    });
};

// ********** FUNCTIONS TO MANAGE CONTROLLERS **********

LayerManager.prototype.guiInitialize = function guiInitialize() {
    buttons.stylizeObjectBtn = folders.layerFolder.add({ symbolizer: () => {
        _this.initSymbolizer(false);
    },
    }, 'symbolizer').name('Stylize object...');
    buttons.stylizePartsBtn = folders.layerFolder.add({ symbolizer: () => {
        _this.initSymbolizer(true);
    },
    }, 'symbolizer').name('Stylize parts...');
    buttons.deleteBtn = folders.layerFolder.add({ delete: () => {
        // Removes the controllers
        if (_this.menu.gui.__folders.Layers != undefined) {
            _this.listControllers.forEach((controller) => {
                _this.menu.gui.__folders.Layers.remove(controller);
            });
        }
        _this.listControllers = [];
        // Actually remove the model from the scene
        _this.listLayers.forEach((layer) => {
            var quads;
            if (layer == 'BDTopo') {
                this.loader.ForBuildings(hideBDTopo);
                var b = _this.view._layers[0]._attachedLayers.filter(b => b.id == 'WFS Buildings');
                b[0].visible = false;
                _this.loader.bdTopoVisibility = false;
                buttons.bdTopoBtn = _this.menu.gui.add({ bdTopo: () => {
                    if (_this.loader.bDTopoLoaded) {
                        var b = _this.view._layers[0]._attachedLayers.filter(b => b.id == 'WFS Buildings');
                        if (_this.loader.bdTopoVisibility) {
                            b[0].visible = false;
                            _this.loader.bdTopoVisibility = false;
                        } else {
                            b[0].visible = true;
                            _this.loader.bdTopoVisibility = true;
                            _this.menu.gui.remove(buttons.bdTopoBtn);
                            _this.handleBdTopo();
                        }
                    }
                },
                }, 'bdTopo').name('Load BDTopo');
                // _this.view.scene.remove(_this.view.scene.getObjectByName('quads_bdTopo'));
            }
            else if (layer[0].name === 'bati3D_faces' || layer[0].name === 'bati3D_lines') {
                createBati3dBtn();
                _this.loader._setVisibility(_this.view, false);
                _this.loader.checked = false;
                // Remove quads if they exist
                quads = getQuadsByName(layer[0].name.split('_')[0]);
                if (quads != null) {
                    _this.view.scene.getObjectByName('quads').remove(quads);
                }
                /*
                _this.view.scene.getObjectByName('quads').children.forEach((child) => {
                    if (child.name === 'quads_'.concat(layer[0].name.split('_')[0])) {
                        _this.view.scene.getObjectByName('quads').remove(child);
                    }
                });
                */
            }
            else {
                // Simple object
                _this.view.scene.remove(layer[0]);
                _this.view.scene.remove(layer[1]);
                // Remove quads if they exist
                quads = getQuadsByName(layer[0].name.split('_')[0]);
                if (quads != null) {
                    _this.view.scene.getObjectByName('quads').remove(quads);
                }
                /*
                _this.view.scene.getObjectByName('quads').children.forEach((child) => {
                    if (child.name === 'quads_'.concat(layer[0].name.split('_')[0])) {
                        _this.view.scene.getObjectByName('quads').remove(child);
                    }
                });
                */
            }
            _this.view.notifyChange(true);
        });
        // Remove the layers from the list of layers to stylize
        _this.listLayers = [];
        // If there is no more layers, remove 'Open symbolizer' and 'Delete Layer' buttons
        _this._cleanGUI();
    },
    }, 'delete').name('Delete layer');
    // GUI initialized
    _this.guiInitialized = true;
};

LayerManager.prototype.initSymbolizer = function initSymbolizer(complex) {
    var i;
    var deleteSymbolizerBtn;
    // _this._cleanGUI();
    // Checks if a layer is selected (if not, nothing happens)
    if (_this.listLayers.length != 0) {
        // Merge elements of the list as one group
        var listObj = [];
        var listEdge = [];
        var quads = _this.view.scene.getObjectByName('quads');
        var bdTopo = null;
        _this.listLayers.forEach((layer) => {
            if (layer != 'BDTopo' && layer.length >= 2) {
                listObj.push(layer[0]);
                listEdge.push(layer[1]);
            } else if (layer == 'BDTopo') {
                bdTopo = _this.loader;
            }
        });
        // Call Symbolizer
        _this.nbSymbolizer++;
        var symbolizer = _this.symbolizer(_this.view, listObj, listEdge, bdTopo, _this.menu, _this.nbSymbolizer, _this.light, _this.plane, quads);
        _this.symbolizerInit = symbolizer;
        // Open symbolizer with 'stylize parts'
        if (complex) {
            symbolizer.initGui();
            // Create controller to close the symbolizer
            deleteSymbolizerBtn = _this.menu.gui.add({ deleteSymbolizer: () => {
                // Delete symbolizer folder
                _this.menu.gui.__ul.removeChild(symbolizer.folder.domElement.parentNode);
                delete symbolizer.folder;
                // Put each layer controller back
                for (i = 0; i < symbolizer.obj.length; i++) {
                    _this.handleLayer([symbolizer.obj[i], symbolizer.edges[i]]);
                }
                if (symbolizer.bdTopo) {
                    _this.handleBdTopo();
                }
                // Deletes itself
                _this.menu.gui.remove(deleteSymbolizerBtn);
            },
            }, 'deleteSymbolizer').name('Close Symb. '.concat(_this.nbSymbolizer));
        }
        // Open symbolizer with 'stylize object'
        else {
            symbolizer.initGuiAll();
            // Create controller to close the symbolizer
            deleteSymbolizerBtn = _this.menu.gui.add({ deleteSymbolizer: () => {
                // Delete symbolizer folder
                _this.menu.gui.__ul.removeChild(symbolizer.folder.domElement.parentNode);
                delete symbolizer.folder;
                // Put each layer controller back
                for (i = 0; i < symbolizer.obj.length; i++) {
                    _this.handleLayer([symbolizer.obj[i], symbolizer.edges[i]]);
                }
                if (symbolizer.bdTopo) {
                    _this.handleBdTopo();
                }
                // Deletes itself
                _this.menu.gui.remove(deleteSymbolizerBtn);
            },
            }, 'deleteSymbolizer').name('Close Symb. '.concat(_this.nbSymbolizer));
        }
        // Remove the layers from the list on the GUI
        _this.listControllers.forEach((controller) => {
            _this.menu.gui.__folders.Layers.remove(controller);
        });
        // Empty layer and controllers list;
        _this.listLayers = [];
        _this.listControllers = [];
    }
    return 'Symbolizer '.concat(_this.nbSymbolizer);
};

LayerManager.prototype._cleanGUI = function cleanGUI() {
    // Remove the layer management buttons
    _this.menu.gui.__folders.Layers.remove(buttons.stylizeObjectBtn);
    _this.menu.gui.__folders.Layers.remove(buttons.stylizePartsBtn);
    _this.menu.gui.__folders.Layers.remove(buttons.deleteBtn);
    if (buttons.translateXBtn != undefined) {
        _this.menu.gui.__folders.Positions.remove(buttons.saveGibesBtn);
        _this.menu.gui.__folders.Positions.remove(buttons.translateXBtn);
        _this.menu.gui.__folders.Positions.remove(buttons.translateYBtn);
        _this.menu.gui.__folders.Positions.remove(buttons.translateZBtn);
        _this.menu.gui.__folders.Positions.remove(buttons.rotateXBtn);
        _this.menu.gui.__folders.Positions.remove(buttons.rotateYBtn);
        _this.menu.gui.__folders.Positions.remove(buttons.rotateZBtn);
        _this.menu.gui.__folders.Positions.remove(buttons.scaleBtn);
        _this.menu.gui.__folders.Positions.remove(buttons.positionXBtn);
        _this.menu.gui.__folders.Positions.remove(buttons.positionYBtn);
        _this.menu.gui.__folders.Positions.remove(buttons.positionZBtn);
    }
    _this.guiInitialized = false;
};

// ******************** GEOLOCATION ********************

LayerManager.prototype._saveGibes = function saveGibes() {
    if (_this.listLayers.length > 0) {
        var nameFile = _this.listLayers[0][0].name.split('_')[0];
        var gibes = {
            name: nameFile,
            coordX: _this.listLayers[0][0].position.x,
            coordY: _this.listLayers[0][0].position.y,
            coordZ: _this.listLayers[0][0].position.z,
            rotateX: _this.listLayers[0][0].rotation.x,
            rotateY: _this.listLayers[0][0].rotation.y,
            rotateZ: _this.listLayers[0][0].rotation.z,
            scale: _this.listLayers[0][0].scale.x,
        };
        saveData(gibes, nameFile.concat('.gibes'));
    }
};

LayerManager.prototype._addScale = function addScale() {
    // Add controller for scaling objects
    buttons.scaleBtn = folders.positionFolder.add({ scale: 1 }, 'scale', 0.1, 1000, 0.01).name('Scale').onChange((value) => {
        for (var i = 0; i < _this.listLayers.length; i++) {
            // Check the layer so we do not move BD Topo and Bati3D (already georeferenced)
            if (_this.listLayers[i] != 'BDTopo' && _this.listLayers[i][0].name != 'bati3D_faces') {
                // Scale objects and edges
                _this.listLayers[i][0].scale.set(value, value, value);
                _this.listLayers[i][1].scale.set(value, value, value);
                _this.plane.updateMatrixWorld();
                _this.listLayers[i][0].updateMatrixWorld();
                _this.listLayers[i][1].updateMatrixWorld();
                _this.light.updateMatrixWorld();
                // Scale quads if they exist
                var quads = getQuadsByName(_this.listLayers[i][0].name.split('_')[0]);
                if (quads != null) {
                    quads.scale.copy(_this.listLayers[i][0].scale);
                    quads.updateMatrixWorld();
                }
            }
        }
        _this.view.notifyChange(true);
    });
};

LayerManager.prototype._addTranslate = function addTranslate() {
    var prevValueX = 0;
    var prevValueY = 0;
    var prevValueZ = 0;
    // Add controller for X translation
    buttons.translateXBtn = folders.positionFolder.add({ MovecoordX: 0 }, 'MovecoordX', -500, 500, 0.1).name('Translation X').onChange((value) => {
        for (var i = 0; i < _this.listLayers.length; i++) {
            // Check the layer so we do not move BD Topo and Bati3D (already georeferenced)
            if (_this.listLayers[i] != 'BDTopo' && _this.listLayers[i][0].name != 'bati3D_faces') {
                // Translate object and edges
                _this.listLayers[i][0].translateX(value - prevValueX);
                _this.listLayers[i][1].translateX(value - prevValueX);
                // Save previous value
                prevValueX = value;
                _this.listLayers[i][0].updateMatrixWorld();
                _this.listLayers[i][1].updateMatrixWorld();
                // Translate quads if they exist
                var quads = getQuadsByName(_this.listLayers[i][0].name.split('_')[0]);
                if (quads != null) {
                    quads.position.copy(_this.listLayers[i][0].position);
                    quads.updateMatrixWorld();
                }
            }
        }
        _this.view.notifyChange(true);
    });
    // Add controller for Y translation
    buttons.translateYBtn = folders.positionFolder.add({ MovecoordY: 0 }, 'MovecoordY', -500, 500, 0.1).name('Translation Y').onChange((value) => {
        for (var i = 0; i < _this.listLayers.length; i++) {
            // Check the layer so we do not move BD Topo and Bati3D (already georeferenced)
            if (_this.listLayers[i] != 'BDTopo' && _this.listLayers[i][0].name != 'bati3D_faces') {
                // Translate object and edges
                _this.listLayers[i][0].translateZ(value - prevValueY);
                _this.listLayers[i][1].translateZ(value - prevValueY);
                // Save previous value
                prevValueY = value;
                _this.listLayers[i][0].updateMatrixWorld();
                _this.listLayers[i][1].updateMatrixWorld();
                // Translate quads if they exist
                var quads = getQuadsByName(_this.listLayers[i][0].name.split('_')[0]);
                if (quads != null) {
                    quads.position.copy(_this.listLayers[i][0].position);
                    quads.updateMatrixWorld();
                }
            }
        }
        _this.view.notifyChange(true);
    });
    // Add controller for Z translation
    buttons.translateZBtn = folders.positionFolder.add({ MovecoordZ: 0 }, 'MovecoordZ', -500, 500, 0.1).name('Translation Z').onChange((value) => {
        for (var i = 0; i < _this.listLayers.length; i++) {
            // Check the layer so we do not move BD Topo and Bati3D (already georeferenced)
            if (_this.listLayers[i] != 'BDTopo' && _this.listLayers[i][0].name != 'bati3D_faces') {
                // Translate object and edges
                _this.listLayers[i][0].translateY(value - prevValueZ);
                _this.listLayers[i][1].translateY(value - prevValueZ);
                // Save previous value
                prevValueZ = value;
                _this.listLayers[i][0].updateMatrixWorld();
                _this.listLayers[i][1].updateMatrixWorld();
                // Translate quads if they exist
                var quads = getQuadsByName(_this.listLayers[i][0].name.split('_')[0]);
                if (quads != null) {
                    quads.position.copy(_this.listLayers[i][0].position);
                    quads.updateMatrixWorld();
                }
            }
        }
        _this.view.notifyChange(true);
    });
};


LayerManager.prototype._addRotate = function addRotate() {
    var prevValueX = 0;
    var prevValueY = 0;
    var prevValueZ = 0;
    // Add controller for X rotation
    buttons.rotateXBtn = folders.positionFolder.add({ rotationX: 0 }, 'rotationX', -Math.PI, Math.PI, Math.PI / 100).name('Rotation X').onChange((value) => {
        for (var i = 0; i < _this.listLayers.length; i++) {
            // Check the layer so we do not move BD Topo and Bati3D (already georeferenced)
            if (_this.listLayers[i] != 'BDTopo' && _this.listLayers[i][0].name != 'bati3D_faces') {
                // Rotate object and edges
                _this.listLayers[i][0].rotateX(value - prevValueX);
                _this.listLayers[i][1].rotateX(value - prevValueX);
                // Save previous value
                prevValueX = value;
                _this.listLayers[i][0].updateMatrixWorld();
                _this.listLayers[i][1].updateMatrixWorld();
                // Rotate quads if they exist
                var quads = getQuadsByName(_this.listLayers[i][0].name.split('_')[0]);
                if (quads != null) {
                    quads.rotation.copy(_this.listLayers[i][0].rotation);
                    quads.updateMatrixWorld();
                }
            }
        }
        _this.view.notifyChange(true);
    });
    // Add controller for Y rotation
    buttons.rotateYBtn = folders.positionFolder.add({ rotationY: 0 }, 'rotationY', -Math.PI, Math.PI, Math.PI / 100).name('Rotation Y').onChange((value) => {
        for (var i = 0; i < _this.listLayers.length; i++) {
            // Check the layer so we do not move BD Topo and Bati3D (already georeferenced)
            if (_this.listLayers[i] != 'BDTopo' && _this.listLayers[i][0].name != 'bati3D_faces') {
                // Rotate object and edges
                _this.listLayers[i][0].rotateY(value - prevValueY);
                _this.listLayers[i][1].rotateY(value - prevValueY);
                // Save previous value
                prevValueY = value;
                _this.listLayers[i][0].updateMatrixWorld();
                _this.listLayers[i][1].updateMatrixWorld();
                // Rotate quads if they exist
                var quads = getQuadsByName(_this.listLayers[i][0].name.split('_')[0]);
                if (quads != null) {
                    quads.rotation.copy(_this.listLayers[i][0].rotation);
                    quads.updateMatrixWorld();
                }
            }
        }
        _this.view.notifyChange(true);
    });
    // Add controller for Z rotation
    buttons.rotateZBtn = folders.positionFolder.add({ rotationZ: 0 }, 'rotationZ', -Math.PI, Math.PI, Math.PI / 100).name('Rotation Z').onChange((value) => {
        for (var i = 0; i < _this.listLayers.length; i++) {
            // Check the layer so we do not move BD Topo and Bati3D (already georeferenced)
            if (_this.listLayers[i] != 'BDTopo' && _this.listLayers[i][0].name != 'bati3D_faces') {
                // Rotate object and edges
                _this.listLayers[i][0].rotateZ(value - prevValueZ);
                _this.listLayers[i][1].rotateZ(value - prevValueZ);
                // Save previous value
                prevValueZ = value;
                _this.listLayers[i][0].updateMatrixWorld();
                _this.listLayers[i][1].updateMatrixWorld();
                // Rotate quads if they exist
                var quads = getQuadsByName(_this.listLayers[i][0].name.split('_')[0]);
                if (quads != null) {
                    quads.rotation.copy(_this.listLayers[i][0].rotation);
                    quads.updateMatrixWorld();
                }
            }
        }
        _this.view.notifyChange(true);
    });
};

LayerManager.prototype._addPosition = function addPosition() {
    // Initial GUI value
    var initialX = _this.listLayers[0][0].position.x;
    var initialY = _this.listLayers[0][0].position.y;
    var initialZ = _this.listLayers[0][0].position.z;
    let X = initialX;
    let Y = initialY;
    let Z = initialZ;
    // vector to store the new coordinates
    var vectCoord = new THREE.Vector3();
    // Controller for position on X
    buttons.positionXBtn = folders.positionFolder.add({ longitude: initialX }, 'longitude').name('Position X').onChange((value) => {
        X = value;
        vectCoord.set(X, Y, Z);
        _this._changeCoordinates(vectCoord);
    });
    // Controller for position on Y
    buttons.positionYBtn = folders.positionFolder.add({ latitude: initialY }, 'latitude').name('Position Y').onChange((value) => {
        Y = value;
        vectCoord.set(X, Y, Z);
        _this._changeCoordinates(vectCoord);
    });
    // Controller for position on Z
    buttons.positionZBtn = folders.positionFolder.add({ altitude: initialZ }, 'altitude').name('Position Z').onChange((value) => {
        Z = value;
        vectCoord.set(X, Y, Z);
        _this._changeCoordinates(vectCoord);
    });
};

LayerManager.prototype._changeCoordinates = function changeCoordinates(vectCoord) {
    // Check if only one layer is selected
    if (_this.listLayers.length == 1) {
        // Check the layer so we do not move BD Topo and Bati3D (already georeferenced)
        if (_this.listLayers[0] != 'BDTopo' && _this.listLayers[0][0].name != 'bati3D_faces') {
            // Modification of object and edges position
            _this.listLayers[0][0].position.copy(vectCoord);
            _this.listLayers[0][1].position.copy(vectCoord);
            _this.listLayers[0][0].updateMatrixWorld();
            _this.listLayers[0][1].updateMatrixWorld();
            // Modification of quads position if they exist
            var quads = getQuadsByName(_this.listLayers[0][0].name.split('_')[0]);
            if (quads != null) {
                quads.position.copy(_this.listLayers[0][0].position);
                quads.updateMatrixWorld();
            }
            _this.view.controls.setCameraTargetPosition(_this.listLayers[0][0].position, false);
            _this.view.notifyChange(true);
        }
        else {
            throw new layerException('Cannot move a georeferenced layer');
        }
    }
    else {
        throw new layerException('Coordinates must be applied to exactly 1 layer');
    }
};


LayerManager.prototype.initPositions = function initPositions() {
    buttons.saveGibesBtn = folders.positionFolder.add({ saveGibe: () => _this._saveGibes() }, 'saveGibe').name('Save position');
    _this._addPosition();
    _this._addTranslate();
    _this._addRotate();
    _this._addScale();
};

// ********** OBJECT MOVEMENTS **********

LayerManager.prototype.checkKeyPress = function checkKeyPress(key) {
    // moving the object after clicked on it using the keys (4,6,2,8,7,3 or a,z,q,s,w,x)
    if (_this.listLayers.length == 1 && _this.listLayers[0].length >= 2 && _this.listLayers[0][0].name != 'bati3D_faces') {
        if ((key.key == 'a') || (key.key == '4')) {
            _this._moveX(-10);
        }
        if ((key.key == 'z') || (key.key == '6')) {
            _this._moveX(10);
        }
        if ((key.key == 'w') || (key.key == '7')) {
            _this._moveY(10);
        }
        if ((key.key == 'x') || (key.key == '3')) {
            _this._moveY(-10);
        }
        if ((key.key == 'q') || (key.key == '8')) {
            _this._moveZ(-10);
        }
        if ((key.key == 's') || (key.key == '2')) {
            _this._moveZ(10);
        }
    }
};

LayerManager.prototype._moveX = function _moveX(a) {
    if (_this.listLayers.length == 1 && _this.listLayers[0].length >= 2 && _this.listLayers[0][0].name != 'bati3D_faces') {
        var obj = _this.listLayers[0][0];
        var edges = _this.listLayers[0][1];
        obj.translateX(a);
        edges.translateX(a);
        obj.updateMatrixWorld();
        edges.updateMatrixWorld();
        this.view.notifyChange(true);
    }
    this.view.notifyChange(true);
};

LayerManager.prototype._moveY = function _moveY(a) {
    if (_this.listLayers.length == 1 && _this.listLayers[0].length >= 2 && _this.listLayers[0][0].name != 'bati3D_faces') {
        var obj = _this.listLayers[0][0];
        var edges = _this.listLayers[0][1];
        obj.translateY(a);
        edges.translateY(a);
        obj.updateMatrixWorld();
        edges.updateMatrixWorld();
        this.view.notifyChange(true);
    }
    this.view.notifyChange(true);
};

LayerManager.prototype._moveZ = function _moveZ(a) {
    if (_this.listLayers.length == 1 && _this.listLayers[0].length >= 2 && _this.listLayers[0][0].name != 'bati3D_faces') {
        var obj = _this.listLayers[0][0];
        var edges = _this.listLayers[0][1];
        obj.translateZ(a);
        edges.translateZ(a);
        obj.updateMatrixWorld();
        edges.updateMatrixWorld();
        this.view.notifyChange(true);
    }
    this.view.notifyChange(true);
};

LayerManager.prototype.picking = function picking(event) {
    // Pick an object with batch id
    var mouse = _this.view.eventToNormalizedCoords(event);
    var raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(mouse, _this.view.camera.camera3D);
    // calculate objects intersecting the picking ray
    var intersects = raycaster.intersectObjects(_this.view.scene.children, true);
    if (intersects.length > 0) {
        var source = getParent(intersects[0].object);
        if (source.name != 'globe' && source.name != '') {
            folders.layerFolder.__controllers.forEach((element) => {
                if (element.__checkbox && element.object.Name == source.name.split('_')[0]) element.setValue(!element.__prev);
                return element;
            });
        }
    }
};

// ********** UTILS FUNCTIONS **********

function createBati3dBtn() {
    _this.loader.loadBati3D();
    buttons.bati3dBtn = _this.menu.gui.add({ bati3D: () => {
        var bati3D_faces = _this.view.scene.getObjectByName('bati3D_faces');
        var bati3D_lines = _this.view.scene.getObjectByName('bati3D_lines');
        if (bati3D_faces != undefined && bati3D_lines != undefined) {
            _this.loader._setVisibility(_this.view, true);
            _this.loader.checked = true;
            var model = [bati3D_faces, bati3D_lines];
            _this.handleLayer(model);
            _this.menu.gui.remove(buttons.bati3dBtn);
        }
    },
    }, 'bati3D').name('Load Bati3D');
}

function createBdTopoBtn() {
    buttons.bdTopoBtn = _this.menu.gui.add({ bdTopo: () => {
        if (!_this.loader.bDTopoLoaded) {
            _this.loader.loadBDTopo();
        }
        // if (_this.loader.bDTopoLoaded) {
        var b = _this.view._layers[0]._attachedLayers.filter(b => b.id == 'WFS Buildings');
        if (_this.loader.bdTopoVisibility) {
            b[0].visible = false;
            _this.loader.bdTopoVisibility = false;
        } else {
            b[0].visible = true;
            _this.loader.bdTopoVisibility = true;
            _this.menu.gui.remove(buttons.bdTopoBtn);
            _this.handleBdTopo();
        }
        // }
    },
    }, 'bdTopo').name('Load BDTopo');
}

function manageCamera() {
    // Create a folder on the menu to manage the camera
    var camFolder = _this.menu.gui.addFolder('Camera');
    // Get initial coordinates
    var initialCamX = _this.coordCRS.longitude();
    var initialCamY = _this.coordCRS.latitude();
    let camX = initialCamX;
    let camY = initialCamY;
    // Replace the camera at its initial place
    camFolder.add({ resetCam: () => {
        _this.view.controls.setCameraTargetGeoPositionAdvanced({ longitude: initialCamX, latitude: initialCamY, zoom: 15, tilt: 30, heading: 30 }, false);
    },
    }, 'resetCam').name('Reset camera');
    // Different point of view choises
    camFolder.add({ plan: ' ' }, 'plan', ['Horizon', 'Plongeante', 'Globe']).name('Vue').onChange((value) => {
        if (value === 'Horizon') {
            _this.view.controls.setTilt(100, false);
            _this.view.controls.setZoom(12, false);
        }
        else if (value === 'Plongeante') {
            _this.view.controls.setTilt(10, false);
            _this.view.controls.setZoom(17, false);
        }
        else {
            _this.view.controls.setZoom(1, false);
        }
    });
    // Change parameter 'longitude' of the camera
    camFolder.add({ moveCamX: initialCamX }, 'moveCamX').name('Longitude').onChange((value) => {
        camX = value;
        _this.view.controls.setCameraTargetGeoPosition({ longitude: camX, latitude: camY }, false);
    });
    // Change parameter 'latitude' of the camera
    camFolder.add({ moveCamY: initialCamY }, 'moveCamY').name('Latitude').onChange((value) => {
        camY = value;
        _this.view.controls.setCameraTargetGeoPosition({ longitude: camX, latitude: camY }, false);
    });
    // Change zoom scale of the camera
    camFolder.add({ zoom: 15 }, 'zoom').name('Zoom').onChange((value) => {
        _this.view.controls.setZoom(value, false);
    });
}

function getQuadsByName(layerName) {
    var quadGroup = _this.view.scene.getObjectByName('quads');
    var quad = null;
    if (quadGroup != null) {
        quadGroup.children.forEach((child) => {
            if (child.name === 'quads_'.concat(layerName)) {
                quad = child;
            }
        });
    }
    return quad;
}

function getParent(obj) {
    if (obj.parent.parent != null) return getParent(obj.parent);
    return obj;
}

function removeFromList(list, elmt) {
    var i = list.indexOf(elmt);
    if (i != -1) {
        list.splice(i, 1);
    }
}

function loadFileException(message) {
    this.message = message;
    this.name = 'LoadFileException';
}

function layerException(message) {
    this.message = message;
    this.name = 'LayerException';
}

export default LayerManager;
