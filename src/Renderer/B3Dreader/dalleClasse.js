/**
 * Edit On: april 2018
 * Class: dalleClasse
 * Description:  Part extracted from 'itowns-legacy' {@link https://github.com/iTowns/itowns-legacy}
 * project VIBES
 * author: Adouni, Bouchaour, Grégoire, Mathelier, Nino, Ouhabi, Schlegel
 */

import * as THREE from 'three';
import B3DLoader from './lib/B3DLoader';
import Shader from './Shader';
import BufferGeometryUtils from './lib/postprocessing/BufferGeometryUtils';
import DDSLoader from './lib/DDSLoader';

function dalleClasse() {
    this.dataURL = '';
    this.name = '';
    this.path = '';
    this.LOBLevel = {
        level: 0,
        urlDS3: '',
        urlDDS: '',
        urlDDS16: '',
    };
    this.textureType = '.dds';
    this.dalleOpacity = 1.0;
    this.cachedMaterials = {
        loadMaterials: true,
        materials: [],
        textures: [],
        imgUrlMaterial: [],
        urls: [],
    };
    this.geometry = new THREE.Geometry();
    this.materialsName = [];
    this.mesh = null;
    this.globalObject = new THREE.Group();
    this.shaderMat = null;
    this.texture1 = null;
    this.racineFile = '';// Version4LODS';  // Version4LODS_o for jpg
}

dalleClasse.prototype.setTextureType = function setTextureType(t) {
    this.textureType = t;
};

dalleClasse.prototype.addMaterialsName = function addMaterialsName(v) {
    this.materialsName.push(v);
};

dalleClasse.prototype.getIndexMaterialName = function getIndexMaterialName(v) {
    return this.materialsName.indexOf(v);
};

dalleClasse.prototype.setNamePath = function setNamePath(name) {
    this.path = 'EXPORT_'.concat(name, '/', 'export-3DS', '/');
    this.name = name;
};

dalleClasse.prototype.isMaterialsLoaded = function isMaterialsLoaded() {
    return this.cachedMaterials.loadMaterials;
};

dalleClasse.prototype.setMaterialsLoaded = function setMaterialsLoaded(v) {
    this.cachedMaterials.loadMaterials = v;
};

dalleClasse.prototype.addTextureURL = function addTextureURL(url) {
    this.cachedMaterials.urls.push(url);
};

dalleClasse.prototype.setLoDLevel = function setLoDLevel(v) {
    this.LOBLevel.level = v;
};

dalleClasse.prototype.getLoDLevel = function getLoDLevel() {
    return this.LOBLevel.level;
};

// changed
dalleClasse.prototype.showDalleInScene = function showDalleInScene() {
    // Create mesh for all materials with BufferGeomtry
    var faces = this.geometry.faces;
    var faceVertexUvs = this.geometry.faceVertexUvs;
    var geom2 = new THREE.Geometry();
    geom2.vertices = this.geometry.vertices;
    geom2.faces = [];
    geom2.faceVertexUvs[0] = [];
    for (var i = 0; i < faces.length; i++) {
        var face = faces[i];
        var faceUV = faceVertexUvs[0][i];
        geom2.faces.push(face);
        geom2.faceVertexUvs[0].push(faceUV);
    }
    // create the final Geometry
    var bufferGeometry = BufferGeometryUtils.fromGeometry(geom2);
    // new material for the mesh
    var mat = new THREE.MeshPhongMaterial({ color: 0x2194ce, emissive: 0xbb2727, specular: 0x111111, side: THREE.DoubleSide });
    mat.needsUpdate = true;
    // creat the mesh and add it on the Group
    var mesh = new THREE.Mesh(bufferGeometry, mat);
    mesh.name = this.name;
    this.globalObject.add(mesh);
    this.globalObject.updateMatrixWorld();
    // apply the callback function
    this.doAfter(this.globalObject, this.isLast, this.modelLoader);
};

