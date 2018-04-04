import * as THREE from 'three';
import Earcut from 'earcut';

function getAltitude(options, properties, contour) {
    if (options.altitude) {
        if (typeof options.altitude === 'function') {
            return options.altitude(properties, contour);
        } else {
            return options.altitude;
        }
    }
    return 0;
}

function getExtrude(options, properties) {
    if (options.extrude) {
        if (typeof options.extrude === 'function') {
            return options.extrude(properties);
        } else {
            return options.extrude;
        }
    }
    return 0;
}

function randomColor() {
    const randomColor = new THREE.Color();
    randomColor.setHex(Math.random() * 0xffffff);
    return randomColor;
}

function getColor(options, properties) {
    if (options.color) {
        if (typeof options.color === 'function') {
            return options.color(properties);
        } else {
            return options.color;
        }
    }
    return randomColor();
}

function fillColorArray(colors, offset, length, r, g, b) {
    const len = offset + length;
    for (let i = offset; i < len; ++i) {
        colors[3 * i] = r;
        colors[3 * i + 1] = g;
        colors[3 * i + 2] = b;
    }
}

/*
 * Convert coordinates to vertices positionned at a given altitude
 *
 * @param  {Coordinate[]} contour - Coordinates of a feature
 * @param  {number | number[] } altitude - Altitude of the feature
 * @return {Vector3[]} vertices
 */
const vec = new THREE.Vector3();
function coordinatesToVertices(contour, altitude, target, offset) {
    let i = 0;
    // loop over contour coodinates
    for (const coordinate of contour) {
        // convert coordinate to position
        coordinate.xyz(vec);
        // get the normal vector.
        const normal = coordinate.geodesicNormal;
        // get altitude from array or constant
        const alti = Array.isArray(altitude) ? altitude[i++] : altitude;
        // move the vertex following the normal, to put the point on the good altitude
        vec.addScaledVector(normal, alti);
        // fill the vertices array at the offset position
        vec.toArray(target, offset);
        // increment the offset
        offset += 3;
    }
}

const vecTop = new THREE.Vector3();
const vecBottom = new THREE.Vector3();
function coordinatesToExtrudedVertices(contour, top, bottom, target, offset) {
    // loop over contour coodinates
    const slgt = contour.length * 3;
    for (const coordinate of contour) {
        // convert coordinate to position
        coordinate.xyz(vecTop);
        vecBottom.copy(vecTop);
        // move the vertex following the normal, to put the point on the good altitude
        vecTop.addScaledVector(coordinate.geodesicNormal, top);
        vecBottom.addScaledVector(coordinate.geodesicNormal, bottom);
        // fill the vertices array at the offset position
        vecTop.toArray(target, offset);
        vecBottom.toArray(target, slgt + offset);
        // increment the offset
        offset += 3;
    }
}


/*
 * Helper function to extract, for a given feature id, the feature contour coordinates, and its properties.
 *
 * param  {structure with coordinate[] and featureVertices[]} coordinates - representation of the features
 * param  {properties[]} properties - properties of the features
 * param  {number} id - id of the feature
 * return {Coordinate[], propertie[] } {contour, properties}
 */
function extractFeature(coordinates, properties, id) {
    const featureVertices = coordinates.featureVertices[id];
    const contour = coordinates.coordinates.slice(featureVertices.offset, featureVertices.offset + featureVertices.count);
    const property = properties[id].properties;
    return { contour, property };
}

/*
 * Add indices for the side faces.
 * We loop over the contour and create a side face made of two triangles.
 *
 * For a contour made of (n) coordinates, there are (n*2) vertices.
 * The (n) first vertices are on the roof, the (n) other vertices are on the floor.
 *
 * If index (i) is on the roof, index (i+length) is on the floor.
 *
 * @param {number[]} indices - Indices of vertices
 * @param {number} length - length of the contour of the feature
 * @param {number} offset - index of the first vertice of this feature
 */
