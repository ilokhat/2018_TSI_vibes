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

// Geolocation default parameters
var coord = new itowns.Coordinates('EPSG:4326', 2.396159, 48.848264, 50);
var rotateX = Math.PI/2;
var rotateY = 0;
var rotateZ = 0;
var scale = 300;



// Loader initialization
var loader = new itowns.ModelLoader(globeView);

// Symbolizer
var symbolizer = function(view, listObj, listEdge, menu, nbSymbolizer) {
    return new itowns.Symbolizer(view, listObj, listEdge, menu, nbSymbolizer);
}
/*
window.addEventListener("keypress",checkKeyPress,false);
function checkKeyPress(key){

    if ((key.keyCode == "56")||(key.keyCode == "113")) {
        symbolizer._xplus();
    }
    if ((key.keyCode == "50")||(key.keyCode == "115")){
        symbolizer._xmoins();
    }

    if ((key.keyCode == "52")||(key.keyCode == "97")){
        symbolizer._yplus();
    }
    if ((key.keyCode == "54")||(key.keyCode == "122")){
        symbolizer._ymoins();
    }

    if ((key.keyCode == "55")||(key.keyCode == "119")){
        symbolizer._zplus();
    }
    if ((key.keyCode == "51")||(key.keyCode == "120")){
        symbolizer._zmoins();
    }
}
*/

// Layer management
var manager = new itowns.LayerManager(globeView, document, menuGlobe, coord, rotateX, rotateY, rotateZ, scale, loader, symbolizer)
window.onload = () => manager.initListener();

// Listen for globe full initialisation event
globeView.addEventListener(itowns.GLOBE_VIEW_EVENTS.GLOBE_INITIALIZED, function init() {
    globeView.controls.setOrbitalPosition({ heading: 180, tilt: 60 });
});

function loadFileException(message) {
    this.message = message;
    this.name = "loadFileException";
 }

var loader2 = new itowns.ModelLoader(globeView);
loader2.loadBati3D();

function picking(event) {
    // Pick an object with batch id
    var mouse = globeView.eventToNormalizedCoords(event);
    var raycaster = new itowns.THREE.Raycaster();
    raycaster.setFromCamera(mouse, globeView.camera.camera3D);
    // calculate objects intersecting the picking ray
    var intersects = raycaster.intersectObjects(globeView.scene.children, true);
    if (0 < intersects.length /*&& intersects[0].object instanceof itowns.THREE.Mesh*/) {
        source = getParent(intersects[0].object);
        if (source.name != 'globe') {
            console.log(source.name);
            for (var i = 0; i < source.children.length; i++) {
                source.children[i].material = new THREE.MeshPhongMaterial({ color: 0x2194ce, emissive: 0x000000, specular: 0x111111, side: THREE.DoubleSide });
                source.children[i].material.needUpdate = true;
            }
        }
    }
    globeView.notifyChange(true);
}

function getParent(obj){
    if (obj.parent.parent != null) return getParent(obj.parent);
    return obj;

}

window.addEventListener('click', picking, false);
