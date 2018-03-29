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

// Layer management
var manager = new itowns.LayerManager(globeView, document, menuGlobe, coord, rotateX, rotateY, rotateZ, scale, loader, symbolizer)
window.onload = () => manager.initListener();

// Listen for globe full initialisation event
globeView.addEventListener(itowns.GLOBE_VIEW_EVENTS.GLOBE_INITIALIZED, function init() {
    globeView.controls.setOrbitalPosition({ heading: 180, tilt: 60 });
});

/*

var options = {
    buildings: { url: "./models/Buildings3D/", visible: true, },
    position: { x:651250, y:6861250, z:0 , CRS: 'EPSG:2154'},
};

// https://epsg.io/
itowns.proj4.defs("EPSG:2154","+proj=lcc +lat_1=49 +lat_2=44 +lat_0=46.5 +lon_0=3 +x_0=700000 +y_0=6600000 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs");

itowns.gfxEngine.setCamera(globeView.camera.camera3D);
itowns.gfxEngine.setScene(globeView.scene);

*/

/*
var coord1 = itowns.proj4(options.position.CRS, "EPSG:4326", [options.position.x, options.position.y])
var coord2 = new itowns.Coordinates("EPSG:4326", coord1[0], coord1[1], 40);
console.log('1', coord2.latitude(), coord2.longitude(), 40);
var coord3 = coord2.as('EPSG:4978');
console.log('2', coord3.x(), coord3.y(), coord3.z());
/*
itowns.gfxEngine.setZero(options.position);

if (!itowns.Cartography3D.isCartoInitialized()){
    itowns.Cartography3D.initCarto3D(options.buildings);
};

*/ 

/*
globeView.controls.setCameraTargetGeoPosition({longitude:60, latitude:40}, true);
*/