dalleClasse.prototype.affectTexture = function affectTexture(shaderMat, numMaterial, numTexture) {
    var urlTexture = this.cachedMaterials.urls[numMaterial];
    var texture;
    THREE.ImageUtils.crossOrigin = 'use-credentials';   // No anonymous to keep ability to access password protected files (behind dir Viewer)
    if (this.textureType == '.dds') {
        var loader = new DDSLoader();
        texture = loader.load(urlTexture, () => {
            shaderMat.uniforms.u_textures.value[numTexture] = texture;   // onLoad function
            texture.dispose();
        });
    } else {
        texture = THREE.ImageUtils.loadTexture(urlTexture, null, () => {
            // 'http://www.itowns.fr/images/textures/quoc.png'
            shaderMat.uniforms.u_textures.value[numTexture] = texture;   // onLoad function
            texture.dispose();
        });
        texture.generateMipmaps = true;
    }
    texture.minFilter = THREE.LinearFilter;
    texture.magFilter = THREE.LinearFilter;
    texture.anisotropy = 4;
    texture.needsUpdate = true;
    texture.name = numMaterial;
};
dalleClasse.prototype.createShaderForBati = function createShaderForBati() {
    var uniformsBati = {
        alpha: { type: 'f', value: this.dalleOpacity },
        textureJPG: { type: 'i', value: this.textureType == '.jpg' },
        u_textures: {
            type: 'tv',
            value: [
                new THREE.Texture(), new THREE.Texture(), new THREE.Texture(), new THREE.Texture(), new THREE.Texture(),
                new THREE.Texture(), new THREE.Texture(), new THREE.Texture(), new THREE.Texture(), new THREE.Texture(),
                new THREE.Texture(), new THREE.Texture(), new THREE.Texture(), new THREE.Texture(), new THREE.Texture(),
                new THREE.Texture()],
        },
    };
    // create the shader material
    var shaderMat = new THREE.ShaderMaterial({
        uniforms: uniformsBati,
        vertexShader: Shader.shaderBati3DVS.join('\n'), // Shader.shaders['shaderBati3D.vs'],
        fragmentShader: Shader.shaderBati3DFS.join('\n'), // Shader.shaders['shaderBati3D.fs'],
        side: THREE.DoubleSide,
        transparent: true,
    });
    return shaderMat;
};
dalleClasse.prototype.emptyGeometryCache = function emptyGeometryCache() {
    // suppose garbage collector work well, we just
    // déreference memory buffer!
    this.geometry = new THREE.Geometry();
};
dalleClasse.prototype.emptyMaterialsCache = function emptyMaterialsCache() {
    this.cachedMaterials.materials = [];
    this.setMaterialsLoaded(true);
};