function addFaces(indices, length, offset) {
    // loop over contour length, and for each point of the contour,
    // add indices to make two triangle, that make the side face
    for (let i = offset; i < offset + length - 1; ++i) {
        // first triangle indices
        indices.push(i);
        indices.push(i + length);
        indices.push(i + 1);
        // second triangle indices
        indices.push(i + 1);
        indices.push(i + length);
        indices.push(i + length + 1);
    }
}

function coordinateToPoints(coordinates, properties, options) {
    const vertices = new Float32Array(3 * coordinates.coordinates.length);
    const colors = new Uint8Array(3 * coordinates.coordinates.length);
    const geometry = new THREE.BufferGeometry();
    let offset = 0;

    /* eslint-disable guard-for-in */
    for (const id in coordinates.featureVertices) {
        const { contour, property } = extractFeature(coordinates, properties, id);
        // get altitude from properties
        const altitude = getAltitude(options, property, contour);
        coordinatesToVertices(contour, altitude, vertices, offset * 3);

        // assign color to each point
        const color = getColor(options, property);
        fillColorArray(colors, offset, contour.length, color.r * 255, color.g * 255, color.b * 255);

        // increment offset
        offset += contour.length;
    }
    geometry.addAttribute('position', new THREE.BufferAttribute(vertices, 3));
    geometry.addAttribute('color', new THREE.BufferAttribute(colors, 3, true));
    return new THREE.Points(geometry);
}

function coordinateToLines(coordinates, properties, options) {
    const indices = [];
    const vertices = new Float32Array(3 * coordinates.coordinates.length);
    const colors = new Uint8Array(3 * coordinates.coordinates.length);
    const geometry = new THREE.BufferGeometry();
    let offset = 0;

    /* eslint-disable-next-line */
    for (const id in coordinates.featureVertices) {
        const { contour, property } = extractFeature(coordinates, properties, id);
        // get altitude from properties
        const altitude = getAltitude(options, property, contour);
        coordinatesToVertices(contour, altitude, vertices, offset * 3);

        // set indices
        const line = coordinates.featureVertices[id];
        // TODO optimize indices lines
        // is the same array each time
        for (let i = line.offset; i < line.offset + line.count - 1; ++i) {
            indices.push(i);
            indices.push(i + 1);
        }

        // assign color to each point
        const color = getColor(options, property);
        fillColorArray(colors, offset, contour.length, color.r * 255, color.g * 255, color.b * 255);

        // increment offset
        offset += contour.length;
    }

    geometry.addAttribute('position', new THREE.BufferAttribute(vertices, 3));
    geometry.addAttribute('color', new THREE.BufferAttribute(colors, 3, true));
    geometry.setIndex(new THREE.BufferAttribute(new Uint32Array(indices), 1));
    return new THREE.LineSegments(geometry);
}

function coordinateToPolygon(coordinates, properties, options) {
    const indices = [];
    const vertices = new Float32Array(3 * coordinates.coordinates.length);
    const colors = new Uint8Array(3 * coordinates.coordinates.length);
    const geometry = new THREE.BufferGeometry();
    let offset = 0;
    let minAltitude = Infinity;
    /* eslint-disable-next-line */
    for (const id in coordinates.featureVertices) {
        // extract contour coodinates and properties of one feature
        const { contour, property } = extractFeature(coordinates, properties, id);
        // get altitude and extrude amount from properties
        const altitudeBottom = getAltitude(options, property, contour);
        minAltitude = Math.min(minAltitude, altitudeBottom);
        const altitudeTopFace = altitudeBottom;
        // add vertices of the top face
        coordinatesToVertices(contour, altitudeTopFace, vertices, offset * 3);
        const verticesTopFace = vertices.slice(offset * 3, offset * 3 + contour.length * 3);
        // triangulate the top face
        const triangles = Earcut(verticesTopFace, null, 3);
        for (const indice of triangles) {
            indices.push(offset + indice);
        }
        // assign color to each point
        const color = getColor(options, property);
        fillColorArray(colors, offset, contour.length, color.r * 255, color.g * 255, color.b * 255);
        // increment offset
        offset += contour.length;
    }

    geometry.addAttribute('position', new THREE.BufferAttribute(vertices, 3));
    geometry.addAttribute('color', new THREE.BufferAttribute(colors, 3, true));
    geometry.setIndex(new THREE.BufferAttribute(new Uint16Array(indices), 1));
    return new THREE.Mesh(geometry);
}

