import * as THREE from 'three';

const BufferGeometryUtils = {
    fromGeometry: function geometryToBufferGeometry(geometry, settings) {
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
            positions[i3] = a.x;
            positions[i3 + 1] = a.y;
            positions[i3 + 2] = a.z;
            positions[i3 + 3] = b.x;
            positions[i3 + 4] = b.y;
            positions[i3 + 5] = b.z;
            positions[i3 + 6] = c.x;
            positions[i3 + 7] = c.y;
            positions[i3 + 8] = c.z;
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
