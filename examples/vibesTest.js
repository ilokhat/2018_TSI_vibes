/* global itowns, document, GuiTools */
// # Simple Globe viewer

// Define initial camera position
// Coordinate can be found on https://www.geoportail.gouv.fr/carte
// setting is "coordonnée geographiques en degres decimaux"

// Position near Gerbier mountain.
var positionOnGlobe = { longitude: 2.396387, latitude: 48.848701, altitude: 2000 };

// `viewerDiv` will contain iTowns' rendering area (`<canvas>`)
var viewerDiv = document.getElementById('viewerDiv');

// Instanciate iTowns GlobeView*
var globeView = new itowns.GlobeView(viewerDiv, positionOnGlobe);

// GUI initialization
var menuGlobe = new GuiTools('menuDiv');
var guiInitialized = false;
var layerFolder = menuGlobe.gui.addFolder('Layers');
var listLayers = [];
var listControllers = [];
var listLayerDelete = [];
var nbSymbolizer = 0;

var promiseElevation = [];

menuGlobe.view = globeView;

function addLayerCb(layer) {
    return globeView.addLayer(layer).then(function addGui(la) {
        if (la.type === 'color') {
            menuGlobe.addImageryLayerGUI(la);
        } else if (la.type === 'elevation') {
            menuGlobe.addElevationLayerGUI(la);
        }
    });
}
// Add one imagery layer to the scene
// This layer is defined in a json file but it could be defined as a plain js
// object. See Layer* for more info.
// itowns.Fetcher.json('./layers/JSONLayers/Ortho.json').then(addLayerCb);
itowns.Fetcher.json('./layers/JSONLayers/Ortho.json').then(addLayerCb);

// Add two elevation layers.
// These will deform iTowns globe geometry to represent terrain elevation.
promiseElevation.push(itowns.Fetcher.json('./layers/JSONLayers/WORLD_DTM.json').then(addLayerCb));
promiseElevation.push(itowns.Fetcher.json('./layers/JSONLayers/IGN_MNT_HIGHRES.json').then(addLayerCb));

// Object parameters, 48.848340,

var coord = new itowns.Coordinates('EPSG:4326', 2.396159, 48.848264, 50);
var rotateX = Math.PI/2;
var rotateY = 0;
var rotateZ = 0;
var scale = 300;

// Symbolizer
var initSymbolizer = function initSymbolizer(menuGlobe, complex) {
    // Checks if a layer is selected (if not, nothing happens)
    if (listLayers.length != 0) {
        // Merge elements of the list as one group
        var listObj = [];
        var listEdge = [];
        var obj;
        var edge;
        listLayers.forEach((layer) => {
            listObj.push(layer[0]);
            listEdge.push(layer[1]);
        })
        // Call Symbolizer
        nbSymbolizer++;
        var symbolizer = new itowns.Symbolizer(globeView, listObj, listEdge, menuGlobe, nbSymbolizer);
        if (complex) {
            symbolizer.initGui();
        }
        else {
            symbolizer.initGuiAll();
        }
        //Remove the layers from the list on the GUI
        listControllers.forEach((controller) => {
            menuGlobe.gui.__folders.Layers.remove(controller);
        })

        // Empty layer and controllers list;
        listLayers = [];
        listControllers = [];
        }
}

// Loader initialization
var loader = new itowns.ModelLoader(globeView);

// Read the file dropped and actually load the object
function readFile(file) {
    var reader = new FileReader();
    if(file.name.endsWith('.obj')){
        reader.addEventListener('load', () => {
            // Load object
            loader.loadOBJ(reader.result, coord, rotateX, rotateY, rotateZ, scale, handleLayer, menuGlobe);
        }, false);
        reader.readAsDataURL(file);
        return 0;
    }
    else if(file.name.endsWith('.gibes')){
        reader.addEventListener('load', () => {
            var json = JSON.parse(reader.result);
            listLayers.forEach((layer) => {
                // Position parameters
                var coordX = json.coordX;
                var coordY = json.coordY;
                var coordZ = json.coordZ;
                var rotateX = Math.PI * json.rotateX;
                var rotateY = Math.PI * json.rotateY;
                var rotateZ = Math.PI * json.rotateZ;
                var scale = json.scale;
                // Moving object
                var coord = new itowns.Coordinates('EPSG:4326', coordX, coordY, coordZ);
                loader._loadModel(layer[0], layer[1], coord, rotateX, rotateY, rotateZ, scale);
            })
        });
        reader.readAsText(file);
    }
    else{
        throw new loadFileException("fichier de type .obj attendu");
    }
}

