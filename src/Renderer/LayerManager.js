/**
 * Tool to manage layers in Vibes project
 */

import * as THREE from 'three';

var _this;

function LayerManager(view, doc, menu, coord, rotateX, rotateY, rotateZ, scale, loader, symbolizer) {
    // Constructor
    this.view = view;
    this.document = doc;
    this.menu = menu;
    this.coord = coord;
    this.rotateX = rotateX;
    this.rotateY = rotateY;
    this.rotateZ = rotateZ;
    this.scale = scale;
    this.listLayers = [];
    this.listControllers = [];
    this.nbSymbolizer = 0;
    this.guiInitialized = false;
    this.layerFolder = this.menu.gui.addFolder('Layers');
    this.loader = loader;
    this.symbolizer = symbolizer;

    this.stylizeObjectBtn = null;
    this.stylizePartsBtn = null;
    this.deleteBtn = null;

    _this = this;
}

LayerManager.prototype.initListener = function initListener() {
    this.document.addEventListener('keypress', this.checkKeyPress, false);
    this.document.addEventListener('drop', _this.documentDrop, false);
    var prevDefault = e => e.preventDefault();
    this.document.addEventListener('dragenter', prevDefault, false);
    this.document.addEventListener('dragover', prevDefault, false);
    this.document.addEventListener('dragleave', prevDefault, false);
};

LayerManager.prototype.documentDrop = function documentDrop(e) {
    e.preventDefault();
    var file = e.dataTransfer.files[0];
    _this.readFile(file);
};

LayerManager.prototype.readFile = function readFile(file) {
    // Read the file dropped and actually load the object
    var reader = new FileReader();
    // Load .OBJ file
    if (file.name.endsWith('.obj')) {
        reader.addEventListener('load', () => {
            // Load object
            _this.loader.loadOBJ(reader.result, _this.coord, _this.rotateX, _this.rotateY, _this.rotateZ, _this.scale, _this.handleLayer, _this.menu);
        }, false);
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
                _this.rotateX = Math.PI * json.rotateX;
                _this.rotateY = Math.PI * json.rotateY;
                _this.rotateZ = Math.PI * json.rotateZ;
                _this.scale = json.scale;
                // Moving object
                var crs = _this.coord.crs;
                var vectCoord = new THREE.Vector3().set(coordX, coordY, coordZ);
                _this.coord.set(crs, vectCoord);
                _this.loader._loadModel(layer[0], layer[1], _this.coord, _this.rotateX, _this.rotateY, _this.rotateZ, _this.scale);
            });
        });
        reader.readAsText(file);
    }
    // Other format
    else {
        throw new loadFileException('Unvalid format');
    }
};

