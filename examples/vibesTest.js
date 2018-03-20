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

var menuGlobe = new GuiTools('menuDiv');

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

var coord = new itowns.Coordinates('EPSG:4326', 2.396159, 48.848264, 0);
var rotateX = Math.PI/2;
var rotateY = 0;
var rotateZ = 0;
var scale = 1;

// Symbolizer
var initSymbolizer = function initSymbolizer(model, menuGlobe) {
    var object = model[0];
    var edges = model[1];
    var symbolizer = new itowns.Symbolizer(globeView, object, edges, menuGlobe);
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
            loader.loadOBJ(reader.result, coord, rotateX, rotateY, rotateZ, scale, initSymbolizer, menuGlobe);
        }, false);
        reader.readAsDataURL(file);
        return 0 ;
    }else{
        throw new loadFileException("fichier de type .obj attendu");
    }
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