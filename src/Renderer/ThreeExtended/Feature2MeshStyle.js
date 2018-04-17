/**
 * Generated On: april 2018
 * Class: Feature2MeshStyle
 * Description: Feature2Mesh adapted for the BDTopo
 * project VIBES
 * author: Adouni, Bouchaour, Grégoire, Mathelier, Nino, Ouhabi, Schlegel
 */

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

function coordinateToPolygonExtruded(coordinates, properties, options) {
    const indices = [];
    const indicesRoof = [];
    const verticesRoof = new Float32Array(2 * 3 * coordinates.coordinates.length);
    const vertices = new Float32Array(2 * 3 * coordinates.coordinates.length);
    const normalsRoof = new Float32Array(2 * 3 * coordinates.coordinates.length);
    const normals = new Float32Array(2 * 3 * coordinates.coordinates.length);
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
    // eslint-disable-next-line
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
        // make the roof vertices faces and 'normal'
        for (const indice of triangles) {
            verticesRoof[(offset + indice) * 3] = vertices[(offset + indice) * 3];
            verticesRoof[(offset + indice) * 3 + 1] = vertices[(offset + indice) * 3 + 1];
            verticesRoof[(offset + indice) * 3 + 2] = vertices[(offset + indice) * 3 + 2];
            normalsRoof[(offset + indice) * 3] = 0;
            normalsRoof[(offset + indice) * 3 + 1] = 0;
            normalsRoof[(offset + indice) * 3 + 2] = 1;
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
    // add wall 'normal'
    for (var i = 0; i < normals.length / 3; i++) {
        normals[i * 3 + 0] = 0;
        normals[i * 3 + 1] = 0;
        normals[i * 3 + 2] = 1;
    }
    // create wall faces
    geometryWall.addAttribute('position', new THREE.BufferAttribute(vertices, 3));
    geometryWall.addAttribute('normal', new THREE.BufferAttribute(normals, 3));
    geometryWall.addAttribute('id', new THREE.BufferAttribute(ids, 1));
    geometryWall.addAttribute('zmin', new THREE.BufferAttribute(zmins, 1));
    geometryWall.setIndex(new THREE.BufferAttribute(new Uint16Array(indices), 1));
    const resultWall = new THREE.Mesh(geometryWall);
    resultWall.name = 'wall_faces';
    resultWall.minAltitude = minAltitude;
    resultWall.pos = pos;
    // create roof faces
    geometryRoof.addAttribute('position', new THREE.BufferAttribute(new Float32Array(verticesRoof), 3));
    geometryRoof.addAttribute('normal', new THREE.BufferAttribute(normalsRoof, 3));
    geometryRoof.addAttribute('id', new THREE.BufferAttribute(ids, 1));
    geometryRoof.addAttribute('zmin', new THREE.BufferAttribute(zmins, 1));
    geometryRoof.setIndex(new THREE.BufferAttribute(new Uint16Array(indicesRoof), 1));
    const resultRoof = new THREE.Mesh(geometryRoof);
    resultRoof.name = 'roof_faces';
    resultRoof.minAltitude = minAltitude;
    resultRoof.pos = pos;
    // extract wall edges
    var edges = new THREE.EdgesGeometry(geometryWall);
    var lineWall = new THREE.LineSegments(edges, new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 1 }));
    lineWall.material.transparent = true;
    lineWall.material.needsUpdate = true;
    lineWall.name = 'wall_edges';
    // extract roof edges
    edges = new THREE.EdgesGeometry(geometryRoof);
    var lineRoof = new THREE.LineSegments(edges, new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 1 }));
    lineRoof.material.transparent = true;
    lineRoof.material.needsUpdate = true;
    lineRoof.name = 'roof_edges';
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
 * return {THREE.Mesh[]} [resultWall, resultRoof, lineWall, lineRoof]
 */
