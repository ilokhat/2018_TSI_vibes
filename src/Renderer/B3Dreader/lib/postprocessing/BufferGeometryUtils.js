import * as THREE from 'three';
import proj4 from 'proj4';
import Coordinates from '../../../../Core/Geographic/Coordinates';

const BufferGeometryUtils = {

    fromGeometry: function geometryToBufferGeometry(geometry, settings) {
        proj4.defs('EPSG:2154', '+proj=lcc +lat_1=49 +lat_2=44 +lat_0=46.5 +lon_0=3 +x_0=700000 +y_0=6600000 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs');
        if (geometry instanceof THREE.BufferGeometry) {
            return geometry;
        }
        settings = settings || { vertexColors: THREE.NoColors };
        var vertices = geometry.vertices;
        var faces = geometry.faces;
        var faceVertexUvs = geometry.faceVertexUvs;
        var vertexColors = settings.vertexColors;
        var hasFaceVertexUv = faceVertexUvs[0].length > 0;
        var bufferGeometry = new THREE.BufferGeometry();
        var positions = new Float32Array(faces.length * 3 * 3);
        var materialindice = new Float32Array(faces.length * 3);
        var colors;
        var uvs;
        if (vertexColors !== THREE.NoColors) colors = new Float32Array(faces.length * 3 * 3);
        if (hasFaceVertexUv === true) uvs = new Float32Array(faces.length * 3 * 2);
        var i2 = 0;
        var i3 = 0;
        for (var i = 0; i < faces.length; i++) {
            var face = faces[i];
            var materialIndiceCurrent = face.materialIndex;
            var matIndiceNormalized = materialIndiceCurrent - settings.indice;
            materialindice[i * 3] = matIndiceNormalized;
            materialindice[i * 3 + 1] = matIndiceNormalized;
            materialindice[i * 3 + 2] = matIndiceNormalized;
            var a = vertices[face.a];
            var b = vertices[face.b];
            var c = vertices[face.c];
            var coords = new Coordinates('EPSG:2154', a.x, a.y, a.z);
            var coordsA = coords.as('EPSG:4978');
            coords = new Coordinates('EPSG:2154', b.x, b.y, b.z);
            var coordsB = coords.as('EPSG:4978');
            coords = new Coordinates('EPSG:2154', c.x, c.y, c.z);
            var coordsC = coords.as('EPSG:4978');
            positions[i3] = coordsA.x();
            positions[i3 + 1] = coordsA.y();
            positions[i3 + 2] = coordsA.z();
            positions[i3 + 3] = coordsB.x();
            positions[i3 + 4] = coordsB.y();
            positions[i3 + 5] = coordsB.z();
            positions[i3 + 6] = coordsC.x();
            positions[i3 + 7] = coordsC.y();
            positions[i3 + 8] = coordsC.z();
            if (vertexColors === THREE.FaceColors) {
                var fc = face.color;
                colors[i3] = fc.r;
                colors[i3 + 1] = fc.g;
                colors[i3 + 2] = fc.b;
                colors[i3 + 3] = fc.r;
                colors[i3 + 4] = fc.g;
                colors[i3 + 5] = fc.b;
                colors[i3 + 6] = fc.r;
                colors[i3 + 7] = fc.g;
                colors[i3 + 8] = fc.b;
            } else if (vertexColors === THREE.VertexColors) {
                var vca = face.vertexColors[0];
                var vcb = face.vertexColors[1];
                var vcc = face.vertexColors[2];
                colors[i3] = vca.r;
                colors[i3 + 1] = vca.g;
                colors[i3 + 2] = vca.b;
                colors[i3 + 3] = vcb.r;
                colors[i3 + 4] = vcb.g;
                colors[i3 + 5] = vcb.b;
                colors[i3 + 6] = vcc.r;
                colors[i3 + 7] = vcc.g;
                colors[i3 + 8] = vcc.b;
            }
            if (hasFaceVertexUv === true) {
                var uva = faceVertexUvs[0][i][0];
                var uvb = faceVertexUvs[0][i][1];
                var uvc = faceVertexUvs[0][i][2];
                uvs[i2] = uva.x;
                uvs[i2 + 1] = uva.y;
                uvs[i2 + 2] = uvb.x;
                uvs[i2 + 3] = uvb.y;
                uvs[i2 + 4] = uvc.x;
                uvs[i2 + 5] = uvc.y;
            }
            i3 += 9;
            i2 += 6;
        }
        bufferGeometry.addAttribute('position', new THREE.BufferAttribute(positions, 3));
        bufferGeometry.addAttribute('materialindice', new THREE.BufferAttribute(materialindice, 1));
        if (vertexColors !== THREE.NoColors) bufferGeometry.addAttribute('color', new THREE.BufferAttribute(colors, 3));
        if (hasFaceVertexUv === true) bufferGeometry.addAttribute('uv', new THREE.BufferAttribute(uvs, 2));
        bufferGeometry.computeBoundingSphere();
        return bufferGeometry;
    },
};

export default BufferGeometryUtils;
