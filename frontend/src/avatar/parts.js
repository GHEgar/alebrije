import {
    BufferAttribute, CapsuleGeometry, Color, CylinderGeometry, Euler, Matrix4, Quaternion,
    SphereGeometry, Vector3,
} from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { boneIndex } from './skeleton.js';

export const makePart = (geometry, { color, bone, at = [0, 0, 0], scale = [1, 1, 1], rotation = [0, 0, 0] }) => {
    const matrix = new Matrix4().compose(
        new Vector3(...at),
        new Quaternion().setFromEuler(new Euler(...rotation)),
        new Vector3(...scale),
    );
    geometry.applyMatrix4(matrix);
    geometry.deleteAttribute('uv');
    const count = geometry.attributes.position.count;
    const tint = new Color(color);
    const colors = new Float32Array(count * 3);
    const indices = new Uint16Array(count * 4);
    const weights = new Float32Array(count * 4);
    const index = boneIndex(bone);
    for (let i = 0; i < count; i += 1) {
        colors.set([tint.r, tint.g, tint.b], i * 3);
        indices[i * 4] = index;
        weights[i * 4] = 1;
    }
    geometry.setAttribute('color', new BufferAttribute(colors, 3));
    geometry.setAttribute('skinIndex', new BufferAttribute(indices, 4));
    geometry.setAttribute('skinWeight', new BufferAttribute(weights, 4));
    return geometry;
};

export const mergeParts = (parts) => {
    const merged = mergeGeometries(parts, false);
    parts.forEach((part) => part.dispose());
    return merged;
};

export const limb = (radius, top, length, x, options) => {
    const body = Math.max(length - radius, 0.01);
    return makePart(new CapsuleGeometry(radius, body, 2, 8), {
        ...options,
        at: [x, top - length / 2, options.z ?? 0],
    });
};

export const ball = (radius, options, widthSegments = 10, heightSegments = 8) => (
    makePart(new SphereGeometry(radius, widthSegments, heightSegments), options)
);

export const dome = (radius, coverage, options) => (
    makePart(new SphereGeometry(radius, 12, 6, 0, Math.PI * 2, 0, Math.PI * coverage), options)
);

export const tube = (radiusTop, radiusBottom, height, options, segments = 8) => (
    makePart(new CylinderGeometry(radiusTop, radiusBottom, height, segments), options)
);
