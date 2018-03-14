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
var line;



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
            //mesh.rotateZ(-Math.PI * 0.2);
            mesh.rotateX(Math.PI/2);
            mesh.rotateY(Math.PI/2);
            mesh.scale.set(120, 120, 120);

            // set camera's layer to do not disturb the picking
            mesh.traverse(function _(obj) { obj.layers.set(objID); });
            globeView.camera.camera3D.layers.enable(objID);


            for (var i = 0; i < mesh.children.length; i++) {
                let material = new THREE.MeshPhongMaterial( { color: getRandomColor()} );
                mesh.children[i].material = material;
                mesh.children[i].material.transparent = true;
                mesh.children[i].castShadow = true;

                var edges = new THREE.EdgesGeometry(mesh.children[i].geometry);
                line = new THREE.LineSegments(edges, new THREE.LineBasicMaterial({ color: 0xffffff }));
                line.position.copy(coord.as(globeView.referenceCrs).xyz());
                // align up vector with geodesic normal
                line.lookAt(mesh.position.clone().add(coord.geodesicNormal));
                line.rotateX(Math.PI/2);
                line.rotateY(Math.PI/2);
                line.scale.set(120, 120, 120);
                line.updateMatrixWorld();

                globeView.scene.add(line);
                globeView.notifyChange(true);
            }


            model = mesh;

            // update coordinate of the mesh
            model.updateMatrixWorld();
            console.log(model);

            globeView.scene.add(model);
            globeView.notifyChange(true);

            addGUI();

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


function addGUI() {
  let parentFolder = menuGlobe.gui.addFolder(line.materialLibraries[0].substring(0,line.materialLibraries[0].length - 4));
  params = {
    trait: '',
  }
  menuGlobe.gui.add(params, 'trait', ["glass", "brush", "paint-brush", "two", "scribble", "light", "wavy", "dotted", "thick", "fast"]).name("edges").onChange(
    function(value) { createMaterial(value, line);
  });
  addColorEdge();
    for (var i = 0; i < model.children.length; i++) {
       let folder = menuGlobe.gui.addFolder(model.children[i].name);
       addOpacity(folder,i);
       addColor(folder,i);
       addEmissive(folder,i);
       addSpecular(folder,i);
       addShininess(folder,i);
       addTexture(folder,i);
    }
}

function addColorEdge() {
    menuGlobe.gui.addColor({color : "#ffae23" }, 'color').name("color").onChange(
        function changeColor(value) {
          for(var i = 0; i < line.children.length; i++){
            line[i].material.color = new THREE.Color( value );
            line[i].material.needsUpdate = true;
          }
            globeView.notifyChange(true);
        }
    );
}

function changeTexture(value, array){
  var textureMaterial = new THREE.MeshBasicMaterial( {
					map: null,
					color: 0xffffff,
					shading: THREE.SmoothShading
				} );

  var textureLoader = new THREE.TextureLoader();
    textureLoader.load( "./textures/"+value+".jpg", function( map ) {
        map.wrapS = THREE.RepeatWrapping;
        map.wrapT = THREE.ReaddTexturepeatWrapping;
        map.anisotropy = 4;
        map.repeat.set( 0.1, 0.1 );
        textureMaterial.side = THREE.DoubleSide;
        textureMaterial.map = map;
        textureMaterial.needsUpdate = true;
    } );

      array.material = textureMaterial;
      array.material.needsUpdate = true;
      globeView.notifyChange(true);
    }


function addTexture(folder, index){
  params = {
    texture: '',
  }
  //folder.remember(params);
  folder.add(params, 'texture', [ "", "bricks", "wall", "stone-wall", "roof", "water"]).name("texture").onChange(
    function(value) { changeTexture(value, model.children[index]); });
}


function addOpacity(folder,index) {
    folder.add({opacity : 1 }, 'opacity',0 , 1).name("opacity").onChange(
        function changeOpacity(value) {
            model.children[index].material.opacity = value;
            model.children[index].material.needsUpdate = true;
            globeView.notifyChange(true);
        }
    );
}

function addColor(folder,index) {
    folder.addColor({color : "#ffae23" }, 'color').name("color").onChange(
        function changeColor(value) {
            model.children[index].material.color = new THREE.Color( value );
            model.children[index].material.needsUpdate = true;
            globeView.notifyChange(true);
        }
    );
}