// Layer management
function handleLayer(model, menuGlobe) {
    // Add a checkbox to the GUI, named after the layer  
    var lFolder, lFolder1, deleteBtn;
    if (!guiInitialized) {
        // Creates buttons to start symbolizers
        lFolder =  layerFolder.add({ symbolizer: () => {
            initSymbolizer(menuGlobe, false);    
        }}, 'symbolizer').name('Stylize object...');
        lFolder1 = layerFolder.add({ symbolizer: () => {
            initSymbolizer(menuGlobe, true);
        }}, 'symbolizer').name('Stylize parts...');
    }
    var name = model[0].materialLibraries[0].substring(0, model[0].materialLibraries[0].length - 4);
    var controller = layerFolder.add({ Layer: false }, 'Layer').name(name).onChange((checked) => {
        if (checked) {
            // Add layer and controller to the list
            listLayers.push(model);
            listControllers.push(controller);
            if (!listLayerDelete.includes(model)) {
                listLayerDelete.push(model);
                deleteBtn = layerFolder.add({ delete: () => {
                    // Remove the layer from the list of layers to stylize
                    var i = listLayers.indexOf(model);
                    if(i != -1) {
                        listLayers.splice(i, 1);
                    }
                    // Removes the controllers
                    console.log(menuGlobe.gui.__folders.Layers);
                    if (menuGlobe.gui.__folders.Layers != undefined){
                        menuGlobe.gui.__folders.Layers.remove(controller);
                    }
                    menuGlobe.gui.__folders.Layers.remove(deleteBtn);
                    // Actually remove the model from the scene
                    globeView.scene.remove(model[0]);
                    globeView.scene.remove(model[1]);
                    globeView.notifyChange(true); 
                }}, 'delete').name('Delete ' + name);
            }
        }
        else{
            var i = listLayerDelete.indexOf(model);
            if(i != -1) {
                listLayerDelete.splice(i, 1);
            }
            // Remove layer and controller from the list
            menuGlobe.gui.__folders.Layers.remove(deleteBtn);
            var i = listLayers.indexOf(model);
            if(i != -1) {
                listLayers.splice(i, 1);
            } 
            var j = listControllers.indexOf(controller);
            if(j != -1) {
                listControllers.splice(j, 1);
            } 
        }
    }); 
  
        guiInitialized = true;

    
}

// Drag and drop
function initListener() {
    document.addEventListener('drop', documentDrop, false);
        let prevDefault = e => e.preventDefault();
        document.addEventListener('dragenter', prevDefault, false);
        document.addEventListener('dragover', prevDefault, false);
        document.addEventListener('dragleave', prevDefault, false);
  }

function documentDrop(e) {
    e.preventDefault();
    var file = e.dataTransfer.files[0];
    readFile(file);
  }

window.onload = () => initListener();

// Listen for globe full initialisation event
globeView.addEventListener(itowns.GLOBE_VIEW_EVENTS.GLOBE_INITIALIZED, function init() {
    globeView.controls.setOrbitalPosition({ heading: 180, tilt: 60 });
});

function loadFileException(message) {
    this.message = message;
    this.name = "loadFileException";
 }

var options = {
    buildings: { url: "./models/Buildings3D/", visible: true, },
    position: { x:651250, y:6861250, z:0 , CRS: 'EPSG:2154'},
};

itowns.gfxEngine.init(globeView);

itowns.gfxEngine.setZero(options.position);

if (!itowns.Cartography3D.isCartoInitialized()){
    itowns.Cartography3D.initCarto3D(options.buildings, doAfter);
};


function doAfter(obj){
    globeView.scene.add(obj);
    console.log(obj);
}
