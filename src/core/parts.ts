import {
    BufferAttribute, BufferGeometry, CapsuleGeometry, Color, CylinderGeometry, Euler, Matrix4, Quaternion,
    SphereGeometry, Vector3,
} from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { boneIndex, type BoneName } from './skeleton.js';

export type Vec3 = [number, number, number];

export interface PartOptions {
    color: string;
    bone: BoneName;
    at?: Vec3;
    scale?: Vec3;
    rotation?: Vec3;
}

export const makePart = (geometry: BufferGeometry, { color, bone, at = [0, 0, 0], scale = [1, 1, 1], rotation = [0, 0, 0] }: PartOptions): BufferGeometry => {
    const matrix = new Matrix4().compose(
        new Vector3(...at),
        new Quaternion().setFromEuler(new Euler(...rotation)),
        new Vector3(...scale),
    );
    geometry.applyMatrix4(matrix);
    geometry.deleteAttribute('uv');
    const count = geometry.attributes['position']?.count ?? 0;
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

export const mergeParts = (parts: BufferGeometry[]): BufferGeometry => {
    const merged = mergeGeometries(parts, false);
    parts.forEach((part) => part.dispose());
    if (!merged) throw new Error('alebrije: the avatar parts could not be merged');
    return merged;
};

export const limb = (radius: number, top: number, length: number, x: number, options: PartOptions): BufferGeometry => {
    const body = Math.max(length - radius, 0.01);
    return makePart(new CapsuleGeometry(radius, body, 2, 8), {
        ...options,
        at: [x, top - length / 2, 0],
    });
};

export const ball = (radius: number, options: PartOptions, widthSegments = 10, heightSegments = 8): BufferGeometry => (
    makePart(new SphereGeometry(radius, widthSegments, heightSegments), options)
);

export const dome = (radius: number, coverage: number, options: PartOptions): BufferGeometry => (
    makePart(new SphereGeometry(radius, 12, 6, 0, Math.PI * 2, 0, Math.PI * coverage), options)
);

export const tube = (radiusTop: number, radiusBottom: number, height: number, options: PartOptions, segments = 8): BufferGeometry => (
    makePart(new CylinderGeometry(radiusTop, radiusBottom, height, segments), options)
);