dalleClasse.prototype.computeUrlLoBLevel = function computeUrlLoBLevel() {
    if (this.textureType == '.dds') {
        switch (this.getLoDLevel()) {
            case 0:
                this.LOBLevel.urlDS3 = this.dataURL.concat(this.path, 'ZoneAExporter.3DS');
                this.LOBLevel.urlDDS = this.textureType;
                break;
            case 2:
                this.LOBLevel.urlDS3 = this.dataURL.concat(this.path, 'ZoneAExporter-0.b3d');
                this.LOBLevel.urlDDS = this.textureType;
                this.LOBLevel.urlDDS16 = '-16'.concat(this.textureType);
                break;
            case 4:
                this.LOBLevel.urlDS3 = this.dataURL.concat(this.path, 'ZoneAExporter-1.b3d');
                this.LOBLevel.urlDDS = '-4'.concat(this.textureType);
                this.LOBLevel.urlDDS16 = '-16'.concat(this.textureType);
                break;
            case 8:
                this.LOBLevel.urlDS3 = this.dataURL.concat(this.path, 'ZoneAExporter-2.b3d');
                this.LOBLevel.urlDDS = '-8'.concat(this.textureType);
                this.LOBLevel.urlDDS16 = '-16'.concat(this.textureType);
                break;
            case 16:
                this.LOBLevel.urlDS3 = this.dataURL.concat(this.path, 'ZoneAExporter-3.b3d'); // 'images/Bati3D/' + this.path + 'ZoneAExporter-3.b3d';
                this.LOBLevel.urlDDS = '-16'.concat(this.textureType);
                this.LOBLevel.urlDDS16 = '-16'.concat(this.textureType);
                break;
            default:
                // console.log('Cartography3D: does not support this level');
                break;
        }
    } else {
        switch (this.getLoDLevel()) {
            case 0:
                this.LOBLevel.urlDS3 = this.dataURL.concat(this.path, 'ZoneAExporter.3DS');
                this.LOBLevel.urlDDS = this.textureType;
                break;
            case 2:
                this.LOBLevel.urlDS3 = this.dataURL.concat(this.path, 'ZoneAExporter-0.b3d');
                this.LOBLevel.urlDDS = this.textureType;
                this.LOBLevel.urlDDS16 = this.textureType;
                break;
            case 4:
                this.LOBLevel.urlDS3 = this.dataURL.concat(this.path, 'ZoneAExporter-1.b3d');
                this.LOBLevel.urlDDS = this.textureType;
                this.LOBLevel.urlDDS16 = this.textureType;
                break;
            case 8:
                this.LOBLevel.urlDS3 = this.dataURL.concat(this.path, 'ZoneAExporter-2.b3d');
                this.LOBLevel.urlDDS = this.textureType;
                this.LOBLevel.urlDDS16 = this.textureType;
                break;
            case 16:
                this.LOBLevel.urlDS3 = this.dataURL.concat(this.path, 'ZoneAExporter-3.b3d');// 'images/Bati3D/' + this.path + 'ZoneAExporter-3.b3d';
                this.LOBLevel.urlDDS = this.textureType;
                this.LOBLevel.urlDDS16 = this.textureType;
                break;
            default:
                // console.log('Cartography3D: does not support this level');
                break;
        }
    }
};
dalleClasse.prototype.getUrlDSFile = function getUrlDSFile() {
    return this.LOBLevel.urlDS3;
};

dalleClasse.prototype.getUrlDDSFile = function getUrlDDSFile() {
    return this.LOBLevel.urlDDS;
};

dalleClasse.prototype.getUrlDDS16 = function getUrlDDS16() {
    return this.LOBLevel.urlDDS16;
};
dalleClasse.prototype.load = function load() {
    this.computeUrlLoBLevel();
    var loader = new B3DLoader(this);
    loader.decimalPrecision = 3;
};
dalleClasse.prototype.setVisible = function setVisible(v) {
    this.globalObject.traverse((object) => { object.visible = v; });
};

dalleClasse.prototype.parseB3DObject = function parseB3DObject(instantB3D) {
    var self = this;
    var obj = instantB3D._cur_obj;
    var urlDDS = self.getUrlDDSFile();
    // add vertices and faces
    this.geometry.vertices = obj.verts;
    this.geometry.faces = obj.indices; // face index
    // load texture one time at begining
    var materialName;
    if (self.isMaterialsLoaded()) {
        var mat = null;
        for (materialName in instantB3D._materials) {
            if (Object.prototype.hasOwnProperty.call(instantB3D._materials, materialName)) {
                mat = instantB3D._materials[materialName];
                if (mat.colorMap) {
                    var imgUrl = this.dataURL.concat(this.racineFile, '/', self.path, mat.colorMap.url.split('.')[0], urlDDS);
                    self.addTextureURL(imgUrl);
                    self.addMaterialsName(materialName);
                }
            }
        }
        self.setMaterialsLoaded(false);
    }
    // add uv texture if exist
    for (var i = 0; i < obj.uvsIndexes.length; i++) {
        this.geometry.faceVertexUvs[0].push([
            obj.uvs[obj.uvsIndexes[i].x],
            obj.uvs[obj.uvsIndexes[i].y],
            obj.uvs[obj.uvsIndexes[i].z],
        ]);
    }
    var materialFaces = obj.materialFaces;
    for (materialName in materialFaces) {
        if (Object.prototype.hasOwnProperty.call(materialFaces, materialName)) {
            var ind = self.getIndexMaterialName(materialName);
            var indFaces = materialFaces[materialName];
            for (var j = 0; j < indFaces.length; j++) {
                this.geometry.faces[indFaces[j]].materialIndex = ind;
            }
        }
    }
    this.geometry.computeFaceNormals();
    this.geometry.computeVertexNormals();
};

export default dalleClasse;
