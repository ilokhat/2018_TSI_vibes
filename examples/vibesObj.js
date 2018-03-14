/* global itowns, document, GuiTools */
// # Simple Globe viewer

// Define initial camera position
// Coordinate can be found on https://www.geoportail.gouv.fr/carte
// setting is "coordonnée geographiques en degres decimaux"

// Position near Gerbier mountain.
//Tour Eiffel
var positionOnGlobe = { longitude: 2.294485, latitude: 48.85828, altitude: 2000 };
//Blain
//var positionOnGlobe = { longitude: -1.760930, latitude: 47.487623, altitude: 2000 };
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
    var coord = new itowns.Coordinates('EPSG:4326', 2.294485, 48.85828, 1417);

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

exports.loadOBJ = function loadOBJ(url) {

    // obj loader
    var loader = new itowns.THREE.OBJLoader();

    loader.load(
        url,
        //callback
        function (mesh) {

            // building coordinate
            var coord = new itowns.Coordinates('EPSG:4326', 2.294485, 48.85828, 35);

            var objID = globeView.mainLoop.gfxEngine.getUniqueThreejsLayer();

            mesh.position.copy(coord.as(globeView.referenceCrs).xyz());
            // align up vector with geodesic normal
            mesh.lookAt(mesh.position.clone().add(coord.geodesicNormal));
            // user rotate building to align with ortho image
            //mesh.rotateZ(-Math.PI * 0.2);
            mesh.rotateX(Math.PI/2);
            mesh.rotateY(Math.PI/4);
            mesh.scale.set(300, 300, 300);

            // set camera's layer to do not disturb the picking
            mesh.traverse(function _(obj) { obj.layers.set(objID); });
            globeView.camera.camera3D.layers.enable(objID);


            for (var i = 0; i < mesh.children.length; i++) {
                let material = new THREE.MeshPhongMaterial(
                    { 
                        transparent : true,
                        color       : new THREE.Color(getRandomColor()),
                        side        : THREE.DoubleSide

                    });
                mesh.children[i].material = material;
                mesh.children[i].castShadow = true;

                /*
                var edges = new THREE.EdgesGeometry(mesh.children[i].geometry);
                var line = new THREE.LineSegments(edges, new THREE.LineBasicMaterial({ color: 0xffffff }));
                line.position.copy(coord.as(globeView.referenceCrs).xyz());
                // align up vector with geodesic normal
                line.lookAt(mesh.position.clone().add(coord.geodesicNormal));
                line.rotateX(Math.PI/2);
                line.rotateY(Math.PI/4);
                line.scale.set(300, 300, 300);
                line.updateMatrixWorld();

                globeView.scene.add(line);
                globeView.notifyChange(true);
                */
            }

            // update coordinate of the mesh
            mesh.updateMatrixWorld();
            console.log(mesh);    
            
            globeView.scene.add(mesh);
            globeView.notifyChange(true);

            addToGUI(mesh);
            
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


function addToGUI(mesh) {
    let parentFolder = menuGlobe.gui.addFolder(mesh.materialLibraries[0].substring(0,mesh.materialLibraries[0].length - 4));
    
    parentFolder.add({save : function(){saveVibes(mesh)}}, "save");
    addVibes(mesh,parentFolder);
    addAllOpacity(mesh,parentFolder);
    addAllColor(mesh,parentFolder);
    addAllEmissive(mesh,parentFolder);


    for (let i = 0; i < mesh.children.length; i++) {
       let folder = parentFolder.addFolder(mesh.children[i].name);
       addOpacity(mesh,folder,i); 
       addColor(mesh,folder,i);
       addEmissive(mesh,folder,i);
       addSpecular(mesh,folder,i);
       addShininess(mesh,folder,i);
       addTexture(mesh,folder,i);

       //folder.domElement.lastChild.children[folder.domElement.lastChild.children.length-1].addEventListener("click", function(){


        //textureLoader(mesh,folder)
    //}, false);
    }
}
function addVibes(mesh,folder) {
    folder.add({load : function(){
    var button = document.createElement("input");
    button.setAttribute('type','file');
    button.addEventListener("change", function () {
        readVibes(button.files[0],mesh);
    } , false);
    button.click();
    }}, "load");
}


function readVibes(file,mesh) {
    console.log(file);
    let reader = new FileReader();
    reader.addEventListener('load', () => {
        loadVibes(reader.result,mesh);
    }, false);
    reader.readAsText(file);
}


function loadVibes(file,mesh) {
    let json = JSON.parse(file);
    console.log(json);
    for (var i = 0; i < json.styles.length; i++) {
        for (var j = 0; j < mesh.children.length; j++) {

            if (mesh.children[j].name == json.styles[i].name) {
                    mesh.children[i].material.opacity   = json.styles[i].opacity;
                    mesh.children[i].material.color     = new THREE.Color(json.styles[i].color);
                    mesh.children[i].material.emissive  = new THREE.Color(json.styles[i].emissive);
                    mesh.children[i].material.specular  = new THREE.Color(json.styles[i].specular);
                    mesh.children[i].material.shininess = json.styles[i].shininess;
            }

        }            
    }
    globeView.notifyChange(true);
}


function addAllOpacity(mesh,folder) {
    folder.add({opacity : 1 }, 'opacity',0 , 1).name("opacity").onChange(
        function changeOpacity(value) {
            for (var i = 0; i < mesh.children.length; i++) {
                mesh.children[i].material.opacity = value;
            }
            globeView.notifyChange(true);
        }
    );
}

function addAllColor(mesh,folder) {
    folder.addColor({color : "#ffae23" }, 'color').name("color").onChange(
        function changeColor(value) {
            for (var i = 0; i < mesh.children.length; i++) {
                mesh.children[i].material.color = new THREE.Color( value );
            }
            globeView.notifyChange(true);
        }
    );
}

function addAllEmissive(mesh,folder) {
    folder.addColor({emissive : "#ffae23" }, 'emissive').name("emissive").onChange(
        function changeColor(value) {
            for (var i = 0; i < mesh.children.length; i++) {
                mesh.children[i].material.emissive = new THREE.Color( value );
            }
            globeView.notifyChange(true);
        }
    );
}

function addTexture(mesh,folder,index) {
    folder.add({loadTexture : function(){
    var button = document.createElement("input");
    button.setAttribute('type','file');

    button.addEventListener("change", function () {
        readTexture(button.files[0],mesh,index);
    } , false);
    button.click();
    }}, "loadTexture");
}


function readTexture(file,mesh,index) {
    console.log(file);
    let reader = new FileReader();
    reader.addEventListener('load', () => {
        loadTexture(reader.result,mesh,index);
    }, false);
    reader.readAsDataURL(file);
}


function loadTexture(data,mesh,index) {
    var texture = new THREE.TextureLoader().load( data );
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    console.log(index);
    console.log(mesh);
    mesh.children[index].material = new THREE.MeshPhongMaterial({map : texture});
    globeView.notifyChange(true);
}


function addOpacity(mesh,folder,index) {
    folder.add({opacity : 1 }, 'opacity',0 , 1).name("opacity").onChange(
        function changeOpacity(value) {
            mesh.children[index].material.opacity = value;
            globeView.notifyChange(true);
        }
    );
}

function addColor(mesh,folder,index) {
    folder.addColor({color : "#ffae23" }, 'color').name("color").onChange(
        function changeColor(value) {
            mesh.children[index].material.color = new THREE.Color( value );
            globeView.notifyChange(true);
        }
    );
}

function addEmissive(mesh,folder,index) {
    folder.addColor({emissive : "#ffae23" }, 'emissive').name("emissive").onChange(
        function changeColor(value) {
            mesh.children[index].material.emissive = new THREE.Color( value );
            globeView.notifyChange(true);
        }
    );
}


function addSpecular(mesh,folder,index) {
    folder.addColor({specular : "#ffae23" }, 'specular').name("specular").onChange(
        function changeColor(value) {
            mesh.children[index].material.specular = new THREE.Color( value );
            globeView.notifyChange(true);
        }
    );
}

function addShininess(mesh,folder,index) {
    folder.add({shininess : 30 }, 'shininess',0 , 100).name("shininess").onChange(
    function changeOpacity(value) {
        mesh.children[index].material.shininess = value;
        globeView.notifyChange(true);
    }
);
}


function saveVibes(mesh){
    console.log(mesh);
    let vibes = { "styles" : [] };
    for (var i = 0; i < mesh.children.length; i++) {
        vibes.styles.push({
            "name"     : mesh.children[i].name,
            "opacity"  : mesh.children[i].material.opacity,
            "color"    : mesh.children[i].material.color.getHex(),
            "emissive" : mesh.children[i].material.emissive.getHex(),
            "specular" : mesh.children[i].material.specular.getHex(),
            "shininess": mesh.children[i].material.shininess  
        })
    }
    console.log(vibes);

    let blob = new Blob([JSON.stringify(vibes)], {type: "text/plain;charset=utf-8"});
        itowns.FILE.saveAs(blob, mesh.materialLibraries[0].substring(0,mesh.materialLibraries[0].length -4) + ".vibes");
    }



console.log(itowns.FILE);


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
        //console.log(reader.result);
        exports.loadOBJ(reader.result);
    }, false);

    reader.readAsDataURL(file);
  }


window.onload = () => initListener();


// Listen for globe full initialisation event
globeView.addEventListener(itowns.GLOBE_VIEW_EVENTS.GLOBE_INITIALIZED, function init() {
    globeView.controls.setOrbitalPosition({ heading: 180, tilt: 60 });
});