function addEmissive(folder,index) {
    folder.addColor({emissive : "#ffae23" }, 'emissive').name("emissive").onChange(
        function changeColor(value) {
            model.children[index].material.emissive = new THREE.Color( value );
            model.children[index].material.needsUpdate = true;
            globeView.notifyChange(true);
        }
    );
}


function addSpecular(folder,index) {
    folder.addColor({specular : "#ffae23" }, 'specular').name("specular").onChange(
        function changeColor(value) {
            model.children[index].material.specular = new THREE.Color( value );
            model.children[index].material.needsUpdate = true;
            globeView.notifyChange(true);
        }
    );
}

function addShininess(folder,index) {
    folder.add({shininess : 30 }, 'shininess',0 , 100).name("shininess").onChange(
    function changeOpacity(value) {
        model.children[index].material.shininess = value;
        model.children[index].material.needsUpdate = true;
        globeView.notifyChange(true);
    }
);
}

function getSourceSynch(url) {
  var req = new XMLHttpRequest();
    req.open("GET", url, false);
    req.send();
    return req.responseText;
}

function getMethod(shader){

  var text = getSourceSynch('./methods/'+shader+'.json');
  var method = JSON.parse(text);
  return method;
}

//crée le material texturé associé aux arêtes sketchy
function createMaterial(value, array){
    var color = new THREE.Color();
    var vertex = getSourceSynch("./shaders/sketchy_strokes_vert.glsl");
    var headVertex = getSourceSynch("./shaders/sketchy_strokes_pars_vert.glsl");
    var fragment = getSourceSynch("./shaders/sketchy_strokes_frag.glsl");
    var method = getMethod("sketchy_strokes");
    var uniforms = {};
    // for (param in method.uniforms){
		// 			uniforms[param] = method.uniforms[param];
		// 			uniforms[param].value = eval(method.uniforms[param].value);
		// 		}

  	//Materiel appliqué à toutes les géométries de la couche
  	var materialEdge = new THREE.ShaderMaterial( {
    uniforms: uniforms,
    vertexShader:   [
            "attribute vec3  position2;",
            "uniform   vec2  resolution;"

            +headVertex+

            "void main()",
            "{",
            "gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0);",
            "vec4 Position2 = projectionMatrix *modelViewMatrix *vec4(position2,1.0);",

              "vec2 normal = normalize((gl_Position.xy/gl_Position.w - Position2.xy/Position2.w) * resolution); // * 0.5",
              "normal = uv.x * uv.y * vec2(-normal.y, normal.x);",

              "if (length((gl_Position.xyz+Position2.xyz)/2.0)>25.0){gl_Position.xy += 25.0*(width/length((gl_Position.xyz+Position2.xyz)/2.0)) * gl_Position.w * normal * 2.0 / resolution;}",
              "else {gl_Position.xy += width * gl_Position.w * normal * 2.0 / resolution;}"
              + vertex +
            "}"
      ].join("\n"),
    fragmentShader: fragment

  });

  var texture = new THREE.TextureLoader();
    texture.load( "./strokes/"+value+".png", function( map ) {
        map.wrapS = THREE.RepeatWrapping;
        map.wrapT = THREE.ReaddTexturepeatWrapping;
        map.anisotropy = 4;
        map.repeat.set( 0.1, 0.1 );
        materialEdge.side = THREE.DoubleSide;
        materialEdge.map = map;
        materialEdge.needsUpdate = true;
    } );

    array.material = materialEdge;
    array.material.needsUpdate = true;
    globeView.notifyChange(true);
}


menuGlobe.addGUI("save", save);

function save(){

    var blob = new Blob([JSON.stringify(model.children[0].material)], {type: "text/plain;charset=utf-8"});
    itowns.FILE.saveAs(blob, "style.vibes");
}


console.log(itowns.FILE);




// Listen for globe full initialisation event
globeView.addEventListener(itowns.GLOBE_VIEW_EVENTS.GLOBE_INITIALIZED, function init() {
    globeView.controls.setOrbitalPosition({ heading: 180, tilt: 60 });
});
