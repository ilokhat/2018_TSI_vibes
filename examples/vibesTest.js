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

// Loader initialization
var loader = new itowns.ModelLoader(globeView);

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
    //console.log(file);
    readFile(file);
  }


function readFile(file) {
    let reader = new FileReader();
    reader.addEventListener('load', () => {
        loader.loadOBJ(reader.result, coord, rotateX, rotateY, rotateZ, scale);
        var object = loader.model[0];
        var edges = loader.model[1];
        var symbolizer = new itowns.Symbolizer(globeView, object, edges, menuGlobe);
        symbolizer.initGuiAll();
    }, false);

    reader.readAsDataURL(file);
  }


window.onload = () => initListener();


// Listen for globe full initialisation event
globeView.addEventListener(itowns.GLOBE_VIEW_EVENTS.GLOBE_INITIALIZED, function init() {
    globeView.controls.setOrbitalPosition({ heading: 180, tilt: 60 });
});