function coordinateToPolygonExtruded(coordinates, properties, options) {
    const indices = [];
    const indicesRoof = [];
    const verticesRoof = new Float32Array(2 * 3 * coordinates.coordinates.length);
    const vertices = new Float32Array(2 * 3 * coordinates.coordinates.length);
    const colors = new Uint8Array(3 * 2 * coordinates.coordinates.length);
    const ids = new Uint16Array(2 * coordinates.coordinates.length);
    const zmins = new Uint16Array(2 * coordinates.coordinates.length);
    const geometryWall = new THREE.BufferGeometry();
    const geometryRoof = new THREE.BufferGeometry();
    let offset = 0;
    let offset2 = 0;
    let nbVertices = 0;
    let minAltitude = Infinity;
    var pos = [];
    /* eslint-disable-next-line */
    for (const id in coordinates.featureVertices) {
        // extract contour coodinates and properties of one feature
        const { contour, property } = extractFeature(coordinates, properties, id);
        // get altitude and extrude amount from properties
        const altitudeBottom = getAltitude(options, property, contour);
        minAltitude = Math.min(minAltitude, altitudeBottom);
        const extrudeAmount = getExtrude(options, property);
        // altitudeTopFace is the altitude of the visible top face.
        const altitudeTopFace = altitudeBottom + extrudeAmount;
        // add vertices of the top face
        coordinatesToExtrudedVertices(contour, altitudeTopFace, altitudeBottom, vertices, offset2);
        // triangulate the top face
        nbVertices = contour.length * 3;
        const verticesTopFace = vertices.slice(offset2, offset2 + nbVertices);
        const triangles = Earcut(verticesTopFace, null, 3);
        for (const indice of triangles) {
            verticesRoof[(offset + indice) * 3] = vertices[(offset + indice) * 3];
            verticesRoof[(offset + indice) * 3 + 1] = vertices[(offset + indice) * 3 + 1];
            verticesRoof[(offset + indice) * 3 + 2] = vertices[(offset + indice) * 3 + 2];
            indicesRoof.push(offset + indice);
        }
        const ofid = Math.floor(offset2 / 3);
        for (let i = ofid; i < contour.length + ofid; ++i) {
            ids[i] = property._idx;
            zmins[i] = property.z_min;
            pos[i] = contour[i - ofid];
        }
        offset2 += nbVertices * 2;
        addFaces(indices, contour.length, offset);
        // assign color to each point
        const color = getColor(options, property);
        fillColorArray(colors, offset, contour.length * 2, color.r * 255, color.g * 255, color.b * 255);
        offset += contour.length * 2;
    }
    // wall
    geometryWall.addAttribute('position', new THREE.BufferAttribute(vertices, 3));
    geometryWall.addAttribute('color', new THREE.BufferAttribute(colors, 3, true));
    geometryWall.addAttribute('id', new THREE.BufferAttribute(ids, 1));
    geometryWall.addAttribute('zmin', new THREE.BufferAttribute(zmins, 1));
    geometryWall.setIndex(new THREE.BufferAttribute(new Uint16Array(indices), 1));
    const resultWall = new THREE.Mesh(geometryWall);
    resultWall.name = 'wall_faces';
    resultWall.minAltitude = minAltitude;
    resultWall.pos = pos;
    // roof
    geometryRoof.addAttribute('position', new THREE.BufferAttribute(new Float32Array(verticesRoof), 3));
    geometryRoof.addAttribute('color', new THREE.BufferAttribute(colors, 3, true));
    geometryRoof.addAttribute('id', new THREE.BufferAttribute(ids, 1));
    geometryRoof.addAttribute('zmin', new THREE.BufferAttribute(zmins, 1));
    geometryRoof.setIndex(new THREE.BufferAttribute(new Uint16Array(indicesRoof), 1));
    const resultRoof = new THREE.Mesh(geometryRoof);
    resultRoof.name = 'roof_faces';
    resultRoof.minAltitude = minAltitude;
    resultRoof.pos = pos;
    // wall edges
    var edges = new THREE.EdgesGeometry(geometryWall);
    var lineWall = new THREE.LineSegments(edges, new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true }));
    lineWall.name = 'wall_edges';
    edges = new THREE.EdgesGeometry(geometryRoof);
    var lineRoof = new THREE.LineSegments(edges, new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true }));
    lineWall.name = 'roof_edges';
    return [resultWall, resultRoof, lineWall, lineRoof];
}

