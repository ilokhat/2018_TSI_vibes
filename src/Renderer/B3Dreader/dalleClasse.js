import * as THREE from 'three';
import gfxEngine from './gfxEngine';
import B3DLoader from './lib/B3DLoader';
import Shader from './Shader';
import BufferGeometryUtils from './lib/postprocessing/BufferGeometryUtils';
import DDSLoader from './lib/DDSLoader';

function dalleClasse(glob) {
    this.dataURL = '';
    this.name = '';
    this.path = '';
    this.pivot = new THREE.Vector3(0, 0, 0);
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
    this.globalObject = new THREE.Object3D();
    this.shaderMat = null;
    this.texture1 = null;
    this.racineFile = '';// Version4LODS';  // Version4LODS_o for jpg
    this.glob = glob;
}

dalleClasse.prototype.setDalleZeroPivot = function setDalleZeroPivot(v) {
    // this is zero
    this.pivot = v;
};

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

dalleClasse.prototype.addDalleMaterials = function addDalleMaterials(mat) {
    this.cachedMaterials.materials.push(mat);
};

dalleClasse.prototype.addTextureURL = function addTextureURL(url) {
    this.cachedMaterials.urls.push(url);
};

dalleClasse.prototype.addTextureAlex = function addTextureAlex(texture) {
    this.cachedMaterials.textures.push(texture);
};

dalleClasse.prototype.mergeObject = function mergeObject(object) {
    THREE.GeometryUtils.merge(this.geometry, object);
};

dalleClasse.prototype.mergeGeometry = function mergeGeometry(geom) {
    this.geometry.merge(geom);
};

dalleClasse.prototype.checkDoubleVertices = function checkDoubleVertices() {
    this.geometry.mergeVertices();
};

dalleClasse.prototype.setLoDLevel = function setLoDLevel(v) {
    this.LOBLevel.level = v;
};

dalleClasse.prototype.getLoDLevel = function getLoDLevel() {
    return this.LOBLevel.level;
};

dalleClasse.prototype.getDalleGemetry = function getDalleGemetry() {
    return this.geometry;
};

dalleClasse.prototype.showDalleInScene = function showDalleInScene() {
    // Create mesh for each n material with BufferGeomtry and specific shader material
    var faces = this.geometry.faces;
    var faceVertexUvs = this.geometry.faceVertexUvs;
    var nbMaterials = this.cachedMaterials.urls.length;
    var nbTexturesInShader = 16;
    var geom2 = new THREE.Geometry();
    var n;
    for (n = 0; n <= nbMaterials; n += nbTexturesInShader) {
        geom2.vertices = this.geometry.vertices;
        geom2.faces = [];
        geom2.faceVertexUvs[0] = [];
        for (var i = 0; i < faces.length; i++) {
            var face = faces[i];
            var faceUV = faceVertexUvs[0][i];
            if (face.materialIndex >= n && face.materialIndex < n + nbTexturesInShader) {
                geom2.faces.push(face);
                geom2.faceVertexUvs[0].push(faceUV);
            }
        }
        var bufferGeometry = BufferGeometryUtils.fromGeometry(geom2, { indice: n });
        var mat = this.createShaderForBati();
        for (var a = 0; a < nbTexturesInShader; ++a) {
            if (n + a < nbMaterials) this.affectTexture(mat, n + a, a);
        }
        var mesh = new THREE.Mesh(bufferGeometry, mat);
        this.globalObject.add(mesh);
    }
    gfxEngine.addToScene(this.globalObject);
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

dalleClasse.prototype.pushTextureToGPU = function pushTextureToGPU(texture) {
    console.log('pushTextureToGPU'.concat(texture));
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
                console.log('Cartography3D: does not support this level');
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
                console.log('Cartography3D: does not support this level');
                break;
        }
    }
};