function coordinatesToMesh(coordinates, properties, options) {
    if (!coordinates) {
        return;
    }
    var meshes;
    if (coordinates.type == 'polygon' && options.extrude) {
        // create geometry (faces and edges)
        meshes = coordinateToPolygonExtruded(coordinates, properties, options);
        // meshes = [resultWall, resultRoof, lineWall, lineRoof]
        // apply material according to options style
        // add wall material
        meshes[0].material = new THREE.MeshPhongMaterial({
            side: THREE.DoubleSide,
            transparent: true,
            opacity: options.style.wall_faces.opacity,
            color: options.style.wall_faces.color,
            emissive: options.style.wall_faces.emissive,
            specular: options.style.wall_faces.specular,
            shininess: options.style.wall_faces.shininess,
        });
        meshes[0].material.needsUpdate = true;
        // add roof material
        meshes[1].material = new THREE.MeshPhongMaterial({
            side: THREE.DoubleSide,
            transparent: true,
            opacity: options.style.roof_faces.opacity,
            color: options.style.roof_faces.color,
            emissive: options.style.roof_faces.emissive,
            specular: options.style.roof_faces.specular,
            shininess: options.style.roof_faces.shininess,
        });
        meshes[1].material.needsUpdate = true;
        // add edges material
        if (options.style.edges.style === 'Continuous') {
            meshes[2].material = new THREE.LineBasicMaterial({
                color: options.style.edges.color,
                transparent: true,
                opacity: options.style.edges.opacity,
                linewidth: options.style.edges.width,
            });
        } else {
            meshes[2].computeLineDistances();
            meshes[2].material = new THREE.LineDashedMaterial({
                color: options.style.edges.color,
                transparent: true,
                opacity: options.style.edges.opacity,
                linewidth: options.style.edges.width,
                gapSize: options.style.edges.gapSize,
                dashSize: options.style.edges.dashSize,
            });
        }
        meshes[2].material.needsUpdate = true;
        if (options.style.edges.style === 'Continuous') {
            meshes[3].material = new THREE.LineBasicMaterial({
                color: options.style.edges.color,
                transparent: true,
                opacity: options.style.edges.opacity,
                linewidth: options.style.edges.width,
            });
        } else {
            meshes[3].computeLineDistances();
            meshes[3].material = new THREE.LineDashedMaterial({
                color: options.style.edges.color,
                transparent: true,
                opacity: options.style.edges.opacity,
                linewidth: options.style.edges.width,
                gapSize: options.style.edges.gapSize,
                dashSize: options.style.edges.dashSize,
            });
        }
        meshes[3].material.needsUpdate = true;
        return meshes;
    }
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
        group.minAltitude = Math.min(mesh.minAltitude, group.minAltitude);
    }
    group.name = 'bdTopo';
    group.features = featureCollection.features;
    return group;
}

export default {
    /** @module Feature2MeshStyle */
    /**
     * Return a function to convert BDTopo features to THREE.Group
     * @function convert
     * @param {Object} options options for the conversion
     * @example
     * var options = {
     *      altitude: ((properties) => return properties.z_min - properties.hauteur),
     *      extrude: ((properties) => return properties.hauteur),
     *      style: {
     *          wall_faces: {
     *              texture: null,
     *              opacity: 1,
     *              color: '#ffffff',
     *              emissive: '#ffffff',
     *              specular: '#ffffff',
     *              shininess: 30,
     *              textureRepetition: 1,
     *          },
     *          roof_faces: {
     *              texture: null,
     *              opacity: 1,
     *              color: '#ffffff',
     *              emissive: '#ffffff',
     *              specular: '#ffffff',
     *              shininess: 30,
     *              textureRepetition: 1,
     *          },
     *          edges: {
     *              color: '#ffffff',
     *              opacity: 1,
     *              width: 1,
     *              style: 'Continuous',
     *              gapSize: null,
     *              dashSize: null,
     *          },
     *      },
     * };
     * var functionConvert = Feature2MeshStyle.convert(options);
     * @returns {function} function to convert BDTopo features to THREE.Group
     */
    convert(options = {}) {
        if (!options.style) return;
        return function _convert(feature) {
            if (!feature) return;
            if (feature.geometries) {
                return featureCollectionToThree(feature, options);
            }
        };
    },
};
