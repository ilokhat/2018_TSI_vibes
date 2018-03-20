/* global itowns, document, GuiTools */
// # Simple Globe viewer

// Define initial camera position
// Coordinate can be found on https://www.geoportail.gouv.fr/carte
// setting is "coordonnée geographiques en degres decimaux"

// Position near Gerbier mountain.
var positionOnGlobe = { longitude: 2.294485, latitude: 48.85828, altitude: 2000 };

// `viewerDiv` will contain iTowns' rendering area (`<canvas>`)
var viewerDiv = document.getElementById('viewerDiv');

// Instanciate iTowns GlobeView*
var globeView = new itowns.GlobeView(viewerDiv, positionOnGlobe);

// GUI initialization
var menuGlobe = new GuiTools('menuDiv');
var guiInitialized = false;
var layerFolder = menuGlobe.gui.addFolder('Layer management');
var listLayers = [];
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

// Object parameters
var coord = new itowns.Coordinates('EPSG:4326', 2.294485, 48.85828, 35);
var rotateX = Math.PI/2;
var rotateY = Math.PI/4;
var rotateZ = 0;
var scale = 300;

// Symbolizer
var initSymbolizer = function initSymbolizer(listLayers, menuGlobe) {
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
    symbolizer.initGui();
}

// Loader initialization
var loader = new itowns.ModelLoader(globeView);

// Read the file dropped and actually load the object
function readFile(file) {
    if(file.name.endsWith(".obj")){
        let reader = new FileReader();
        reader.addEventListener('load', () => {
            // Load object
            loader.loadOBJ(reader.result, coord, rotateX, rotateY, rotateZ, scale, handleLayer, menuGlobe);
        }, false);
        reader.readAsDataURL(file);
        return 0 ;
    }else{
        throw new loadFileException("fichier de type .obj attendu");
    }
}

// Layer management
function handleLayer(model, menuGlobe) {
    // Add a checkbox to the GUI, named after the layer
    layerFolder.add({ Layer: false }, 'Layer').name(model[0].materialLibraries[0].substring(0, model[0].materialLibraries[0].length - 4)).onChange((checked) => {
        if(checked){
            // Add layer to the list
            listLayers.push(model);
        }
        else{
            // Remove layer from the list
            var i = listLayers.indexOf(model);
            if(i != -1) {
                listLayers.splice(i, 1);
            } 
        }
    }); 
    if(!guiInitialized){
        layerFolder.add({ symbolizer: () => initSymbolizer(listLayers, menuGlobe) }, 'symbolizer').name('Open symbolizer');
    }
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