dalleClasse.prototype.computeUrlLoBLevelSAVE = function computeUrlLoBLevelSAVE() {
    if (this.textureType == '.dds') {
        switch (this.getLoDLevel()) {
            case 0:
                this.LOBLevel.urlDS3 = '../Bati3D_LOB/Version4LODS/'.concat(this.path, 'ZoneAExporter.3DS');
                this.LOBLevel.urlDDS = this.textureType;
                break;
            case 2:
                this.LOBLevel.urlDS3 = '../Bati3D_LOB/Version4LODS/'.concat(this.path, 'ZoneAExporter-0.b3d');
                this.LOBLevel.urlDDS = this.textureType;
                this.LOBLevel.urlDDS16 = '-16'.concat(this.textureType);
                break;
            case 4:
                this.LOBLevel.urlDS3 = '../Bati3D_LOB/Version4LODS/'.concat(this.path, 'ZoneAExporter-1.b3d');
                this.LOBLevel.urlDDS = '-4'.concat(this.textureType);
                this.LOBLevel.urlDDS16 = '-16'.concat(this.textureType);
                break;
            case 8:
                this.LOBLevel.urlDS3 = '../Bati3D_LOB/Version4LODS/'.concat(this.path, 'ZoneAExporter-2.b3d');
                this.LOBLevel.urlDDS = '-8'.concat(this.textureType);
                this.LOBLevel.urlDDS16 = '-16'.concat(this.textureType);
                break;
            case 16:
                this.LOBLevel.urlDS3 = '../Bati3D_LOB/Version4LODS/'.concat(this.path, 'ZoneAExporter-3.b3d');// 'images/Bati3D/' + this.path + 'ZoneAExporter-3.b3d';
                this.LOBLevel.urlDDS = '-16'.concat(this.textureType);
                this.LOBLevel.urlDDS16 = '-16'.concat(this.textureType);
                break;
            default:
                console.log('Cartography3D: does not support this level');
                break;
        }
    } else {
        switch (this.getLoDLevel()) {
            case 0:
                this.LOBLevel.urlDS3 = '../Bati3D_LOB/Version4LODS/'.concat(this.path, 'ZoneAExporter.3DS');
                this.LOBLevel.urlDDS = this.textureType;
                break;
            case 2:
                this.LOBLevel.urlDS3 = '../Bati3D_LOB/Version4LODS/'.concat(this.path, 'ZoneAExporter-0.b3d');
                this.LOBLevel.urlDDS = this.textureType;
                this.LOBLevel.urlDDS16 = this.textureType;
                break;
            case 4:
                this.LOBLevel.urlDS3 = '../Bati3D_LOB/Version4LODS/'.concat(this.path, 'ZoneAExporter-1.b3d');
                this.LOBLevel.urlDDS = this.textureType;
                this.LOBLevel.urlDDS16 = this.textureType;
                break;
            case 8:
                this.LOBLevel.urlDS3 = '../Bati3D_LOB/Version4LODS/'.concat(this.path, 'ZoneAExporter-2.b3d');
                this.LOBLevel.urlDDS = this.textureType;
                this.LOBLevel.urlDDS16 = this.textureType;
                break;
            case 16:
                this.LOBLevel.urlDS3 = '../Bati3D_LOB/Version4LODS/'.concat(this.path, 'ZoneAExporter-3.b3d');// 'images/Bati3D/' + this.path + 'ZoneAExporter-3.b3d';
                this.LOBLevel.urlDDS = this.textureType;
                this.LOBLevel.urlDDS16 = this.textureType;
                break;
            default:
                console.log('Cartography3D: does not support this level');
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
};
dalleClasse.prototype.setVisible = function setVisible(v) {
    this.globalObject.traverse((object) => { object.visible = v; });
    console.log('Bati3D visibility is ', v);
};

dalleClasse.prototype.setOpacity = function setOpacity(v) {
    this.globalObject.traverse((object) => { if (object.material) object.material.uniforms.alpha.value = v; });
    // console.log('Bati3D opacity is ',v);
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

dalleClasse.prototype.parseDallePivot = function parseDallePivot() {
    var xp = -this.pivot.x;
    var yp = -this.pivot.y;
    var zp = -this.pivot.z;
    this.geometry.applyMatrix(new THREE.Matrix4().makeTranslation(xp, yp, zp));
};

dalleClasse.prototype.parseB3DGeometry = function parseB3DGeometry(instantB3D) {
    var self = this;
    var obj = instantB3D._cur_obj;
    if (obj.uvs !== undefined) {
        var geometry = new THREE.Geometry();
        // add vertices and faces
        geometry.vertices = obj.verts;
        geometry.faces = obj.indices;    // face index
        // load texture one time at begining
        var materialName;
        if (self.isMaterialsLoaded()) {
            var mat = null;
            for (materialName in instantB3D._materials) {
                if (Object.prototype.hasOwnProperty.call(instantB3D._materials, materialName)) {
                    mat = instantB3D._materials[materialName];
                    if (mat.colorMap) {
                        self.addDalleMaterials(new THREE.MeshBasicMaterial({ color: 0xff0000, wireframe: true }));
                        self.addMaterialsName(materialName);
                    }
                }
            }
            self.setMaterialsLoaded(false);
        }
        // add uv texture if exist
        for (var i = 0; i < obj.uvsIndexes.length; i++) {
            geometry.faceVertexUvs[0].push([
                obj.uvs[obj.uvsIndexes[i].x],
                obj.uvs[obj.uvsIndexes[i].y],
                obj.uvs[obj.uvsIndexes[i].z],
            ]);
        }
        var materialFaces = obj.materialFaces;
        for (materialName in materialFaces) {
            if (Object.prototype.hasOwnProperty.call(materialFaces, materialName)) {
                var ind = self.getIndexMaterialName(materialName);
                for (var j = 0; j < geometry.faces.length; j++) {
                    geometry.faces[j].materialIndex = ind;
                }
            }
        }
        self.mergeGeometry(geometry);
    }
};

export default dalleClasse;
