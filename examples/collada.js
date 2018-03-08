/* global itowns, document, GuiTools */
// # Simple Globe viewer

// Define initial camera position
// Coordinate can be found on https://www.geoportail.gouv.fr/carte
// setting is "coordonnée geographiques en degres decimaux"

// Position near Gerbier mountain.
var positionOnGlobe = { longitude: 4.21655, latitude: 44.84415, altitude: 2000 };

// `viewerDiv` will contain iTowns' rendering area (`<canvas>`)
var viewerDiv = document.getElementById('viewerDiv');

// Instanciate iTowns GlobeView*
var globeView = new itowns.GlobeView(viewerDiv, positionOnGlobe);

var menuGlobe = new GuiTools('menuDiv');

var promiseElevation = [];

menuGlobe.view = globeView;


var model;

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

exports.view = globeView;
exports.initialPosition = positionOnGlobe;

exports.loadCollada = function loadCollada(url) {
    var mesh;
    // loading manager
    var loadingManager = new itowns.THREE.LoadingManager(function _addModel() {
        globeView.scene.add(mesh);
        globeView.notifyChange(true);
    });
    // collada loader
    var loader = new itowns.THREE.ColladaLoader(loadingManager);

    // building coordinate
    var coord = new itowns.Coordinates('EPSG:4326', 4.2165, 44.844, 1417);

    loader.load(url, function col(collada) {
        var colladaID = globeView.mainLoop.gfxEngine.getUniqueThreejsLayer();
        mesh = collada.scene;
        mesh.position.copy(coord.as(globeView.referenceCrs).xyz());
        // align up vector with geodesic normal
        mesh.lookAt(mesh.position.clone().add(coord.geodesicNormal));
        // user rotate building to align with ortho image
        mesh.rotateZ(-Math.PI * 0.2);
        mesh.scale.set(1.2, 1.2, 1.2);

        // set camera's layer to do not disturb the picking
        mesh.traverse(function _(obj) { obj.layers.set(colladaID); });
        globeView.camera.camera3D.layers.enable(colladaID);

        // update coordinate of the mesh
        mesh.updateMatrixWorld();
    });
};

exports.loadOBJ =function loadOBJ(url) {


    // obj loader
    var loader = new itowns.THREE.OBJLoader();

    loader.load(
        url,
        //callback
        function (mesh) {

            // building coordinate
            var coord = new itowns.Coordinates('EPSG:4326', 4.2165, 44.844, 1417);

            var objID = globeView.mainLoop.gfxEngine.getUniqueThreejsLayer();

            mesh.position.copy(coord.as(globeView.referenceCrs).xyz());
            // align up vector with geodesic normal
            mesh.lookAt(mesh.position.clone().add(coord.geodesicNormal));
            // user rotate building to align with ortho image
            mesh.rotateZ(-Math.PI * 0.2);
            mesh.rotateX(Math.PI/2);
            mesh.scale.set(120, 120, 120);

            // set camera's layer to do not disturb the picking
            mesh.traverse(function _(obj) { obj.layers.set(objID); });
            globeView.camera.camera3D.layers.enable(objID);

            
            for (var i = 0; i < mesh.children.length; i++) {
                let material = new THREE.MeshPhongMaterial( { color: getRandomColor()} );
                mesh.children[i].material = material;
                mesh.children[i].material.transparent = true;
            }
            
            
            model = mesh;

            // update coordinate of the mesh
            model.updateMatrixWorld();
            console.log(model);    

            globeView.scene.add(model);
            globeView.notifyChange(true);

            
        },
        // called when loading is in progresses
        function ( xhr ) {

            console.log( ( xhr.loaded / xhr.total * 100 ) + '% loaded' );

        },
        // called when loading has errors
        function ( error ) {

            console.log( 'An error happened' );
            console.log(error);

        });

}

function getRandomColor() {
  var letters = '0123456789ABCDEF';
  var color = '#';
  for (var i = 0; i < 6; i++) {
    color += letters[Math.floor(Math.random() * 16)];
  }
  return color;
}

menuGlobe.gui.add({opacity : 1 }, 'opacity',0 , 1).name("opacity").onChange(
    function changeOpacity(value) {

        console.log(model);


        for (var i = 0; i < model.children.length; i++) {
            model.children[i].material.opacity = value;
            model.children[i].material.needsUpdate = true;
        }

        globeView.notifyChange(true);
    }
);

menuGlobe.gui.addColor({color : "#ffae23" }, 'color').name("color").onChange(
    function changeColor(value) {

        console.log(model);


        for (var i = 0; i < model.children.length; i++) {
            model.children[i].material.color = new THREE.Color( value );
            model.children[i].material.needsUpdate = true;
        }

        globeView.notifyChange(true);
    }
);

menuGlobe.gui.addColor({emissive : "#ffae23" }, 'emissive').name("emissive").onChange(
    function changeColor(value) {

        console.log(model);


        for (var i = 0; i < model.children.length; i++) {
            model.children[i].material.emissive = new THREE.Color( value );
            model.children[i].material.needsUpdate = true;
        }

        globeView.notifyChange(true);
    }
);

menuGlobe.gui.addColor({specular : "#ffae23" }, 'specular').name("specular").onChange(
    function changeColor(value) {

        console.log(model);


        for (var i = 0; i < model.children.length; i++) {
            model.children[i].material.specular = new THREE.Color( value );
            model.children[i].material.needsUpdate = true;
        }

        globeView.notifyChange(true);
    }
);

menuGlobe.gui.add({shininess : 30 }, 'shininess',0 , 100).name("shininess").onChange(
    function changeOpacity(value) {

        console.log(model);


        for (var i = 0; i < model.children.length; i++) {
            model.children[i].material.shininess = value;
            model.children[i].material.needsUpdate = true;
        }

        globeView.notifyChange(true);
    }
);


// Listen for globe full initialisation event
globeView.addEventListener(itowns.GLOBE_VIEW_EVENTS.GLOBE_INITIALIZED, function init() {
    globeView.controls.setOrbitalPosition({ heading: 180, tilt: 60 });
});