LayerManager.prototype.handleLayer = function handleLayer(model) {
    // Add a checkbox to the GUI, named after the layer
    var name = model[0].materialLibraries[0].substring(0, model[0].materialLibraries[0].length - 4);
    var controller = _this.layerFolder.add({ Layer: false }, 'Layer').name(name).onChange((checked) => {
        if (checked) {
            // Creates buttons to start symbolizers
            if (!_this.guiInitialized) {
                _this.stylizeObjectBtn = _this.layerFolder.add({ symbolizer: () => {
                    _this.initSymbolizer(false); 
                },
                }, 'symbolizer').name('Stylize object...');
                _this.stylizePartsBtn = _this.layerFolder.add({ symbolizer: () => {
                    _this.initSymbolizer(true);
                },
                }, 'symbolizer').name('Stylize parts...');
                _this.deleteBtn = _this.layerFolder.add({ delete: () => {
                    // Removes the controllers
                    if (_this.menu.gui.__folders.Layers != undefined) {
                        _this.listControllers.forEach((controller) => {
                            _this.menu.gui.__folders.Layers.remove(controller);
                        });
                    }
                    var j = _this.listControllers.indexOf(controller);
                    if (j != -1) {
                        _this.listControllers.splice(j, 1);
                    }
                    // Actually remove the model from the scene
                    console.log(_this.listLayers);
                    _this.listLayers.forEach((layer) => {
                        console.log(layer);
                        _this.view.scene.remove(layer[0]);
                        _this.view.scene.remove(layer[1]);
                    });
                    _this.view.notifyChange(true);
                    // Remove the layer from the list of layers to stylize
                    var i = _this.listLayers.indexOf(model);
                    if (i != -1) {
                        _this.listLayers.splice(i, 1);
                    }
                    // If there is no more layers, remove 'Open symbolizer' and 'Delete Layer' buttons
                    if (_this.listLayers.length == 0) {
                        _this.menu.gui.__folders.Layers.remove(_this.stylizeObjectBtn);
                        _this.menu.gui.__folders.Layers.remove(_this.stylizePartsBtn);
                        _this.menu.gui.__folders.Layers.remove(_this.deleteBtn);
                        _this.guiInitialized = false;
                    }
            },
            }, 'delete').name('Delete layer');
            }
            // Add layer and controller to the list
            _this.listLayers.push(model);
            _this.listControllers.push(controller);
            // GUI initialized
            _this.guiInitialized = true;
        }
        else {
            // Remove layer controller from the list
            // _this.menu.gui.__folders.Layers.remove(deleteBtn);
            var i = _this.listLayers.indexOf(model);
            if (i != -1) {
                _this.listLayers.splice(i, 1);
            }
            var j = _this.listControllers.indexOf(controller);
            if (j != -1) {
                _this.listControllers.splice(j, 1);
            }
            // If there is no more layers, remove 'Open symbolizer' buttons
            if (_this.listLayers.length == 0) {
                _this.menu.gui.__folders.Layers.remove(_this.stylizeObjectBtn);
                _this.menu.gui.__folders.Layers.remove(_this.stylizePartsBtn);
                _this.menu.gui.__folders.Layers.remove(_this.deleteBtn);
                _this.guiInitialized = false;
            }
        }
    });
};

LayerManager.prototype.initSymbolizer = function initSymbolizer(complex) {
    var i;
    var deleteSymbolizerBtn;
    // Checks if a layer is selected (if not, nothing happens)
    if (_this.listLayers.length != 0) {
        // Merge elements of the list as one group
        var listObj = [];
        var listEdge = [];
        _this.listLayers.forEach((layer) => {
            listObj.push(layer[0]);
            listEdge.push(layer[1]);
        });
        // Call Symbolizer
        _this.nbSymbolizer++;
        var symbolizer = _this.symbolizer(_this.view, listObj, listEdge, _this.menu, _this.nbSymbolizer);
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
                // Deletes itself
                _this.menu.gui.remove(deleteSymbolizerBtn);
            },
            }, 'deleteSymbolizer').name('Close Symbolizer '.concat(_this.nbSymbolizer));

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
                // Deletes itself
                _this.menu.gui.remove(deleteSymbolizerBtn);
            },
            }, 'deleteSymbolizer').name('Close Symbolizer '.concat(_this.nbSymbolizer));
        }
        // Remove the layers from the list on the GUI
        _this.listControllers.forEach((controller) => {
            _this.menu.gui.__folders.Layers.remove(controller);
        });
        // Empty layer and controllers list;
        _this.listLayers = [];
        _this.listControllers = [];
    }
};

function loadFileException(message) {
    this.message = message;
    this.name = 'loadFileException';
}

LayerManager.prototype.checkKeyPress = function checkKeyPress(key) {
    if (_this.symbolizerInit) {
        if ((key.keyCode == '56') || (key.keyCode == '113')) {
            _this.symbolizerInit._xplus();
        }
        if ((key.keyCode == '50') || (key.keyCode == '115')) {
            _this.symbolizerInit._xmoins();
        }
        if ((key.keyCode == '52') || (key.keyCode == '97')) {
            _this.symbolizerInit._yplus();
        }
        if ((key.keyCode == '54') || (key.keyCode == '122')) {
            _this.symbolizerInit._ymoins();
        }
        if ((key.keyCode == '55') || (key.keyCode == '119')) {
            _this.symbolizerInit._zplus();
        }
        if ((key.keyCode == '51') || (key.keyCode == '120')) {
            _this.symbolizerInit._zmoins();
        }
    }
};

export default LayerManager;