/*
 * Convert all feature coordinates in one mesh.
 *
 * Read the altitude of each feature in the properties of the feature, using the function given in the param style : style.altitude(properties).
 * For polygon, read extrude amout using the function given in the param style.extrude(properties).
 *
 * param  {structure with coordinate[] and featureVertices[]} coordinates - representation of all the features
 * param  {properties[]} properties - properties of all the features
 * param  {callbacks} callbacks defines functions to read altitude and extrude amout from feature properties
 * return {THREE.Mesh} mesh
 */
function coordinatesToMesh(coordinates, properties, options) {
    if (!coordinates) {
        return;
    }
    var mesh;
    var meshes;
    switch (coordinates.type) {
        case 'point': {
            mesh = coordinateToPoints(coordinates, properties, options);
            break;
        }
        case 'linestring': {
            mesh = coordinateToLines(coordinates, properties, options);
            break;
        }
        case 'polygon': {
            if (options.extrude) {
                meshes = coordinateToPolygonExtruded(coordinates, properties, options);
                meshes[0].material.vertexColors = THREE.VertexColors;
                meshes[0].material.color = new THREE.Color(0xffffff);
                meshes[1].material.vertexColors = THREE.VertexColors;
                meshes[1].material.color = new THREE.Color(0xffffff);
                return meshes;
            }
            else {
                mesh = coordinateToPolygon(coordinates, properties, options);
            }
            break;
        }
        default:
    }

    // set mesh material
    mesh.material.vertexColors = THREE.VertexColors;
    mesh.material.color = new THREE.Color(0xffffff);
    return mesh;
}

function featureToThree(feature, options) {
    const mesh = coordinatesToMesh(feature.geometry, feature.properties, options);
    mesh.properties = feature.properties;
    return mesh;
}

function featureCollectionToThree(featureCollection, options) {
    const group = new THREE.Group();
    group.minAltitude = Infinity;
    for (const geometry of featureCollection.geometries) {
        const properties = featureCollection.features;
        const mesh = coordinatesToMesh(geometry, properties, options);
        if (mesh instanceof THREE.Mesh) {
            group.add(mesh);
        } else if (mesh.length > 0) {
            for (var i = 0; i < mesh.length; i++) {
                group.add(mesh[i]);
            }
        }
        group.name = 'bdTopo';
        group.minAltitude = Math.min(mesh.minAltitude, group.minAltitude);
    }
    group.features = featureCollection.features;
    return group;
}

export default {

    convert(options = {}) {
        return function _convert(feature) {
            if (!feature) return;
            if (feature.geometries) {
                return featureCollectionToThree(feature, options);
            } else {
                return featureToThree(feature, options);
            }
        };
    },
};
