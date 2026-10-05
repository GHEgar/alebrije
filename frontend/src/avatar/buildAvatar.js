import { Group, MeshStandardMaterial, SkinnedMesh } from 'three';
import { buildBodyParts } from './body.js';
import { buildClips } from './animations.js';
import { buildHeadParts } from './head.js';
import { mergeParts } from './parts.js';
import { computeProportions } from './proportions.js';
import { normalizeAvatar } from './schema.js';
import { buildSkeleton } from './skeleton.js';

const buildSkeletonIn = (group, p) => {
    const result = buildSkeleton(p);
    group.add(result.root);
    group.updateMatrixWorld(true);
    result.skeleton.calculateInverses();
    return result;
};

export const buildAvatar = (definition) => {
    const def = normalizeAvatar(definition);
    const p = computeProportions(def);
    const group = new Group();
    group.name = 'alebrije';
    const { skeleton } = buildSkeletonIn(group, p);
    const geometry = mergeParts([...buildBodyParts(def, p), ...buildHeadParts(def, p)]);
    const material = new MeshStandardMaterial({ vertexColors: true, roughness: 0.85, metalness: 0 });
    material.name = 'avatar';
    const mesh = new SkinnedMesh(geometry, material);
    mesh.name = 'avatarMesh';
    group.add(mesh);
    group.updateMatrixWorld(true);
    mesh.bind(skeleton);
    group.animations = buildClips(p);
    group.userData.alebrije = def;
    return group;
};

export const disposeAvatar = (group) => {
    group.traverse((object) => {
        if (object.isMesh) {
            object.geometry.dispose();
            object.material.dispose();
        }
    });
};
